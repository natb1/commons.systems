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

func StateFilePath() string {
	home, err := os.UserHomeDir()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: cannot determine home directory: %v\n", err)
		os.Exit(1)
	}
	return filepath.Join(home, ".local", "share", "productivity-tui", "sessions.json")
}

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
