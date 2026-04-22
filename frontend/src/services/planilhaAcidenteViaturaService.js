import { apiFetch } from "./api";

function buildParams(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === "" || value == null) return;
    params.set(key, String(value));
  });
  return params.toString() ? `?${params.toString()}` : "";
}

export function listarPlanilhaAcidenteViatura(filters = {}) {
  return apiFetch(`/estatistica/planilha-acidente-viaturas/${buildParams(filters)}`);
}

export function criarPlanilhaAcidenteViatura(payload) {
  return apiFetch("/estatistica/planilha-acidente-viaturas/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function atualizarPlanilhaAcidenteViatura(id, payload) {
  return apiFetch(`/estatistica/planilha-acidente-viaturas/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function excluirPlanilhaAcidenteViatura(id) {
  return apiFetch(`/estatistica/planilha-acidente-viaturas/${id}`, {
    method: "DELETE",
  });
}

export function buscarPoliciaisAcidenteViatura(termo) {
  return apiFetch(`/policiais/buscar${buildParams({ termo })}`);
}
