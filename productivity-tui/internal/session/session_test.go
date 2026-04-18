package session

import (
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

// arbitrary sentinel that will not match any real lstart; epoch zero is recognizable
const mismatchedStart = "Thu Jan  1 00:00:00 1970"

func TestReadSessions_ValidJSON(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "sessions.json")
	data := `{
		"sess_1": {"working_dir": "/tmp/project-a", "idle": false, "last_activity": "2026-04-07T10:00:00Z"},
		"sess_2": {"working_dir": "/tmp/project-b", "idle": true, "last_activity": "2026-04-07T09:00:00Z"}
	}`
	if err := os.WriteFile(path, []byte(data), 0644); err != nil {
		t.Fatal(err)
	}

	sessions, err := ReadSessions(path)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(sessions) != 2 {
		t.Fatalf("expected 2 sessions, got %d", len(sessions))
	}
	if sessions["sess_1"].Idle {
		t.Error("sess_1 should not be idle")
	}
	if !sessions["sess_2"].Idle {
		t.Error("sess_2 should be idle")
	}
	if sessions["sess_1"].WorkingDir != "/tmp/project-a" {
		t.Errorf("expected /tmp/project-a, got %s", sessions["sess_1"].WorkingDir)
	}
}

func TestReadSessions_MissingFile(t *testing.T) {
	sessions, err := ReadSessions("/nonexistent/path/sessions.json")
	if err != nil {
		t.Fatalf("unexpected error for missing file: %v", err)
	}
	if len(sessions) != 0 {
		t.Fatalf("expected empty map, got %d entries", len(sessions))
	}
}

func TestReadSessions_EmptyFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "sessions.json")
	if err := os.WriteFile(path, []byte(""), 0644); err != nil {
		t.Fatal(err)
	}

	sessions, err := ReadSessions(path)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(sessions) != 0 {
		t.Fatalf("expected empty map, got %d entries", len(sessions))
	}
}

func TestReadSessions_MalformedJSON(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "sessions.json")
	if err := os.WriteFile(path, []byte("{bad json"), 0644); err != nil {
		t.Fatal(err)
	}

	_, err := ReadSessions(path)
	if err == nil {
		t.Fatal("expected error for malformed JSON")
	}
}

func TestFilterLive(t *testing.T) {
	if _, err := exec.LookPath("ps"); err != nil {
		t.Skip("ps not available")
	}

	selfPID := os.Getpid()
	selfStart, err := psLStart(selfPID)
	if err != nil {
		t.Fatalf("reading own start-time: %v", err)
	}

	cmd := exec.Command("sh", "-c", "exit 0")
	if err := cmd.Run(); err != nil {
		t.Fatalf("spawning dead process: %v", err)
	}
	deadPID := cmd.Process.Pid

	sessions := map[string]Session{
		"live":             {WorkingDir: "/tmp/a", PID: selfPID, PIDStart: selfStart},
		"dead":             {WorkingDir: "/tmp/b", PID: deadPID, PIDStart: mismatchedStart},
		"recycled":         {WorkingDir: "/tmp/c", PID: selfPID, PIDStart: mismatchedStart},
		"pre_upgrade":      {WorkingDir: "/tmp/d"},
		"empty_start":      {WorkingDir: "/tmp/e", PID: selfPID, PIDStart: ""},
		"dead_empty_start": {WorkingDir: "/tmp/f", PID: deadPID, PIDStart: ""},
	}

	got := FilterLive(sessions)

	if _, ok := got["live"]; !ok {
		t.Error("expected live session to be kept")
	}
	if _, ok := got["dead"]; ok {
		t.Error("expected dead session to be dropped")
	}
	if _, ok := got["recycled"]; ok {
		t.Error("expected recycled session (PID-start mismatch) to be dropped")
	}
	if _, ok := got["pre_upgrade"]; !ok {
		t.Error("expected pre-upgrade session (PID == 0) to be kept (unknown-identity contract)")
	}
	if _, ok := got["empty_start"]; !ok {
		t.Error("expected empty-PIDStart session to be kept (unknown-identity contract)")
	}
	if _, ok := got["dead_empty_start"]; !ok {
		t.Error("expected dead-PID empty-PIDStart session to be kept (unknown-identity contract)")
	}
}

func TestFilterLiveEmptyAndNilInput(t *testing.T) {
	got := FilterLive(nil)
	if got == nil {
		t.Error("FilterLive(nil) returned nil; expected non-nil empty map")
	}
	if len(got) != 0 {
		t.Errorf("FilterLive(nil) returned %d entries; expected 0", len(got))
	}

	got = FilterLive(map[string]Session{})
	if got == nil {
		t.Error("FilterLive(empty) returned nil; expected non-nil empty map")
	}
	if len(got) != 0 {
		t.Errorf("FilterLive(empty) returned %d entries; expected 0", len(got))
	}
}

func psLStart(pid int) (string, error) {
	out, err := exec.Command("ps", "-o", "lstart=", "-p", strconv.Itoa(pid)).Output()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(out)), nil
}
