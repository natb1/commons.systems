package app

import (
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"

	tea "github.com/charmbracelet/bubbletea"

	"github.com/natb1/commons.systems/productivity-tui/internal/ratelimits"
	"github.com/natb1/commons.systems/productivity-tui/internal/session"
)

// same sentinel as session_test.mismatchedStart; epoch zero will not match any real lstart
const mismatchedStart = "Thu Jan  1 00:00:00 1970"

func TestQuitKeyQ(t *testing.T) {
	m := New("/dev/null", "/dev/null")
	_, cmd := m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune("q")})
	if cmd == nil {
		t.Error("expected quit command for 'q' key")
	}
}

func TestQuitKeyCtrlC(t *testing.T) {
	m := New("/dev/null", "/dev/null")
	_, cmd := m.Update(tea.KeyMsg{Type: tea.KeyCtrlC})
	if cmd == nil {
		t.Error("expected quit command for ctrl+c")
	}
}

func TestInitialState(t *testing.T) {
	m := New("/dev/null", "/dev/null")
	if len(m.Sessions()) != 0 {
		t.Errorf("expected empty sessions, got %d", len(m.Sessions()))
	}
}

func TestWindowSizeUpdate(t *testing.T) {
	m := New("/dev/null", "/dev/null")
	updated, _ := m.Update(tea.WindowSizeMsg{Width: 80, Height: 24})
	model := updated.(Model)
	if model.width != 80 || model.height != 24 {
		t.Errorf("expected 80x24, got %dx%d", model.width, model.height)
	}
}

func TestSessionsMsg(t *testing.T) {
	m := New("/dev/null", "/dev/null")
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
	m := New("/dev/null", "/dev/null")
	m.width = 80
	m.height = 24
	m.sessions = map[string]session.Session{
		"sess_1": {WorkingDir: "/Users/n8/worktrees/active-branch", Idle: false},
		"sess_2": {WorkingDir: "/Users/n8/worktrees/idle-branch", Idle: true},
	}
	output := m.View()
	if !strings.Contains(output, "✳") {
		t.Error("expected idle indicator ✳ in output")
	}
	if !strings.Contains(output, "idle-branch") {
		t.Error("expected idle worktree name in output")
	}
	if !strings.Contains(output, "active-branch") {
		t.Error("expected active worktree name in output")
	}
	if strings.Contains(output, "/Users/n8/worktrees/") {
		t.Error("expected parent path to be stripped from output")
	}
}

func TestViewEdgeCasePaths(t *testing.T) {
	cases := []struct {
		name string
		path string
	}{
		{"root", "/"},
		{"single-component-no-slash", "foo"},
		{"single-component-with-slash", "/foo"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			m := New("/dev/null", "/dev/null")
			m.width = 80
			m.sessions = map[string]session.Session{
				"sess_1": {WorkingDir: tc.path, Idle: false},
			}
			output := m.View()
			if !strings.Contains(output, tc.path) {
				t.Errorf("expected full path %q in output, got: %s", tc.path, output)
			}
		})
	}
}

func TestViewEmptySessions(t *testing.T) {
	m := New("/dev/null", "/dev/null")
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

	m := New(path, "/dev/null")
	_, cmd := m.Update(tickMsg(time.Now()))
	if cmd == nil {
		t.Error("expected batch command from tick")
	}
}

// --- Rate-limits header tests ---

func TestViewRateLimitsHeader_BothWindows(t *testing.T) {
	m := New("/dev/null", "/dev/null")
	m.width = 80
	future := time.Now().Add(32 * time.Minute).Unix()
	m.rateLimits = ratelimits.RateLimits{
		FiveHour: &ratelimits.Window{UsedPercentage: 5, ResetsAt: future},
		SevenDay: &ratelimits.Window{UsedPercentage: 1, ResetsAt: future},
	}
	output := m.View()
	if !strings.Contains(output, "5h") {
		t.Error("expected '5h' label in output")
	}
	if !strings.Contains(output, "7d") {
		t.Error("expected '7d' label in output")
	}
	if !strings.Contains(output, "5%") {
		t.Error("expected '5%' in output")
	}
	if !strings.Contains(output, "resets in") {
		t.Error("expected 'resets in' countdown in output")
	}
}

func TestViewRateLimitsHeader_FiveHourOnly(t *testing.T) {
	m := New("/dev/null", "/dev/null")
	m.width = 80
	future := time.Now().Add(1 * time.Hour).Unix()
	m.rateLimits = ratelimits.RateLimits{
		FiveHour: &ratelimits.Window{UsedPercentage: 18, ResetsAt: future},
	}
	output := m.View()
	if !strings.Contains(output, "5h") {
		t.Error("expected '5h' label in output")
	}
	if strings.Contains(output, "7d") {
		t.Error("expected '7d' to be absent when SevenDay is nil")
	}
}

