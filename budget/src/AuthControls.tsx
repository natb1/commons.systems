// Rendered into the ds Nav's `end` slot. Replaces the legacy imperative nav
// auth UI (main.ts:62-110 + showNavError/showReloadPrompt). Keeps every existing
// class name (nav-upload, nav-local-info, local-group-name, export-data,
// clear-data, nav-error, reload-handle, upload-label, upload-input) so theme.css
// selectors keep matching.
import { useRef } from "react";
import { isFsaSupported, type AppApi } from "./use-app-state.js";

export function AuthControls(props: AppApi) {
  const {
    state,
    navError,
    reloadHandle,
    onUploadInputChange,
    onUploadLabelClick,
    onUploadLabelKeydown,
    onExport,
    onClear,
    onReloadHandle,
  } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  // Label click: when FSA is supported, prevent the native file dialog and run
  // the FSA picker (main.ts:423-433). When unsupported, fall through to the
  // native <input> (the label naturally forwards the click).
  const handleLabelClick = (e: React.MouseEvent<HTMLLabelElement>) => {
    if (isFsaSupported()) {
      e.preventDefault();
      onUploadLabelClick();
    }
  };

  // Keyboard activation (main.ts:437-449): Enter/Space runs the FSA picker when
  // supported, else clicks the hidden input.
  const handleLabelKeydown = (e: React.KeyboardEvent<HTMLLabelElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (isFsaSupported()) {
        onUploadLabelKeydown(e.key);
      } else {
        inputRef.current?.click();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadInputChange(file);
    // Reset so the same file can be re-uploaded.
    e.target.value = "";
  };

  const isLocal = state.source === "local";

  // Mirror the legacy updateNav() exactly: BOTH containers are always present in
  // the DOM and only toggled via `hidden` (main.ts:101-110). Keeping the upload
  // control mounted-but-hidden when local preserves the legacy "switch files via
  // the still-clickable label" path that the FSA-switch flow relies on.
  return (
    <span>
      <span className="nav-upload" hidden={isLocal}>
        <label
          className="upload-label"
          tabIndex={0}
          onClick={handleLabelClick}
          onKeyDown={handleLabelKeydown}
        >
          Load data
          <input
            ref={inputRef}
            type="file"
            accept=".json,.benc"
            className="upload-input"
            hidden
            onChange={handleInputChange}
          />
        </label>
      </span>
      <span className="nav-local-info" hidden={!isLocal}>
        <span className="local-group-name">{isLocal ? state.groupName : ""}</span>
        <button className="export-data" onClick={onExport}>Export</button>
        <button className="clear-data" onClick={onClear}>Clear data</button>
      </span>
      {navError !== null && <p className="nav-error">{navError}</p>}
      {reloadHandle !== null && (
        <button className="reload-handle" onClick={onReloadHandle}>
          Reload {reloadHandle.name}
        </button>
      )}
    </span>
  );
}
