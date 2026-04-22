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

export function getLpRegistros(params = {}) {
  return apiFetch(`/lp/${buildQuery(params)}`);
}

export function getLpRegistroById(registroId) {
  return apiFetch(`/lp/${registroId}`);
}

export function getLpRegistroByRe(reDc) {
  return apiFetch(`/lp/re/${encodeURIComponent(reDc)}`);
}

export function createLpRegistro(payload) {
  return apiFetch("/lp/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateLpRegistro(registroId, payload) {
  return apiFetch(`/lp/${registroId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteLpRegistro(registroId) {
  return apiFetch(`/lp/${registroId}`, {
    method: "DELETE",
  });
}
