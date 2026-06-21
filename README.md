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

## Current Integration Targets

- Network: Sui Testnet
- Walrus: PDF blob storage through `@mysten/walrus` or testnet publisher
- DeepBook Predict server: `https://predict-server.testnet.mystenlabs.com`
- Quote asset: DeepBook Predict DUSDC testnet coin

## Deployment Status

The Move package is published on Sui Testnet and a shared DUSDC lending pool exists. The pool still needs DUSDC deposits for live funding transactions. See [docs/deployment.md](docs/deployment.md).
