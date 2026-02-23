package scaffold

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

type HostingEntry struct {
	Site   string   `json:"site"`
	Public string   `json:"public"`
	Ignore []string `json:"ignore"`
}

type FirestoreConfig struct {
	Rules string `json:"rules"`
}

type FirebaseConfig struct {
	Hosting   []HostingEntry  `json:"hosting"`
	Firestore FirestoreConfig `json:"firestore"`
}

func GenerateSiteName(appName string) (string, error) {
	b := make([]byte, 2)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generating random hex: %w", err)
	}
	return fmt.Sprintf("cs-%s-%x", appName, b), nil
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

func AddHostingEntry(config *FirebaseConfig, siteName, appName string) {
	config.Hosting = append(config.Hosting, HostingEntry{
		Site:   siteName,
		Public: appName + "/dist",
		Ignore: []string{"firebase.json", "**/.*", "**/node_modules/**"},
	})
}

func RemoveHostingEntry(config *FirebaseConfig, appName string) {
	publicDir := appName + "/dist"
	var filtered []HostingEntry
	for _, h := range config.Hosting {
		if h.Public != publicDir {
			filtered = append(filtered, h)
		}
	}
	config.Hosting = filtered
}

func FindHostingSite(config *FirebaseConfig, appName string) string {
	publicDir := appName + "/dist"
	for _, h := range config.Hosting {
		if h.Public == publicDir {
			return h.Site
		}
	}
	return ""
}
