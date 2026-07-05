# Claude Code Module Tests
#
# Locks the invariants of the dispatch-claude-daemon systemd user service that
# nix/home/claude-code.nix installs (#1197, #2736). The whole point of the
# change is that the daemon's ExecStart pins the CONCRETE claude-code store path
# (not the profile symlink), so home-manager's sd-switch restarts the daemon
# onto the new binary on every version bump. These tests guard against the
# "symlink-only" / "no Environment" regressions.
#
# The test mirrors nix/home/wezterm.test.nix's mock-eval convention: it calls
# the module as a plain function against a mock config + a mock pkgs set. Because
# flake.nix builds `checks` against a plain nixpkgs WITHOUT the claude-code-nix
# overlay, pkgs.claude-code is absent there — so the test injects a trivial
# offline stub for claude-code, keeping the whole test network-free (the real
# module's sandbox-seccomp fetchurl is never forced because we only inspect
# systemd.user.services, not home.activation / home.packages).

{ pkgs, lib, ... }:

let
  # Import the claude-code module for testing
  claudeCodeModule = import ./claude-code.nix;

  # Offline stub for claude-code. Its store path does NOT end in /bin, so the
  # module's "${pkgs.claude-code}/bin/claude daemon run" renders to a well-formed
  # /nix/store/...-claude-code-stub/bin/claude daemon run — satisfying assertion 1
  # (contains /nix/store/ AND ends with /bin/claude daemon run) while needing no
  # overlay, no network, and no substituters.
  claudeCodeStub = pkgs.runCommand "claude-code-stub" { } ''
    mkdir -p $out/bin
    touch $out/bin/claude
    chmod +x $out/bin/claude
  '';

  # Test helper: evaluate the module with a mock config + stubbed pkgs.
  evaluateModule =
    {
      username ? "testuser",
      homeDirectory ? "/home/testuser",
      profileDirectory ? "/home/testuser/.nix-profile",
      isLinux ? true,
      isDarwin ? false,
    }:
    assert lib.assertMsg (username != "") "evaluateModule: username cannot be empty";
    assert lib.assertMsg (homeDirectory != "") "evaluateModule: homeDirectory cannot be empty";
    assert lib.assertMsg (
      !(isLinux && isDarwin)
    ) "evaluateModule: Cannot have both isLinux=true and isDarwin=true (mutually exclusive platforms)";
    let
      mockPkgs = pkgs // {
        claude-code = claudeCodeStub;
        stdenv = pkgs.stdenv // {
          isLinux = isLinux;
          isDarwin = isDarwin;
        };
      };
      mockConfig = {
        home = {
          username = username;
          homeDirectory = homeDirectory;
          profileDirectory = profileDirectory;
        };
      };
    in
    claudeCodeModule {
      config = mockConfig;
      pkgs = mockPkgs;
      lib = lib;
    };

  # Unwrap the raw lib.mkIf wrapper the module returns for the service. Because
  # the test calls the module as a plain function (not through the module
  # system), the value is `{ _type = "if"; condition = ...; content = {...}; }`.
  # With isLinux = true the condition holds and `content` is the real service.
  unwrapService =
    moduleResult:
    let
      rawSvc = moduleResult.systemd.user.services.dispatch-claude-daemon;
    in
    if (rawSvc._type or null) == "if" then rawSvc.content else rawSvc;

  linuxSvc = unwrapService (evaluateModule { isLinux = true; });

  # Assertion 1: ExecStart pins the CONCRETE store path, not the profile symlink.
  test-execstart-concrete-store-path =
    pkgs.runCommand "test-claude-execstart-concrete-store-path" { } ''
      ${
        if lib.hasSuffix "/bin/claude daemon run" linuxSvc.Service.ExecStart then
          "echo 'PASS: ExecStart ends with /bin/claude daemon run'"
        else
          "echo 'FAIL: ExecStart does not end with /bin/claude daemon run (got: ${linuxSvc.Service.ExecStart})' && exit 1"
      }
      ${
        if lib.hasInfix "/nix/store/" linuxSvc.Service.ExecStart then
          "echo 'PASS: ExecStart references a concrete /nix/store/ path (not the profile symlink)'"
        else
          "echo 'FAIL: ExecStart missing /nix/store/ prefix — likely the profile symlink regression' && exit 1"
      }
      touch $out
    '';

  # Assertion 2: Environment is a non-empty PATH list built from the stable
  # profile/system anchors (guards the "no Environment" / symlink-only regression).
  test-environment-stable-anchors =
    let
      env = linuxSvc.Service.Environment;
      pathEntry = builtins.head env;
    in
    pkgs.runCommand "test-claude-environment-stable-anchors" { } ''
      ${
        if builtins.isList env && env != [ ] then
          "echo 'PASS: Service.Environment is a non-empty list'"
        else
          "echo 'FAIL: Service.Environment is missing or empty' && exit 1"
      }
      ${
        if lib.hasPrefix "PATH=" pathEntry then
          "echo 'PASS: Environment entry starts with PATH='"
        else
          "echo 'FAIL: Environment entry does not start with PATH= (got: ${pathEntry})' && exit 1"
      }
      ${
        if lib.hasInfix "per-user" pathEntry then
          "echo 'PASS: PATH references the per-user profile anchor'"
        else
          "echo 'FAIL: PATH missing per-user anchor' && exit 1"
      }
      ${
        if lib.hasInfix "current-system" pathEntry then
          "echo 'PASS: PATH references the current-system anchor'"
        else
          "echo 'FAIL: PATH missing current-system anchor' && exit 1"
      }
      touch $out
    '';

  # Assertion 3: the unit is wanted by default.target and restarts always.
  test-install-and-restart =
    pkgs.runCommand "test-claude-install-and-restart" { } ''
      ${
        if builtins.elem "default.target" linuxSvc.Install.WantedBy then
          "echo 'PASS: Install.WantedBy contains default.target'"
        else
          "echo 'FAIL: Install.WantedBy missing default.target' && exit 1"
      }
      ${
        if linuxSvc.Service.Restart == "always" then
          "echo 'PASS: Service.Restart is always'"
        else
          "echo 'FAIL: Service.Restart is not always (got: ${toString linuxSvc.Service.Restart})' && exit 1"
      }
      touch $out
    '';

  # Guard: the service is gated on isLinux via lib.mkIf — on Darwin the mkIf
  # condition is false, so the daemon is not installed.
  test-linux-only =
    let
      rawLinux = (evaluateModule { isLinux = true; }).systemd.user.services.dispatch-claude-daemon;
      rawDarwin =
        (evaluateModule {
          username = "macuser";
          homeDirectory = "/Users/macuser";
          profileDirectory = "/Users/macuser/.nix-profile";
          isLinux = false;
          isDarwin = true;
        }).systemd.user.services.dispatch-claude-daemon;
    in
    pkgs.runCommand "test-claude-daemon-linux-only" { } ''
      ${
        if (rawLinux._type or null) == "if" && rawLinux.condition == true then
          "echo 'PASS: daemon service is enabled via lib.mkIf on Linux'"
        else
          "echo 'FAIL: daemon service not properly gated on Linux' && exit 1"
      }
      ${
        if (rawDarwin._type or null) == "if" && rawDarwin.condition == false then
          "echo 'PASS: daemon service is disabled via lib.mkIf on Darwin'"
        else
          "echo 'FAIL: daemon service not disabled on Darwin' && exit 1"
      }
      touch $out
    '';

  # Aggregate all tests into a test suite
  allTests = [
    test-execstart-concrete-store-path
    test-environment-stable-anchors
    test-install-and-restart
    test-linux-only
  ];

  claude-code-test-suite = pkgs.runCommand "claude-code-test-suite" { buildInputs = allTests; } ''
    echo "Claude Code Module Test Suite"
    echo ""
    ${lib.concatMapStringsSep "\n" (test: "echo \"  ${test.name}\"") allTests}
    echo ""
    echo "All Claude Code tests passed!"
    touch $out
  '';

in
{
  claude-code-tests = {
    inherit
      test-execstart-concrete-store-path
      test-environment-stable-anchors
      test-install-and-restart
      test-linux-only
      ;
  };

  inherit claude-code-test-suite;
}
