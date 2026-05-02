package scaffold

import (
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

const hostingTargetType = "hosting"

type RewriteEntry struct {
	Source      string `json:"source"`
	Destination string `json:"destination"`
}

func (r RewriteEntry) Validate() error {
	if r.Source == "" {
		return errors.New("rewrite source must not be empty")
	}
	if r.Destination == "" {
		return errors.New("rewrite destination must not be empty")
	}
	if !strings.HasPrefix(r.Destination, "/") {
		return fmt.Errorf("rewrite destination must start with /: %s", r.Destination)
	}
	return nil
}

func NewRewriteEntry(source, destination string) (RewriteEntry, error) {
	entry := RewriteEntry{Source: source, Destination: destination}
	if err := entry.Validate(); err != nil {
		return RewriteEntry{}, err
	}
	return entry, nil
}

type HostingEntry struct {
	Target   string         `json:"target"`
	Public   string         `json:"public"`
	Ignore   []string       `json:"ignore"`
	Rewrites []RewriteEntry `json:"rewrites,omitempty"`
	// extra preserves unknown JSON keys (e.g., headers) during round-trip.
	extra map[string]json.RawMessage
}

func (h HostingEntry) Validate() error {
	if h.Target == "" {
		return errors.New("hosting target must not be empty")
	}
	if h.Public == "" {
		return errors.New("hosting public must not be empty")
	}
	return nil
}

// unmarshalWithExtra unmarshals data into target (which must be an alias type
// without its own UnmarshalJSON to avoid recursion), then captures any
// remaining JSON keys (those not in knownKeys) into *extra.
func unmarshalWithExtra[T any](data []byte, target *T, extra *map[string]json.RawMessage, knownKeys ...string) error {
	if err := json.Unmarshal(data, target); err != nil {
		return err
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	for _, k := range knownKeys {
		delete(raw, k)
	}
	if len(raw) > 0 {
		*extra = raw
	}
	return nil
}

// marshalWithExtra marshals typed (which must be an alias type without its own
// MarshalJSON to avoid recursion) and merges in extra keys for round-trip.
func marshalWithExtra[T any](typed T, extra map[string]json.RawMessage) ([]byte, error) {
	data, err := json.Marshal(typed)
	if err != nil {
		return nil, err
	}
	if len(extra) == 0 {
		return data, nil
	}
	var obj map[string]json.RawMessage
	if err := json.Unmarshal(data, &obj); err != nil {
		return nil, err
	}
	for k, v := range extra {
		obj[k] = v
	}
	return json.Marshal(obj)
}

func (h *HostingEntry) UnmarshalJSON(data []byte) error {
	type Alias HostingEntry
	var alias Alias
	var extra map[string]json.RawMessage
	if err := unmarshalWithExtra(data, &alias, &extra, "target", "public", "ignore", "rewrites"); err != nil {
		return err
	}
	*h = HostingEntry(alias)
	h.extra = extra
	return nil
}

func (h HostingEntry) MarshalJSON() ([]byte, error) {
	type Alias HostingEntry
	return marshalWithExtra(Alias(h), h.extra)
}

type FirestoreConfig struct {
	Rules string `json:"rules"`
}

type FirebaseConfig struct {
	Hosting   []HostingEntry  `json:"hosting"`
	Firestore FirestoreConfig `json:"firestore"`
	// extra preserves unknown JSON keys during round-trip read/write.
	extra map[string]json.RawMessage
}

func (c *FirebaseConfig) UnmarshalJSON(data []byte) error {
	type Alias FirebaseConfig
	var alias Alias
	var extra map[string]json.RawMessage
	if err := unmarshalWithExtra(data, &alias, &extra, "hosting", "firestore"); err != nil {
		return err
	}
	*c = FirebaseConfig(alias)
	c.extra = extra
	return nil
}

func (c FirebaseConfig) MarshalJSON() ([]byte, error) {
	type Alias FirebaseConfig
	return marshalWithExtra(Alias(c), c.extra)
}

// ProjectTargets maps target types to their app-site mappings.
// Currently only "hosting" targets are used.
type ProjectTargets map[string]HostingSiteMap

type FirebaseRC struct {
	Projects map[string]string          `json:"projects"`
	Targets  map[string]ProjectTargets  `json:"targets,omitempty"`
	// extra preserves unknown JSON keys during round-trip read/write.
	extra map[string]json.RawMessage
}

func (rc *FirebaseRC) UnmarshalJSON(data []byte) error {
	type Alias FirebaseRC
	var alias Alias
	var extra map[string]json.RawMessage
	if err := unmarshalWithExtra(data, &alias, &extra, "projects", "targets"); err != nil {
		return err
	}
	*rc = FirebaseRC(alias)
	rc.extra = extra
	return nil
}

func (rc FirebaseRC) MarshalJSON() ([]byte, error) {
	type Alias FirebaseRC
	return marshalWithExtra(Alias(rc), rc.extra)
}

// HostingSiteMap maps app names to their hosting site IDs ([]string).
// The .firebaserc format supports multiple sites per app, but this tool uses only the first.
type HostingSiteMap map[string][]string

// DefaultProjectID returns the default project ID from .firebaserc.
func (rc *FirebaseRC) DefaultProjectID() (string, error) {
	pid := rc.Projects["default"]
	if pid == "" {
		return "", fmt.Errorf("no default project in .firebaserc")
	}
	return pid, nil
}

func GenerateSiteName(appName string) (string, error) {
	b := make([]byte, 2)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generating random hex: %w", err)
	}
	return fmt.Sprintf("cs-%s-%x", appName, b), nil
}

func ReadProjectID(repoRoot string) (string, error) {
	rc, err := ReadFirebaseRC(repoRoot)
	if err != nil {
		return "", err
	}
	return rc.DefaultProjectID()
}

func ReadFirebaseConfig(repoRoot string) (*FirebaseConfig, error) {
	data, err := os.ReadFile(filepath.Join(repoRoot, "firebase.json"))
	if err != nil {
		return nil, fmt.Errorf("reading firebase.json: %w", err)
	}

	var config FirebaseConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("parsing firebase.json: %w", err)
	}
	return &config, nil
}

