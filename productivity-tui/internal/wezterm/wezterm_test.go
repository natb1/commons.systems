package wezterm

import (
	"reflect"
	"testing"
)

func TestParseTabIndex_SingleWindowMultipleTabs(t *testing.T) {
	input := []byte(`[
		{"window_id": 1, "tab_id": 10, "pane_id": 100},
		{"window_id": 1, "tab_id": 20, "pane_id": 200},
		{"window_id": 1, "tab_id": 30, "pane_id": 300}
	]`)
	want := map[string]int{"100": 1, "200": 2, "300": 3}
	got, err := parseTabIndex(input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

func TestParseTabIndex_TabsWithMultiplePanes(t *testing.T) {
	input := []byte(`[
		{"window_id": 1, "tab_id": 10, "pane_id": 100},
		{"window_id": 1, "tab_id": 10, "pane_id": 101},
		{"window_id": 1, "tab_id": 20, "pane_id": 200},
		{"window_id": 1, "tab_id": 20, "pane_id": 201}
	]`)
	want := map[string]int{"100": 1, "101": 1, "200": 2, "201": 2}
	got, err := parseTabIndex(input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

func TestParseTabIndex_MultipleWindows(t *testing.T) {
	input := []byte(`[
		{"window_id": 1, "tab_id": 10, "pane_id": 100},
		{"window_id": 1, "tab_id": 20, "pane_id": 200},
		{"window_id": 2, "tab_id": 30, "pane_id": 300},
		{"window_id": 2, "tab_id": 40, "pane_id": 400}
	]`)
	want := map[string]int{"100": 1, "200": 2, "300": 1, "400": 2}
	got, err := parseTabIndex(input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

func TestParseTabIndex_TabOrderByFirstAppearance(t *testing.T) {
	input := []byte(`[
		{"window_id": 1, "tab_id": 10, "pane_id": 100},
		{"window_id": 1, "tab_id": 20, "pane_id": 200},
		{"window_id": 1, "tab_id": 10, "pane_id": 101}
	]`)
	want := map[string]int{"100": 1, "200": 2, "101": 1}
	got, err := parseTabIndex(input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

func TestParseTabIndex_EmptyArray(t *testing.T) {
	got, err := parseTabIndex([]byte("[]"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got == nil {
		t.Fatal("expected non-nil map for empty array")
	}
	if len(got) != 0 {
		t.Errorf("expected empty map, got %v", got)
	}
}

func TestParseTabIndex_MalformedJSON(t *testing.T) {
	_, err := parseTabIndex([]byte("not json"))
	if err == nil {
		t.Fatal("expected error for malformed JSON")
	}
}
