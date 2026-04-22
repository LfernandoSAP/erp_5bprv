import { useEffect, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import { createStockEntry, getStockEntries } from "../services/stockService";
import { buildStockEntryPayload, createEmptyEntryForm } from "../utils/stockUtils";
import { getDateInputProps, maskDate } from "./policeOfficerRegistrationUtils";

function StockEntriesPage({ onBack }) {
  const dateInputProps = getDateInputProps();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(createEmptyEntryForm());
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setItems(await getStockEntries());
    } catch (fetchError) {
      setError(fetchError.message || "Erro ao carregar dados do estoque.");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await createStockEntry(
        buildStockEntryPayload({
          ...form,
          produto_id: "",
        })
      );
      setForm(createEmptyEntryForm());
      await loadData();
    } catch (submitError) {
      setError(submitError.message || "Erro ao registrar entrada.");
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Entrada de Mercadoria</h1>
        <p style={styles.subtitle}>Registre recebimentos e atualize automaticamente o estoque.</p>
        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Nova entrada</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Nome da Mercadoria</label>
              <input
                value={form.produto_nome}
                onChange={handleChange("produto_nome")}
                placeholder="Digite o nome da mercadoria"
                style={styles.input}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Qtd</label>
              <input
                type="number"
                min="1"
                value={form.quantidade_recebida}
                onChange={handleChange("quantidade_recebida")}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Data de Entrada</label>
              <input
                value={form.data_entrada}
                onChange={(event) =>
                  handleChange("data_entrada")({
                    target: { value: maskDate(event.target.value) },
                  })
                }
                {...dateInputProps}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Responsável pelo Recebimento</label>
              <input
                value={form.responsavel_recebimento}
                onChange={handleChange("responsavel_recebimento")}
                style={styles.input}
                required
              />
            </div>
          </div>

          {form.produto_nome.trim() ? (
            <div style={styles.infoBox}>
              Novo produto será criado automaticamente no estoque com o nome{" "}
              <strong>{form.produto_nome.trim()}</strong>.
            </div>
          ) : null}

          <div style={styles.footerActions}>
            <button
              type="button"
              onClick={() => setForm(createEmptyEntryForm())}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              Limpar Formulário
            </button>
            <button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>
              Confirmar Entrada
            </button>
          </div>
        </form>
      </section>

      {selectedItem ? (
        <section style={styles.card}>
          <div style={styles.detailHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Detalhes da entrada</h2>
              <p style={styles.sectionText}>Visualize os dados completos da entrada selecionada.</p>
            </div>
            <div style={styles.actions}>
              <button type="button" onClick={() => setSelectedItem(null)} style={{ ...styles.button, ...styles.secondaryButton }}>
                ← Voltar
              </button>
            </div>
          </div>
          <div style={styles.detailGrid}>
            <div style={styles.detailField}><span style={styles.detailLabel}>Produto</span><span style={styles.detailValue}>{selectedItem.produto_nome || "-"}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Data</span><span style={styles.detailValue}>{selectedItem.data_entrada ? new Date(selectedItem.data_entrada).toLocaleDateString("pt-BR") : "-"}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Quantidade</span><span style={styles.detailValue}>{selectedItem.quantidade_recebida}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Saldo Anterior</span><span style={styles.detailValue}>{selectedItem.saldo_anterior}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Saldo Atual</span><span style={styles.detailValue}>{selectedItem.saldo_atual}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Responsável</span><span style={styles.detailValue}>{selectedItem.responsavel_recebimento || "-"}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Documento</span><span style={styles.detailValue}>{selectedItem.numero_documento || "-"}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Fornecedor</span><span style={styles.detailValue}>{selectedItem.fornecedor_nome || "-"}</span></div>
            <div style={styles.detailField} className="detail-field-full"><span style={styles.detailLabel}>Observações</span><span style={styles.detailValue}>{selectedItem.observacoes || "-"}</span></div>
          </div>
        </section>
      ) : null}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Histórico de Entradas</h2>
        <div style={styles.infoRow}>
          <span>{items.length} registro(s) encontrado(s)</span>
        </div>
        <div style={styles.desktopTableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "80px" }}>Ver</th>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Produto</th>
                <th style={styles.th}>Quantidade</th>
                <th style={styles.th}>Saldo Atual</th>
                <th style={styles.th}>Responsável</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      <button type="button" onClick={() => setSelectedItem(item)} style={styles.inlineInfoButton}>Ver</button>
                    </td>
                    <td style={styles.td}>
                      {item.data_entrada ? new Date(item.data_entrada).toLocaleDateString("pt-BR") : "-"}
                    </td>
                    <td style={styles.td}>{item.produto_nome || "-"}</td>
                    <td style={styles.td}>{item.quantidade_recebida}</td>
                    <td style={styles.td}>{item.saldo_atual}</td>
                    <td style={styles.td}>{item.responsavel_recebimento || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={styles.td} colSpan={6}>
                    Nenhuma entrada registrada até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default StockEntriesPage;
