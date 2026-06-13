package scaffold

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

// TestTemplateDepsMatchRoot guards against the app template's package.json
// drifting from the root package.json (issue #1308). It reads the real repo
// files and asserts the template's dependency shape:
//   - shared deps (e.g. firebase) pin the same version as the root union
//   - no per-app toolchain devDependencies (the toolchain is hoisted to root)
//   - every @commons-systems/* workspace dep uses the "*" specifier
//   - @commons-systems/errorutil is present
func TestTemplateDepsMatchRoot(t *testing.T) {
	_, callerFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller(0) failed to report this test file's path")
	}
	// This file lives at scaffolding/firebase/internal/scaffold/.
	// Strip the filename, then climb four parents to the repo root.
	repoRoot := filepath.Dir(filepath.Dir(filepath.Dir(filepath.Dir(filepath.Dir(callerFile)))))

	templatePath := filepath.Join(repoRoot, "scaffolding", "firebase", "templates", "app", "package.json.tmpl")
	rootPath := filepath.Join(repoRoot, "package.json")

	template := readPackageJSON(t, templatePath)
	root := readPackageJSON(t, rootPath)

	templateDeps := decodeDepMap(t, template, "dependencies", templatePath)

	// Build the root dependency set as the UNION of root dependencies +
	// devDependencies. The root package.json has NO "dependencies" key —
	// firebase and the whole toolchain live under devDependencies. Reading
	// only root.dependencies would make assertion (1) vacuously green.
	rootUnion := map[string]string{}
	for name, ver := range decodeDepMap(t, root, "dependencies", rootPath) {
		rootUnion[name] = ver
	}
	for name, ver := range decodeDepMap(t, root, "devDependencies", rootPath) {
		rootUnion[name] = ver
	}

	// (1) Shared-dep version match: for every dep present in both the
	// template's dependencies and the root union, versions must be byte-equal.
	sharedSeen := 0
	for name, tmplVer := range templateDeps {
		rootVer, ok := rootUnion[name]
		if !ok {
			continue
		}
		sharedSeen++
		if tmplVer != rootVer {
			t.Errorf("shared dependency %q version drift: template has %q, root has %q",
				name, tmplVer, rootVer)
		}
	}
	if sharedSeen == 0 {
		t.Error("found no shared dependency between template and root union; " +
			"the root union is likely being read wrong (root has no top-level " +
			"\"dependencies\" key — firebase lives under devDependencies)")
	}

	// (2) No per-app toolchain devDeps: the template must have no
	// devDependencies KEY at all.
	if _, present := template["devDependencies"]; present {
		t.Error("template package.json must not declare a devDependencies key; " +
			"the shared toolchain is hoisted to the root package.json")
	}

	// (3) Workspace deps use "*": every @commons-systems/* entry must be "*".
	for name, ver := range templateDeps {
		if !strings.HasPrefix(name, "@commons-systems/") {
			continue
		}
		if ver != "*" {
			t.Errorf("workspace dependency %q must use the \"*\" specifier, got %q "+
				"(a file: specifier is a regression)", name, ver)
		}
	}

	// (4) errorutil present.
	if _, present := templateDeps["@commons-systems/errorutil"]; !present {
		t.Error("template dependencies must include @commons-systems/errorutil")
	}
}

// readPackageJSON reads and parses a package.json (or .tmpl) into a map of
// raw messages so callers can both detect key presence and decode sub-objects.
// The template's {{.AppName}} sits inside a string value, so encoding/json
// parses it directly.
func readPackageJSON(t *testing.T, path string) map[string]json.RawMessage {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("failed to read %s: %v", path, err)
	}
	var m map[string]json.RawMessage
	if err := json.Unmarshal(data, &m); err != nil {
		t.Fatalf("failed to parse %s as JSON: %v", path, err)
	}
	return m
}

// decodeDepMap decodes the named dependency object (e.g. "dependencies") into
// a name->version map. A missing key yields an empty map, not an error.
func decodeDepMap(t *testing.T, pkg map[string]json.RawMessage, key, path string) map[string]string {
	t.Helper()
	raw, ok := pkg[key]
	if !ok {
		return map[string]string{}
	}
	deps := map[string]string{}
	if err := json.Unmarshal(raw, &deps); err != nil {
		t.Fatalf("failed to parse %q in %s: %v", key, path, err)
	}
	return deps
}
