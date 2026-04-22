import { apiFetch } from "./api";

export async function getDashboardSummary() {
  return apiFetch("/dashboard/summary");
}