package app

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"

	tea "github.com/charmbracelet/bubbletea"

	"github.com/natb1/commons.systems/productivity-tui/internal/session"
)

// same sentinel as session_test.mismatchedStart; epoch zero will not match any real lstart
const mismatchedStart = "Thu Jan  1 00:00:00 1970"

func TestQuitKeyQ(t *testing.T) {
	m := New("/dev/null")
	_, cmd := m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune("q")})
	if cmd == nil {
		t.Error("expected quit command for 'q' key")
	}
}

func TestQuitKeyCtrlC(t *testing.T) {
	m := New("/dev/null")
	_, cmd := m.Update(tea.KeyMsg{Type: tea.KeyCtrlC})
	if cmd == nil {
		t.Error("expected quit command for ctrl+c")
	}
}

func TestInitialState(t *testing.T) {
	m := New("/dev/null")
	if len(m.Sessions()) != 0 {
		t.Errorf("expected empty sessions, got %d", len(m.Sessions()))
	}
}

func TestWindowSizeUpdate(t *testing.T) {
	m := New("/dev/null")
	updated, _ := m.Update(tea.WindowSizeMsg{Width: 80, Height: 24})
	model := updated.(Model)
	if model.width != 80 || model.height != 24 {
		t.Errorf("expected 80x24, got %dx%d", model.width, model.height)
	}
}

func TestSessionsMsg(t *testing.T) {
	m := New("/dev/null")
	sessions := map[string]session.Session{
		"sess_1": {WorkingDir: "/tmp/a", Idle: false, LastActivity: time.Now()},
		"sess_2": {WorkingDir: "/tmp/b", Idle: true, LastActivity: time.Now()},
	}
	updated, _ := m.Update(sessionsMsg{sessions: sessions})
	model := updated.(Model)
	if len(model.Sessions()) != 2 {
		t.Errorf("expected 2 sessions, got %d", len(model.Sessions()))
	}
}

func TestViewIdleIndicator(t *testing.T) {
	m := New("/dev/null")
	m.width = 80
	m.height = 24
	m.sessions = map[string]session.Session{
		"sess_1": {WorkingDir: "/tmp/active", Idle: false},
		"sess_2": {WorkingDir: "/tmp/idle", Idle: true},
	}
	output := m.View()
	if !strings.Contains(output, "✳") {
		t.Error("expected idle indicator ✳ in output")
	}
	if !strings.Contains(output, "/tmp/idle") {
		t.Error("expected idle session working dir in output")
	}
	if !strings.Contains(output, "/tmp/active") {
		t.Error("expected active session working dir in output")
	}
}

func TestViewEmptySessions(t *testing.T) {
	m := New("/dev/null")
	m.width = 80
	output := m.View()
	if !strings.Contains(output, "No active sessions") {
		t.Error("expected 'No active sessions' message")
	}
}

func TestLoadSessionsFiltersDead(t *testing.T) {
	if _, err := exec.LookPath("ps"); err != nil {
		t.Skip("ps not available")
	}

	selfPID := os.Getpid()
	selfStart, err := psLStartOf(selfPID)
	if err != nil {
		t.Fatalf("reading own start-time: %v", err)
	}

	cmd := exec.Command("sh", "-c", "exit 0")
	if err := cmd.Run(); err != nil {
		t.Fatalf("spawning dead process: %v", err)
	}
	deadPID := cmd.Process.Pid

	dir := t.TempDir()
	path := filepath.Join(dir, "sessions.json")
	data := fmt.Sprintf(`{
		"live": {"working_dir": "/tmp/a", "pid": %d, "pid_start": %q, "idle": false, "last_activity": "2026-04-16T10:00:00Z"},
		"dead": {"working_dir": "/tmp/b", "pid": %d, "pid_start": %q, "idle": false, "last_activity": "2026-04-16T10:00:00Z"}
	}`, selfPID, selfStart, deadPID, mismatchedStart)
	if err := os.WriteFile(path, []byte(data), 0644); err != nil {
		t.Fatal(err)
	}

	msg := loadSessions(path)()
	sm, ok := msg.(sessionsMsg)
	if !ok {
		t.Fatalf("expected sessionsMsg, got %T", msg)
	}
	if sm.err != nil {
		t.Fatalf("unexpected error: %v", sm.err)
	}
	if _, ok := sm.sessions["live"]; !ok {
		t.Error("expected live session to be kept")
	}
	if _, ok := sm.sessions["dead"]; ok {
		t.Error("expected dead session to be dropped")
	}
}

func psLStartOf(pid int) (string, error) {
	out, err := exec.Command("ps", "-o", "lstart=", "-p", strconv.Itoa(pid)).Output()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(out)), nil
}

func TestTickReloadsSessions(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "sessions.json")
	data := `{"sess_1": {"working_dir": "/tmp/a", "idle": false, "last_activity": "2026-04-07T10:00:00Z"}}`
	if err := os.WriteFile(path, []byte(data), 0644); err != nil {
		t.Fatal(err)
	}

	m := New(path)
	_, cmd := m.Update(tickMsg(time.Now()))
	if cmd == nil {
		t.Error("expected batch command from tick")
	}
}
