#!/usr/bin/env python3
"""Split a shell command string into top-level segments, respecting quotes.

Reads command from stdin. Writes one segment per line to stdout.
A segment is separated from its neighbors by an unquoted |, ;, &&, or ||.
Exits 0 on success, 1 on unbalanced quotes.

Quote handling:
- Single quotes: verbatim until the next single quote; no escapes.
- Double quotes: backslash escapes the next char.
- Backslash outside quotes: escapes the next char.

Caller responsibilities: $(...) substitution, backticks, and heredocs are
expected to have already been extracted / stripped / rejected upstream.
"""

import sys


def split_segments(cmd: str) -> list[str]:
    segments: list[str] = []
    buf: list[str] = []
    i, n = 0, len(cmd)

    def flush() -> None:
        seg = "".join(buf).strip()
        if seg:
            segments.append(seg)
        buf.clear()

    while i < n:
        ch = cmd[i]

        if ch == "\\" and i + 1 < n:
            buf.append(ch)
            buf.append(cmd[i + 1])
            i += 2
            continue

        if ch == "'":
            buf.append(ch)
            i += 1
            while i < n and cmd[i] != "'":
                buf.append(cmd[i])
                i += 1
            if i >= n:
                raise ValueError("unbalanced single quote")
            buf.append(cmd[i])
            i += 1
            continue

        if ch == '"':
            buf.append(ch)
            i += 1
            while i < n and cmd[i] != '"':
                if cmd[i] == "\\" and i + 1 < n:
                    buf.append(cmd[i])
                    buf.append(cmd[i + 1])
                    i += 2
                    continue
                buf.append(cmd[i])
                i += 1
            if i >= n:
                raise ValueError("unbalanced double quote")
            buf.append(cmd[i])
            i += 1
            continue

        if ch in ("|", "&") and i + 1 < n and cmd[i + 1] == ch:
            flush()
            i += 2
            continue

        if ch in ("|", ";"):
            flush()
            i += 1
            continue

        buf.append(ch)
        i += 1

    flush()
    return segments


def main() -> None:
    try:
        segs = split_segments(sys.stdin.read())
    except ValueError as e:
        print(f"split-command: {e}", file=sys.stderr)
        sys.exit(1)
    for s in segs:
        print(s)


if __name__ == "__main__":
    main()
