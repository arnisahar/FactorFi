# Testnet Deployment

## Deployed Testnet IDs

- Current package ID (v2): `0xef7fd6911233652300be893c6fa265f85d8fd9cc48852a9b91f32508daca6a68`
- Original package/type origin: `0xdff33338fe2f5b320ae2f8f466c7840eb7049ad1084ebb8528e987a7d13c69ff`
- Publish digest: `CLx7aHKKFyoCzmWgGga15cvMTQeMqwwQZi8YHdguS53T`
- Upgrade digest: `2gQWUvxSXLRxW1dUcSyyBdBig4ZmuaqH9MmhTLFsRtkB`
- Upgrade cap: `0x79a78685d06968fe9ad685f8d2915c610355469dbadd3883e46e98638c680566`
- DUSDC lending pool: `0x8475f0b62959bd0e4f384832af88b9cafc01837dee818ddad8801e48cd2a2639`
- Pool create digest: `Trn2pNjiKaCmdjzn65LjhS9krBzjbYBSoTGWancdgC7`
- Quote coin type: `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC`
- Live shared invoice object: `0x099d47492d14803e3937e80f98057f09072408ec86e459474f90e55544c8db4f`
- Live invoice mint digest: `EAMb4BwwxdP9dC2eho28A4PVgJwViX7DQ3SmEzLCqfne`
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

The shared pool has received 5 DUSDC. Package v2 mints listed invoices as shared objects so a lender wallet can fund them. The live micro-invoice requires a 4.5 DUSDC advance and its funding call has passed an on-chain dry run.

```text
https://tally.so/r/Xx102L
```

Request details to use:

- Project: FactorFi, on-chain invoice financing on Sui using Walrus invoice storage and DeepBook Predict risk signals.
- Address: `0x8c3ae4eb26b2b21d6fbeb24d202102fb1e17b33400fe9ba8a227d15716d25bb0`
- Token: DUSDC
- Reason: seed the FactorFi testnet lending pool and exercise end-to-end invoice funding/settlement.
