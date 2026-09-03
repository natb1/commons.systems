# WezTerm Configuration Module
#
# Configures WezTerm terminal emulator through Home Manager.
# On WSL, automatically copies the configuration to the Windows WezTerm
# location so the Windows WezTerm installation uses this config.
#
# Platform-specific behavior:
# - Linux (WSL): Includes default_prog to launch WSL, a unix domain that reaches
#   the WSL mux server through wsl.exe, and copies the config to Windows
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

    # Build wezterm from the pinned nightly (nix/home/wezterm-pin.nix) rather than
    # the nixpkgs snapshot, so the mux server this installs matches the Windows GUI
    # binary that wezterm-windows.nix mirrors from the same pin. The mux-server
    # user service below references config.programs.wezterm.package, so it follows
    # this automatically. Harmless where wezterm is force-disabled (e.g. Darwin):
    # the option is set but the package is never realized. Refresh with
    # nix/home/sync-wezterm.sh.
    package = pkgs.callPackage ./wezterm-package.nix { };

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

          -- Reach the WSL mux server directly through wsl.exe rather than over
          -- the tailnet. Tailscale runs INSIDE WSL, so the Windows host has no
          -- MagicDNS entry for `nixos` and no route to its 100.x address — the
          -- ssh_domain built from the Tailscale Self node below is unreachable
          -- from here, even though every other tailnet peer resolves it fine.
          -- A unix domain whose proxy_command shells into the distro needs no
          -- DNS, no TCP listener and no SSH key. `wezterm` resolves on the
          -- distro's default PATH, so no login shell is needed — and none is
          -- used, since login-shell chatter would corrupt the proxy pipe.
          config.unix_domains = {
            {
              name = 'nixos',
              proxy_command = { 'wsl.exe', '-d', 'NixOS', '--', 'wezterm', 'cli', 'proxy' },
            },
          }

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
        -- Collect all nodes: Self + Peers.
        -- Self is skipped on Windows: it is the local WSL instance, already
        -- reached through the unix domain above. Adding it here would collide
        -- on the domain name `nixos` and point at an address the Windows host
        -- cannot resolve or route to.
        local nodes = {}
        if status.Self and not is_windows then
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

  # NixOS: run the mux server as a managed systemd user service.
  #
  # Otherwise the mux server is spawned lazily by `wezterm connect` as a detached
  # process that never restarts. After `home-manager switch` upgrades wezterm, that
  # stale process keeps the old binary, and a freshly-upgraded client fails the mux
  # version handshake ("unexpected response ... UnitResponse").
  #
  # As a managed unit its ExecStart store path tracks the active generation, so
  # home-manager's sd-switch (startServices defaults to true) restarts it onto the
  # new binary on every switch — keeping the running mux in lockstep with the
  # installed version. Cost: the restart drops live remote panes, which is inherent
  # to upgrading the binary.
  #
  # Note: on a headless server this user service only runs while the user has a
  # session. To keep it up across logins, enable lingering once on the box:
  #   loginctl enable-linger <user>
  systemd.user.services.wezterm-mux-server = lib.mkIf pkgs.stdenv.isLinux {
    Unit = {
      Description = "WezTerm multiplexer server";
      After = [ "default.target" ];
    };
    Service = {
      # --daemonize is a bare boolean flag (no `=value` form accepted); its
      # absence already means "run in the foreground", which is what a
      # systemd-supervised process needs.
      ExecStart = "${config.programs.wezterm.package}/bin/wezterm-mux-server";
      Restart = "on-failure";
    };
    Install.WantedBy = [ "default.target" ];
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

        # Three-tier resolution of the Windows user profile dir (TARGET_DIR).
        # The fallback chain is intended behavior per issue #62: each tier is
        # tried in order and falls through to the next on a miss; only the
        # final fallback tier raises a hard error.
        TARGET_DIR=""
        WINDOWS_USER=""

        # Tier 1 (override): an explicit WEZTERM_WINDOWS_USER env var wins when
        # it names a real profile. If set but missing, warn and fall through —
        # the override is a safe escape hatch, not a hard requirement.
        if [ -n "''${WEZTERM_WINDOWS_USER:-}" ]; then
          if [ -d "/mnt/c/Users/$WEZTERM_WINDOWS_USER" ]; then
            WINDOWS_USER="$WEZTERM_WINDOWS_USER"
            TARGET_DIR="/mnt/c/Users/$WINDOWS_USER"
          else
            echo "WARNING: WEZTERM_WINDOWS_USER='$WEZTERM_WINDOWS_USER' set but /mnt/c/Users/$WEZTERM_WINDOWS_USER does not exist; falling back to auto-detection" >&2
          fi
        fi

        # Tier 2 (WSL interop): ask Windows for its own %USERPROFILE% and map it
        # to a WSL path with wslpath. This is the authoritative answer on a real
        # WSL host. Any miss (interop absent, empty output, non-dir) falls through.
        if [ -z "$TARGET_DIR" ] && command -v cmd.exe >/dev/null 2>&1 && command -v wslpath >/dev/null 2>&1; then
          WIN_PROFILE=$(cmd.exe /c echo %USERPROFILE% 2>/dev/null | tr -d '\r')
          CAND=$(wslpath -u "$WIN_PROFILE" 2>/dev/null)
          if [ -n "$CAND" ] && [ -d "$CAND" ]; then
            case "$CAND" in
              /mnt/c/Users/*)
                TARGET_DIR="$CAND"
                WINDOWS_USER=$(basename "$CAND")
                ;;
              *)
                echo "WARNING: wslpath returned '$CAND' which is not under /mnt/c/Users/; falling back to heuristic" >&2
                ;;
            esac
          fi
        fi

        # Tier 3 (fallback heuristic): list /mnt/c/Users, drop known system
        # directories, take the first remaining entry. This is the last resort
        # and the only tier that raises a hard error when it cannot resolve a
        # valid profile directory.
        if [ -z "$TARGET_DIR" ]; then
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

          # Terminal failure: no candidate after filtering system directories.
          if [ -z "$WINDOWS_USER" ]; then
            echo "ERROR: Failed to detect Windows username" >&2
            echo "  Directory is readable but no valid user directories found" >&2
            echo "  Available directories:" >&2
            echo "$LS_OUTPUT" | sed 's/^/    /' >&2
            exit $ERR_USERNAME_DETECTION
          fi

          # Terminal failure: a candidate name was detected but its directory
          # does not exist (e.g. a race in mount availability).
          if [ ! -d "/mnt/c/Users/$WINDOWS_USER" ]; then
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

          TARGET_DIR="/mnt/c/Users/$WINDOWS_USER"
        fi

        # TARGET_DIR is guaranteed set here: each tier either set it or, in the
        # case of tier 3, exited. Copy logic is keyed on TARGET_DIR/TARGET_FILE.
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
        echo "Not running on WSL, skipping Windows config copy"
      fi
    ''
  );
}
