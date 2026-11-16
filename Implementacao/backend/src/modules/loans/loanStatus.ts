// Regra de status efetivo dos empréstimos, compatível com PostgreSQL.
// due_date permanece TEXT para preservar os formatos já usados pelo sistema.
// Fuso do laboratório: Recife (America/Recife).

export function effectiveLoanStatusSql(alias = "l"): string {
  const due = `${alias}.due_date`;
  const isDateOnly = `length(${due}) = 10`;
  const hasTimezone = `${due} ~ '(Z|[+-][0-9]{2}:[0-9]{2})$'`;

  // Converte todos os formatos para timestamptz:
  // - AAAA-MM-DD: vence no fim do dia local (Recife);
  // - ISO com Z/offset: respeita o fuso informado;
  // - ISO sem fuso: interpreta como horário local de Recife.
  const dueAt = `(CASE
    WHEN ${isDateOnly} THEN ((${due}::date + INTERVAL '1 day' + INTERVAL '3 hours') AT TIME ZONE 'UTC')
    WHEN ${hasTimezone} THEN ${due}::timestamptz
    ELSE ((${due}::timestamp + INTERVAL '3 hours') AT TIME ZONE 'UTC')
  END)`;
  const dueDayLocal = `((${dueAt} AT TIME ZONE 'America/Recife')::date)`;

  return `(CASE
    WHEN ${alias}.status = 'devolvido' THEN 'devolvido'
    WHEN CURRENT_TIMESTAMP >= ${dueAt} THEN 'atrasado'
    WHEN ${dueDayLocal} = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Recife')::date THEN 'devolucao_hoje'
    ELSE 'em_campo'
  END)`;
}

/** Condição SQL para empréstimos ainda não devolvidos (ativos ou atrasados). */
export const ACTIVE_LOAN_SQL = (alias = "l") => `${effectiveLoanStatusSql(alias)} <> 'devolvido'`;
