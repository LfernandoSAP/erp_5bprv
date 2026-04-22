export const sectorOptions = {
  P1: "P1 - Recursos Humanos",
  P2: "P2 - Inteligência",
  P3: "P3 - Estatística",
  P4: "P4 - Logística/Frota",
  P5: "P5 - Relações Públicas",
  UGE_CONVENIOS: "UGE - Convênios/Financeiro",
  PJMD: "PJMD - Justiça e Disciplina",
  STCOR: "StCor - Sala de Operações",
  PDR: "Sala de Rádio - PDR",
  TELEMATICA: "Telemática - Setor de Tecnologia e Telecomunicações",
};

function normalizeLabelPart(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function formatSectorLabel(sector) {
  if (!sector) {
    return "-";
  }

  const code = String(sector.code || "").trim();
  const name = String(sector.name || "").trim();
  const canonicalLabel = code ? String(sectorOptions[code] || "").trim() : "";

  if (!code) {
    return name || "-";
  }

  if (!name) {
    return canonicalLabel || code;
  }

  const normalizedName = normalizeLabelPart(name);
  const normalizedCodePrefix = normalizeLabelPart(`${code} -`);
  const normalizedCanonical = normalizeLabelPart(canonicalLabel);

  if (
    normalizedName.startsWith(normalizedCodePrefix) ||
    (normalizedCanonical && normalizedName === normalizedCanonical)
  ) {
    return name;
  }

  return `${code} - ${name}`;
}

export function buildSectorLabelMap(sectors = []) {
  return new Map(
    sectors.map((sector) => [sector.id, formatSectorLabel(sector)])
  );
}
