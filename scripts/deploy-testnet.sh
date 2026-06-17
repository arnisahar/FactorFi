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

echo "Publishing package to testnet..."
sui client publish "$PACKAGE_DIR" --gas-budget 100000000 --json
