import { apiFetch } from "./api";

export async function getItems(includeInactive = false, unitId = null) {
  const params = new URLSearchParams();
  if (includeInactive) {
    params.set("include_inactive", "true");
  }
  if (unitId) {
    params.set("unit_id", String(unitId));
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch(`/logistica/items/${suffix}`);
}

export async function searchItems(query, unitId = null) {
  const params = new URLSearchParams();
  params.set("q", query);
  if (unitId) {
    params.set("unit_id", String(unitId));
  }
  return apiFetch(`/logistica/items/search?${params.toString()}`);
}

export async function getItemById(itemId) {
  return apiFetch(`/logistica/items/${itemId}`);
}

export async function createItem(payload) {
  return apiFetch("/logistica/items/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateItem(itemId, payload) {
  return apiFetch(`/logistica/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteItem(itemId) {
  return apiFetch(`/logistica/items/${itemId}`, {
    method: "DELETE",
  });
}

export async function restoreItem(itemId) {
  return apiFetch(`/logistica/items/${itemId}/restore`, {
    method: "PUT",
  });
}
