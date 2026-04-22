import { apiFetch } from "./api";

function onlyActive(records) {
  return records.filter((record) => record.is_active !== false);
}

export async function getUnits(options = {}) {
  const { activeOnly = true } = options;
  const data = await apiFetch("/rh/units/");
  return activeOnly ? onlyActive(data) : data;
}

export async function getSectors(options = {}) {
  const {
    activeOnly = true,
    includeInactive = false,
    query = "",
  } = options;

  const params = new URLSearchParams();
  if (includeInactive) {
    params.set("include_inactive", "true");
  }
  if (query.trim()) {
    params.set("q", query.trim());
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const data = await apiFetch(`/rh/sectors/${suffix}`);
  return activeOnly ? onlyActive(data) : data;
}

export async function getUnitTreeRoot() {
  return apiFetch("/rh/units/tree/root");
}
