package scaffold

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// RemoveFirestoreRules removes all rule blocks for appName from firestore.rules.
// Rules are identified by path pattern (match /<appName>/...) rather than markers.
// Each removed block also strips immediately preceding comment lines and adjacent blank lines.
// If no rules are found, it logs a note and returns nil (not an error).
func RemoveFirestoreRules(repoRoot, appName string) error {
	rulesPath := filepath.Join(repoRoot, "firestore.rules")
	content, err := os.ReadFile(rulesPath)
	if err != nil {
		return fmt.Errorf("reading firestore.rules: %w", err)
	}

	lines := strings.Split(string(content), "\n")
	matchPrefix := "match /" + appName + "/"

	var result []string
	found := false
	i := 0
	for i < len(lines) {
		if strings.HasPrefix(strings.TrimSpace(lines[i]), matchPrefix) {
			found = true
			// Pop preceding comment lines (e.g. "// Messages are publicly readable")
			for len(result) > 0 && strings.HasPrefix(strings.TrimSpace(result[len(result)-1]), "//") {
				result = result[:len(result)-1]
			}
			// Remove preceding blank line if present
			if len(result) > 0 && strings.TrimSpace(result[len(result)-1]) == "" {
				result = result[:len(result)-1]
			}
			// Skip block by counting braces
			depth := 0
			for i < len(lines) {
				for _, ch := range lines[i] {
					if ch == '{' {
						depth++
					}
					if ch == '}' {
						depth--
					}
				}
				i++
				if depth == 0 {
					break
				}
			}
			if depth != 0 {
				return fmt.Errorf("unbalanced braces in rules block for %q (depth %d)", appName, depth)
			}
			// Skip trailing blank line after block
			if i < len(lines) && strings.TrimSpace(lines[i]) == "" {
				i++
			}
			continue
		}
		result = append(result, lines[i])
		i++
	}

	if !found {
		fmt.Printf("NOTE: no rules for %q found in firestore.rules\n", appName)
		return nil
	}
	return os.WriteFile(rulesPath, []byte(strings.Join(result, "\n")), 0o644)
}

