import { apiFetch } from "./api";

function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return;
    }
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function getApafProcessos(search = "") {
  return apiFetch(`/processos-armas/apaf/${buildQuery({ q: search })}`);
}

export function getApafProcesso(processoId) {
  return apiFetch(`/processos-armas/apaf/${processoId}`);
}

export function createApafProcesso(payload) {
  return apiFetch("/processos-armas/apaf/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateApafProcesso(processoId, payload) {
  return apiFetch(`/processos-armas/apaf/${processoId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteApafProcesso(processoId) {
  return apiFetch(`/processos-armas/apaf/${processoId}`, {
    method: "DELETE",
  });
}
