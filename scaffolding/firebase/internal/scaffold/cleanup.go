package scaffold

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func Cleanup(repoRoot, appName string) error {
	if err := ValidateAppName(appName); err != nil {
		return err
	}

	appDir := filepath.Join(repoRoot, appName)
	if _, err := os.Stat(appDir); os.IsNotExist(err) {
		return fmt.Errorf("app directory %q does not exist", appDir)
	}

	// Read hosting site from .firebaserc deploy targets
	siteName, err := FindHostingSite(repoRoot, appName)
	if err != nil {
		fmt.Printf("WARNING: %v\n", err)
	}

	// Delete Firebase hosting site
	if siteName != "" {
		fmt.Printf("Deleting Firebase hosting site %q...\n", siteName)
		cmd := exec.Command("npx", "firebase-tools", "hosting:sites:delete", siteName, "--force", "--project", "commons-systems")
		cmd.Dir = repoRoot
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			fmt.Printf("WARNING: failed to delete hosting site: %v\n", err)
		}
	}

	// Delete Firestore production namespace
	fmt.Printf("Deleting Firestore namespace %q...\n", appName+"-prod")
	nsCmd := exec.Command("npx", "tsx", "firestoreutil/bin/run-delete-namespace.ts")
	nsCmd.Dir = repoRoot
	nsCmd.Env = append(os.Environ(), "FIRESTORE_NAMESPACE="+appName+"-prod")
	nsCmd.Stdout = os.Stdout
	nsCmd.Stderr = os.Stderr
	if err := nsCmd.Run(); err != nil {
		fmt.Printf("WARNING: failed to delete Firestore namespace: %v\n", err)
	}

	// Remove hosting entry from firebase.json
	fmt.Println("Removing hosting entry from firebase.json...")
	config, err := ReadFirebaseConfig(repoRoot)
	if err != nil {
		return err
	}
	RemoveHostingEntry(config, appName)
	if err := WriteFirebaseConfig(repoRoot, config); err != nil {
		return fmt.Errorf("updating firebase.json: %w", err)
	}

	// Remove deploy target from .firebaserc
	fmt.Println("Removing deploy target from .firebaserc...")
	rc, err := ReadFirebaseRC(repoRoot)
	if err != nil {
		return err
	}
	RemoveHostingTarget(rc, appName)
	if err := WriteFirebaseRC(repoRoot, rc); err != nil {
		return fmt.Errorf("updating .firebaserc: %w", err)
	}

	// Remove workflow files
	fmt.Println("Removing workflow files...")
	workflowDir := filepath.Join(repoRoot, ".github", "workflows")
	entries, err := os.ReadDir(workflowDir)
	if err == nil {
		prefix := appName + "-"
		for _, entry := range entries {
			if !entry.IsDir() && len(entry.Name()) > len(prefix) && entry.Name()[:len(prefix)] == prefix {
				path := filepath.Join(workflowDir, entry.Name())
				fmt.Printf("  Removing %s\n", entry.Name())
				os.Remove(path)
			}
		}
	}

	// Remove app directory
	fmt.Printf("Removing app directory %s/...\n", appName)
	if err := os.RemoveAll(appDir); err != nil {
		return fmt.Errorf("removing app directory: %w", err)
	}

	fmt.Println()
	fmt.Println("Cleanup complete!")
	fmt.Printf("  Removed: %s/\n", appName)
	if siteName != "" {
		fmt.Printf("  Deleted hosting site: %s\n", siteName)
	}
	fmt.Printf("  Deleted Firestore namespace: %s-prod\n", appName)
	fmt.Println()

	return nil
}
