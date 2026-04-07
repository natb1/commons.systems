package session

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

type Session struct {
	WorkingDir   string    `json:"working_dir"`
	Idle         bool      `json:"idle"`
	LastActivity time.Time `json:"last_activity"`
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
