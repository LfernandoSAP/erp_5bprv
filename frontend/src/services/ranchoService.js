import { apiFetch } from "./api";

function buildQuery(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === "" || value == null) {
      return;
    }
    params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function criarConfiguracao(dados) {
  return apiFetch("/logistica/rancho/", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function listarConfiguracoes(filtros = {}) {
  return apiFetch(`/logistica/rancho/${buildQuery(filtros)}`);
}

export function buscarConfiguracao(id) {
  return apiFetch(`/logistica/rancho/${id}`);
}

export function adicionarParticipante(id, dados) {
  return apiFetch(`/logistica/rancho/${id}/participantes`, {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function removerParticipante(id, participanteId) {
  return apiFetch(`/logistica/rancho/${id}/participantes/${participanteId}`, {
    method: "DELETE",
  });
}

export function salvarLancamento(id, dados) {
  return apiFetch(`/logistica/rancho/${id}/lancamentos`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

export function fecharConfiguracao(id) {
  return apiFetch(`/logistica/rancho/${id}/fechar`, {
    method: "PUT",
  });
}

export async function exportarExcel(id) {
  const response = await fetch(`/api/logistica/rancho/${id}/exportar-excel`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    let message = "Erro ao exportar Excel.";
    try {
      const body = await response.json();
      if (body?.detail) {
        message = String(body.detail);
      }
    } catch {
      // noop
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition") || "";
  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  const fileName = match?.[1] || `previsao_rancho_${id}.xlsx`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function buscarPM(re, unidadeId = null) {
  return apiFetch(`/logistica/rancho/buscar-pm${buildQuery({ re, unidade_id: unidadeId })}`);
}

export function buscarPoliciaisRancho(termo) {
  return apiFetch(`/policiais/buscar${buildQuery({ termo })}`);
}
