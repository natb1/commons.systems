package wezterm

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

func DefaultPath() string {
	return filepath.Join(os.Getenv("HOME"), ".local/share/productivity-tui/wezterm-tabs.json")
}

func QueryTabIndex(path string) (map[string]int, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading wezterm tab-index file: %w", err)
	}
	var m map[string]int
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, fmt.Errorf("parsing wezterm tab-index file: %w", err)
	}
	return m, nil
}
