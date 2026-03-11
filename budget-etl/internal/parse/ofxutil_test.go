package parse

import (
	"testing"
	"time"
)

func TestParseCents(t *testing.T) {
	tests := []struct {
		input string
		want  int64
	}{
		{"400.00", 40000},
		{"-16.19", -1619},
		{"3001.83", 300183},
		{"50.00", 5000},
		{"-81.71", -8171},
		{"3.00", 300},
		{"202.00", 20200},
		{"0.50", 50},
		{"100", 10000},
		{"-100", -10000},
		{"1.5", 150},
	}
	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got, err := parseCents(tt.input)
			if err != nil {
				t.Fatalf("parseCents(%q): %v", tt.input, err)
			}
			if got != tt.want {
				t.Errorf("parseCents(%q) = %d, want %d", tt.input, got, tt.want)
			}
		})
	}
}

func TestParseCents_Errors(t *testing.T) {
	for _, input := range []string{"", "abc", "12.ab", "1.999"} {
		_, err := parseCents(input)
		if err == nil {
			t.Errorf("parseCents(%q): expected error", input)
		}
	}
}

func TestParseOFXDate(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string // YYYY-MM-DD
	}{
		{"8-digit", "20250522", "2025-05-22"},
		{"14-digit", "20251017120000", "2025-10-17"},
		{"with fractional", "20250522000000.000", "2025-05-22"},
		{"with timezone", "20251023083735.186[-4:EDT]", "2025-10-23"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseOFXDate(tt.input)
			if err != nil {
				t.Fatalf("parseOFXDate(%q): %v", tt.input, err)
			}
			want, _ := time.Parse("2006-01-02", tt.want)
			if !got.Equal(want) {
				t.Errorf("parseOFXDate(%q) = %v, want %v", tt.input, got, want)
			}
		})
	}
}
