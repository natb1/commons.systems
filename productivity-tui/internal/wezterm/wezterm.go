package wezterm

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"strconv"
)

type paneListEntry struct {
	WindowID int `json:"window_id"`
	TabID    int `json:"tab_id"`
	PaneID   int `json:"pane_id"`
}

// parseTabIndex parses the JSON output of `wezterm cli list --format json` and
// returns a map from pane ID string to 1-based tab index within its window.
func parseTabIndex(raw []byte) (map[string]int, error) {
	var entries []paneListEntry
	if err := json.Unmarshal(raw, &entries); err != nil {
		return nil, fmt.Errorf("parsing wezterm cli list output: %w", err)
	}

	// windowTabOrder maps window_id -> (tab_id -> 1-based index)
	windowTabOrder := make(map[int]map[int]int)
	// windowNextIdx maps window_id -> next index to assign
	windowNextIdx := make(map[int]int)

	result := make(map[string]int, len(entries))
	for _, e := range entries {
		tabOrder, ok := windowTabOrder[e.WindowID]
		if !ok {
			tabOrder = make(map[int]int)
			windowTabOrder[e.WindowID] = tabOrder
			windowNextIdx[e.WindowID] = 1
		}
		idx, ok := tabOrder[e.TabID]
		if !ok {
			idx = windowNextIdx[e.WindowID]
			tabOrder[e.TabID] = idx
			windowNextIdx[e.WindowID]++
		}
		result[strconv.Itoa(e.PaneID)] = idx
	}
	return result, nil
}

// QueryTabIndex runs `wezterm cli list --format json` and returns a map from
// pane ID string to 1-based tab index within its window. Returns an error if
// wezterm is not on PATH or the command fails; callers handle fail-open.
func QueryTabIndex() (map[string]int, error) {
	out, err := exec.Command("wezterm", "cli", "list", "--format", "json").Output()
	if err != nil {
		return nil, fmt.Errorf("wezterm cli list: %w", err)
	}
	return parseTabIndex(out)
}
