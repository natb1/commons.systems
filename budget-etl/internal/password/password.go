// Package password resolves the budget-etl decryption password from a fixed
// precedence chain — environment variable, then macOS Keychain — and returns a
// single self-describing error when neither source is available. All three
// entrypoints (budget-etl, cmd/dump, cmd/patch) go through Resolve so the
// resolution rules and failure message stay identical across them.
package password

import (
	"fmt"
	"log"
	"os"

	"github.com/natb1/commons.systems/budget-etl/internal/keychain"
)

// EnvVar is the environment variable that supplies the decryption password
// when set. It takes precedence over --keychain so non-macOS hosts can
// resolve the password without the macOS `security` tool.
const EnvVar = "BUDGET_ETL_PASSWORD"

// Resolve returns the budget-etl decryption password. Sources checked in
// order: BUDGET_ETL_PASSWORD env var, then keychain (when keychainAccount is
// non-empty). Returns an error naming both sources when neither resolves.
func Resolve(keychainAccount string) (string, error) {
	if envPw := os.Getenv(EnvVar); envPw != "" {
		log.Printf("using password from %s env var", EnvVar)
		if keychainAccount != "" {
			log.Printf("ignoring --keychain %q because %s is set", keychainAccount, EnvVar)
		}
		return envPw, nil
	}
	if keychainAccount != "" {
		pw, err := keychain.Get(keychainAccount)
		if err != nil {
			return "", err
		}
		log.Printf("retrieved password from keychain (account: %s)", keychainAccount)
		return pw, nil
	}
	return "", fmt.Errorf(
		"no password source: set %s (e.g. `export %s=\"$(pass show budget-etl/main)\"`) or pass --keychain <account> on macOS",
		EnvVar, EnvVar,
	)
}
