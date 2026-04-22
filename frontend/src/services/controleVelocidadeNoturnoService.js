import { apiFetch } from "./api";

function buildParams(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === "" || value == null) {
      return;
    }
    params.set(key, String(value));
  });
  return params.toString() ? `?${params.toString()}` : "";
}

export async function getControlesVelocidadeNoturno(filters = {}) {
  return apiFetch(`/estatistica/controle-velocidade-noturno/${buildParams(filters)}`);
}

export async function getResumoControlesVelocidadeNoturno(filters = {}) {
  return apiFetch(`/estatistica/controle-velocidade-noturno/resumo${buildParams(filters)}`);
}

export async function createControleVelocidadeNoturno(payload) {
  return apiFetch("/estatistica/controle-velocidade-noturno/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteControleVelocidadeNoturno(registroId) {
  return apiFetch(`/estatistica/controle-velocidade-noturno/${registroId}`, {
    method: "DELETE",
  });
}
