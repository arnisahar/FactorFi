import { Transaction } from "@mysten/sui/transactions";
import { FACTORFI_PLACEHOLDERS } from "@/lib/protocol";
import type { DraftInvoice } from "@/types/factorfi";

type InvoiceTxInput = {
  invoice: DraftInvoice;
  walrusBlobId: string;
  advanceRateBps: number;
  discountBps: number;
  packageId?: string;
};

export function toQuoteUnits(amount: number) {
  return BigInt(Math.round(amount * 1_000_000));
}

export async function debtorHash(debtor: string) {
  const bytes = new TextEncoder().encode(debtor.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest));
}

export async function buildMintInvoiceTransaction(input: InvoiceTxInput) {
  const packageId = input.packageId ?? FACTORFI_PLACEHOLDERS.packageId;
  assertPackageId(packageId);

  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::invoice_finance::mint_listed_invoice`,
    arguments: [
      tx.pure.u64(toQuoteUnits(input.invoice.amount).toString()),
      tx.pure.u64(Date.now() + input.invoice.dueInDays * 24 * 60 * 60 * 1_000),
      tx.pure.vector("u8", await debtorHash(input.invoice.debtor)),
      tx.pure.string(input.walrusBlobId),
      tx.pure.u64(input.advanceRateBps),
      tx.pure.u64(input.discountBps),
    ],
  });

  return tx;
}

export function buildCreatePoolTransaction(
  coinType = FACTORFI_PLACEHOLDERS.quoteCoinType,
  packageId = FACTORFI_PLACEHOLDERS.packageId,
) {
  assertPackageId(packageId);
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::invoice_finance::create_pool`,
    typeArguments: [coinType],
  });
  return tx;
}

export function buildDepositTransaction({
  poolObjectId,
  coinObjectId,
  amount,
  coinType = FACTORFI_PLACEHOLDERS.quoteCoinType,
  packageId = FACTORFI_PLACEHOLDERS.packageId,
}: {
  poolObjectId: string;
  coinObjectId: string;
  amount: number;
  coinType?: string;
  packageId?: string;
}) {
  assertPackageId(packageId);
  const tx = new Transaction();
  const sourceCoin = tx.object(coinObjectId);
  const [depositCoin] = tx.splitCoins(sourceCoin, [tx.pure.u64(toQuoteUnits(amount))]);
  tx.moveCall({
    target: `${packageId}::invoice_finance::deposit`,
    typeArguments: [coinType],
    arguments: [tx.object(poolObjectId), depositCoin],
  });
  return tx;
}

export function buildFundInvoiceTransaction({
  poolObjectId,
  invoiceObjectId,
  coinType = FACTORFI_PLACEHOLDERS.quoteCoinType,
  packageId = FACTORFI_PLACEHOLDERS.packageId,
}: {
  poolObjectId: string;
  invoiceObjectId: string;
  coinType?: string;
  packageId?: string;
}) {
  assertPackageId(packageId);
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::invoice_finance::fund_invoice`,
    typeArguments: [coinType],
    arguments: [tx.object(poolObjectId), tx.object(invoiceObjectId)],
  });
  return tx;
}

export function buildSettleInvoiceTransaction({
  poolObjectId,
  invoiceObjectId,
  repaymentCoinObjectIds,
  repaymentAmount,
  coinType = FACTORFI_PLACEHOLDERS.quoteCoinType,
  packageId = FACTORFI_PLACEHOLDERS.packageId,
}: {
  poolObjectId: string;
  invoiceObjectId: string;
  repaymentCoinObjectIds: string[];
  repaymentAmount: number;
  coinType?: string;
  packageId?: string;
}) {
  assertPackageId(packageId);
  if (!repaymentCoinObjectIds.length) {
    throw new Error("At least one DUSDC coin is required for settlement.");
  }
  const tx = new Transaction();
  const sourceCoin = tx.object(repaymentCoinObjectIds[0]);
  if (repaymentCoinObjectIds.length > 1) {
    tx.mergeCoins(
      sourceCoin,
      repaymentCoinObjectIds.slice(1).map((coinObjectId) => tx.object(coinObjectId)),
    );
  }
  const [repaymentCoin] = tx.splitCoins(sourceCoin, [tx.pure.u64(toQuoteUnits(repaymentAmount))]);
  tx.moveCall({
    target: `${packageId}::invoice_finance::settle_invoice`,
    typeArguments: [coinType],
    arguments: [
      tx.object(poolObjectId),
      tx.object(invoiceObjectId),
      repaymentCoin,
    ],
  });
  return tx;
}

function assertPackageId(packageId: string) {
  if (!packageId) {
    throw new Error("FactorFi package ID is not configured yet. Publish the Move package and set VITE_FACTORFI_PACKAGE_ID.");
  }
}
