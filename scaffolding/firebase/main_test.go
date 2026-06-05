package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/natb1/commons.systems/scaffolding/firebase/internal/scaffold"
)

// TestScaffoldedAppIsInstallable renders the real embedded templates and asserts
// the generated app ships the PWA-install scaffolding (web app manifest, icons,
// and the manifest/theme-color links in index.html) that makes it installable.
func TestScaffoldedAppIsInstallable(t *testing.T) {
	data, err := scaffold.NewAppData("demo", "cs-demo-1234")
	if err != nil {
		t.Fatalf("NewAppData error: %v", err)
	}

	dir := t.TempDir()
	if err := scaffold.RenderTemplates(templateFS, dir, "templates/app", "demo", data); err != nil {
		t.Fatalf("RenderTemplates error: %v", err)
	}

	// Manifest exists, parses as JSON, and declares an installable app.
	manifestRaw, err := os.ReadFile(filepath.Join(dir, "demo", "public", "manifest.json"))
	if err != nil {
		t.Fatalf("reading manifest.json: %v", err)
	}

	var manifest struct {
		Name      string `json:"name"`
		ShortName string `json:"short_name"`
		StartURL  string `json:"start_url"`
		Display   string `json:"display"`
		Icons     []struct {
			Src string `json:"src"`
		} `json:"icons"`
	}
	if err := json.Unmarshal(manifestRaw, &manifest); err != nil {
		t.Fatalf("manifest.json is not valid JSON: %v", err)
	}

	if manifest.Name != "Demo" {
		t.Errorf("manifest name: want %q, got %q", "Demo", manifest.Name)
	}
	if manifest.ShortName == "" {
		t.Errorf("manifest short_name: want non-empty")
	}
	if manifest.StartURL != "/" {
		t.Errorf("manifest start_url: want %q, got %q", "/", manifest.StartURL)
	}
	if manifest.Display != "standalone" {
		t.Errorf("manifest display: want %q, got %q", "standalone", manifest.Display)
	}

	var has192, has512 bool
	for _, icon := range manifest.Icons {
		switch icon.Src {
		case "/icon-192.png":
			has192 = true
		case "/icon-512.png":
			has512 = true
		}
	}
	if !has192 {
		t.Errorf("manifest icons: missing reference to /icon-192.png")
	}
	if !has512 {
		t.Errorf("manifest icons: missing reference to /icon-512.png")
	}

	// index.html links the manifest and declares a theme color.
	indexRaw, err := os.ReadFile(filepath.Join(dir, "demo", "index.html"))
	if err != nil {
		t.Fatalf("reading index.html: %v", err)
	}
	index := string(indexRaw)
	for _, want := range []string{`rel="manifest"`, `href="/manifest.json"`, `name="theme-color"`} {
		if !strings.Contains(index, want) {
			t.Errorf("index.html: missing %q", want)
		}
	}

	// Icons exist, are non-empty, and are real PNGs.
	pngSig := []byte{0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'}
	for _, name := range []string{"icon-192.png", "icon-512.png"} {
		raw, err := os.ReadFile(filepath.Join(dir, "demo", "public", name))
		if err != nil {
			t.Fatalf("reading %s: %v", name, err)
		}
		if len(raw) == 0 {
			t.Errorf("%s: file is empty", name)
		}
		if len(raw) < len(pngSig) || string(raw[:len(pngSig)]) != string(pngSig) {
			t.Errorf("%s: missing PNG signature", name)
		}
	}
}
