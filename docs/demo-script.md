# FactorFi Clean Demo Flow

## Preflight

- Use one Slush testnet account with testnet SUI and 10–15 DUSDC.
- Keep at least 3 DUSDC outside the pool so the wallet can cover the financing fee at settlement.
- Download **Demo invoice** from the landing page, or use
  `output/pdf/factorfi-demo-invoice.pdf` directly.
- Open `http://localhost:5173/`, launch the workspace, and connect Slush.

## 1. Start A Clean Workspace

1. If a pool is already shown, click **New workspace**.
2. Click **Create lending pool**.
3. Approve the Slush transaction.
4. Confirm the integration panel shows the new shared pool object ID.

This local workspace now tracks only objects created during this run. Previous testnet objects remain on-chain but are not displayed.

## 2. Seed The Pool

1. Open **Lender book**.
2. Click the DUSDC coin shown under **DUSDC coin object**.
3. Enter a deposit amount that leaves 3 DUSDC in the wallet:
   - 10 DUSDC wallet balance: deposit 7 DUSDC.
   - 12 DUSDC wallet balance: deposit 9 DUSDC.
   - 15 DUSDC wallet balance: deposit 12 DUSDC.
4. Click **Deposit** and approve the transaction.
5. Confirm **Live pool balance** matches the deposited amount.

The deposit transaction splits the selected coin, so the whole wallet coin is not consumed.

## 3. Mint A Real Invoice

1. Open **Borrower desk**.
2. Enter:
   - Debtor: `Demo Buyer Ltd`.
   - Face value: `5`.
   - Due in days: `30`.
   - Counterparty grade: `A`.
3. Select the PDF invoice.
4. Click **Upload and mint on Sui**.
5. Approve the Slush transaction after the Walrus upload completes.

Expected terms:

- Advance: 4.6 DUSDC.
- Discount fee: 0.1365 DUSDC.
- Settlement repayment: 4.7365 DUSDC.

The resulting invoice is a real shared Sui object. The app stores only its object ID and private display metadata locally; amount, status, terms, borrower, due date, and Walrus blob ID are reloaded from Sui.

## 4. Finance The Invoice

1. Open **Lender book**.
2. Confirm the new invoice is the only market row and its status is **listed**.
3. Click **Fund selected invoice**.
4. Approve the Slush transaction.
5. Confirm:
   - Invoice status becomes **funded**.
   - Pool liquidity falls by 4.6 DUSDC.
   - The connected wallet receives a new 4.6 DUSDC coin.

## 5. Query Predict

1. Open **Risk market**.
2. Show the on-chain advance rate and discount terms.
3. Click **Query Predict markets**.
4. Show the live DeepBook Predict testnet response.

## 6. Settle

1. Return to **Borrower desk**.
2. Confirm the wallet balance covers the displayed repayment.
3. Click **Settle on Sui**.
4. Approve the transaction.
5. Confirm:
   - Invoice status becomes **settled**.
   - Outstanding principal returns to zero.
   - Pool liquidity ends above the initial deposit by the financing fee.

The settlement transaction automatically merges available DUSDC coins and splits the exact repayment amount.

## Judge Framing

For a compact demo, the same wallet acts as borrower, pool owner, and transaction signer. The Move contract still transfers the advance to the invoice borrower and restricts settlement to that borrower. Separate borrower and lender wallets can use the same shared invoice and pool lifecycle.
