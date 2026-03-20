package keychain

import (
	"errors"
	"fmt"
	"os/exec"
	"strings"
)

const serviceName = "budget-etl"

// Get retrieves the password for the given account from macOS Keychain
// (service "budget-etl"). Store passwords with:
//
//	security add-generic-password -s budget-etl -a <account> -w
//	# -w prompts for password interactively
func Get(account string) (string, error) {
	cmd := exec.Command("security", "find-generic-password",
		"-s", serviceName, "-a", account, "-w")
	out, err := cmd.Output()
	if err != nil {
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) && len(exitErr.Stderr) > 0 {
			return "", fmt.Errorf("no keychain entry for account %q (service %q): %s", account, serviceName, strings.TrimSpace(string(exitErr.Stderr)))
		}
		return "", fmt.Errorf("no keychain entry for account %q (service %q): %w", account, serviceName, err)
	}
	password := strings.TrimRight(string(out), "\n")
	if password == "" {
		return "", fmt.Errorf("keychain entry for account %q (service %q) exists but is empty", account, serviceName)
	}
	return password, nil
}
