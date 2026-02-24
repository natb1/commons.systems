package scaffold

import (
	"encoding/json"
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

	// Uniqueness: check if they differ (collision is possible but unlikely)
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

	if err := AddHostingEntry(config, "demo"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(config.Hosting) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(config.Hosting))
	}
	if config.Hosting[1].Target != "demo" {
		t.Errorf("expected target demo, got %q", config.Hosting[1].Target)
	}

	// Adding duplicate should error
	if err := AddHostingEntry(config, "demo"); err == nil {
		t.Error("expected error for duplicate target, got nil")
	}

	removed := RemoveHostingEntry(config, "demo")
	if !removed {
		t.Error("expected RemoveHostingEntry to return true")
	}
	if len(config.Hosting) != 1 {
		t.Fatalf("expected 1 entry after remove, got %d", len(config.Hosting))
	}
	if config.Hosting[0].Target != "hello" {
		t.Errorf("expected remaining target hello, got %q", config.Hosting[0].Target)
	}

	// Removing nonexistent entry returns false
	removed = RemoveHostingEntry(config, "nonexistent")
	if removed {
		t.Error("expected RemoveHostingEntry to return false for nonexistent entry")
	}
}

func TestFindHostingSite(t *testing.T) {
	rc := &FirebaseRC{
		Projects: map[string]string{"default": "commons-systems"},
		Targets: map[string]map[string]HostingSiteMap{
			"commons-systems": {
				"hosting": {
					"hello": []string{"cs-hello-5b22"},
					"demo":  []string{"cs-demo-a1b2"},
				},
			},
		},
	}

	site, err := FindHostingSite(rc, "demo")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if site != "cs-demo-a1b2" {
		t.Errorf("expected cs-demo-a1b2, got %q", site)
	}

	_, err = FindHostingSite(rc, "nonexistent")
	if err == nil {
		t.Error("expected error for nonexistent app, got nil")
	}
}

