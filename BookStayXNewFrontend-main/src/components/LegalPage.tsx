import { Link } from "@tanstack/react-router";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { AppTopNav } from "@/components/AppTopNav";

export function LegalPage({
  title,
  accent,
  subtitle,
  Icon,
  sections,
}: {
  title: string;
  accent?: string;
  subtitle: string;
  Icon: LucideIcon;
  sections: Array<{ heading: string; body: string }>;
}) {
  return (
    <div className="min-h-screen bg-[#050709] pb-8">
      <AppTopNav />

      <div className="px-4 pt-2">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Back to home"
            className="press grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-[#12161C] text-white"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <div className="min-w-0">
            <h1 className="font-display text-[24px] font-semibold leading-tight text-white">
              {title}{" "}
              {accent ? <span className="text-[#E0B84A]">{accent}</span> : null}
            </h1>
            <p className="mt-0.5 text-[12.5px] text-[#8B93A0]">{subtitle}</p>
          </div>
        </div>

        <div className="mt-5 rounded-[20px] border border-[#E0B84A]/30 bg-[#12100C] px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-[#E0B84A]/40 bg-[#E0B84A]/10 text-[#E0B84A]">
              <Icon className="h-5 w-5" strokeWidth={1.7} />
            </span>
            <p className="text-[12.5px] leading-snug text-[#C9CDD4]">
              Last updated: 21 Aug 2026 · BookStayX
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {sections.map((s) => (
            <section
              key={s.heading}
              className="rounded-[18px] border border-white/[0.06] bg-[#12161C] px-4 py-4"
            >
              <h2 className="text-[15px] font-semibold text-[#E0B84A]">{s.heading}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[#C9CDD4]">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
