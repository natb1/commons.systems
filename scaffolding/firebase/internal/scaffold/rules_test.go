package scaffold

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func writeRulesFile(t *testing.T, dir, content string) string {
	t.Helper()
	path := filepath.Join(dir, "firestore.rules")
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
	return dir
}

func readRulesFile(t *testing.T, dir string) string {
	t.Helper()
	data, err := os.ReadFile(filepath.Join(dir, "firestore.rules"))
	if err != nil {
		t.Fatal(err)
	}
	return string(data)
}

const baseRules = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // SCAFFOLD MARKER: deny-all catch-all. Do not edit or move this comment.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`

func TestInsertFirestoreRules(t *testing.T) {
	t.Run("inserts rules before catch-all", func(t *testing.T) {
		dir := writeRulesFile(t, t.TempDir(), baseRules)

		if err := InsertFirestoreRules(dir, "myapp"); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		got := readRulesFile(t, dir)
		if !strings.Contains(got, "match /myapp/{env}/groups/{groupId}") {
			t.Error("expected groups rule block")
		}
		if !strings.Contains(got, "match /myapp/{env}/messages/{messageId}") {
			t.Error("expected messages rule block")
		}
		if !strings.Contains(got, "match /myapp/{env}/notes/{noteId}") {
			t.Error("expected notes rule block")
		}

		catchAllIdx := strings.Index(got, "// SCAFFOLD MARKER:")
		appIdx := strings.Index(got, "match /myapp/")
		if appIdx >= catchAllIdx {
			t.Error("app rules should appear before catch-all")
		}
	})

	t.Run("skips insertion when rules already exist", func(t *testing.T) {
		dir := writeRulesFile(t, t.TempDir(), baseRules)

		if err := InsertFirestoreRules(dir, "myapp"); err != nil {
			t.Fatalf("first insert error: %v", err)
		}
		afterFirst := readRulesFile(t, dir)

		if err := InsertFirestoreRules(dir, "myapp"); err != nil {
			t.Fatalf("second insert error: %v", err)
		}
		afterSecond := readRulesFile(t, dir)

		if afterFirst != afterSecond {
			t.Error("second insert should be a no-op but file changed")
		}
	})

	t.Run("errors when catch-all not found", func(t *testing.T) {
		dir := writeRulesFile(t, t.TempDir(), "rules_version = '2';\n")

		err := InsertFirestoreRules(dir, "myapp")
		if err == nil {
			t.Fatal("expected error for missing catch-all")
		}
		if !strings.Contains(err.Error(), "catch-all") {
			t.Errorf("error should mention catch-all, got: %v", err)
		}
	})
}

func TestInsertThenRemoveFirestoreRules(t *testing.T) {
	dir := writeRulesFile(t, t.TempDir(), baseRules)

	if err := InsertFirestoreRules(dir, "testapp"); err != nil {
		t.Fatalf("insert error: %v", err)
	}

	got := readRulesFile(t, dir)
	if !strings.Contains(got, "match /testapp/") {
		t.Fatal("expected testapp rules after insert")
	}

	if err := RemoveFirestoreRules(dir, "testapp"); err != nil {
		t.Fatalf("remove error: %v", err)
	}

	got = readRulesFile(t, dir)
	if got != baseRules {
		t.Errorf("after round-trip, rules should match baseRules.\ngot:\n%s\nwant:\n%s", got, baseRules)
	}
}

func TestRemoveFirestoreRules(t *testing.T) {
	t.Run("removes single block", func(t *testing.T) {
		rules := `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /myapp/{env}/messages/{messageId} {
      allow read: if true;
      allow write: if false;
    }

    // SCAFFOLD MARKER: deny-all catch-all. Do not edit or move this comment.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`
		dir := writeRulesFile(t, t.TempDir(), rules)

		if err := RemoveFirestoreRules(dir, "myapp"); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		got := readRulesFile(t, dir)
		if strings.Contains(got, "myapp") {
			t.Error("myapp rules should have been removed")
		}
		if !strings.Contains(got, "SCAFFOLD MARKER:") {
			t.Error("catch-all should remain")
		}
	})

	t.Run("no matching block returns nil", func(t *testing.T) {
		dir := writeRulesFile(t, t.TempDir(), baseRules)

		err := RemoveFirestoreRules(dir, "nonexistent")
		if err != nil {
			t.Fatalf("expected nil, got: %v", err)
		}
	})

	t.Run("errors on unbalanced braces", func(t *testing.T) {
		rules := `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /myapp/{env}/messages/{messageId} {
      allow read: if true;
`
		dir := writeRulesFile(t, t.TempDir(), rules)

		err := RemoveFirestoreRules(dir, "myapp")
		if err == nil {
			t.Fatal("expected error for unbalanced braces")
		}
		if !strings.Contains(err.Error(), "unbalanced braces") {
			t.Errorf("error should mention unbalanced braces, got: %v", err)
		}
	})
}
