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
	AppName       string
	Title         string
	SiteName      string
	ProductionURL string
}

func Create(repoRoot, appName string, templateFS fs.FS) error {
	if err := ValidateAppName(appName); err != nil {
		return err
	}
	if err := ValidateAppNotExists(repoRoot, appName); err != nil {
		return err
	}

	siteName, err := GenerateSiteName(appName)
	if err != nil {
		return fmt.Errorf("generating site name: %w", err)
	}

	// Create Firebase hosting site
	fmt.Printf("Creating Firebase hosting site %q...\n", siteName)
	cmd := exec.Command("npx", "firebase-tools", "hosting:sites:create", siteName, "--project", "commons-systems")
	cmd.Dir = repoRoot
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("creating Firebase hosting site: %w", err)
	}

	data := AppData{
		AppName:       appName,
		Title:         strings.ToUpper(appName[:1]) + appName[1:],
		SiteName:      siteName,
		ProductionURL: "https://" + siteName + ".web.app",
	}

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
	AddHostingEntry(config, appName)
	if err := WriteFirebaseConfig(repoRoot, config); err != nil {
		return err
	}

	// Add deploy target to .firebaserc
	fmt.Println("Adding deploy target to .firebaserc...")
	rc, err := ReadFirebaseRC(repoRoot)
	if err != nil {
		return err
	}
	AddHostingTarget(rc, appName, siteName)
	if err := WriteFirebaseRC(repoRoot, rc); err != nil {
		return err
	}

	fmt.Println()
	fmt.Println("App created successfully!")
	fmt.Println()
	fmt.Printf("  App directory:  %s/\n", appName)
	fmt.Printf("  Hosting site:   %s\n", siteName)
	fmt.Printf("  Production URL: %s\n", data.ProductionURL)
	fmt.Println()
	fmt.Println("Next steps:")
	fmt.Printf("  cd %s && npm install\n", appName)
	fmt.Printf("  # Run unit tests:       .claude/skills/ref-pr-workflow/scripts/run-unit-tests.sh %s\n", appName)
	fmt.Printf("  # Run acceptance tests:  .claude/skills/ref-pr-workflow/scripts/run-acceptance-tests.sh %s\n", appName)
	fmt.Println()

	return nil
}

func renderTemplates(templateFS fs.FS, repoRoot, templateDir, outputDir string, data AppData) error {
	return walkDir(templateFS, templateDir, func(embedPath string, isDir bool) error {
		// Compute relative path from template dir
		relPath, _ := filepath.Rel(templateDir, embedPath)

		// Process template variables in directory/file names
		relPath = strings.ReplaceAll(relPath, "{{.AppName}}", data.AppName)

		// Strip .tmpl extension
		relPath = strings.TrimSuffix(relPath, ".tmpl")

		outPath := filepath.Join(repoRoot, outputDir, relPath)

		if isDir {
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

func walkDir(fsys fs.FS, root string, fn func(path string, isDir bool) error) error {
	entries, err := fs.ReadDir(fsys, root)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		path := root + "/" + entry.Name()
		if entry.IsDir() {
			if err := fn(path, true); err != nil {
				return err
			}
			if err := walkDir(fsys, path, fn); err != nil {
				return err
			}
		} else {
			if err := fn(path, false); err != nil {
				return err
			}
		}
	}
	return nil
}
