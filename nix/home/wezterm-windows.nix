# Windows WezTerm Installer (WSL only)
#
# Downloads and installs the WezTerm Windows nightly binary to the Windows
# user's %LOCALAPPDATA%\WezTerm\ at each home-manager activation.
#
# Why: the Windows GUI auto-connects to the NixOS mux server over SSH; when the
# Windows binary and the NixOS wezterm package drift in version, the mux PDU
# protocol fails and the GUI window closes immediately. Both sides track upstream
# nightly: the NixOS package via nixpkgs, the Windows binary via a runtime curl
# fetch in this activation script, so each switch picks up the same rolling nightly.
#
# Update workflow:
#   The Windows zip auto-tracks upstream's rolling "nightly" tag via a runtime
#   curl fetch on each activation — no flake input / lock pin so upstream
#   republishes are automatically picked up. Each switch re-downloads the zip.

{
  config,
  pkgs,
  lib,
  ...
}:

{
  # WSL: download and install Windows WezTerm into the user's %LOCALAPPDATA%.
  # DAG ordering: runs after "linkGeneration" so symlinks are stable before we
  # reach across the WSL boundary.
  home.activation.installWeztermWindows = lib.mkIf pkgs.stdenv.isLinux (
    lib.hm.dag.entryAfter [ "linkGeneration" ] ''
      readonly WW_ERR_PERMISSION_DENIED=21
      readonly WW_ERR_USERNAME_DETECTION=22
      readonly WW_ERR_INSTALL_FAILED=23
      readonly WW_ERR_FILE_LOCKED=24
      readonly WW_ERR_DOWNLOAD_FAILED=25

      if [ ! -d "/mnt/c/Users" ]; then
        echo "Not running on WSL, skipping Windows WezTerm install"
      else
        if [ ! -r "/mnt/c/Users" ]; then
          echo "ERROR: Permission denied accessing /mnt/c/Users/" >&2
          echo "  WSL mount exists but directory is not readable" >&2
          exit $WW_ERR_PERMISSION_DENIED
        fi

        # Auto-detect Windows username (same logic as wezterm.nix). Use a
        # module-prefixed temp-file name so the EXIT trap registered by
        # copyWeztermToWindows isn't clobbered.
        WW_LS_STDERR=$(mktemp)
        WW_LS_OUTPUT=$(ls /mnt/c/Users/ 2>"$WW_LS_STDERR")
        WW_LS_EXIT_CODE=$?

        if [ $WW_LS_EXIT_CODE -ne 0 ]; then
          echo "ERROR: Failed to list /mnt/c/Users/ directory" >&2
          echo "  Exit code: $WW_LS_EXIT_CODE" >&2
          if [ -s "$WW_LS_STDERR" ]; then
            echo "  Error output:" >&2
            cat "$WW_LS_STDERR" 2>/dev/null | sed 's/^/    /' >&2
          fi
          rm -f "$WW_LS_STDERR"
          exit $WW_ERR_PERMISSION_DENIED
        fi
        rm -f "$WW_LS_STDERR"

        WINDOWS_USER=$(echo "$WW_LS_OUTPUT" | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)

        if [ -z "$WINDOWS_USER" ]; then
          echo "ERROR: Failed to detect Windows username" >&2
          echo "  Available directories:" >&2
          echo "$WW_LS_OUTPUT" | sed 's/^/    /' >&2
          exit $WW_ERR_USERNAME_DETECTION
        fi

        if [ ! -d "/mnt/c/Users/$WINDOWS_USER" ]; then
          echo "ERROR: Detected Windows user '$WINDOWS_USER' but directory does not exist" >&2
          echo "  Expected: /mnt/c/Users/$WINDOWS_USER" >&2
          exit $WW_ERR_USERNAME_DETECTION
        fi

        TARGET_DIR="/mnt/c/Users/$WINDOWS_USER/AppData/Local/WezTerm"

        if [ -z "$DRY_RUN_CMD" ]; then
          # Download the nightly Windows zip and rsync its contents to TARGET_DIR.
          # Re-downloads on each switch so the Windows binary stays in lockstep
          # with the nixpkgs-managed mux server without a hash pin.
          WW_TMPDIR=$(mktemp -d)
          trap 'rm -rf "$WW_TMPDIR"' EXIT

          ${pkgs.curl}/bin/curl -fsSL \
            "https://github.com/wez/wezterm/releases/download/nightly/WezTerm-windows-nightly.zip" \
            -o "$WW_TMPDIR/wezterm.zip" \
            || { echo "ERROR: Failed to download WezTerm Windows nightly" >&2; exit $WW_ERR_DOWNLOAD_FAILED; }

          ${pkgs.unzip}/bin/unzip -q "$WW_TMPDIR/wezterm.zip" -d "$WW_TMPDIR/extracted"

          GUI_EXE=$(find "$WW_TMPDIR/extracted" -maxdepth 3 -name 'wezterm-gui.exe' -type f | head -n1)
          if [ -z "$GUI_EXE" ]; then
            echo "ERROR: wezterm-gui.exe not found in source" >&2
            find "$WW_TMPDIR/extracted" -maxdepth 3 -type f >&2
            exit $WW_ERR_INSTALL_FAILED
          fi

          SOURCE_ROOT=$(dirname "$GUI_EXE")
          ${pkgs.coreutils}/bin/mkdir -p "$TARGET_DIR"

          # rsync without -p/-o/-g: /mnt/c is a Windows filesystem where unix
          # permissions/ownership are not meaningful and attempting to set them
          # produces spurious errors. -rlt preserves recursion, symlinks, and
          # mtimes — enough to keep --delete idempotent across runs.
          rsync_error=$(${pkgs.rsync}/bin/rsync -rlt --delete \
            "$SOURCE_ROOT/" "$TARGET_DIR/" 2>&1)
          rsync_exit=$?
          if [ $rsync_exit -ne 0 ]; then
            if echo "$rsync_error" | grep -qi "permission denied"; then
              echo "ERROR: Failed to install Windows WezTerm — files appear locked" >&2
              echo "  Close WezTerm on Windows and re-run 'nixos-rebuild switch'" >&2
              echo "  Details:" >&2
              echo "$rsync_error" | sed 's/^/    /' >&2
              exit $WW_ERR_FILE_LOCKED
            fi
            echo "ERROR: Failed to install Windows WezTerm to $TARGET_DIR" >&2
            echo "  Exit code: $rsync_exit" >&2
            echo "  Error: $rsync_error" >&2
            exit $WW_ERR_INSTALL_FAILED
          fi
        else
          echo "Would download WezTerm nightly and install to $TARGET_DIR"
        fi

        echo "Installed Windows WezTerm to $TARGET_DIR"

        # Start Menu shortcut: write only when missing. Overwriting on every
        # activation would clobber a user-pinned taskbar entry's metadata.
        SHORTCUT_PATH="/mnt/c/Users/$WINDOWS_USER/AppData/Roaming/Microsoft/Windows/Start Menu/Programs/WezTerm.lnk"
        if [ ! -f "$SHORTCUT_PATH" ]; then
          if command -v powershell.exe >/dev/null 2>&1; then
            WIN_TARGET='C:\Users\'"$WINDOWS_USER"'\AppData\Local\WezTerm\wezterm-gui.exe'
            WIN_WORKDIR='C:\Users\'"$WINDOWS_USER"'\AppData\Local\WezTerm'
            WIN_SHORTCUT='C:\Users\'"$WINDOWS_USER"'\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\WezTerm.lnk'

            if [ -z "$DRY_RUN_CMD" ]; then
              if powershell.exe -NoProfile -Command "\$WshShell = New-Object -ComObject WScript.Shell; \$Shortcut = \$WshShell.CreateShortcut('$WIN_SHORTCUT'); \$Shortcut.TargetPath = '$WIN_TARGET'; \$Shortcut.WorkingDirectory = '$WIN_WORKDIR'; \$Shortcut.Save()" >/dev/null 2>&1; then
                echo "Created Start Menu shortcut: $SHORTCUT_PATH"
              else
                echo "WARNING: Failed to create Start Menu shortcut at $SHORTCUT_PATH" >&2
              fi
            fi
          else
            echo "WARNING: powershell.exe not found on PATH, skipping Start Menu shortcut" >&2
          fi
        fi
      fi
    ''
  );
}
