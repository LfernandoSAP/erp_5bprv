import { apiFetch } from "./api";

export function getLogs() {
  return apiFetch("/estatistica/logs/");
}
