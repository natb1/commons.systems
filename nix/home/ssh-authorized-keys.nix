# SSH Authorized Keys Management Module
#
# This module automatically manages ~/.ssh/authorized_keys by reading public keys
# from the central nix/ssh-keys/ directory. This enables:
#
# - Centralized key management in version control
# - Automatic key distribution across all machines
# - Easy access revocation (remove key from repo, rebuild)
# - Audit trail of who has access
#
# Usage:
#   1. Add public keys to nix/ssh-keys/machines/ or nix/ssh-keys/users/
#   2. Update the machineKeys or userKeys lists below
#   3. Run: home-manager switch
#   4. Your authorized_keys file is updated automatically!
#
# Security:
#   - Only PUBLIC keys (.pub files) should be in the repository
#   - Private keys remain on each machine, never synced
#   - authorized_keys file permissions are automatically set to 600

{ config, lib, ... }:

let
  sshKeysDir = ../ssh-keys;

  # Machine-specific keys (one per physical/virtual machine)
  # Add new machines here as you create them
  machineKeys = builtins.map builtins.readFile [
    "${sshKeysDir}/machines/wsl-nix.pub"
    # Add more machine keys here:
    # "${sshKeysDir}/machines/laptop.pub"
    # "${sshKeysDir}/machines/desktop.pub"
    "${sshKeysDir}/machines/client-machine.pub"
  ];

  # User keys (personal keys used across multiple machines)
  # These might be keys you use on your phone, web services, etc.
  userKeys = [
    # Add user keys here:
    # (builtins.readFile "${sshKeysDir}/users/n8.pub")
  ];

  # Combine all keys
  allKeys = machineKeys ++ userKeys;

  # Filter out empty lines and comments
  validKeys = builtins.filter (key: key != "" && !(lib.hasPrefix "#" key)) allKeys;
in
{
  # Manage authorized_keys file
  # SSH requires authorized_keys to be a real file (not a symlink) with mode 600
  # and owned by the user. We use home.activation to copy it properly.
  home.activation.updateAuthorizedKeys = lib.hm.dag.entryAfter [ "writeBoundary" ] ''
        AUTHORIZED_KEYS="${config.home.homeDirectory}/.ssh/authorized_keys"
        TEMP_KEYS=$(mktemp)

        # Write keys to temp file
        cat > "$TEMP_KEYS" <<'EOF'
    ${lib.concatStringsSep "\n" validKeys}
    EOF

        # Copy to authorized_keys if different or doesn't exist
        if [ ! -f "$AUTHORIZED_KEYS" ] || ! diff -q "$TEMP_KEYS" "$AUTHORIZED_KEYS" > /dev/null 2>&1; then
          $DRY_RUN_CMD cp "$TEMP_KEYS" "$AUTHORIZED_KEYS"
          $DRY_RUN_CMD chmod 600 "$AUTHORIZED_KEYS"
          echo "Updated ~/.ssh/authorized_keys"
        fi

        rm -f "$TEMP_KEYS"
  '';

  # Ensure .ssh directory exists with correct permissions
  # The directory permissions are managed by Home Manager automatically
  home.file.".ssh/.keep" = {
    text = "";
  };
}
