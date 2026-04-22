import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import ReportExportButtons from "../components/ReportExportButtons";
import { getItems, restoreItem } from "../services/itemService";
import { getSectors, getUnits } from "../services/referenceDataService";
import { buildReportSubtitle } from "../utils/reportContext";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";
import { buildSectorLabelMap } from "../utils/sectorOptions";
import { buildHierarchicalUnitLabelMap } from "../utils/unitOptions";

function InactiveItems({ onBack }) {
  const [items, setItems] = useState([]);
  const [unitMap, setUnitMap] = useState({});
  const [sectorMap, setSectorMap] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadInactiveItems() {
    try {
      setError("");
      const data = await getItems(true);
      const inactiveOnly = data.filter((item) => item.is_active === false);
      setItems(inactiveOnly);
    } catch (currentError) {
      console.error("Erro ao carregar itens inativos:", currentError);
      setError(currentError.message || "Erro ao carregar itens inativos.");
    }
  }

  async function loadUnits() {
    try {
      const data = await getUnits({ activeOnly: false });
      setUnitMap(buildHierarchicalUnitLabelMap(data));
    } catch {
      setUnitMap({});
    }
  }

  async function loadSectors() {
    try {
      const data = await getSectors({ activeOnly: false, includeInactive: true });
      setSectorMap(buildSectorLabelMap(data));
    } catch {
      setSectorMap({});
    }
  }

  useEffect(() => {
    void loadUnits();
    void loadSectors();
    void loadInactiveItems();
  }, []);

  const reportColumns = useMemo(
    () => [
      { key: "name", label: "Nome", width: 22 },
      { key: "category", label: "Categoria", width: 16 },
      { key: "status", label: "Status", width: 14 },
      { key: "serialNumber", label: "Número de série", width: 18 },
      { key: "assetTag", label: "Patrimônio", width: 18 },
      { key: "unit", label: "Unidade", width: 24 },
      { key: "sector", label: "Setor", width: 22 },
      { key: "active", label: "Ativo", width: 10 },
    ],
    []
  );

  const reportRows = useMemo(
    () =>
      items.map((item) => ({
        name: item.name,
        category: item.category || "-",
        status: formatItemStatus(item.status),
        serialNumber: item.serial_number || "-",
        assetTag: item.asset_tag || "-",
        unit: unitMap[item.unit_id] ?? item.unit_id,
        sector: sectorMap[item.sector_id] ?? "-",
        active: "Não",
      })),
    [items, sectorMap, unitMap]
  );

  const reportSubtitle = useMemo(
    () =>
      buildReportSubtitle({
        totalRows: reportRows.length,
        extraDetails: ["Somente registros inativos"],
      }),
    [reportRows.length]
  );

  const handleViewItem = (item) => {
    setSelectedItem(item);
  };

  const handleCloseDetails = () => {
    setSelectedItem(null);
  };

  const handleRestore = async (itemId) => {
    try {
      setError("");
      setSuccess("");
      await restoreItem(itemId);
      setSuccess("Material restaurado com sucesso!");
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }
      await loadInactiveItems();
    } catch (currentError) {
      console.error("Erro ao restaurar item:", currentError);
      setError(currentError.message || "Erro ao restaurar material");
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Materiais inativos</h1>
        <p style={styles.subtitle}>
          Consulte materiais inativados e restaure registros quando necessário.
        </p>

        <div style={styles.actions}>
          <button
            onClick={onBack}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Voltar
          </button>
        </div>
      </section>

      {error && (
        <div style={styles.errorBox}>
          <strong>Erro:</strong> {error}
        </div>
      )}
      {success && <div style={styles.successBox}>{success}</div>}

      <section style={{ ...styles.card, marginBottom: "24px" }}>
        <h2 style={styles.sectionTitle}>Consulta de registros inativos</h2>
        <p style={styles.sectionText}>
          Os materiais desta tela já foram retirados da lista principal e podem
          ser restaurados quando necessário.
        </p>
        <div style={styles.infoBox}>
          Esta tela é útil para auditoria, revisão de baixas e restauração
          pontual de registros.
        </div>
      </section>

      <section style={styles.tableCard}>
        {selectedItem && (
          <section style={{ ...styles.card, margin: "20px 20px 0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "12px",
              }}
            >
              <div>
                <h2 style={styles.sectionTitle}>Detalhes do material</h2>
                <p style={styles.sectionText}>
                  Consulte os dados do material inativo selecionado.
                </p>
              </div>
              <div style={styles.tableHeaderActions}>
                <button
                  type="button"
                  onClick={handleCloseDetails}
                  style={{ ...styles.button, ...styles.secondaryButton }}
                >
                  ← Voltar
                </button>
              </div>
            </div>

            <DetailSection
              title="Identificação"
              fields={[
                ["Nome", selectedItem.name || "-"],
                ["Categoria", selectedItem.category || "-"],
                ["Status", formatItemStatus(selectedItem.status)],
                ["Número de série", selectedItem.serial_number || "-"],
                ["Patrimônio", selectedItem.asset_tag || "-"],
                ["Unidade", unitMap[selectedItem.unit_id] ?? selectedItem.unit_id],
                ["Setor", sectorMap[selectedItem.sector_id] ?? "-"],
                ["Ativo", "Não"],
              ]}
            />

            <div style={{ ...styles.actions, marginTop: "18px" }}>
              <button
                type="button"
                onClick={() => handleRestore(selectedItem.id)}
                style={{ ...styles.button, ...styles.primaryButton }}
              >
                Restaurar
              </button>
            </div>
          </section>
        )}

        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.tableTitle}>Lista de materiais inativos</h2>
            <p style={styles.tableMeta}>{items.length} registro(s) encontrado(s)</p>
          </div>
          <ReportExportButtons
            disabled={reportRows.length === 0}
            onExportExcel={() =>
              exportExcelReport({
                fileBaseName: "materiais-inativos",
                sheetName: "Inativos",
                title: "Relatório de materiais inativos",
                subtitle: reportSubtitle,
                columns: reportColumns,
                rows: reportRows,
              })
            }
            onExportPdf={() =>
              exportPdfReport({
                fileBaseName: "materiais-inativos",
                title: "Relatório de materiais inativos",
                subtitle: reportSubtitle,
                columns: reportColumns,
                rows: reportRows,
                orientation: "landscape",
              })
            }
          />
        </div>

        <div className="desktop-table-view" style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "60px", whiteSpace: "nowrap" }}>
                  Ver
                </th>
                <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>
                  Nome
                </th>
                <th style={{ ...styles.th, width: "180px", whiteSpace: "nowrap" }}>
                  Categoria
                </th>
                <th style={{ ...styles.th, width: "180px", whiteSpace: "nowrap" }}>
                  Unidade
                </th>
                <th style={{ ...styles.th, width: "160px", whiteSpace: "nowrap" }}>
                  Setor
                </th>
                <th style={{ ...styles.th, width: "110px", whiteSpace: "nowrap" }}>
                  Ativo
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  style={
                    index % 2 === 1
                      ? { backgroundColor: "var(--app-surface-muted)" }
                      : undefined
                  }
                >
                  <td style={{ ...styles.td, padding: "10px 12px" }}>
                    <button
                      type="button"
                      onClick={() => handleViewItem(item)}
                      style={{
                        ...styles.button,
                        ...styles.infoButton,

                        border: "1px solid var(--app-border-strong)",
                        padding: "8px 12px",
                        fontSize: "0.84rem",
                        minWidth: "52px",
                      }}
                    >
                      Ver
                    </button>
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={styles.helperText}>
                      {item.serial_number || item.asset_tag || "-"}
                    </div>
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {item.category || "-"}
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {unitMap[item.unit_id] ?? item.unit_id}
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {sectorMap[item.sector_id] ?? "-"}
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    <span style={{ ...styles.badge, ...styles.inactiveBadge }}>
                      Não
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {items.length === 0 && (
            <div style={styles.emptyStateCard}>
              <p style={styles.emptyStateTitle}>Nenhum material inativo encontrado</p>
              <p style={styles.emptyStateText}>
                Quando houver registros inativados, eles aparecerão aqui para
                consulta e restauração.
              </p>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="mobile-card-view" style={styles.mobileCards}>
            {items.map((item) => (
              <article key={item.id} style={styles.mobileCard}>
                <div style={styles.mobileCardHeader}>
                  <div>
                    <h3 style={styles.mobileCardTitle}>{item.name}</h3>
                    <p style={styles.mobileCardMeta}>{item.category || "-"}</p>
                  </div>
                  <span style={{ ...styles.badge, ...styles.inactiveBadge }}>Não</span>
                </div>

                <div style={styles.mobileCardGrid}>
                  <div style={styles.mobileCardRow}>
                    <p style={styles.mobileCardLabel}>Unidade</p>
                    <p style={styles.mobileCardValue}>
                      {unitMap[item.unit_id] ?? item.unit_id}
                    </p>
                  </div>
                  <div style={styles.mobileCardRow}>
                    <p style={styles.mobileCardLabel}>Setor</p>
                    <p style={styles.mobileCardValue}>{sectorMap[item.sector_id] ?? "-"}</p>
                  </div>
                </div>

                <div style={styles.mobileCardActions}>
                  <button
                    onClick={() => handleViewItem(item)}
                    style={{
                      ...styles.button,
                      ...styles.secondaryButton,
                      ...styles.tableActionButton,
                    }}
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => handleRestore(item.id)}
                    style={{
                      ...styles.button,
                      ...styles.primaryButton,
                      ...styles.tableActionButton,
                    }}
                  >
                    Restaurar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DetailSection({ title, fields }) {
  return (
    <section
      style={{
        padding: "18px",
        borderRadius: "18px",
        border: "1px solid var(--app-border)",
        backgroundColor: "var(--app-surface-muted)",
      }}
    >
      <h3 style={{ ...styles.sectionTitle, marginBottom: "14px", fontSize: "1rem" }}>
        {title}
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
        }}
      >
        {fields.map(([label, value]) => (
          <div key={`${title}-${label}`} style={styles.field}>
            <span style={styles.label}>{label}</span>
            <div
              style={{
                ...styles.input,
                minHeight: "48px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {value || "-"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatItemStatus(status) {
  const statusMap = {
    EM_USO: "Em uso",
    EM_ESTOQUE: "Em estoque",
    MANUTENCAO: "Manutenção",
    BAIXADO: "Baixado",
  };

  return statusMap[status] || status || "-";
}

export default InactiveItems;
