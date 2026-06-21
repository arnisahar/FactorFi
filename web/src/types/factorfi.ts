export type InvoiceStatus =
  | "draft"
  | "listed"
  | "funded"
  | "settled"
  | "defaulted";

export type CounterpartyGrade = "A" | "B" | "C";

export type InvoicePosition = {
  id: string;
  borrower: string;
  debtor: string;
  amount: number;
  advanceRateBps: number;
  discountBps: number;
  expectedAprBps: number;
  dueInDays: number;
  counterpartyGrade: CounterpartyGrade;
  walrusBlobId: string;
  walrusUrl?: string;
  objectId: string;
  txDigest?: string;
  fundedBy?: string;
  status: InvoiceStatus;
};

export type DraftInvoice = {
  debtor: string;
  amount: number;
  dueInDays: number;
  counterpartyGrade: CounterpartyGrade;
  walrusBlobId?: string;
  walrusUrl?: string;
  txDigest?: string;
  objectId?: string;
};

export type InvoiceMetadata = {
  debtor: string;
  counterpartyGrade: CounterpartyGrade;
};
