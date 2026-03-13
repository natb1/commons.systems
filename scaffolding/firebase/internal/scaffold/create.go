package scaffold

import (
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"text/template"
)

type AppData struct {
	AppName  string
	SiteName string
}

// Title returns the app name with the first letter capitalized.
func (d AppData) Title() string {
	if len(d.AppName) == 0 {
		return ""
	}
	return strings.ToUpper(d.AppName[:1]) + d.AppName[1:]
}

// ProductionURL returns the production URL for the app's hosting site.
func (d AppData) ProductionURL() string { return "https://" + d.SiteName + ".web.app" }

// NewAppData creates an AppData with the given app and site names.
// Returns an error if appName fails validation.
func NewAppData(appName, siteName string) (AppData, error) {
	if err := ValidateAppName(appName); err != nil {
		return AppData{}, err
	}
	return AppData{
		AppName:  appName,
		SiteName: siteName,
	}, nil
}

func Create(repoRoot, appName string, templateFS fs.FS, dryRun bool) (err error) {
	// Validate early: must check before hosting site creation so we fail fast.
	// NewAppData validates independently for external callers who skip Create.
	if err := ValidateAppName(appName); err != nil {
		return err
	}
	if err := ValidateAppNotExists(repoRoot, appName); err != nil {
		return err
	}

	projectID, err := ReadProjectID(repoRoot)
	if err != nil {
		return err
	}

	siteName, err := GenerateSiteName(appName)
	if err != nil {
		return fmt.Errorf("generating site name: %w", err)
	}

	// Create Firebase hosting site
	if dryRun {
		fmt.Printf("[dry-run] Would create Firebase hosting site %q in project %q\n", siteName, projectID)
	} else {
		fmt.Printf("Creating Firebase hosting site %q...\n", siteName)
		cmd := exec.Command("npx", "firebase-tools", "hosting:sites:create", siteName, "--project", projectID)
		cmd.Dir = repoRoot
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("creating Firebase hosting site: %w", err)
		}
	}

	siteCreated := !dryRun
	defer func() {
		if err != nil && siteCreated {
			fmt.Printf("HINT: hosting site %q was created but subsequent steps failed. Run `scaffold cleanup %s` to clean up.\n", siteName, appName)
		}
	}()

	data, err := NewAppData(appName, siteName)
	if err != nil {
		return err
	}

	// Render app templates
	if dryRun {
		fmt.Printf("[dry-run] Would render app templates into %s/\n", appName)
	} else {
		fmt.Printf("Rendering app templates into %s/...\n", appName)
		if err := renderTemplates(templateFS, repoRoot, "templates/app", appName, data); err != nil {
			return fmt.Errorf("rendering app templates: %w", err)
		}
	}

	// Update firebase.json
	if dryRun {
		fmt.Printf("[dry-run] Would add hosting entry for %q to firebase.json\n", appName)
	} else {
		fmt.Println("Updating firebase.json...")
		config, err := ReadFirebaseConfig(repoRoot)
		if err != nil {
			return err
		}
		if err := AddHostingEntry(config, appName); err != nil {
			return err
		}
		if err := WriteFirebaseConfig(repoRoot, config); err != nil {
			return err
		}
	}

	// Add deploy target to .firebaserc
	if dryRun {
		fmt.Printf("[dry-run] Would add hosting target %q → %q to .firebaserc\n", appName, siteName)
	} else {
		fmt.Println("Adding deploy target to .firebaserc...")
		rc, err := ReadFirebaseRC(repoRoot)
		if err != nil {
			return err
		}
		if err := AddHostingTarget(rc, appName, siteName); err != nil {
			return err
		}
		if err := WriteFirebaseRC(repoRoot, rc); err != nil {
			return err
		}
	}

	// Update firestore.rules with default rules block for this app
	if dryRun {
		fmt.Printf("[dry-run] Would insert rules block for %q into firestore.rules\n", appName)
	} else {
		fmt.Println("Updating firestore.rules...")
		if err := InsertFirestoreRules(repoRoot, appName); err != nil {
			return fmt.Errorf("inserting Firestore rules: %w", err)
		}
	}

	fmt.Println()
	if dryRun {
		fmt.Println("[dry-run] App creation plan complete. No changes were made.")
	} else {
		fmt.Println("App created successfully!")
	}
	fmt.Println()
	fmt.Printf("  App directory:  %s/\n", appName)
	fmt.Printf("  Hosting site:   %s\n", siteName)
	fmt.Printf("  Production URL: %s\n", data.ProductionURL())
	fmt.Println()
	if !dryRun {
		fmt.Println("Next steps:")
		fmt.Printf("  cd %s && npm install\n", appName)
		fmt.Printf("  # Run unit tests:       .claude/skills/ref-pr-workflow/scripts/run-unit-tests.sh --app %s\n", appName)
		fmt.Printf("  # Run lint:             .claude/skills/ref-pr-workflow/scripts/run-lint.sh --app %s\n", appName)
		fmt.Printf("  # Run acceptance tests: .claude/skills/ref-pr-workflow/scripts/run-acceptance-tests.sh %s\n", appName)
		fmt.Println()
	}

	return nil
}

