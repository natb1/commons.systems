package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"

	"github.com/natb1/commons.systems/budget-etl/internal/export"
	"github.com/natb1/commons.systems/budget-etl/internal/password"
)

// runDump decrypts the budget snapshot at path and encodes its transactions,
// budgets, and rules as indented JSON to stdout. keychainAccount is the macOS
// Keychain account name used to resolve the decrypt password; pass an empty
// string to fall back to the BUDGET_ETL_PASSWORD environment variable.
func runDump(path, keychainAccount string) error {
	pw, err := password.Resolve(keychainAccount)
	if err != nil {
		return err
	}

	out, err := export.ReadFile(path, pw)
	if err != nil {
		return err
	}

	type summary struct {
		Transactions []export.Transaction `json:"transactions"`
		Budgets      []export.Budget      `json:"budgets"`
		Rules        []export.Rule        `json:"rules"`
	}

	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	return enc.Encode(summary{Transactions: out.Transactions, Budgets: out.Budgets, Rules: out.Rules})
}

// runDumpCmd parses args as a "dump" subcommand, then calls runDump. It returns
// an exit code: 0 on success, 1 on any error or missing argument.
func runDumpCmd(args []string) int {
	fs := flag.NewFlagSet("dump", flag.ExitOnError)
	keychainFlag := fs.String("keychain", "", "macOS Keychain account name for decrypt password")
	fs.Usage = func() {
		fmt.Fprintln(os.Stderr, "Usage: dump [--keychain <name>] <path>")
		fmt.Fprintln(os.Stderr, "  "+password.UsageNote)
		fs.PrintDefaults()
	}
	fs.Parse(args) //nolint:errcheck // ExitOnError means Parse never returns an error
	if fs.NArg() < 1 {
		fs.Usage()
		return 1
	}
	if err := runDump(fs.Arg(0), *keychainFlag); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		return 1
	}
	return 0
}
