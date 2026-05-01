package ratelimits

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

type Window struct {
	UsedPercentage int   `json:"used_percentage"`
	ResetsAt       int64 `json:"resets_at"` // unix seconds
}

type RateLimits struct {
	FiveHour *Window `json:"five_hour,omitempty"`
	SevenDay *Window `json:"seven_day,omitempty"`
}

// StateFilePath returns the path to the rate limits state file.
// Shell hooks in productivity-tui/hooks/ hardcode the same path independently.
func StateFilePath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("cannot determine home directory: %w", err)
	}
	return filepath.Join(home, ".local", "share", "productivity-tui", "rate_limits.json"), nil
}

// ReadRateLimits reads the rate limits state file at path. Returns a zero-value
// RateLimits if the file is missing or empty — this is the expected state before
// any hook has written the file or when rate limits are unavailable.
func ReadRateLimits(path string) (RateLimits, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return RateLimits{}, nil
		}
		return RateLimits{}, fmt.Errorf("reading rate limits file: %w", err)
	}
	if len(data) == 0 {
		return RateLimits{}, nil
	}
	var rl RateLimits
	if err := json.Unmarshal(data, &rl); err != nil {
		return RateLimits{}, fmt.Errorf("parsing rate limits file: %w", err)
	}
	return rl, nil
}

// ResetIn returns the duration until this window resets relative to now.
func (w *Window) ResetIn(now time.Time) time.Duration {
	return time.Unix(w.ResetsAt, 0).Sub(now)
}
