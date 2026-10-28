const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_OR_DATETIME =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;

// Aceita AAAA-MM-DD ou data/hora ISO 8601 com fuso opcional.
export function isValidDateInput(value: unknown): value is string {
  return typeof value === "string" && ISO_DATE_OR_DATETIME.test(value) && !Number.isNaN(Date.parse(value));
}

// Filtro "até": quando a data é só AAAA-MM-DD, inclui o dia inteiro,
// comparando com o início do dia seguinte. Datas com hora seguem o comparador normal.
export function upperBoundClause(column: string, to: string): { sql: string; value: string } {
  if (!DATE_ONLY.test(to)) {
    return { sql: `${column} <= ?`, value: to };
  }

  const next = new Date(`${to}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return { sql: `${column} < ?`, value: next.toISOString().slice(0, 10) };
}
