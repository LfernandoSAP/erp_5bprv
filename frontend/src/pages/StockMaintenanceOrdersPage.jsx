import { useEffect, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import {
  createStockMaintenanceOrder,
  deleteStockMaintenanceOrder,
  getStockMaintenanceOrders,
  updateStockMaintenanceOrder,
} from "../services/stockService";
import {
  buildMaintenanceOrderPayload,
  createEmptyMaintenanceForm,
  formatCurrency,
  normalizeStockText,
  STOCK_MAINTENANCE_STATUS_OPTIONS,
  STOCK_MAINTENANCE_TYPE_OPTIONS,
} from "../utils/stockUtils";
import { getDateInputProps, maskDate } from "./policeOfficerRegistrationUtils";

function StockMaintenanceOrdersPage({ onBack }) {
  const dateInputProps = getDateInputProps();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(createEmptyMaintenanceForm());
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  async function loadItems() {
    try {
      setItems(await getStockMaintenanceOrders());
    } catch (fetchError) {
      setError(fetchError.message || "Erro ao carregar ordens de manutenção.");
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const payload = buildMaintenanceOrderPayload(form);
      if (editingId) {
        await updateStockMaintenanceOrder(editingId, payload);
      } else {
        await createStockMaintenanceOrder(payload);
      }
      setForm(createEmptyMaintenanceForm());
      setEditingId(null);
      await loadItems();
    } catch (submitError) {
      setError(submitError.message || "Erro ao salvar ordem de manutenção.");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      tipo: normalizeStockText(item.tipo || ""),
      item_equipamento: normalizeStockText(item.item_equipamento || ""),
      patrimonio_placa: normalizeStockText(item.patrimonio_placa || ""),
      descricao_problema: normalizeStockText(item.descricao_problema || ""),
      data_abertura: item.data_abertura ? new Date(item.data_abertura).toLocaleDateString("pt-BR") : "",
      previsao_conclusao: item.previsao_conclusao ? new Date(item.previsao_conclusao).toLocaleDateString("pt-BR") : "",
      data_conclusao: item.data_conclusao ? new Date(item.data_conclusao).toLocaleDateString("pt-BR") : "",
      responsavel_tecnico: normalizeStockText(item.responsavel_tecnico || ""),
      pecas_utilizadas: normalizeStockText(item.pecas_utilizadas || ""),
      custo_estimado: item.custo_estimado || "",
      custo_real: item.custo_real || "",
      status: normalizeStockText(item.status || "Aberta"),
      observacoes: normalizeStockText(item.observacoes || ""),
    });
  };

  const handleCancelOrder = async (itemId) => {
    try {
      setError("");
      await deleteStockMaintenanceOrder(itemId);
      if (editingId === itemId) {
        setForm(createEmptyMaintenanceForm());
        setEditingId(null);
      }
      await loadItems();
    } catch (submitError) {
      setError(submitError.message || "Erro ao cancelar ordem de manutenção.");
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Ordens de Manutenção</h1>
        <p style={styles.subtitle}>Acompanhe serviços preventivos, corretivos e revisões.</p>
        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>Voltar</button>
        </div>
      </section>
      {error && <div style={styles.errorBox}>{error}</div>}
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>{editingId ? "Editar ordem" : "Nova ordem"}</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Tipo</label>
              <select value={form.tipo} onChange={handleChange("tipo")} style={styles.input} required>
                <option value="">Selecione</option>
                {STOCK_MAINTENANCE_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Item/Equipamento</label>
              <input value={form.item_equipamento} onChange={handleChange("item_equipamento")} style={styles.input} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Patrimônio/Placa</label>
              <input value={form.patrimonio_placa} onChange={handleChange("patrimonio_placa")} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Data de Abertura</label>
              <input value={form.data_abertura} onChange={(event) => handleChange("data_abertura")({ target: { value: maskDate(event.target.value) } })} {...dateInputProps} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Previsão de Conclusão</label>
              <input value={form.previsao_conclusao} onChange={(event) => handleChange("previsao_conclusao")({ target: { value: maskDate(event.target.value) } })} {...dateInputProps} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Data de Conclusão</label>
              <input value={form.data_conclusao} onChange={(event) => handleChange("data_conclusao")({ target: { value: maskDate(event.target.value) } })} {...dateInputProps} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Responsável Técnico</label>
              <input value={form.responsavel_tecnico} onChange={handleChange("responsavel_tecnico")} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Custo Estimado</label>
              <input value={form.custo_estimado} onChange={handleChange("custo_estimado")} style={styles.input} placeholder="R$" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Custo Real</label>
              <input value={form.custo_real} onChange={handleChange("custo_real")} style={styles.input} placeholder="R$" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Status</label>
              <select value={form.status} onChange={handleChange("status")} style={styles.input}>
                {STOCK_MAINTENANCE_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div style={styles.fieldFull}>
              <label style={styles.label}>Descrição do Problema</label>
              <textarea value={form.descricao_problema} onChange={handleChange("descricao_problema")} style={styles.textarea} required />
            </div>
            <div style={styles.fieldFull}>
              <label style={styles.label}>Peças Utilizadas</label>
              <textarea value={form.pecas_utilizadas} onChange={handleChange("pecas_utilizadas")} style={styles.textarea} />
            </div>
            <div style={styles.fieldFull}>
              <label style={styles.label}>Observações</label>
              <textarea value={form.observacoes} onChange={handleChange("observacoes")} style={styles.textarea} />
            </div>
          </div>
          <div style={styles.footerActions}>
            <button type="button" onClick={() => { setForm(createEmptyMaintenanceForm()); setEditingId(null); }} style={{ ...styles.button, ...styles.secondaryButton }}>
              Limpar Formulário
            </button>
            <button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>
              {editingId ? "Salvar Alterações" : "Salvar Ordem"}
            </button>
          </div>
        </form>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Ordens registradas</h2>
        <div style={styles.desktopTableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nº da Ordem</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Item</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Previsão</th>
                <th style={styles.th}>Custo Estimado</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                (() => {
                  const normalizedStatus = normalizeStockText(item.status);
                  return (
                    <tr key={item.id}>
                      <td style={styles.td}>{item.numero_ordem}</td>
                      <td style={styles.td}>{normalizeStockText(item.tipo)}</td>
                      <td style={styles.td}>{normalizeStockText(item.item_equipamento)}</td>
                      <td style={styles.td}>{normalizedStatus}</td>
                      <td style={styles.td}>{item.previsao_conclusao ? new Date(item.previsao_conclusao).toLocaleDateString("pt-BR") : "-"}</td>
                      <td style={styles.td}>{item.custo_estimado != null ? formatCurrency(item.custo_estimado) : "-"}</td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            style={{ ...styles.button, ...styles.secondaryButton, minWidth: "auto" }}
                          >
                            Editar
                          </button>
                          {normalizedStatus !== "Cancelada" && (
                            <button
                              type="button"
                              onClick={() => void handleCancelOrder(item.id)}
                              style={{ ...styles.button, ...styles.dangerButton, minWidth: "auto" }}
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })()
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-card-view" style={styles.mobileCards}>
          {items.map((item) => (
            (() => {
              const normalizedStatus = normalizeStockText(item.status);
              return (
                <article key={item.id} style={styles.mobileCard}>
                  <div style={styles.mobileCardHeader}>
                    <div>
                      <h3 style={styles.mobileCardTitle}>{item.numero_ordem}</h3>
                      <p style={styles.mobileCardMeta}>{normalizeStockText(item.item_equipamento)}</p>
                    </div>
                    <span style={{ ...styles.badge, ...(normalizedStatus === "Cancelada" ? styles.inactiveBadge : styles.infoBadge) }}>
                      {normalizedStatus}
                    </span>
                  </div>
                  <div style={styles.mobileCardGrid}>
                    <div style={styles.mobileCardRow}>
                      <p style={styles.mobileCardLabel}>Tipo</p>
                      <p style={styles.mobileCardValue}>{normalizeStockText(item.tipo)}</p>
                    </div>
                    <div style={styles.mobileCardRow}>
                      <p style={styles.mobileCardLabel}>Previsão</p>
                      <p style={styles.mobileCardValue}>
                        {item.previsao_conclusao
                          ? new Date(item.previsao_conclusao).toLocaleDateString("pt-BR")
                          : "-"}
                      </p>
                    </div>
                    <div style={styles.mobileCardRow}>
                      <p style={styles.mobileCardLabel}>Custo estimado</p>
                      <p style={styles.mobileCardValue}>
                        {item.custo_estimado != null ? formatCurrency(item.custo_estimado) : "-"}
                      </p>
                    </div>
                  </div>
                  <div style={styles.mobileCardActions}>
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      style={{ ...styles.button, ...styles.secondaryButton, minWidth: "auto" }}
                    >
                      Editar
                    </button>
                    {normalizedStatus !== "Cancelada" && (
                      <button
                        type="button"
                        onClick={() => void handleCancelOrder(item.id)}
                        style={{ ...styles.button, ...styles.dangerButton, minWidth: "auto" }}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </article>
              );
            })()
          ))}
        </div>
      </section>
    </div>
  );
}

export default StockMaintenanceOrdersPage;

