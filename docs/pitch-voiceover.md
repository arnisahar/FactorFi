# FactorFi Pitch and Demo Voiceover

Target runtime: approximately 3 minutes 40 seconds, excluding wallet confirmation delays.

## Recording Notes

- Record each numbered section as a separate audio clip.
- Cut wallet waiting time from the video; resume narration when the transaction confirms.
- Say "D-U-S-D-C" when reading DUSDC aloud.
- Keep the cursor still while explaining a result, then move before introducing the next action.

## 1. Project Introduction — 0:00 to 0:38

**Screen:** FactorFi landing page.

**Voiceover:**

"Businesses often wait thirty, sixty, or ninety days for customers to pay their invoices. Invoice financing solves that cash-flow gap by letting a business receive most of the invoice value immediately, while a liquidity provider earns a fee when the receivable is repaid.

FactorFi brings that workflow on-chain on Sui. The invoice document is stored through Walrus, the financing terms and lifecycle are represented by a shared Sui object, liquidity is supplied in DUSDC, and DeepBook Predict provides a live market signal for payment risk. The result is a transparent path from a real business invoice to programmable financing and settlement."

## 2. Open the Workspace — 0:38 to 0:50

**Screen:** Click **Launch workspace** and show the clean dashboard.

**Voiceover:**

"I will demonstrate the complete lifecycle on Sui testnet: create a lending pool, tokenize an invoice, finance it, inspect its risk, and settle it on-chain."

## 3. Create and Seed the Pool — 0:50 to 1:17

**Screen:** Show the connected wallet and newly created pool. Open **Lender book**, select the DUSDC coin, enter `7`, click **Deposit**, and approve the transaction.

**Voiceover:**

"I start with ten DUSDC in the connected wallet. I deposit seven DUSDC into a new shared lending pool and deliberately leave three DUSDC available for settlement. The transaction splits the selected coin, so it deposits only the requested amount instead of consuming the wallet's entire coin object.

The transaction is now confirmed, and the live pool balance is seven DUSDC."

## 4. Upload and Mint the Invoice — 1:17 to 1:58

**Screen:** Open **Borrower desk**. Show `Demo Buyer Ltd`, face value `5`, due in `30` days, grade `A`, and the selected PDF. Click **Upload and mint on Sui**, then approve.

**Voiceover:**

"Next, the business submits a real invoice for Demo Buyer Limited. It has a face value of five DUSDC, is due in thirty days, and has a grade-A counterparty.

FactorFi uploads the PDF to Walrus and then mints the receivable as a shared Sui object. The object records the borrower, amount, maturity, financing terms, status, and Walrus blob identifier without placing the full private document on-chain.

For this invoice, the business can receive four point six DUSDC now. The financing fee is zero point one three six five DUSDC, making the final pool repayment four point seven three six five DUSDC."

## 5. Finance the Invoice — 1:58 to 2:28

**Screen:** Open **Lender book**, show the listed invoice, click **Fund selected invoice**, and approve. Show the funded status and balances.

**Voiceover:**

"The invoice now appears in the lender market with a listed status. I select it and fund the advance from the shared pool.

This is a real on-chain transfer. The invoice status changes to funded, pool liquidity falls from seven to two point four DUSDC, and the borrower receives a new four point six DUSDC coin in the connected wallet. The receivable has now been converted into immediate working capital."

## 6. Inspect the Risk Signal — 2:28 to 2:48

**Screen:** Open **Risk market**, show the terms, click **Query Predict markets**, and show the returned testnet state.

**Voiceover:**

"FactorFi also exposes the invoice as a binary payment-risk question: will this invoice be paid by its due date? Here, the application combines the immutable financing terms with a live DeepBook Predict testnet response, creating a path toward market-informed pricing instead of a permanently hardcoded interest rate."

## 7. Settle the Invoice — 2:48 to 3:17

**Screen:** Return to **Borrower desk**, show the repayment, click **Settle on Sui**, and approve. Show settled status, zero outstanding principal, and final pool balance.

**Voiceover:**

"Once the customer payment is received, the borrower settles the financed invoice. FactorFi automatically merges available DUSDC coins and splits the exact repayment amount, so the user does not need to manage coin objects manually.

The invoice is now settled, outstanding principal is zero, and pool liquidity has increased to seven point one three six five DUSDC. The lender's original capital has returned together with the financing fee, completing the full receivable lifecycle on-chain."

## 8. Closing — 3:17 to 3:42

**Screen:** Show the settled invoice, then return to the landing-page closing section.

**Voiceover:**

"For this compact testnet demonstration, one wallet acts as the pool owner, lender, borrower, and transaction signer. The contract still transfers funds to the invoice's recorded borrower and restricts settlement to that borrower; the same shared-object workflow supports separate business and lender wallets.

FactorFi is not another crypto-collateral lending market. It uses the asset businesses already depend on: their receivables. Sui provides the programmable settlement layer, Walrus provides the document backbone, the shared DUSDC pool provides liquidity, and DeepBook Predict provides the market-risk signal."

## Short Closing Alternative — 15 seconds

"FactorFi turns a verified business receivable into immediate on-chain liquidity. The document, financing terms, capital transfer, risk signal, and repayment remain connected from upload through settlement. That is invoice financing rebuilt for Sui."
