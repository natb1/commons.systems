---
name: ready
description: Evaluate a GitHub issue for quality across 7 categories — accepts issue number or plain text description
---

# Issue Ready

1. Accept input: issue number (e.g., `#3`) or description (plain text). Store as `$INPUT`.

2. Invoke `/ref-ready`.

3. If the current plan has an active step recorded, resume at that step. Otherwise, begin at Step 1.
