package main

import (
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"

	"github.com/natb1/commons.systems/productivity-tui/internal/app"
	"github.com/natb1/commons.systems/productivity-tui/internal/ratelimits"
	"github.com/natb1/commons.systems/productivity-tui/internal/session"
)

var version = "0.1.0"

func main() {
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "--version", "-v":
			fmt.Printf("productivity-tui %s\n", version)
			os.Exit(0)
		case "--help", "-h":
			fmt.Println("productivity-tui - Claude Code session monitor")
			fmt.Println()
			fmt.Println("Usage: productivity-tui [flags]")
			fmt.Println()
			fmt.Println("Flags:")
			fmt.Println("  --version, -v  Print version and exit")
			fmt.Println("  --help, -h     Print this help and exit")
			os.Exit(0)
		default:
			fmt.Fprintf(os.Stderr, "unknown flag: %s\n", os.Args[1])
			os.Exit(1)
		}
	}

	stateFile, err := session.StateFilePath()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
	rateLimitsFile, err := ratelimits.StateFilePath()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
	m := app.New(stateFile, rateLimitsFile)
	p := tea.NewProgram(m, tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
