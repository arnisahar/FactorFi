# Testnet Deployment

## Deployed Testnet IDs

- Current package ID: `0x77224e501af0e7a0108c8300a428d228fac2502b6c59b1f90220bfd24b4f747e`
- Original package/type origin: `0x77224e501af0e7a0108c8300a428d228fac2502b6c59b1f90220bfd24b4f747e`
- Package version: `1`
- Publish digest: `BoFJgtWCvbKbcb7X6sq1FTWw1XHkmzLihZsYx1dBwUMA`
- Upgrade cap: `0x4668dc225a83b4124bb04c8eb767308344420372f53ee518373696e5fd3a4fee`
- DUSDC lending pool: `0x89b3c6a9deb018d5d2133249475fcd46cb27e409151d8826aaab345889e0473c`
- Quote coin type: `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC`
- Package publisher: `0x8c3ae4eb26b2b21d6fbeb24d202102fb1e17b33400fe9ba8a227d15716d25bb0`
- Pool owner: `0xaf22509b046c0bed5f6c2fbc40cc06836f0e9b546b0bca95a488e4d980c466fa`

The package and pool were queried from Sui testnet on 21 June 2026. The pool is
a shared `LendingPool<DUSDC>` with the following post-demo state:

- Total deposited: `7.000000 DUSDC`
- Available balance: `7.136500 DUSDC`
- Funded invoices: `1`
- Outstanding principal: `0 DUSDC`

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

If the package has already been published to testnet, the script now uses `sui client test-publish` with an ephemeral publication file so it can rerun without requiring manual removal of the existing `published.testnet` entry.

For the current deployment, copy the example environment file:

```bash
cp web/.env.example web/.env
```

```dotenv
VITE_FACTORFI_PACKAGE_ID=0x77224e501af0e7a0108c8300a428d228fac2502b6c59b1f90220bfd24b4f747e
VITE_FACTORFI_POOL_OBJECT_ID=0x89b3c6a9deb018d5d2133249475fcd46cb27e409151d8826aaab345889e0473c
VITE_FACTORFI_QUOTE_COIN_TYPE=0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC
```

## Create Pool

After the package is published, use the app or transaction builder to call:

```text
<PACKAGE_ID>::invoice_finance::create_pool<DUSDC>()
```

For a future deployment, set the resulting shared pool object:

```text
VITE_FACTORFI_POOL_OBJECT_ID=<shared_pool_object_id>
```

Restart the Vite dev server after changing `.env`.

## DUSDC Liquidity

The current pool completed the clean demo lifecycle with real testnet DUSDC:

1. Deposit `7 DUSDC` from a wallet holding `10 DUSDC`.
2. Fund a `5 DUSDC` face-value invoice with a `4.6 DUSDC` advance.
3. Settle `4.7365 DUSDC` back to the pool.
4. Finish with `7.1365 DUSDC` available and zero outstanding principal.

Additional DUSDC test assets can be requested from DeepBook Predict:

```text
https://tally.so/r/Xx102L
```

Request details to use:

- Project: FactorFi, on-chain invoice financing on Sui using Walrus invoice storage and DeepBook Predict risk signals.
- Address: `0x8c3ae4eb26b2b21d6fbeb24d202102fb1e17b33400fe9ba8a227d15716d25bb0`
- Token: DUSDC
- Reason: seed the FactorFi testnet lending pool and exercise end-to-end invoice funding/settlement.
