export function getLogisticaCustodyValidationMessage(
  entityLabel,
  custodyType,
  sectorId,
  policeOfficerId,
  fleetVehicleId
) {
  if (custodyType === "POLICIAL" && !policeOfficerId) {
    return `Selecione o policial respons\u00e1vel para salvar ${entityLabel} em cautela individual.`;
  }

  if (custodyType === "SETOR" && !sectorId) {
    return `Selecione o setor respons\u00e1vel para salvar ${entityLabel} com responsabilidade setorial.`;
  }

  if (custodyType === "VIATURA" && !fleetVehicleId) {
    return `Selecione a viatura vinculada para salvar ${entityLabel} com responsabilidade de viatura.`;
  }

  return "";
}
