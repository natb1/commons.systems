package scaffold

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// RemoveFirestoreRules removes the rules block for appName from firestore.rules.
// If no block is found, it logs a note and returns nil (not an error).
func RemoveFirestoreRules(repoRoot, appName string) error {
	rulesPath := filepath.Join(repoRoot, "firestore.rules")
	content, err := os.ReadFile(rulesPath)
	if err != nil {
		return fmt.Errorf("reading firestore.rules: %w", err)
	}

	lines := strings.Split(string(content), "\n")
	beginMarker := "// BEGIN: " + appName
	endMarker := "// END: " + appName

	beginLine := -1
	endLine := -1
	for i, line := range lines {
		if strings.Contains(line, beginMarker) {
			beginLine = i
		}
		if strings.Contains(line, endMarker) {
			endLine = i
		}
	}

	if beginLine == -1 {
		fmt.Printf("NOTE: no rules block for %q found in firestore.rules (may have been added manually)\n", appName)
		return nil
	}
	if endLine == -1 {
		return fmt.Errorf("found BEGIN marker but no END marker for %q in firestore.rules", appName)
	}

	// Include blank line before BEGIN if present
	start := beginLine
	if start > 0 && strings.TrimSpace(lines[start-1]) == "" {
		start--
	}

	// Remove lines from start to endLine inclusive
	updated := make([]string, 0, len(lines))
	updated = append(updated, lines[:start]...)
	updated = append(updated, lines[endLine+1:]...)
	return os.WriteFile(rulesPath, []byte(strings.Join(updated, "\n")), 0o644)
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
		fmt.Printf("WARNING: %v\n", err)
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
				fmt.Printf("WARNING: failed to delete hosting site: %v\n", err)
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
		fmt.Printf("[dry-run] Would delete Firestore namespace %q\n", appName+"-prod")
	} else {
		fmt.Printf("Deleting Firestore namespace %q...\n", appName+"-prod")
		nsCmd := exec.Command("npx", "tsx", "firestoreutil/bin/run-delete-namespace.ts")
		nsCmd.Dir = repoRoot
		nsCmd.Env = append(os.Environ(), "FIRESTORE_NAMESPACE="+appName+"-prod")
		nsCmd.Stdout = os.Stdout
		nsCmd.Stderr = os.Stderr
		if err := nsCmd.Run(); err != nil {
			fmt.Printf("WARNING: failed to delete Firestore namespace: %v\n", err)
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
			fmt.Printf("WARNING: failed to remove Firestore rules block: %v\n", err)
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

	// Remove workflow files
	workflowDir := filepath.Join(repoRoot, ".github", "workflows")
	entries, err := os.ReadDir(workflowDir)
	if err != nil {
		if !os.IsNotExist(err) {
			fmt.Printf("WARNING: could not read workflow directory: %v\n", err)
			warnings++
		}
	} else {
		prefix := appName + "-"
		for _, entry := range entries {
			if !entry.IsDir() && strings.HasPrefix(entry.Name(), prefix) {
				if dryRun {
					fmt.Printf("[dry-run] Would remove %s\n", entry.Name())
				} else {
					path := filepath.Join(workflowDir, entry.Name())
					fmt.Printf("  Removing %s\n", entry.Name())
					if err := os.Remove(path); err != nil {
						fmt.Printf("WARNING: failed to remove %s: %v\n", entry.Name(), err)
						warnings++
					}
				}
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
			fmt.Printf("  Deleted Firestore namespace: %s-prod\n", appName)
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
