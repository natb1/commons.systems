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
# The option defaults to null (unset), which is inert: no key material, no
# write to ~/.ssh/authorized_keys, and any pre-existing file is left untouched.
# Setting it to an explicit list — including the empty list `[ ]` — is
# authoritative: the file is rewritten to exactly those keys, so `[ ]` clears
# it and revokes all access (see "Easy access revocation" above).
#
# Security:
#   - Only PUBLIC keys should be supplied via this option
#   - Private keys remain on each machine, never synced
#   - authorized_keys file permissions are automatically set to 600

{ config, lib, ... }:

let
  cfg = config.services.sshAuthorizedKeys.keys;

  # Filter out empty lines and comments. Guarded so `null` (unset) does not
  # error under builtins.filter; the activation script is gated on `cfg != null`
  # (explicitly set), not on this list being non-empty.
  validKeys = lib.optionals (cfg != null) (
    builtins.filter (key: key != "" && !(lib.hasPrefix "#" key)) cfg
  );
in
{
  options.services.sshAuthorizedKeys.keys = lib.mkOption {
    type = lib.types.nullOr (lib.types.listOf lib.types.str);
    default = null;
    description = ''
      Authorized public-key strings written to ~/.ssh/authorized_keys. Unset
      (null, the default) leaves any pre-existing authorized_keys file
      untouched. An explicit list is authoritative: the file is rewritten to
      exactly those keys, so `[ ]` clears it and revokes all access. The
      instance supplies real keys.
    '';
  };

  config = {
    # Manage authorized_keys file
    # SSH requires authorized_keys to be a real file (not a symlink) with mode 600
    # and owned by the user. We use home.activation to copy it properly.
    home.activation.updateAuthorizedKeys = lib.hm.dag.entryAfter [ "writeBoundary" ] (
      lib.optionalString (cfg != null) ''
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
