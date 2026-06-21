# FactorFi Web

React and Vite frontend for the FactorFi Sui testnet application.

## Routes

- `/`: public FactorFi landing page and downloadable demo invoice.
- `/app`: wallet-connected borrower, lender, and risk workspace.

## Setup

From the repository root:

```bash
cp web/.env.example web/.env
pnpm --dir web install
pnpm dev
```

The current environment variables identify the published Move package, shared
DUSDC lending pool, and DeepBook Predict DUSDC coin type. Restart Vite after
changing any `VITE_` value.

## Production Build

```bash
pnpm build
```

The app uses React Router, Tailwind CSS v4, shadcn-style components, Mysten dApp
Kit, TanStack Query, Walrus, and DeepBook libraries. Wallet and Sui dependencies
are lazy-loaded behind `/app` so the public route remains lightweight.

Financial state is read from Sui. Browser storage keeps only the IDs and private
display metadata needed to reconstruct the current demo workspace.
