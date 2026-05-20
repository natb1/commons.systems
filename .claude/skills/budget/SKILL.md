---
name: budget
description: Convert a user's bank statement files (QFX/OFX/CSV) into a `budget.json` for the hosted budget app — runs the bundled `budget-etl` binary locally so transaction data never leaves the user's machine. Trigger on `/budget <path>`, "convert my bank statements", or "make a budget.json".
---

# budget

You receive a path to one or more bank statement files (QFX/OFX/CSV) and produce a plaintext `budget.json` the user can upload to the hosted budget app. Every step runs locally — see the privacy invariant below.

## Privacy invariant

Statement data does not leave the user's machine. You must not send transaction contents, descriptions, amounts, account numbers, the input files, or the generated `budget.json` to any network endpoint. Do not paste statement contents into web fetches, chat replies that route through external services, or any other outbound channel.

The only outbound network call permitted is the one-time binary download in step 2 (an HTTPS GET to `https://github.com/natb1/commons.systems/releases`), and only when no local binary is available. That request transfers no statement data.

If you would otherwise need to send statement data anywhere to complete a step, stop and surface the situation to the user instead.

## Step 1 — Detect the platform

Run `uname -sm` and map the output to a platform tag:

| `uname -sm` output | platform tag |
| --- | --- |
| `Darwin arm64` | `darwin-arm64` |
| `Darwin x86_64` | `darwin-amd64` |
| `Linux x86_64` | `linux-amd64` |

Any other output is unsupported. Fail with a message like:

> Your platform `<uname output>` is not in the pre-built binary set (darwin-arm64, darwin-amd64, linux-amd64). Fork the project at https://github.com/natb1/commons.systems/fork and run `/budget-parser <path>` from your fork to build the tool from source.

Do not proceed to step 2.

## Step 2 — Resolve the binary

Check these locations in order. The first match wins. Print one line stating which path you chose so the user can audit.

1. `${CLAUDE_PLUGIN_ROOT}/bin/budget-etl-<platform>` — the binary shipped with the plugin. Use it if it exists and is executable.
2. `~/.cache/commons-systems/bin/budget-etl-<platform>` — a previously-downloaded copy.
3. Download from GitHub Releases:

   ```bash
   mkdir -p ~/.cache/commons-systems/bin
   curl -fSL -o ~/.cache/commons-systems/bin/budget-etl-<platform> \
     https://github.com/natb1/commons.systems/releases/latest/download/budget-etl-<platform>
   chmod +x ~/.cache/commons-systems/bin/budget-etl-<platform>
   ```

   Use the downloaded path. If the download fails, surface `curl`'s error to the user and stop.

Bind the resolved path to `BUDGET_ETL_BIN` for the rest of the steps below.

## Step 3 — Parse arguments and stage the input

The invocation is `/budget <path>` with an optional `--output <out>`.

- If `<path>` is a directory, use it directly as the input dir.
- If `<path>` is a single file, create a temp directory and copy or symlink the file in:

  ```bash
  INPUT_DIR="$(mktemp -d)"
  cp "<path>" "$INPUT_DIR/"
  ```

  Use `$INPUT_DIR` as the input dir. `budget-etl --dir` processes every file in the directory, so handing it the file's parent would pull in unrelated files.

- If `<path>` is a glob or multiple paths, create a temp dir and copy each file in.

The default output is `./budget.json` in the user's current working directory. Honor `--output <out>` when given.

## Step 4 — Run the binary

```bash
"$BUDGET_ETL_BIN" --dir "$INPUT_DIR" --group personal --plaintext --output "$OUTPUT_PATH"
```

`--plaintext` is required: it tells `budget-etl` to skip the password prompt and write an unencrypted `budget.json` the hosted app can read. The binary processes the files locally. No network call is made.

Capture stderr separately so step 5 can inspect it. Do not retry on failure — diagnose before re-running.

## Step 5 — Handle the result

**Success (exit 0).** Print exactly:

> Wrote `<OUTPUT_PATH>`. Upload it to https://cs-budget-f920.web.app — your data stays on your machine.

**Failure with unrecognized format.** If the exit code is non-zero and stderr contains the substring `unrecognized statement format`, the user's bank uses an export format the bundled parsers don't cover. Tell them:

> Your bank's export format isn't recognized by the bundled parsers (QFX/OFX/CSV). To teach the tool a new format:
>
> 1. Fork the project: https://github.com/natb1/commons.systems/fork
> 2. Open your fork in Claude Desktop or Claude Code.
> 3. Run `/budget-parser <path-to-your-file>` — that skill walks Claude through writing and testing a new parser for your bank.

**Any other failure.** Surface the binary's stderr verbatim to the user and stop. Do not retry.