const firestoreRulesCatchAll = "// SCAFFOLD MARKER: deny-all catch-all. Do not edit or move this comment."

// InsertFirestoreRules inserts a default rules block for appName into firestore.rules,
// just before the deny-all catch-all rule. Rules use the literal app name as a
// top-level path segment (e.g. match /myapp/{env}/messages/{messageId}).
func InsertFirestoreRules(repoRoot, appName string) error {
	rulesPath := filepath.Join(repoRoot, "firestore.rules")
	raw, err := os.ReadFile(rulesPath)
	if err != nil {
		return fmt.Errorf("reading firestore.rules: %w", err)
	}

	content := string(raw)

	if strings.Contains(content, "match /"+appName+"/") {
		fmt.Printf("NOTE: rules for %q already exist in firestore.rules, skipping insertion\n", appName)
		return nil
	}

	block := fmt.Sprintf(
		"    // Groups are readable only by their members (email-based membership).\n"+
			"    // Uses resource.data directly instead of get() because getUserGroups\n"+
			"    // performs a list query that Firestore cannot resolve with get() calls.\n"+
			"    match /%s/{env}/groups/{groupId} {\n"+
			"      allow read: if request.auth != null && request.auth.token.email in resource.data.members;\n"+
			"      allow write: if false;\n"+
			"    }\n\n"+
			"    match /%s/{env}/messages/{messageId} {\n"+
			"      allow read: if true;\n"+
			"      allow write: if false;\n"+
			"    }\n\n"+
			"    // Notes are scoped to group members via denormalized memberEmails\n"+
			"    match /%s/{env}/notes/{noteId} {\n"+
			"      allow read: if request.auth != null\n"+
			"        && request.auth.token.email in resource.data.memberEmails;\n"+
			"      allow write: if false;\n"+
			"    }\n\n",
		appName, appName, appName)

	catchAll := "    " + firestoreRulesCatchAll
	idx := strings.Index(content, catchAll)
	if idx == -1 {
		return fmt.Errorf("could not find catch-all rule in firestore.rules")
	}

	updated := content[:idx] + block + content[idx:]
	return os.WriteFile(rulesPath, []byte(updated), 0o644)
}

func renderTemplates(templateFS fs.FS, repoRoot, templateDir, outputDir string, data AppData) error {
	return fs.WalkDir(templateFS, templateDir, func(embedPath string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		relPath, err := filepath.Rel(templateDir, embedPath)
		if err != nil {
			return fmt.Errorf("computing relative path for %s: %w", embedPath, err)
		}
		relPath = strings.ReplaceAll(relPath, "{{.AppName}}", data.AppName)
		relPath = strings.TrimSuffix(relPath, ".tmpl")

		outPath := filepath.Join(repoRoot, outputDir, relPath)

		if d.IsDir() {
			return os.MkdirAll(outPath, 0o755)
		}

		content, err := fs.ReadFile(templateFS, embedPath)
		if err != nil {
			return fmt.Errorf("reading template %s: %w", embedPath, err)
		}

		if strings.HasSuffix(embedPath, ".tmpl") {
			tmpl, err := template.New(filepath.Base(embedPath)).Parse(string(content))
			if err != nil {
				return fmt.Errorf("parsing template %s: %w", embedPath, err)
			}
			var buf strings.Builder
			if err := tmpl.Execute(&buf, data); err != nil {
				return fmt.Errorf("executing template %s: %w", embedPath, err)
			}
			content = []byte(buf.String())
		}

		// Preserve executable bit from source; default to 0o644 for non-executable files.
		mode := fs.FileMode(0o644)
		if info, err := d.Info(); err == nil && info.Mode()&0o111 != 0 {
			mode = 0o755
		}

		if err := os.MkdirAll(filepath.Dir(outPath), 0o755); err != nil {
			return err
		}
		return os.WriteFile(outPath, content, mode)
	})
}
