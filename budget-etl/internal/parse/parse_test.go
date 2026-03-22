package parse

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestDiscoverFiles(t *testing.T) {
	// Create a temp directory with the expected structure
	tmp := t.TempDir()
	dirs := []string{
		"bankone/1234/2025-07",
		"banktwo/5678/2025-05",
	}
	for _, d := range dirs {
		if err := os.MkdirAll(filepath.Join(tmp, d), 0o755); err != nil {
			t.Fatal(err)
		}
	}

	// Create test files (4-level and 3-level layouts)
	testFiles := map[string]string{
		"bankone/1234/2025-07/datafile.csv":                    "csv data",
		"banktwo/5678/2025-05/transaction_download.ofx": "ofx data",
		"bankone/1234/2025-08.csv":                             "csv data",
	}
	for path, content := range testFiles {
		if err := os.WriteFile(filepath.Join(tmp, path), []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}

	// Also create a .DS_Store that should be skipped
	if err := os.WriteFile(filepath.Join(tmp, "bankone/.DS_Store"), []byte("junk"), 0o644); err != nil {
		t.Fatal(err)
	}

	files, err := DiscoverFiles(tmp)
	if err != nil {
		t.Fatalf("DiscoverFiles: %v", err)
	}
	if len(files) != 3 {
		t.Fatalf("expected 3 files, got %d", len(files))
	}

	// Build a map by institution+account+period for order-independent checks
	type key struct{ inst, acct, period string }
	found := map[key]StatementFile{}
	for _, f := range files {
		found[key{f.Institution, f.Account, f.Period}] = f
	}

	if sf, ok := found[key{"bankone", "1234", "2025-07"}]; !ok {
		t.Error("missing bankone/1234/2025-07")
	} else if sf.StatementID() != "bankone-1234-2025-07" {
		t.Errorf("StatementID = %q, want %q", sf.StatementID(), "bankone-1234-2025-07")
	}

	if _, ok := found[key{"banktwo", "5678", "2025-05"}]; !ok {
		t.Error("missing banktwo/5678/2025-05")
	}

	// 3-level layout: period from filename stem
	if sf, ok := found[key{"bankone", "1234", "2025-08"}]; !ok {
		t.Error("missing bankone/1234/2025-08 (3-level layout)")
	} else if sf.StatementID() != "bankone-1234-2025-08" {
		t.Errorf("StatementID = %q, want %q", sf.StatementID(), "bankone-1234-2025-08")
	}
}

func TestDetectFormat(t *testing.T) {
	tests := []struct {
		name string
		file string
		want format
	}{
		{"CSV", filepath.Join("testdata", "bankone.csv"), formatCSV},
		{"OFX", filepath.Join("testdata", "banktwo.ofx"), formatOFX},
		{"SGML", filepath.Join("testdata", "bankone.qfx"), formatSGML},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := detectFormat(tt.file)
			if err != nil {
				t.Fatalf("detectFormat: %v", err)
			}
			if got != tt.want {
				t.Errorf("detectFormat(%s) = %d, want %d", tt.file, got, tt.want)
			}
		})
	}
}

func TestParseFile_Dispatch(t *testing.T) {
	tests := []struct {
		name      string
		file      string
		wantCount int
		wantSkip  bool
	}{
		{"CSV", filepath.Join("testdata", "bankone.csv"), 4, false},
		{"OFX", filepath.Join("testdata", "banktwo.ofx"), 2, false},
		{"SGML", filepath.Join("testdata", "bankone.qfx"), 2, false},
		{"Investment", filepath.Join("testdata", "investment.qfx"), 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ParseFile(tt.file)
			if err != nil {
				t.Fatalf("ParseFile: %v", err)
			}
			if result.Skipped != tt.wantSkip {
				t.Errorf("Skipped = %v, want %v", result.Skipped, tt.wantSkip)
			}
			if !result.Skipped && len(result.Transactions) != tt.wantCount {
				t.Errorf("got %d transactions, want %d", len(result.Transactions), tt.wantCount)
			}
		})
	}
}

func TestDetectFormat_Unrecognized(t *testing.T) {
	tmp := filepath.Join(t.TempDir(), "unknown.txt")
	if err := os.WriteFile(tmp, []byte("some random content without commas"), 0o644); err != nil {
		t.Fatal(err)
	}
	_, err := detectFormat(tmp)
	if err == nil {
		t.Fatal("expected error for unrecognized format")
	}
}

func TestInferPeriod(t *testing.T) {
	tests := []struct {
		name string
		pr   ParseResult
		want string
	}{
		{
			name: "BalanceDate present",
			pr: ParseResult{
				BalanceDate: time.Date(2026, 3, 15, 0, 0, 0, 0, time.UTC),
				Transactions: []Transaction{
					{Date: time.Date(2026, 2, 10, 0, 0, 0, 0, time.UTC)},
				},
			},
			want: "2026-03",
		},
		{
			name: "no BalanceDate, uses latest transaction",
			pr: ParseResult{
				Transactions: []Transaction{
					{Date: time.Date(2025, 10, 5, 0, 0, 0, 0, time.UTC)},
					{Date: time.Date(2025, 11, 20, 0, 0, 0, 0, time.UTC)},
					{Date: time.Date(2025, 9, 1, 0, 0, 0, 0, time.UTC)},
				},
			},
			want: "2025-11",
		},
		{
			name: "no data",
			pr:   ParseResult{},
			want: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.pr.InferPeriod()
			if got != tt.want {
				t.Errorf("InferPeriod() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestStatementID(t *testing.T) {
	sf := StatementFile{Institution: "bankone", Account: "1234", Period: "2025-07"}
	if got := sf.StatementID(); got != "bankone-1234-2025-07" {
		t.Errorf("StatementID() = %q, want %q", got, "bankone-1234-2025-07")
	}
}
