#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_DIR="$ROOT_DIR/contracts/factorfi"

echo "Active Sui address:"
sui client active-address

echo "Active Sui environment:"
sui client active-env

echo "Current balance:"
sui client balance

echo "Building Move package..."
sui move build --path "$PACKAGE_DIR"

ACTIVE_ENV="$(sui client active-env | tr -d '"' | tr -d '[:space:]')"
CHAIN_ID="$(sui client chain-identifier | tr -d '[:space:]')"

echo "Publishing package to testnet..."
PUBFILE_PATH="$(mktemp)"
trap 'rm -f "$PUBFILE_PATH"' EXIT
printf 'chain-id = "%s"\nbuild-env = "%s"\n' "$CHAIN_ID" "$ACTIVE_ENV" > "$PUBFILE_PATH"
sui client test-publish "$PACKAGE_DIR" --gas-budget 100000000 --pubfile-path "$PUBFILE_PATH" --json
