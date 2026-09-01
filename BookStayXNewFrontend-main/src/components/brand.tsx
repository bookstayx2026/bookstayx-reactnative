import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logoImg from "@/assets/bookstayx-logo.png";
import { cn } from "@/lib/utils";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="press flex shrink-0 items-center" aria-label="BookStayX home">
      <img
        src={logoImg}
        alt="BookStayX"
        className={cn(
          "h-auto w-auto object-contain object-left",
          /* Wide lockup: keep header height tight, width capped for mobile chrome */
          compact ? "max-h-[36px] max-w-[172px]" : "max-h-[42px] max-w-[200px]",
        )}
      />
    </Link>
  );
}

export function IconButton({
  children,
  label,
  onClick,
  badge,
  size = "md",
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  badge?: number;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "press relative grid shrink-0 place-items-center rounded-full border border-white/12 bg-white/[0.06] text-ink-soft backdrop-blur-md",
        "hover:border-gold/40 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
        size === "md" ? "h-11 w-11" : "h-9 w-9",
      )}
    >
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] font-bold text-[#101215]">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-center text-[10.5px] font-semibold uppercase tracking-[0.28em] text-gold">{children}</p>
  );
}

export function SerifTitle({
  lead,
  accent,
  className,
}: {
  lead: string;
  accent?: string;
  className?: string;
}) {
  return (
    <h2 className={cn("font-display text-[30px] font-semibold leading-[1.15] text-ink", className)}>
      {lead}{" "}
      {accent ? <span className="italic text-gold">{accent}</span> : null}
    </h2>
  );
}
