import { apiFetch } from "./api";

export async function getItemMovements(unitId = null) {
  const params = new URLSearchParams();
  if (unitId) {
    params.set("unit_id", String(unitId));
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch(`/logistica/movements/${suffix}`);
}

export async function createItemMovement(payload) {
  return apiFetch("/logistica/movements/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
