import { useEffect, useState } from "react";

// Divide uma lista em páginas. Volta para a primeira página quando `resetDeps` muda (filtros, busca).
export function usePagination<T>(items: T[], pageSize = 10, resetDeps: unknown[] = []) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  const start = (currentPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  const from = items.length === 0 ? 0 : start + 1;
  const to = Math.min(start + pageSize, items.length);

  return { pageItems, currentPage, setCurrentPage, pageCount, from, to };
}
