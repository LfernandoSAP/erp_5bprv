import { apiFetch } from "./api";

export async function getStockProducts() {
  return apiFetch("/logistica/estoque/produtos");
}

export async function createStockProduct(payload) {
  return apiFetch("/logistica/estoque/produtos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateStockProduct(itemId, payload) {
  return apiFetch(`/logistica/estoque/produtos/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteStockProduct(itemId) {
  return apiFetch(`/logistica/estoque/produtos/${itemId}`, {
    method: "DELETE",
  });
}

export async function getStockSuppliers() {
  return apiFetch("/logistica/estoque/fornecedores");
}

export async function createStockSupplier(payload) {
  return apiFetch("/logistica/estoque/fornecedores", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateStockSupplier(itemId, payload) {
  return apiFetch(`/logistica/estoque/fornecedores/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteStockSupplier(itemId) {
  return apiFetch(`/logistica/estoque/fornecedores/${itemId}`, {
    method: "DELETE",
  });
}

export async function getStockEntries() {
  return apiFetch("/logistica/estoque/entradas");
}

export async function createStockEntry(payload) {
  return apiFetch("/logistica/estoque/entradas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateStockEntry(itemId, payload) {
  return apiFetch(`/logistica/estoque/entradas/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteStockEntry(itemId) {
  return apiFetch(`/logistica/estoque/entradas/${itemId}`, {
    method: "DELETE",
  });
}

export async function getStockExits() {
  return apiFetch("/logistica/estoque/saidas");
}

export async function createStockExit(payload) {
  return apiFetch("/logistica/estoque/saidas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateStockExit(itemId, payload) {
  return apiFetch(`/logistica/estoque/saidas/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteStockExit(itemId) {
  return apiFetch(`/logistica/estoque/saidas/${itemId}`, {
    method: "DELETE",
  });
}

export async function getStockMaintenanceOrders() {
  return apiFetch("/logistica/estoque/ordens-manutencao");
}

export async function createStockMaintenanceOrder(payload) {
  return apiFetch("/logistica/estoque/ordens-manutencao", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateStockMaintenanceOrder(itemId, payload) {
  return apiFetch(`/logistica/estoque/ordens-manutencao/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteStockMaintenanceOrder(itemId) {
  return apiFetch(`/logistica/estoque/ordens-manutencao/${itemId}`, {
    method: "DELETE",
  });
}

export async function getStockMovements(filters = {}) {
  const params = new URLSearchParams();
  if (filters.produto_id) {
    params.set("produto_id", String(filters.produto_id));
  }
  if (filters.data_inicial) {
    params.set("data_inicial", filters.data_inicial);
  }
  if (filters.data_final) {
    params.set("data_final", filters.data_final);
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch(`/logistica/estoque/movimentacoes${suffix}`);
}
