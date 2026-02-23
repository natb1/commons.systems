# SSH Key Auto-Generation Module
#
# This module automatically generates SSH keys on new machines if they don't exist.
# This eliminates the manual step of running ssh-keygen on each new machine.
#
# Features:
# - Generates Ed25519 key (modern, secure, fast)
# - Only generates if key doesn't already exist
# - Sets correct permissions automatically
# - Uses hostname-based comment for identification
#
# After key generation:
#   1. View your public key: cat ~/.ssh/id_ed25519.pub
#   2. Add it to nix/ssh-keys/machines/<hostname>.pub
#   3. Commit to repo for distribution to other machines
#
# Security:
#   - Keys are generated locally on each machine
#   - Private keys never leave the machine
#   - No passphrase (for automation - add one manually if needed)

{
  config,
  lib,
  pkgs,
  ...
}:

let
  sshDir = "${config.home.homeDirectory}/.ssh";

  # Primary key (default for most operations)
  primaryKeyFile = "${sshDir}/id_ed25519";

  # Optional: Generate service-specific keys
  githubKeyFile = "${sshDir}/id_ed25519_github";
in
{
  # Generate primary SSH key if it doesn't exist
  home.activation.generatePrimarySshKey = lib.hm.dag.entryAfter [ "writeBoundary" ] ''
    if [ ! -f "${primaryKeyFile}" ]; then
      echo "Generating SSH key at ${primaryKeyFile}..."
      $DRY_RUN_CMD ${pkgs.openssh}/bin/ssh-keygen \
        -t ed25519 \
        -C "$(whoami)@$(${pkgs.nettools}/bin/hostname)" \
        -N "" \
        -f "${primaryKeyFile}"

      echo ""
      echo "✓ SSH key generated successfully!"
      echo ""
      echo "Your public key:"
      echo "----------------"
      $DRY_RUN_CMD cat "${primaryKeyFile}.pub"
      echo "----------------"
      echo ""
      echo "Next steps:"
      echo "  1. Copy the public key above"
      echo "  2. Add it to: nix/ssh-keys/machines/$(${pkgs.nettools}/bin/hostname).pub"
      echo "  3. Commit and push to enable SSH access from other machines"
      echo ""
    fi
  '';

  # Optional: Generate GitHub-specific key
  # Uncomment this block if you want separate keys for GitHub
  # home.activation.generateGithubSshKey = lib.hm.dag.entryAfter ["writeBoundary"] ''
  #   if [ ! -f "${githubKeyFile}" ]; then
  #     echo "Generating GitHub-specific SSH key at ${githubKeyFile}..."
  #     $DRY_RUN_CMD ${pkgs.openssh}/bin/ssh-keygen \
  #       -t ed25519 \
  #       -C "github-$(whoami)@$(${pkgs.nettools}/bin/hostname)" \
  #       -N "" \
  #       -f "${githubKeyFile}"
  #
  #     echo "✓ GitHub SSH key generated!"
  #     echo "Add this key to https://github.com/settings/keys"
  #     echo ""
  #     $DRY_RUN_CMD cat "${githubKeyFile}.pub"
  #     echo ""
  #   fi
  # '';

  # Ensure SSH directory exists with correct permissions
  # Note: SSH keys are generated with correct permissions by ssh-keygen
  # The .ssh directory permissions are managed by Home Manager
  home.file.".ssh/.permissions" = {
    text = "# This file ensures .ssh directory is created with correct permissions\n";
  };
}
