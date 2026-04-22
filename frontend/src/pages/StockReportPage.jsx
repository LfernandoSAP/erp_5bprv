import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import { getStockMovements, getStockProducts } from "../services/stockService";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";
import {
  normalizeStockText,
  resolveStockSituation,
  resolveStockSituationStyle,
  STOCK_CATEGORY_OPTIONS,
  STOCK_STATUS_OPTIONS,
} from "../utils/stockUtils";
import {
  getDateInputProps,
  maskDate,
  toIsoDate,
} from "./policeOfficerRegistrationUtils";

function StockReportPage({ onBack }) {
  const dateInputProps = getDateInputProps();
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [filters, setFilters] = useState({
    categoria: "",
    status: "",
    situacao: "",
  });
  const [movementFilters, setMovementFilters] = useState({
    produto_id: "",
    data_inicial: "",
    data_final: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        setItems(await getStockProducts());
        setError("");
      } catch (fetchError) {
        setError(fetchError.message || "Erro ao carregar relatório de estoque.");
      }
    }

    void loadProducts();
  }, []);

  useEffect(() => {
    async function loadMovements() {
      try {
        setMovements(
          await getStockMovements({
            produto_id: movementFilters.produto_id || null,
            data_inicial: movementFilters.data_inicial
              ? toIsoDate(movementFilters.data_inicial)
              : null,
            data_final: movementFilters.data_final
              ? toIsoDate(movementFilters.data_final)
              : null,
          })
        );
        setError("");
      } catch (fetchError) {
        setError(fetchError.message || "Erro ao carregar relatório de estoque.");
      }
    }

    void loadMovements();
  }, [movementFilters]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (filters.categoria && item.categoria !== filters.categoria) return false;
        if (filters.status && item.status !== filters.status) return false;
        if (filters.situacao && resolveStockSituation(item) !== filters.situacao) {
          return false;
        }
        return true;
      }),
    [filters, items]
  );

  const reportRows = useMemo(
    () =>
      filteredItems.map((item) => ({
        nome: normalizeStockText(item.nome),
        categoria: normalizeStockText(item.categoria || "-"),
        estoque_atual: item.estoque_atual,
        estoque_minimo: item.estoque_minimo,
        situacao:
          resolveStockSituation(item) === "Crítico"
            ? "Estoque Baixo"
            : resolveStockSituation(item),
        localizacao: normalizeStockText(item.localizacao || "-"),
      })),
    [filteredItems]
  );

  const movementRows = useMemo(
    () =>
      movements.map((item) => ({
        ...item,
        data: item.created_at
          ? new Date(item.created_at).toLocaleString("pt-BR")
          : "-",
        tipo: normalizeStockText(item.tipo),
        produto: normalizeStockText(item.produto_nome || "-"),
        quantidade: item.quantidade,
        saldo_anterior: item.saldo_anterior,
        saldo_atual: item.saldo_atual,
        responsavel: normalizeStockText(item.responsavel || "-"),
        observacao: normalizeStockText(item.observacao || "-"),
      })),
    [movements]
  );

  const handleFilterChange = (field) => (event) => {
    setFilters((current) => ({ ...current, [field]: event.target.value ?? "" }));
  };

  const handleMovementFilterChange = (field) => (event) => {
    setMovementFilters((current) => ({
      ...current,
      [field]: event.target.value ?? "",
    }));
  };

  const clearStockFilters = () => {
    setFilters({
      categoria: "",
      status: "",
      situacao: "",
    });
  };

  const clearMovementFilters = () => {
    setMovementFilters({
      produto_id: "",
      data_inicial: "",
      data_final: "",
    });
  };

  const handleExportPdf = async () => {
    await exportPdfReport({
      fileBaseName: "relatorio_estoque",
      title: "Relatório de Estoque",
      subtitle: "Controle de Estoque e Manutenção",
      columns: [
        { key: "nome", label: "Nome" },
        { key: "categoria", label: "Categoria" },
        { key: "estoque_atual", label: "Estoque Atual" },
        { key: "estoque_minimo", label: "Estoque Mínimo" },
        { key: "situacao", label: "Situação" },
        { key: "localizacao", label: "Localização" },
      ],
      rows: reportRows,
      summaryItems: [`Produtos filtrados: ${reportRows.length}`],
      orientation: "landscape",
    });
  };

  const handleExportExcel = async () => {
    await exportExcelReport({
      fileBaseName: "relatorio_estoque",
      title: "Relatório de Estoque",
      subtitle: "Controle de Estoque e Manutenção",
      columns: [
        { key: "nome", label: "Nome" },
        { key: "categoria", label: "Categoria" },
        { key: "estoque_atual", label: "Estoque Atual" },
        { key: "estoque_minimo", label: "Estoque Mínimo" },
        { key: "situacao", label: "Situação" },
        { key: "localizacao", label: "Localização" },
      ],
      rows: reportRows,
    });
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Relatório de Estoque</h1>
        <p style={styles.subtitle}>
          Acompanhe saldo, situação e histórico de movimentações.
        </p>
        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
          <button
            onClick={() => void handleExportPdf()}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Exportar PDF
          </button>
          <button
            onClick={() => void handleExportExcel()}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            Exportar Excel
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Filtros do estoque</h2>
        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Categoria</label>
            <select
              value={filters.categoria ?? ""}
              onChange={handleFilterChange("categoria")}
              style={styles.input}
            >
              <option value="">Todas</option>
              {STOCK_CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Status</label>
            <select
              value={filters.status ?? ""}
              onChange={handleFilterChange("status")}
              style={styles.input}
            >
              <option value="">Todos</option>
              {STOCK_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Situação</label>
            <select
              value={filters.situacao ?? ""}
              onChange={handleFilterChange("situacao")}
              style={styles.input}
            >
              <option value="">Todas</option>
              <option value="Normal">Normal</option>
              <option value="Baixo">Baixo</option>
              <option value="Crítico">Crítico</option>
            </select>
          </div>
        </div>
        <div style={styles.footerActions}>
          <button
            type="button"
            onClick={clearStockFilters}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Limpar Filtros
          </button>
        </div>
      </section>

      {selectedItem ? (
        <section style={styles.card}>
          <div style={styles.detailHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Detalhes do item de estoque</h2>
              <p style={styles.sectionText}>Visualize os dados completos do item selecionado.</p>
            </div>
            <div style={styles.actions}>
              <button type="button" onClick={() => setSelectedItem(null)} style={{ ...styles.button, ...styles.secondaryButton }}>
                ← Voltar
              </button>
            </div>
          </div>
          <div style={styles.detailGrid}>
            <div style={styles.detailField}><span style={styles.detailLabel}>Nome</span><span style={styles.detailValue}>{normalizeStockText(selectedItem.nome) || "-"}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Categoria</span><span style={styles.detailValue}>{normalizeStockText(selectedItem.categoria || "-")}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Estoque Atual</span><span style={styles.detailValue}>{selectedItem.estoque_atual}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Estoque Mínimo</span><span style={styles.detailValue}>{selectedItem.estoque_minimo}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Situação</span><span style={styles.detailValue}><span style={{ ...styles.badge, ...resolveStockSituationStyle(selectedItem) }}>{resolveStockSituation(selectedItem) === "Crítico" ? "Estoque Baixo" : resolveStockSituation(selectedItem)}</span></span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Localização</span><span style={styles.detailValue}>{normalizeStockText(selectedItem.localizacao || "-")}</span></div>
          </div>
        </section>
      ) : null}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Tabela de estoque</h2>
        <div style={styles.infoRow}>
          <span>{filteredItems.length} registro(s) encontrado(s)</span>
        </div>
        <div style={styles.desktopTableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "80px" }}>Ver</th>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Categoria</th>
                <th style={styles.th}>Estoque Atual</th>
                <th style={styles.th}>Situação</th>
                <th style={styles.th}>Localização</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const situation = resolveStockSituation(item);
                const situationStyle = resolveStockSituationStyle(item);
                return (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      <button type="button" onClick={() => setSelectedItem(item)} style={styles.inlineInfoButton}>Ver</button>
                    </td>
                    <td style={styles.td}>{normalizeStockText(item.nome)}</td>
                    <td style={styles.td}>{normalizeStockText(item.categoria || "-")}</td>
                    <td style={styles.td}>{item.estoque_atual}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...situationStyle }}>
                        {situation === "Crítico" ? "Estoque Baixo" : situation}
                      </span>
                    </td>
                    <td style={styles.td}>{normalizeStockText(item.localizacao || "-")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Filtros do histórico</h2>
        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Produto</label>
            <select
              value={movementFilters.produto_id ?? ""}
              onChange={handleMovementFilterChange("produto_id")}
              style={styles.input}
            >
              <option value="">Todos</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {normalizeStockText(item.nome)}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Data Inicial</label>
            <input
              value={movementFilters.data_inicial ?? ""}
              onChange={(event) =>
                handleMovementFilterChange("data_inicial")({
                  target: { value: maskDate(event.target.value) },
                })
              }
              {...dateInputProps}
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Data Final</label>
            <input
              value={movementFilters.data_final ?? ""}
              onChange={(event) =>
                handleMovementFilterChange("data_final")({
                  target: { value: maskDate(event.target.value) },
                })
              }
              {...dateInputProps}
              style={styles.input}
            />
          </div>
        </div>
        <div style={styles.footerActions}>
          <button
            type="button"
            onClick={clearMovementFilters}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Limpar Histórico
          </button>
        </div>
      </section>

      {selectedMovement ? (
        <section style={styles.card}>
          <div style={styles.detailHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Detalhes da movimentação</h2>
              <p style={styles.sectionText}>Visualize os dados completos da movimentação selecionada.</p>
            </div>
            <div style={styles.actions}>
              <button type="button" onClick={() => setSelectedMovement(null)} style={{ ...styles.button, ...styles.secondaryButton }}>
                ← Voltar
              </button>
            </div>
          </div>
          <div style={styles.detailGrid}>
            <div style={styles.detailField}><span style={styles.detailLabel}>Data</span><span style={styles.detailValue}>{selectedMovement.data}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Tipo</span><span style={styles.detailValue}>{selectedMovement.tipo}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Produto</span><span style={styles.detailValue}>{selectedMovement.produto}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Quantidade</span><span style={styles.detailValue}>{selectedMovement.quantidade}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Saldo Anterior</span><span style={styles.detailValue}>{selectedMovement.saldo_anterior}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Saldo Atual</span><span style={styles.detailValue}>{selectedMovement.saldo_atual}</span></div>
            <div style={styles.detailField}><span style={styles.detailLabel}>Responsável</span><span style={styles.detailValue}>{selectedMovement.responsavel}</span></div>
            <div style={styles.detailField} className="detail-field-full"><span style={styles.detailLabel}>Observação</span><span style={styles.detailValue}>{selectedMovement.observacao}</span></div>
          </div>
        </section>
      ) : null}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Histórico de movimentações do estoque</h2>
        <div style={styles.infoRow}>
          <span>{movementRows.length} registro(s) encontrado(s)</span>
        </div>
        <div style={styles.desktopTableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "80px" }}>Ver</th>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Produto</th>
                <th style={styles.th}>Quantidade</th>
                <th style={styles.th}>Responsável</th>
              </tr>
            </thead>
            <tbody>
              {movementRows.map((item, index) => (
                <tr key={`${item.produto}-${item.data}-${index}`}>
                  <td style={styles.td}>
                    <button type="button" onClick={() => setSelectedMovement(item)} style={styles.inlineInfoButton}>Ver</button>
                  </td>
                  <td style={styles.td}>{item.data}</td>
                  <td style={styles.td}>{item.tipo}</td>
                  <td style={styles.td}>{item.produto}</td>
                  <td style={styles.td}>{item.quantidade}</td>
                  <td style={styles.td}>{item.responsavel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default StockReportPage;
