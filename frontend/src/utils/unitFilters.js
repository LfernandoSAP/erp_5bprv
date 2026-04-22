export function buildUnitFilterOptions(units, viewerAccess) {
  const byParent = new Map();
  for (const unit of units) {
    const parentId = unit.parent_unit_id ?? unit.parent_id ?? null;
    if (!byParent.has(parentId)) {
      byParent.set(parentId, []);
    }
    byParent.get(parentId).push(unit);
  }

  const descendants = [];
  const collect = (parentId) => {
    const children = byParent.get(parentId) || [];
    for (const child of children) {
      descendants.push(child);
      collect(child.id);
    }
  };

  if (viewerAccess.canViewAll || !viewerAccess.unitId) {
    return units;
  }

  if (viewerAccess.unitType === "batalhao" || viewerAccess.unitType === "cia") {
    const rootUnit = units.find((unit) => String(unit.id) === String(viewerAccess.unitId));
    if (!rootUnit) {
      return [];
    }
    descendants.push(rootUnit);
    collect(rootUnit.id);
    if (viewerAccess.unitType === "batalhao") {
      return descendants.filter((unit) => unit.type === "cia");
    }
    return descendants.filter((unit) => String(unit.id) !== String(viewerAccess.unitId));
  }

  return units.filter((unit) => String(unit.id) === String(viewerAccess.unitId));
}

export function buildUnitFilterDescription({
  selectedUnitFilter,
  units,
  unitMap,
  viewerAccess,
}) {
  if (selectedUnitFilter === "ALL_VISIBLE") {
    return "A busca considera todas as unidades visíveis dentro do seu escopo.";
  }

  if (selectedUnitFilter === "SELF") {
    return `A busca considera somente a sua unidade: ${viewerAccess.unitLabel || "unidade atual"}.`;
  }

  const selectedUnit = units.find((unit) => String(unit.id) === String(selectedUnitFilter));
  if (!selectedUnit) {
    return "Selecione uma unidade para restringir a busca.";
  }

  if (selectedUnit.type === "cia") {
    return `A busca considera ${selectedUnit.name} e os pelotões subordinados.`;
  }

  return `A busca considera somente ${unitMap[selectedUnit.id] ?? selectedUnit.name}.`;
}

export function resolveEffectiveUnitFilter(selectedUnitFilter, viewerUnitId) {
  if (selectedUnitFilter === "SELF") {
    return viewerUnitId;
  }
  if (selectedUnitFilter === "ALL_VISIBLE") {
    return null;
  }
  return selectedUnitFilter || null;
}
