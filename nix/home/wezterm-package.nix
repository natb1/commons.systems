# WSL WezTerm package — nixpkgs' wezterm rebuilt from the pinned nightly commit.
#
# nixpkgs pins its own (older) nightly snapshot; we override the source to the
# exact commit the Windows GUI binary was built from (see wezterm-pin.nix) so the
# mux server this produces speaks the same protocol as the Windows client.
#
# The override replaces `src` and the vendored-deps hash. Everything else — build
# inputs, patches, features, the mux-server/gui outputs — is inherited from
# nixpkgs' wezterm, so this tracks upstream packaging fixes automatically.
{ pkgs }:

let
  pin = import ./wezterm-pin.nix;

  src = pkgs.fetchFromGitHub {
    owner = "wezterm";
    repo = "wezterm";
    rev = pin.rev;
    fetchSubmodules = true;
    hash = pin.srcHash;
  };
in
pkgs.wezterm.overrideAttrs (_: {
  version = "0-unstable-${pin.version}";
  inherit src;

  # buildRustPackage bakes the vendor hash from the ORIGINAL `cargoHash` argument
  # at call time (`hash = args.cargoHash`), which overrideAttrs cannot reach — so
  # overriding `version`/`src` alone leaves the vendor pinned to the old hash and
  # the build fails with a mismatch. `cargoDeps` IS a replaceable derivation
  # attribute, so supply a fresh vendor built from the new source with the pinned
  # hash. wezterm sets no cargoRoot/cargoPatches/sourceRoot, so a plain call
  # mirrors what buildRustPackage would have produced.
  cargoDeps = pkgs.rustPlatform.fetchCargoVendor {
    inherit src;
    name = "wezterm-0-unstable-${pin.version}";
    hash = pin.cargoHash;
  };
})
