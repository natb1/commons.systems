# Windows WezTerm Installer (WSL only)
#
# Builds the WezTerm Windows binary set from the upstream WezTerm Windows nightly zip
# and installs it declaratively into the Windows user's %LOCALAPPDATA%\WezTerm\
# on each home-manager activation.
#
# Why: the Windows GUI auto-connects to the NixOS mux server over SSH; when the
# Windows binary and the NixOS wezterm package drift in version, the mux PDU
# protocol fails and the GUI window closes immediately. Both sides track upstream
# nightly: the NixOS package via nixpkgs, the Windows binary via an impure
# builtins.fetchurl, so each switch picks up the same rolling nightly.
#
# Update workflow:
#   The Windows zip auto-tracks upstream's rolling "nightly" tag via an in-module
#   impure builtins.fetchurl (no flake input / lock pin), so each switch picks up
#   current nightly content. Fetches are tarball-ttl-gated (default 1h); to force
#   a fresh pull immediately, add --refresh:
#     home-manager switch --flake .#default --impure --refresh
#
# When bumping nixpkgs (and thus wezterm), the impure fetch already tracks the
# latest nightly, keeping the two sides in lockstep.

{
  config,
  pkgs,
  lib,
  ...
}:

let
  wezterm-windows-pkg = pkgs.stdenv.mkDerivation {
    pname = "wezterm-windows";
    version = "nightly";

    # Impure raw-file fetch of the rolling upstream "nightly" Windows asset.
    # Hashless (no flake input / lock pin) so a cold-cache re-fetch tolerates an
    # upstream republish instead of failing a stale narHash check. Requires
    # --impure eval (already the only mode used here). Raw .zip, no unpacking —
    # the unzip nativeBuildInput + default unpackPhase extract it below.
    src = builtins.fetchurl "https://github.com/wez/wezterm/releases/download/nightly/WezTerm-windows-nightly.zip";

    nativeBuildInputs = [ pkgs.unzip ];

    dontConfigure = true;
    dontBuild = true;

    # The default unpackPhase handles either an opaque .zip (when Nix downloads
    # without auto-extraction) or an already-extracted directory. After unpack,
    # locate the directory containing wezterm-gui.exe — release zips wrap the
    # binaries in a single versioned subdirectory like
    # WezTerm-windows-20260117-074626-90b5d1cb/.
    installPhase = ''
      runHook preInstall

      GUI_EXE=$(find . -maxdepth 3 -name 'wezterm-gui.exe' -type f | head -n1)
      if [ -z "$GUI_EXE" ]; then
        echo "ERROR: wezterm-gui.exe not found in source" >&2
        find . -maxdepth 3 -type f >&2
        exit 1
      fi

      SOURCE_ROOT=$(dirname "$GUI_EXE")
      mkdir -p $out
      cp -r "$SOURCE_ROOT"/. $out/

      runHook postInstall
    '';
  };
in
{
  # WSL: install Windows WezTerm into the user's %LOCALAPPDATA%
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

        $DRY_RUN_CMD ${pkgs.coreutils}/bin/mkdir -p "$TARGET_DIR"

        # rsync without -p/-o/-g: /mnt/c is a Windows filesystem where unix
        # permissions/ownership are not meaningful and attempting to set them
        # produces spurious errors. -rlt preserves recursion, symlinks, and
        # mtimes — enough to keep --delete idempotent across runs.
        if [ -z "$DRY_RUN_CMD" ]; then
          rsync_error=$(${pkgs.rsync}/bin/rsync -rlt --delete \
            "${wezterm-windows-pkg}/" "$TARGET_DIR/" 2>&1)
          rsync_exit=$?
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
          $DRY_RUN_CMD ${pkgs.rsync}/bin/rsync -rlt --delete \
            "${wezterm-windows-pkg}/" "$TARGET_DIR/"
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
