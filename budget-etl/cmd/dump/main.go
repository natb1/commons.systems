// Command dump decrypts a budget snapshot and prints transactions, budgets,
// and rules as indented JSON.
//
// Usage:
//
//	dump [--keychain <name>] <path>
//
// See internal/password for the env-var-then-keychain precedence.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"

	"github.com/natb1/commons.systems/budget-etl/internal/export"
	"github.com/natb1/commons.systems/budget-etl/internal/password"
)

func main() {
	keychainFlag := flag.String("keychain", "", "macOS Keychain account name for decrypt password")
	flag.Usage = func() {
		fmt.Fprintln(os.Stderr, "Usage: dump [--keychain <name>] <path>")
		fmt.Fprintln(os.Stderr, "  "+password.UsageNote)
		flag.PrintDefaults()
	}
	flag.Parse()
	if flag.NArg() < 1 {
		flag.Usage()
		os.Exit(1)
	}

	pw, err := password.Resolve(*keychainFlag)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	out, err := export.ReadFile(flag.Arg(0), pw)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	type summary struct {
		Transactions []export.Transaction `json:"transactions"`
		Budgets      []export.Budget      `json:"budgets"`
		Rules        []export.Rule        `json:"rules"`
	}
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	if err := enc.Encode(summary{Transactions: out.Transactions, Budgets: out.Budgets, Rules: out.Rules}); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
