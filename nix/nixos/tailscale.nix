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

  # Rebind tailscaled when the WSL2 NAT IP rotates under it.
  #
  # WSL2 runs eth0 behind a NAT-mode virtual adapter whose IP can change while
  # the daemon is already running. When that happens, tailscaled's magicsock
  # socket and DERP receive path stay bound to the OLD eth0 IP: outbound keeps
  # working (fresh NAT mappings still open, host-initiated `tailscale ping`
  # pongs), but cold INBOUND is dead — a peer's `tailscale ping <host>` times
  # out over both direct and DERP, so SSH to the host hangs. A `systemctl
  # restart tailscaled` re-runs endpoint discovery and re-homes DERP on the
  # current eth0 IP, reclaiming the same Tailscale IP.
  #
  # This watcher automates that: it tails address-change events and restarts
  # tailscaled whenever eth0 gains an address. `ip monitor` has no per-device
  # filter, so we match "eth0" in the event text; the delete half of a rotation
  # is ignored, and tailscale0's own up/down churn is filtered out (we only act
  # on eth0), so a restart cannot feed back into another restart.
  systemd.services.tailscaled-wsl-rebind = {
    description = "Restart tailscaled when the WSL2 eth0 NAT IP rotates under it";
    after = [ "tailscaled.service" ];
    wantedBy = [ "multi-user.target" ];
    path = [ pkgs.iproute2 ];
    serviceConfig = {
      Restart = "always";
      RestartSec = 5;
    };
    script = ''
      ip monitor address | while read -r line; do
        case "$line" in
          Deleted*) ;;                       # ignore the delete half of a rotation
          *eth0*"inet "*) systemctl restart tailscaled ;;
        esac
      done
    '';
  };

  # Optional: Enable IP forwarding if you want to use this as a subnet router
  # Uncomment if you want to route traffic through this machine
  # boot.kernel.sysctl = {
  #   "net.ipv4.ip_forward" = 1;
  #   "net.ipv6.conf.all.forwarding" = 1;
  # };
}
