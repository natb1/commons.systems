package session

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"
)

type Session struct {
	WorkingDir string `json:"working_dir"`
	PID        int    `json:"pid,omitempty"`
	// PIDStart is the verbatim `ps -o lstart=` output recorded at session start.
	// Compared byte-for-byte to detect PID recycling. Opaque string — do not
	// reformat or parse (locale/format drift would silently break equality).
	PIDStart     string    `json:"pid_start,omitempty"`
	Idle         bool      `json:"idle"`
	LastActivity time.Time `json:"last_activity"`
}

// FilterLive returns only sessions whose recorded Claude CLI PID is still
// live (process exists and its start-time matches the recorded value).
//
// Sessions with PID == 0 represent records where the hook could not identify
// a Claude ancestor (including records written before this field existed).
// We keep them rather than drop them — dropping a legitimate unknown is
// worse than preserving a potentially stale row.
//
// Liveness probe errors fall into two categories:
//   - EPERM from kill(pid, 0) is a positive liveness signal: the process
//     exists but is owned by a different user. Treated as live.
//   - Genuine probe failures (ps unavailable, unexpected errno) fail open
//     to live: a broken probe must not cause live sessions to disappear.
func FilterLive(sessions map[string]Session) map[string]Session {
	live := make(map[string]Session, len(sessions))
	for id, s := range sessions {
		if s.PID == 0 || isPIDLive(s.PID, s.PIDStart) {
			live[id] = s
		}
	}
	return live
}

func isPIDLive(pid int, wantStart string) bool {
	if err := syscall.Kill(pid, 0); err != nil {
		if errors.Is(err, syscall.ESRCH) {
			return false
		}
		fmt.Fprintf(os.Stderr, "productivity-tui: kill(%d, 0) probe: %v (fail open)\n", pid, err)
		return true
	}
	out, err := exec.Command("ps", "-o", "lstart=", "-p", strconv.Itoa(pid)).Output()
	if err != nil {
		fmt.Fprintf(os.Stderr, "productivity-tui: ps(%d) probe: %v (fail open)\n", pid, err)
		return true
	}
	return strings.TrimSpace(string(out)) == wantStart
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
