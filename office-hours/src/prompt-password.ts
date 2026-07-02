// Imperative <dialog> password helper — ported verbatim from budget's
// use-app-state.ts:45-101. Kept as an imperative helper appended to
// document.body returning a Promise (NOT a React component): the local-snapshot
// passphrase prompt is a one-shot modal gesture, not part of the render tree.
//
// The returned passphrase is handed straight to decrypt and held only in a
// session-lifetime ref by the caller; this helper never persists it.
export function promptPassword(message: string): Promise<string | null> {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "password-dialog";

    const form = document.createElement("form");
    form.method = "dialog";

    const p = document.createElement("p");
    p.textContent = message;

    const input = document.createElement("input");
    input.type = "password";
    input.className = "password-input";
    input.autocomplete = "off";

    const actions = document.createElement("div");
    actions.className = "password-actions";

    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.className = "password-submit";
    submitBtn.textContent = "Submit";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "password-cancel";
    cancelBtn.textContent = "Cancel";

    actions.appendChild(submitBtn);
    actions.appendChild(cancelBtn);
    form.appendChild(p);
    form.appendChild(input);
    form.appendChild(actions);
    dialog.appendChild(form);
    document.body.appendChild(dialog);

    cancelBtn.addEventListener("click", () => {
      dialog.close();
      dialog.remove();
      resolve(null);
    });
    dialog.addEventListener("cancel", () => {
      dialog.remove();
      resolve(null);
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = input.value;
      dialog.close();
      dialog.remove();
      resolve(value);
    });
    dialog.showModal();
    input.focus();
  });
}
