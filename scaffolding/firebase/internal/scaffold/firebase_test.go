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
			{Target: "hello", Public: "hello/dist", Ignore: []string{"firebase.json", "**/.*", "**/node_modules/**"}},
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
	if loaded.Hosting[0].Target != "hello" {
		t.Errorf("expected target hello, got %q", loaded.Hosting[0].Target)
	}
}

func TestAddAndRemoveHostingEntry(t *testing.T) {
	config := &FirebaseConfig{
		Hosting: []HostingEntry{
			{Target: "hello", Public: "hello/dist"},
		},
	}

	AddHostingEntry(config, "demo")
	if len(config.Hosting) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(config.Hosting))
	}
	if config.Hosting[1].Target != "demo" {
		t.Errorf("expected target demo, got %q", config.Hosting[1].Target)
	}

	RemoveHostingEntry(config, "demo")
	if len(config.Hosting) != 1 {
		t.Fatalf("expected 1 entry after remove, got %d", len(config.Hosting))
	}
	if config.Hosting[0].Target != "hello" {
		t.Errorf("expected remaining target hello, got %q", config.Hosting[0].Target)
	}
}

func TestFindHostingSite(t *testing.T) {
	tmpDir := t.TempDir()

	// Create .firebaserc with targets
	rc := &FirebaseRC{
		Projects: map[string]string{"default": "commons-systems"},
		Targets: map[string]map[string]Targets{
			"commons-systems": {
				"hosting": {
					"hello": []string{"cs-hello-5b22"},
					"demo":  []string{"cs-demo-a1b2"},
				},
			},
		},
	}
	if err := WriteFirebaseRC(tmpDir, rc); err != nil {
		t.Fatalf("write error: %v", err)
	}

	site, err := FindHostingSite(tmpDir, "demo")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if site != "cs-demo-a1b2" {
		t.Errorf("expected cs-demo-a1b2, got %q", site)
	}

	_, err = FindHostingSite(tmpDir, "nonexistent")
	if err == nil {
		t.Error("expected error for nonexistent app, got nil")
	}
}

func TestFirebaseRCRoundTrip(t *testing.T) {
	tmpDir := t.TempDir()
	initial := &FirebaseRC{
		Projects: map[string]string{"default": "commons-systems"},
		Targets: map[string]map[string]Targets{
			"commons-systems": {
				"hosting": {
					"hello": []string{"cs-hello-5b22"},
				},
			},
		},
	}

	if err := WriteFirebaseRC(tmpDir, initial); err != nil {
		t.Fatalf("write error: %v", err)
	}

	loaded, err := ReadFirebaseRC(tmpDir)
	if err != nil {
		t.Fatalf("read error: %v", err)
	}

	sites := loaded.Targets["commons-systems"]["hosting"]["hello"]
	if len(sites) != 1 || sites[0] != "cs-hello-5b22" {
		t.Errorf("expected [cs-hello-5b22], got %v", sites)
	}
}

func TestAddAndRemoveHostingTarget(t *testing.T) {
	rc := &FirebaseRC{
		Projects: map[string]string{"default": "commons-systems"},
		Targets: map[string]map[string]Targets{
			"commons-systems": {
				"hosting": {
					"hello": []string{"cs-hello-5b22"},
				},
			},
		},
	}

	AddHostingTarget(rc, "demo", "cs-demo-a1b2")
	sites := rc.Targets["commons-systems"]["hosting"]["demo"]
	if len(sites) != 1 || sites[0] != "cs-demo-a1b2" {
		t.Errorf("expected [cs-demo-a1b2], got %v", sites)
	}

	RemoveHostingTarget(rc, "demo")
	if _, ok := rc.Targets["commons-systems"]["hosting"]["demo"]; ok {
		t.Error("expected demo target to be removed")
	}
	// hello should still exist
	if _, ok := rc.Targets["commons-systems"]["hosting"]["hello"]; !ok {
		t.Error("expected hello target to still exist")
	}
}

func TestReadFirebaseConfigFromFile(t *testing.T) {
	tmpDir := t.TempDir()
	content := `{
  "hosting": [
    {
      "target": "hello",
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
