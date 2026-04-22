import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
} from "@mui/material";

import { appShellStyles as styles } from "../components/appShellStyles";
import ReportExportButtons from "../components/ReportExportButtons";
import SearchInputAction from "../components/SearchInputAction";
import { deleteItem, getItems, searchItems } from "../services/itemService";
import { getSectors, getUnits } from "../services/referenceDataService";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";
import { buildReportSubtitle } from "../utils/reportContext";
import { readViewerAccess as readAuthAccess } from "../utils/authAccess";
import { buildCustodySummary } from "../utils/custodyLabels";
import { buildSectorLabelMap } from "../utils/sectorOptions";
import { buildHierarchicalUnitLabelMap } from "../utils/unitOptions";

function Items({ onBack, onNewItem, onEditItem, onMoveItem, refreshKey }) {
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [unitMap, setUnitMap] = useState({});
  const [sectorMap, setSectorMap] = useState({});
  const [viewerAccess, setViewerAccess] = useState({
    unitId: null,
    unitType: null,
    unitLabel: null,
    canViewAll: false,
  });
  const [search, setSearch] = useState("");
  const [selectedUnitFilter, setSelectedUnitFilter] = useState("ALL_VISIBLE");
  const [viewingItem, setViewingItem] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);

  const effectiveUnitFilter = useMemo(() => {
    if (selectedUnitFilter === "SELF") {
      return viewerAccess.unitId;
    }
    if (selectedUnitFilter === "ALL_VISIBLE") {
      return null;
    }
    return selectedUnitFilter || null;
  }, [selectedUnitFilter, viewerAccess.unitId]);

  const filterUnitOptions = useMemo(() => {
    const byParent = new Map();
    for (const unit of units) {
      const parentId = unit.parent_unit_id ?? unit.parent_id ?? null;
      if (!byParent.has(parentId)) {
        byParent.set(parentId, []);
      }
      byParent.get(parentId).push(unit);
    }

    const descendants = [];
    const collect = (parentId) => {
      const children = byParent.get(parentId) || [];
      for (const child of children) {
        descendants.push(child);
        collect(child.id);
      }
    };

    if (viewerAccess.canViewAll || !viewerAccess.unitId) {
      return units;
    }

    if (viewerAccess.unitType === "batalhao" || viewerAccess.unitType === "cia") {
      const rootUnit = units.find((unit) => String(unit.id) === String(viewerAccess.unitId));
      if (!rootUnit) {
        return [];
      }
      descendants.push(rootUnit);
      collect(rootUnit.id);
      if (viewerAccess.unitType === "batalhao") {
        return descendants.filter((unit) => unit.type === "cia");
      }
      return descendants.filter((unit) => String(unit.id) !== String(viewerAccess.unitId));
    }

    return units.filter((unit) => String(unit.id) === String(viewerAccess.unitId));
  }, [units, viewerAccess]);

  const filterDescription = useMemo(() => {
    if (selectedUnitFilter === "ALL_VISIBLE") {
      return "A busca considera todas as unidades visíveis dentro do seu escopo.";
    }

    if (selectedUnitFilter === "SELF") {
      return `A busca considera somente a sua unidade: ${viewerAccess.unitLabel || "unidade atual"}.`;
    }

    const selectedUnit = units.find((unit) => String(unit.id) === String(selectedUnitFilter));
    if (!selectedUnit) {
      return "Selecione uma unidade para restringir a busca.";
    }

    if (selectedUnit.type === "cia") {
      return `A busca considera ${selectedUnit.name} e os pelotões subordinados.`;
    }

    return `A busca considera somente ${unitMap[selectedUnit.id] ?? selectedUnit.name}.`;
  }, [selectedUnitFilter, units, unitMap, viewerAccess.unitLabel]);

  const visibleItems = useMemo(() => {
    if (!items.length || effectiveUnitFilter == null) {
      return items;
    }

    const byParent = new Map();
    for (const unit of units) {
      const parentId = unit.parent_unit_id ?? unit.parent_id ?? null;
      if (!byParent.has(parentId)) {
        byParent.set(parentId, []);
      }
      byParent.get(parentId).push(unit);
    }

    const allowedUnitIds = new Set();
    const collect = (unitId) => {
      if (allowedUnitIds.has(unitId)) {
        return;
      }
      allowedUnitIds.add(unitId);
      const children = byParent.get(unitId) || [];
      for (const child of children) {
        collect(child.id);
      }
    };

    const selectedUnit = units.find((unit) => String(unit.id) === String(effectiveUnitFilter));
    if (!selectedUnit) {
      return items;
    }

    if (selectedUnitFilter === "SELF" || selectedUnit.type !== "cia") {
      allowedUnitIds.add(Number(effectiveUnitFilter));
    } else {
      collect(Number(effectiveUnitFilter));
    }

    return items.filter((item) => allowedUnitIds.has(Number(item.unit_id)));
  }, [effectiveUnitFilter, items, selectedUnitFilter, units]);

  const reportColumns = useMemo(
    () => [
      { key: "name", label: "Nome", width: 22 },
      { key: "modelo", label: "Modelo", width: 22 },
      { key: "category", label: "Categoria", width: 18 },
      { key: "status", label: "Status", width: 14 },
      { key: "serialNumber", label: "Número de série", width: 18 },
      { key: "assetTag", label: "Patrimônio", width: 18 },
      { key: "unit", label: "Unidade", width: 28 },
      { key: "custody", label: "Responsabilidade", width: 30 },
      { key: "location", label: "Local", width: 22 },
      { key: "active", label: "Ativo", width: 10 },
    ],
    []
  );

  const reportRows = useMemo(
    () =>
      visibleItems.map((item) => ({
        name: item.name,
        modelo: item.modelo || "-",
        category: item.category,
        status: formatItemStatus(item.status),
        serialNumber: item.serial_number || "-",
        assetTag: item.asset_tag || "-",
        unit: item.unit_label ?? unitMap[item.unit_id] ?? item.unit_id,
        custody: buildCustodySummary({
          custodyType: item.custody_type,
          custodySectorName:
            sectorMap[item.custody_sector_id] ?? item.custody_sector_name,
          policeOfficerRe: item.police_officer_re,
          policeOfficerName: item.police_officer_name,
          fleetVehicleLabel: item.fleet_vehicle_label,
        }),
        location: item.location || "-",
        active: item.is_active ? "Sim" : "Não",
      })),
    [sectorMap, unitMap, visibleItems]
  );
  const reportSubtitle = useMemo(
    () =>
      buildReportSubtitle({
        totalRows: reportRows.length,
        searchTerm: search,
        filterDescription,
      }),
    [filterDescription, reportRows.length, search]
  );
  const activeVisibleItemsCount = useMemo(
    () => visibleItems.filter((item) => item.is_active).length,
    [visibleItems]
  );
  const inactiveVisibleItemsCount = visibleItems.length - activeVisibleItemsCount;

  async function runItemsRequest(loader) {
    const requestId = requestSequence.current + 1;
    requestSequence.current = requestId;

    const data = await loader();
    if (requestSequence.current === requestId) {
      setItems(data);
    }
  }

  async function loadItems() {
    try {
      setError("");
      await runItemsRequest(() => getItems(false, effectiveUnitFilter));
    } catch (err) {
      console.error("Erro ao carregar itens:", err);
      setError(err.message || "Erro ao carregar itens.");
    }
  }

  async function loadUnits() {
    try {
      const data = await getUnits();
      setUnits(data);
      setUnitMap(buildHierarchicalUnitLabelMap(data));
    } catch (err) {
      console.error("Erro ao carregar unidades:", err);
    }
  }

  async function loadSectors() {
    try {
      const data = await getSectors();
      setSectorMap(buildSectorLabelMap(data));
    } catch (err) {
      console.error("Erro ao carregar setores:", err);
    }
  }

  useEffect(() => {
    setViewerAccess(readAuthAccess());
    loadUnits();
    loadSectors();
  }, [refreshKey]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (search.trim()) {
      handleSearch();
      return;
    }
    loadItems();
  }, [refreshKey, effectiveUnitFilter]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleSearch = async () => {
    try {
      setError("");

      if (search.trim() === "") {
        await loadItems();
        return;
      }

      await runItemsRequest(() => searchItems(search, effectiveUnitFilter));
    } catch (err) {
      console.error("Erro ao buscar itens:", err);
      setError(err.message || "Erro ao buscar itens.");
    }
  };

  const handleDelete = (itemId) => {
    setSelectedItemId(itemId);
    setOpenDialog(true);
  };

  const handleViewItem = (item) => {
    setViewingItem(item);
  };

  const handleCloseItemDetails = () => {
    setViewingItem(null);
  };

  const confirmDelete = async () => {
    try {
      setError("");
      await deleteItem(selectedItemId);
      setOpenDialog(false);
      setOpenSnackbar(true);
      await loadItems();
    } catch (err) {
      console.error("Erro ao excluir item:", err);
      setError(err.message || "Erro ao excluir item.");
      setOpenDialog(false);
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Materiais</h1>
        <p style={styles.subtitle}>
          Consulte, busque e administre os materiais cadastrados no sistema.
        </p>

        <div style={styles.actions}>
          <button
            onClick={onBack}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Voltar ao dashboard
          </button>

          <button
            onClick={onNewItem}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            Novo material
          </button>
        </div>
      </section>

      {error && (
        <div style={styles.errorBox}>
          <strong>Erro:</strong> {error}
        </div>
      )}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Busca de materiais</h2>
        <p style={styles.sectionText}>
          Pesquise por nome, categoria, número de série, patrimônio, local ou observação.
        </p>

        <div style={styles.actions}>
          <select
            value={selectedUnitFilter}
            onChange={(e) => setSelectedUnitFilter(e.target.value)}
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={handleSearch}
            placeholder="Buscar item..."
            actionLabel="Buscar"
            style={styles.actionFieldWide}
          />
        </div>
        <p style={{ ...styles.helperText, marginTop: "12px" }}>{filterDescription}</p>
      </section>

      <div style={{ height: "20px" }} />

      <section style={styles.tableCard}>
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
                <h2 style={styles.sectionTitle}>Detalhes do material</h2>
                <p style={styles.sectionText}>
                  Consulte os dados completos do material selecionado.
                </p>
              </div>
              <div style={styles.tableHeaderActions}>
                <button
                  type="button"
                  onClick={handleCloseItemDetails}
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
              title="Identificação"
              fields={[
                ["Nome", viewingItem.name || "-"],
                ["Modelo", viewingItem.modelo || "-"],
                ["Categoria", viewingItem.category || "-"],
                ["Status", formatItemStatus(viewingItem.status)],
                ["Número de série", viewingItem.serial_number || "-"],
                ["Patrimônio", viewingItem.asset_tag || "-"],
                ["Unidade", viewingItem.unit_label ?? unitMap[viewingItem.unit_id] ?? viewingItem.unit_id],
                ["Local", viewingItem.location || "-"],
              ]}
            />

            <div style={{ marginTop: "16px" }}>
              <DetailSection
                title="Responsabilidade"
                fields={[
                  [
                    "Responsabilidade",
                    buildCustodySummary({
                      custodyType: viewingItem.custody_type,
                      custodySectorName:
                        sectorMap[viewingItem.custody_sector_id] ?? viewingItem.custody_sector_name,
                      policeOfficerRe: viewingItem.police_officer_re,
                      policeOfficerName: viewingItem.police_officer_name,
                      fleetVehicleLabel: viewingItem.fleet_vehicle_label,
                    }),
                  ],
                  ["Ativo", viewingItem.is_active ? "Sim" : "Não"],
                ]}
              />
            </div>

            <div style={{ ...styles.actions, marginTop: "18px" }}>
              <button
                type="button"
                onClick={() => onMoveItem(viewingItem.id)}
                style={{ ...styles.button, ...styles.primaryButton }}
              >
                Movimentar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(viewingItem.id)}
                style={{ ...styles.button, ...styles.dangerButton }}
              >
                Excluir
              </button>
            </div>
          </section>
        )}

        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.tableTitle}>Lista de materiais</h2>
            <p style={styles.tableMeta}>{visibleItems.length} registro(s) encontrado(s)</p>
          </div>
          <ReportExportButtons
            disabled={reportRows.length === 0}
            onExportExcel={() =>
              exportExcelReport({
                fileBaseName: "materiais",
                sheetName: "Materiais",
                title: "Relatório de materiais",
                subtitle: reportSubtitle,
                columns: reportColumns,
                rows: reportRows,
              })
            }
            onExportPdf={() =>
              exportPdfReport({
                fileBaseName: "materiais",
                title: "Relatório de materiais",
                subtitle: reportSubtitle,
                columns: reportColumns,
                rows: reportRows,
              })
            }
          />
        </div>

        <div style={{ padding: "20px 20px 0" }}>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <p style={styles.summaryLabel}>Registros visíveis</p>
              <p style={styles.summaryValue}>{visibleItems.length}</p>
            </div>
            <div style={styles.summaryCard}>
              <p style={styles.summaryLabel}>Materiais ativos</p>
              <p style={styles.summaryValue}>{activeVisibleItemsCount}</p>
            </div>
            <div style={styles.summaryCard}>
              <p style={styles.summaryLabel}>Materiais inativos</p>
              <p style={styles.summaryValue}>{inactiveVisibleItemsCount}</p>
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
                  <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>Nome</th>
                  <th style={{ ...styles.th, width: "180px", whiteSpace: "nowrap" }}>Categoria</th>
                  <th style={{ ...styles.th, width: "180px", whiteSpace: "nowrap" }}>Unidade</th>
                  <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>Responsabilidade</th>
                  <th style={{ ...styles.th, width: "110px", whiteSpace: "nowrap" }}>Ativo</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item, index) => (
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
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      {item.modelo ? (
                        <div style={styles.helperText}>{item.modelo}</div>
                      ) : null}
                    </td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>{item.category}</td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {item.unit_label ?? unitMap[item.unit_id] ?? item.unit_id}
                    </td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {buildCustodySummary({
                        custodyType: item.custody_type,
                        custodySectorName:
                          sectorMap[item.custody_sector_id] ?? item.custody_sector_name,
                        policeOfficerRe: item.police_officer_re,
                        policeOfficerName: item.police_officer_name,
                        fleetVehicleLabel: item.fleet_vehicle_label,
                      })}
                    </td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        ...styles.badge,
                        ...(item.is_active ? styles.activeBadge : styles.inactiveBadge),
                      }}
                    >
                      {item.is_active ? "Sim" : "Não"}
                    </span>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-card-view" style={styles.mobileCards}>
          {visibleItems.map((item) => (
            <article key={item.id} style={styles.mobileCard}>
              <div style={styles.mobileCardHeader}>
                <div>
                  <h3 style={styles.mobileCardTitle}>{item.name}</h3>
                  <p style={styles.mobileCardMeta}>
                    {[item.modelo, item.category].filter(Boolean).join(" • ")} • Registro #{item.id}
                  </p>
                </div>
                <span
                  style={{
                    ...styles.badge,
                    ...(item.is_active ? styles.activeBadge : styles.inactiveBadge),
                  }}
                >
                  {item.is_active ? "Sim" : "Não"}
                </span>
              </div>

              <div style={styles.mobileCardGrid}>
                <div style={styles.mobileCardRow}>
                  <p style={styles.mobileCardLabel}>Status operacional</p>
                  <p style={styles.mobileCardValue}>{formatItemStatus(item.status)}</p>
                </div>
                <div style={styles.mobileCardRow}>
                  <p style={styles.mobileCardLabel}>Número de série</p>
                  <p style={styles.mobileCardValue}>{item.serial_number || "-"}</p>
                </div>
                <div style={styles.mobileCardRow}>
                  <p style={styles.mobileCardLabel}>Patrimônio</p>
                  <p style={styles.mobileCardValue}>{item.asset_tag || "-"}</p>
                </div>
                <div style={styles.mobileCardRow}>
                  <p style={styles.mobileCardLabel}>Unidade</p>
                  <p style={styles.mobileCardValue}>
                    {item.unit_label ?? unitMap[item.unit_id] ?? item.unit_id}
                  </p>
                </div>
                <div style={styles.mobileCardRow}>
                  <p style={styles.mobileCardLabel}>Responsabilidade</p>
                  <p style={styles.mobileCardValue}>
                    {buildCustodySummary({
                      custodyType: item.custody_type,
                      custodySectorName:
                        sectorMap[item.custody_sector_id] ?? item.custody_sector_name,
                      policeOfficerRe: item.police_officer_re,
                      policeOfficerName: item.police_officer_name,
                      fleetVehicleLabel: item.fleet_vehicle_label,
                    })}
                  </p>
                </div>
                <div style={styles.mobileCardRow}>
                  <p style={styles.mobileCardLabel}>Local</p>
                  <p style={styles.mobileCardValue}>{item.location || "-"}</p>
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
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{
                    ...styles.button,
                    ...styles.dangerButton,
                    ...styles.tableActionButton,
                  }}
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: "var(--app-surface)",
            color: "var(--app-text)",
            border: "1px solid var(--app-border)",
            borderRadius: "20px",
            boxShadow: "var(--app-shadow)",
          },
        }}
      >
        <DialogTitle sx={{ color: "var(--app-text)", fontWeight: 700 }}>
          Excluir item
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja inativar este material?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{ color: "var(--app-text-muted)" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            sx={{
              backgroundColor: "var(--app-danger-text)",
              color: "#fff",
              "&:hover": {
                backgroundColor: "var(--app-error-text)",
              },
            }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          Material inativado com sucesso!
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Items;

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

function formatItemStatus(status) {
  const statusMap = {
    EM_USO: "Em uso",
    EM_ESTOQUE: "Em estoque",
    MANUTENCAO: "Manutenção",
    BAIXADO: "Baixado",
  };

  return statusMap[status] || status || "-";
}


