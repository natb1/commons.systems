# NixOS system configuration for this WSL2 machine.
#
# This is the substance of the system config; /etc/nixos/configuration.nix is a
# thin stub that imports this file, so the machine's configuration is managed in
# this repo. Rebuild with `sudo nixos-rebuild switch --flake .#nixos` after
# editing.
#
# The `--flake` form is required: the `wsl.*` options below (e.g. `wsl.enable`,
# `wsl.defaultUser`) are provided by `nixos-wsl.nixosModules.default`, which the
# flake injects into this configuration. This file no longer imports the
# channel's `<nixos-wsl/modules>` itself, so a standalone
# `sudo nixos-rebuild switch` (without `--flake`) — or a stub that imports this
# file without separately importing `<nixos-wsl/modules>` — fails with an
# undefined-option error for `wsl.enable`.
#
# NixOS-WSL specific options are documented on the NixOS-WSL repository:
# https://github.com/nix-community/NixOS-WSL

{ config, lib, pkgs, ... }:

{
  imports = [
    # Tailscale VPN for secure networking
    ./tailscale.nix
    # Windows drive mounts (Google Drive G: -> /mnt/g)
    ./mounts.nix
    # office-hours snapshot producer (system-level hourly timer)
    ./office-hours.nix
  ];

  wsl.enable = true;
  wsl.defaultUser = "n8";

  # Interim instance config for the office-hours snapshot producer. The forkable
  # module (./office-hours.nix) hardcodes nothing personal; these instance values
  # live here — the de-facto instance layer that already hardcodes the n8 user /
  # wsl.* (see flake.nix), until #2446 moves them to a per-identity instance flake.
  # The referenced EnvironmentFile is an operator secret provisioned out-of-band on
  # the host (mode 0600, owner n8); it is never committed. See ./office-hours.nix
  # for its required keys.
  services.officeHoursProducer = {
    enable = true;
    user = "n8";
    environmentFile = "/etc/office-hours/producer.env";
  };

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
    # Keep the wezterm-mux-server user service alive across logins declaratively,
    # replacing the imperative `loginctl enable-linger`.
    linger = true;
  };

  # environment.systemPackages = with pkgs; [ ]; # add system packages here

  programs.zsh.enable = true;
  users.defaultUserShell = pkgs.zsh;

  virtualisation.docker.enable = true;

  environment.variables.EDITOR = "nvim";

  # Eastern time. America/New_York tracks EST/EDT automatically.
  time.timeZone = "America/New_York";
}
