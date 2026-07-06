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
# uid/gid pin ownership to the operator user / `users` group (1000:100);
# metadata enables Linux
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

  # Timer-driven self-heal for a mid-session stale/missing G: mount.
  #
  # Why this exists separately from the boot oneshot above:
  #
  #   mount-gdrive is a `Type=oneshot` with `RemainAfterExit=true`: it mounts
  #   once at boot and then sits as `active (exited)` forever, never
  #   re-evaluating. But Google Drive for desktop can restart on the Windows
  #   host mid-session (update, sign-out, crash). When it does, the Linux mount
  #   entry persists pointing at a now-dead device: the path is still a
  #   mountpoint, but any access fails with ENODEV ("No such device"). The boot
  #   oneshot never notices. This timer re-evaluates the mount every minute and
  #   re-mounts it when it has gone stale or missing.
  #
  # Why the probe is `mountpoint -q` + `stat /mnt/g/.`, not `mountpoint -q`
  # alone:
  #
  #   The two failure modes need two different probes, each used for its
  #   strength:
  #     - MISSING (not a mountpoint at all) is caught by `mountpoint -q`.
  #     - STALE (mountpoint present, backing device dead) still PASSES
  #       `mountpoint -q` — the path is a mountpoint, only the device is gone.
  #       To catch it we must probe INTO the mount with `stat /mnt/g/.`. The
  #       trailing `/.` forces path resolution inside the mounted fs, touching
  #       the dead device; a bare `stat /mnt/g` can return cached mountpoint
  #       inode metadata and falsely pass. (Conversely, on the
  #       systemd-created / `x-mount.mkdir` mountpoint, a bare `stat /mnt/g`
  #       could also pass on an empty unmounted dir.) So each probe does the
  #       job the other can't.
  #
  # Why a bare `oneshot` with no RemainAfterExit and no service `wantedBy`:
  #
  #   The service must actually re-run on every timer tick. RemainAfterExit
  #   would leave it `active (exited)` and systemd would never start it again —
  #   exactly the boot-oneshot trap we are working around. And only the TIMER
  #   carries `wantedBy = [ "timers.target" ]`; giving the service a `wantedBy`
  #   too would have it race the boot mount instead of leaving startup to
  #   mount-gdrive.
  #
  # Why it `exit 0`s every time:
  #
  #   The boot oneshot owns the loud "Drive absent at startup" signal (it
  #   exits non-zero so a Drive that never appears shows up in
  #   `systemctl --failed`). This healer is a per-minute janitor: it keeps
  #   `systemctl --failed` clean by always exiting 0, logging any re-mount
  #   failure to the journal without masking it as a unit failure.
  systemd.timers."mount-gdrive-heal" = {
    wantedBy = [ "timers.target" ];
    timerConfig = {
      OnBootSec = "3min";
      OnUnitActiveSec = "1min";
    };
  };

  systemd.services."mount-gdrive-heal" = {
    description = "Re-mount Google Drive (G:) if it has gone stale or missing";
    after = [ "mount-gdrive.service" ];
    serviceConfig = {
      Type = "oneshot";
      ExecStart = pkgs.writeShellScript "mount-gdrive-heal" ''
        # MISSING: not a mountpoint at all (e.g. Drive came up after the boot
        # poll window, or a prior umount). Mount and finish.
        ${pkgs.util-linux}/bin/mountpoint -q /mnt/g || {
          ${pkgs.util-linux}/bin/mount /mnt/g \
            || echo "G: (Google Drive) not mountable; is Drive for desktop running on Windows?" >&2
          exit 0
        }
        # MOUNTPOINT PRESENT — distinguish healthy from stale by probing INTO the
        # mount. The trailing /. forces path resolution inside the mounted fs,
        # which touches the (possibly dead) backing device; bare `stat /mnt/g` can
        # return cached mountpoint inode metadata and falsely pass on a stale mount.
        ${pkgs.coreutils}/bin/stat /mnt/g/. >/dev/null 2>&1 && exit 0
        # STALE: mountpoint passes but device is dead (ENODEV). Lazily detach the
        # dead entry (tolerate "not mounted"), then re-mount.
        ${pkgs.util-linux}/bin/umount -l /mnt/g 2>/dev/null || true
        ${pkgs.util-linux}/bin/mount /mnt/g \
          || echo "G: (Google Drive) re-mount failed; is Drive for desktop running on Windows?" >&2
        exit 0
      '';
    };
  };
}
