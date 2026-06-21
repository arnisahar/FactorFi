# Submission Plan

## Project Fields

- Project name: FactorFi
- Description: On-chain invoice financing on Sui. Businesses upload invoice documents to Walrus, mint invoice-right objects, receive DUSDC advances from lender liquidity, and settle principal plus fees when the invoice is paid.
- Track: DeFi & Payments, with DeepBook and Walrus sponsor relevance.
- Deployment: Sui Testnet.
- Package ID (v2): `0xef7fd6911233652300be893c6fa265f85d8fd9cc48852a9b91f32508daca6a68`
- Pool Object ID: record the fresh pool created during the final run.
- Demo Invoice Object ID: record the fresh invoice created during the final run.
- Demo Walrus Blob ID: record the blob returned during the final run.
- Website: local demo ready; Vercel config is included at the repository root.

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

- Complete the clean live flow in `docs/demo-script.md` and record the resulting object IDs.
- Deploy web app.
- Record demo video using `docs/demo-script.md`.
- Make repository public for judging.
