import { apiFetch } from "./api";

async function fetchPoliceOfficerPdf(officerId) {
  const response = await fetch(`/api/rh/policiais/${officerId}/exportar-pdf`, {
    credentials: "include",
  });

  if (!response.ok) {
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    throw new Error(data.detail || "Erro ao gerar o relatório PDF do policial");
  }

  const blob = await response.blob();
  const fileNameMatch = response.headers
    .get("content-disposition")
    ?.match(/filename="?([^"]+)"?/i);

  return {
    blob,
    fileName: fileNameMatch?.[1] || `policial_${officerId}.pdf`,
  };
}

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

export async function getPoliceOfficers(searchTerm = "", unitId = null, options = {}) {
  const suffix = buildQuery({
    q: searchTerm,
    unit_id: unitId,
    include_inactive: options.includeInactive ? "true" : "",
  });

  const data = await apiFetch(`/rh/police-officers/${suffix}`);
  return options.includeInactive ? data : data.filter((officer) => officer.is_active !== false);
}

export function getPoliceOfficer(officerId) {
  return apiFetch(`/rh/police-officers/${officerId}`);
}

export function getPoliceOfficerLinkedAssets(officerId) {
  return apiFetch(`/rh/police-officers/${officerId}/linked-assets`);
}

export function deletePoliceOfficer(officerId) {
  return apiFetch(`/rh/police-officers/${officerId}`, {
    method: "DELETE",
  });
}

export function restorePoliceOfficer(officerId) {
  return apiFetch(`/rh/police-officers/${officerId}/restore`, {
    method: "PUT",
  });
}

export function getPoliceOfficerMovements(unitId = null) {
  return apiFetch(
    `/rh/police-officers/movements/history${buildQuery({
      unit_id: unitId,
    })}`
  );
}

export async function movePoliceOfficer(officerId, payload) {
  return apiFetch(`/rh/police-officers/${officerId}/movements`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function exportPoliceOfficerPdf(officerId) {
  const { blob, fileName } = await fetchPoliceOfficerPdf(officerId);
  const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function previewPoliceOfficerPdf(officerId) {
  const { blob } = await fetchPoliceOfficerPdf(officerId);
  const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
  const previewWindow = window.open(url, "_blank", "noopener,noreferrer");

  if (!previewWindow) {
    window.URL.revokeObjectURL(url);
    throw new Error("O navegador bloqueou a abertura da ficha para impressão.");
  }

  window.setTimeout(() => {
    try {
      previewWindow.focus();
    } catch (error) {
      console.debug("Não foi possível focar a janela de visualização do PDF:", error);
    }
  }, 250);

  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 60000);
}
