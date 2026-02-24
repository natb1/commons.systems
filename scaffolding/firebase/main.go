package main

import (
	"embed"
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"github.com/natb1/commons.systems/scaffolding/firebase/internal/scaffold"
)

// all: prefix includes files starting with . and _ that embed normally skips.
// Ensures any dotfiles or _-prefixed files in templates are not silently omitted.
//
//go:embed all:templates
var templateFS embed.FS

func main() {
	dryRun := flag.Bool("dry-run", false, "Print what would happen without executing")
	flag.Usage = func() {
		fmt.Fprintln(os.Stderr, "Usage: scaffold [--dry-run] <create|cleanup> <app-name>")
		flag.PrintDefaults()
	}
	flag.Parse()

	args := flag.Args()
	if len(args) < 2 {
		flag.Usage()
		os.Exit(1)
	}

	cmd := args[0]
	appName := args[1]

	repoRoot, err := findRepoRoot()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	switch cmd {
	case "create":
		if err := scaffold.Create(repoRoot, appName, templateFS, *dryRun); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
	case "cleanup":
		if err := scaffold.Cleanup(repoRoot, appName, *dryRun); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
	default:
		fmt.Fprintf(os.Stderr, "Unknown command: %s\nUsage: scaffold [--dry-run] <create|cleanup> <app-name>\n", cmd)
		os.Exit(1)
	}
}

func findRepoRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		if _, err := os.Stat(filepath.Join(dir, ".git")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("could not find repo root (no .git directory found)")
		}
		dir = parent
	}
}
