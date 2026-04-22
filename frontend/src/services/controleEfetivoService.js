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

export function getControleEfetivo(params = {}) {
  return apiFetch(`/controle-efetivo/${buildQuery(params)}`);
}

export function getControleEfetivoById(registroId) {
  return apiFetch(`/controle-efetivo/${registroId}`);
}

export function getControleEfetivoByRe(reDc) {
  return apiFetch(`/controle-efetivo/re/${encodeURIComponent(reDc)}`);
}

export function createControleEfetivo(payload) {
  return apiFetch("/controle-efetivo/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateControleEfetivo(registroId, payload) {
  return apiFetch(`/controle-efetivo/${registroId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteControleEfetivo(registroId) {
  return apiFetch(`/controle-efetivo/${registroId}`, {
    method: "DELETE",
  });
}