func Cleanup(repoRoot, appName string, dryRun bool) error {
	if err := ValidateAppName(appName); err != nil {
		return err
	}

	appDir := filepath.Join(repoRoot, appName)
	info, err := os.Stat(appDir)
	if err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("app directory %q does not exist", appDir)
		}
		return fmt.Errorf("checking app directory %q: %w", appDir, err)
	}
	if !info.IsDir() {
		return fmt.Errorf("%q is not a directory", appDir)
	}

	warnings := 0

	rc, err := ReadFirebaseRC(repoRoot)
	if err != nil {
		return err
	}

	projectID, err := rc.DefaultProjectID()
	if err != nil {
		return err
	}

	siteName, err := FindHostingSite(rc, appName)
	if err != nil {
		fmt.Fprintf(os.Stderr, "WARNING: %v\n", err)
		warnings++
	}

	// Delete Firebase hosting site
	var hostingDeleted bool
	if siteName != "" {
		if dryRun {
			fmt.Printf("[dry-run] Would delete Firebase hosting site %q from project %q\n", siteName, projectID)
		} else {
			fmt.Printf("Deleting Firebase hosting site %q...\n", siteName)
			cmd := exec.Command("npx", "firebase-tools", "hosting:sites:delete", siteName, "--force", "--project", projectID)
			cmd.Dir = repoRoot
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr
			if err := cmd.Run(); err != nil {
				fmt.Fprintf(os.Stderr, "WARNING: failed to delete hosting site: %v\n", err)
				warnings++
			} else {
				hostingDeleted = true
			}
		}
	}

	// Delete Firestore production namespace.
	// Preview namespaces are cleaned by the PR close workflow (run-cleanup-preview.sh),
	// so only the prod namespace needs cleanup here.
	var firestoreDeleted bool
	if dryRun {
		fmt.Printf("[dry-run] Would delete Firestore namespace %q\n", appName+"/prod")
	} else {
		fmt.Printf("Deleting Firestore namespace %q...\n", appName+"/prod")
		nsCmd := exec.Command("npx", "tsx", "firestoreutil/bin/run-delete-namespace.ts")
		nsCmd.Dir = repoRoot
		nsCmd.Env = append(os.Environ(), "FIRESTORE_NAMESPACE="+appName+"/prod")
		nsCmd.Stdout = os.Stdout
		nsCmd.Stderr = os.Stderr
		if err := nsCmd.Run(); err != nil {
			fmt.Fprintf(os.Stderr, "WARNING: failed to delete Firestore namespace: %v\n", err)
			warnings++
		} else {
			firestoreDeleted = true
		}
	}

	// Remove app rules block from firestore.rules
	if dryRun {
		fmt.Printf("[dry-run] Would remove rules block for %q from firestore.rules\n", appName)
	} else {
		fmt.Println("Removing rules block from firestore.rules...")
		if err := RemoveFirestoreRules(repoRoot, appName); err != nil {
			fmt.Fprintf(os.Stderr, "WARNING: failed to remove Firestore rules block: %v\n", err)
			warnings++
		}
	}

	// Remove hosting entry from firebase.json
	if dryRun {
		fmt.Printf("[dry-run] Would remove hosting entry for %q from firebase.json\n", appName)
	} else {
		fmt.Println("Removing hosting entry from firebase.json...")
		config, err := ReadFirebaseConfig(repoRoot)
		if err != nil {
			return err
		}
		RemoveHostingEntry(config, appName)
		if err := WriteFirebaseConfig(repoRoot, config); err != nil {
			return fmt.Errorf("updating firebase.json: %w", err)
		}
	}

	// Remove deploy target from .firebaserc
	if dryRun {
		fmt.Printf("[dry-run] Would remove hosting target %q from .firebaserc\n", appName)
	} else {
		fmt.Println("Removing deploy target from .firebaserc...")
		if err := RemoveHostingTarget(rc, appName); err != nil {
			return err
		}
		if err := WriteFirebaseRC(repoRoot, rc); err != nil {
			return fmt.Errorf("updating .firebaserc: %w", err)
		}
	}

	// Remove app path triggers from consolidated workflow files
	for _, wf := range []struct {
		name   string
		remove func(string, string) error
	}{
		{"unit-tests.yml", RemoveUnitTestsPath},
		{"pr-checks.yml", RemovePRChecksPath},
		{"prod-deploy.yml", RemoveProdDeployPath},
	} {
		if dryRun {
			fmt.Printf("[dry-run] Would remove %q path trigger from %s\n", appName, wf.name)
		} else {
			fmt.Printf("Removing path trigger from %s...\n", wf.name)
			if err := wf.remove(repoRoot, appName); err != nil {
				fmt.Fprintf(os.Stderr, "WARNING: failed to update %s: %v\n", wf.name, err)
				warnings++
			}
		}
	}

	// Remove app directory
	if dryRun {
		fmt.Printf("[dry-run] Would remove app directory %s/\n", appName)
	} else {
		fmt.Printf("Removing app directory %s/...\n", appName)
		if err := os.RemoveAll(appDir); err != nil {
			return fmt.Errorf("removing app directory: %w", err)
		}
	}

	fmt.Println()
	if dryRun {
		fmt.Println("[dry-run] Cleanup plan complete. No changes were made.")
	} else {
		if warnings > 0 {
			fmt.Printf("Cleanup completed with %d warning(s).\n", warnings)
		} else {
			fmt.Println("Cleanup complete!")
		}
		fmt.Printf("  Removed: %s/\n", appName)
		if hostingDeleted {
			fmt.Printf("  Deleted hosting site: %s\n", siteName)
		} else if siteName != "" {
			fmt.Printf("  SKIPPED hosting site deletion (see warnings above)\n")
		}
		if firestoreDeleted {
			fmt.Printf("  Deleted Firestore namespace: %s/prod\n", appName)
		} else {
			fmt.Printf("  SKIPPED Firestore namespace deletion (see warnings above)\n")
		}
	}
	fmt.Println()

	if warnings > 0 {
		return fmt.Errorf("cleanup completed with %d warning(s)", warnings)
	}
	return nil
}
