package scaffold

import (
	"os"
	"path/filepath"
	"testing"
)

func TestValidateAppName(t *testing.T) {
	tests := []struct {
		name    string
		wantErr bool
	}{
		{"demo", false},
		{"my-app", false},
		{"app123", false},
		{"a", false},
		{"a-very-long-name-here", true},  // 21 chars
		{"", true},                        // empty
		{"Demo", true},                    // uppercase
		{"123app", true},                  // starts with number
		{"-app", true},                    // starts with hyphen
		{"my app", true},                  // space
		{"my_app", true},                  // underscore
		{"authutil", true},                // reserved
		{"firestoreutil", true},           // reserved
		{"scaffolding", true},             // reserved
		{"node_modules", true},            // reserved (also fails regex)
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateAppName(tt.name)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateAppName(%q) error = %v, wantErr %v", tt.name, err, tt.wantErr)
			}
		})
	}
}

func TestValidateAppNotExists(t *testing.T) {
	tmpDir := t.TempDir()

	t.Run("non-existent directory passes", func(t *testing.T) {
		err := ValidateAppNotExists(tmpDir, "newapp")
		if err != nil {
			t.Errorf("expected nil, got %v", err)
		}
	})

	t.Run("existing directory fails", func(t *testing.T) {
		os.Mkdir(filepath.Join(tmpDir, "existing"), 0o755)
		err := ValidateAppNotExists(tmpDir, "existing")
		if err == nil {
			t.Error("expected error for existing directory")
		}
	})
}
