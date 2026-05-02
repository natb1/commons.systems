#!/usr/bin/env bash
set -euo pipefail

if [[ $# -eq 0 ]]; then
  echo "usage: identify-qfx.sh <file.qfx> [...]" >&2
  exit 1
fi

# Built-in ORG → institution directory name map.
declare -A ORG_MAP
ORG_MAP["AMEX"]="american_express"
ORG_MAP["C1"]="capital_one"
ORG_MAP["PNC"]="pnc"
ORG_MAP["TIAA-CREF"]="tiaa_cref"
ORG_MAP["Vanguard"]="vanguard"

exit_code=0

for file in "$@"; do
  # Extract ORG: handles both XML (<ORG>X</ORG>) and SGML (<ORG>X\n or <ORG>X<...).
  # The regex <ORG>[^<\n]* matches both formats; sed strips the tag prefix.
  org=$(grep -oE '<ORG>[^<\n]*' "$file" | head -1 | sed 's/<ORG>//')
  if [[ -z "$org" ]]; then
    echo "could not extract ORG from $file" >&2
    exit_code=1
    continue
  fi

  institution="${ORG_MAP[$org]:-}"
  if [[ -z "$institution" ]]; then
    echo "unknown ORG: $org" >&2
    exit_code=1
    continue
  fi

  # Extract ACCTID: same dual-format handling.
  raw_acct=$(grep -oE '<ACCTID>[^<\n]*' "$file" | head -1 | sed 's/<ACCTID>//')
  if [[ -z "$raw_acct" ]]; then
    echo "could not extract ACCTID from $file" >&2
    exit_code=1
    continue
  fi

  # Canonicalize: take the segment after the last | (Amex uses token|digits format).
  acct="${raw_acct##*|}"
  # Strip a single leading 'x' (PNC prefixes ACCTID with 'x', e.g. x5111).
  acct="${acct#x}"
  # Strip leading zeros.
  acct="${acct#"${acct%%[!0]*}"}"
  # Guard: if stripping zeros emptied the value (account "0"), restore one zero.
  [[ -z "$acct" ]] && acct="0"

  printf '%s\t%s\t%s\n' "$file" "$institution" "$acct"
done

exit $exit_code
