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

export function getLsvRegistros(params = {}) {
  return apiFetch(`/lsv/${buildQuery(params)}`);
}

export function getLsvRegistroById(registroId) {
  return apiFetch(`/lsv/${registroId}`);
}

export function getLsvRegistroByRe(reDc) {
  return apiFetch(`/lsv/re/${encodeURIComponent(reDc)}`);
}

export function createLsvRegistro(payload) {
  return apiFetch("/lsv/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateLsvRegistro(registroId, payload) {
  return apiFetch(`/lsv/${registroId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteLsvRegistro(registroId) {
  return apiFetch(`/lsv/${registroId}`, {
    method: "DELETE",
  });
}
