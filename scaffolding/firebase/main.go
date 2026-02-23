package main

import (
	"embed"
	"fmt"
	"os"
	"path/filepath"

	"github.com/natb1/commons.systems/scaffolding/firebase/internal/scaffold"
)

//go:embed all:templates
var templateFS embed.FS

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "Usage: scaffold <create|cleanup> <app-name>")
		os.Exit(1)
	}

	cmd := os.Args[1]

	repoRoot, err := findRepoRoot()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	switch cmd {
	case "create":
		if len(os.Args) < 3 {
			fmt.Fprintln(os.Stderr, "Usage: scaffold create <app-name>")
			os.Exit(1)
		}
		appName := os.Args[2]
		if err := scaffold.Create(repoRoot, appName, templateFS); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
	case "cleanup":
		if len(os.Args) < 3 {
			fmt.Fprintln(os.Stderr, "Usage: scaffold cleanup <app-name>")
			os.Exit(1)
		}
		appName := os.Args[2]
		if err := scaffold.Cleanup(repoRoot, appName); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
	default:
		fmt.Fprintf(os.Stderr, "Unknown command: %s\nUsage: scaffold <create|cleanup> <app-name>\n", cmd)
		os.Exit(1)
	}
}

func findRepoRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		if _, err := os.Stat(filepath.Join(dir, "firebase.json")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("could not find repo root (no firebase.json found)")
		}
		dir = parent
	}
}
