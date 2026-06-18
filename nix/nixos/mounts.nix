# Windows drive mounts for WSL2
#
# WSL auto-mounts fixed NTFS drives (C:) under /mnt, but does not auto-mount
# virtual/removable drives such as the Google Drive File Stream volume (G:).
# This module declares that mount so it is restored automatically on every
# `wsl --shutdown` / reboot instead of having to be mounted by hand.
#
# Why a poll-and-mount service instead of `x-systemd.automount`:
#
#   The obvious declaration is `fileSystems."/mnt/g"` with `x-systemd.automount`,
#   which mounts on first access. On WSL that is a trap. Google Drive for
#   desktop presents G: only after Windows login, which is typically *later*
#   than WSL boot, so the boot-time mount attempt fails:
#
#       mount: /mnt/g: special device G: does not exist.
#
#   `x-systemd.automount` then leaves an autofs placeholder over /mnt/g. That
#   autofs combined with drvfs's `symlinkroot=/mnt/` degrades into a dead
#   mountpoint that resolves as a symlink loop — every access fails with
#   "Too many levels of symbolic links" (ELOOP), and the unit does not
#   re-arm. A plain `mount -t drvfs G: /mnt/g` (no autofs) does not hit this.
#
#   So we mount G: directly (no automount, no autofs) and use a short-lived
#   oneshot service to wait for Drive to come up. This both survives WSL
#   restarts and avoids leaving /mnt/g silently empty when Drive is slow to
#   start: if G: never appears the service fails loudly rather than masking it.
#
# Requirements:
#   - Google Drive for desktop must be running on the Windows host, presenting
#     the G: drive.
#
# drvfs is WSL's Windows-filesystem driver (resolved via /sbin/mount.drvfs).
# uid/gid pin ownership to n8:users (1000:100); metadata enables Linux
# permission bits; x-mount.mkdir creates the mount point if absent. noauto
# keeps the failed-at-boot eager mount from running; the service mounts it.

{ pkgs, ... }:

{
  fileSystems."/mnt/g" = {
    device = "G:";
    fsType = "drvfs";
    options = [
      "rw"
      "noatime"
      "uid=1000"
      "gid=100"
      "metadata"
      "x-mount.mkdir"
      "nofail"
      "noauto"
    ];
  };

  systemd.services.mount-gdrive = {
    description = "Mount Google Drive (G:) once Drive for desktop presents it";
    wantedBy = [ "multi-user.target" ];
    after = [ "local-fs.target" ];
    serviceConfig = {
      Type = "oneshot";
      RemainAfterExit = true;
      # Poll for ~2 min (12 × 10s) so a Drive that starts after WSL boot is
      # still picked up, then error clearly if it never appears.
      ExecStart = pkgs.writeShellScript "mount-gdrive" ''
        for _ in $(seq 1 12); do
          ${pkgs.util-linux}/bin/mountpoint -q /mnt/g && exit 0
          ${pkgs.util-linux}/bin/mount /mnt/g && exit 0
          sleep 10
        done
        echo "G: (Google Drive) did not appear after ~2 min; is Drive for desktop running on Windows?" >&2
        exit 1
      '';
    };
  };
}
