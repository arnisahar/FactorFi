import type { CounterpartyGrade, DraftInvoice } from "@/types/factorfi";

const GRADE_SPREAD_BPS: Record<CounterpartyGrade, number> = {
  A: 820,
  B: 1280,
  C: 1890,
};

const GRADE_RISK: Record<CounterpartyGrade, number> = {
  A: 18,
  B: 36,
  C: 61,
};

export function calculateOffer(invoice: DraftInvoice) {
  const maturityFactor = Math.max(invoice.dueInDays, 1) / 90;
  const discountBps = Math.round(
    GRADE_SPREAD_BPS[invoice.counterpartyGrade] * maturityFactor,
  );
  const riskScore = Math.min(
    95,
    Math.round(GRADE_RISK[invoice.counterpartyGrade] * maturityFactor),
  );
  const advanceRateBps = riskScore > 50 ? 8_500 : riskScore > 30 ? 8_800 : 9_200;
  const advanceAmount = (invoice.amount * advanceRateBps) / 10_000;
  const fee = (invoice.amount * discountBps) / 10_000;
  const expectedAprBps = advanceAmount > 0
    ? Math.round((fee / advanceAmount) * (365 / Math.max(invoice.dueInDays, 1)) * 10_000)
    : 0;

  return {
    advanceAmount,
    fee,
    discountBps,
    expectedAprBps,
    advanceRateBps,
    riskScore,
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatBps(value: number) {
  return `${(value / 100).toFixed(2)}%`;
}

export function shortAddress(value: string) {
  if (value.length < 14) return value;
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}
