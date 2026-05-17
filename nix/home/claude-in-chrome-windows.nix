# Claude-in-Chrome WSL→Windows Bridge (WSL only)
#
# Claude in Chrome doesn't officially support WSL, but a working bridge exists
# (anthropics/claude-code#41625): Windows-host Chrome talks to a WSL `claude`
# process via Chrome's native-messaging mechanism.
#
# This module installs the Windows-side artifacts on each home-manager
# activation:
#   1. C:\Users\<user>\.claude\chrome\chrome-native-host.bat — calls
#      `wsl.exe -d <distro> -- bash -lc 'claude --chrome-native-host'`
#   2. C:\Users\<user>\.claude\chrome\<host>.json — Chrome native-messaging
#      manifest pointing at the .bat
#   3. HKCU\Software\Google\Chrome\NativeMessagingHosts\<host> — REG_SZ value
#      pointing at the manifest path (HKCU needs no admin)
#   4. ~/.config/google-chrome/Default/Extensions → /mnt/c/.../Default/Extensions
#      symlink so claude inside WSL can read the installed extension
#
# What stays manual: installing the extension from the Chrome Web Store, and
# fully restarting Chrome (system tray) once after the first activation.

{
  config,
  pkgs,
  lib,
  ...
}:

let
  extensionId = "fcoeoabgfenejglbffodgkkbkcdhcgfn";
  hostName = "com.anthropic.claude_code_browser_extension";
