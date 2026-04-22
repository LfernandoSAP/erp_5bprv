export function buildWelcomeMessage(displayName, unitLabel) {
  const resolvedName = displayName || "usuário";
  const resolvedUnit = unitLabel || "";

  if (resolvedUnit === "5BPRv-EM") {
    return `Olá, ${resolvedName} do EM do 5BPRv, seja bem-vindo ao ERP 5BPRv`;
  }

  if (resolvedUnit.startsWith("5BPRv-")) {
    return `Olá, ${resolvedName} do ${resolvedUnit}, seja bem-vindo ao ERP 5BPRv`;
  }

  if (resolvedUnit) {
    return `Olá, ${resolvedName} da ${resolvedUnit}, seja bem-vindo ao ERP 5BPRv`;
  }

  return `Olá, ${resolvedName}, seja bem-vindo ao ERP 5BPRv`;
}
