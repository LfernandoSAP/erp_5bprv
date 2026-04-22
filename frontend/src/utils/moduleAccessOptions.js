import { formatSectorLabel } from "./sectorOptions";

export function buildModuleAccessOptions(sectors, unitId) {
  if (!unitId) {
    return [];
  }

  const seen = new Set();

  return sectors
    .filter(
      (sector) =>
        String(sector.unit_id) === String(unitId) &&
        sector.code &&
        !seen.has(sector.code) &&
        seen.add(sector.code)
    )
    .map((sector) => ({
      code: sector.code,
      label: formatSectorLabel(sector),
    }));
}

export function formatModuleAccessCodes(codes, sectors) {
  const options = buildModuleAccessOptions(sectors, sectors[0]?.unit_id);
  const labelMap = Object.fromEntries(options.map((option) => [option.code, option.label]));

  return (codes || []).map((code) => labelMap[code] || code);
}
