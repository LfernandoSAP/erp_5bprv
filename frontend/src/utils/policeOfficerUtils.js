export function formatServiceTime(admissionDate, options = {}) {
  const { emptyLabel = "-" } = options;

  if (!admissionDate) {
    return emptyLabel;
  }

  const start = new Date(`${admissionDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) {
    return emptyLabel;
  }

  const today = new Date();
  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  let days = today.getDate() - start.getDate();

  if (days < 0) {
    const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += previousMonth.getDate();
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  if (years < 0) {
    return emptyLabel;
  }

  return `${years} ano(s), ${months} mes(es) e ${days} dia(s)`;
}

export function buildServiceTimeMessage(admissionDate) {
  const formatted = formatServiceTime(admissionDate, { emptyLabel: "" });
  return formatted
    ? `O policial possui ${formatted} de serviço.`
    : "O tempo de serviço será calculado após informar a data de admissão.";
}
