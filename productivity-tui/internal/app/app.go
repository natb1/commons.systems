package app

import (
	"fmt"
	"sort"
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"

	"github.com/natb1/commons.systems/productivity-tui/internal/ratelimits"
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

	// labelStyle uses the same bold blue as titleStyle for rate-limit row labels.
	labelStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("12"))
)

const idleIndicator = "✳"

type tickMsg time.Time

type Model struct {
	sessions       map[string]session.Session
	stateFilePath  string
	width          int
	height         int
	err            error
	rateLimits     ratelimits.RateLimits
	rateLimitsPath string
	rateLimitsErr  error
}

func New(sessionsPath, rateLimitsPath string) Model {
	return Model{
		sessions:       map[string]session.Session{},
		stateFilePath:  sessionsPath,
		rateLimitsPath: rateLimitsPath,
	}
}

func (m Model) Init() tea.Cmd {
	return tea.Batch(tick(), loadSessions(m.stateFilePath), loadRateLimits(m.rateLimitsPath))
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
		return m, tea.Batch(tick(), loadSessions(m.stateFilePath), loadRateLimits(m.rateLimitsPath))
	case sessionsMsg:
		if msg.err != nil {
			m.err = msg.err
			m.sessions = map[string]session.Session{}
		} else {
			m.err = nil
			m.sessions = msg.sessions
		}
	case rateLimitsMsg:
		m.rateLimits = msg.rl
		m.rateLimitsErr = msg.err
	}
	return m, nil
}

func (m Model) View() string {
	var b strings.Builder

	// Render rate-limits header when data is available and no error occurred.
	if m.rateLimitsErr == nil && (m.rateLimits.FiveHour != nil || m.rateLimits.SevenDay != nil) {
		now := time.Now()
		if m.rateLimits.FiveHour != nil {
			b.WriteString(renderRateLimitRow("5h", m.rateLimits.FiveHour, now))
			b.WriteString("\n")
		}
		if m.rateLimits.SevenDay != nil {
			b.WriteString(renderRateLimitRow("7d", m.rateLimits.SevenDay, now))
			b.WriteString("\n")
		}
		b.WriteString("\n")
	}

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

// renderRateLimitRow renders a single rate-limit row:
//
//	  5h  ████▌                       18%  resets in 0h 32m
func renderRateLimitRow(label string, w *ratelimits.Window, now time.Time) string {
	pct := w.UsedPercentage
	if pct < 0 {
		pct = 0
	}
	if pct > 100 {
		pct = 100
	}

	// 28 cells wide bar; 2 half-cell units per cell → 56 units total.
	units := pct * 56 / 100
	full := units / 2
	half := units % 2

	filledStr := strings.Repeat("█", full)
	if half == 1 {
		filledStr += "▌"
	}
	// Pad to 28 visible cells (full blocks + optional half block already counted).
	emptyCount := 28 - full - half
	barStr := activeStyle.Render(filledStr) + strings.Repeat(" ", emptyCount)

	pctStr := fmt.Sprintf("%3d%%", w.UsedPercentage)

	countdown := formatCountdown(w.ResetIn(now))

	return fmt.Sprintf("  %s  %s  %s  %s",
		labelStyle.Render(label),
		barStr,
		pctStr,
		countdown,
	)
}

func formatCountdown(d time.Duration) string {
	if d <= 0 {
		return "resets now"
	}
	if d >= 24*time.Hour {
		days := int(d / (24 * time.Hour))
		hours := int((d % (24 * time.Hour)) / time.Hour)
		return fmt.Sprintf("resets in %dd %dh", days, hours)
	}
	hours := int(d / time.Hour)
	minutes := int((d % time.Hour) / time.Minute)
	return fmt.Sprintf("resets in %dh %dm", hours, minutes)
}

func (m Model) Sessions() map[string]session.Session {
	return m.sessions
}

func (m Model) Err() error {
	return m.err
}

func (m Model) RateLimits() ratelimits.RateLimits {
	return m.rateLimits
}

type sessionsMsg struct {
	sessions map[string]session.Session
	err      error
}

type rateLimitsMsg struct {
	rl  ratelimits.RateLimits
	err error
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

func loadRateLimits(path string) tea.Cmd {
	return func() tea.Msg {
		rl, err := ratelimits.ReadRateLimits(path)
		if err != nil {
			return rateLimitsMsg{err: err}
		}
		return rateLimitsMsg{rl: rl}
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
