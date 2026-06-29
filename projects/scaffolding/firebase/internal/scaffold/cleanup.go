package scaffold

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// RemoveFirestoreRules removes the SCAFFOLD-marked rule block for appName from
// firestore.rules. The block is the contiguous span between the
// "// SCAFFOLD BEGIN <app>" and "// SCAFFOLD END <app>" marker lines (inclusive),
// plus the single blank line that immediately follows END.
//
// Three boundary cases:
//  1. BEGIN marker present  → the marker span is deleted.
//  2. No BEGIN marker, but lines with prefix "match /<app>/" present → returns an
//     error, because the rules exist without SCAFFOLD markers and so must be
//     removed manually (this is the case for pre-marker apps).
//  3. Neither marker nor prefix → logs a note and returns nil (not an error).
func RemoveFirestoreRules(repoRoot, appName string) error {
	rulesPath := filepath.Join(repoRoot, "firestore.rules")
	content, err := os.ReadFile(rulesPath)
	if err != nil {
		return fmt.Errorf("reading firestore.rules: %w", err)
	}

	lines := strings.Split(string(content), "\n")
	beginMarker := scaffoldBeginMarker(appName)
	endMarker := scaffoldEndMarker(appName)
	matchPrefix := "match /" + appName + "/"

	begin := -1
	for i, line := range lines {
		if strings.TrimSpace(line) == beginMarker {
			begin = i
			break
		}
	}

	if begin == -1 {
		// No marker span. Distinguish a pre-marker app (rules present without
		// markers) from a genuinely absent app.
		for _, line := range lines {
			if strings.HasPrefix(strings.TrimSpace(line), matchPrefix) {
				return fmt.Errorf("rules for %q exist in firestore.rules but have no SCAFFOLD markers; remove the block manually", appName)
			}
		}
		fmt.Printf("NOTE: no rules for %q found in firestore.rules\n", appName)
		return nil
	}

	end := -1
	for i := begin + 1; i < len(lines); i++ {
		if strings.TrimSpace(lines[i]) == endMarker {
			end = i
			break
		}
	}
	if end == -1 {
		return fmt.Errorf("found %q but no matching %q in firestore.rules", beginMarker, endMarker)
	}

	// Drop [begin..end] inclusive, plus one immediately-following blank line.
	dropEnd := end + 1
	if dropEnd < len(lines) && strings.TrimSpace(lines[dropEnd]) == "" {
		dropEnd++
	}

	result := append(append([]string{}, lines[:begin]...), lines[dropEnd:]...)
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

	// Remove app from package.json workspaces
	if dryRun {
		fmt.Printf("[dry-run] Would remove %q from package.json workspaces\n", appName)
	} else {
		fmt.Println("Removing from package.json workspaces...")
		pkg, err := ReadPackageJSON(repoRoot)
		if err != nil {
			return err
		}
		if !RemoveWorkspace(pkg, appName) {
			fmt.Printf("NOTE: workspace %q not found in package.json\n", appName)
		}
		if err := WritePackageJSON(repoRoot, pkg); err != nil {
			return fmt.Errorf("updating package.json: %w", err)
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
