function readStoredViewerAccess() {
  const raw = sessionStorage.getItem("viewer_access");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function persistViewerAccess(viewerAccess) {
  if (!viewerAccess) {
    sessionStorage.removeItem("viewer_access");
    return;
  }
  sessionStorage.setItem("viewer_access", JSON.stringify(viewerAccess));
}

export function clearViewerAccess() {
  sessionStorage.removeItem("viewer_access");
}

export function readViewerAccess() {
  const payload = readStoredViewerAccess();
  if (!payload) {
    return {
      userId: null,
      unitId: null,
      displayName: null,
      unitLabel: null,
      unitType: null,
      roleCode: null,
      sectorCode: null,
      moduleAccessCodes: [],
      isAdmin: false,
      canViewAll: false,
      rawSession: null,
    };
  }

  return {
    userId: payload.id || null,
    unitId: payload.unit_id || null,
    displayName: payload.display_name || payload.name || null,
    unitLabel: payload.unit_label || null,
    unitType: payload.unit_type || null,
    roleCode: payload.role_code || null,
    sectorCode: payload.sector_code || null,
    moduleAccessCodes: Array.isArray(payload.module_access_codes)
      ? payload.module_access_codes
      : [],
    isAdmin: Boolean(payload.is_admin),
    canViewAll: Boolean(payload.can_view_all),
    rawSession: payload,
  };
}

export function canAccessNavItem(item, viewerAccess = readViewerAccess()) {
  const visibility = item.visibility;
  if (!visibility) {
    return true;
  }

  if (visibility.requireGlobalScope && !viewerAccess.canViewAll) {
    return false;
  }

  if (
    Array.isArray(visibility.roles) &&
    visibility.roles.length > 0 &&
    !visibility.roles.includes(viewerAccess.roleCode)
  ) {
    if (!(visibility.allowAdminFallback && viewerAccess.isAdmin)) {
      return false;
    }
  }

  if (
    Array.isArray(visibility.sectorCodes) &&
    visibility.sectorCodes.length > 0 &&
    !viewerAccess.canViewAll &&
    !visibility.sectorCodes.includes(viewerAccess.sectorCode) &&
    !visibility.sectorCodes.some((code) =>
      (viewerAccess.moduleAccessCodes || []).includes(code)
    )
  ) {
    return false;
  }

  return true;
}

export function filterNavigationItems(items, viewerAccess = readViewerAccess()) {
  const filterItemsRecursively = (sourceItems) =>
    sourceItems
      .map((item) => {
        if (!canAccessNavItem(item, viewerAccess)) {
          return null;
        }

        if (Array.isArray(item.children) && item.children.length > 0) {
          const visibleChildren = filterItemsRecursively(item.children);
          if (visibleChildren.length === 0) {
            return null;
          }
          return {
            ...item,
            children: visibleChildren,
          };
        }

        return item;
      })
      .filter(Boolean);

  return filterItemsRecursively(items);
}
