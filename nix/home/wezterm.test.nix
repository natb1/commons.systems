# WezTerm Module Tests
#
# Validates the WezTerm Home Manager module configuration:
# 1. Lua syntax validation for generated config
# 2. Platform-specific conditional logic (Linux/macOS)
# 3. Variable interpolation (username, home directory)
# 4. Activation script logic for WSL Windows config copy

{ pkgs, lib, ... }:

let
  # Import the wezterm module for testing
  weztermModule = import ./wezterm.nix;

  # Test helper: Evaluate module with mock config
  evaluateModule =
    {
      username ? "testuser",
      homeDirectory ? "/home/testuser",
      isLinux ? true,
      isDarwin ? false,
    }:
    assert lib.assertMsg (username != "") "evaluateModule: username cannot be empty";
    assert lib.assertMsg (homeDirectory != "") "evaluateModule: homeDirectory cannot be empty";
    assert lib.assertMsg (lib.hasPrefix "/" homeDirectory)
      "evaluateModule: homeDirectory must be an absolute path starting with /";
    assert lib.assertMsg (
      !lib.hasSuffix "/" homeDirectory || homeDirectory == "/"
    ) "evaluateModule: homeDirectory should not end with / (except root)";
    assert lib.assertMsg (
      !(isLinux && isDarwin)
    ) "evaluateModule: Cannot have both isLinux=true and isDarwin=true (mutually exclusive platforms)";
    let
      mockPkgs = pkgs // {
        stdenv = pkgs.stdenv // {
          isLinux = isLinux;
          isDarwin = isDarwin;
        };
      };
      mockConfig = {
        home = {
          username = username;
          homeDirectory = homeDirectory;
        };
      };
    in
    weztermModule {
      config = mockConfig;
      pkgs = mockPkgs;
      lib = lib;
    };

  # Test helper: Extract Lua config from module evaluation
  extractLuaConfig = moduleResult: moduleResult.programs.wezterm.extraConfig;

  # Test helper: Validate Lua syntax using lua interpreter
  validateLuaSyntax =
    luaCode:
    let
      luaFile = pkgs.writeText "wezterm-test.lua" luaCode;
    in
    pkgs.runCommand "validate-lua-syntax" { buildInputs = [ pkgs.lua ]; } ''
      if ! lua_error=$(${pkgs.lua}/bin/lua -e "assert(loadfile('${luaFile}'))" 2>&1); then
        echo "Lua syntax validation failed:"
        echo "----------------------------------------"
        echo "$lua_error"
        echo "----------------------------------------"
        echo ""
        echo "Generated Lua config (first 50 lines):"
        head -n 50 '${luaFile}'
        echo ""
        echo "Full config at: ${luaFile}"
        exit 1
      fi
      touch $out
    '';

  # Test 1: Basic module structure
  test-module-structure = pkgs.runCommand "test-wezterm-module-structure" { } ''
    ${
      if (evaluateModule { }).programs.wezterm.enable or false then
        "echo 'PASS: Module enables wezterm'"
      else
        "echo 'FAIL: Module does not enable wezterm' && exit 1"
    }
    ${
      if (evaluateModule { }).programs.wezterm ? extraConfig then
        "echo 'PASS: Module provides extraConfig'"
      else
        "echo 'FAIL: Module missing extraConfig' && exit 1"
    }
    touch $out
  '';

  # Test 2: Linux-specific configuration
  test-linux-config =
    let
      result = evaluateModule {
        username = "linuxuser";
        homeDirectory = "/home/linuxuser";
        isLinux = true;
        isDarwin = false;
      };
      luaConfig = extractLuaConfig result;
    in
    pkgs.runCommand "test-wezterm-linux-config" { } ''
      ${
        if lib.hasInfix "target_triple" luaConfig && lib.hasInfix "windows" luaConfig then
          "echo 'PASS: Linux config guards default_prog with target_triple windows check'"
        else
          "echo 'FAIL: Linux config missing target_triple windows guard' && exit 1"
      }
      ${
        if lib.hasInfix "default_prog" luaConfig && lib.hasInfix "wsl.exe" luaConfig then
          "echo 'PASS: Linux config includes default_prog with wsl.exe'"
        else
          "echo 'FAIL: Linux config missing default_prog/wsl.exe' && exit 1"
      }
      ${
        if lib.hasInfix "/home/" luaConfig && lib.hasInfix "linuxuser" luaConfig then
          "echo 'PASS: Linux config includes correct home directory'"
        else
          "echo 'FAIL: Linux config has wrong home directory' && exit 1"
      }
      ${
        if lib.hasInfix "default_gui_startup_args" luaConfig && lib.hasInfix "'connect', 'nixos'" luaConfig then
          "echo 'PASS: Linux config includes default_gui_startup_args to auto-connect to nixos mux'"
        else
          "echo 'FAIL: Linux config missing default_gui_startup_args for nixos mux auto-connect' && exit 1"
      }
      ${
        if lib.hasInfix "native_macos_fullscreen_mode" luaConfig then
          "echo 'FAIL: Linux config should not include macOS settings' && exit 1"
        else
          "echo 'PASS: Linux config excludes macOS settings'"
      }
      ${
        if lib.hasInfix "ssh_domains" luaConfig then
          "echo 'PASS: Linux config includes ssh_domains'"
        else
          "echo 'FAIL: Linux config missing ssh_domains' && exit 1"
      }
      ${
        if lib.hasInfix "config.ssh_domains = ssh_domains" luaConfig then
          "echo 'PASS: Linux config assigns ssh_domains to config'"
        else
          "echo 'FAIL: Linux config missing config.ssh_domains assignment' && exit 1"
      }
      ${
        if lib.hasInfix "pcall" luaConfig then
          "echo 'PASS: Linux config wraps ssh_domains discovery in pcall'"
        else
          "echo 'FAIL: Linux config missing pcall wrapper for ssh_domains' && exit 1"
      }
      ${
        if lib.hasInfix "tailscale" luaConfig then
          "echo 'PASS: Linux config includes tailscale'"
        else
          "echo 'FAIL: Linux config missing tailscale' && exit 1"
      }
      ${
        if lib.hasInfix "wsl.exe" luaConfig && lib.hasInfix "tailscale_status_cmd" luaConfig then
          "echo 'PASS: Linux config calls tailscale via wsl.exe on Windows'"
        else
          "echo 'FAIL: Linux config missing wsl.exe tailscale invocation' && exit 1"
      }
      touch $out
    '';

  # Test 3: macOS-specific configuration
  test-macos-config =
    let
      result = evaluateModule {
        username = "macuser";
        homeDirectory = "/Users/macuser";
        isLinux = false;
        isDarwin = true;
      };
      luaConfig = extractLuaConfig result;
    in
    pkgs.runCommand "test-wezterm-macos-config" { } ''
      ${
        if lib.hasInfix "native_macos_fullscreen_mode" luaConfig then
          "echo 'PASS: macOS config includes native_macos_fullscreen_mode'"
        else
          "echo 'FAIL: macOS config missing native_macos_fullscreen_mode' && exit 1"
      }
      ${
        if lib.hasInfix "default_prog" luaConfig then
          "echo 'FAIL: macOS config should not include WSL default_prog' && exit 1"
        else
          "echo 'PASS: macOS config excludes WSL default_prog'"
      }
      ${
        if lib.hasInfix "ssh_domains" luaConfig then
          "echo 'PASS: macOS config includes ssh_domains'"
        else
          "echo 'FAIL: macOS config missing ssh_domains' && exit 1"
      }
      ${
        if lib.hasInfix "pcall" luaConfig then
          "echo 'PASS: macOS config wraps ssh_domains discovery in pcall'"
        else
          "echo 'FAIL: macOS config missing pcall wrapper for ssh_domains' && exit 1"
      }
      ${
        if lib.hasInfix "tailscale" luaConfig then
          "echo 'PASS: macOS config includes tailscale'"
        else
          "echo 'FAIL: macOS config missing tailscale' && exit 1"
      }
      touch $out
    '';

  # Test 4: Lua syntax validation for all platform combinations
  test-lua-syntax-linux =
    let
      luaConfig = extractLuaConfig (evaluateModule {
        isLinux = true;
        isDarwin = false;
      });
    in
    validateLuaSyntax luaConfig;

  test-lua-syntax-macos =
    let
      luaConfig = extractLuaConfig (evaluateModule {
        isLinux = false;
        isDarwin = true;
      });
    in
    validateLuaSyntax luaConfig;

  test-lua-syntax-generic =
    let
      luaConfig = extractLuaConfig (evaluateModule {
        isLinux = false;
        isDarwin = false;
      });
    in
    validateLuaSyntax luaConfig;

  # Test 5: Username interpolation
  test-username-interpolation =
    let
      testUsernames = [
        "alice"
        "bob-smith"
        "user_123"
      ];
      results = lib.genAttrs testUsernames (
        username:
        let
          luaConfig = extractLuaConfig (evaluateModule {
            username = username;
            isLinux = true;
          });
        in
        lib.hasInfix username luaConfig
      );
    in
    pkgs.runCommand "test-wezterm-username-interpolation" { } ''
      ${lib.concatMapStringsSep "\n" (
        username:
        if results.${username} then
          "echo 'PASS: Username ${username} interpolated correctly'"
        else
          "echo 'FAIL: Username ${username} not found in config' && exit 1"
      ) testUsernames}
      touch $out
    '';

  # Test 6: Username with special characters causing Lua injection
  test-special-chars-username =
    let
      testCases = [
        {
          username = "o'brien";
          description = "single quote";
        }
        {
          username = "user\"name";
          description = "double quote";
        }
        {
          username = "user\\name";
          description = "backslash";
        }
        {
          username = "user]]name";
          description = "bracket close";
        }
        {
          username = "test$user";
          description = "dollar sign";
        }
      ];
      results = map (
        testCase:
        let
          luaConfig = extractLuaConfig (evaluateModule {
            username = testCase.username;
            isLinux = true;
          });
        in
        {
          inherit (testCase) username description;
          configGenerated = luaConfig;
          syntaxValidation = validateLuaSyntax luaConfig;
        }
      ) testCases;
    in
    pkgs.runCommand "test-wezterm-special-chars-username"
      {
        buildInputs = map (r: r.syntaxValidation) results;
      }
      ''
        echo "Testing usernames with special characters"
        ${lib.concatMapStringsSep "\n" (testCase: "echo \"  - ${testCase.description}\"") testCases}
        echo "All special character tests passed (validated Lua syntax)"
        touch $out
      '';

  # Test 9: Common configuration present in all platforms
  test-common-config =
    let
      testPlatforms = [
        {
          name = "linux";
          isLinux = true;
          isDarwin = false;
        }
        {
          name = "macos";
          isLinux = false;
          isDarwin = true;
        }
        {
          name = "generic";
          isLinux = false;
          isDarwin = false;
        }
      ];
      # All platforms should have config_builder
      commonSettings = [
        "config_builder"
        "return config"
        "ssh_domains"
      ];
    in
    pkgs.runCommand "test-wezterm-common-config" { } ''
      ${lib.concatMapStringsSep "\n" (
        platform:
        let
          luaConfig = extractLuaConfig (evaluateModule {
            isLinux = platform.isLinux;
            isDarwin = platform.isDarwin;
          });
        in
        lib.concatMapStringsSep "\n" (
          setting:
          if lib.hasInfix setting luaConfig then
            "echo 'PASS: ${platform.name} config includes ${setting}'"
          else
            "echo 'FAIL: ${platform.name} config missing ${setting}' && exit 1"
        ) commonSettings
      ) testPlatforms}
      touch $out
    '';

  # Test 11: Activation script runtime behavior
  test-activation-script-runtime =
    pkgs.runCommand "test-wezterm-activation-script-runtime"
      {
        buildInputs = [ pkgs.bash ];
      }
      ''
        ${pkgs.bash}/bin/bash ${./wezterm_test.sh}
        touch $out
      '';

  # Test 13: Home Manager integration test
  test-homemanager-integration =
    let
      linuxPkgs = pkgs // {
        stdenv = pkgs.stdenv // {
          isLinux = true;
          isDarwin = false;
        };
      };

      macosPkgs = pkgs // {
        stdenv = pkgs.stdenv // {
          isLinux = false;
          isDarwin = true;
        };
      };

      mockLinuxConfig = {
        home = {
          username = "testuser";
          homeDirectory = "/home/testuser";
        };
      };

      mockMacosConfig = {
        home = {
          username = "macuser";
          homeDirectory = "/Users/macuser";
        };
      };

      linuxResult = weztermModule {
        config = mockLinuxConfig;
        pkgs = linuxPkgs;
        lib = lib;
      };

      macosResult = weztermModule {
        config = mockMacosConfig;
        pkgs = macosPkgs;
        lib = lib;
      };
    in
    pkgs.runCommand "test-homemanager-integration" { } ''
      ${
        if linuxResult.programs.wezterm.enable or false then
          "echo 'PASS: Linux config evaluates and enables wezterm'"
        else
          "echo 'FAIL: Linux config evaluation failed or wezterm not enabled' && exit 1"
      }
      ${
        if macosResult.programs.wezterm.enable or false then
          "echo 'PASS: macOS config evaluates and enables wezterm'"
        else
          "echo 'FAIL: macOS config evaluation failed or wezterm not enabled' && exit 1"
      }
      ${
        if linuxResult.home.activation ? copyWeztermToWindows then
          "echo 'PASS: Linux config includes activation script in DAG'"
        else
          "echo 'FAIL: Linux config missing activation script in DAG' && exit 1"
      }
      ${
        let
          activationScript = macosResult.home.activation.copyWeztermToWindows or null;
          isConditional = activationScript != null && (activationScript._type or null) == "if";
          conditionValue = if isConditional then (activationScript.condition or null) else null;
        in
        if isConditional && conditionValue == false then
          "echo 'PASS: macOS config correctly disables activation script via mkIf'"
        else if activationScript == null then
          "echo 'PASS: macOS config excludes activation script'"
        else
          "echo 'FAIL: macOS config should not include active activation script' && exit 1"
      }
      ${
        if linuxResult.programs.wezterm ? extraConfig then
          "echo 'PASS: Linux config includes extraConfig'"
        else
          "echo 'FAIL: Linux config missing extraConfig' && exit 1"
      }
      ${
        if macosResult.programs.wezterm ? extraConfig then
          "echo 'PASS: macOS config includes extraConfig'"
        else
          "echo 'FAIL: macOS config missing extraConfig' && exit 1"
      }

      echo ""
      echo "Home Manager integration test passed"
      touch $out
    '';

  # Test 14: Activation script DAG execution and variable access
  test-activation-dag-execution =
    let
      linuxPkgs = pkgs // {
        stdenv = pkgs.stdenv // {
          isLinux = true;
          isDarwin = false;
        };
      };

      mockConfig = {
        home = {
          username = "testuser";
          homeDirectory = "/home/testuser";
        };
      };

      mockLib = lib // {
        hm = {
          dag = {
            entryAfter = deps: data: {
              _type = "dagEntryAfter";
              after = deps;
              inherit data;
            };
          };
        };
      };

      moduleResult = weztermModule {
        config = mockConfig;
        pkgs = linuxPkgs;
        lib = mockLib;
      };

      activationScript = moduleResult.home.activation.copyWeztermToWindows or null;

      dagEntry =
        if activationScript != null && activationScript ? _type && activationScript._type == "if" then
          activationScript.content or null
        else
          activationScript;

      scriptData = if dagEntry != null && dagEntry ? data then dagEntry.data else null;
    in
    pkgs.runCommand "test-activation-dag-execution" { } ''
      ${
        if activationScript != null then
          "echo 'PASS: Activation script exists on Linux'"
        else
          "echo 'FAIL: Activation script missing on Linux' && exit 1"
      }
      ${
        if
          activationScript != null
          && (activationScript._type or null) == "if"
          && activationScript.condition == true
        then
          "echo 'PASS: Activation script is wrapped in lib.mkIf with condition=true for Linux'"
        else
          "echo 'FAIL: Activation script not properly wrapped in lib.mkIf for Linux' && exit 1"
      }
      ${
        if dagEntry != null && (dagEntry._type or null) == "dagEntryAfter" then
          "echo 'PASS: Inner structure is a proper DAG entry (type: dagEntryAfter)'"
        else
          "echo 'FAIL: Inner structure is not a proper DAG entry' && exit 1"
      }
      ${
        if dagEntry != null && (builtins.elem "linkGeneration" (dagEntry.after or [ ])) then
          "echo 'PASS: Activation script depends on linkGeneration'"
        else
          "echo 'FAIL: Activation script missing linkGeneration dependency' && exit 1"
      }
      ${
        if scriptData != null && builtins.isString scriptData then
          "echo 'PASS: Activation script contains shell script data'"
        else
          "echo 'FAIL: Activation script missing or invalid script data' && exit 1"
      }
      ${
        if scriptData != null && lib.hasInfix "DRY_RUN_CMD" scriptData then
          "echo 'PASS: Activation script references DRY_RUN_CMD variable'"
        else
          "echo 'FAIL: Activation script missing DRY_RUN_CMD variable reference' && exit 1"
      }
      ${
        if scriptData != null && lib.hasInfix "VERBOSE_ARG" scriptData then
          "echo 'PASS: Activation script references VERBOSE_ARG variable'"
        else
          "echo 'FAIL: Activation script missing VERBOSE_ARG variable reference' && exit 1"
      }
      ${
        if scriptData != null && lib.hasInfix mockConfig.home.homeDirectory scriptData then
          "echo 'PASS: Activation script uses interpolated homeDirectory value'"
        else
          "echo 'FAIL: Activation script missing homeDirectory value' && exit 1"
      }
      ${
        let
          macosPkgs = pkgs // {
            stdenv = pkgs.stdenv // {
              isLinux = false;
              isDarwin = true;
            };
          };
          macosResult = weztermModule {
            config = mockConfig;
            pkgs = macosPkgs;
            lib = mockLib;
          };
          macosActivation = macosResult.home.activation.copyWeztermToWindows or null;
          isConditionallyDisabled =
            macosActivation == null
            || (macosActivation ? _type && macosActivation._type == "if" && macosActivation.condition == false);
        in
        if isConditionallyDisabled then
          "echo 'PASS: Activation script properly excluded on macOS via lib.mkIf'"
        else
          "echo 'FAIL: Activation script not properly excluded on macOS' && exit 1"
      }

      echo ""
      echo "Activation script DAG execution test passed"
      touch $out
    '';

  # Test: format-tab-title event handler
  test-format-tab-title =
    let
      testPlatforms = [
        {
          name = "linux";
          isLinux = true;
          isDarwin = false;
        }
        {
          name = "macos";
          isLinux = false;
          isDarwin = true;
        }
        {
          name = "generic";
          isLinux = false;
          isDarwin = false;
        }
      ];
    in
    pkgs.runCommand "test-wezterm-format-tab-title" { } ''
      ${lib.concatMapStringsSep "\n" (
        platform:
        let
          luaConfig = extractLuaConfig (evaluateModule {
            isLinux = platform.isLinux;
            isDarwin = platform.isDarwin;
          });
        in
        ''
          ${
            if lib.hasInfix "format-tab-title" luaConfig then
              "echo 'PASS: ${platform.name} config includes format-tab-title event handler'"
            else
              "echo 'FAIL: ${platform.name} config missing format-tab-title event handler' && exit 1"
          }
          ${
            if lib.hasInfix "user_vars.git_branch" luaConfig then
              "echo 'PASS: ${platform.name} config reads git_branch user variable'"
            else
              "echo 'FAIL: ${platform.name} config missing user_vars.git_branch' && exit 1"
          }
          ${
            if lib.hasInfix " | " luaConfig then
              "echo 'PASS: ${platform.name} config uses branch | title separator'"
            else
              "echo 'FAIL: ${platform.name} config missing branch | title separator' && exit 1"
          }
        ''
      ) testPlatforms}
      touch $out
    '';

  # Aggregate all tests into a test suite
  allTests = [
    test-module-structure
    test-linux-config
    test-macos-config
    test-lua-syntax-linux
    test-lua-syntax-macos
    test-lua-syntax-generic
    test-username-interpolation
    test-special-chars-username
    test-common-config
    test-activation-script-runtime
    test-homemanager-integration
    test-activation-dag-execution
    test-format-tab-title
  ];

  wezterm-test-suite = pkgs.runCommand "wezterm-test-suite" { buildInputs = allTests; } ''
    echo "WezTerm Module Test Suite"
    echo ""
    ${lib.concatMapStringsSep "\n" (test: "echo \"  ${test.name}\"") allTests}
    echo ""
    echo "All WezTerm tests passed!"
    touch $out
  '';

in
{
  wezterm-tests = {
    inherit
      test-module-structure
      test-linux-config
      test-macos-config
      test-lua-syntax-linux
      test-lua-syntax-macos
      test-lua-syntax-generic
      test-username-interpolation
      test-special-chars-username
      test-common-config
      test-activation-script-runtime
      test-homemanager-integration
      test-activation-dag-execution
      test-format-tab-title
      ;
  };

  inherit wezterm-test-suite;
}
