import { useId, useState } from "react";

// Números de página exibidos, com reticências nos saltos: 1 … n-2 n-1 n n+1 n+2 … total.
// Quando só falta uma página entre dois números, ela aparece no lugar da reticência.
export const buildPageItems = (current: number, total: number): (number | "…")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set<number>([1, total, current - 2, current - 1, current, current + 1, current + 2]);
  const visible = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  const items: (number | "…")[] = [];
  visible.forEach((page, index) => {
    const previous = visible[index - 1];
    if (previous !== undefined) {
      const gap = page - previous;
      if (gap === 2) items.push(previous + 1);
      else if (gap > 2) items.push("…");
    }
    items.push(page);
  });
  return items;
};

interface PaginationProps {
  current: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ current, total, onPageChange }: PaginationProps): JSX.Element => {
  const [pageInput, setPageInput] = useState("");
  const inputId = useId();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        aria-label="Página anterior"
        disabled={current === 1}
        onClick={() => onPageChange(Math.max(1, current - 1))}
        className="px-3 py-2 rounded hover:bg-[#f7f0f0] disabled:opacity-40"
      >←</button>
      {buildPageItems(current, total).map((item, index) =>
        item === "…" ? (
          <span key={`gap-${index}`} className="px-3 py-2 text-[#7a6e70]">…</span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            aria-current={item === current ? "page" : undefined}
            className={`px-3 py-2 rounded font-semibold ${
              item === current ? "bg-[#8B1329] text-white" : "hover:bg-[#f7f0f0]"
            }`}
          >
            {item}
          </button>
        ),
      )}
      <button
        aria-label="Próxima página"
        disabled={current === total}
        onClick={() => onPageChange(Math.min(total, current + 1))}
        className="px-3 py-2 rounded hover:bg-[#f7f0f0] disabled:opacity-40"
      >→</button>
      <form
        className="ml-2 flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (pageInput.trim() === "") return;
          const requested = Math.round(Number(pageInput));
          if (!Number.isFinite(requested)) return;
          // Fora do intervalo, vai para a primeira ou a última página
          onPageChange(Math.min(total, Math.max(1, requested)));
          setPageInput("");
        }}
      >
        <label htmlFor={inputId} className="text-xs">Ir para a página</label>
        <input
          id={inputId}
          type="number"
          min={1}
          max={total}
          value={pageInput}
          onChange={(event) => setPageInput(event.target.value)}
          placeholder={String(current)}
          className="w-20 rounded border border-[#efe6e6] px-2 py-1 text-sm"
        />
        <button type="submit" className="rounded px-3 py-1 font-semibold text-[#8B1329] hover:bg-[#f7f0f0]">
          Ir
        </button>
      </form>
    </div>
  );
};
