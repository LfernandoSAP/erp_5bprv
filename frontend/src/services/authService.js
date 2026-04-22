import { apiFetch } from "./api";

export async function loginUser(cpf, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    handleAuthError: false,
    body: JSON.stringify({ cpf, password }),
  });
}

export async function logoutUser() {
  return apiFetch("/auth/logout", {
    method: "POST",
    handleAuthError: false,
  });
}

export async function getCurrentSession() {
  return apiFetch("/auth/me", {
    method: "GET",
  });
}

export async function changePassword(currentPassword, newPassword) {
  return apiFetch("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}
