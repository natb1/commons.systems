# SSH Configuration Module
#
# This module configures SSH client settings through Home Manager.
# Home Manager will manage your ~/.ssh/config file declaratively.
#
# Features:
# - SSH agent integration
# - Security-focused defaults (modern ciphers, key algorithms)
# - Host-specific configurations
# - Automatic key management
#
# To add a new host, add an entry to programs.ssh.matchBlocks

{
  config,
  pkgs,
  lib,
  ...
}:

{
  programs.ssh = {
    enable = true;

    # Global SSH client settings
    extraConfig = ''
      # Security settings
      # Use modern, secure ciphers and key exchange algorithms
      Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
      KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512
      MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com,umac-128-etm@openssh.com
      HostKeyAlgorithms ssh-ed25519,rsa-sha2-512,rsa-sha2-256

      # Connection settings
      # Reuse connections for better performance
      ControlMaster auto
      ControlPath ~/.ssh/sockets/%r@%h:%p
      ControlPersist 10m

      # Keep connections alive
      ServerAliveInterval 60
      ServerAliveCountMax 3

      # Security
      HashKnownHosts yes
      StrictHostKeyChecking ask
      VerifyHostKeyDNS yes
    '';

    # Host-specific configurations
    # Add your hosts here following this pattern
    matchBlocks = {
      # Example GitHub configuration
      "github.com" = {
        hostname = "github.com";
        user = "git";
        identityFile = "~/.ssh/id_ed25519";
        identitiesOnly = true;
      };

      # Example: Personal server
      # "myserver" = {
      #   hostname = "example.com";
      #   user = "username";
      #   port = 22;
      #   identityFile = "~/.ssh/id_ed25519";
      #   forwardAgent = false;
      # };
    };
  };

  # SSH Agent service - manages SSH keys in memory
  services.ssh-agent = {
    enable = true;
  };

  # Ensure the sockets directory exists for ControlMaster
  home.file.".ssh/sockets/.keep".text = "";
}
