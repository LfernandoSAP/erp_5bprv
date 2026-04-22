import { apiFetch } from "./api";

function buildQuery(params = {}) {
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

export function buscarPorPolicial(policialId) {
  return apiFetch(`/rh/quinquenio/${policialId}`);
}

export function registrarBloco(policialId, dados) {
  const payload = {
    ...dados,
    data_concessao_real: dados?.data_concessao_real || null,
  };
  return apiFetch(`/rh/quinquenio/${policialId}/blocos`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function atualizarBloco(blocoId, dados) {
  const payload = {
    ...dados,
    data_concessao_real: dados?.data_concessao_real || null,
  };
  return apiFetch(`/rh/quinquenio/blocos/${blocoId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function salvarPeriodo(blocoId, dados) {
  return apiFetch(`/rh/quinquenio/blocos/${blocoId}/periodos`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

export function registrarInterrupcao(policialId, dados) {
  return apiFetch(`/rh/quinquenio/${policialId}/interrupcoes`, {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function removerInterrupcao(interrupcaoId) {
  return apiFetch(`/rh/quinquenio/interrupcoes/${interrupcaoId}`, {
    method: "DELETE",
  });
}

export function buscarTimeline(policialId) {
  return apiFetch(`/rh/quinquenio/${policialId}/timeline`);
}

export function buscarPoliciaisQuinquenio(termo) {
  return apiFetch(`/policiais/buscar${buildQuery({ termo })}`);
}
