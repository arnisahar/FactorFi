import { useEffect, useMemo, useState } from "react";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { useCurrentAccount, useCurrentClient, useDAppKit } from "@mysten/dapp-kit-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ArrowUpRight,
  Banknote,
  Blocks,
  CheckCircle2,
  CircleDollarSign,
  Database,
  Download,
  ExternalLink,
  Gauge,
  Landmark,
  LockKeyhole,
  RefreshCw,
  ReceiptText,
  ShieldCheck,
  UploadCloud,
  Wallet,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateOffer, formatBps, formatCurrency, shortAddress } from "@/lib/finance";
import {
  DEEPBOOK_PREDICT,
  FACTORFI_PLACEHOLDERS,
  WALRUS,
  hasFactorFiDeployment,
} from "@/lib/protocol";
import {
  explorerObjectUrl,
  fetchInvoiceSnapshots,
  fetchOwnedQuoteCoins,
  fetchPoolSnapshot,
  type PoolSnapshot,
} from "@/lib/onchain";
import { fetchPredictState } from "@/lib/predict";
import {
  buildCreatePoolTransaction,
  buildDepositTransaction,
  buildFundInvoiceTransaction,
  buildMintInvoiceTransaction,
  buildSettleInvoiceTransaction,
} from "@/lib/transactions";
import { uploadInvoiceToWalrus } from "@/lib/walrus";
import type {
  CounterpartyGrade,
  InvoiceMetadata,
  InvoicePosition,
} from "@/types/factorfi";

