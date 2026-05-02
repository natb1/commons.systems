package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/natb1/commons.systems/budget-etl/internal/export"
	"github.com/natb1/commons.systems/budget-etl/internal/keychain"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "usage: dump <path>")
		os.Exit(1)
	}
	pw, err := keychain.Get("budget")
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	out, err := export.ReadFile(os.Args[1], pw)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	type summary struct {
		Budgets []export.Budget `json:"budgets"`
		Rules   []export.Rule   `json:"rules"`
	}
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	if err := enc.Encode(summary{Budgets: out.Budgets, Rules: out.Rules}); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
