{ pkgs }:

pkgs.writeShellScriptBin "home-manager-setup" ''
  set -euo pipefail

  # Generic forker bootstrap: for plain Linux/macOS without NixOS-WSL or nix-darwin.
  # The author's WSL NixOS box uses `sudo nixos-rebuild switch` (nixosConfigurations.nixos)
  # and macOS uses `darwin-rebuild switch` (darwinConfigurations.default) instead.

  # Detect the current system
  SYSTEM="${pkgs.stdenv.hostPlatform.system}"

  echo "home-manager-setup: generic forker bootstrap (plain Linux/macOS)"
  echo "  NixOS-WSL users: use 'sudo nixos-rebuild switch' instead."
  echo "  nix-darwin users: use 'darwin-rebuild switch' instead."
  echo ""
  echo "Detected system: $SYSTEM"
  echo ""

  # Bootstrap: Enable experimental features if not already enabled
  NIX_CONF="$HOME/.config/nix/nix.conf"
  if [ ! -f "$NIX_CONF" ] || ! grep -q "experimental-features.*nix-command" "$NIX_CONF"; then
    echo "Bootstrapping: Enabling Nix experimental features..."
    mkdir -p "$(dirname "$NIX_CONF")"
    echo "experimental-features = nix-command flakes" >> "$NIX_CONF"
    echo "Experimental features enabled in $NIX_CONF"
    echo ""
  fi

  echo "Activating Home Manager configuration..."
  echo ""

  # Run home-manager switch with the detected system
  # Use --impure to allow access to USER and HOME environment variables
  # Use -b backup to automatically back up any conflicting files
  nix run home-manager/master -- \
    switch --impure -b backup --flake ".#$SYSTEM"

  echo ""
  echo "Home Manager activated successfully!"
  echo ""
  echo "Please restart your shell to apply changes:"
  echo "  exec \$SHELL"
  echo ""
  echo "Future updates can use:"
  echo "  home-manager switch -b backup --impure --flake .#$SYSTEM"
''
