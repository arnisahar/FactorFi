import { useMemo, useState } from "react";
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
  ExternalLink,
  FileCheck2,
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
import { Textarea } from "@/components/ui/textarea";
import { calculateOffer, formatBps, formatCurrency, shortAddress } from "@/lib/finance";
import {
  DEEPBOOK_PREDICT,
  FACTORFI_PLACEHOLDERS,
  WALRUS,
  hasFactorFiDeployment,
} from "@/lib/protocol";
import {
  explorerObjectUrl,
  fetchOwnedQuoteCoins,
  fetchPoolSnapshot,
  type PoolSnapshot,
} from "@/lib/onchain";
import { fetchPredictState } from "@/lib/predict";
import {
  buildCreatePoolTransaction,
  buildDepositTransaction,
  buildFundInvoiceTransaction,
  buildListInvoiceTransaction,
  buildMintInvoiceTransaction,
  buildSettleInvoiceTransaction,
} from "@/lib/transactions";
import { createInvoicePdfBlob, uploadInvoiceToWalrus } from "@/lib/walrus";
import { useFactorFiStore } from "@/store/factorfi";
import type {
  CounterpartyGrade,
  DraftInvoice,
  InvoicePosition,
  LenderPosition,
} from "@/types/factorfi";

const invoiceSchema = z.object({
  debtor: z.string().min(3, "Enter the invoice debtor"),
  amount: z.number().min(1_000).max(2_000_000),
  dueInDays: z.number().int().min(7).max(180),
  counterpartyGrade: z.enum(["A", "B", "C"]),
  note: z.string().max(220),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const grades: CounterpartyGrade[] = ["A", "B", "C"];

function App() {
  const account = useCurrentAccount();
  const client = useCurrentClient();
  const [activeView, setActiveView] = useState<"borrower" | "lender" | "risk">(
    "borrower",
  );
  const {
    invoices,
    lenderPositions,
    selectedInvoiceId,
    submitInvoice,
    fundInvoice,
    settleInvoice,
    selectInvoice,
  } = useFactorFiStore();

  const selectedInvoice = invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? invoices[0];
  const listedInvoices = invoices.filter((invoice) => invoice.status === "listed");
  const fundedInvoices = invoices.filter((invoice) => invoice.status === "funded");
  const totalBook = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const demoAvailableLiquidity = 250_000 - lenderPositions.reduce((sum, item) => sum + item.principal, 0);
  const weightedApr = Math.round(
    invoices.reduce((sum, invoice) => sum + invoice.expectedAprBps, 0) / invoices.length,
  );
  const poolQuery = useQuery({
    queryKey: ["poolSnapshot", FACTORFI_PLACEHOLDERS.poolObjectId],
    queryFn: () => fetchPoolSnapshot(client),
    enabled: Boolean(FACTORFI_PLACEHOLDERS.poolObjectId),
    refetchInterval: 15_000,
  });
  const poolSnapshot = poolQuery.data;
  const availableLiquidity = poolSnapshot?.balance ?? demoAvailableLiquidity;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md border border-border bg-card">
              <ReceiptText className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">FactorFi</p>
              <p className="text-xs text-muted-foreground">Invoice financing on Sui</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden border-emerald-500/40 text-emerald-300 sm:inline-flex">
              Testnet ready
            </Badge>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-w-0 max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-4">
          <WalletPanel address={account?.address} />
          <Navigation activeView={activeView} setActiveView={setActiveView} />
          <IntegrationPanel />
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="grid min-w-0 gap-4 md:grid-cols-4">
            <MetricCard icon={CircleDollarSign} label="Invoice book" value={formatCurrency(totalBook)} detail={`${invoices.length} tokenized invoices`} />
            <MetricCard
              icon={Landmark}
              label="Liquidity"
              value={formatCurrency(availableLiquidity)}
              detail={poolSnapshot ? "DUSDC live pool" : "DUSDC demo pool"}
            />
            <MetricCard icon={Gauge} label="Blended APR" value={formatBps(weightedApr)} detail="Risk adjusted" />
            <MetricCard icon={ShieldCheck} label="Funded" value={fundedInvoices.length.toString()} detail={`${listedInvoices.length} open offers`} />
          </div>

          {activeView === "borrower" ? (
            <BorrowerDesk
              address={account?.address}
              selectedInvoice={selectedInvoice}
              submitInvoice={submitInvoice}
              settleInvoice={settleInvoice}
            />
          ) : null}

          {activeView === "lender" ? (
            <LenderDesk
              invoices={invoices}
              positions={lenderPositions}
              poolSnapshot={poolSnapshot ?? null}
              selectedInvoiceId={selectedInvoiceId}
              onSelectInvoice={selectInvoice}
              onFundInvoice={(invoiceId, lender) => fundInvoice(invoiceId, lender ?? account?.address)}
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
            <div className="flex items-center gap-2 text-emerald-300">
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
    <Card className="rounded-lg">
      <CardContent className="space-y-2 p-3">
        {items.map((item) => (
          <Button
            key={item.id}
            variant={activeView === item.id ? "secondary" : "ghost"}
            className="w-full justify-start"
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

function IntegrationPanel() {
  const dAppKit = useDAppKit();
  const [poolState, setPoolState] = useState<{
    status: "idle" | "working" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  async function handleCreatePool() {
    try {
      if (FACTORFI_PLACEHOLDERS.poolObjectId) {
        setPoolState({
          status: "success",
          message: `Pool already configured: ${shortAddress(FACTORFI_PLACEHOLDERS.poolObjectId)}.`,
        });
        return;
      }
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

      setPoolState({
        status: "success",
        message: `Pool creation submitted. Digest ${shortAddress(result.Transaction.digest)}.`,
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
        <CardDescription>Sui Overflow submission constants</CardDescription>
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
          value={FACTORFI_PLACEHOLDERS.poolObjectId || "Create after publish"}
        />
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          disabled={poolState.status === "working" || Boolean(FACTORFI_PLACEHOLDERS.poolObjectId)}
          onClick={handleCreatePool}
        >
          <Landmark className="size-4" />
          {FACTORFI_PLACEHOLDERS.poolObjectId ? "Pool configured" : "Create lending pool"}
        </Button>
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
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
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
    <Card className="rounded-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className="size-4 text-emerald-400" />
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function BorrowerDesk({
  address,
  selectedInvoice,
  submitInvoice,
  settleInvoice,
}: {
  address?: string;
  selectedInvoice: InvoicePosition;
  submitInvoice: (invoice: DraftInvoice, walletAddress?: string) => InvoicePosition;
  settleInvoice: (invoiceId: string) => void;
}) {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [repaymentCoinId, setRepaymentCoinId] = useState("");
  const [actionState, setActionState] = useState<{
    status: "idle" | "working" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      debtor: "Atlas Retail Group",
      amount: 62500,
      dueInDays: 75,
      counterpartyGrade: "B",
      note: "Net 75 invoice backed by signed purchase order and delivery receipt.",
    },
  });
  const watchedInvoice = form.watch();
  const offer = useMemo(() => calculateOffer(watchedInvoice), [watchedInvoice]);
  const errors = form.formState.errors;
  const isWorking = actionState.status === "working";
  const selectedHasRealObject = Boolean(
    selectedInvoice.objectId.startsWith("0x") && !selectedInvoice.objectId.includes("..."),
  );
  const selectedRequiresLiveSettlement =
    selectedInvoice.status === "funded" &&
    selectedHasRealObject &&
    hasFactorFiDeployment() &&
    Boolean(FACTORFI_PLACEHOLDERS.poolObjectId);
  const selectedRepaymentAmount =
    (selectedInvoice.amount * (selectedInvoice.advanceRateBps + selectedInvoice.discountBps)) / 10_000;
  const repaymentCoinsQuery = useQuery({
    queryKey: ["quoteCoins", account?.address, FACTORFI_PLACEHOLDERS.quoteCoinType, "repayment"],
    queryFn: () => fetchOwnedQuoteCoins(client, account!.address),
    enabled: Boolean(account?.address) && selectedRequiresLiveSettlement,
    refetchInterval: 20_000,
  });

  async function uploadCurrentInvoice(values: InvoiceFormValues) {
    const file =
      invoiceFile ??
      createInvoicePdfBlob(
        [
          `Debtor: ${values.debtor}`,
          `Amount: ${values.amount}`,
          `Due in days: ${values.dueInDays}`,
          `Grade: ${values.counterpartyGrade}`,
          `Note: ${values.note}`,
        ].join("\n"),
      );

    return uploadInvoiceToWalrus(file);
  }

  const handleDemoMint = form.handleSubmit((values) => {
    const invoice = submitInvoice(values, address);
    setActionState({
      status: "success",
      message: `Created ${invoice.id} in local demo mode.`,
    });
  });

  const handleWalrusUpload = form.handleSubmit(async (values) => {
    try {
      setActionState({ status: "working", message: "Uploading invoice document to Walrus..." });
      const upload = await uploadCurrentInvoice(values);
      const invoice = submitInvoice(
        {
          ...values,
          walrusBlobId: upload.blobId,
          walrusUrl: upload.url,
          objectId: upload.objectId,
        },
        address,
      );
      setActionState({
        status: "success",
        message: `${invoice.id} is listed with Walrus blob ${shortAddress(upload.blobId)}.`,
      });
    } catch (error) {
      setActionState({
        status: "error",
        message: error instanceof Error ? error.message : "Walrus upload failed.",
      });
    }
  });

  const handleSuiMint = form.handleSubmit(async (values) => {
    try {
      if (!address) {
        throw new Error("Connect a Sui wallet before minting on-chain.");
      }
      if (!hasFactorFiDeployment()) {
        throw new Error("Move package is not deployed yet. Using local demo mode until testnet gas is available.");
      }

      setActionState({ status: "working", message: "Uploading invoice document to Walrus..." });
      const upload = await uploadCurrentInvoice(values);
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
      let listDigest: string | undefined;

      if (invoiceObjectId !== result.Transaction.digest) {
        setActionState({ status: "working", message: "Listing minted invoice object on Sui..." });
        const listResult = await dAppKit.signAndExecuteTransaction({
          transaction: buildListInvoiceTransaction(invoiceObjectId),
        });

        if (listResult.FailedTransaction) {
          throw new Error(formatExecutionError(listResult.FailedTransaction.status.error, "Invoice list transaction failed."));
        }

        listDigest = listResult.Transaction.digest;
      }

      const invoice = submitInvoice(
        {
          ...values,
          walrusBlobId: upload.blobId,
          walrusUrl: upload.url,
          txDigest: result.Transaction.digest,
          objectId: invoiceObjectId,
        },
        address,
      );

      setActionState({
        status: "success",
        message: `${invoice.id} minted${listDigest ? " and listed" : ""} on Sui. Digest ${shortAddress(result.Transaction.digest)}.`,
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
      if (!selectedRequiresLiveSettlement) {
        settleInvoice(selectedInvoice.id);
        setActionState({
          status: "success",
          message: `${selectedInvoice.id} settled in local demo mode.`,
        });
        return;
      }
      if (!address || address !== selectedInvoice.borrower) {
        throw new Error("Connect the original borrower wallet to settle this invoice on Sui.");
      }
      if (!repaymentCoinId.trim()) {
        throw new Error("Paste a DUSDC repayment coin object ID before settling on-chain.");
      }

      setActionState({ status: "working", message: "Requesting wallet signature for invoice settlement..." });
      const result = await dAppKit.signAndExecuteTransaction({
        transaction: buildSettleInvoiceTransaction({
          poolObjectId: FACTORFI_PLACEHOLDERS.poolObjectId,
          invoiceObjectId: selectedInvoice.objectId,
          repaymentCoinObjectId: repaymentCoinId.trim(),
        }),
      });

      if (result.FailedTransaction) {
        throw new Error(formatExecutionError(result.FailedTransaction.status.error, "Settlement transaction failed."));
      }

      settleInvoice(selectedInvoice.id);
      setRepaymentCoinId("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["quoteCoins"] }),
        queryClient.invalidateQueries({ queryKey: ["poolSnapshot"] }),
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
        <CardHeader>
          <CardTitle>Submit invoice</CardTitle>
          <CardDescription>Upload PDF to Walrus, mint invoice object, list the financing offer.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={handleDemoMint}
          >
            <Field label="Debtor" error={errors.debtor?.message}>
              <Input {...form.register("debtor")} />
            </Field>
            <Field label="Face value" error={errors.amount?.message}>
              <Input type="number" step="500" {...form.register("amount", { valueAsNumber: true })} />
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
            <Field label="Verification note" error={errors.note?.message} className="md:col-span-2">
              <Textarea rows={4} {...form.register("note")} />
            </Field>
            <Field label="Invoice document" className="md:col-span-2">
              <Input
                type="file"
                accept="application/pdf,image/*,.txt"
                onChange={(event) => setInvoiceFile(event.target.files?.[0] ?? null)}
              />
            </Field>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button type="submit" disabled={isWorking}>
                <FileCheck2 className="size-4" />
                Mint demo invoice
              </Button>
              <Button type="button" variant="outline" disabled={isWorking} onClick={handleWalrusUpload}>
                <UploadCloud className="size-4" />
                Upload PDF to Walrus
              </Button>
              <Button type="button" variant="secondary" disabled={isWorking} onClick={handleSuiMint}>
                <Blocks className="size-4" />
                Mint on Sui
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
          <CardDescription>Deterministic pricing model for the demo pool.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <QuoteRow label="Advance now" value={formatCurrency(offer.advanceAmount)} />
          <QuoteRow label="Discount fee" value={formatCurrency(offer.fee)} />
          <QuoteRow label="Advance rate" value={formatBps(offer.advanceRateBps)} />
          <QuoteRow label="Expected APR" value={formatBps(offer.expectedAprBps)} />
          <Separator />
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Risk score</span>
              <span className="font-medium">{offer.riskScore}/100</span>
            </div>
            <Progress value={offer.riskScore} />
          </div>
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
          {selectedInvoice.status === "funded" ? (
            <div className="rounded-lg border p-3">
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
              {selectedRequiresLiveSettlement ? (
                <div className="mt-3 space-y-2">
                  <Label>Repayment DUSDC coin object</Label>
                  <Input
                    value={repaymentCoinId}
                    placeholder="0x..."
                    onChange={(event) => setRepaymentCoinId(event.target.value)}
                  />
                  {repaymentCoinsQuery.data?.length ? (
                    <div className="space-y-2">
                      {repaymentCoinsQuery.data.map((coin) => (
                        <button
                          key={coin.objectId}
                          type="button"
                          className="flex w-full items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-left text-xs hover:bg-muted"
                          onClick={() => setRepaymentCoinId(coin.objectId)}
                        >
                          <span className="truncate font-mono">{shortAddress(coin.objectId)}</span>
                          <span>{formatCurrency(coin.balance)}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {repaymentCoinsQuery.isFetching
                        ? "Checking wallet for DUSDC..."
                        : "No repayment coin found in the connected wallet."}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">Demo invoice settlement updates local state.</p>
              )}
            </div>
          ) : null}
          <Button
            variant="secondary"
            className="w-full"
            disabled={isWorking || selectedInvoice.status !== "funded"}
            onClick={handleSettleSelected}
          >
            <CheckCircle2 className="size-4" />
            {selectedRequiresLiveSettlement ? "Settle on Sui" : "Mark paid and settle"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function LenderDesk({
  invoices,
  positions,
  poolSnapshot,
  selectedInvoiceId,
  onSelectInvoice,
  onFundInvoice,
}: {
  invoices: InvoicePosition[];
  positions: LenderPosition[];
  poolSnapshot: PoolSnapshot | null;
  selectedInvoiceId: string;
  onSelectInvoice: (invoiceId: string) => void;
  onFundInvoice: (invoiceId: string, lender?: string) => void;
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
  const selectedInvoice = invoices.find((invoice) => invoice.id === selectedInvoiceId);
  const selectedHasRealObject = Boolean(
    selectedInvoice?.objectId.startsWith("0x") && !selectedInvoice.objectId.includes("..."),
  );
  const liveFundingBlocked = selectedHasRealObject && Boolean(poolSnapshot) && poolSnapshot!.balance <= 0;
  const quoteCoinsQuery = useQuery({
    queryKey: ["quoteCoins", account?.address, FACTORFI_PLACEHOLDERS.quoteCoinType],
    queryFn: () => fetchOwnedQuoteCoins(client, account!.address),
    enabled: Boolean(account?.address),
    refetchInterval: 20_000,
  });

  async function handleDeposit() {
    try {
      if (!FACTORFI_PLACEHOLDERS.poolObjectId) {
        throw new Error("Pool object ID is not configured.");
      }
      if (!depositCoinId.trim()) {
        throw new Error("Paste a DUSDC coin object ID before depositing.");
      }

      setFundState({ status: "working", message: "Requesting wallet signature for DUSDC deposit..." });
      const tx = buildDepositTransaction({
        poolObjectId: FACTORFI_PLACEHOLDERS.poolObjectId,
        coinObjectId: depositCoinId.trim(),
      });
      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

      if (result.FailedTransaction) {
        throw new Error(formatExecutionError(result.FailedTransaction.status.error, "Deposit transaction failed."));
      }

      setDepositCoinId("");
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
        !FACTORFI_PLACEHOLDERS.poolObjectId ||
        !selectedHasRealObject
      ) {
        onFundInvoice(selectedInvoice.id, account?.address);
        setFundState({
          status: "success",
          message: `${selectedInvoice.id} funded in local demo mode. Publish and seed the pool to execute this on-chain.`,
        });
        return;
      }
      if (!poolSnapshot || poolSnapshot.balance <= 0) {
        setFundState({
          status: "error",
          message: "The live DUSDC pool is empty. Deposit a DUSDC coin object before funding on-chain invoices.",
        });
        return;
      }

      setFundState({ status: "working", message: "Requesting wallet signature for pool funding..." });
      const tx = buildFundInvoiceTransaction({
        poolObjectId: FACTORFI_PLACEHOLDERS.poolObjectId,
        invoiceObjectId: selectedInvoice.objectId,
      });
      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
      if (result.FailedTransaction) {
        throw new Error(formatExecutionError(result.FailedTransaction.status.error, "Funding transaction failed."));
      }

      onFundInvoice(selectedInvoice.id, account?.address);
      await queryClient.invalidateQueries({ queryKey: ["poolSnapshot"] });
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
                <TableRow key={invoice.id} className={selectedInvoiceId === invoice.id ? "bg-muted/40" : undefined}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.debtor}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>{formatBps(invoice.expectedAprBps)}</TableCell>
                  <TableCell>
                    <StatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onSelectInvoice(invoice.id)}>
                      Inspect
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Lender positions</CardTitle>
          <CardDescription>Expected principal plus fee from funded receivables.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {poolSnapshot ? (
            <div className="rounded-lg border p-3">
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
          <div className="rounded-lg border p-3">
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
            <div className="flex gap-2">
              <Input
                value={depositCoinId}
                placeholder="0x..."
                onChange={(event) => setDepositCoinId(event.target.value)}
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
          </div>
          {positions.map((position) => (
            <div key={`${position.lender}-${position.invoiceId}`} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{position.invoiceId}</p>
                <Badge variant="secondary">{formatBps(position.exposureBps)}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatCurrency(position.principal)} principal, {formatCurrency(position.expectedReturn)} expected return
              </p>
            </div>
          ))}
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
            {liveFundingBlocked ? "Deposit DUSDC first" : "Fund selected invoice"}
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

function RiskDesk({ selectedInvoice }: { selectedInvoice: InvoicePosition }) {
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
          <RiskTile label="Question" value={`Will ${selectedInvoice.id} pay by day ${selectedInvoice.dueInDays}?`} />
          <RiskTile label="Risk score" value={`${selectedInvoice.riskScore}/100`} />
          <RiskTile label="Oracle source" value="Predict testnet server" />
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
          <CardDescription>On-chain actions to complete before submission.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            "Walrus stores encrypted invoice PDF and returns blob ID",
            "Move mints invoice token with amount, due date, debtor hash, blob ID",
            "Pool transfers DUSDC advance to borrower",
            "Payment confirmation repays lenders principal plus fee",
          ].map((item) => (
            <div key={item} className="flex gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 text-emerald-400" />
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
  const variant = status === "listed" ? "outline" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

function RiskTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
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

export default App;
