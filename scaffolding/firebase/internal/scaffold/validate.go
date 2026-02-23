package scaffold

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
)

var appNameRegex = regexp.MustCompile(`^[a-z][a-z0-9-]*$`)

var reservedNames = map[string]bool{
	"authutil":      true,
	"firebaseutil":  true,
	"firestoreutil": true,
	"style":         true,
	"scaffolding":   true,
	"node_modules":  true,
	"dist":          true,
}

func ValidateAppName(name string) error {
	if len(name) == 0 {
		return fmt.Errorf("app name cannot be empty")
	}
	if len(name) > 20 {
		return fmt.Errorf("app name must be 20 characters or fewer (got %d)", len(name))
	}
	if !appNameRegex.MatchString(name) {
		return fmt.Errorf("app name must match ^[a-z][a-z0-9-]*$ (got %q)", name)
	}
	if reservedNames[name] {
		return fmt.Errorf("app name %q is reserved", name)
	}
	return nil
}

func ValidateAppNotExists(repoRoot, name string) error {
	appDir := filepath.Join(repoRoot, name)
	if _, err := os.Stat(appDir); err == nil {
		return fmt.Errorf("directory %q already exists", appDir)
	}
	return nil
}
