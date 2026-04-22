export function buildReportSubtitle({
  totalRows,
  searchTerm,
  filterDescription,
  extraDetails = [],
}) {
  const details = [
    `${totalRows} registro(s) exportado(s)`,
    filterDescription ? sanitizeDetail(filterDescription) : "",
    searchTerm?.trim() ? `Busca: "${searchTerm.trim()}"` : "",
    ...extraDetails.map(sanitizeDetail),
  ].filter(Boolean);

  return details.join(" | ");
}

function sanitizeDetail(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
