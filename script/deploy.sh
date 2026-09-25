#!/usr/bin/env bash
# Deploy ArcGuard to Arc mainnet and verify on explorer.arc.io (Blockscout). Reads PRIVATE_KEY from .env.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a
F=~/.arc-foundry/bin
$F/forge script script/Deploy.s.sol:Deploy --network arc --rpc-url https://rpc.mainnet.arc.io \
  --broadcast --with-gas-price 30000000000 --priority-gas-price 1000000000 -vv
ADDR=$(jq -r '.transactions[0].contractAddress' broadcast/Deploy.s.sol/5042/run-latest.json)
echo "ArcGuard: $ADDR"
$F/forge verify-contract "$ADDR" src/ArcGuard.sol:ArcGuard --chain-id 5042 \
  --constructor-args $($F/cast abi-encode 'c(address,address)' 0x3600000000000000000000000000000000000000 0x8E357432CC12ff425c36432F312968aEb16112AF) \
  --verifier blockscout --verifier-url https://explorer.arc.io/api/ --watch || echo "verify failed; retry manually"
