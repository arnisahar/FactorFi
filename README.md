# FactorFi

On-chain invoice financing for Sui Overflow 2026.

FactorFi lets a business upload an invoice PDF to Walrus, mint an invoice token as a Sui object, receive a DUSDC advance from a lender pool, and settle the pool when the real-world invoice is paid.

## Structure

- `web`: React, Vite, Tailwind v4, shadcn, Sui dApp Kit, and live testnet workspace.
- `contracts/factorfi`: Move package for invoice objects and a generic lending pool.
- `docs`: hackathon research, architecture, and execution plan.
- `output/pdf`: upload-ready FactorFi demo invoice.

## Commands

```bash
pnpm --dir web install
pnpm dev
pnpm build
```

The public landing page is served at `/`; the financing workspace is served at
`/app`. The landing page and borrower desk both expose the generated 5 DUSDC
demo invoice.

Regenerate the demo invoice after changing its source with:

```bash
python3 scripts/create-demo-invoice.py
```

Move build requires the Sui CLI:

```bash
pnpm move:build
pnpm move:test
```

## Testnet Configuration

Copy `web/.env.example` to `web/.env`. The checked-in example points at the
current verified deployment:

```dotenv
VITE_FACTORFI_PACKAGE_ID=0x77224e501af0e7a0108c8300a428d228fac2502b6c59b1f90220bfd24b4f747e
VITE_FACTORFI_POOL_OBJECT_ID=0x89b3c6a9deb018d5d2133249475fcd46cb27e409151d8826aaab345889e0473c
VITE_FACTORFI_QUOTE_COIN_TYPE=0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC
```

Restart Vite whenever these values change. The package and pool can be
inspected on [SuiScan](https://suiscan.xyz/testnet/object/0x77224e501af0e7a0108c8300a428d228fac2502b6c59b1f90220bfd24b4f747e)
and [SuiVision](https://suivision.xyz/testnet/object/0x89b3c6a9deb018d5d2133249475fcd46cb27e409151d8826aaab345889e0473c).

## Current Integration Targets

- Network: Sui Testnet
- Walrus: PDF blob storage through `@mysten/walrus` or testnet publisher
- DeepBook Predict server: `https://predict-server.testnet.mystenlabs.com`
- Quote asset: DeepBook Predict DUSDC testnet coin

## Deployment Status

The current Move package and shared DUSDC lending pool are live on Sui
Testnet. The recorded demo deposited 7 DUSDC, financed one 4.6 DUSDC advance,
and settled with a 0.1365 DUSDC fee. The pool now has 7.1365 DUSDC with zero
outstanding principal. See [deployment details](docs/deployment.md), the
[clean demo flow](docs/demo-script.md), and the
[timed pitch voiceover](docs/pitch-voiceover.md).
