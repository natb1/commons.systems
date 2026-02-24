package scaffold

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"testing/fstest"
)

func TestRenderTemplates(t *testing.T) {
	data := NewAppData("demo", "cs-demo-1234")
	outDir := t.TempDir()

	fs := fstest.MapFS{
		"tpl/static.css":                       {Data: []byte("body { color: red; }")},
		"tpl/index.html.tmpl":                  {Data: []byte("<title>{{.Title}}</title>")},
		"tpl/{{.AppName}}/config.json.tmpl":    {Data: []byte(`{"app": "{{.AppName}}", "url": "{{.ProductionURL}}"}`)},
		"tpl/{{.AppName}}/readme.txt":          {Data: []byte("static content")},
	}

	if err := renderTemplates(fs, outDir, "tpl", "out", data); err != nil {
		t.Fatalf("renderTemplates error: %v", err)
	}

	// Static files are copied verbatim
	content, err := os.ReadFile(filepath.Join(outDir, "out", "static.css"))
	if err != nil {
		t.Fatalf("reading static.css: %v", err)
	}
	if string(content) != "body { color: red; }" {
		t.Errorf("static.css: expected verbatim copy, got %q", content)
	}

	// .tmpl files are processed and extension stripped
	content, err = os.ReadFile(filepath.Join(outDir, "out", "index.html"))
	if err != nil {
		t.Fatalf("reading index.html: %v", err)
	}
	if string(content) != "<title>Demo</title>" {
		t.Errorf("index.html: expected <title>Demo</title>, got %q", content)
	}

	// {{.AppName}} in directory names is replaced
	content, err = os.ReadFile(filepath.Join(outDir, "out", "demo", "config.json"))
	if err != nil {
		t.Fatalf("reading demo/config.json: %v", err)
	}
	if !strings.Contains(string(content), `"app": "demo"`) {
		t.Errorf("config.json: expected app name substitution, got %q", content)
	}
	if !strings.Contains(string(content), `"url": "https://cs-demo-1234.web.app"`) {
		t.Errorf("config.json: expected production URL substitution, got %q", content)
	}

	// Static file inside renamed directory
	content, err = os.ReadFile(filepath.Join(outDir, "out", "demo", "readme.txt"))
	if err != nil {
		t.Fatalf("reading demo/readme.txt: %v", err)
	}
	if string(content) != "static content" {
		t.Errorf("readme.txt: expected 'static content', got %q", content)
	}
}
