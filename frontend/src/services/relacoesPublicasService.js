import { apiFetch } from "./api";

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === "" || value == null) {
      return;
    }
    query.set(key, String(value));
  });
  const suffix = query.toString();
  return suffix ? `?${suffix}` : "";
}

export function getWeeklyBirthdays(filters = {}) {
  return apiFetch(`/relacoes_publicas/aniversariantes/semana${buildQuery(filters)}`);
}

export function getMonthlyBirthdays(filters = {}) {
  return apiFetch(`/relacoes_publicas/aniversariantes/mes${buildQuery(filters)}`);
}

export function getUpcomingBirthdays(filters = {}) {
  return apiFetch(`/relacoes_publicas/aniversariantes/proximos${buildQuery(filters)}`);
}
