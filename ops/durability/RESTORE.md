# How to restore our owned data

This guide is for a member of the household. It explains what data we keep, where
each kind lives, and how to get it back if a computer is lost or breaks. You do
not need to be a programmer to follow the "what it is" and "where it lives"
parts; the restore steps note where a more technical helper is needed.

Keep a copy of this file in the archive itself (the shared drive), so the guide
travels with the data it describes.

The list of data kinds and copy locations below mirrors `manifest.json` in this
same folder. If we add or move a copy, update both files.

## The password

Some of our data is encrypted and needs a password to open. That password is not
written in this file, and it must never be. It is kept with our other important
keys and account recovery information (the key-continuity practice). Ask the
person who holds the household keys, and find it there.

## What we keep and how to restore it

### 1. Budget snapshots (encrypted)

- **What it is:** Our budget — spending, categories, and balances — saved as
  encrypted files ending in `.benc`.
- **Where it lives:** On the shared drive, under `budget`. There should be a copy
  on the shared drive and a working copy on the everyday computer.
- **How to restore:**
  1. Open the hosted budget app in a web browser.
  2. Choose to load a budget file, and pick the newest `.benc` file from the
     shared drive.
  3. Enter the household password when asked. The budget appears.
  - A technical helper can instead run `budget-etl dump <file>` to print the
    contents; it will ask for the same password.

### 2. Bank statements

- **What it is:** The original statement files downloaded from the bank. These
  are the source records behind the budget.
- **Where it lives:** On the shared drive, next to the budget files.
- **How to restore:** These are ordinary files (not encrypted). Copy them back
  from the shared drive to wherever you want them.

### 3. Reading and listening notes (app sidecar state)

- **What it is:** Bookmarks and notes from the reading app, and saved positions
  from the audio app. These are plain text files kept in hidden folders named
  `.commons-print` and `.commons-audio` inside the folder that holds our books
  and audio.
- **Where it lives:** Inside the media folder on the shared drive.
- **How to restore:** Copy the media folder (including the hidden `.commons-*`
  folders) back into place. Then open the reading or audio app and pick that
  folder again when it asks which folder to use. Your bookmarks and positions
  come back.

### 4. Our project and the intention graph (git repository)

- **What it is:** The `commons.systems` project code and the intention graph
  (our plans and decisions), stored in git. A full copy also lives on GitHub.
- **Where it lives:** A working copy on the computer, and the authoritative copy
  on GitHub.
- **How to restore:** A technical helper runs `git clone` from our GitHub
  account to make a fresh working copy. Everything, including the full history,
  comes down from GitHub.

## Rehearsal

Once in each review cycle we practice this restore, so we know it actually
works. During office hours (see `tactic-durability-restore-rehearsal`):

1. Run the audit to check every kind of data has a redundant, off-machine copy:
   `node --import tsx/esm ops/durability/audit.ts --manifest ops/durability/manifest.json`
   (if the shared drive is not showing up, it may need to be reconnected first).
2. Actually restore one budget snapshot on a different computer or user profile —
   not the everyday machine — and confirm it opens with the password.
3. Read through this guide together as a household, and fix any step that was
   unclear or wrong.
