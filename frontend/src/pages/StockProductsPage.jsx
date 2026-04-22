import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import {
  createStockProduct,
  deleteStockProduct,
  getStockProducts,
  updateStockProduct,
} from "../services/stockService";
import {
  buildStockProductPayload,
  createEmptyProductForm,
  resolveStockSituation,
  resolveStockSituationStyle,
  STOCK_CATEGORY_OPTIONS,
  STOCK_STATUS_OPTIONS,
  STOCK_UNIT_MEASURE_OPTIONS,
} from "../utils/stockUtils";

function StockProductsPage({ onBack }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(createEmptyProductForm());
  const [editingId, setEditingId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState("");

  async function loadItems() {
    try {
      setItems(await getStockProducts());
    } catch (fetchError) {
      setError(fetchError.message || "Erro ao carregar produtos.");
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((left, right) => left.nome.localeCompare(right.nome)),
    [items]
  );

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const payload = buildStockProductPayload(form);
      if (editingId) {
        await updateStockProduct(editingId, payload);
      } else {
        await createStockProduct(payload);
      }
      setForm(createEmptyProductForm());
      setEditingId(null);
      setSelectedItem(null);
      await loadItems();
    } catch (submitError) {
      setError(submitError.message || "Erro ao salvar produto.");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setSelectedItem(item);
    setForm({
      nome: item.nome || "",
      codigo_patrimonio: item.codigo_patrimonio || "",
      categoria: item.categoria || "",
      unidade_medida: item.unidade_medida || "",
      estoque_minimo: item.estoque_minimo ?? "",
      estoque_atual: item.estoque_atual ?? 0,
      localizacao: item.localizacao || "",
      observacoes: item.observacoes || "",
      status: item.status || "Ativo",
    });
  };

  const handleDelete = async (itemId) => {
    try {
      await deleteStockProduct(itemId);
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }
      await loadItems();
    } catch (deleteError) {
      setError(deleteError.message || "Erro ao inativar produto.");
    }
  };

  const handleViewItem = (item) => {
    setSelectedItem(item);
  };

  const handleCloseDetails = () => {
    setSelectedItem(null);
  };

  const primaryGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
    gap: "16px",
    marginBottom: "16px",
  };

  const secondaryGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
    gap: "16px",
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Produtos Cadastrados</h1>
        <p style={styles.subtitle}>Cadastre e mantenha o estoque base do módulo.</p>
        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>{editingId ? "Editar produto" : "Novo produto"}</h2>
        <form onSubmit={handleSubmit}>
          <div style={primaryGridStyle}>
            <div style={styles.field}>
              <label style={styles.label}>Nome do Produto</label>
              <input value={form.nome} onChange={handleChange("nome")} style={styles.input} placeholder="Digite o nome do material" required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Código/Patrimônio</label>
              <input value={form.codigo_patrimonio} onChange={handleChange("codigo_patrimonio")} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Categoria</label>
              <select value={form.categoria} onChange={handleChange("categoria")} style={styles.input}>
                <option value="">Selecione</option>
                {STOCK_CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Unidade de Medida</label>
              <select value={form.unidade_medida} onChange={handleChange("unidade_medida")} style={styles.input}>
                <option value="">Selecione</option>
                {STOCK_UNIT_MEASURE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Estoque Mínimo</label>
              <input type="number" min="0" value={form.estoque_minimo} onChange={handleChange("estoque_minimo")} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>
                {editingId ? "Estoque Atual" : "Quantidade Inicial"}
              </label>
              <input
                type="number"
                min="0"
                value={form.estoque_atual}
                onChange={editingId ? undefined : handleChange("estoque_atual")}
                readOnly={Boolean(editingId)}
                style={{
                  ...styles.input,
                  ...(editingId ? { backgroundColor: "var(--app-surface-muted)" } : {}),
                }}
              />
            </div>
          </div>

          <div style={secondaryGridStyle}>
            <div style={styles.field}>
              <label style={styles.label}>Localização/Depósito</label>
              <input value={form.localizacao} onChange={handleChange("localizacao")} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Status</label>
              <select value={form.status} onChange={handleChange("status")} style={styles.input}>
                {STOCK_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div style={styles.fieldFull}>
              <label style={styles.label}>Observações</label>
              <textarea value={form.observacoes} onChange={handleChange("observacoes")} style={styles.textarea} />
            </div>
          </div>
          <div style={styles.footerActions}>
            <button type="button" onClick={() => { setForm(createEmptyProductForm()); setEditingId(null); }} style={{ ...styles.button, ...styles.secondaryButton }}>
              Limpar Formulário
            </button>
            <button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>
              {editingId ? "Salvar Alterações" : "Salvar Produto"}
            </button>
          </div>
        </form>
      </section>

      {selectedItem ? (
        <section style={styles.card}>
          <div style={styles.detailHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Detalhes do produto</h2>
              <p style={styles.sectionText}>Visualize as informações completas do produto selecionado.</p>
            </div>
            <div style={styles.actions}>
              <button type="button" onClick={handleCloseDetails} style={{ ...styles.button, ...styles.secondaryButton }}>
                ← Voltar
              </button>
              <button type="button" onClick={() => handleEdit(selectedItem)} style={{ ...styles.button, ...styles.primaryButton }}>
                ✏ Editar
              </button>
            </div>
          </div>
          <div style={styles.detailGrid}>
            <div style={styles.detailField}><span style={styles.detailLabel}>Nome</span><span style={styles.detailValue}>{selectedItem.nome || "-"}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Código/Patrimônio</span><span style={styles.detailValue}>{selectedItem.codigo_patrimonio || "-"}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Categoria</span><span style={styles.detailValue}>{selectedItem.categoria || "-"}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Unidade de Medida</span><span style={styles.detailValue}>{selectedItem.unidade_medida || "-"}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Estoque Atual</span><span style={styles.detailValue}>{selectedItem.estoque_atual ?? 0}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Estoque Mínimo</span><span style={styles.detailValue}>{selectedItem.estoque_minimo ?? 0}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Localização</span><span style={styles.detailValue}>{selectedItem.localizacao || "-"}</span></div>
            <div style={styles.detailField}>
              <span style={styles.detailLabel}>Situação</span>
              <span style={styles.detailValue}>
                <span style={{ ...styles.badge, ...resolveStockSituationStyle(selectedItem) }}>
                  {resolveStockSituation(selectedItem)}
                </span>
              </span>
            </div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Status</span><span style={styles.detailValue}>{selectedItem.status || "-"}</span></div>
            <div style={styles.detailField} className="detail-field-full"><span style={styles.detailLabel}>Observações</span><span style={styles.detailValue}>{selectedItem.observacoes || "-"}</span></div>
          </div>
          <div style={styles.footerActions}>
            <button type="button" onClick={() => void handleDelete(selectedItem.id)} style={{ ...styles.button, ...styles.dangerButton }}>
              Inativar
            </button>
          </div>
        </section>
      ) : null}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Lista de produtos</h2>
        <div style={styles.infoRow}>
          <span>{sortedItems.length} registro(s) encontrado(s)</span>
        </div>
        <div style={styles.desktopTableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "80px" }}>Ver</th>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Categoria</th>
                <th style={styles.th}>Estoque Atual</th>
                <th style={styles.th}>Localização</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.id}>
                  <td style={styles.td}>
                    <button type="button" onClick={() => handleViewItem(item)} style={styles.inlineInfoButton}>Ver</button>
                  </td>
                  <td style={styles.td}>{item.nome}</td>
                  <td style={styles.td}>{item.categoria || "-"}</td>
                  <td style={styles.td}>{item.estoque_atual}</td>
                  <td style={styles.td}>{item.localizacao || "-"}</td>
                  <td style={styles.td}>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-card-view" style={styles.mobileCards}>
          {sortedItems.map((item) => (
            <article key={item.id} style={styles.mobileCard}>
              <div style={styles.mobileCardHeader}>
                <div>
                  <h3 style={styles.mobileCardTitle}>{item.nome}</h3>
                  <p style={styles.mobileCardMeta}>{item.categoria || "-"}</p>
                </div>
                <button type="button" onClick={() => handleViewItem(item)} style={styles.inlineInfoButton}>Ver</button>
              </div>
              <div style={styles.mobileCardGrid}>
                <div style={styles.mobileCardRow}><p style={styles.mobileCardLabel}>Estoque Atual</p><p style={styles.mobileCardValue}>{item.estoque_atual}</p></div>
                <div style={styles.mobileCardRow}><p style={styles.mobileCardLabel}>Localização</p><p style={styles.mobileCardValue}>{item.localizacao || "-"}</p></div>
                <div style={styles.mobileCardRow}><p style={styles.mobileCardLabel}>Status</p><p style={styles.mobileCardValue}>{item.status || "-"}</p></div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default StockProductsPage;
