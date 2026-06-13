# Windows drive mounts for WSL2
#
# WSL auto-mounts fixed NTFS drives (C:) under /mnt, but does not auto-mount
# virtual/removable drives such as the Google Drive File Stream volume (G:).
# This module declares that mount so it is restored automatically on every
# `wsl --shutdown` / reboot instead of having to be mounted by hand.
#
# Requirements:
#   - Google Drive for desktop must be running on the Windows host, presenting
#     the G: drive. If it is not, the drvfs mount is empty until it starts.
#
# drvfs is WSL's Windows-filesystem driver (resolved via /sbin/mount.drvfs).
# uid/gid pin ownership to n8:users (1000:100); metadata enables Linux
# permission bits; x-mount.mkdir creates the mount point if absent.

{ ... }:

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
      "x-systemd.automount"
    ];
  };
}
