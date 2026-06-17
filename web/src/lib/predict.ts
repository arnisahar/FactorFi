import { DEEPBOOK_PREDICT } from "@/lib/protocol";

export type PredictState = {
  oracleCount: number;
  quoteAssetCount: number;
  vaultSummaryAvailable: boolean;
};

export async function fetchPredictState(): Promise<PredictState> {
  const [oraclesResponse, quoteAssetsResponse, vaultResponse] = await Promise.all([
    fetch(`${DEEPBOOK_PREDICT.serverUrl}/predicts/${DEEPBOOK_PREDICT.predictObject}/oracles`),
    fetch(`${DEEPBOOK_PREDICT.serverUrl}/predicts/${DEEPBOOK_PREDICT.predictObject}/quote-assets`),
    fetch(`${DEEPBOOK_PREDICT.serverUrl}/predicts/${DEEPBOOK_PREDICT.predictObject}/vault/summary`),
  ]);

  if (!oraclesResponse.ok || !quoteAssetsResponse.ok) {
    throw new Error("DeepBook Predict server is not returning market data.");
  }

  const [oracles, quoteAssets] = await Promise.all([
    oraclesResponse.json() as Promise<unknown>,
    quoteAssetsResponse.json() as Promise<unknown>,
  ]);

  return {
    oracleCount: Array.isArray(oracles) ? oracles.length : countCollection(oracles),
    quoteAssetCount: Array.isArray(quoteAssets) ? quoteAssets.length : countCollection(quoteAssets),
    vaultSummaryAvailable: vaultResponse.ok,
  };
}

function countCollection(value: unknown) {
  if (!value || typeof value !== "object") return 0;
  const record = value as Record<string, unknown>;
  for (const key of ["data", "items", "oracles", "quoteAssets"]) {
    if (Array.isArray(record[key])) return record[key].length;
  }
  return Object.keys(record).length;
}
