import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginatorProps {
  total: number;
  page: number;
  pageSize: number;
  onChange: (page: number) => void;
}

const Paginator = ({ total, page, pageSize, onChange }: PaginatorProps) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total === 0) return null;

  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="flex items-center justify-between mt-5 px-1">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Prev
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="text-white/30 text-xs px-1">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={`w-7 h-7 text-xs rounded-lg font-medium transition-all ${
                page === p
                  ? "bg-[#F59E0B] text-black"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
              }`}
            >
              {p}
            </button>
          ),
        )}
      </div>

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        Next <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default Paginator;
