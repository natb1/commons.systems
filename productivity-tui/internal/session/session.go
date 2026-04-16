package session

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

type Session struct {
	WorkingDir     string    `json:"working_dir"`
	TranscriptPath string    `json:"transcript_path,omitempty"`
	Idle           bool      `json:"idle"`
	LastActivity   time.Time `json:"last_activity"`
}

// FilterLive returns only sessions whose transcript file is still held open
// by some process. Sessions with an empty TranscriptPath are kept — records
// written before this field existed must not be mass-hidden on upgrade.
// Individual lsof errors (missing binary, permission denied) fail open:
// the liveness probe failing should not cause sessions to disappear.
func FilterLive(sessions map[string]Session) map[string]Session {
	live := make(map[string]Session, len(sessions))
	for id, s := range sessions {
		if s.TranscriptPath == "" || hasOpenHandle(s.TranscriptPath) {
			live[id] = s
		}
	}
	return live
}

func hasOpenHandle(path string) bool {
	out, err := exec.Command("lsof", "-t", path).Output()
	if err != nil {
		// lsof exits 1 when no process holds the file open — the normal "dead" signal.
		var ee *exec.ExitError
		if errors.As(err, &ee) && ee.ExitCode() == 1 {
			return false
		}
		return true
	}
	return len(bytes.TrimSpace(out)) > 0
}

// StateFilePath returns the path to the shared session state file.
// Shell hooks in productivity-tui/hooks/ hardcode the same path independently.
func StateFilePath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("cannot determine home directory: %w", err)
	}
	return filepath.Join(home, ".local", "share", "productivity-tui", "sessions.json"), nil
}

// ReadSessions reads the session state file at path. Returns an empty map
// if the file is missing or empty — this is the expected first-run state
// before any hook has created the file.
func ReadSessions(path string) (map[string]Session, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return map[string]Session{}, nil
		}
		return nil, fmt.Errorf("reading sessions file: %w", err)
	}
	if len(data) == 0 {
		return map[string]Session{}, nil
	}
	var sessions map[string]Session
	if err := json.Unmarshal(data, &sessions); err != nil {
		return nil, fmt.Errorf("parsing sessions file: %w", err)
	}
	return sessions, nil
}
