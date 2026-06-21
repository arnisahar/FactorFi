# Submission Plan

## Project Fields

- Project name: FactorFi
- Description: On-chain invoice financing on Sui. Businesses upload invoice documents to Walrus, mint invoice-right objects, receive DUSDC advances from lender liquidity, and settle principal plus fees when the invoice is paid.
- Track: DeFi & Payments, with DeepBook and Walrus sponsor relevance.
- Deployment: Sui Testnet.
- Package ID: `0x77224e501af0e7a0108c8300a428d228fac2502b6c59b1f90220bfd24b4f747e`
- Pool Object ID: `0x89b3c6a9deb018d5d2133249475fcd46cb27e409151d8826aaab345889e0473c`
- Demo Invoice Object ID: record the fresh invoice created during the final run.
- Demo Walrus Blob ID: record the blob returned during the final run.
- Website: landing page and live workspace are deployment-ready; Vercel config is in `web/vercel.json`.

## Demo Video Outline, Approximately 4 Minutes

1. Problem: businesses wait 30-90 days for invoices while lenders need real yield.
2. Product: borrower submits invoice, receives immediate financing quote, and mints an invoice token.
3. Sui implementation: invoice is a Move object with amount, due date, borrower, debtor hash, Walrus blob ID, and repayment status.
4. Walrus: invoice PDF is uploaded as a verifiable blob and referenced by the on-chain object.
5. Lender workflow: lender dashboard shows open invoices, APR, risk, exposure, and funding action.
6. DeepBook Predict: risk view queries public Predict testnet data and frames debtor payment as a binary market signal.
7. Settlement: borrower marks invoice paid, and the pool receives principal plus fee.
8. Roadmap: debtor confirmation, Seal/client encryption, KYB, institutional lender onboarding, and mainnet deployment.

## Judge Talking Points

- Real-world application carries the project: receivables financing is a large market with obvious non-crypto demand.
- Sui is used for object ownership and lifecycle, not just payments.
- Walrus is used as the document backbone.
- DeepBook/Predict are used as financial infrastructure and future risk-pricing signals.
- The demo is honest about trust boundaries and shows a credible path to production.

## Final Submission Tasks

- Deploy web app.
- Add the final demo invoice object and Walrus blob IDs from the recorded run.
- Record the demo using `docs/demo-script.md` and `docs/pitch-voiceover.md`.
- Make repository public for judging.
