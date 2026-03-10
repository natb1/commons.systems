package parse

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDiscoverFiles(t *testing.T) {
	// Create a temp directory with the expected structure
	tmp := t.TempDir()
	dirs := []string{
		"pnc/5111/2025-07",
		"capital_one/4549/2025-05",
	}
	for _, d := range dirs {
		if err := os.MkdirAll(filepath.Join(tmp, d), 0o755); err != nil {
			t.Fatal(err)
		}
	}

	// Create test files
	testFiles := map[string]string{
		"pnc/5111/2025-07/datafile.csv":                         "csv data",
		"capital_one/4549/2025-05/transaction_download.ofx":      "ofx data",
	}
	for path, content := range testFiles {
		if err := os.WriteFile(filepath.Join(tmp, path), []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}

	// Also create a .DS_Store that should be skipped
	if err := os.WriteFile(filepath.Join(tmp, "pnc/.DS_Store"), []byte("junk"), 0o644); err != nil {
		t.Fatal(err)
	}

	files, err := DiscoverFiles(tmp)
	if err != nil {
		t.Fatalf("DiscoverFiles: %v", err)
	}
	if len(files) != 2 {
		t.Fatalf("expected 2 files, got %d", len(files))
	}

	// Build a map by institution+account+period for order-independent checks
	type key struct{ inst, acct, period string }
	found := map[key]StatementFile{}
	for _, f := range files {
		found[key{f.Institution, f.Account, f.Period}] = f
	}

	if sf, ok := found[key{"pnc", "5111", "2025-07"}]; !ok {
		t.Error("missing pnc/5111/2025-07")
	} else if sf.StatementID() != "pnc-5111-2025-07" {
		t.Errorf("StatementID = %q, want %q", sf.StatementID(), "pnc-5111-2025-07")
	}

	if _, ok := found[key{"capital_one", "4549", "2025-05"}]; !ok {
		t.Error("missing capital_one/4549/2025-05")
	}
}

func TestDetectFormat(t *testing.T) {
	tests := []struct {
		name string
		file string
		want format
	}{
		{"CSV", filepath.Join("testdata", "pnc.csv"), formatCSV},
		{"OFX", filepath.Join("testdata", "capital_one.ofx"), formatOFX},
		{"SGML", filepath.Join("testdata", "pnc.qfx"), formatSGML},
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
		{"CSV", filepath.Join("testdata", "pnc.csv"), 4, false},
		{"OFX", filepath.Join("testdata", "capital_one.ofx"), 2, false},
		{"SGML", filepath.Join("testdata", "pnc.qfx"), 2, false},
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

func TestStatementID(t *testing.T) {
	sf := StatementFile{Institution: "pnc", Account: "5111", Period: "2025-07"}
	if got := sf.StatementID(); got != "pnc-5111-2025-07" {
		t.Errorf("StatementID() = %q, want %q", got, "pnc-5111-2025-07")
	}
}
