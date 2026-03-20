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
