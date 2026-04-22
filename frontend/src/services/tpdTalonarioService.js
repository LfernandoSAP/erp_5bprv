import { apiFetch } from "./api";

export async function getTpdTalonarios(includeInactive = false, unitId = null) {
  const params = new URLSearchParams();
  if (includeInactive) {
    params.set("include_inactive", "true");
  }
  if (unitId) {
    params.set("unit_id", String(unitId));
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch(`/logistica/tpd-talonario/${suffix}`);
}

export async function searchTpdTalonarios(query, unitId = null) {
  const params = new URLSearchParams();
  params.set("q", query);
  if (unitId) {
    params.set("unit_id", String(unitId));
  }
  return apiFetch(`/logistica/tpd-talonario/search?${params.toString()}`);
}

export async function getTpdTalonarioById(itemId) {
  return apiFetch(`/logistica/tpd-talonario/${itemId}`);
}

export async function createTpdTalonario(payload) {
  return apiFetch("/logistica/tpd-talonario/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTpdTalonario(itemId, payload) {
  return apiFetch(`/logistica/tpd-talonario/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteTpdTalonario(itemId) {
  return apiFetch(`/logistica/tpd-talonario/${itemId}`, {
    method: "DELETE",
  });
}

export async function restoreTpdTalonario(itemId) {
  return apiFetch(`/logistica/tpd-talonario/${itemId}/restore`, {
    method: "PUT",
  });
}
