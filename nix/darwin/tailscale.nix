{ pkgs, ... }:
{
  # Runs the open-source tailscaled via launchd (com.tailscale.tailscaled).
  services.tailscale.enable = true;

  # Acceptance criterion calls for the CLI package explicitly. enabling the
  # service already puts `tailscale` on PATH, so this is belt-and-suspenders
  # (harmless if redundant) and makes the CLI dependency explicit.
  environment.systemPackages = [ pkgs.tailscale ];
}
