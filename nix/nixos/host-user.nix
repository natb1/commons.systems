{ lib, ... }:
{
  options.instance.hostUser = lib.mkOption {
    type = lib.types.str;
    description = ''
      The operator's NixOS system account (wsl.defaultUser, users.users.<name>,
      and the office-hours producer user). No default — a NixOS system always
      needs a user; the instance flake supplies it.
    '';
  };
}
