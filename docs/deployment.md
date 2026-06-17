# Testnet Deployment

## Deployed Testnet IDs

- Package ID: `0xdff33338fe2f5b320ae2f8f466c7840eb7049ad1084ebb8528e987a7d13c69ff`
- Publish digest: `CLx7aHKKFyoCzmWgGga15cvMTQeMqwwQZi8YHdguS53T`
- Upgrade cap: `0x79a78685d06968fe9ad685f8d2915c610355469dbadd3883e46e98638c680566`
- DUSDC lending pool: `0x8475f0b62959bd0e4f384832af88b9cafc01837dee818ddad8801e48cd2a2639`
- Pool create digest: `Trn2pNjiKaCmdjzn65LjhS9krBzjbYBSoTGWancdgC7`
- Quote coin type: `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC`
- Demo invoice object: `0x7bfd9cd93c8128cc158270f310ed7b0d5b06e1e0055d3926bb9dd32e2a8aa66e`
- Demo invoice mint digest: `5JSTevnu9cKJTqXAVGf9AWMWcPPUPXi6fDrT5ZRQCPUx`
- Demo invoice list digest: `3WYjMwgtEHW1me4HMSv87FmRX5rNhnVFce8npgGNktd3`
- Demo Walrus blob: `zKWy6x8did0_8q0b0knIWvObve9e1UM4YKGSFAq3UH0`

## Prerequisites

1. Install Sui CLI.
2. Switch to testnet.
3. Fund the active address with testnet SUI.

Current local active address:

```text
0x8c3ae4eb26b2b21d6fbeb24d202102fb1e17b33400fe9ba8a227d15716d25bb0
```

The package has been published to testnet. Keep this address funded for future upgrades or additional CLI transactions.

Web faucet:

```text
https://faucet.sui.io/?address=0x8c3ae4eb26b2b21d6fbeb24d202102fb1e17b33400fe9ba8a227d15716d25bb0
```

## Re-Publish

```bash
./scripts/deploy-testnet.sh
```

After publish, copy the new package ID to `web/.env`:

```bash
cp web/.env.example web/.env
```

```text
VITE_FACTORFI_PACKAGE_ID=<published_package_id>
```

## Create Pool

After the package is published, use the app or transaction builder to call:

```text
<PACKAGE_ID>::invoice_finance::create_pool<DUSDC>()
```

Set the resulting shared pool object:

```text
VITE_FACTORFI_POOL_OBJECT_ID=<shared_pool_object_id>
```

Restart the Vite dev server after changing `.env`.

## DUSDC Liquidity

The shared pool currently exists but is empty. The active CLI address has SUI and no DUSDC. DeepBook Predict DUSDC is requested through the official form:

```text
https://tally.so/r/Xx102L
```

Request details to use:

- Project: FactorFi, on-chain invoice financing on Sui using Walrus invoice storage and DeepBook Predict risk signals.
- Address: `0x8c3ae4eb26b2b21d6fbeb24d202102fb1e17b33400fe9ba8a227d15716d25bb0`
- Token: DUSDC
- Reason: seed the FactorFi testnet lending pool and exercise end-to-end invoice funding/settlement.
