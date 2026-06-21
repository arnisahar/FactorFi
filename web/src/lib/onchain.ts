import type { SuiGrpcClient } from "@mysten/sui/grpc";
import { FACTORFI_PLACEHOLDERS, WALRUS } from "@/lib/protocol";
import type { InvoiceMetadata, InvoicePosition, InvoiceStatus } from "@/types/factorfi";

export type PoolSnapshot = {
  objectId: string;
  type: string;
  balance: number;
  totalDeposited: number;
  outstandingPrincipal: number;
  fundedCount: number;
  owner: string;
  version: string;
  previousTransaction: string | null;
};

export type CoinSnapshot = {
  objectId: string;
  balance: number;
  digest: string;
};

export async function fetchPoolSnapshot(
  client: SuiGrpcClient,
  poolObjectId: string,
): Promise<PoolSnapshot | null> {
  if (!poolObjectId) return null;

  const { object } = await client.getObject({
    objectId: poolObjectId,
    include: { json: true, previousTransaction: true },
  });

  const json = object.json ?? {};

  return {
    objectId: object.objectId,
    type: object.type,
    balance: Number(json.balance ?? 0) / 1_000_000,
    totalDeposited: Number(json.total_deposited ?? 0) / 1_000_000,
    outstandingPrincipal: Number(json.outstanding_principal ?? 0) / 1_000_000,
    fundedCount: Number(json.funded_count ?? 0),
    owner: String(json.owner ?? ""),
    version: object.version,
    previousTransaction: object.previousTransaction,
  };
}

const STATUS_BY_CODE: Record<number, InvoiceStatus> = {
  0: "draft",
  1: "listed",
  2: "funded",
  3: "settled",
};

export async function fetchInvoiceSnapshots(
  client: SuiGrpcClient,
  objectIds: string[],
  metadata: Record<string, InvoiceMetadata>,
): Promise<InvoicePosition[]> {
  if (!objectIds.length) return [];

  const { objects } = await client.getObjects({
    objectIds,
    include: { json: true, previousTransaction: true },
  });

  return objects.flatMap((object) => {
    if (object instanceof Error || !object.json) return [];
    const json = object.json;
    const amount = Number(json.amount ?? 0) / 1_000_000;
    const advanceRateBps = Number(json.advance_bps ?? 0);
    const discountBps = Number(json.discount_bps ?? 0);
    const dueMs = Number(json.due_ms ?? Date.now());
    const dueInDays = Math.max(1, Math.ceil((dueMs - Date.now()) / 86_400_000));
    const principal = (amount * advanceRateBps) / 10_000;
    const fee = (amount * discountBps) / 10_000;
    const expectedAprBps = principal > 0
      ? Math.round((fee / principal) * (365 / dueInDays) * 10_000)
      : 0;
    const walrusBlobId = String(json.walrus_blob_id ?? "");
    const storedMetadata = metadata[object.objectId];

    return [{
      id: `INV-${object.objectId.slice(2, 8).toUpperCase()}`,
      borrower: String(json.borrower ?? ""),
      debtor: storedMetadata?.debtor ?? "Private debtor hash",
      amount,
      advanceRateBps,
      discountBps,
      expectedAprBps,
      dueInDays,
      counterpartyGrade: storedMetadata?.counterpartyGrade ?? "B",
      walrusBlobId,
      walrusUrl: walrusBlobId ? `${WALRUS.aggregatorUrl}/v1/blobs/${walrusBlobId}` : undefined,
      objectId: object.objectId,
      txDigest: object.previousTransaction ?? undefined,
      status: STATUS_BY_CODE[Number(json.status ?? 0)] ?? "defaulted",
    }];
  });
}

export async function fetchOwnedQuoteCoins(client: SuiGrpcClient, owner: string): Promise<CoinSnapshot[]> {
  const { objects } = await client.listCoins({
    owner,
    coinType: FACTORFI_PLACEHOLDERS.quoteCoinType,
    limit: 20,
  });

  return objects.map((coin) => ({
    objectId: coin.objectId,
    balance: Number(coin.balance) / 1_000_000,
    digest: coin.digest,
  }));
}

export function explorerObjectUrl(objectId: string) {
  return `https://suiexplorer.com/object/${objectId}?network=testnet`;
}

export function explorerTxUrl(digest: string) {
  return `https://suiexplorer.com/txblock/${digest}?network=testnet`;
}
