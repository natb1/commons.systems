package scaffold

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestGenerateSiteName(t *testing.T) {
	name, err := GenerateSiteName("demo")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.HasPrefix(name, "cs-demo-") {
		t.Errorf("expected prefix cs-demo-, got %q", name)
	}
	// cs-demo- is 8 chars, then 4 hex chars = 12 total
	if len(name) != 12 {
		t.Errorf("expected length 12, got %d (%q)", len(name), name)
	}

	// Uniqueness: generate two and verify they differ
	name2, _ := GenerateSiteName("demo")
	if name == name2 {
		t.Log("WARNING: two generated names are identical (unlikely but possible)")
	}
}

func TestFirebaseConfigRoundTrip(t *testing.T) {
	tmpDir := t.TempDir()
	initial := &FirebaseConfig{
		Hosting: []HostingEntry{
			{Site: "cs-hello-5b22", Public: "hello/dist", Ignore: []string{"firebase.json", "**/.*", "**/node_modules/**"}},
		},
		Firestore: FirestoreConfig{Rules: "firestore.rules"},
	}

	if err := WriteFirebaseConfig(tmpDir, initial); err != nil {
		t.Fatalf("write error: %v", err)
	}

	loaded, err := ReadFirebaseConfig(tmpDir)
	if err != nil {
		t.Fatalf("read error: %v", err)
	}

	if len(loaded.Hosting) != 1 {
		t.Fatalf("expected 1 hosting entry, got %d", len(loaded.Hosting))
	}
	if loaded.Hosting[0].Site != "cs-hello-5b22" {
		t.Errorf("expected site cs-hello-5b22, got %q", loaded.Hosting[0].Site)
	}
}

func TestAddAndRemoveHostingEntry(t *testing.T) {
	config := &FirebaseConfig{
		Hosting: []HostingEntry{
			{Site: "cs-hello-5b22", Public: "hello/dist"},
		},
	}

	AddHostingEntry(config, "cs-demo-a1b2", "demo")
	if len(config.Hosting) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(config.Hosting))
	}
	if config.Hosting[1].Site != "cs-demo-a1b2" {
		t.Errorf("expected site cs-demo-a1b2, got %q", config.Hosting[1].Site)
	}

	RemoveHostingEntry(config, "demo")
	if len(config.Hosting) != 1 {
		t.Fatalf("expected 1 entry after remove, got %d", len(config.Hosting))
	}
	if config.Hosting[0].Site != "cs-hello-5b22" {
		t.Errorf("expected remaining site cs-hello-5b22, got %q", config.Hosting[0].Site)
	}
}

func TestFindHostingSite(t *testing.T) {
	config := &FirebaseConfig{
		Hosting: []HostingEntry{
			{Site: "cs-hello-5b22", Public: "hello/dist"},
			{Site: "cs-demo-a1b2", Public: "demo/dist"},
		},
	}

	if site := FindHostingSite(config, "demo"); site != "cs-demo-a1b2" {
		t.Errorf("expected cs-demo-a1b2, got %q", site)
	}
	if site := FindHostingSite(config, "nonexistent"); site != "" {
		t.Errorf("expected empty string, got %q", site)
	}
}

func TestReadFirebaseConfigFromFile(t *testing.T) {
	tmpDir := t.TempDir()
	content := `{
  "hosting": [
    {
      "site": "cs-hello-5b22",
      "public": "hello/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
    }
  ],
  "firestore": {
    "rules": "firestore.rules"
  }
}
`
	os.WriteFile(filepath.Join(tmpDir, "firebase.json"), []byte(content), 0o644)

	config, err := ReadFirebaseConfig(tmpDir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(config.Hosting) != 1 {
		t.Fatalf("expected 1 hosting entry, got %d", len(config.Hosting))
	}
	if config.Firestore.Rules != "firestore.rules" {
		t.Errorf("expected firestore.rules, got %q", config.Firestore.Rules)
	}
}