const invoiceSchema = z.object({
  debtor: z.string().min(3, "Enter the invoice debtor"),
  amount: z.number().min(1).max(1_000),
  dueInDays: z.number().int().min(1).max(180),
  counterpartyGrade: z.enum(["A", "B", "C"]),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const grades: CounterpartyGrade[] = ["A", "B", "C"];

export default function DashboardPage() {
  const account = useCurrentAccount();
  const client = useCurrentClient();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<"borrower" | "lender" | "risk">(
    "borrower",
  );
  const [poolObjectId, setPoolObjectId] = useState(() =>
    localStorage.getItem("factorfi.poolObjectId") ?? FACTORFI_PLACEHOLDERS.poolObjectId,
  );
  const [trackedInvoiceIds, setTrackedInvoiceIds] = useState<string[]>(() =>
    readStoredJson<string[]>("factorfi.invoiceObjectIds", []),
  );
  const [invoiceMetadata, setInvoiceMetadata] = useState<Record<string, InvoiceMetadata>>(() =>
    readStoredJson<Record<string, InvoiceMetadata>>("factorfi.invoiceMetadata", {}),
  );
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const invoicesQuery = useQuery({
    queryKey: ["invoices", trackedInvoiceIds],
    queryFn: () => fetchInvoiceSnapshots(client, trackedInvoiceIds, invoiceMetadata),
    refetchInterval: 10_000,
  });
  const invoices = invoicesQuery.data ?? [];
  const selectedInvoice = invoices.find((invoice) => invoice.objectId === selectedInvoiceId) ?? invoices[0];
  const listedInvoices = invoices.filter((invoice) => invoice.status === "listed");
  const fundedInvoices = invoices.filter((invoice) => invoice.status === "funded");
  const totalBook = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const weightedApr = invoices.length
    ? Math.round(invoices.reduce((sum, invoice) => sum + invoice.expectedAprBps, 0) / invoices.length)
    : 0;
  const poolQuery = useQuery({
    queryKey: ["poolSnapshot", poolObjectId],
    queryFn: () => fetchPoolSnapshot(client, poolObjectId),
    enabled: Boolean(poolObjectId),
    refetchInterval: 15_000,
  });
  const poolSnapshot = poolQuery.data;
  const activeViewLabel = activeView === "borrower"
    ? "Borrower desk"
    : activeView === "lender"
      ? "Lender book"
      : "Risk market";

  useEffect(() => {
    if (selectedInvoiceId && invoices.some((invoice) => invoice.objectId === selectedInvoiceId)) return;
    setSelectedInvoiceId(invoices[0]?.objectId ?? "");
  }, [invoices, selectedInvoiceId]);

  function handlePoolCreated(objectId: string) {
    localStorage.setItem("factorfi.poolObjectId", objectId);
    setPoolObjectId(objectId);
  }

  function handleInvoiceCreated(objectId: string, metadata: InvoiceMetadata) {
    const nextIds = [objectId, ...trackedInvoiceIds.filter((id) => id !== objectId)];
    const nextMetadata = { ...invoiceMetadata, [objectId]: metadata };
    localStorage.setItem("factorfi.invoiceObjectIds", JSON.stringify(nextIds));
    localStorage.setItem("factorfi.invoiceMetadata", JSON.stringify(nextMetadata));
    setTrackedInvoiceIds(nextIds);
    setInvoiceMetadata(nextMetadata);
    setSelectedInvoiceId(objectId);
  }

  function handleResetWorkspace() {
    localStorage.removeItem("factorfi.poolObjectId");
    localStorage.removeItem("factorfi.invoiceObjectIds");
    localStorage.removeItem("factorfi.invoiceMetadata");
    setPoolObjectId("");
    setTrackedInvoiceIds([]);
    setInvoiceMetadata({});
    setSelectedInvoiceId("");
    queryClient.removeQueries({ queryKey: ["invoices"] });
    queryClient.removeQueries({ queryKey: ["poolSnapshot"] });
  }

  return (
    <div className="workspace-page min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-17 max-w-[1480px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-5">
            <BrandMark />
            <div className="hidden h-6 w-px bg-border md:block" />
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-xs font-semibold uppercase text-muted-foreground">Financing workspace</p>
              <p className="mt-0.5 truncate text-sm font-bold">{activeViewLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden border-[#e3b341] bg-[#fff8df] text-[#825d00] sm:inline-flex">
              Sui testnet
            </Badge>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-w-0 max-w-[1480px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:px-8 lg:py-8">
        <aside className="sticky top-24 hidden min-w-0 self-start space-y-5 lg:block">
          <WalletPanel address={account?.address} />
          <Navigation activeView={activeView} setActiveView={setActiveView} />
          <IntegrationPanel
            poolObjectId={poolObjectId}
            onPoolCreated={handlePoolCreated}
            onResetWorkspace={handleResetWorkspace}
          />
        </aside>

        <section className="min-w-0 space-y-6">
          <div className="space-y-4 lg:hidden">
            <Navigation activeView={activeView} setActiveView={setActiveView} />
            <IntegrationPanel
              poolObjectId={poolObjectId}
              onPoolCreated={handlePoolCreated}
              onResetWorkspace={handleResetWorkspace}
            />
          </div>
          <div className="overflow-hidden border bg-white md:grid md:grid-cols-4 md:divide-x">
            <MetricCard icon={CircleDollarSign} label="Invoice book" value={formatCurrency(totalBook)} detail={`${invoices.length} tokenized invoices`} />
            <MetricCard
              icon={Landmark}
              label="Liquidity"
              value={formatCurrency(poolSnapshot?.balance ?? 0)}
              detail={poolSnapshot ? "DUSDC live pool" : "No pool selected"}
            />
            <MetricCard icon={Gauge} label="Blended APR" value={formatBps(weightedApr)} detail="Risk adjusted" />
            <MetricCard icon={ShieldCheck} label="Funded" value={fundedInvoices.length.toString()} detail={`${listedInvoices.length} open offers`} />
          </div>

          {activeView === "borrower" ? (
            <BorrowerDesk
              address={account?.address}
              selectedInvoice={selectedInvoice}
              poolObjectId={poolObjectId}
              onInvoiceCreated={handleInvoiceCreated}
            />
          ) : null}

          {activeView === "lender" ? (
            <LenderDesk
              invoices={invoices}
              poolSnapshot={poolSnapshot ?? null}
              poolObjectId={poolObjectId}
              selectedInvoiceId={selectedInvoiceId}
              onSelectInvoice={setSelectedInvoiceId}
            />
          ) : null}

          {activeView === "risk" ? <RiskDesk selectedInvoice={selectedInvoice} /> : null}
        </section>
      </main>
    </div>
  );
}

function WalletPanel({ address }: { address?: string }) {
  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wallet className="size-4" />
          Wallet
        </CardTitle>
      </CardHeader>
      <CardContent>
        {address ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#188a5b]">
              <CheckCircle2 className="size-4" />
              <span className="text-sm">Connected</span>
            </div>
            <p className="break-all font-mono text-xs text-muted-foreground">{address}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Connect a Sui wallet to prepare on-chain transactions.</p>
        )}
      </CardContent>
    </Card>
  );
}

function Navigation({
  activeView,
  setActiveView,
}: {
  activeView: "borrower" | "lender" | "risk";
  setActiveView: (view: "borrower" | "lender" | "risk") => void;
}) {
  const items = [
    { id: "borrower" as const, label: "Borrower desk", icon: UploadCloud },
    { id: "lender" as const, label: "Lender book", icon: Banknote },
    { id: "risk" as const, label: "Risk market", icon: Blocks },
  ];

  return (
    <Card className="rounded-lg shadow-none">
      <CardContent className="space-y-2 p-3">
        {items.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={activeView === item.id ? "w-full justify-start bg-[#172033] text-white hover:bg-[#172033] hover:text-white" : "w-full justify-start text-muted-foreground hover:text-foreground"}
            onClick={() => setActiveView(item.id)}
          >
            <item.icon className="size-4" />
            {item.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

function IntegrationPanel({
  poolObjectId,
  onPoolCreated,
  onResetWorkspace,
}: {
  poolObjectId: string;
  onPoolCreated: (objectId: string) => void;
  onResetWorkspace: () => void;
}) {
  const dAppKit = useDAppKit();
  const [poolState, setPoolState] = useState<{
    status: "idle" | "working" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  async function handleCreatePool() {
    try {
      if (!hasFactorFiDeployment()) {
        throw new Error("Publish the Move package before creating the pool.");
      }

      setPoolState({ status: "working", message: "Requesting wallet signature to create DUSDC pool..." });
      const result = await dAppKit.signAndExecuteTransaction({
        transaction: buildCreatePoolTransaction(),
      });

      if (result.FailedTransaction) {
        throw new Error(formatExecutionError(result.FailedTransaction.status.error, "Pool creation failed."));
      }

      const createdPoolId = getCreatedObjectId(result.Transaction.effects);
      if (!createdPoolId) {
        throw new Error("Pool transaction succeeded but no created pool object was returned.");
      }
      onPoolCreated(createdPoolId);

      setPoolState({
        status: "success",
        message: `Pool ${shortAddress(createdPoolId)} created. Digest ${shortAddress(result.Transaction.digest)}.`,
      });
    } catch (error) {
      setPoolState({
        status: "error",
        message: error instanceof Error ? error.message : "Pool creation failed.",
      });
    }
  }

  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Live integration targets</CardTitle>
        <CardDescription>Verified testnet configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <IntegrationRow icon={Database} label="Walrus" value={`${WALRUS.defaultEpochs} epochs, deletable PDF blobs`} />
        <IntegrationRow icon={Blocks} label="Predict" value={shortAddress(DEEPBOOK_PREDICT.predictObject)} />
        <IntegrationRow icon={CircleDollarSign} label="Quote" value="DUSDC, 6 decimals" />
        <IntegrationRow
          icon={LockKeyhole}
          label="Package"
          value={FACTORFI_PLACEHOLDERS.packageId || "Awaiting testnet publish"}
        />
        <IntegrationRow
          icon={Landmark}
          label="Pool"
          value={poolObjectId || "Not created"}
        />
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          disabled={poolState.status === "working" || Boolean(poolObjectId)}
          onClick={handleCreatePool}
        >
          <Landmark className="size-4" />
          {poolObjectId ? "Pool configured" : "Create lending pool"}
        </Button>
        {poolObjectId ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            disabled={poolState.status === "working"}
            onClick={() => {
              onResetWorkspace();
              setPoolState({ status: "idle", message: "" });
            }}
          >
            <RefreshCw className="size-4" />
            New workspace
          </Button>
        ) : null}
        {poolState.message ? (
          <p className={poolState.status === "error" ? "text-destructive" : "text-muted-foreground"}>
            {poolState.message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function IntegrationRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Database;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 text-[#2457e6]" />
      <div className="min-w-0">
        <p className="font-medium text-foreground">{label}</p>
        <p className="truncate text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="min-w-0 border-b p-4 last:border-b-0 md:border-b-0 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
        <span className="grid size-8 place-items-center bg-[#eef2ff] text-[#2457e6]">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-5 text-2xl font-bold text-[#172033]">{value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function BorrowerDesk({
  address,
  selectedInvoice,
  poolObjectId,
  onInvoiceCreated,
}: {
  address?: string;
  selectedInvoice?: InvoicePosition;
  poolObjectId: string;
  onInvoiceCreated: (objectId: string, metadata: InvoiceMetadata) => void;
}) {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [actionState, setActionState] = useState<{
    status: "idle" | "working" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      debtor: "",
      amount: 0,
      dueInDays: 30,
      counterpartyGrade: "A",
    },
  });
  const watchedInvoice = form.watch();
  const offer = useMemo(() => calculateOffer(watchedInvoice), [watchedInvoice]);
  const hasQuote = Number.isFinite(watchedInvoice.amount) && watchedInvoice.amount >= 1;
  const errors = form.formState.errors;
  const isWorking = actionState.status === "working";
  const selectedRequiresLiveSettlement =
    selectedInvoice?.status === "funded" &&
    hasFactorFiDeployment() &&
    Boolean(poolObjectId);
  const selectedRepaymentAmount = selectedInvoice
    ? (selectedInvoice.amount * (selectedInvoice.advanceRateBps + selectedInvoice.discountBps)) / 10_000
    : 0;
  const repaymentCoinsQuery = useQuery({
    queryKey: ["quoteCoins", account?.address, FACTORFI_PLACEHOLDERS.quoteCoinType, "repayment"],
    queryFn: () => fetchOwnedQuoteCoins(client, account!.address),
    enabled: Boolean(account?.address) && Boolean(selectedRequiresLiveSettlement),
    refetchInterval: 20_000,
  });

  async function uploadCurrentInvoice() {
    if (!invoiceFile) {
      throw new Error("Select an invoice document before minting.");
    }
    return uploadInvoiceToWalrus(invoiceFile);
  }

  const handleSuiMint = form.handleSubmit(async (values) => {
    try {
      if (!address) {
        throw new Error("Connect a Sui wallet before minting on-chain.");
      }
      if (!hasFactorFiDeployment()) {
        throw new Error("FactorFi package is not configured.");
      }

      setActionState({ status: "working", message: "Uploading invoice document to Walrus..." });
      const upload = await uploadCurrentInvoice();
      setActionState({ status: "working", message: "Requesting wallet signature for invoice mint..." });

      const tx = await buildMintInvoiceTransaction({
        invoice: values,
        walrusBlobId: upload.blobId,
        advanceRateBps: offer.advanceRateBps,
        discountBps: offer.discountBps,
      });
      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

      if (result.FailedTransaction) {
        throw new Error(formatExecutionError(result.FailedTransaction.status.error, "Sui transaction failed."));
      }

      const invoiceObjectId = getCreatedObjectId(result.Transaction.effects) ?? result.Transaction.digest;
      onInvoiceCreated(invoiceObjectId, {
        debtor: values.debtor,
        counterpartyGrade: values.counterpartyGrade,
      });
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      form.reset();
      setInvoiceFile(null);

      setActionState({
        status: "success",
        message: `Invoice ${shortAddress(invoiceObjectId)} minted, listed, and shared on Sui. Digest ${shortAddress(result.Transaction.digest)}.`,
      });
    } catch (error) {
      setActionState({
        status: "error",
        message: error instanceof Error ? error.message : "Sui mint failed.",
      });
    }
  });

  async function handleSettleSelected() {
    try {
      if (!selectedInvoice || !selectedRequiresLiveSettlement) {
        throw new Error("Select a funded on-chain invoice before settling.");
      }
      if (!address || address !== selectedInvoice.borrower) {
        throw new Error("Connect the original borrower wallet to settle this invoice on Sui.");
      }
      const repaymentCoins = repaymentCoinsQuery.data ?? [];
      const availableRepayment = repaymentCoins.reduce((sum, coin) => sum + coin.balance, 0);
      if (availableRepayment < selectedRepaymentAmount) {
        throw new Error(`Wallet needs ${formatCurrency(selectedRepaymentAmount - availableRepayment)} more DUSDC to settle.`);
      }

      setActionState({ status: "working", message: "Requesting wallet signature for invoice settlement..." });
      const result = await dAppKit.signAndExecuteTransaction({
        transaction: buildSettleInvoiceTransaction({
          poolObjectId,
          invoiceObjectId: selectedInvoice.objectId,
          repaymentCoinObjectIds: repaymentCoins.map((coin) => coin.objectId),
          repaymentAmount: selectedRepaymentAmount,
        }),
      });

      if (result.FailedTransaction) {
        throw new Error(formatExecutionError(result.FailedTransaction.status.error, "Settlement transaction failed."));
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["quoteCoins"] }),
        queryClient.invalidateQueries({ queryKey: ["poolSnapshot"] }),
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
      ]);
      setActionState({
        status: "success",
        message: `${selectedInvoice.id} settled on Sui. Digest ${shortAddress(result.Transaction.digest)}.`,
      });
    } catch (error) {
      setActionState({
        status: "error",
        message: error instanceof Error ? error.message : "Settlement failed.",
      });
    }
  }

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="rounded-lg">
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div>
            <CardTitle>Submit invoice</CardTitle>
            <CardDescription className="mt-1.5">Upload PDF to Walrus, mint invoice object, list the financing offer.</CardDescription>
          </div>
          <a
            href="/factorfi-demo-invoice.pdf"
            download
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border bg-white px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Download className="size-3.5" />
            Demo PDF
          </a>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={handleSuiMint}
          >
            <Field label="Debtor" error={errors.debtor?.message}>
              <Input placeholder="Customer legal name" {...form.register("debtor")} />
            </Field>
            <Field label="Face value" error={errors.amount?.message}>
              <Input type="number" min="1" step="0.01" {...form.register("amount", { valueAsNumber: true })} />
            </Field>
            <Field label="Due in days" error={errors.dueInDays?.message}>
              <Input type="number" {...form.register("dueInDays", { valueAsNumber: true })} />
            </Field>
            <div className="space-y-2">
              <Label>Counterparty grade</Label>
              <div className="grid grid-cols-3 gap-2">
                {grades.map((grade) => (
                  <Button
                    key={grade}
                    type="button"
                    variant={watchedInvoice.counterpartyGrade === grade ? "secondary" : "outline"}
                    onClick={() => form.setValue("counterpartyGrade", grade, { shouldValidate: true })}
                  >
                    {grade}
                  </Button>
                ))}
              </div>
            </div>
            <Field label="Invoice document" className="md:col-span-2">
              <Input
                type="file"
                accept="application/pdf"
                required
                onChange={(event) => setInvoiceFile(event.target.files?.[0] ?? null)}
              />
            </Field>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button type="submit" disabled={isWorking || !address || !invoiceFile}>
                <UploadCloud className="size-4" />
                Upload and mint on Sui
              </Button>
            </div>
          </form>
          {actionState.message ? (
            <Alert className="mt-4">
              <ReceiptText className="size-4" />
              <AlertTitle>
                {actionState.status === "error" ? "Action needed" : "Submission status"}
              </AlertTitle>
              <AlertDescription>{actionState.message}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Financing quote</CardTitle>
          <CardDescription>Terms committed to the invoice object at mint.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <QuoteRow label="Advance now" value={hasQuote ? formatCurrency(offer.advanceAmount) : "—"} />
          <QuoteRow label="Discount fee" value={hasQuote ? formatCurrency(offer.fee) : "—"} />
          <QuoteRow label="Advance rate" value={hasQuote ? formatBps(offer.advanceRateBps) : "—"} />
          <QuoteRow label="Expected APR" value={hasQuote ? formatBps(offer.expectedAprBps) : "—"} />
          <Separator />
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Risk score</span>
              <span className="font-medium">{hasQuote ? `${offer.riskScore}/100` : "—"}</span>
            </div>
            <Progress value={hasQuote ? offer.riskScore : 0} />
          </div>
          {selectedInvoice ? (
            <Alert>
              <ReceiptText className="size-4" />
              <AlertTitle>Selected invoice</AlertTitle>
              <AlertDescription>
                {selectedInvoice.id} is {selectedInvoice.status}, worth {formatCurrency(selectedInvoice.amount)}.
                {selectedInvoice.walrusUrl ? (
                  <>
                    {" "}
                    <a className="underline" href={selectedInvoice.walrusUrl} target="_blank" rel="noreferrer">
                      View Walrus blob
                    </a>
                  </>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : (
            <p className="text-sm text-muted-foreground">No on-chain invoice in this workspace.</p>
          )}
          {selectedInvoice?.status === "funded" ? (
            <div className="border-l-2 border-[#1fa977] bg-[#edf8f2] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Settlement repayment</p>
                  <p className="text-xl font-semibold">{formatCurrency(selectedRepaymentAmount)}</p>
                </div>
                {selectedRequiresLiveSettlement ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => repaymentCoinsQuery.refetch()}
                    disabled={!account || repaymentCoinsQuery.isFetching}
                    aria-label="Refresh repayment DUSDC coins"
                  >
                    <RefreshCw className={repaymentCoinsQuery.isFetching ? "size-4 animate-spin" : "size-4"} />
                  </Button>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Wallet balance {formatCurrency((repaymentCoinsQuery.data ?? []).reduce((sum, coin) => sum + coin.balance, 0))}. Coins are merged automatically.
              </p>
            </div>
          ) : null}
          <Button
            variant="secondary"
            className="w-full"
            disabled={isWorking || selectedInvoice?.status !== "funded" || !selectedRequiresLiveSettlement}
            onClick={handleSettleSelected}
          >
            <CheckCircle2 className="size-4" />
            Settle on Sui
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function LenderDesk({
  invoices,
  poolSnapshot,
  poolObjectId,
  selectedInvoiceId,
  onSelectInvoice,
}: {
  invoices: InvoicePosition[];
  poolSnapshot: PoolSnapshot | null;
  poolObjectId: string;
  selectedInvoiceId: string;
  onSelectInvoice: (invoiceId: string) => void;
}) {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const [fundState, setFundState] = useState<{
    status: "idle" | "working" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });
  const [depositCoinId, setDepositCoinId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const selectedInvoice = invoices.find((invoice) => invoice.objectId === selectedInvoiceId);
  const requiredPrincipal = selectedInvoice
    ? (selectedInvoice.amount * selectedInvoice.advanceRateBps) / 10_000
    : 0;
  const poolShortfall = Math.max(0, requiredPrincipal - (poolSnapshot?.balance ?? 0));
  const liveFundingBlocked = Boolean(selectedInvoice && poolSnapshot && poolShortfall > 0);
  const quoteCoinsQuery = useQuery({
    queryKey: ["quoteCoins", account?.address, FACTORFI_PLACEHOLDERS.quoteCoinType],
    queryFn: () => fetchOwnedQuoteCoins(client, account!.address),
    enabled: Boolean(account?.address),
    refetchInterval: 20_000,
  });

  async function handleDeposit() {
    try {
      if (!poolObjectId) {
        throw new Error("Create a lending pool before depositing.");
      }
      if (!depositCoinId.trim()) {
        throw new Error("Select a DUSDC coin before depositing.");
      }
      const amount = Number(depositAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a valid DUSDC deposit amount.");
      }
      const selectedCoin = quoteCoinsQuery.data?.find((coin) => coin.objectId === depositCoinId);
      if (!selectedCoin || selectedCoin.balance < amount) {
        throw new Error("The selected DUSDC coin does not cover that deposit amount.");
      }

      setFundState({ status: "working", message: "Requesting wallet signature for DUSDC deposit..." });
      const tx = buildDepositTransaction({
        poolObjectId,
        coinObjectId: depositCoinId.trim(),
        amount,
      });
      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

      if (result.FailedTransaction) {
        throw new Error(formatExecutionError(result.FailedTransaction.status.error, "Deposit transaction failed."));
      }

      setDepositCoinId("");
      setDepositAmount("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["quoteCoins"] }),
        queryClient.invalidateQueries({ queryKey: ["poolSnapshot"] }),
      ]);
      setFundState({
        status: "success",
        message: `DUSDC deposit submitted. Digest ${shortAddress(result.Transaction.digest)}.`,
      });
    } catch (error) {
      setFundState({
        status: "error",
        message: error instanceof Error ? error.message : "Deposit failed.",
      });
    }
  }

  async function handleFundSelected() {
    if (!selectedInvoice) return;

    try {
      if (
        !hasFactorFiDeployment() ||
        !poolObjectId
      ) {
        throw new Error("Create and fund a lending pool before financing invoices.");
      }
      if (!poolSnapshot || poolSnapshot.balance < requiredPrincipal) {
        setFundState({
          status: "error",
          message: `The pool needs ${formatCurrency(Math.max(0, requiredPrincipal - (poolSnapshot?.balance ?? 0)))} more DUSDC to fund this invoice.`,
        });
        return;
      }

      setFundState({ status: "working", message: "Requesting wallet signature for pool funding..." });
      const tx = buildFundInvoiceTransaction({
        poolObjectId,
        invoiceObjectId: selectedInvoice.objectId,
      });
      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
      if (result.FailedTransaction) {
        throw new Error(formatExecutionError(result.FailedTransaction.status.error, "Funding transaction failed."));
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["poolSnapshot"] }),
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["quoteCoins"] }),
      ]);
      setFundState({
        status: "success",
        message: `${selectedInvoice.id} funded on Sui. Digest ${shortAddress(result.Transaction.digest)}.`,
      });
    } catch (error) {
      setFundState({
        status: "error",
        message: error instanceof Error ? error.message : "Funding failed.",
      });
    }
  }

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Invoice market</CardTitle>
          <CardDescription>Listed Sui invoice objects available for DUSDC financing.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Debtor</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>APR</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.objectId} className={selectedInvoiceId === invoice.objectId ? "bg-[#eef2ff]" : undefined}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.debtor}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>{formatBps(invoice.expectedAprBps)}</TableCell>
                  <TableCell>
                    <StatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onSelectInvoice(invoice.objectId)}>
                      Inspect
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!invoices.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Mint an invoice from the borrower desk to open this market.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Pool operations</CardTitle>
          <CardDescription>Live DUSDC liquidity and invoice financing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {poolSnapshot ? (
            <div className="border-l-2 border-[#1fa977] bg-[#edf8f2] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Live pool balance</p>
                  <p className="text-2xl font-semibold">{formatCurrency(poolSnapshot.balance)}</p>
                </div>
                <a
                  className="inline-flex size-8 items-center justify-center rounded-md border hover:bg-muted"
                  href={explorerObjectUrl(poolSnapshot.objectId)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open pool in explorer"
                >
                  <ExternalLink className="size-4" />
                </a>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Deposited {formatCurrency(poolSnapshot.totalDeposited)}, funded {poolSnapshot.fundedCount} invoices.
              </p>
            </div>
          ) : null}
          {poolObjectId ? <div className="border bg-[#f8fafb] p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Label>DUSDC coin object</Label>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => quoteCoinsQuery.refetch()}
                disabled={!account || quoteCoinsQuery.isFetching}
                aria-label="Refresh DUSDC coins"
              >
                <RefreshCw className={quoteCoinsQuery.isFetching ? "size-4 animate-spin" : "size-4"} />
              </Button>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_100px_auto] gap-2">
              <Input
                value={depositCoinId}
                placeholder="Coin object"
                onChange={(event) => setDepositCoinId(event.target.value)}
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={depositAmount}
                placeholder="Amount"
                onChange={(event) => setDepositAmount(event.target.value)}
              />
              <Button
                variant="outline"
                disabled={fundState.status === "working"}
                onClick={handleDeposit}
              >
                Deposit
              </Button>
            </div>
            {account ? (
              <div className="mt-3 space-y-2">
                {quoteCoinsQuery.data?.length ? (
                  quoteCoinsQuery.data.map((coin) => (
                    <button
                      key={coin.objectId}
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-left text-xs hover:bg-muted"
                      onClick={() => setDepositCoinId(coin.objectId)}
                    >
                      <span className="truncate font-mono">{shortAddress(coin.objectId)}</span>
                      <span>{formatCurrency(coin.balance)}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {quoteCoinsQuery.isFetching
                      ? "Checking wallet for DUSDC..."
                      : "No DUSDC coin objects found. Request test tokens from DeepBook Predict."}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Connect a wallet to discover DUSDC coin objects.</p>
            )}
          </div> : (
            <p className="text-sm text-muted-foreground">Create a lending pool from the integration panel.</p>
          )}
          <Button
            className="w-full"
            disabled={
              fundState.status === "working" ||
              selectedInvoice?.status !== "listed" ||
              liveFundingBlocked
            }
            onClick={handleFundSelected}
          >
            <Banknote className="size-4" />
            {liveFundingBlocked ? "Insufficient pool liquidity" : "Fund selected invoice"}
          </Button>
          {fundState.message ? (
            <Alert>
              <Landmark className="size-4" />
              <AlertTitle>{fundState.status === "error" ? "Funding issue" : "Funding status"}</AlertTitle>
              <AlertDescription>{fundState.message}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function RiskDesk({ selectedInvoice }: { selectedInvoice?: InvoicePosition }) {
  const [predictState, setPredictState] = useState<{
    status: "idle" | "working" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  async function handleQueryPredict() {
    try {
      setPredictState({ status: "working", message: "Querying DeepBook Predict testnet server..." });
      const state = await fetchPredictState();
      setPredictState({
        status: "success",
        message: `${state.oracleCount} oracle entries, ${state.quoteAssetCount} quote asset entries, vault summary ${state.vaultSummaryAvailable ? "available" : "unavailable"}.`,
      });
    } catch (error) {
      setPredictState({
        status: "error",
        message: error instanceof Error ? error.message : "Predict query failed.",
      });
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>DeepBook Predict adapter</CardTitle>
          <CardDescription>Binary market framing for non-payment risk by due date.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {selectedInvoice ? (
            <>
              <RiskTile label="Invoice" value={selectedInvoice.id} />
              <RiskTile label="Advance rate" value={formatBps(selectedInvoice.advanceRateBps)} />
              <RiskTile label="Discount" value={formatBps(selectedInvoice.discountBps)} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground md:col-span-3">No on-chain invoice in this workspace.</p>
          )}
          <div className="md:col-span-3">
            <Alert>
              <Blocks className="size-4" />
              <AlertTitle>Predict package</AlertTitle>
              <AlertDescription className="break-all">
                {DEEPBOOK_PREDICT.predictPackage}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Settlement flow</CardTitle>
          <CardDescription>On-chain lifecycle checkpoints.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            "Walrus stores the invoice PDF and returns its blob ID",
            "Move mints invoice token with amount, due date, debtor hash, blob ID",
            "Pool transfers DUSDC advance to borrower",
            "Payment confirmation repays lenders principal plus fee",
          ].map((item) => (
            <div key={item} className="flex gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 text-[#1fa977]" />
              <span>{item}</span>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full"
            disabled={predictState.status === "working"}
            onClick={handleQueryPredict}
          >
            <ArrowUpRight className="size-4" />
            Query Predict markets
          </Button>
          {predictState.message ? (
            <Alert>
              <Blocks className="size-4" />
              <AlertTitle>{predictState.status === "error" ? "Predict issue" : "Predict status"}</AlertTitle>
              <AlertDescription>{predictState.message}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-2">{label}</Label>
      {children}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function QuoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: InvoicePosition["status"] }) {
  const className = status === "listed"
    ? "border-[#9cb4ff] bg-[#eef2ff] text-[#2447af]"
    : status === "funded"
      ? "border-[#efd78f] bg-[#fff8df] text-[#825d00]"
      : status === "settled"
        ? "border-[#9bd3b6] bg-[#edf8f2] text-[#176c49]"
        : "";
  return <Badge variant="outline" className={className}>{status}</Badge>;
}

function RiskTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-[#2457e6] bg-[#f5f7fb] p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function formatExecutionError(error: unknown, fallback: string) {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

function getCreatedObjectId(effects: unknown) {
  if (!effects || typeof effects !== "object") return null;
  const changedObjects = (effects as {
    changedObjects?: Array<{
      objectId?: string;
      idOperation?: string;
      outputState?: string;
    }>;
  }).changedObjects;

  return (
    changedObjects?.find(
      (object) =>
        object.idOperation === "Created" &&
        object.outputState === "ObjectWrite" &&
        typeof object.objectId === "string",
    )?.objectId ?? null
  );
}

function readStoredJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}
