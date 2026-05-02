package wezterm

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

func DefaultPath() string {
	return filepath.Join(os.Getenv("HOME"), ".local/share/productivity-tui/wezterm-tabs.json")
}

// QueryTabIndex returns the pane->tab-index mapping written by the wezterm
// update-status hook. Returns (nil, nil) when the file is missing — this is
// the expected state before the hook has fired or when the user is not
// running wezterm. Mirrors the convention used by session.ReadSessions and
// ratelimits.ReadRateLimits.
func QueryTabIndex(path string) (map[string]int, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, nil
		}
		return nil, fmt.Errorf("reading wezterm tab-index file: %w", err)
	}
	var m map[string]int
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, fmt.Errorf("parsing wezterm tab-index file: %w", err)
	}
	return m, nil
}
