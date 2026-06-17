import type { SuiGrpcClient } from "@mysten/sui/grpc";
import { FACTORFI_PLACEHOLDERS } from "@/lib/protocol";

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

export async function fetchPoolSnapshot(client: SuiGrpcClient): Promise<PoolSnapshot | null> {
  if (!FACTORFI_PLACEHOLDERS.poolObjectId) return null;

  const { object } = await client.getObject({
    objectId: FACTORFI_PLACEHOLDERS.poolObjectId,
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
