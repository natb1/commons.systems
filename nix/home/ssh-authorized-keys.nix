# SSH Authorized Keys Management Module
#
# This module manages ~/.ssh/authorized_keys from a list of public-key strings
# supplied by the instance via `services.sshAuthorizedKeys.keys`. This enables:
#
# - Centralized key management in version control
# - Automatic key distribution across all machines
# - Easy access revocation (remove key from the option value, rebuild)
# - Audit trail of who has access
#
# Usage:
#   1. Set `services.sshAuthorizedKeys.keys` to a list of public-key strings
#      in your instance's home-manager configuration.
#   2. Run: home-manager switch
#   3. Your authorized_keys file is updated automatically!
#
# The option defaults to an empty list, which is inert: no key material, no
# write to ~/.ssh/authorized_keys, and any pre-existing file is left untouched.
#
# Security:
#   - Only PUBLIC keys should be supplied via this option
#   - Private keys remain on each machine, never synced
#   - authorized_keys file permissions are automatically set to 600

{ config, lib, ... }:

let
  # Filter out empty lines and comments
  validKeys = builtins.filter (key: key != "" && !(lib.hasPrefix "#" key)) config.services.sshAuthorizedKeys.keys;
in
{
  options.services.sshAuthorizedKeys.keys = lib.mkOption {
    type = lib.types.listOf lib.types.str;
    default = [ ];
    description = ''
      Authorized public-key strings written to ~/.ssh/authorized_keys. Empty
      (the default) leaves any pre-existing authorized_keys file untouched;
      the instance supplies real keys.
    '';
  };

  config = {
    # Manage authorized_keys file
    # SSH requires authorized_keys to be a real file (not a symlink) with mode 600
    # and owned by the user. We use home.activation to copy it properly.
    home.activation.updateAuthorizedKeys = lib.hm.dag.entryAfter [ "writeBoundary" ] (
      lib.optionalString (validKeys != [ ]) ''
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
      ''
    );

    # Ensure .ssh directory exists with correct permissions
    # The directory permissions are managed by Home Manager automatically
    home.file.".ssh/.keep" = {
      text = "";
    };
  };
}
