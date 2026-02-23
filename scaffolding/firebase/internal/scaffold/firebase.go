package scaffold

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

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
	// Extra preserves unknown JSON keys during round-trip read/write.
	Extra map[string]json.RawMessage `json:"-"`
}

func (c *FirebaseConfig) UnmarshalJSON(data []byte) error {
	// Unmarshal known fields via alias to avoid infinite recursion.
	type Alias FirebaseConfig
	var alias Alias
	if err := json.Unmarshal(data, &alias); err != nil {
		return err
	}
	*c = FirebaseConfig(alias)

	// Capture all keys into a raw map, then remove the known ones.
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	delete(raw, "hosting")
	delete(raw, "firestore")
	if len(raw) > 0 {
		c.Extra = raw
	}
	return nil
}

func (c FirebaseConfig) MarshalJSON() ([]byte, error) {
	// Marshal known fields via alias.
	type Alias FirebaseConfig
	data, err := json.Marshal(Alias(c))
	if err != nil {
		return nil, err
	}
	if len(c.Extra) == 0 {
		return data, nil
	}
	// Merge extra keys into the JSON object.
	var obj map[string]json.RawMessage
	if err := json.Unmarshal(data, &obj); err != nil {
		return nil, err
	}
	for k, v := range c.Extra {
		obj[k] = v
	}
	return json.Marshal(obj)
}

type FirebaseRC struct {
	Projects map[string]string             `json:"projects"`
	Targets  map[string]map[string]Targets `json:"targets,omitempty"`
	// Extra preserves unknown JSON keys during round-trip read/write.
	Extra map[string]json.RawMessage `json:"-"`
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
		rc.Extra = raw
	}
	return nil
}

func (rc FirebaseRC) MarshalJSON() ([]byte, error) {
	type Alias FirebaseRC
	data, err := json.Marshal(Alias(rc))
	if err != nil {
		return nil, err
	}
	if len(rc.Extra) == 0 {
		return data, nil
	}
	var obj map[string]json.RawMessage
	if err := json.Unmarshal(data, &obj); err != nil {
		return nil, err
	}
	for k, v := range rc.Extra {
		obj[k] = v
	}
	return json.Marshal(obj)
}

type Targets map[string][]string

func GenerateSiteName(appName string) (string, error) {
	b := make([]byte, 2)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generating random hex: %w", err)
	}
	return fmt.Sprintf("cs-%s-%x", appName, b), nil
}

// ReadProjectID reads the default project ID from .firebaserc.
func ReadProjectID(repoRoot string) (string, error) {
	rc, err := ReadFirebaseRC(repoRoot)
	if err != nil {
		return "", err
	}
	projectID := rc.Projects["default"]
	if projectID == "" {
		return "", fmt.Errorf("no default project in .firebaserc")
	}
	return projectID, nil
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
	return os.WriteFile(filepath.Join(repoRoot, "firebase.json"), data, 0o644)
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

func RemoveHostingEntry(config *FirebaseConfig, appName string) {
	filtered := make([]HostingEntry, 0, len(config.Hosting))
	for _, h := range config.Hosting {
		if h.Target != appName {
			filtered = append(filtered, h)
		}
	}
	config.Hosting = filtered
}

func FindHostingSite(repoRoot, appName string) (string, error) {
	rc, err := ReadFirebaseRC(repoRoot)
	if err != nil {
		return "", err
	}
	projectID := rc.Projects["default"]
	if projectID == "" {
		return "", fmt.Errorf("no default project in .firebaserc")
	}
	if rc.Targets != nil {
		if projectTargets, ok := rc.Targets[projectID]; ok {
			if hosting, ok := projectTargets["hosting"]; ok {
				if sites, ok := hosting[appName]; ok && len(sites) > 0 {
					return sites[0], nil
				}
			}
		}
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
	return os.WriteFile(filepath.Join(repoRoot, ".firebaserc"), data, 0o644)
}

func AddHostingTarget(rc *FirebaseRC, appName, siteName string) error {
	projectID := rc.Projects["default"]
	if projectID == "" {
		return fmt.Errorf("no default project in .firebaserc")
	}
	if rc.Targets == nil {
		rc.Targets = make(map[string]map[string]Targets)
	}
	if rc.Targets[projectID] == nil {
		rc.Targets[projectID] = make(map[string]Targets)
	}
	if rc.Targets[projectID]["hosting"] == nil {
		rc.Targets[projectID]["hosting"] = make(Targets)
	}
	rc.Targets[projectID]["hosting"][appName] = []string{siteName}
	return nil
}

func RemoveHostingTarget(rc *FirebaseRC, appName string) error {
	projectID := rc.Projects["default"]
	if projectID == "" {
		return fmt.Errorf("no default project in .firebaserc")
	}
	if rc.Targets != nil && rc.Targets[projectID] != nil && rc.Targets[projectID]["hosting"] != nil {
		delete(rc.Targets[projectID]["hosting"], appName)
	}
	return nil
}
