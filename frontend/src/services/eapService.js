import { apiFetch } from "./api";

function buildParams(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === "" || value == null) return;
    params.set(key, String(value));
  });
  return params.toString() ? `?${params.toString()}` : "";
}

export function listarEapModulos(filters = {}) {
  return apiFetch(`/estatistica/eap/modules${buildParams(filters)}`);
}

export function obterEapModulo(id) {
  return apiFetch(`/estatistica/eap/modules/${id}`);
}

export function criarEapModulo(payload) {
  return apiFetch("/estatistica/eap/modules", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function atualizarEapModulo(id, payload) {
  return apiFetch(`/estatistica/eap/modules/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function excluirEapModulo(id) {
  return apiFetch(`/estatistica/eap/modules/${id}`, {
    method: "DELETE",
  });
}

export function incluirParticipanteEap(moduloId, payload) {
  return apiFetch(`/estatistica/eap/modules/${moduloId}/participantes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function removerParticipanteEap(moduloId, participanteId) {
  return apiFetch(`/estatistica/eap/modules/${moduloId}/participantes/${participanteId}`, {
    method: "DELETE",
  });
}

export function buscarPoliciaisEap(termo) {
  return apiFetch(`/policiais/buscar${buildParams({ termo })}`);
}
