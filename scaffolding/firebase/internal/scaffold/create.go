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
func (d AppData) Title() string { return strings.ToUpper(d.AppName[:1]) + d.AppName[1:] }

// ProductionURL returns the production URL for the app's hosting site.
func (d AppData) ProductionURL() string { return "https://" + d.SiteName + ".web.app" }

// NewAppData creates an AppData with the given app and site names.
func NewAppData(appName, siteName string) AppData {
	if len(appName) == 0 {
		panic("NewAppData: appName must not be empty")
	}
	return AppData{
		AppName:  appName,
		SiteName: siteName,
	}
}

func Create(repoRoot, appName string, templateFS fs.FS) (err error) {
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
	fmt.Printf("Creating Firebase hosting site %q...\n", siteName)
	cmd := exec.Command("npx", "firebase-tools", "hosting:sites:create", siteName, "--project", projectID)
	cmd.Dir = repoRoot
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("creating Firebase hosting site: %w", err)
	}

	var siteCreated bool
	siteCreated = true
	defer func() {
		if err != nil && siteCreated {
			fmt.Printf("HINT: hosting site %q was created but subsequent steps failed. Run `scaffold cleanup %s` to clean up.\n", siteName, appName)
		}
	}()

	data := NewAppData(appName, siteName)

	// Render app templates
	fmt.Printf("Rendering app templates into %s/...\n", appName)
	if err := renderTemplates(templateFS, repoRoot, "templates/app", appName, data); err != nil {
		return fmt.Errorf("rendering app templates: %w", err)
	}

	// Render workflow templates
	fmt.Println("Rendering workflow templates...")
	if err := renderTemplates(templateFS, repoRoot, "templates/workflows", filepath.Join(".github", "workflows"), data); err != nil {
		return fmt.Errorf("rendering workflow templates: %w", err)
	}

	// Update firebase.json
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

	// Add deploy target to .firebaserc
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

	fmt.Println()
	fmt.Println("App created successfully!")
	fmt.Println()
	fmt.Printf("  App directory:  %s/\n", appName)
	fmt.Printf("  Hosting site:   %s\n", siteName)
	fmt.Printf("  Production URL: %s\n", data.ProductionURL())
	fmt.Println()
	fmt.Println("Next steps:")
	fmt.Printf("  cd %s && npm install\n", appName)
	fmt.Printf("  # Run unit tests:       .claude/skills/ref-pr-workflow/scripts/run-unit-tests.sh %s\n", appName)
	fmt.Printf("  # Run acceptance tests:  .claude/skills/ref-pr-workflow/scripts/run-acceptance-tests.sh %s\n", appName)
	fmt.Println()

	return nil
}

func renderTemplates(templateFS fs.FS, repoRoot, templateDir, outputDir string, data AppData) error {
	return fs.WalkDir(templateFS, templateDir, func(embedPath string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		// Compute relative path from template dir
		relPath, err := filepath.Rel(templateDir, embedPath)
		if err != nil {
			return fmt.Errorf("computing relative path for %s: %w", embedPath, err)
		}

		// Replace {{.AppName}} in directory/file names
		relPath = strings.ReplaceAll(relPath, "{{.AppName}}", data.AppName)

		// Strip .tmpl extension
		relPath = strings.TrimSuffix(relPath, ".tmpl")

		outPath := filepath.Join(repoRoot, outputDir, relPath)

		if d.IsDir() {
			return os.MkdirAll(outPath, 0o755)
		}

		// Read template content
		content, err := fs.ReadFile(templateFS, embedPath)
		if err != nil {
			return fmt.Errorf("reading template %s: %w", embedPath, err)
		}

		// If it's a .tmpl file, process as template
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

		if err := os.MkdirAll(filepath.Dir(outPath), 0o755); err != nil {
			return err
		}
		return os.WriteFile(outPath, content, 0o644)
	})
}
