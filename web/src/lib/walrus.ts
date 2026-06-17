import { WALRUS } from "@/lib/protocol";

export type WalrusUploadResult = {
  blobId: string;
  objectId?: string;
  size?: number;
  url: string;
  raw: unknown;
};

type WalrusStoreResponse = {
  newlyCreated?: {
    blobObject?: {
      id?: string;
      blobId?: string;
      size?: number;
    };
  };
  alreadyCertified?: {
    blobId?: string;
    event?: {
      txDigest?: string;
    };
  };
};

export async function uploadInvoiceToWalrus(file: File): Promise<WalrusUploadResult> {
  const endpoint = new URL("/v1/blobs", WALRUS.publisherUrl);
  endpoint.searchParams.set("epochs", String(WALRUS.defaultEpochs));
  endpoint.searchParams.set("deletable", "true");

  const response = await fetch(endpoint, {
    method: "PUT",
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Walrus upload failed: ${response.status} ${response.statusText}`);
  }

  const raw = (await response.json()) as WalrusStoreResponse;
  const blobObject = raw.newlyCreated?.blobObject;
  const blobId = blobObject?.blobId ?? raw.alreadyCertified?.blobId;

  if (!blobId) {
    throw new Error("Walrus upload response did not include a blob ID");
  }

  return {
    blobId,
    objectId: blobObject?.id,
    size: blobObject?.size,
    url: `${WALRUS.aggregatorUrl}/v1/blobs/${blobId}`,
    raw,
  };
}

export function createInvoicePdfBlob(invoiceText: string) {
  return new File([invoiceText], `factorfi-invoice-${Date.now()}.txt`, {
    type: "text/plain",
  });
}
