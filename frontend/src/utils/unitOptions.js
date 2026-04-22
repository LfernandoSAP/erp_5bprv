export function buildHierarchicalUnitOptions(units) {
  const byParent = new Map();
  const byId = new Map();

  units.forEach((unit) => {
    byId.set(unit.id, unit);
    const parentId = unit.parent_unit_id ?? null;
    if (!byParent.has(parentId)) {
      byParent.set(parentId, []);
    }
    byParent.get(parentId).push(unit);
  });

  for (const siblings of byParent.values()) {
    siblings.sort(compareUnits);
  }

  const options = [];

  function visit(unit, level) {
    options.push({
      id: unit.id,
      label: formatUnitLabel(unit, level, byId),
      unit,
    });

    const children = byParent.get(unit.id) || [];
    children.forEach((child) => visit(child, level + 1));
  }

  const roots = byParent.get(null) || [];
  roots.forEach((root) => visit(root, 0));

  return options;
}

export function buildHierarchicalUnitLabelMap(units) {
  const options = buildHierarchicalUnitOptions(units);
  const map = {};

  options.forEach((option) => {
    map[option.id] = option.label;
  });

  return map;
}

function compareUnits(a, b) {
  const typeOrder = {
    batalhao: 1,
    cia: 2,
    pelotao: 3,
  };

  const byType = (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
  if (byType !== 0) {
    return byType;
  }

  return a.name.localeCompare(b.name, "pt-BR", {
    numeric: true,
    sensitivity: "base",
  });
}

function formatUnitLabel(unit, level, byId) {
  if (level === 0) {
    return unit.name;
  }

  if (unit.type === "pelotao") {
    const parent = byId.get(unit.parent_unit_id);
    return `${unit.name} da ${parent?.name || "unidade"}`;
  }

  return unit.name;
}
