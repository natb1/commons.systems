package session

import (
	"os"
	"path/filepath"
	"testing"
)

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
	dir := t.TempDir()

	alivePath := filepath.Join(dir, "alive.jsonl")
	aliveFile, err := os.OpenFile(alivePath, os.O_CREATE|os.O_RDWR, 0644)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { aliveFile.Close() })

	deadPath := filepath.Join(dir, "dead.jsonl")
	deadFile, err := os.OpenFile(deadPath, os.O_CREATE|os.O_RDWR, 0644)
	if err != nil {
		t.Fatal(err)
	}
	if err := deadFile.Close(); err != nil {
		t.Fatal(err)
	}

	sessions := map[string]Session{
		"alive":       {WorkingDir: "/tmp/a", TranscriptPath: alivePath},
		"dead":        {WorkingDir: "/tmp/b", TranscriptPath: deadPath},
		"pre_upgrade": {WorkingDir: "/tmp/c"},
	}

	got := FilterLive(sessions)

	if _, ok := got["alive"]; !ok {
		t.Error("expected alive session to be kept")
	}
	if _, ok := got["dead"]; ok {
		t.Error("expected dead session to be dropped")
	}
	if _, ok := got["pre_upgrade"]; !ok {
		t.Error("expected pre-upgrade session (empty TranscriptPath) to be kept")
	}
}
