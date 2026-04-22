import { apiFetch } from "./api";

export async function getRomaneioMedidas(re = "me") {
  return apiFetch(`/romaneio/medidas/${re}`);
}

export async function searchPoliceOfficer(term) {
  const params = new URLSearchParams({ termo: term });
  return apiFetch(`/policiais/buscar?${params.toString()}`);
}

export async function createRomaneioMedidas(payload) {
  return apiFetch("/romaneio/medidas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRomaneioMedidas(re, payload) {
  return apiFetch(`/romaneio/medidas/${re}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
