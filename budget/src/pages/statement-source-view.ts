import { escapeHtml } from "@commons-systems/htmlutil";
import { getActiveDataSource } from "../active-data-source.js";
import {
  isDirectoryAccessSupported,
  getStoredDirectoryHandle,
  pickStatementsDirectory,
  ensureReadPermission,
} from "../statements-dir.js";
import {
  resolveSourceFile,
  type DirHandleLike,
  type FileHandleLike,
} from "../statement-file-resolver.js";

/**
 * READ-ONLY source-statement viewer.
 *
 * Opens a modal `<dialog>` that renders the raw source-statement file behind a
 * transaction, resolved against the user's persisted statements directory
 * handle. Text formats (`.qfx`/`.ofx`/`.csv`) render as escaped text; PDFs
 * render in an embedded iframe via an object URL.
 *
 * Read-only guarantee: this module never calls `createWritable`, never parses
 * the file, and makes no network request. Permission is requested only in
 * `mode: "read"` (via the `statements-dir` helpers). The file is read locally
 * with `File.text()` / `URL.createObjectURL` and rendered in place.
 */

/**
 * Pure, case-insensitive extension check for the PDF branch. Exported for unit
 * testing. Only a trailing `.pdf` qualifies — `x.pdf.csv` is text.
 */
export function isPdfName(name: string): boolean {
  return /\.pdf$/i.test(name);
}

interface DialogHandle {
  dialog: HTMLDialogElement;
  body: HTMLDivElement;
  /** Register a cleanup callback to run when the dialog closes. */
  onClose(fn: () => void): void;
}

/**
 * Create the modal dialog shell: a `<dialog>` with a close button and a content
 * body, appended to `document.body` and shown. Close wiring removes the dialog
 * from the DOM and runs any registered cleanup. `showModal` is wrapped because
 * it is a no-op or throws under happy-dom — the DOM stays inspectable either
 * way.
 */
function createSourceDialog(): DialogHandle {
  const cleanups: Array<() => void> = [];

  const dialog = document.createElement("dialog");
  dialog.className = "statement-source-dialog";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "statement-source-close";
  closeButton.textContent = "Close";

  const body = document.createElement("div");
  body.className = "statement-source-body";

  dialog.append(closeButton, body);
  document.body.appendChild(dialog);

  function close(): void {
    for (const fn of cleanups) fn();
    cleanups.length = 0;
    dialog.remove();
  }

  closeButton.addEventListener("click", () => {
    dialog.close();
  });
  dialog.addEventListener("close", close);

  try {
    dialog.showModal();
  } catch {
    // happy-dom and non-supporting environments: the dialog is still in the
    // DOM and inspectable; modal-open state is not required.
  }

  return {
    dialog,
    body,
    onClose(fn: () => void): void {
      cleanups.push(fn);
    },
  };
}

/** Render a plain text message into the dialog body. */
function renderMessage(body: HTMLElement, message: string): void {
  body.innerHTML = `<p class="statement-source-message">${escapeHtml(message)}</p>`;
}

/**
 * The persisted directory handle is a real `FileSystemDirectoryHandle`, but
 * `resolveSourceFile` walks the minimal structural `DirHandleLike`. Bridge with
 * a cast — the runtime shape (getDirectoryHandle/getFileHandle) matches.
 */
function asDirHandleLike(handle: FileSystemDirectoryHandle): DirHandleLike {
  return handle as unknown as DirHandleLike;
}

/** Render the resolved file into the dialog body (PDF iframe or escaped text). */
async function renderFile(
  body: HTMLElement,
  fileHandle: FileHandleLike,
  onClose: (fn: () => void) => void,
): Promise<void> {
  const file = await fileHandle.getFile();
  if (isPdfName(file.name)) {
    const url = URL.createObjectURL(file);
    onClose(() => URL.revokeObjectURL(url));
    const frame = document.createElement("iframe");
    frame.className = "statement-source-frame";
    frame.src = url;
    body.replaceChildren(frame);
  } else {
    const text = await file.text();
    const pre = document.createElement("pre");
    pre.className = "statement-source-text";
    pre.textContent = text;
    body.replaceChildren(pre);
  }
}

/**
 * Resolve and render the source file for a statement once a directory handle is
 * available. Continues the flow at step 4 (permission) onward.
 */
async function showSourceForHandle(
  handle: FileSystemDirectoryHandle,
  sourceFile: string,
  dlg: DialogHandle,
): Promise<void> {
  // 4. Read permission.
  const granted = await ensureReadPermission(handle);
  if (!granted) {
    renderMessage(
      dlg.body,
      "Read permission is needed to show the source file.",
    );
    return;
  }

  // 5. Resolve the recorded path against the directory handle.
  const fileHandle = await resolveSourceFile(asDirHandleLike(handle), sourceFile);
  if (fileHandle === null) {
    renderMessage(
      dlg.body,
      `Source file not found in the linked folder (it may have moved or been renamed): ${sourceFile}`,
    );
    return;
  }

  // 6 + 7. Render the file content.
  await renderFile(dlg.body, fileHandle, dlg.onClose);
}

/**
 * Open the source-statement viewer for the statement whose `statementId` field
 * matches `statementId` (this is the transaction's `statementId`, which matches
 * the statement's `statementId` field, not its document `id`).
 */
export async function openStatementSource(statementId: string): Promise<void> {
  const dlg = createSourceDialog();

  // 1. Capability gate.
  if (!isDirectoryAccessSupported()) {
    renderMessage(
      dlg.body,
      "Directory access is not supported in this browser. Source statement files can only be shown in a Chromium-based browser.",
    );
    return;
  }

  // 2. Look up the statement and its recorded source file.
  const statements = await getActiveDataSource().getStatements();
  const statement = statements.find((s) => s.statementId === statementId);
  if (!statement || !statement.sourceFile) {
    renderMessage(
      dlg.body,
      "No source file is recorded for this statement. Re-run the parser to enable provenance.",
    );
    return;
  }
  const sourceFile = statement.sourceFile;

  // 3. Obtain the persisted directory handle, or offer to link the folder.
  const stored = await getStoredDirectoryHandle();
  if (!stored) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "statement-source-link-folder";
    button.textContent = "Link statements folder";
    button.addEventListener("click", () => {
      void (async () => {
        let picked: FileSystemDirectoryHandle;
        try {
          picked = await pickStatementsDirectory();
        } catch {
          // User aborted the picker, or it failed — show a message, no crash.
          renderMessage(
            dlg.body,
            "No statements folder was linked. Link the folder to view source files.",
          );
          return;
        }
        await showSourceForHandle(picked, sourceFile, dlg);
      })();
    });

    const intro = document.createElement("p");
    intro.className = "statement-source-message";
    intro.textContent =
      "Link your statements folder to view the source file for this transaction.";
    dlg.body.replaceChildren(intro, button);
    return;
  }

  await showSourceForHandle(stored, sourceFile, dlg);
}
