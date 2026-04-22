import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import { createStockExit, getStockExits, getStockProducts } from "../services/stockService";
import {
  buildStockExitPayload,
  createEmptyExitForm,
  getStockProductOptionLabel,
  resolveStockProductFromInput,
} from "../utils/stockUtils";
import { getDateInputProps, maskDate } from "./policeOfficerRegistrationUtils";

function StockExitsPage({ onBack }) {
  const dateInputProps = getDateInputProps();
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(createEmptyExitForm());
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      const [loadedExits, loadedProducts] = await Promise.all([
        getStockExits(),
        getStockProducts(),
      ]);
      setItems(loadedExits);
      setProducts(loadedProducts);
    } catch (fetchError) {
      setError(fetchError.message || "Erro ao carregar saídas.");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const selectedProduct = useMemo(
    () => resolveStockProductFromInput(products, form.produto_nome),
    [products, form.produto_nome]
  );

  const stockError = useMemo(() => {
    const quantity = Number(form.quantidade || 0);
    const available = Number(selectedProduct?.estoque_atual || 0);
    if (!form.quantidade) return "";
    if (quantity <= 0) return "A quantidade deve ser maior que zero.";
    if (quantity > available) return `Estoque insuficiente. Saldo disponível: ${available} unidades.`;
    return "";
  }, [form.quantidade, selectedProduct?.estoque_atual]);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (stockError) {
      setError(stockError);
      return;
    }
    if (!selectedProduct) {
      setError("Informe uma mercadoria válida já existente no estoque.");
      return;
    }
    try {
      await createStockExit(
        buildStockExitPayload({
          ...form,
          produto_id: selectedProduct.id,
        })
      );
      setForm(createEmptyExitForm());
      await loadData();
    } catch (submitError) {
      setError(submitError.message || "Erro ao registrar saída.");
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Saída de Mercadoria</h1>
        <p style={styles.subtitle}>Controle o consumo, descarte e movimentações do estoque.</p>
        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>Voltar</button>
        </div>
      </section>

      {(error || stockError) && <div style={styles.errorBox}>{error || stockError}</div>}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Nova saída</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Nome da Mercadoria</label>
              <input
                list="stock-products-exit"
                value={form.produto_nome}
                onChange={handleChange("produto_nome")}
                placeholder="Digite a mercadoria cadastrada no estoque"
                style={styles.input}
                required
              />
              <datalist id="stock-products-exit">
                {products.map((item) => (
                  <option key={item.id} value={getStockProductOptionLabel(item)} />
                ))}
              </datalist>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Qtd</label>
              <input type="number" min="1" value={form.quantidade} onChange={handleChange("quantidade")} style={styles.input} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Data de Saída</label>
              <input value={form.data_saida} onChange={(event) => handleChange("data_saida")({ target: { value: maskDate(event.target.value) } })} {...dateInputProps} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Responsável</label>
              <input value={form.responsavel} onChange={handleChange("responsavel")} style={styles.input} />
            </div>
          </div>
          {selectedProduct && (
            <div style={styles.infoBox}>
              Saldo disponível: <strong>{selectedProduct.estoque_atual}</strong> unidades.
            </div>
          )}
          <div style={styles.footerActions}>
            <button type="button" onClick={() => setForm(createEmptyExitForm())} style={{ ...styles.button, ...styles.secondaryButton }}>
              Limpar Formulário
            </button>
            <button type="submit" disabled={Boolean(stockError)} style={{ ...styles.button, ...styles.primaryButton }}>
              Confirmar Saída
            </button>
          </div>
        </form>
      </section>

      {selectedItem ? (
        <section style={styles.card}>
          <div style={styles.detailHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Detalhes da saída</h2>
              <p style={styles.sectionText}>Visualize os dados completos da saída selecionada.</p>
            </div>
            <div style={styles.actions}>
              <button type="button" onClick={() => setSelectedItem(null)} style={{ ...styles.button, ...styles.secondaryButton }}>
                ← Voltar
              </button>
            </div>
          </div>
          <div style={styles.detailGrid}>
            <div style={styles.detailField}><span style={styles.detailLabel}>Produto</span><span style={styles.detailValue}>{selectedItem.produto_nome || "-"}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Data</span><span style={styles.detailValue}>{selectedItem.data_saida ? new Date(selectedItem.data_saida).toLocaleDateString("pt-BR") : "-"}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Quantidade</span><span style={styles.detailValue}>{selectedItem.quantidade}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Saldo Anterior</span><span style={styles.detailValue}>{selectedItem.saldo_anterior}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Saldo Atual</span><span style={styles.detailValue}>{selectedItem.saldo_atual}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Responsável</span><span style={styles.detailValue}>{selectedItem.responsavel || "-"}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Motivo</span><span style={styles.detailValue}>{selectedItem.motivo_saida || "-"}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Destino/Solicitante</span><span style={styles.detailValue}>{selectedItem.destino_solicitante || "-"}</span></div>
            <div style={styles.detailField} className="detail-field-full"><span style={styles.detailLabel}>Observações</span><span style={styles.detailValue}>{selectedItem.observacoes || "-"}</span></div>
          </div>
        </section>
      ) : null}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Histórico de Saídas</h2>
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
                      {item.data_saida ? new Date(item.data_saida).toLocaleDateString("pt-BR") : "-"}
                    </td>
                    <td style={styles.td}>{item.produto_nome || "-"}</td>
                    <td style={styles.td}>{item.quantidade}</td>
                    <td style={styles.td}>{item.saldo_atual}</td>
                    <td style={styles.td}>{item.responsavel || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={styles.td} colSpan={6}>
                    Nenhuma saída registrada até o momento.
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

export default StockExitsPage;
