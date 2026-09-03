# Zsh Module Tests
#
# Validates the Zsh Home Manager module's initContent:
# 1. The wezterm git-branch OSC1337 helper is still present (regression guard)
# 2. The tailscale auth-check helper guards on interactivity
# 3. The tailscale auth-check helper inspects `tailscale status --json` BackendState
# 4. The tailscale auth-check helper prints an AuthURL / remediation command

{ pkgs, lib, ... }:

let
  # Import the zsh module for testing
  zshModule = import ./zsh.nix;

  # Test helper: Evaluate module. zsh.nix takes { lib, pkgs, ... } with no
  # config param, so there's no username/homeDirectory to mock.
  evaluateModule = { }: zshModule { inherit lib pkgs; };

  # Test helper: Extract the raw initContent string from the module
  # evaluation. `initContent` is wrapped in `lib.mkOrder 1000 "..."`, which
  # evaluates to `{ _type = "order"; priority = 1000; content = "..."; }`;
  # `.content` yields the plain string for lib.hasInfix checks.
  extractInitContent = moduleResult: moduleResult.programs.zsh.initContent.content;

  # Test 1: wezterm git-branch helper still present (regression guard)
  test-wezterm-git-branch-present =
    let
      initContent = extractInitContent (evaluateModule { });
    in
    pkgs.runCommand "test-zsh-wezterm-git-branch-present" { } ''
      ${
        if lib.hasInfix "__wezterm_set_git_branch" initContent then
          "echo 'PASS: initContent still defines __wezterm_set_git_branch'"
        else
          "echo 'FAIL: initContent missing __wezterm_set_git_branch' && exit 1"
      }
      touch $out
    '';

  # Test 2: tailscale auth-check guards on interactive shells
  test-tailscale-interactive-guard =
    let
      initContent = extractInitContent (evaluateModule { });
    in
    pkgs.runCommand "test-zsh-tailscale-interactive-guard" { } ''
      ${
        if lib.hasInfix "-o interactive" initContent then
          "echo 'PASS: initContent guards tailscale check on interactive shells'"
        else
          "echo 'FAIL: initContent missing interactive-shell guard' && exit 1"
      }
      touch $out
    '';

  # Test 3: tailscale auth-check inspects BackendState via tailscale status --json
  test-tailscale-backend-state-check =
    let
      initContent = extractInitContent (evaluateModule { });
    in
    pkgs.runCommand "test-zsh-tailscale-backend-state-check" { } ''
      ${
        if lib.hasInfix "tailscale status --json" initContent then
          "echo 'PASS: initContent calls tailscale status --json'"
        else
          "echo 'FAIL: initContent missing tailscale status --json call' && exit 1"
      }
      ${
        if lib.hasInfix "BackendState" initContent then
          "echo 'PASS: initContent inspects BackendState'"
        else
          "echo 'FAIL: initContent missing BackendState check' && exit 1"
      }
      touch $out
    '';

  # Test 4: tailscale auth-check prints an AuthURL / remediation command
  test-tailscale-auth-remediation =
    let
      initContent = extractInitContent (evaluateModule { });
    in
    pkgs.runCommand "test-zsh-tailscale-auth-remediation" { } ''
      ${
        if lib.hasInfix "AuthURL" initContent then
          "echo 'PASS: initContent reads AuthURL'"
        else
          "echo 'FAIL: initContent missing AuthURL check' && exit 1"
      }
      ${
        if lib.hasInfix "sudo tailscale up" initContent then
          "echo 'PASS: initContent prints sudo tailscale up remediation'"
        else
          "echo 'FAIL: initContent missing sudo tailscale up remediation' && exit 1"
      }
      touch $out
    '';

  # Aggregate all tests into a test suite
  allTests = [
    test-wezterm-git-branch-present
    test-tailscale-interactive-guard
    test-tailscale-backend-state-check
    test-tailscale-auth-remediation
  ];

  zsh-test-suite = pkgs.runCommand "zsh-test-suite" { buildInputs = allTests; } ''
    echo "Zsh Module Test Suite"
    echo ""
    ${lib.concatMapStringsSep "\n" (test: "echo \"  ${test.name}\"") allTests}
    echo ""
    echo "All Zsh tests passed!"
    touch $out
  '';

in
{
  zsh-tests = {
    inherit
      test-wezterm-git-branch-present
      test-tailscale-interactive-guard
      test-tailscale-backend-state-check
      test-tailscale-auth-remediation
      ;
  };

  inherit zsh-test-suite;
}
