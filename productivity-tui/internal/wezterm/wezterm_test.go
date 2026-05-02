package wezterm

import (
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

func TestQueryTabIndex_ReadsJSON(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "wezterm-tabs.json")
	if err := os.WriteFile(path, []byte(`{"100": 1, "200": 2}`), 0644); err != nil {
		t.Fatal(err)
	}
	got, err := QueryTabIndex(path)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := map[string]int{"100": 1, "200": 2}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

func TestQueryTabIndex_MissingFile(t *testing.T) {
	_, err := QueryTabIndex(filepath.Join(t.TempDir(), "does-not-exist.json"))
	if err == nil {
		t.Fatal("expected error for missing file")
	}
}

func TestQueryTabIndex_MalformedJSON(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "wezterm-tabs.json")
	if err := os.WriteFile(path, []byte("not json"), 0644); err != nil {
		t.Fatal(err)
	}
	_, err := QueryTabIndex(path)
	if err == nil {
		t.Fatal("expected error for malformed JSON")
	}
}
