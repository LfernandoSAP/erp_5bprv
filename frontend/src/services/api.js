function dispatchAuthExpired() {
  window.dispatchEvent(new Event("erp:auth-expired"));
}

export function logoutAndGoToLogin() {
  sessionStorage.removeItem("viewer_access");
  dispatchAuthExpired();
}

async function tryRefreshSession() {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    if (data?.session) {
      sessionStorage.setItem("viewer_access", JSON.stringify(data.session));
    }
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch(path, options = {}) {
  const shouldHandleAuthError = options.handleAuthError !== false;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    credentials: "include",
    headers,
  };

  let response;
  try {
    response = await fetch(`/api${path}`, config);
  } catch {
    throw new Error(
      "Servidor indisponível. Verifique se o backend (porta 8000) e o frontend (porta 3000) estão iniciados."
    );
  }

  const authErrorDetails = [
    "Not authenticated",
    "Invalid token",
    "User not found or inactive",
  ];

  if ((response.status === 401 || response.status === 403) && shouldHandleAuthError) {
    let authData = null;
    try {
      authData = await response.clone().json();
    } catch {
      authData = null;
    }

    const authMessage =
      typeof authData === "object" && authData?.detail ? String(authData.detail) : "";

    if (response.status === 401 || authErrorDetails.includes(authMessage)) {
      const refreshed = await tryRefreshSession();
      if (refreshed) {
        response = await fetch(`/api${path}`, config);
      } else {
        logoutAndGoToLogin();
        throw new Error("Sessão expirada. Faça login novamente.");
      }
    }
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type");
  const rawText = await response.text();

  let data = rawText;

  if (rawText && contentType && contentType.includes("application/json")) {
    data = JSON.parse(rawText);
  }

  if (!response.ok) {
    const isServerError = response.status >= 500;
    let message;

    if (typeof data === "object" && data?.detail) {
      if (Array.isArray(data.detail)) {
        const firstDetail = data.detail[0];
        if (typeof firstDetail === "string") {
          message = firstDetail;
        } else if (firstDetail?.msg) {
          message = String(firstDetail.msg);
        } else {
          message = "Erro de validação na requisição.";
        }
      } else if (typeof data.detail === "string") {
        message = data.detail;
      } else if (data.detail?.msg) {
        message = String(data.detail.msg);
      }
    }

    if (!message) {
      message = isServerError
        ? "Erro interno do servidor. Confirme se o backend está em execução e tente novamente."
        : "Erro na requisição.";
    }
    throw new Error(message);
  }

  return data;
}
