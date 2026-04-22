export const PASSWORD_POLICY_MESSAGE =
  "Use pelo menos 8 caracteres com letra maiúscula, letra minúscula, número e caractere especial.";

export function validateStrongPassword(password) {
  const candidate = String(password || "").trim();
  if (candidate.length < 8) {
    return PASSWORD_POLICY_MESSAGE;
  }
  if (!/[A-Z]/.test(candidate)) {
    return PASSWORD_POLICY_MESSAGE;
  }
  if (!/[a-z]/.test(candidate)) {
    return PASSWORD_POLICY_MESSAGE;
  }
  if (!/\d/.test(candidate)) {
    return PASSWORD_POLICY_MESSAGE;
  }
  if (!/[^A-Za-z0-9]/.test(candidate)) {
    return PASSWORD_POLICY_MESSAGE;
  }
  return "";
}
