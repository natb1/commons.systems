package password

import (
	"strings"
	"testing"
)

func TestResolve_EnvVarPrecedence(t *testing.T) {
	t.Setenv(EnvVar, "from-env")
	// Pass a keychain account even though the env var is set; Resolve must
	// not touch the keychain. The `security` binary is not available in CI,
	// so any keychain attempt would error — proving precedence works.
	got, err := Resolve("budget")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != "from-env" {
		t.Fatalf("expected env-var value, got %q", got)
	}
}

func TestResolve_EnvVarOnly(t *testing.T) {
	t.Setenv(EnvVar, "from-env")
	got, err := Resolve("")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != "from-env" {
		t.Fatalf("expected env-var value, got %q", got)
	}
}

func TestResolve_NeitherSource(t *testing.T) {
	t.Setenv(EnvVar, "")
	_, err := Resolve("")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	msg := err.Error()
	for _, want := range []string{
		"no password source",
		EnvVar,
		"--keychain",
		`pass show budget-etl/main`,
	} {
		if !strings.Contains(msg, want) {
			t.Errorf("error message missing %q\n  got: %s", want, msg)
		}
	}
}
