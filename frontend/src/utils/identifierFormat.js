export function normalizeUpperIdentifier(value, maxLength = null) {
  const normalized = String(value || "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trimStart();

  return maxLength ? normalized.slice(0, maxLength) : normalized;
}

export function maskPlate(value) {
  const normalized = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const letters = normalized.replace(/[^A-Z]/g, "").slice(0, 3);
  const rest = normalized.slice(letters.length).replace(/[^A-Z0-9]/g, "").slice(0, 4);

  if (letters.length === 3 && rest.length > 0) {
    return `${letters}-${rest}`;
  }

  return `${letters}${rest}`.slice(0, 8);
}

export function formatIdentifier(value) {
  return normalizeUpperIdentifier(value) || "-";
}
