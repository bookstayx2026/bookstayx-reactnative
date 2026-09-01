import type { LucideIcon } from "lucide-react";
import { AppTopNav } from "@/components/AppTopNav";

export function PlaceholderPage({
  Icon,
  headline,
  body,
}: {
  title: string;
  Icon: LucideIcon;
  headline: string;
  body: string;
}) {
  return (
    <div className="pb-6">
      <AppTopNav />

      <div className="px-5 pt-10 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/35 bg-[#0d1014]">
          <Icon className="h-7 w-7 text-gold" strokeWidth={1.3} />
        </span>
        <h2 className="mt-5 font-display text-[28px] font-semibold text-ink">{headline}</h2>
        <p className="mx-auto mt-2 max-w-[19rem] text-[13px] leading-[1.65] text-ink-soft">{body}</p>
      </div>
    </div>
  );
}
