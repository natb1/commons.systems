# NixOS system configuration for this WSL2 machine.
#
# This is the substance of the system config; /etc/nixos/configuration.nix is a
# thin stub that imports this file, so the machine's configuration is managed in
# this repo. Rebuild with `sudo nixos-rebuild switch` after editing.
#
# NixOS-WSL specific options are documented on the NixOS-WSL repository:
# https://github.com/nix-community/NixOS-WSL

{ config, lib, pkgs, ... }:

{
  imports = [
    # include NixOS-WSL modules (resolved via the nixos-wsl channel)
    <nixos-wsl/modules>
    # Tailscale VPN for secure networking
    ./tailscale.nix
    # Windows drive mounts (Google Drive G: -> /mnt/g)
    ./mounts.nix
  ];

  wsl.enable = true;
  wsl.defaultUser = "n8";

  # This value determines the NixOS release from which the default
  # settings for stateful data, like file locations and database versions
  # on your system were taken. It's perfectly fine and recommended to leave
  # this value at the release version of the first install of this system.
  # Before changing this value read the documentation for this option
  # (e.g. man configuration.nix or on https://nixos.org/nixos/options.html).
  system.stateVersion = "23.11"; # Did you read the comment?

  # Enable OpenSSH server
  services.openssh = {
    enable = true;
    settings = {
      PermitRootLogin = "no";
      PasswordAuthentication = false;
    };
  };

  # Enable Avahi for mDNS (allows nixos.local hostname)
  services.avahi = {
    enable = true;
    nssmdns4 = true;
    publish = {
      enable = true;
      addresses = true;
      domain = true;
      hinfo = true;
      userServices = true;
      workstation = true;
    };
  };

  # User configuration
  users.users.n8 = {
    isNormalUser = true;
    home = "/home/n8";
    extraGroups = [ "wheel" "docker" ];
    shell = pkgs.zsh;
  };

  # environment.systemPackages = with pkgs; [ ]; # add system packages here

  programs.zsh.enable = true;
  users.defaultUserShell = pkgs.zsh;

  virtualisation.docker.enable = true;

  environment.variables.EDITOR = "nvim";
}
