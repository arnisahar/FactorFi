import { ReceiptText } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function BrandMark({
  compact = false,
  inverse = false,
  className,
}: {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <Link
      to="/"
      className={cn("inline-flex items-center gap-3", className)}
      aria-label="FactorFi home"
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center border",
          inverse ? "border-white/25 bg-white/10 text-white" : "border-primary/30 bg-primary text-primary-foreground",
        )}
      >
        <ReceiptText className="size-4" />
      </span>
      {!compact ? (
        <span className="leading-none">
          <span className={cn("block text-sm font-bold", inverse ? "text-white" : "text-foreground")}>FactorFi</span>
          <span className={cn("mt-1 block text-[11px]", inverse ? "text-white/60" : "text-muted-foreground")}>Receivables on Sui</span>
        </span>
      ) : null}
    </Link>
  );
}
