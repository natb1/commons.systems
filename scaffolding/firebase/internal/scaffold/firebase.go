package scaffold

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

const hostingTargetType = "hosting"

type HostingEntry struct {
	Target string   `json:"target"`
	Public string   `json:"public"`
	Ignore []string `json:"ignore"`
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

// UnmarshalJSON and MarshalJSON use the alias-and-raw-map pattern to preserve
// unknown JSON keys during round-trip. FirebaseConfig and FirebaseRC both need
// this, and the implementations are intentionally similar. Go generics cannot
// easily abstract over struct-specific known/unknown field separation.

func (c *FirebaseConfig) UnmarshalJSON(data []byte) error {
	// Unmarshal known fields via alias to avoid infinite recursion.
	type Alias FirebaseConfig
	var alias Alias
	if err := json.Unmarshal(data, &alias); err != nil {
		return err
	}
	*c = FirebaseConfig(alias)

	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	delete(raw, "hosting")
	delete(raw, "firestore")
	if len(raw) > 0 {
		c.extra = raw
	}
	return nil
}

func (c FirebaseConfig) MarshalJSON() ([]byte, error) {
	// Marshal known fields via alias to avoid infinite recursion.
	type Alias FirebaseConfig
	data, err := json.Marshal(Alias(c))
	if err != nil {
		return nil, err
	}
	if len(c.extra) == 0 {
		return data, nil
	}
	var obj map[string]json.RawMessage
	if err := json.Unmarshal(data, &obj); err != nil {
		return nil, err
	}
	for k, v := range c.extra {
		obj[k] = v
	}
	return json.Marshal(obj)
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
	if err := json.Unmarshal(data, &alias); err != nil {
		return err
	}
	*rc = FirebaseRC(alias)

	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	delete(raw, "projects")
	delete(raw, "targets")
	if len(raw) > 0 {
		rc.extra = raw
	}
	return nil
}

func (rc FirebaseRC) MarshalJSON() ([]byte, error) {
	type Alias FirebaseRC
	data, err := json.Marshal(Alias(rc))
	if err != nil {
		return nil, err
	}
	if len(rc.extra) == 0 {
		return data, nil
	}
	var obj map[string]json.RawMessage
	if err := json.Unmarshal(data, &obj); err != nil {
		return nil, err
	}
	for k, v := range rc.extra {
		obj[k] = v
	}
	return json.Marshal(obj)
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
	config.Hosting = append(config.Hosting, HostingEntry{
		Target: appName,
		Public: appName + "/dist",
		Ignore: []string{"firebase.json", "**/.*", "**/node_modules/**"},
	})
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
