import { create } from "zustand";
import { calculateOffer } from "@/lib/finance";
import type { DraftInvoice, InvoicePosition, LenderPosition } from "@/types/factorfi";

type FactorFiState = {
  invoices: InvoicePosition[];
  lenderPositions: LenderPosition[];
  selectedInvoiceId: string;
  submitInvoice: (invoice: DraftInvoice, walletAddress?: string) => InvoicePosition;
  fundInvoice: (invoiceId: string, lender?: string) => void;
  settleInvoice: (invoiceId: string) => void;
  selectInvoice: (invoiceId: string) => void;
};

const seedInvoices: InvoicePosition[] = [
  {
    id: "INV-CHAIN-0001",
    borrower: "0x8c3ae4eb26b2b21d6fbeb24d202102fb1e17b33400fe9ba8a227d15716d25bb0",
    debtor: "Helio Grid Systems",
    amount: 50_000,
    advanceRateBps: 9_000,
    discountBps: 700,
    expectedAprBps: 2_981,
    dueInDays: 90,
    riskScore: 24,
    counterpartyGrade: "A",
    walrusBlobId: "zKWy6x8did0_8q0b0knIWvObve9e1UM4YKGSFAq3UH0",
    walrusUrl:
      "https://aggregator.walrus-testnet.walrus.space/v1/blobs/zKWy6x8did0_8q0b0knIWvObve9e1UM4YKGSFAq3UH0",
    objectId: "0x7bfd9cd93c8128cc158270f310ed7b0d5b06e1e0055d3926bb9dd32e2a8aa66e",
    txDigest: "5JSTevnu9cKJTqXAVGf9AWMWcPPUPXi6fDrT5ZRQCPUx",
    status: "listed",
  },
  {
    id: "INV-1027",
    borrower: "Northstar Components",
    debtor: "Helio Grid Systems",
    amount: 50_000,
    advanceRateBps: 9_200,
    discountBps: 650,
    expectedAprBps: 2_948,
    dueInDays: 82,
    riskScore: 22,
    counterpartyGrade: "A",
    walrusBlobId: "r6eC...walrusInvoicePdf",
    objectId: "0x4a18...invoice1027",
    status: "funded",
    fundedBy: "0x2f91...55c0",
  },
  {
    id: "INV-1031",
    borrower: "Luma Freight",
    debtor: "Atlas Retail Group",
    amount: 78_500,
    advanceRateBps: 8_800,
    discountBps: 1_180,
    expectedAprBps: 4_381,
    dueInDays: 74,
    riskScore: 39,
    counterpartyGrade: "B",
    walrusBlobId: "8Kx2...walrusInvoicePdf",
    objectId: "0x9be2...invoice1031",
    status: "listed",
  },
  {
    id: "INV-1038",
    borrower: "Cinder BioWorks",
    debtor: "Meridian Health Labs",
    amount: 34_200,
    advanceRateBps: 8_500,
    discountBps: 1_940,
    expectedAprBps: 6_110,
    dueInDays: 96,
    riskScore: 65,
    counterpartyGrade: "C",
    walrusBlobId: "Qp9L...walrusInvoicePdf",
    objectId: "0xe011...invoice1038",
    status: "listed",
  },
];

export const useFactorFiStore = create<FactorFiState>((set, get) => ({
  invoices: seedInvoices,
  lenderPositions: [
    {
      lender: "0x2f91...55c0",
      invoiceId: "INV-1027",
      principal: 46_000,
      expectedReturn: 3_250,
      exposureBps: 2_850,
    },
  ],
  selectedInvoiceId: seedInvoices[0].id,
  submitInvoice: (invoice, walletAddress) => {
    const offer = calculateOffer(invoice);
    const next: InvoicePosition = {
      id: `INV-${1040 + get().invoices.length}`,
      borrower: walletAddress ?? "Demo borrower",
      debtor: invoice.debtor,
      amount: invoice.amount,
      dueInDays: invoice.dueInDays,
      counterpartyGrade: invoice.counterpartyGrade,
      advanceRateBps: offer.advanceRateBps,
      discountBps: offer.discountBps,
      expectedAprBps: offer.expectedAprBps,
      riskScore: offer.riskScore,
      walrusBlobId: invoice.walrusBlobId ?? `demo-${Date.now().toString(36)}-walrus-blob`,
      walrusUrl: invoice.walrusUrl,
      objectId: invoice.objectId ?? `0xdemo${Date.now().toString(16)}`,
      txDigest: invoice.txDigest,
      status: "listed",
    };

    set((state) => ({
      invoices: [next, ...state.invoices],
      selectedInvoiceId: next.id,
    }));

    return next;
  },
  fundInvoice: (invoiceId, lender = "Demo lender") => {
    const invoice = get().invoices.find((item) => item.id === invoiceId);
    if (!invoice || invoice.status !== "listed") return;

    const principal = Math.round((invoice.amount * invoice.advanceRateBps) / 10_000);
    const expectedReturn = Math.round((invoice.amount * invoice.discountBps) / 10_000);

    set((state) => ({
      invoices: state.invoices.map((item) =>
        item.id === invoiceId
          ? { ...item, status: "funded", fundedBy: lender }
          : item,
      ),
      lenderPositions: [
        {
          lender,
          invoiceId,
          principal,
          expectedReturn,
          exposureBps: Math.round((principal / 250_000) * 10_000),
        },
        ...state.lenderPositions,
      ],
    }));
  },
  settleInvoice: (invoiceId) => {
    set((state) => ({
      invoices: state.invoices.map((item) =>
        item.id === invoiceId ? { ...item, status: "settled" } : item,
      ),
    }));
  },
  selectInvoice: (invoiceId) => {
    set({ selectedInvoiceId: invoiceId });
  },
}));
