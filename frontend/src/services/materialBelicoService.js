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

export function getMaterialBelicoList({ category = "", unitId = null } = {}) {
  return apiFetch(
    `/logistica/material-belico/${buildQuery({
      category,
      unit_id: unitId,
    })}`
  );
}

export function getMaterialBelicoControleGeral({ unitId = null } = {}) {
  return apiFetch(
    `/logistica/material-belico/controle-geral/${buildQuery({
      unit_id: unitId,
    })}`
  );
}

export function createMaterialBelicoControleGeral(payload) {
  return apiFetch("/logistica/material-belico/controle-geral/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMaterialBelicoById(itemId) {
  return apiFetch(`/logistica/material-belico/${itemId}`);
}

export function createMaterialBelico(payload) {
  return apiFetch("/logistica/material-belico/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMaterialBelico(itemId, payload) {
  return apiFetch(`/logistica/material-belico/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getMaterialBelicoTransferHistory(itemId) {
  return apiFetch(`/logistica/material-belico/${itemId}/transfer-history`);
}

export function transferMaterialBelico(itemId, payload) {
  return apiFetch(`/logistica/material-belico/${itemId}/transfer`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function moveMaterialBelico(itemId, payload) {
  return apiFetch(`/logistica/material-belico/${itemId}/movements`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMaterialBelicoMovements({ unitId = null } = {}) {
  return apiFetch(
    `/logistica/material-belico/movements/history${buildQuery({
      unit_id: unitId,
    })}`
  );
}
