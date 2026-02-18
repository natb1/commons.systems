#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Usage: run-unit-tests.sh <app-dir>}"

cd "$APP_DIR"
npm ci
npx vitest run
