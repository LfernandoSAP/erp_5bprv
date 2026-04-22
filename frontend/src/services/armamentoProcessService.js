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

export function getArmamentoProcessos(options = {}) {
  return apiFetch(
    `/logistica/armamento-processos/${buildQuery({
      q: options.search || "",
      unit_id: options.unitId,
      include_inactive: options.includeInactive ? "true" : "",
    })}`
  );
}

export function getArmamentoProcesso(processoId) {
  return apiFetch(`/logistica/armamento-processos/${processoId}`);
}

export function createArmamentoProcesso(payload) {
  return apiFetch("/logistica/armamento-processos/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateArmamentoProcesso(processoId, payload) {
  return apiFetch(`/logistica/armamento-processos/${processoId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
