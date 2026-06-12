# Tailscale VPN Module
#
# Tailscale provides secure, zero-config VPN networking between your machines.
# Perfect for WSL2 where IP addresses change frequently.
#
# Benefits:
# - Stable IP addresses that don't change (even when WSL2 restarts)
# - Secure encrypted connections between your devices
# - Works from anywhere (not just LAN)
# - No router configuration or port forwarding needed
# - Simple hostname-based access (machine-name.tail-scale-network.ts.net)
#
# After enabling this module:
#   1. Rebuild: sudo nixos-rebuild switch
#   2. Authenticate: sudo tailscale up
#   3. Get your IP: tailscale ip -4
#   4. SSH using Tailscale: ssh user@machine-name.your-tailnet.ts.net
#
# Learn more: https://tailscale.com/

{
  config,
  pkgs,
  lib,
  ...
}:

{
  # Enable Tailscale VPN service
  services.tailscale = {
    enable = true;

    # Use routing features for subnet routing and exit nodes
    useRoutingFeatures = "both";

    # Port for Tailscale (default: 41641)
    # Change if you have conflicts
    # port = 41641;
  };

  # Firewall configuration
  networking.firewall = {
    # Trust the Tailscale interface
    trustedInterfaces = [ "tailscale0" ];

    # Allow Tailscale UDP port
    allowedUDPPorts = [ config.services.tailscale.port ];

    # Optional: Enable checkReversePath for Tailscale
    # This might be needed in some network configurations
    checkReversePath = "loose";
  };

  # Optional: Enable IP forwarding if you want to use this as a subnet router
  # Uncomment if you want to route traffic through this machine
  # boot.kernel.sysctl = {
  #   "net.ipv4.ip_forward" = 1;
  #   "net.ipv6.conf.all.forwarding" = 1;
  # };

  # System packages (Tailscale CLI is included in the service)
  # But you can add it to environment for convenience
  environment.systemPackages = with pkgs; [
    tailscale
  ];
}
