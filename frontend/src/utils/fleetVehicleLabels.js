export function buildFleetVehicleLabel(vehicle) {
  if (!vehicle) {
    return "Viatura não informada";
  }

  const primary =
    vehicle.prefix ||
    vehicle.plate ||
    [vehicle.brand, vehicle.model].filter(Boolean).join(" - ");

  return primary || "Viatura sem identificacao";
}

export function buildFleetVehicleOptionLabel(vehicle) {
  const primary = buildFleetVehicleLabel(vehicle);
  const meta = [vehicle.category === "MOTOCICLETA" ? "Motocicleta" : "Viatura", vehicle.unit_label || vehicle.unit_name]
    .filter(Boolean)
    .join(" | ");

  return meta ? `${primary} | ${meta}` : primary;
}
