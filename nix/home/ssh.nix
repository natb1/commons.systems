# SSH Configuration Module
#
# This module configures SSH client settings through Home Manager.
# Home Manager will manage your ~/.ssh/config file declaratively.
#
# Features:
# - SSH agent integration
# - Security-focused defaults (modern ciphers, key algorithms)
# - Host-specific configurations
#
# To add a new host, add an entry to programs.ssh.matchBlocks

{ ... }:

{
  programs.ssh = {
    enable = true;
    enableDefaultConfig = false;

    extraConfig = ''
      Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
      KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512
      MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com,umac-128-etm@openssh.com
      HostKeyAlgorithms ssh-ed25519,rsa-sha2-512,rsa-sha2-256
    '';

    matchBlocks = {
      "*" = {
        forwardAgent = false;
        compression = false;
        userKnownHostsFile = "~/.ssh/known_hosts";
        controlMaster = "auto";
        controlPath = "~/.ssh/sockets/%r@%h:%p";
        controlPersist = "10m";
        serverAliveInterval = 60;
        serverAliveCountMax = 3;
        hashKnownHosts = true;
        addKeysToAgent = "no";
        extraOptions = {
          StrictHostKeyChecking = "ask";
          VerifyHostKeyDNS = "yes";
        };
      };

      "github.com" = {
        hostname = "github.com";
        user = "git";
        identityFile = "~/.ssh/id_ed25519";
        identitiesOnly = true;
      };
    };
  };

  # SSH Agent service - manages SSH keys in memory
  services.ssh-agent = {
    enable = true;
  };

  # Ensure the sockets directory exists for ControlMaster
  home.file.".ssh/sockets/.keep".text = "";
}
