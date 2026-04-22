import { apiFetch } from "./api";

export async function getFleetVehicles({
  includeInactive = false,
  category = "",
  search = "",
  unitId = null,
  groupCode = "",
  telemetry = "",
} = {}) {
  const params = new URLSearchParams();
  if (includeInactive) {
    params.set("include_inactive", "true");
  }
  if (category) {
    params.set("category", category);
  }
  if (search) {
    params.set("q", search);
  }
  if (unitId) {
    params.set("unit_id", String(unitId));
  }
  if (groupCode) {
    params.set("group_code", groupCode);
  }
  if (telemetry) {
    params.set("telemetry", telemetry);
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch(`/logistica/fleet/vehicles/${suffix}`);
}

export async function createFleetVehicle(payload) {
  return apiFetch("/logistica/fleet/vehicles/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getFleetVehicleById(vehicleId) {
  return apiFetch(`/logistica/fleet/vehicles/${vehicleId}`);
}

export async function getFleetVehicleMovements(unitId = null) {
  const params = new URLSearchParams();
  if (unitId) {
    params.set("unit_id", String(unitId));
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch(`/logistica/fleet/vehicles/movements/history${suffix}`);
}

export async function updateFleetVehicle(vehicleId, payload) {
  return apiFetch(`/logistica/fleet/vehicles/${vehicleId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function moveFleetVehicle(vehicleId, payload) {
  return apiFetch(`/logistica/fleet/vehicles/${vehicleId}/movements`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteFleetVehicle(vehicleId) {
  return apiFetch(`/logistica/fleet/vehicles/${vehicleId}`, {
    method: "DELETE",
  });
}

export async function restoreFleetVehicle(vehicleId) {
  return apiFetch(`/logistica/fleet/vehicles/${vehicleId}/restore`, {
    method: "PUT",
  });
}

export async function getResponsibilityVehicles(unitId = null) {
  const categories = ["VIATURA_04_RODAS", "MOTOCICLETA"];
  const responses = await Promise.all(
    categories.map((category) =>
      getFleetVehicles({
        includeInactive: false,
        category,
        unitId,
      })
    )
  );

  return responses
    .flat()
    .sort((first, second) => {
      const firstLabel = `${first.prefix || ""} ${first.plate || ""} ${first.brand || ""} ${first.model || ""}`.trim();
      const secondLabel = `${second.prefix || ""} ${second.plate || ""} ${second.brand || ""} ${second.model || ""}`.trim();
      return firstLabel.localeCompare(secondLabel, "pt-BR");
    });
}
