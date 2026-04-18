package app

import (
	"fmt"
	"sort"
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"

	"github.com/natb1/commons.systems/productivity-tui/internal/session"
)

var (
	titleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("12"))

	idleStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("8"))

	activeStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("15"))

	separatorStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("8"))
)

const idleIndicator = "✳"

type tickMsg time.Time

type Model struct {
	sessions      map[string]session.Session
	stateFilePath string
	width         int
	height        int
	err           error
}

func New(stateFilePath string) Model {
	return Model{
		sessions:      map[string]session.Session{},
		stateFilePath: stateFilePath,
	}
}

func (m Model) Init() tea.Cmd {
	return tea.Batch(tick(), loadSessions(m.stateFilePath))
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "ctrl+c":
			return m, tea.Quit
		}
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
	case tickMsg:
		return m, tea.Batch(tick(), loadSessions(m.stateFilePath))
	case sessionsMsg:
		if msg.err != nil {
			m.err = msg.err
			m.sessions = map[string]session.Session{}
		} else {
			m.err = nil
			m.sessions = msg.sessions
		}
	}
	return m, nil
}

func (m Model) View() string {
	var b strings.Builder

	b.WriteString(titleStyle.Render("Claude Sessions"))
	b.WriteString("\n")
	b.WriteString(separatorStyle.Render(strings.Repeat("─", min(40, m.width))))
	b.WriteString("\n")

	if m.err != nil {
		b.WriteString(fmt.Sprintf("Error: %v\n", m.err))
		return b.String()
	}

	if len(m.sessions) == 0 {
		b.WriteString(idleStyle.Render("No active sessions"))
		b.WriteString("\n")
		return b.String()
	}

	keys := sortedKeys(m.sessions)
	for _, id := range keys {
		s := m.sessions[id]
		if s.Idle {
			b.WriteString(idleStyle.Render(fmt.Sprintf(" %s %s", idleIndicator, s.WorkingDir)))
		} else {
			b.WriteString(activeStyle.Render(fmt.Sprintf("   %s", s.WorkingDir)))
		}
		b.WriteString("\n")
	}

	return b.String()
}

func (m Model) Sessions() map[string]session.Session {
	return m.sessions
}

func (m Model) Err() error {
	return m.err
}

type sessionsMsg struct {
	sessions map[string]session.Session
	err      error
}

func loadSessions(path string) tea.Cmd {
	return func() tea.Msg {
		sessions, err := session.ReadSessions(path)
		if err != nil {
			return sessionsMsg{err: err}
		}
		return sessionsMsg{sessions: session.FilterLive(sessions)}
	}
}

func tick() tea.Cmd {
	return tea.Tick(time.Second, func(t time.Time) tea.Msg {
		return tickMsg(t)
	})
}

func sortedKeys(m map[string]session.Session) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}
