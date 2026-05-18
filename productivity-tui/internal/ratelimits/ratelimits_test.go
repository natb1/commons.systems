package ratelimits

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestReadRateLimits_FullData(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "rate_limits.json")
	data := `{"five_hour": {"used_percentage": 5, "resets_at": 1746140400}, "seven_day": {"used_percentage": 1, "resets_at": 1746406800}}`
	if err := os.WriteFile(path, []byte(data), 0644); err != nil {
		t.Fatal(err)
	}

	rl, err := ReadRateLimits(path)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rl.FiveHour == nil {
		t.Fatal("expected FiveHour to be non-nil")
	}
	if rl.SevenDay == nil {
		t.Fatal("expected SevenDay to be non-nil")
	}
	if rl.FiveHour.UsedPercentage != 5 {
		t.Errorf("expected FiveHour.UsedPercentage 5, got %d", rl.FiveHour.UsedPercentage)
	}
	if rl.FiveHour.ResetsAt != 1746140400 {
		t.Errorf("expected FiveHour.ResetsAt 1746140400, got %d", rl.FiveHour.ResetsAt)
	}
	if rl.SevenDay.UsedPercentage != 1 {
		t.Errorf("expected SevenDay.UsedPercentage 1, got %d", rl.SevenDay.UsedPercentage)
	}
	if rl.SevenDay.ResetsAt != 1746406800 {
		t.Errorf("expected SevenDay.ResetsAt 1746406800, got %d", rl.SevenDay.ResetsAt)
	}
}

func TestReadRateLimits_FiveHourOnly(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "rate_limits.json")
	data := `{"five_hour": {"used_percentage": 42, "resets_at": 1746140400}}`
	if err := os.WriteFile(path, []byte(data), 0644); err != nil {
		t.Fatal(err)
	}

	rl, err := ReadRateLimits(path)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rl.FiveHour == nil {
		t.Fatal("expected FiveHour to be non-nil")
	}
	if rl.SevenDay != nil {
		t.Errorf("expected SevenDay to be nil, got %+v", rl.SevenDay)
	}
}

func TestReadRateLimits_SevenDayOnly(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "rate_limits.json")
	data := `{"seven_day": {"used_percentage": 17, "resets_at": 1746406800}}`
	if err := os.WriteFile(path, []byte(data), 0644); err != nil {
		t.Fatal(err)
	}

	rl, err := ReadRateLimits(path)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rl.FiveHour != nil {
		t.Errorf("expected FiveHour to be nil, got %+v", rl.FiveHour)
	}
	if rl.SevenDay == nil {
		t.Fatal("expected SevenDay to be non-nil")
	}
}

func TestReadRateLimits_MissingFile(t *testing.T) {
	rl, err := ReadRateLimits("/nonexistent/path/rate_limits.json")
	if err != nil {
		t.Fatalf("unexpected error for missing file: %v", err)
	}
	if rl.FiveHour != nil || rl.SevenDay != nil {
		t.Errorf("expected zero value, got %+v", rl)
	}
}

func TestReadRateLimits_EmptyFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "rate_limits.json")
	if err := os.WriteFile(path, []byte(""), 0644); err != nil {
		t.Fatal(err)
	}

	rl, err := ReadRateLimits(path)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rl.FiveHour != nil || rl.SevenDay != nil {
		t.Errorf("expected zero value, got %+v", rl)
	}
}

func TestReadRateLimits_MalformedJSON(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "rate_limits.json")
	if err := os.WriteFile(path, []byte("{bad json"), 0644); err != nil {
		t.Fatal(err)
	}

	_, err := ReadRateLimits(path)
	if err == nil {
		t.Fatal("expected error for malformed JSON")
	}
}

func TestWindow_ResetIn(t *testing.T) {
	resetsAt := int64(1746140400)
	w := &Window{UsedPercentage: 5, ResetsAt: resetsAt}

	now := time.Unix(1746140400-1932, 0) // 32 minutes and 12 seconds before reset
	got := w.ResetIn(now)
	want := time.Duration(1932) * time.Second

	if got != want {
		t.Errorf("ResetIn returned %v, want %v", got, want)
	}
}
