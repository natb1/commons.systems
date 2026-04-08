# WezTerm Configuration Module
#
# Configures WezTerm terminal emulator through Home Manager.
# On WSL, automatically copies the configuration to the Windows WezTerm
# location so the Windows WezTerm installation uses this config.
#
# Platform-specific behavior:
# - Linux (WSL): Includes default_prog to launch WSL, copies config to Windows
# - macOS: Includes native fullscreen mode setting
# - All: Minimal config using config_builder()

{
  config,
  pkgs,
  lib,
  ...
}:

{
  programs.wezterm = {
    enable = true;

    # Use extraConfig to generate Lua configuration with Nix string interpolation.
    # This allows platform-specific sections via lib.optionalString.
    extraConfig = ''
      local config = wezterm.config_builder()

      ${lib.optionalString pkgs.stdenv.isLinux ''
        -- WSL Integration: set default_prog only when running on Windows.
        -- This config is generated on NixOS and copied to Windows, but the NixOS
        -- mux server also reads it — wsl.exe only exists on the Windows side.
        if wezterm.target_triple:find('windows') then
          config.default_prog = { 'wsl.exe', '-d', 'NixOS', '--cd', '/home/' .. ${lib.strings.toJSON config.home.username} }
          config.default_gui_startup_args = { 'connect', 'nixos' }
        end
      ''}

      ${lib.optionalString pkgs.stdenv.isDarwin ''
        -- Enable macOS native fullscreen mode
        config.native_macos_fullscreen_mode = true
      ''}

      -- Auto-discover Tailscale peers for ssh_domains.
      -- Wrapped in pcall so config loads cleanly if tailscale is unavailable.
      -- On Windows, tailscale runs inside WSL so invoke it via a login shell
      -- to get the NixOS PATH (a non-login shell won't have tailscale on PATH).
      local is_windows = wezterm.target_triple:find('windows')
      local tailscale_status_cmd = { 'tailscale', 'status', '--json' }
      if is_windows then
        tailscale_status_cmd = { 'wsl.exe', '-d', 'NixOS', '--', 'bash', '-lc', 'tailscale status --json' }
      end

      local ssh_domains = {}
      local pcall_ok, pcall_err = pcall(function()
        local ok, stdout, stderr = wezterm.run_child_process(tailscale_status_cmd)
        if not ok then
          wezterm.log_warn('tailscale status failed: ' .. (stderr or '(no stderr)'))
          return
        end
        local status = wezterm.json_parse(stdout)
        if not status then
          wezterm.log_warn('Failed to parse tailscale status JSON; stdout length: ' .. #stdout)
          return
        end
        -- Collect all nodes: Self + Peers
        local nodes = {}
        if status.Self then
          table.insert(nodes, status.Self)
        end
        if status.Peer then
          for _, peer in pairs(status.Peer) do
            table.insert(nodes, peer)
          end
        end
        for _, node in ipairs(nodes) do
          if node.DNSName then
            -- DNSName has a trailing dot; strip it and take the short hostname
            local fqdn = node.DNSName:gsub('%.$', "")
            local hostname = fqdn:match('^([^.]+)')
            if hostname then
              local domain = {
                name = hostname,
                remote_address = hostname,
                username = ${lib.strings.toJSON config.home.username},
              }
              -- On Windows, point to the WSL SSH key via the \\wsl$ UNC share
              -- since WezTerm's built-in SSH client can't see the WSL filesystem.
              if is_windows then
                domain.ssh_option = {
                  identityfile = '//wsl$/NixOS/home/' .. ${lib.strings.toJSON config.home.username} .. '/.ssh/id_ed25519',
                }
              end
              table.insert(ssh_domains, domain)
            end
          end
        end
      end)
      if not pcall_ok then
        wezterm.log_warn('ssh_domains discovery failed: ' .. tostring(pcall_err))
      end
      config.ssh_domains = ssh_domains

      config.keys = {
        { key = '9', mods = 'CMD', action = wezterm.action.ActivateTabRelative(1) },
      }

      wezterm.on('format-tab-title', function(tab)
        local index = tab.tab_index + 1
        local branch = tab.active_pane.user_vars.git_branch or ""
        local title = tab.active_pane.title
        if branch ~= "" then
          return index .. ': ' .. branch .. ' > ' .. title
        end
        return index .. ': ' .. title
      end)

      return config
    '';
  };

  # WSL: Copy config to Windows WezTerm location
  # This activation script runs after Home Manager generates config files.
  # DAG ordering: Must run after "linkGeneration" to ensure the source file exists
  # before attempting to copy it to Windows.
  home.activation.copyWeztermToWindows = lib.mkIf pkgs.stdenv.isLinux (
    lib.hm.dag.entryAfter [ "linkGeneration" ] ''
      # Structured error codes for programmatic error handling by callers
      readonly ERR_PERMISSION_DENIED=11
      readonly ERR_USERNAME_DETECTION=12
      readonly ERR_SOURCE_MISSING=13
      readonly ERR_COPY_FAILED=14
      readonly ERR_SOURCE_EMPTY=15

      # Check if running on WSL (Windows mount point exists)
      if [ -d "/mnt/c/Users" ]; then
        # Verify /mnt/c/Users is readable
        if [ ! -r "/mnt/c/Users" ]; then
          echo "ERROR: Permission denied accessing /mnt/c/Users/" >&2
          echo "  WSL mount exists but directory is not readable" >&2
          echo "" >&2
          echo "To fix:" >&2
          echo "  1. Check mount options: mount | grep /mnt/c" >&2
          echo "  2. Check directory permissions: ls -ld /mnt/c/Users" >&2
          echo "  3. May need to remount with proper permissions" >&2
          exit $ERR_PERMISSION_DENIED
        fi

        # Auto-detect Windows username by finding first directory that isn't
        # a Windows system directory (excludes: All Users, Default, Default User,
        # Public, desktop.ini)
        LS_STDERR=$(mktemp)
        trap 'if ! rm -f "$LS_STDERR" 2>&1; then echo "WARNING: Failed to cleanup stderr temp file: $LS_STDERR" >&2; fi' EXIT
        LS_OUTPUT=$(ls /mnt/c/Users/ 2>"$LS_STDERR")
        LS_EXIT_CODE=$?

        if [ $LS_EXIT_CODE -ne 0 ]; then
          echo "ERROR: Failed to list /mnt/c/Users/ directory" >&2
          echo "  Exit code: $LS_EXIT_CODE" >&2
          if [ -s "$LS_STDERR" ]; then
            echo "  Error output:" >&2
            if ! cat "$LS_STDERR" 2>/dev/null | sed 's/^/    /' >&2; then
              echo "    (failed to read error file - may indicate filesystem issue)" >&2
              echo "    Error file location: $LS_STDERR" >&2
            fi
          fi
          echo "  Check permissions and mount status" >&2
          echo "  Diagnostic directory listing:" >&2
          ls -ld /mnt/c/Users/ 2>&1 || echo "  (diagnostic ls failed)" >&2
          exit $ERR_PERMISSION_DENIED
        fi

        WINDOWS_USER=$(echo "$LS_OUTPUT" | grep -v -E '^(All Users|Default|Default User|Public|desktop.ini)$' | head -n1)

        if [ -z "$WINDOWS_USER" ]; then
          echo "ERROR: Failed to detect Windows username" >&2
          echo "  Directory is readable but no valid user directories found" >&2
          echo "  Available directories:" >&2
          echo "$LS_OUTPUT" | sed 's/^/    /' >&2
          exit $ERR_USERNAME_DETECTION
        fi

        if [ -n "$WINDOWS_USER" ] && [ -d "/mnt/c/Users/$WINDOWS_USER" ]; then
          TARGET_DIR="/mnt/c/Users/$WINDOWS_USER"
          TARGET_FILE="$TARGET_DIR/.wezterm.lua"

          # Verify source file exists before copying
          SOURCE_FILE="${config.home.homeDirectory}/.config/wezterm/wezterm.lua"
          if [ ! -f "$SOURCE_FILE" ]; then
            echo "ERROR: Source WezTerm config not found at $SOURCE_FILE" >&2
            echo "Home-Manager may have failed to generate the configuration" >&2
            exit $ERR_SOURCE_MISSING
          fi

          # Verify source file is not empty
          if [ ! -s "$SOURCE_FILE" ]; then
            echo "ERROR: Source WezTerm config is empty at $SOURCE_FILE" >&2
            echo "This may indicate:" >&2
            echo "  - Home-Manager configuration has empty extraConfig" >&2
            echo "  - File generation failed or was truncated" >&2
            echo "  - Accidental empty string in programs.wezterm.extraConfig" >&2
            exit $ERR_SOURCE_EMPTY
          fi

          # Copy config file with error checking and stderr capture
          if [ -z "$DRY_RUN_CMD" ]; then
            # Normal mode: capture stderr for better diagnostics
            if ! copy_error=$(cp ''${VERBOSE_ARG:+"$VERBOSE_ARG"} "$SOURCE_FILE" "$TARGET_FILE" 2>&1); then
              echo "ERROR: Failed to copy WezTerm config to $TARGET_FILE" >&2
              echo "  Copy error: $copy_error" >&2
              echo "  Common causes: permissions, disk space, file locked by running WezTerm" >&2
              exit $ERR_COPY_FAILED
            fi
          else
            # Dry run mode: execute but don't fail on dry run
            $DRY_RUN_CMD cp ''${VERBOSE_ARG:+"$VERBOSE_ARG"} "$SOURCE_FILE" "$TARGET_FILE"
          fi
          echo "Copied WezTerm config to Windows location: $TARGET_FILE"
        else
          # User was detected but directory doesn't exist - this is an error state
          echo "ERROR: Detected Windows username '$WINDOWS_USER' but directory does not exist" >&2
          echo "  Expected directory: /mnt/c/Users/$WINDOWS_USER" >&2
          echo "" >&2

          if ! ls_output=$(ls -1 /mnt/c/Users/ 2>&1); then
            echo "ERROR: Additionally, cannot list /mnt/c/Users/ for diagnostics" >&2
            echo "  Directory passed initial checks but is now inaccessible" >&2
            echo "  This indicates a filesystem or permission issue" >&2
            echo "  Error: $ls_output" >&2
            exit $ERR_USERNAME_DETECTION
          fi

          echo "Available directories in /mnt/c/Users/:" >&2
          echo "$ls_output" | sed 's/^/  /' >&2
          echo "" >&2
          echo "This may indicate:" >&2
          echo "  - WSL mount configuration issue" >&2
          echo "  - Incorrect user directory detection logic" >&2
          echo "  - Race condition in directory availability" >&2
          exit $ERR_USERNAME_DETECTION
        fi
      else
        echo "Not running on WSL, skipping Windows config copy"
      fi
    ''
  );
}
