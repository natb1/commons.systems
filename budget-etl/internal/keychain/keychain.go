package keychain

import (
	"fmt"
	"os/exec"
	"strings"
)

const serviceName = "budget-etl"

// Get retrieves the password for the given account from macOS Keychain.
func Get(account string) (string, error) {
	cmd := exec.Command("security", "find-generic-password",
		"-s", serviceName, "-a", account, "-w")
	out, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("no keychain entry for account %q (service %q): %w", account, serviceName, err)
	}
	return strings.TrimRight(string(out), "\n"), nil
}

// Set stores the password for the given account in macOS Keychain.
// Overwrites any existing entry for the same service/account pair.
func Set(account, password string) error {
	// Delete existing entry (ignore error if not found)
	del := exec.Command("security", "delete-generic-password",
		"-s", serviceName, "-a", account)
	_ = del.Run()

	cmd := exec.Command("security", "add-generic-password",
		"-s", serviceName, "-a", account, "-w", password)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("storing password in keychain for account %q: %w", account, err)
	}
	return nil
}
