import {
  ArrowRight,
  Blocks,
  Database,
  FileCheck2,
  Landmark,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { BrandMark } from "@/components/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const workflow = [
  {
    number: "01",
    title: "Anchor the invoice",
    description:
      "Upload the signed PDF to Walrus and retain its verifiable blob ID.",
    icon: Database,
  },
  {
    number: "02",
    title: "Mint the receivable",
    description:
      "Create a shared Sui object with amount, maturity, borrower, and financing terms.",
    icon: ReceiptText,
  },
  {
    number: "03",
    title: "Advance liquidity",
    description:
      "Fund the invoice from a live DUSDC pool and transfer proceeds to the borrower.",
    icon: Landmark,
  },
  {
    number: "04",
    title: "Settle principal + fee",
    description:
      "Repay the pool on-chain and close the invoice lifecycle with an immutable event.",
    icon: FileCheck2,
  },
];

const primitives = [
  {
    label: "Sui",
    title: "Object-native lifecycle",
    description:
      "Shared invoice objects make receivables programmable and independently verifiable.",
    icon: Blocks,
  },
  {
    label: "Walrus",
    title: "Document backbone",
    description:
      "The invoice document stays addressable through its blob ID without bloating on-chain state.",
    icon: Database,
  },
  {
    label: "DeepBook Predict",
    title: "Market-aware risk",
    description:
      "Live testnet connectivity establishes a path from binary payment outcomes to dynamic pricing.",
    icon: ShieldCheck,
  },
];

export function LandingPage() {
  return (
    <div className="landing-page min-h-screen bg-background text-foreground">
      <header className="absolute inset-x-0 top-0 z-30 border-b border-white/15">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
          <BrandMark inverse />
          <div className="flex items-center gap-2">
            <a
              href="/factorfi-demo-invoice.pdf"
              className="hidden px-3 py-2 text-sm font-semibold text-white/75 transition-colors hover:text-white sm:inline-flex"
              download
            >
              Demo invoice
            </a>
            <Link
              to="/app"
              className={cn(
                buttonVariants(),
                "h-10 bg-white px-4 text-slate-950 hover:bg-white/90",
              )}
            >
              Open app
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero relative isolate min-h-[86svh] overflow-hidden bg-[#111d35] text-white">
          {/* <img
            src="/demo-invoice-preview.png"
            alt="FactorFi demo invoice showing a five DUSDC receivable"
            className="absolute inset-0 h-full w-full object-cover object-top opacity-20 sm:inset-y-0 sm:left-auto sm:right-[-8%] sm:w-[62%] sm:opacity-45 lg:right-[-2%] lg:w-[54%] lg:opacity-70"
          /> */}
          <div
            className="absolute inset-0 bg-[#111d35]/35"
            aria-hidden="true"
          />
          <div className="relative mx-auto flex min-h-[86svh] max-w-7xl items-end px-5 pb-14 pt-32 sm:px-8 sm:pb-18 lg:items-center lg:pb-8">
            <div className="max-w-3xl lg:max-w-2xl">
              <h1 className="font-heading text-6xl font-semibold leading-[0.92] sm:text-7xl lg:text-8xl">
                FactorFi
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
                Turn verified receivables into immediate DUSDC liquidity.
                Documents live on Walrus, financing terms live in shared Sui
                objects, and settlement stays transparent.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/app"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 bg-[#2d63f3] px-6 text-white hover:bg-[#1f50d6]",
                  )}
                >
                  Launch workspace
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href="/factorfi-demo-invoice.pdf"
                  download
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "h-12 border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white",
                  )}
                >
                  Download invoice
                </a>
              </div>
            </div>
          </div>
          <div className="relative border-t border-white/15 bg-[#111d35]/85">
            <div className="mx-auto grid max-w-7xl divide-y divide-white/12 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8">
              {[
                ["01", "Shared invoice objects"],
                ["02", "Walrus-backed documents"],
                ["03", "DUSDC pool settlement"],
              ].map(([number, label]) => (
                <div
                  key={number}
                  className="flex items-center gap-4 py-4 sm:px-5 sm:first:pl-0"
                >
                  <span className="font-mono text-xs text-[#68d9a0]">
                    {number}
                  </span>
                  <span className="text-sm font-semibold text-white/75">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b bg-[#f6f7f4] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase text-[#2457e6]">
                  From terms to settlement
                </p>
                <h2 className="mt-3 max-w-lg font-heading text-4xl font-semibold leading-tight text-[#172033] sm:text-5xl">
                  One receivable. Four verifiable steps.
                </h2>
              </div>
              <p className="max-w-xl text-base leading-7 text-[#596273] lg:justify-self-end">
                FactorFi keeps the document, asset, liquidity, and repayment
                lifecycle connected without forcing the full invoice onto the
                chain.
              </p>
            </div>

            <div className="mt-14 grid border-y border-[#ccd3dc] md:grid-cols-2 xl:grid-cols-4">
              {workflow.map((item, index) => (
                <article
                  key={item.number}
                  className="relative border-b border-[#ccd3dc] px-0 py-8 md:px-7 md:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:first:pl-0 xl:last:border-r-0 xl:last:pr-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-[#7b8492]">
                      {item.number}
                    </span>
                    <item.icon className="size-5 text-[#2457e6]" />
                  </div>
                  <h3 className="mt-8 text-lg font-bold text-[#172033]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#667085]">
                    {item.description}
                  </p>
                  {index === workflow.length - 1 ? (
                    <span className="absolute bottom-0 left-0 h-1 w-16 bg-[#1fa977]" />
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase text-[#1fa977]">
                Built from real primitives
              </p>
              <h2 className="mt-3 font-heading text-4xl font-semibold leading-tight text-[#172033] sm:text-5xl">
                Infrastructure judges can inspect.
              </h2>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden border border-[#d8dde4] bg-[#d8dde4] lg:grid-cols-3">
              {primitives.map((item) => (
                <article
                  key={item.label}
                  className="min-h-64 bg-white p-7 sm:p-9"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-[#2457e6]">
                      {item.label}
                    </span>
                    <item.icon className="size-5 text-[#172033]" />
                  </div>
                  <h3 className="mt-14 text-xl font-bold text-[#172033]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#667085]">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#1d2c4a] bg-[#16233d] py-16 text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-[#68d9a0]">
                Testnet workspace ready
              </p>
              <h2 className="mt-3 max-w-2xl font-heading text-4xl font-semibold leading-tight sm:text-5xl">
                Finance the invoice, not another crypto position.
              </h2>
            </div>
            <Link
              to="/app"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 shrink-0 bg-white px-6 text-[#172033] hover:bg-white/90",
              )}
            >
              Open FactorFi
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-[#f6f7f4]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <BrandMark />
          <p className="text-xs text-[#7b8492]">
            Sui testnet · Walrus · DeepBook Predict
          </p>
        </div>
      </footer>
    </div>
  );
}
