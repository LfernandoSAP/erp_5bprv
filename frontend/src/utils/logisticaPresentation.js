import { buildCustodySummary } from "./custodyLabels";

export function getLogisticaCustodyHeadline(mode) {
  return mode === "edit" ? "Resumo da edição:" : "Resumo do cadastro:";
}

export function getLogisticaCustodySummaryText({
  custodyType,
  custodySectorName,
  policeOfficer,
  fleetVehicleLabel,
  location,
}) {
  const summary = buildCustodySummary({
    custodyType,
    custodySectorName,
    policeOfficer,
    fleetVehicleLabel,
  });

  return `${summary}${location ? ` | Local: ${location}` : " | Local ainda não informado"}`;
}

export function getLogisticaCustodySavedAsText(params) {
  return `Será salvo como: ${getLogisticaCustodySummaryText({ ...params, location: "" }).replace(
    " | Local ainda não informado",
    ""
  )}`;
}

export function getLogisticaSectorHint(mode, custodyType) {
  if (custodyType === "SETOR") {
    return "Use quando o bem passar a ficar vinculado a um setor específico.";
  }

  return mode === "edit"
    ? "Ative a responsabilidade por setor para definir um setor responsável."
    : "Ative a responsabilidade por setor para selecionar uma seção responsável.";
}

export function getLogisticaPoliceHint(mode, custodyType) {
  if (custodyType === "POLICIAL") {
    return mode === "edit"
      ? "Atualize quando o bem passar a ficar cautelado a um policial específico."
      : "Use quando o material estiver cautelado ou vinculado diretamente a um policial.";
  }

  return mode === "edit"
    ? "Ative a responsabilidade por policial para cautela individual."
    : "Ative a responsabilidade por policial para associar o bem a uma pessoa.";
}

export function getLogisticaVehicleHint(mode, custodyType) {
  if (custodyType === "VIATURA") {
    return mode === "edit"
      ? "Atualize quando o bem passar a ficar vinculado a uma viatura ou motocicleta."
      : "Use quando o material estiver vinculado a uma viatura ou motocicleta da frota.";
  }

  return "Ative a responsabilidade por viatura para associar o material a um veículo da frota.";
}
