export const downloadCsv = (filename: string, rows: Array<Array<string | number>>): void => {
  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value);
          const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
          return `"${safeText.replace(/"/g, '""')}"`;
        })
        .join(";"),
    )
    .join("\r\n");
  const file = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
