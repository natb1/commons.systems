{ pkgs }:

pkgs.buildGoModule {
  pname = "productivity-tui";
  version = "0.1.0";
  src = ../../productivity-tui;
  vendorHash = "sha256-uwBJAqN4sIepiiJf9lCDumLqfKJEowQO2tOiSWD3Fig=";
}
