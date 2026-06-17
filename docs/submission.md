# Submission Plan

## Project Fields

- Project name: FactorFi
- Description: On-chain invoice financing on Sui. Businesses upload invoice documents to Walrus, mint invoice-right objects, receive DUSDC advances from lender liquidity, and settle principal plus fees when the invoice is paid.
- Track: DeFi & Payments, with DeepBook and Walrus sponsor relevance.
- Deployment: Sui Testnet.
- Package ID: `0xdff33338fe2f5b320ae2f8f466c7840eb7049ad1084ebb8528e987a7d13c69ff`
- Pool Object ID: `0x8475f0b62959bd0e4f384832af88b9cafc01837dee818ddad8801e48cd2a2639`
- Demo Invoice Object ID: `0x7bfd9cd93c8128cc158270f310ed7b0d5b06e1e0055d3926bb9dd32e2a8aa66e`
- Demo Walrus Blob ID: `zKWy6x8did0_8q0b0knIWvObve9e1UM4YKGSFAq3UH0`
- Website: local demo ready; deploy to Vercel/Netlify after `.env.local` IDs are set.

## Demo Video Outline, 5 Minutes

1. Problem: businesses wait 30-90 days for invoices while lenders need real yield.
2. Product: borrower submits invoice, receives immediate financing quote, and mints an invoice token.
3. Sui implementation: invoice is a Move object with amount, due date, borrower, debtor hash, Walrus blob ID, and repayment status.
4. Walrus: invoice PDF is uploaded as a verifiable blob and referenced by the on-chain object.
5. Lender workflow: lender dashboard shows open invoices, APR, risk, exposure, and funding action.
6. DeepBook Predict: risk view queries public Predict testnet data and frames debtor payment as a binary market signal.
7. Settlement: borrower marks invoice paid, and the pool receives principal plus fee.
8. Roadmap: debtor confirmation, Seal/client encryption, KYB, DUSDC liquidity seeding, and mainnet deployment.

## Judge Talking Points

- Real-world application carries the project: receivables financing is a large market with obvious non-crypto demand.
- Sui is used for object ownership and lifecycle, not just payments.
- Walrus is used as the document backbone.
- DeepBook/Predict are used as financial infrastructure and future risk-pricing signals.
- The demo is honest about trust boundaries and shows a credible path to production.

## Remaining Submission Tasks

- Request DeepBook Predict DUSDC and seed the shared pool.
- Deploy web app.
- Record demo video.
- Make repository public for judging.
