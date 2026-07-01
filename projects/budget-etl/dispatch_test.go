package main

import (
	"os"
	"os/exec"
	"strings"
	"testing"
)

// TestDispatchDumpRouting verifies that the "dump" first argument routes to
// runDumpCmd. With no positional path argument, runDumpCmd prints its dedicated
// usage string and returns exit 1 — before any password resolution or file I/O,
// so the assertion is hermetic. The usage string ("Usage: dump ...") is unique
// to runDumpCmd, proving the dispatcher routed there rather than to legacy flag
// parsing.
func TestDispatchDumpRouting(t *testing.T) {
	cmd := exec.Command(os.Args[0], "dump")
	cmd.Env = subprocessEnvNoPassword()
	out, err := cmd.CombinedOutput()
	if err == nil {
		t.Fatalf("expected non-zero exit for `dump` with no path; output:\n%s", out)
	}
	if !strings.Contains(string(out), "Usage: dump [--keychain <name>] <path>") {
		t.Errorf("missing dump usage string (routing to runDumpCmd not confirmed); output:\n%s", out)
	}
}

// TestDispatchPatchRouting verifies that the "patch" first argument routes to
// runPatchCmd. With no --spec, runPatch returns "--spec is required" (checked
// before password resolution), which the command wraps as "Error: --spec is
// required" on stderr with exit 1.
func TestDispatchPatchRouting(t *testing.T) {
	cmd := exec.Command(os.Args[0], "patch")
	cmd.Env = subprocessEnvNoPassword()
	out, err := cmd.CombinedOutput()
	if err == nil {
		t.Fatalf("expected non-zero exit for `patch` with no --spec; output:\n%s", out)
	}
	if !strings.Contains(string(out), "--spec is required") {
		t.Errorf("missing '--spec is required' (routing to runPatchCmd not confirmed); output:\n%s", out)
	}
}

// TestDispatchLegacyFlagFallthrough verifies that a leading `-flag` argument is
// NOT hijacked by the subcommand switch and instead falls through to legacy
// flag parsing and validation. `-report x` without --allow-uncategorized hits
// the existing validation cascade and exits non-zero with the legacy error.
func TestDispatchLegacyFlagFallthrough(t *testing.T) {
	cmd := exec.Command(os.Args[0], "-report", "x")
	cmd.Env = subprocessEnvNoPassword()
	out, err := cmd.CombinedOutput()
	if err == nil {
		t.Fatalf("expected non-zero exit for legacy `-report x`; output:\n%s", out)
	}
	if !strings.Contains(string(out), "Error: --report requires --allow-uncategorized") {
		t.Errorf("missing legacy validation error (dispatcher should not hijack `-flag` args); output:\n%s", out)
	}
}
