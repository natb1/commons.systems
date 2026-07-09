# Windows WezTerm Installer (WSL only)
#
# Installs the WezTerm Windows binary to the Windows user's %LOCALAPPDATA%\WezTerm\
# at each home-manager activation, pinned to the same nightly build as the WSL
# wezterm-mux-server (nix/home/wezterm-pin.nix).
#
# Why the pin: the Windows GUI auto-connects to the WSL mux server; if the two
# builds drift, the mux PDU handshake fails and the GUI window closes immediately.
# Upstream distributes exactly ONE Windows nightly zip (overwritten in place), so
# a naive "always curl the latest nightly" install drifts from the nixpkgs-pinned
# mux server whenever their dates differ. Instead we fetch the zip content-pinned
# by `windowsZipHash` and unpack it at build time; activation only mirrors the
# resulting store tree to Windows. Bump both sides together with
# nix/home/sync-wezterm.sh.

{
  config,
  pkgs,
  lib,
  ...
}:

let
  pin = import ./wezterm-pin.nix;

  # Content-pinned nightly zip. The URL is upstream's rolling `nightly` asset;
  # `windowsZipHash` locks it to the exact build recorded in the pin, so a later
  # upstream republish cannot silently swap the binary — a hash mismatch fails
  # loudly until the pin is refreshed via sync-wezterm.sh.
  weztermWindowsZip = pkgs.fetchurl {
    url = "https://github.com/wez/wezterm/releases/download/nightly/WezTerm-windows-nightly.zip";
    sha256 = pin.windowsZipHash;
  };

  # Unpack at build time and expose the directory that holds wezterm-gui.exe, so
  # the activation script is a pure mirror-to-Windows with no download/unzip step.
  weztermWindowsDir = pkgs.runCommand "wezterm-windows-${pin.version}" {
    nativeBuildInputs = [ pkgs.unzip ];
  } ''
    unzip -q ${weztermWindowsZip} -d unpacked
    gui=$(find unpacked -maxdepth 3 -name 'wezterm-gui.exe' -type f | head -n1)
    if [ -z "$gui" ]; then
      echo "ERROR: wezterm-gui.exe not found in the nightly zip" >&2
      find unpacked -maxdepth 3 -type f >&2
      exit 1
    fi
    cp -r "$(dirname "$gui")" "$out"
  '';
in

{
  # WSL: mirror the pinned Windows WezTerm into the user's %LOCALAPPDATA%.
  # DAG ordering: runs after "linkGeneration" so symlinks are stable before we
  # reach across the WSL boundary.
  home.activation.installWeztermWindows = lib.mkIf pkgs.stdenv.isLinux (
    lib.hm.dag.entryAfter [ "linkGeneration" ] ''
      readonly WW_ERR_PERMISSION_DENIED=21
      readonly WW_ERR_USERNAME_DETECTION=22
      readonly WW_ERR_INSTALL_FAILED=23
      readonly WW_ERR_FILE_LOCKED=24

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
          ${pkgs.coreutils}/bin/mkdir -p "$TARGET_DIR"

          # rsync the pre-unpacked, content-pinned store tree to Windows. No
          # network or unzip here — the binary is fixed by wezterm-pin.nix.
          #
          # rsync without -p/-o/-g: /mnt/c is a Windows filesystem where unix
          # permissions/ownership are not meaningful and attempting to set them
          # produces spurious errors. -rlt preserves recursion, symlinks, and
          # mtimes — enough to keep --delete idempotent across runs.
          # Capture the exit code without tripping the activation script's `set
          # -e`: a bare `var=$(cmd)` assignment aborts the whole switch on rsync
          # failure BEFORE the handler below runs, turning the common
          # locked-file case (WezTerm still open on Windows) into an opaque
          # abort instead of the actionable message. `|| rsync_exit=$?` keeps
          # the failure local.
          rsync_exit=0
          rsync_error=$(${pkgs.rsync}/bin/rsync -rlt --delete \
            "${weztermWindowsDir}/" "$TARGET_DIR/" 2>&1) || rsync_exit=$?
          if [ $rsync_exit -ne 0 ]; then
            if echo "$rsync_error" | grep -qi "permission denied"; then
              echo "ERROR: Failed to install Windows WezTerm — files appear locked" >&2
              echo "  Close WezTerm on Windows and re-run 'home-manager switch'" >&2
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
          echo "Would install pinned WezTerm ${pin.version} to $TARGET_DIR"
        fi

        echo "Installed Windows WezTerm ${pin.version} to $TARGET_DIR"

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
