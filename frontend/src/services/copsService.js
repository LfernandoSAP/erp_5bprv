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

export function getCops(filters = {}) {
  return apiFetch(
    `/cops/${buildQuery({
      q: filters.q,
      unit_id: filters.unitId,
      status: filters.status,
      holder: filters.holder,
      policial: filters.policial,
    })}`
  );
}

export function getCopById(copId) {
  return apiFetch(`/cops/${copId}`);
}

export function createCop(payload) {
  return apiFetch("/cops/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCop(copId, payload) {
  return apiFetch(`/cops/${copId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCop(copId) {
  return apiFetch(`/cops/${copId}`, {
    method: "DELETE",
  });
}

export function getCopMovements(copId) {
  return apiFetch(`/cops/${copId}/movimentacoes`);
}

export function moveCop(copId, payload) {
  return apiFetch(`/cops/${copId}/movimentar`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
