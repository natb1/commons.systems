// Package password resolves the budget-etl decryption password from a fixed
// precedence chain — environment variable, then macOS Keychain — and returns a
// single self-describing error when neither source is available. All three
// entrypoints (budget-etl, cmd/dump, cmd/patch) go through Resolve so the
// resolution rules and failure message stay identical across them.
package password

import (
	"fmt"
	"os"

	"github.com/natb1/commons.systems/budget-etl/internal/keychain"
)

// EnvVar takes precedence over --keychain so non-macOS hosts can resolve the
// password without the macOS `security` tool.
const EnvVar = "BUDGET_ETL_PASSWORD"

// UsageNote is the precedence sentence cmd flag.Usage banners print so all
// three entrypoints stay in sync with Resolve's actual behavior.
const UsageNote = "Password sources (checked in order): " + EnvVar + " env var, then --keychain (macOS only). Both unset fails fast."

// Resolve returns the decryption password, preferring EnvVar over keychainAccount.
func Resolve(keychainAccount string) (string, error) {
	if envPw := os.Getenv(EnvVar); envPw != "" {
		return envPw, nil
	}
	if keychainAccount != "" {
		return keychain.Get(keychainAccount)
	}
	return "", fmt.Errorf(
		"no password source: set %s (e.g. `export %s=\"$(pass show budget-etl/main)\"`) or pass --keychain <account> on macOS",
		EnvVar, EnvVar,
	)
}