in
{
  home.activation.installClaudeChromeBridge = lib.mkIf pkgs.stdenv.isLinux (
    lib.hm.dag.entryAfter [ "linkGeneration" ] ''
      readonly CC_ERR_PERMISSION_DENIED=31
      readonly CC_ERR_USERNAME_DETECTION=32
      readonly CC_ERR_DISTRO_DETECTION=33
      readonly CC_ERR_INSTALL_FAILED=34

      if [ ! -d "/mnt/c/Users" ]; then
        echo "Not running on WSL, skipping Claude-in-Chrome bridge install"
      else
        if [ ! -r "/mnt/c/Users" ]; then
          echo "ERROR: Permission denied accessing /mnt/c/Users/" >&2
          exit $CC_ERR_PERMISSION_DENIED
        fi

        # Auto-detect Windows username (same logic as wezterm-windows.nix:101)
        CC_LS_OUTPUT=$(ls /mnt/c/Users/ 2>/dev/null)
        WINDOWS_USER=$(echo "$CC_LS_OUTPUT" | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)

        if [ -z "$WINDOWS_USER" ] || [ ! -d "/mnt/c/Users/$WINDOWS_USER" ]; then
          echo "ERROR: Failed to detect Windows username under /mnt/c/Users/" >&2
          echo "  Available directories:" >&2
          echo "$CC_LS_OUTPUT" | sed 's/^/    /' >&2
          exit $CC_ERR_USERNAME_DETECTION
        fi

        # WSL distro name — needed because Chrome on Windows invokes wsl.exe
        # without the calling shell's environment, so the .bat must hardcode
        # which distro to enter.
        #
        # Detection order:
        #   1. $WSL_DISTRO_NAME — set by /init in vanilla WSL, but NixOS-WSL +
        #      systemd does not propagate it to user sessions.
        #   2. Windows default-distro from HKCU registry — works as long as
        #      this distro is set as the user's default on Windows.
        WSL_DISTRO=""
        if [ -n "''${WSL_DISTRO_NAME:-}" ]; then
          WSL_DISTRO="$WSL_DISTRO_NAME"
        else
          DEFAULT_GUID=$(/mnt/c/Windows/System32/reg.exe query \
            "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Lxss" \
            /v DefaultDistribution 2>/dev/null \
            | ${pkgs.gnugrep}/bin/grep -i 'DefaultDistribution' \
            | ${pkgs.gnused}/bin/sed -n 's/.*REG_SZ[[:space:]]*//p' \
            | tr -d '\r')
          if [ -n "$DEFAULT_GUID" ]; then
            WSL_DISTRO=$(/mnt/c/Windows/System32/reg.exe query \
              "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Lxss\\$DEFAULT_GUID" \
              /v DistributionName 2>/dev/null \
              | ${pkgs.gnugrep}/bin/grep -i 'DistributionName' \
              | ${pkgs.gnused}/bin/sed -n 's/.*REG_SZ[[:space:]]*//p' \
              | tr -d '\r')
          fi
        fi

        if [ -z "$WSL_DISTRO" ]; then
          echo "ERROR: Could not determine WSL distro name." >&2
          echo "  \$WSL_DISTRO_NAME is unset (NixOS-WSL + systemd drops it from user shells)" >&2
          echo "  and the Windows default-distro registry lookup also failed." >&2
          echo "  Workaround: prefix the command, e.g." >&2
          echo "    WSL_DISTRO_NAME=NixOS home-manager switch --flake .#default --impure" >&2
          exit $CC_ERR_DISTRO_DETECTION
        fi

        CHROME_DIR="/mnt/c/Users/$WINDOWS_USER/.claude/chrome"
        BAT_PATH="$CHROME_DIR/chrome-native-host.bat"
        JSON_PATH="$CHROME_DIR/${hostName}.json"

        $DRY_RUN_CMD ${pkgs.coreutils}/bin/mkdir -p "$CHROME_DIR"

        if [ -z "$DRY_RUN_CMD" ]; then
          # The .bat invokes WSL with a login shell so the user's nix profile
          # puts `claude` on PATH. Avoids baking a nix-store path that would
          # churn on every claude-code update.
          cat > "$BAT_PATH" <<BATEOF
@echo off
wsl.exe -d $WSL_DISTRO -- bash -lc "claude --chrome-native-host"
BATEOF

          # Native-messaging manifest. Backslashes are doubled for JSON
          # encoding of the Windows path. Single-quoted heredoc preserves the
          # literal backslashes; sed substitutes the username afterwards.
          cat > "$JSON_PATH" <<'JSONEOF'
{
  "name": "${hostName}",
  "description": "Claude Code WSL native-messaging host",
  "path": "C:\\Users\\__WINDOWS_USER__\\.claude\\chrome\\chrome-native-host.bat",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://${extensionId}/"
  ]
}
JSONEOF
          ${pkgs.gnused}/bin/sed -i "s/__WINDOWS_USER__/$WINDOWS_USER/g" "$JSON_PATH"

          echo "Wrote $BAT_PATH (WSL distro: $WSL_DISTRO)"
          echo "Wrote $JSON_PATH"

          # Register HKCU NativeMessagingHosts key. /f overwrites without
          # prompting, making this idempotent. HKCU is unprivileged.
          WIN_JSON_PATH='C:\Users\'"$WINDOWS_USER"'\.claude\chrome\${hostName}.json'
          if /mnt/c/Windows/System32/reg.exe add \
              "HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${hostName}" \
              /ve /t REG_SZ /d "$WIN_JSON_PATH" /f >/dev/null 2>&1; then
            echo "Registered HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${hostName}"
          else
            echo "ERROR: Failed to register native-messaging host in HKCU" >&2
            exit $CC_ERR_INSTALL_FAILED
          fi
        fi

        # WSL-side Extensions symlink: only when the Default Chrome profile
        # actually exists on Windows. ln -sfn replaces an existing symlink.
        WIN_EXTENSIONS_DIR="/mnt/c/Users/$WINDOWS_USER/AppData/Local/Google/Chrome/User Data/Default/Extensions"
        WSL_CHROME_PROFILE="$HOME/.config/google-chrome/Default"
        if [ -d "$WIN_EXTENSIONS_DIR" ]; then
          $DRY_RUN_CMD ${pkgs.coreutils}/bin/mkdir -p "$WSL_CHROME_PROFILE"
          $DRY_RUN_CMD ${pkgs.coreutils}/bin/ln -sfn "$WIN_EXTENSIONS_DIR" "$WSL_CHROME_PROFILE/Extensions"
          echo "Linked $WSL_CHROME_PROFILE/Extensions -> $WIN_EXTENSIONS_DIR"
        else
          echo "Windows Chrome Default profile not found at $WIN_EXTENSIONS_DIR; skipping Extensions symlink"
        fi

        echo ""
        echo "Claude-in-Chrome bridge installed."
        echo "  Fully quit Chrome from the system tray and relaunch to activate."
        echo "  Then run 'claude --chrome' inside WSL to start bridging."
      fi
    ''
  );
}
