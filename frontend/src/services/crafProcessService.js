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

export function getCrafProcessos(search = "", tipo = "") {
  return apiFetch(`/processos-armas/craf${buildQuery({ q: search, tipo })}`);
}

export function getCrafProcesso(processoId) {
  return apiFetch(`/processos-armas/craf/${processoId}`);
}

export function createCrafProcesso(payload) {
  return apiFetch("/processos-armas/craf/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCrafProcesso(processoId, payload) {
  return apiFetch(`/processos-armas/craf/${processoId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCrafProcesso(processoId) {
  return apiFetch(`/processos-armas/craf/${processoId}`, {
    method: "DELETE",
  });
}