func TestFirebaseRCRoundTrip(t *testing.T) {
	tmpDir := t.TempDir()
	initial := &FirebaseRC{
		Projects: map[string]string{"default": "commons-systems"},
		Targets: map[string]map[string]HostingSiteMap{
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
		Targets: map[string]map[string]HostingSiteMap{
			"commons-systems": {
				"hosting": {
					"hello": []string{"cs-hello-5b22"},
				},
			},
		},
	}

	if err := AddHostingTarget(rc, "demo", "cs-demo-a1b2"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	sites := rc.Targets["commons-systems"]["hosting"]["demo"]
	if len(sites) != 1 || sites[0] != "cs-demo-a1b2" {
		t.Errorf("expected [cs-demo-a1b2], got %v", sites)
	}

	if err := RemoveHostingTarget(rc, "demo"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := rc.Targets["commons-systems"]["hosting"]["demo"]; ok {
		t.Error("expected demo target to be removed")
	}
	// hello should still exist
	if _, ok := rc.Targets["commons-systems"]["hosting"]["hello"]; !ok {
		t.Error("expected hello target to still exist")
	}
}

func TestAddHostingTargetDuplicate(t *testing.T) {
	rc := &FirebaseRC{
		Projects: map[string]string{"default": "commons-systems"},
		Targets: map[string]map[string]HostingSiteMap{
			"commons-systems": {
				"hosting": {
					"hello": []string{"cs-hello-5b22"},
				},
			},
		},
	}

	if err := AddHostingTarget(rc, "demo", "cs-demo-a1b2"); err != nil {
		t.Fatalf("first add: unexpected error: %v", err)
	}

	err := AddHostingTarget(rc, "demo", "cs-demo-xxxx")
	if err == nil {
		t.Error("expected error for duplicate hosting target, got nil")
	}
	if err != nil && !strings.Contains(err.Error(), "already exists") {
		t.Errorf("expected 'already exists' error, got: %v", err)
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

func TestFirebaseConfigPreservesUnknownFields(t *testing.T) {
	tmpDir := t.TempDir()
	content := `{
  "hosting": [
    {
      "target": "hello",
      "public": "hello/dist",
      "ignore": ["firebase.json"]
    }
  ],
  "firestore": {
    "rules": "firestore.rules"
  },
  "emulators": {
    "firestore": { "port": 8080 }
  },
  "storage": {
    "rules": "storage.rules"
  }
}
`
	os.WriteFile(filepath.Join(tmpDir, "firebase.json"), []byte(content), 0o644)

	config, err := ReadFirebaseConfig(tmpDir)
	if err != nil {
		t.Fatalf("read error: %v", err)
	}

	if err := WriteFirebaseConfig(tmpDir, config); err != nil {
		t.Fatalf("write error: %v", err)
	}

	// Re-read and verify unknown fields survived
	data, err := os.ReadFile(filepath.Join(tmpDir, "firebase.json"))
	if err != nil {
		t.Fatalf("read file error: %v", err)
	}

	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}

	if _, ok := raw["emulators"]; !ok {
		t.Error("expected 'emulators' key to be preserved")
	}
	if _, ok := raw["storage"]; !ok {
		t.Error("expected 'storage' key to be preserved")
	}
}

func TestFirebaseRCPreservesUnknownFields(t *testing.T) {
	tmpDir := t.TempDir()
	content := `{
  "projects": {
    "default": "commons-systems"
  },
  "targets": {
    "commons-systems": {
      "hosting": {
        "hello": ["cs-hello-5b22"]
      }
    }
  },
  "etags": {
    "commons-systems": "abc123"
  }
}
`
	os.WriteFile(filepath.Join(tmpDir, ".firebaserc"), []byte(content), 0o644)

	rc, err := ReadFirebaseRC(tmpDir)
	if err != nil {
		t.Fatalf("read error: %v", err)
	}

	if err := WriteFirebaseRC(tmpDir, rc); err != nil {
		t.Fatalf("write error: %v", err)
	}

	// Re-read and verify unknown fields survived
	data, err := os.ReadFile(filepath.Join(tmpDir, ".firebaserc"))
	if err != nil {
		t.Fatalf("read file error: %v", err)
	}

	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}

	if _, ok := raw["etags"]; !ok {
		t.Error("expected 'etags' key to be preserved")
	}
}

func TestAddHostingTargetEmptyProject(t *testing.T) {
	rc := &FirebaseRC{
		Projects: map[string]string{},
	}
	if err := AddHostingTarget(rc, "demo", "cs-demo-1234"); err == nil {
		t.Error("expected error for empty project, got nil")
	}
}

func TestRemoveHostingTargetEmptyProject(t *testing.T) {
	rc := &FirebaseRC{
		Projects: map[string]string{},
	}
	if err := RemoveHostingTarget(rc, "demo"); err == nil {
		t.Error("expected error for empty project, got nil")
	}
}

func TestReadProjectID(t *testing.T) {
	tmpDir := t.TempDir()
	rc := &FirebaseRC{
		Projects: map[string]string{"default": "my-project"},
	}
	if err := WriteFirebaseRC(tmpDir, rc); err != nil {
		t.Fatalf("write error: %v", err)
	}

	projectID, err := ReadProjectID(tmpDir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if projectID != "my-project" {
		t.Errorf("expected my-project, got %q", projectID)
	}
}

func TestDefaultProjectID(t *testing.T) {
	rc := &FirebaseRC{
		Projects: map[string]string{"default": "my-project"},
	}
	pid, err := rc.DefaultProjectID()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if pid != "my-project" {
		t.Errorf("expected my-project, got %q", pid)
	}

	rcEmpty := &FirebaseRC{Projects: map[string]string{}}
	_, err = rcEmpty.DefaultProjectID()
	if err == nil {
		t.Error("expected error for empty project, got nil")
	}
}
