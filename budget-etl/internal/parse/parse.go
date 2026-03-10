package parse

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// Transaction holds a single parsed transaction from any statement format.
type Transaction struct {
	TransactionID string
	Date          time.Time
	Amount        float64 // positive = spending, negative = income/credit
	Description   string
	Memo          string
}

// StatementFile identifies a statement file and the metadata extracted from its directory path.
// Expected directory layout: {institution}/{last4}/{period}/{file}
type StatementFile struct {
	Path        string
	Institution string
	Account     string
	Period      string
}

// StatementID returns a deterministic identifier for this statement: "{institution}-{account}-{period}".
func (sf StatementFile) StatementID() string {
	return sf.Institution + "-" + sf.Account + "-" + sf.Period
}

// DiscoverFiles walks dir looking for files matching the expected
// {institution}/{last4}/{period}/{file} layout. It returns one StatementFile
// per file found, skipping dotfiles (like .DS_Store).
func DiscoverFiles(dir string) ([]StatementFile, error) {
	dir = filepath.Clean(dir)
	var files []StatementFile

	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		if strings.HasPrefix(info.Name(), ".") {
			return nil
		}

		rel, err := filepath.Rel(dir, path)
		if err != nil {
			return err
		}
		parts := strings.Split(rel, string(filepath.Separator))
		if len(parts) != 4 {
			return fmt.Errorf("unexpected path depth for %s: expected institution/account/period/file, got %d components", rel, len(parts))
		}

		files = append(files, StatementFile{
			Path:        path,
			Institution: parts[0],
			Account:     parts[1],
			Period:      parts[2],
		})
		return nil
	})
	if err != nil {
		return nil, err
	}
	return files, nil
}

type format int

const (
	formatCSV format = iota
	formatOFX
	formatSGML
)

// detectFormat reads the first bytes of a file to determine its format.
func detectFormat(path string) (format, error) {
	f, err := os.Open(path)
	if err != nil {
		return 0, err
	}
	defer f.Close()

	buf := make([]byte, 512)
	n, err := f.Read(buf)
	if err != nil {
		return 0, fmt.Errorf("reading %s: %w", path, err)
	}
	header := string(buf[:n])

	if strings.HasPrefix(header, "<?xml") || strings.HasPrefix(header, "<?XML") {
		return formatOFX, nil
	}
	if strings.HasPrefix(header, "OFXHEADER:") {
		return formatSGML, nil
	}
	return formatCSV, nil
}

// ParseResult holds the transactions parsed from a single statement file,
// along with a flag indicating if the file was skipped (e.g., investment accounts).
type ParseResult struct {
	Transactions []Transaction
	Skipped      bool
	SkipReason   string
}

// ParseFile detects the format of the file at path and parses its transactions.
func ParseFile(path string) (ParseResult, error) {
	f, err := detectFormat(path)
	if err != nil {
		return ParseResult{}, err
	}
	switch f {
	case formatOFX:
		return parseOFX(path)
	case formatSGML:
		return parseSGML(path)
	case formatCSV:
		return parseCSV(path)
	default:
		return ParseResult{}, &os.PathError{Op: "parse", Path: path, Err: os.ErrInvalid}
	}
}