func WriteFirebaseConfig(repoRoot string, config *FirebaseConfig) error {
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("marshaling firebase.json: %w", err)
	}
	data = append(data, '\n')
	path := filepath.Join(repoRoot, "firebase.json")
	if err := os.WriteFile(path, data, 0o644); err != nil {
		return fmt.Errorf("writing firebase.json: %w", err)
	}
	return nil
}

func AddHostingEntry(config *FirebaseConfig, appName string) error {
	for _, h := range config.Hosting {
		if h.Target == appName {
			return fmt.Errorf("hosting entry for target %q already exists", appName)
		}
	}
	entry := HostingEntry{
		Target:   appName,
		Public:   appName + "/dist",
		Ignore:   []string{"firebase.json", "**/.*", "**/node_modules/**"},
		Rewrites: []RewriteEntry{{Source: "**", Destination: "/index.html"}},
	}
	if err := entry.Validate(); err != nil {
		return fmt.Errorf("invalid hosting entry for %q: %w", appName, err)
	}
	config.Hosting = append(config.Hosting, entry)
	return nil
}

// RemoveHostingEntry removes the hosting entry for appName and returns true
// if an entry was actually removed.
func RemoveHostingEntry(config *FirebaseConfig, appName string) bool {
	filtered := make([]HostingEntry, 0, len(config.Hosting))
	for _, h := range config.Hosting {
		if h.Target != appName {
			filtered = append(filtered, h)
		}
	}
	removed := len(filtered) < len(config.Hosting)
	config.Hosting = filtered
	return removed
}

// FindHostingSite looks up the hosting site ID for appName in the given FirebaseRC.
func FindHostingSite(rc *FirebaseRC, appName string) (string, error) {
	projectID, err := rc.DefaultProjectID()
	if err != nil {
		return "", err
	}
	// Indexing nil maps returns zero values in Go, so this chain safely handles
	// missing Targets, project, or hosting entries without nil guards.
	hosting := rc.Targets[projectID][hostingTargetType]
	if sites := hosting[appName]; len(sites) > 0 {
		return sites[0], nil
	}
	return "", fmt.Errorf("no hosting target %q found in .firebaserc", appName)
}

func ReadFirebaseRC(repoRoot string) (*FirebaseRC, error) {
	data, err := os.ReadFile(filepath.Join(repoRoot, ".firebaserc"))
	if err != nil {
		return nil, fmt.Errorf("reading .firebaserc: %w", err)
	}
	var rc FirebaseRC
	if err := json.Unmarshal(data, &rc); err != nil {
		return nil, fmt.Errorf("parsing .firebaserc: %w", err)
	}
	return &rc, nil
}

