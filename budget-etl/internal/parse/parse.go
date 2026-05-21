package parse

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// Transaction holds a single parsed transaction from any statement format.
// For OFX/SGML, if Memo differs from Name, Description is "Name | Memo".
type Transaction struct {
	TransactionID string
	Date          time.Time
	Amount        int64 // cents; positive = spending, negative = income/credit
	Description   string
}

// ParseError wraps a parse failure with the source file path.
type ParseError struct {
	Path string
	Err  error
}

func (e *ParseError) Error() string { return fmt.Sprintf("%s: %v", e.Path, e.Err) }
func (e *ParseError) Unwrap() error { return e.Err }

// StatementFile identifies a statement file and the metadata extracted from its path.
// Period is initially derived from the directory or filename; callers may
// override it with document-inferred data (see InferPeriod).
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

// DiscoverOpts controls how Discover interprets a statement directory. The zero
// value selects the nested {institution}/{account}/[period]/{file} layout; set
// both Institution and Account to treat the directory as flat — every file is
// recorded under that institution and account, with the period taken from the
// filename.
type DiscoverOpts struct {
	Institution string
	Account     string
}

// Discover walks dir for statement files. With the zero DiscoverOpts it expects
// the nested layout handled by DiscoverFiles; with both Institution and Account
// set it treats dir as a flat directory of statement files.
func Discover(dir string, opts DiscoverOpts) ([]StatementFile, error) {
	if opts.Institution != "" && opts.Account != "" {
		return discoverFlatFiles(dir, opts.Institution, opts.Account)
	}
	return DiscoverFiles(dir)
}

// walkStatementFiles walks dir, skipping dot-prefixed directories and files, and
// calls build for each remaining regular file. build returns the StatementFile
// to record, or an error to abort the walk.
func walkStatementFiles(dir string, build func(path string, info os.FileInfo) (StatementFile, error)) ([]StatementFile, error) {
	dir = filepath.Clean(dir)
	var files []StatementFile

	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			if path != dir && strings.HasPrefix(info.Name(), ".") {
				return filepath.SkipDir
			}
			return nil
		}
		if strings.HasPrefix(info.Name(), ".") {
			return nil
		}
		sf, err := build(path, info)
		if err != nil {
			return err
		}
		files = append(files, sf)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return files, nil
}

// DiscoverFiles walks dir looking for statement files. It accepts two layouts:
//   - {institution}/{account}/{period}/{file} — period from directory name
//   - {institution}/{account}/{file} — period from filename stem
//
// It returns one StatementFile per file found, skipping dot-prefixed entries.
func DiscoverFiles(dir string) ([]StatementFile, error) {
	dir = filepath.Clean(dir)
	return walkStatementFiles(dir, func(path string, info os.FileInfo) (StatementFile, error) {
		rel, err := filepath.Rel(dir, path)
		if err != nil {
			return StatementFile{}, err
		}
		parts := strings.Split(rel, string(filepath.Separator))
		switch len(parts) {
		case 4:
			// institution/account/period/file
			return StatementFile{
				Path:        path,
				Institution: parts[0],
				Account:     parts[1],
				Period:      parts[2],
			}, nil
		case 3:
			// institution/account/file (no period directory)
			period, err := periodFromStem(parts[2])
			if err != nil {
				return StatementFile{}, err
			}
			return StatementFile{
				Path:        path,
				Institution: parts[0],
				Account:     parts[1],
				Period:      period,
			}, nil
		default:
			return StatementFile{}, fmt.Errorf("unexpected path depth for %s: expected institution/account/[period/]file, got %d components", rel, len(parts))
		}
	})
}

// discoverFlatFiles walks dir for every non-dotfile (at any depth >= 1) and
// returns a StatementFile per file using the caller-supplied institution and
// account. Period is derived from each file's basename with its extension
// stripped; InferPeriod later overwrites it from document content where possible.
func discoverFlatFiles(dir, institution, account string) ([]StatementFile, error) {
	return walkStatementFiles(dir, func(path string, info os.FileInfo) (StatementFile, error) {
		period, err := periodFromStem(info.Name())
		if err != nil {
			return StatementFile{}, err
		}
		return StatementFile{
			Path:        path,
			Institution: institution,
			Account:     account,
			Period:      period,
		}, nil
	})
}

// filenameStem returns the filename without its extension.
func filenameStem(name string) string {
	ext := filepath.Ext(name)
	return strings.TrimSuffix(name, ext)
}

// periodFromStem derives a statement period from a filename by stripping its
// extension, erroring when nothing remains.
func periodFromStem(name string) (string, error) {
	stem := filenameStem(name)
	if stem == "" {
		return "", fmt.Errorf("cannot derive period from filename %q: empty stem after removing extension", name)
	}
	return stem, nil
}

type format int

const (
	formatUnknown format = iota
	formatCSV
	formatOFX
	formatSGML
)

// detectFormat reads the first 512 bytes of a file to determine its format.
// OFX XML is identified by a <?xml prefix, SGML by an OFXHEADER: prefix.
// CSV is a fallback: any file containing a comma in its header is treated as CSV.
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
	if strings.Contains(header, ",") {
		return formatCSV, nil
	}
	return 0, fmt.Errorf("unrecognized statement format in %s", path)
}

// ParseResult holds the transactions parsed from a single statement file,
// along with a flag indicating if the file was skipped (e.g., investment accounts).
type ParseResult struct {
	Transactions []Transaction
	Balance      int64     // cents; 0 if absent. Raw signed value from statement.
	BalanceDate  time.Time // date the balance was observed; zero if absent. OFX: LEDGERBAL DTASOF. CSV: toDate.
	Skipped      bool
	SkipReason   string
}

// InferPeriod returns a YYYY-MM period derived from document data. Prefers
// BalanceDate, falls back to latest transaction date. Returns empty string
// if neither is available.
func (pr ParseResult) InferPeriod() string {
	if !pr.BalanceDate.IsZero() {
		return pr.BalanceDate.Format("2006-01")
	}
	if len(pr.Transactions) > 0 {
		latest := pr.Transactions[0].Date
		for _, t := range pr.Transactions[1:] {
			if t.Date.After(latest) {
				latest = t.Date
			}
		}
		if !latest.IsZero() {
			return latest.Format("2006-01")
		}
	}
	return ""
}

// ParseFile detects the format of the file at path and parses its transactions.
func ParseFile(path string) (ParseResult, error) {
	f, err := detectFormat(path)
	if err != nil {
		return ParseResult{}, &ParseError{Path: path, Err: err}
	}
	var result ParseResult
	switch f {
	case formatOFX:
		result, err = parseOFX(path)
	case formatSGML:
		result, err = parseSGML(path)
	case formatCSV:
		result, err = parseCSV(path)
	default:
		panic(fmt.Sprintf("unhandled format %d for %s", f, path))
	}
	if err != nil {
		return ParseResult{}, &ParseError{Path: path, Err: err}
	}
	return result, nil
}
