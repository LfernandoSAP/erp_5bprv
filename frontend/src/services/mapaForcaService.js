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

export async function getMapaForca(filters = {}) {
  return apiFetch(`/mapa-forca/${buildParams(filters)}`);
}

export async function getMapaForcaById(mapaId) {
  return apiFetch(`/mapa-forca/${mapaId}`);
}

export async function getMapaForcaResumo(filters = {}) {
  return apiFetch(`/mapa-forca/resumo${buildParams(filters)}`);
}

export async function buscarViaturasMapaForca(prefixo) {
  return apiFetch(`/mapa-forca/buscar-viatura?prefixo=${encodeURIComponent(prefixo)}`);
}

export async function createMapaForca(payload) {
  return apiFetch("/mapa-forca/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMapaForca(mapaId, payload) {
  return apiFetch(`/mapa-forca/${mapaId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getMapaForcaExportExcel(filters = {}) {
  return apiFetch(`/mapa-forca/exportar-excel${buildParams(filters)}`);
}

export async function getMapaForcaExportPdf(filters = {}) {
  return apiFetch(`/mapa-forca/exportar-pdf${buildParams(filters)}`);
}