func WriteFirebaseRC(repoRoot string, rc *FirebaseRC) error {
	data, err := json.MarshalIndent(rc, "", "  ")
	if err != nil {
		return fmt.Errorf("marshaling .firebaserc: %w", err)
	}
	data = append(data, '\n')
	path := filepath.Join(repoRoot, ".firebaserc")
	if err := os.WriteFile(path, data, 0o644); err != nil {
		return fmt.Errorf("writing .firebaserc: %w", err)
	}
	return nil
}

func AddHostingTarget(rc *FirebaseRC, appName, siteName string) error {
	projectID, err := rc.DefaultProjectID()
	if err != nil {
		return err
	}
	if rc.Targets == nil {
		rc.Targets = make(map[string]ProjectTargets)
	}
	if rc.Targets[projectID] == nil {
		rc.Targets[projectID] = make(ProjectTargets)
	}
	if rc.Targets[projectID][hostingTargetType] == nil {
		rc.Targets[projectID][hostingTargetType] = make(HostingSiteMap)
	}
	if _, exists := rc.Targets[projectID][hostingTargetType][appName]; exists {
		return fmt.Errorf("hosting target %q already exists in .firebaserc", appName)
	}
	rc.Targets[projectID][hostingTargetType][appName] = []string{siteName}
	return nil
}

func RemoveHostingTarget(rc *FirebaseRC, appName string) error {
	projectID, err := rc.DefaultProjectID()
	if err != nil {
		return err
	}
	if hosting := rc.Targets[projectID][hostingTargetType]; hosting != nil {
		delete(hosting, appName)
	}
	return nil
}

// PackageJSON represents the root package.json file.
type PackageJSON struct {
	Name       string   `json:"name"`
	Private    bool     `json:"private"`
	Workspaces []string `json:"workspaces"`
	// extra preserves unknown JSON keys (e.g., devDependencies) during round-trip.
	extra map[string]json.RawMessage
}

func (p *PackageJSON) UnmarshalJSON(data []byte) error {
	type Alias PackageJSON
	var alias Alias
	var extra map[string]json.RawMessage
	if err := unmarshalWithExtra(data, &alias, &extra, "name", "private", "workspaces"); err != nil {
		return err
	}
	*p = PackageJSON(alias)
	p.extra = extra
	return nil
}

func (p PackageJSON) MarshalJSON() ([]byte, error) {
	type Alias PackageJSON
	return marshalWithExtra(Alias(p), p.extra)
}

func ReadPackageJSON(repoRoot string) (*PackageJSON, error) {
	data, err := os.ReadFile(filepath.Join(repoRoot, "package.json"))
	if err != nil {
		return nil, fmt.Errorf("reading package.json: %w", err)
	}
	var pkg PackageJSON
	if err := json.Unmarshal(data, &pkg); err != nil {
		return nil, fmt.Errorf("parsing package.json: %w", err)
	}
	return &pkg, nil
}

func WritePackageJSON(repoRoot string, pkg *PackageJSON) error {
	data, err := json.MarshalIndent(pkg, "", "  ")
	if err != nil {
		return fmt.Errorf("marshaling package.json: %w", err)
	}
	data = append(data, '\n')
	path := filepath.Join(repoRoot, "package.json")
	if err := os.WriteFile(path, data, 0o644); err != nil {
		return fmt.Errorf("writing package.json: %w", err)
	}
	return nil
}

// AddWorkspace inserts name into the workspaces array in sorted order.
// Returns an error if the workspace already exists.
func AddWorkspace(pkg *PackageJSON, name string) error {
	for _, w := range pkg.Workspaces {
		if w == name {
			return fmt.Errorf("workspace %q already exists in package.json", name)
		}
	}
	pkg.Workspaces = append(pkg.Workspaces, name)
	sort.Strings(pkg.Workspaces)
	return nil
}

// RemoveWorkspace removes name from the workspaces array.
// Returns true if the workspace was found and removed.
func RemoveWorkspace(pkg *PackageJSON, name string) bool {
	filtered := make([]string, 0, len(pkg.Workspaces))
	for _, w := range pkg.Workspaces {
		if w != name {
			filtered = append(filtered, w)
		}
	}
	removed := len(filtered) < len(pkg.Workspaces)
	pkg.Workspaces = filtered
	return removed
}
