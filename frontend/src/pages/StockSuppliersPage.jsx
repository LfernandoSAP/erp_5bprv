import { useEffect, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import {
  createStockSupplier,
  deleteStockSupplier,
  getStockSuppliers,
  updateStockSupplier,
} from "../services/stockService";
import {
  buildSupplierPayload,
  createEmptySupplierForm,
  maskCnpj,
  normalizeStockText,
} from "../utils/stockUtils";
import { getPhoneInputProps, maskPhone } from "./policeOfficerRegistrationUtils";

function StockSuppliersPage({ onBack }) {
  const phoneInputProps = getPhoneInputProps();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(createEmptySupplierForm());
  const [editingId, setEditingId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState("");

  async function loadItems() {
    try {
      setItems(await getStockSuppliers());
    } catch (fetchError) {
      setError(fetchError.message || "Erro ao carregar fornecedores.");
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
      const payload = buildSupplierPayload(form);
      if (editingId) {
        await updateStockSupplier(editingId, payload);
      } else {
        await createStockSupplier(payload);
      }
      setForm(createEmptySupplierForm());
      setEditingId(null);
      setSelectedItem(null);
      await loadItems();
    } catch (submitError) {
      setError(submitError.message || "Erro ao salvar fornecedor.");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setSelectedItem(item);
    setForm({
      nome: normalizeStockText(item.nome || ""),
      cnpj: item.cnpj || "",
      telefone: item.telefone || "",
      email: item.email || "",
      endereco: normalizeStockText(item.endereco || ""),
      produto_servico: normalizeStockText(item.produto_servico || ""),
      observacoes: normalizeStockText(item.observacoes || ""),
      status: normalizeStockText(item.status || "Ativo"),
    });
  };

  const handleDelete = async (itemId) => {
    try {
      await deleteStockSupplier(itemId);
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }
      await loadItems();
    } catch (submitError) {
      setError(submitError.message || "Erro ao inativar fornecedor.");
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Fornecedores</h1>
        <p style={styles.subtitle}>Mantenha o cadastro de fornecedores e contatos do estoque.</p>
        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>Voltar</button>
        </div>
      </section>
      {error && <div style={styles.errorBox}>{error}</div>}
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>{editingId ? "Editar fornecedor" : "Novo fornecedor"}</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Nome do Fornecedor</label>
              <input value={form.nome} onChange={handleChange("nome")} style={styles.input} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>CNPJ</label>
              <input value={form.cnpj} onChange={(event) => handleChange("cnpj")({ target: { value: maskCnpj(event.target.value) } })} maxLength={18} placeholder="00.000.000/0000-00" style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Telefone</label>
              <input value={form.telefone} onChange={(event) => handleChange("telefone")({ target: { value: maskPhone(event.target.value) } })} {...phoneInputProps} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>E-mail</label>
              <input value={form.email} onChange={handleChange("email")} style={styles.input} />
            </div>
            <div style={styles.fieldFull}>
              <label style={styles.label}>Endereço</label>
              <input value={form.endereco} onChange={handleChange("endereco")} style={styles.input} />
            </div>
            <div style={styles.fieldFull}>
              <label style={styles.label}>Produto/Serviço fornecido</label>
              <input value={form.produto_servico} onChange={handleChange("produto_servico")} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Status</label>
              <select value={form.status} onChange={handleChange("status")} style={styles.input}>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
            <div style={styles.fieldFull}>
              <label style={styles.label}>Observações</label>
              <textarea value={form.observacoes} onChange={handleChange("observacoes")} style={styles.textarea} />
            </div>
          </div>
          <div style={styles.footerActions}>
            <button type="button" onClick={() => { setForm(createEmptySupplierForm()); setEditingId(null); }} style={{ ...styles.button, ...styles.secondaryButton }}>
              Limpar Formulário
            </button>
            <button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>
              {editingId ? "Salvar Alterações" : "Salvar Fornecedor"}
            </button>
          </div>
        </form>
      </section>

      {selectedItem ? (
        <section style={styles.card}>
          <div style={styles.detailHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Detalhes do fornecedor</h2>
              <p style={styles.sectionText}>Visualize os dados completos do fornecedor selecionado.</p>
            </div>
            <div style={styles.actions}>
              <button type="button" onClick={() => setSelectedItem(null)} style={{ ...styles.button, ...styles.secondaryButton }}>
                ← Voltar
              </button>
              <button type="button" onClick={() => handleEdit(selectedItem)} style={{ ...styles.button, ...styles.primaryButton }}>
                ✏ Editar
              </button>
            </div>
          </div>
          <div style={styles.detailGrid}>
            <div style={styles.detailField}><span style={styles.detailLabel}>Nome</span><span style={styles.detailValue}>{normalizeStockText(selectedItem.nome) || "-"}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>CNPJ</span><span style={styles.detailValue}>{selectedItem.cnpj || "-"}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Telefone</span><span style={styles.detailValue}>{selectedItem.telefone || "-"}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>E-mail</span><span style={styles.detailValue}>{selectedItem.email || "-"}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Status</span><span style={styles.detailValue}>{normalizeStockText(selectedItem.status) || "-"}</span></div>
            <div style={styles.detailField} className="detail-field-full"><span style={styles.detailLabel}>Produto/Serviço</span><span style={styles.detailValue}>{normalizeStockText(selectedItem.produto_servico || "-")}</span></div>
            <div style={styles.detailField} className="detail-field-full"><span style={styles.detailLabel}>Endereço</span><span style={styles.detailValue}>{normalizeStockText(selectedItem.endereco || "-")}</span></div>
            <div style={styles.detailField} className="detail-field-full"><span style={styles.detailLabel}>Observações</span><span style={styles.detailValue}>{normalizeStockText(selectedItem.observacoes || "-")}</span></div>
          </div>
          <div style={styles.footerActions}>
            <button type="button" onClick={() => void handleDelete(selectedItem.id)} style={{ ...styles.button, ...styles.dangerButton }}>
              Inativar
            </button>
          </div>
        </section>
      ) : null}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Lista de fornecedores</h2>
        <div style={styles.infoRow}>
          <span>{items.length} registro(s) encontrado(s)</span>
        </div>
        <div style={styles.desktopTableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "80px" }}>Ver</th>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>CNPJ</th>
                <th style={styles.th}>Telefone</th>
                <th style={styles.th}>Produto/Serviço</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={styles.td}>
                    <button type="button" onClick={() => setSelectedItem(item)} style={styles.inlineInfoButton}>Ver</button>
                  </td>
                  <td style={styles.td}>{normalizeStockText(item.nome)}</td>
                  <td style={styles.td}>{item.cnpj || "-"}</td>
                  <td style={styles.td}>{item.telefone || "-"}</td>
                  <td style={styles.td}>{normalizeStockText(item.produto_servico || "-")}</td>
                  <td style={styles.td}>{normalizeStockText(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default StockSuppliersPage;