func TestViewRateLimitsHeader_OmittedWhenAbsent(t *testing.T) {
	m := New("/dev/null", "/dev/null")
	m.width = 80
	// Both windows nil (zero value) — header must be omitted.
	output := m.View()
	// Verify no header rows: neither label should appear.
	// Use a check that won't false-positive on countdown text (which uses 'h' and 'd').
	if strings.Contains(output, "  5h  ") {
		t.Error("expected no 5h row when FiveHour is nil")
	}
	if strings.Contains(output, "  7d  ") {
		t.Error("expected no 7d row when SevenDay is nil")
	}
}

func TestViewRateLimitsHeader_ResetsNow(t *testing.T) {
	m := New("/dev/null", "/dev/null")
	m.width = 80
	// Timestamp in the past → resets now.
	m.rateLimits = ratelimits.RateLimits{
		FiveHour: &ratelimits.Window{UsedPercentage: 50, ResetsAt: 1},
	}
	output := m.View()
	if !strings.Contains(output, "resets now") {
		t.Error("expected 'resets now' for past ResetsAt timestamp")
	}
}

func TestViewRateLimitsHeader_OmittedOnError(t *testing.T) {
	m := New("/dev/null", "/dev/null")
	m.width = 80
	m.rateLimitsErr = errors.New("boom")
	// Set windows too — they should be ignored when err is set.
	m.rateLimits = ratelimits.RateLimits{
		FiveHour: &ratelimits.Window{UsedPercentage: 50, ResetsAt: time.Now().Add(time.Hour).Unix()},
	}
	output := m.View()
	if strings.Contains(output, "  5h  ") {
		t.Error("expected header to be omitted when rateLimitsErr is set")
	}
}

func TestViewRateLimitsHeader_CountdownOnSecondLine(t *testing.T) {
	m := New("/dev/null", "/dev/null")
	m.width = 80
	future := time.Now().Add(32 * time.Minute).Unix()
	m.rateLimits = ratelimits.RateLimits{
		FiveHour: &ratelimits.Window{UsedPercentage: 18, ResetsAt: future},
	}
	output := m.View()
	lines := strings.Split(output, "\n")

	var labelIdx = -1
	for i, line := range lines {
		if strings.Contains(line, "5h") {
			labelIdx = i
			break
		}
	}
	if labelIdx == -1 {
		t.Fatal("expected a line containing '5h'")
	}
	if !strings.Contains(lines[labelIdx], "%") {
		t.Errorf("expected '%%' on the same line as '5h', got: %q", lines[labelIdx])
	}
	if strings.Contains(lines[labelIdx], "resets in") {
		t.Errorf("expected 'resets in' NOT on the bar line, got: %q", lines[labelIdx])
	}
	if labelIdx+1 >= len(lines) {
		t.Fatalf("expected a line after the bar line for the countdown")
	}
	if !strings.Contains(lines[labelIdx+1], "resets in") {
		t.Errorf("expected 'resets in' on the line after the bar, got: %q", lines[labelIdx+1])
	}
}

func TestLoadRateLimitsMissingFile(t *testing.T) {
	msg := loadRateLimits("/nonexistent/path/rate_limits.json")()
	rlMsg, ok := msg.(rateLimitsMsg)
	if !ok {
		t.Fatalf("expected rateLimitsMsg, got %T", msg)
	}
	if rlMsg.err != nil {
		t.Errorf("expected no error for missing file, got: %v", rlMsg.err)
	}
	if rlMsg.rl.FiveHour != nil || rlMsg.rl.SevenDay != nil {
		t.Error("expected zero-value RateLimits for missing file")
	}
}

func TestLoadRateLimitsMessageDispatch(t *testing.T) {
	m := New("/dev/null", "/dev/null")
	fiveHour := &ratelimits.Window{UsedPercentage: 42, ResetsAt: time.Now().Add(time.Hour).Unix()}
	updated, _ := m.Update(rateLimitsMsg{rl: ratelimits.RateLimits{FiveHour: fiveHour}})
	model := updated.(Model)
	rl := model.RateLimits()
	if rl.FiveHour == nil {
		t.Fatal("expected FiveHour to be set after rateLimitsMsg dispatch")
	}
	if rl.FiveHour.UsedPercentage != 42 {
		t.Errorf("expected UsedPercentage 42, got %d", rl.FiveHour.UsedPercentage)
	}
}
