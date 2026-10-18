// Regra de status efetivo dos empréstimos.
//
// O status gravado na tabela só reflete o momento da retirada. Por isso o status
// exibido é calculado na consulta, com base na data atual e no prazo de devolução.
//
// Fuso do laboratório: Recife (UTC-3, sem horário de verão desde 2019).

const LOCAL_SHIFT = "-3 hours";

/**
 * Expressão SQL com o status efetivo de um empréstimo.
 *
 * - 'devolvido' permanece como está.
 * - 'atrasado' quando o prazo já passou.
 * - 'devolucao_hoje' quando o prazo cai hoje (dia em Recife).
 * - 'em_campo' nos demais casos.
 *
 * Formatos aceitos em due_date:
 * - 'AAAA-MM-DD': vence no fim desse dia em Recife.
 * - Com 'Z' ou offset (ex.: '2026-10-25T18:00:00Z'): vence no instante informado.
 * - Sem fuso (ex.: '2026-10-25T18:00:00'): considerado horário de Recife.
 */
export function effectiveLoanStatusSql(alias = "l"): string {
  const due = `${alias}.due_date`;
  const isDateOnly = `length(${due}) = 10`;
  const hasTimezone = `(${due} LIKE '%Z' OR substr(${due}, -6, 1) IN ('+', '-'))`;

  // Instante (UTC) em que o empréstimo vence
  const dueAtUtc = `(CASE
      WHEN ${isDateOnly} THEN datetime(${due}, '+1 day', '+3 hours')
      WHEN ${hasTimezone} THEN datetime(${due})
      ELSE datetime(${due}, '+3 hours')
    END)`;

  // Dia (em Recife) do vencimento
  const dueDayLocal = `(CASE
      WHEN ${isDateOnly} THEN date(${due})
      ELSE date(${dueAtUtc}, '${LOCAL_SHIFT}')
    END)`;

  return `(CASE
      WHEN ${alias}.status = 'devolvido' THEN 'devolvido'
      WHEN datetime('now') >= ${dueAtUtc} THEN 'atrasado'
      WHEN ${dueDayLocal} = date('now', '${LOCAL_SHIFT}') THEN 'devolucao_hoje'
      ELSE 'em_campo'
    END)`;
}

/** Condição SQL para empréstimos ainda não devolvidos (ativos ou atrasados). */
export const ACTIVE_LOAN_SQL = (alias = "l") => `${effectiveLoanStatusSql(alias)} <> 'devolvido'`;
