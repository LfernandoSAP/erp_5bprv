import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import ReportExportButtons from "../components/ReportExportButtons";
import SearchInputAction from "../components/SearchInputAction";
import { getMaterialBelicoList } from "../services/materialBelicoService";
import { getUnits } from "../services/referenceDataService";
import { readViewerAccess as readAuthAccess } from "../utils/authAccess";
import { buildCustodySummary } from "../utils/custodyLabels";
import {
  buildMaterialBelicoExtraColumns,
  formatMaterialBelicoFieldValue,
  getMaterialBelicoCategoryConfig,
  resolvePrimaryAsset,
  resolvePrimarySerial,
} from "../utils/materialBelicoUtils";
import { buildReportSubtitle } from "../utils/reportContext";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";
import { buildHierarchicalUnitLabelMap } from "../utils/unitOptions";
import {
  buildUnitFilterDescription,
  buildUnitFilterOptions,
  resolveEffectiveUnitFilter,
} from "../utils/unitFilters";

function MaterialBelicoList({ category, onBack, onMoveItem, onEditItem }) {
  const [items, setItems] = useState([]);
  const [viewingItem, setViewingItem] = useState(null);
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

  const categoryConfig = useMemo(
    () => getMaterialBelicoCategoryConfig(category),
    [category]
  );
  const extraColumns = useMemo(
    () => buildMaterialBelicoExtraColumns(category),
    [category]
  );

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
    const loadItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMaterialBelicoList({
          category,
          unitId: effectiveUnitFilter,
        });
        setItems(Array.isArray(data) ? data : []);
      } catch (currentError) {
        setError(currentError.message || "Falha ao carregar itens.");
      } finally {
        setLoading(false);
      }
    };

    void loadItems();
  }, [category, refreshKey, effectiveUnitFilter]);

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
        item.category,
        item.armamento_num_serie,
        item.armamento_patrimonio,
        item.algema_num_serie,
        item.algema_patrimonio,
        item.colete_num_serie,
        item.colete_patrimonio,
        item.item_name,
        item.lot_number,
        item.expiration_date,
        item.quantity,
        item.item_brand,
        item.item_model,
        item.item_type,
        item.item_gender,
        item.item_size,
        item.unit_label,
        item.cia_em,
        item.custody_sector_name,
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
      { key: "category", label: "Categoria", width: 18 },
      { key: "itemName", label: "Nome do Material", width: 24 },
      { key: "serial", label: "Número de série", width: 18 },
      { key: "asset", label: "Patrimônio", width: 18 },
      ...extraColumns.map((field) => ({
        key: field.key,
        label: field.label,
        width: 16,
      })),
      { key: "unit", label: "Unidade", width: 24 },
      { key: "custody", label: "Responsabilidade", width: 28 },
      { key: "status", label: "Status", width: 12 },
    ],
    [extraColumns]
  );

  const reportRows = useMemo(
    () =>
      filteredItems.map((item) => ({
        itemName: item.item_name || "-",
        category: item.category || category,
        serial: resolvePrimarySerial(item) || "-",
        asset: resolvePrimaryAsset(item) || "-",
        ...extraColumns.reduce((accumulator, field) => {
          accumulator[field.key] = formatMaterialBelicoFieldValue(field, item);
          return accumulator;
        }, {}),
        unit: item.unit_label || "-",
        custody: buildCustodySummary({
          custodyType: item.custody_type,
          custodySectorName: item.custody_sector_name,
          policeOfficerRe: item.assigned_officer_re,
          policeOfficerName: item.assigned_officer_name,
        }),
        status: item.is_active ? "Ativo" : "Inativo",
      })),
    [category, extraColumns, filteredItems]
  );

  const reportSubtitle = useMemo(
    () =>
      buildReportSubtitle({
        totalRows: reportRows.length,
        searchTerm,
        filterDescription,
        extraDetails: [`Categoria: ${category}`],
      }),
    [category, filterDescription, reportRows.length, searchTerm]
  );

  const activeItemsCount = useMemo(
    () => filteredItems.filter((item) => item.is_active).length,
    [filteredItems]
  );
  const inactiveItemsCount = filteredItems.length - activeItemsCount;

  const handleViewItem = (item) => {
    setViewingItem(item);
  };

  const handleCloseDetail = () => {
    setViewingItem(null);
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Consulta - {category}</h1>
        <p style={styles.subtitle}>
          Consulte os registros já cadastrados para esta categoria de material
          bélico.
        </p>

        <div style={styles.actions}>
          <button
            onClick={onBack}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
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
          Filtre por categoria, número de série, patrimônio, unidade ou
          responsabilidade atual.
        </p>

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
        <p style={{ ...styles.helperText, marginTop: "12px" }}>
          {filterDescription}
        </p>
      </section>

      {loading && <div style={styles.page}>Carregando...</div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      {!loading && !error && (
        <section style={{ ...styles.tableCard, marginTop: "24px" }}>
          {viewingItem && (
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
                  <h2 style={styles.sectionTitle}>Detalhes do material bélico</h2>
                  <p style={styles.sectionText}>
                    Consulte todos os dados do registro selecionado.
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
                    onClick={() => onEditItem(viewingItem.id)}
                    style={{ ...styles.button, ...styles.primaryButton }}
                  >
                    ✏ Editar
                  </button>
                </div>
              </div>

              <DetailSection
                title="Dados principais"
                fields={[
                  ["Nome do material", viewingItem.item_name || "-"],
                  ["Categoria", viewingItem.category || category],
                  ["Número de série", resolvePrimarySerial(viewingItem) || "-"],
                  ["Patrimônio", resolvePrimaryAsset(viewingItem) || "-"],
                  ["Unidade", viewingItem.unit_label || "-"],
                  [
                    "Responsabilidade",
                    buildCustodySummary({
                      custodyType: viewingItem.custody_type,
                      custodySectorName: viewingItem.custody_sector_name,
                      policeOfficerRe: viewingItem.assigned_officer_re,
                      policeOfficerName: viewingItem.assigned_officer_name,
                    }),
                  ],
                  ["Status", viewingItem.is_active ? "Ativo" : "Inativo"],
                ]}
              />

              {extraColumns.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <DetailSection
                    title="Informações complementares"
                    fields={extraColumns.map((field) => [
                      field.label,
                      formatMaterialBelicoFieldValue(field, viewingItem),
                    ])}
                  />
                </div>
              )}

              <div style={{ ...styles.actions, marginTop: "18px" }}>
                <button
                  type="button"
                  onClick={() => onMoveItem(viewingItem.id)}
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
              <p style={styles.tableMeta}>
                {filteredItems.length} registro(s) encontrado(s)
              </p>
            </div>
            <ReportExportButtons
              disabled={reportRows.length === 0}
              onExportExcel={() =>
                exportExcelReport({
                  fileBaseName: `material-belico-${category}`,
                  sheetName: "MaterialBelico",
                  title: `Relatório - ${category}`,
                  subtitle: reportSubtitle,
                  columns: reportColumns,
                  rows: reportRows,
                })
              }
              onExportPdf={() =>
                exportPdfReport({
                  fileBaseName: `material-belico-${category}`,
                  title: `Relatório - ${category}`,
                  subtitle: reportSubtitle,
                  columns: reportColumns,
                  rows: reportRows,
                  orientation: "landscape",
                })
              }
            />
          </div>

          <div style={{ padding: "20px 20px 0" }}>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <p style={styles.summaryLabel}>Registros filtrados</p>
                <p style={styles.summaryValue}>{filteredItems.length}</p>
              </div>
              <div style={styles.summaryCard}>
                <p style={styles.summaryLabel}>Ativos</p>
                <p style={styles.summaryValue}>{activeItemsCount}</p>
              </div>
              <div style={styles.summaryCard}>
                <p style={styles.summaryLabel}>Inativos</p>
                <p style={styles.summaryValue}>{inactiveItemsCount}</p>
              </div>
              <div style={styles.summaryCard}>
                <p style={styles.summaryLabel}>Escopo da consulta</p>
                <p style={{ ...styles.summaryValue, ...styles.summaryValueSoft }}>
                  {filterDescription}
                </p>
              </div>
            </div>
          </div>

          <div className="desktop-table-view" style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: "60px", whiteSpace: "nowrap" }}>Ver</th>
                  <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>Nome do material</th>
                  <th style={{ ...styles.th, width: "180px", whiteSpace: "nowrap" }}>Categoria</th>
                  <th style={{ ...styles.th, width: "180px", whiteSpace: "nowrap" }}>Unidade</th>
                  <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>Responsabilidade</th>
                  <th style={{ ...styles.th, width: "110px", whiteSpace: "nowrap" }}>Status</th>
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
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
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
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>{item.item_name || "-"}</td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>{item.category || category}</td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>{item.unit_label || "-"}</td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {buildCustodySummary({
                        custodyType: item.custody_type,
                        custodySectorName: item.custody_sector_name,
                        policeOfficerRe: item.assigned_officer_re,
                        policeOfficerName: item.assigned_officer_name,
                      })}
                    </td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(item.is_active
                            ? styles.activeBadge
                            : styles.inactiveBadge),
                        }}
                      >
                        {item.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredItems.length === 0 && (
              <div style={styles.emptyState}>
                Nenhum registro encontrado. Ajuste o filtro ou recarregue a
                consulta.
              </div>
            )}
          </div>

          {filteredItems.length > 0 && (
            <div className="mobile-card-view" style={styles.mobileCards}>
              {filteredItems.map((item) => (
                <article key={item.id} style={styles.mobileCard}>
                  <div style={styles.mobileCardHeader}>
                    <div>
                      <h3 style={styles.mobileCardTitle}>
                        {item.category || category}
                      </h3>
                      <p style={styles.mobileCardMeta}>Registro #{item.id}</p>
                    </div>
                    <span
                      style={{
                        ...styles.badge,
                        ...(item.is_active
                          ? styles.activeBadge
                          : styles.inactiveBadge),
                      }}
                    >
                      {item.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div style={styles.mobileCardGrid}>
                    <div style={styles.mobileCardRow}>
                      <p style={styles.mobileCardLabel}>Nome do Material</p>
                      <p style={styles.mobileCardValue}>{item.item_name || "-"}</p>
                    </div>
                    <div style={styles.mobileCardRow}>
                      <p style={styles.mobileCardLabel}>
                        {categoryConfig.showPrimary
                          ? categoryConfig.primaryLabel
                          : extraColumns[0]?.label || "Campo principal"}
                      </p>
                      <p style={styles.mobileCardValue}>
                        {resolvePrimarySerial(item) ||
                          formatMaterialBelicoFieldValue(
                            extraColumns[0] || { key: "" },
                            item
                          )}
                      </p>
                    </div>
                    {categoryConfig.showAsset && (
                      <div style={styles.mobileCardRow}>
                        <p style={styles.mobileCardLabel}>Patrimônio</p>
                        <p style={styles.mobileCardValue}>
                          {resolvePrimaryAsset(item) || "-"}
                        </p>
                      </div>
                    )}
                    {extraColumns
                      .slice(categoryConfig.showPrimary ? 0 : 1)
                      .map((field) => (
                        <div key={field.key} style={styles.mobileCardRow}>
                          <p style={styles.mobileCardLabel}>{field.label}</p>
                          <p style={styles.mobileCardValue}>
                            {formatMaterialBelicoFieldValue(field, item)}
                          </p>
                        </div>
                      ))}
                    <div style={styles.mobileCardRow}>
                      <p style={styles.mobileCardLabel}>Unidade</p>
                      <p style={styles.mobileCardValue}>{item.unit_label || "-"}</p>
                    </div>
                    <div style={styles.mobileCardRow}>
                      <p style={styles.mobileCardLabel}>Responsabilidade</p>
                      <p style={styles.mobileCardValue}>
                        {buildCustodySummary({
                          custodyType: item.custody_type,
                          custodySectorName: item.custody_sector_name,
                          policeOfficerRe: item.assigned_officer_re,
                          policeOfficerName: item.assigned_officer_name,
                        })}
                      </p>
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
                      onClick={() => onEditItem(item.id)}
                      style={{
                        ...styles.button,
                        ...styles.secondaryButton,
                        ...styles.tableActionButton,
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onMoveItem(item.id)}
                      style={{
                        ...styles.button,
                        ...styles.primaryButton,
                        ...styles.tableActionButton,
                      }}
                    >
                      Movimentar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default MaterialBelicoList;

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
      <h3 style={{ ...styles.sectionTitle, marginBottom: "14px", fontSize: "1rem" }}>{title}</h3>
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


