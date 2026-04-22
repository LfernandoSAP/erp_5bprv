import { buildOfficerSummary } from "./officerLabels";

export function formatCustodyTypeLabel(custodyType) {
  const labels = {
    POLICIAL: "Policial",
    SETOR: "Setor",
    RESERVA_UNIDADE: "Reserva da unidade",
    VIATURA: "Viatura",
  };

  return labels[custodyType] || "Responsabilidade não informada";
}

export function buildCustodySummary({
  custodyType,
  custodySectorName,
  policeOfficer,
  policeOfficerRe,
  policeOfficerName,
  fleetVehicleLabel,
}) {
  if (custodyType === "POLICIAL") {
    if (policeOfficer) {
      return buildOfficerSummary(policeOfficer);
    }

    if (policeOfficerRe || policeOfficerName) {
      return [policeOfficerRe, policeOfficerName].filter(Boolean).join(" - ");
    }

    return "Policial não informado";
  }

  if (custodyType === "SETOR") {
    return custodySectorName ? `Setor - ${custodySectorName}` : "Setor não informado";
  }

  if (custodyType === "VIATURA") {
    return fleetVehicleLabel ? `Viatura - ${fleetVehicleLabel}` : "Viatura não informada";
  }

  return "Reserva da unidade";
}
