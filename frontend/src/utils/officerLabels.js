export function getOfficerDisplayName(officer) {
  if (!officer) {
    return "";
  }

  return officer.war_name || officer.full_name || officer.nome || "";
}

export function buildOfficerOptionLabel(officer) {
  if (!officer) {
    return "";
  }

  const re = officer.re_with_digit || officer.assigned_officer_re || officer.police_officer_re || officer.re || "";
  const name =
    getOfficerDisplayName(officer) ||
    officer.assigned_officer_name ||
    officer.police_officer_name ||
    "";

  return [re, name].filter(Boolean).join(" - ");
}

export function buildOfficerSummary(officer) {
  return buildOfficerOptionLabel(officer) || "Não informado";
}

function normalizeLookupValue(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function findOfficerByLookup(officers, lookupValue) {
  const normalizedValue = normalizeLookupValue(lookupValue);
  const normalizedDigits = normalizeDigits(lookupValue);

  if (!normalizedValue && !normalizedDigits) {
    return null;
  }

  return (
    officers.find((officer) => {
      const optionLabel = normalizeLookupValue(buildOfficerOptionLabel(officer));
      const displayName = normalizeLookupValue(getOfficerDisplayName(officer));
      const officerRe = normalizeLookupValue(
        officer.re_with_digit ||
          officer.assigned_officer_re ||
          officer.police_officer_re ||
          officer.re
      );
      const officerDigits = normalizeDigits(
        officer.re_with_digit ||
          officer.assigned_officer_re ||
          officer.police_officer_re ||
          officer.re
      );

      return (
        (normalizedValue && optionLabel === normalizedValue) ||
        (normalizedValue && optionLabel.includes(normalizedValue)) ||
        (normalizedValue && displayName.includes(normalizedValue)) ||
        (normalizedValue && officerRe === normalizedValue) ||
        (normalizedDigits && officerDigits.includes(normalizedDigits)) ||
        (normalizedDigits && officerDigits === normalizedDigits)
      );
    }) || null
  );
}
