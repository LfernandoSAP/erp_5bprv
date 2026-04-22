import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import ReportExportButtons from "../components/ReportExportButtons";
import SearchInputAction from "../components/SearchInputAction";
import { buildCustodySummary } from "../utils/custodyLabels";
import { getMaterialBelicoControleGeral } from "../services/materialBelicoService";
import { getUnits } from "../services/referenceDataService";
import { readViewerAccess as readAuthAccess } from "../utils/authAccess";
import { buildReportSubtitle } from "../utils/reportContext";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";
import { buildHierarchicalUnitLabelMap } from "../utils/unitOptions";
import {
  buildUnitFilterDescription,
  buildUnitFilterOptions,
  resolveEffectiveUnitFilter,
} from "../utils/unitFilters";

function MaterialBelicoControleGeralList({ onBack, onMoveItem, onEditItem }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [units, setUnits] = useState([]);
  const [unitMap, setUnitMap] = useState({});
  const [viewerAccess, setViewerAccess] = useState({
    unitId: null,
    unitType: null,
    unitLabel: null,
    canViewAll: false,
  });
  const [selectedUnitFilter, setSelectedUnitFilter] = useState("ALL_VISIBLE");

  const effectiveUnitFilter = useMemo(
    () => resolveEffectiveUnitFilter(selectedUnitFilter, viewerAccess.unitId),
    [selectedUnitFilter, viewerAccess.unitId]
  );

  const filterUnitOptions = useMemo(
    () => buildUnitFilterOptions(units, viewerAccess),
    [units, viewerAccess]
  );

  const filterDescription = useMemo(
    () =>
      buildUnitFilterDescription({
        selectedUnitFilter,
        units,
        unitMap,
        viewerAccess,
      }),
    [selectedUnitFilter, units, unitMap, viewerAccess]
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setItems([]);

      try {
        const data = await getMaterialBelicoControleGeral({
          unitId: effectiveUnitFilter,
        });
        if (!Array.isArray(data)) {
          throw new Error("Resposta inválida: esperado array");
        }

        setItems(data);
      } catch (currentError) {
        console.error("Erro ao buscar controle geral", currentError);
        setError(
          currentError instanceof Error ? currentError.message : String(currentError)
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [refreshKey, effectiveUnitFilter]);

  useEffect(() => {
    setViewerAccess(readAuthAccess());
    const loadUnits = async () => {
      try {
        const data = await getUnits();
        setUnits(data);
        setUnitMap(buildHierarchicalUnitLabelMap(data));
      } catch {
        // ignore
      }
    };
    void loadUnits();
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) {
      return items;
    }

    return items.filter((item) =>
      [
        item.posto_grad,
        item.re,
        item.nome,
        item.item_name,
        item.unit_label,
        item.cia_em,
        item.opm_atual,
        item.armamento_num_serie,
        item.armamento_patrimonio,
        item.assigned_officer_re,
        item.assigned_officer_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedTerm)
    );
  }, [items, searchTerm]);

  const reportColumns = useMemo(
    () => [
      { key: "rank", label: "Posto/Grad", width: 16 },
      { key: "re", label: "RE", width: 14 },
      { key: "name", label: "Nome", width: 22 },
      { key: "itemName", label: "Nome do Material", width: 24 },
      { key: "unit", label: "Unidade", width: 24 },
      { key: "custody", label: "Responsabilidade", width: 28 },
      { key: "weaponSerial", label: "Armamento série", width: 18 },
      { key: "weaponAsset", label: "Armamento patrimônio", width: 18 },
      { key: "ammoLot", label: "Munição/Lote", width: 16 },
      { key: "handcuffSerial", label: "Algema série", width: 16 },
      { key: "vestSerial", label: "Colete série", width: 16 },
    ],
    []
  );

  const reportRows = useMemo(
    () =>
      filteredItems.map((item) => ({
        rank: item.posto_grad || "-",
        re: item.re || "-",
        name: item.nome || "-",
        itemName: item.item_name || "-",
        unit: item.unit_label || "-",
        custody: buildCustodySummary({
          custodyType: item.custody_type,
          custodySectorName: item.custody_sector_name,
          policeOfficerRe: item.assigned_officer_re,
          policeOfficerName: item.assigned_officer_name,
        }),
        weaponSerial: item.armamento_num_serie || "-",
        weaponAsset: item.armamento_patrimonio || "-",
        ammoLot: item.municao_lote || "-",
        handcuffSerial: item.algema_num_serie || "-",
        vestSerial: item.colete_num_serie || "-",
      })),
    [filteredItems]
  );

  const reportSubtitle = useMemo(
    () =>
      buildReportSubtitle({
        totalRows: reportRows.length,
        searchTerm,
        filterDescription,
        extraDetails: ["Controle geral do material bélico"],
      }),
    [filterDescription, reportRows.length, searchTerm]
  );

  const handleViewItem = (item) => {
    setSelectedItem(item);
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Consultar controle geral</h1>
        <p style={styles.subtitle}>
          Consulte os registros consolidados do controle de material bélico do
          5BPRv.
        </p>

        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
          <button
            onClick={() => setRefreshKey((prev) => prev + 1)}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            Recarregar
          </button>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Pesquisa de registros</h2>
        <p style={styles.sectionText}>
          Filtre por policial, RE, unidade, CIA/EM ou dados do armamento.
        </p>

        <div style={styles.infoBox}>
          Esta visão consolida várias categorias em uma única tabela. Use o
          filtro para localizar rapidamente o policial, a unidade ou o dado
          principal do registro.
        </div>

        <div style={styles.actions}>
          <select
            value={selectedUnitFilter}
            onChange={(event) => setSelectedUnitFilter(event.target.value)}
            style={{ ...styles.input, ...styles.actionField }}
          >
            <option value="ALL_VISIBLE">Todas as unidades visíveis</option>
            {viewerAccess.unitId && (
              <option value="SELF">
                {`Somente minha unidade (${viewerAccess.unitLabel || "unidade atual"})`}
              </option>
            )}
            {filterUnitOptions.map((unit) => (
              <option key={unit.id} value={String(unit.id)}>
                {unitMap[unit.id] ?? unit.name}
              </option>
            ))}
          </select>
          <SearchInputAction
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onSearch={() => {}}
            placeholder="Digite para filtrar a lista"
            style={styles.actionFieldWide}
          />
        </div>
        <p style={{ ...styles.helperText, marginTop: "12px" }}>{filterDescription}</p>
      </section>

      {loading && (
        <div style={styles.page}>
          <div style={styles.loadingCard}>
            Carregando controle geral e consolidando os registros de material
            bélico...
          </div>
        </div>
      )}
      {error && <div style={styles.errorBox}>{error}</div>}

      {!loading && !error && (
        <section style={{ ...styles.tableCard, marginTop: "24px" }}>
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
                  <h2 style={styles.sectionTitle}>Detalhes do registro</h2>
                  <p style={styles.sectionText}>
                    Consulte os dados completos do controle geral selecionado.
                  </p>
                </div>
                <div style={styles.tableHeaderActions}>
                  <button
                    type="button"
                    onClick={handleCloseDetail}
                    style={{ ...styles.button, ...styles.secondaryButton }}
                  >
                    ← Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditItem(selectedItem.id)}
                    style={{ ...styles.button, ...styles.primaryButton }}
                  >
                    ✏ Editar
                  </button>
                </div>
              </div>

              <DetailSection
                title="Policial"
                fields={[
                  ["Posto/Graduação", selectedItem.posto_grad || "-"],
                  ["RE", selectedItem.re || "-"],
                  ["Nome", selectedItem.nome || "-"],
                  ["Unidade", selectedItem.unit_label || "-"],
                  ["CIA/EM", selectedItem.cia_em || "CIA/EM não informado"],
                  ["Responsabilidade", buildCustodySummary({
                    custodyType: selectedItem.custody_type,
                    custodySectorName: selectedItem.custody_sector_name,
                    policeOfficerRe: selectedItem.assigned_officer_re,
                    policeOfficerName: selectedItem.assigned_officer_name,
                  })],
                ]}
              />

              <div style={{ marginTop: "16px" }}>
                <DetailSection
                  title="Material"
                  fields={[
                    ["Nome do material", selectedItem.item_name || "-"],
                    ["Armamento série", selectedItem.armamento_num_serie || "-"],
                    ["Armamento patrimônio", selectedItem.armamento_patrimonio || "-"],
                    ["Munição/Lote", selectedItem.municao_lote || "-"],
                    ["Algema série", selectedItem.algema_num_serie || "-"],
                    ["Algema patrimônio", selectedItem.algema_patrimonio || "-"],
                    ["Colete série", selectedItem.colete_num_serie || "-"],
                    ["Colete patrimônio", selectedItem.colete_patrimonio || "-"],
                  ]}
                />
              </div>

              <div style={{ ...styles.actions, marginTop: "18px" }}>
                <button
                  type="button"
                  onClick={() => onMoveItem(selectedItem.id)}
                  style={{ ...styles.button, ...styles.primaryButton }}
                >
                  Movimentar
                </button>
              </div>
            </section>
          )}

          <div style={styles.tableHeader}>
            <div>
              <h2 style={styles.tableTitle}>Lista de registros</h2>
              <p style={styles.tableMeta}>{filteredItems.length} registro(s) encontrado(s)</p>
            </div>
            <ReportExportButtons
              disabled={reportRows.length === 0}
              onExportExcel={() =>
                exportExcelReport({
                  fileBaseName: "material-belico-controle-geral",
                  sheetName: "ControleGeral",
                  title: "Relatório de controle geral",
                  subtitle: reportSubtitle,
                  columns: reportColumns,
                  rows: reportRows,
                })
              }
              onExportPdf={() =>
                exportPdfReport({
                  fileBaseName: "material-belico-controle-geral",
                  title: "Relatório de controle geral",
                  subtitle: reportSubtitle,
                  columns: reportColumns,
                  rows: reportRows,
                  orientation: "landscape",
                })
              }
            />
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: "60px", whiteSpace: "nowrap" }}>
                    Ver
                  </th>
                  <th style={{ ...styles.th, width: "140px", whiteSpace: "nowrap" }}>
                    Posto/Grad
                  </th>
                  <th style={{ ...styles.th, width: "110px", whiteSpace: "nowrap" }}>
                    RE
                  </th>
                  <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>
                    Nome
                  </th>
                  <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>
                    Nome do material
                  </th>
                  <th style={{ ...styles.th, width: "180px", whiteSpace: "nowrap" }}>
                    Unidade
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
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
                      {item.posto_grad || "-"}
                    </td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {item.re || "-"}
                    </td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {item.nome || "-"}
                    </td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 600 }}>{item.item_name || "-"}</div>
                      <div style={styles.helperText}>
                        {item.armamento_num_serie ||
                          item.algema_num_serie ||
                          item.colete_num_serie ||
                          "-"}
                      </div>
                    </td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 600 }}>{item.unit_label || "-"}</div>
                      <div style={styles.helperText}>
                        {item.cia_em || "CIA/EM não informado"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredItems.length === 0 && (
              <div style={styles.emptyStateCard}>
                <p style={styles.emptyStateTitle}>Nenhum registro encontrado</p>
                <p style={styles.emptyStateText}>
                  Revise os filtros aplicados ou recarregue a consulta para
                  buscar novamente.
                </p>
              </div>
            )}
          </div>
        </section>
      )}
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

export default MaterialBelicoControleGeralList;
