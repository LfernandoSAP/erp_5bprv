import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import ReportExportButtons from "../components/ReportExportButtons";
import SearchInputAction from "../components/SearchInputAction";
import { apiFetch } from "../services/api";
import { getSectors, getUnits } from "../services/referenceDataService";
import { readViewerAccess as readAuthAccess } from "../utils/authAccess";
import { buildReportSubtitle } from "../utils/reportContext";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";
import {
  buildHierarchicalUnitLabelMap,
  buildHierarchicalUnitOptions,
} from "../utils/unitOptions";
import { formatSectorLabel } from "../utils/sectorOptions";

function Sectors({ onBack }) {
  const [viewerAccess, setViewerAccess] = useState({
    unitId: null,
    canManage: false,
    canViewAll: false,
  });
  const [units, setUnits] = useState([]);
  const [unitMap, setUnitMap] = useState({});
  const [sectors, setSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState(null);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSectorId, setEditingSectorId] = useState(null);
  const [formData, setFormData] = useState({
    unitId: "",
    name: "",
    code: "",
    isActive: true,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadUnits(access = viewerAccess) {
    try {
      const activeUnits = await getUnits();
      setUnits(activeUnits);
      setUnitMap(buildHierarchicalUnitLabelMap(activeUnits));

      if (!access.canViewAll && access.unitId) {
        setFormData((prev) => ({
          ...prev,
          unitId: String(access.unitId),
        }));
      }
    } catch (currentError) {
      setError(currentError.message || "Erro ao carregar unidades");
    }
  }

  async function loadSectors(term = "") {
    try {
      const data = await getSectors({
        activeOnly: false,
        includeInactive: true,
        query: term,
      });
      setSectors(data);
      setShowTable(true);
    } catch (currentError) {
      setError(currentError.message || "Erro ao consultar setores");
    }
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const access = readAuthAccess();
    const normalizedAccess = {
      unitId: access.unitId,
      canManage: Boolean(
        access.canViewAll ||
          access.isAdmin ||
          access.roleCode === "ADMIN_GLOBAL" ||
          access.roleCode === "ADMIN_UNIDADE"
      ),
      canViewAll: access.canViewAll,
    };
    setViewerAccess(normalizedAccess);
    void loadUnits(normalizedAccess);
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const availableUnits = useMemo(() => {
    if (viewerAccess.canViewAll) {
      return units;
    }
    return units.filter((unit) => String(unit.id) === String(viewerAccess.unitId));
  }, [units, viewerAccess]);

  const unitOptions = useMemo(
    () => buildHierarchicalUnitOptions(availableUnits),
    [availableUnits]
  );

  const reportColumns = useMemo(
    () => [
      { key: "unit", label: "Unidade", width: 26 },
      { key: "name", label: "Nome", width: 22 },
      { key: "code", label: "Código", width: 14 },
      { key: "status", label: "Status", width: 12 },
    ],
    []
  );

  const reportRows = useMemo(
    () =>
      sectors.map((sector) => ({
        unit: unitMap[sector.unit_id] ?? sector.unit_id,
        name: formatSectorLabel(sector),
        code: sector.code || "-",
        status: sector.is_active ? "Ativo" : "Inativo",
      })),
    [sectors, unitMap]
  );

  const reportSubtitle = useMemo(
    () =>
      buildReportSubtitle({
        totalRows: reportRows.length,
        searchTerm,
      }),
    [reportRows.length, searchTerm]
  );

  const activeSectorsCount = useMemo(
    () => sectors.filter((sector) => sector.is_active).length,
    [sectors]
  );

  const inactiveSectorsCount = sectors.length - activeSectorsCount;

  const handleConsultSectors = async () => {
    setShowSearchBox(true);
    setShowForm(false);
    setSelectedSector(null);
    await loadSectors(searchTerm);
  };

  const handleNewSector = () => {
    if (!viewerAccess.canManage) {
      setError("Apenas administradores podem cadastrar setores.");
      return;
    }

    setEditingSectorId(null);
    setFormData({
      unitId: viewerAccess.canViewAll ? "" : String(viewerAccess.unitId ?? ""),
      name: "",
      code: "",
      isActive: true,
    });
    setShowForm(true);
    setShowSearchBox(false);
    setSelectedSector(null);
  };

  const handleSearch = async () => {
    await loadSectors(searchTerm);
  };

  const handleViewSector = (sector) => {
    setSelectedSector(sector);
  };

  const handleCloseSectorDetails = () => {
    setSelectedSector(null);
  };

  const handleEditSector = (sector) => {
    if (!viewerAccess.canManage) {
      setError("Apenas administradores podem editar setores.");
      return;
    }

    setEditingSectorId(sector.id);
    setFormData({
      unitId: String(sector.unit_id),
      name: sector.name || "",
      code: sector.code || "",
      isActive: Boolean(sector.is_active),
    });
    setShowForm(true);
    setShowSearchBox(false);
    setSelectedSector(null);
  };

  const handleDeleteSector = async (sectorId) => {
    const confirmed = window.confirm("Deseja inativar este setor?");
    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/rh/sectors/${sectorId}`, { method: "DELETE" });
      setSuccess("Setor inativado com sucesso.");
      await loadSectors(searchTerm);
      if (selectedSector?.id === sectorId) {
        setSelectedSector(null);
      }
    } catch (currentError) {
      setError(currentError.message || "Erro ao inativar setor");
    }
  };

  const handleRestoreSector = async (sectorId) => {
    const confirmed = window.confirm("Deseja reativar este setor?");
    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/rh/sectors/${sectorId}/restore`, { method: "PUT" });
      setSuccess("Setor reativado com sucesso.");
      await loadSectors(searchTerm);
    } catch (currentError) {
      setError(currentError.message || "Erro ao reativar setor");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      unit_id: Number(formData.unitId),
      name: formData.name.trim(),
      code: formData.code.trim() || null,
      is_active: formData.isActive,
    };

    const url = editingSectorId ? `/rh/sectors/${editingSectorId}` : "/rh/sectors/";
    const method = editingSectorId ? "PUT" : "POST";

    try {
      await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });
      setSuccess(
        editingSectorId
          ? "Setor atualizado com sucesso!"
          : "Setor cadastrado com sucesso!"
      );
      setShowForm(false);
      setShowSearchBox(true);
      await loadSectors(searchTerm);
    } catch (currentError) {
      setError(currentError.message || "Erro ao salvar setor");
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Setores</h1>
        <p style={styles.subtitle}>
          Organize os setores por unidade, mantendo o cadastro alinhado com a
          hierarquia do ERP.
        </p>

        <div style={styles.actions}>
          <button
            type="button"
            onClick={onBack}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={handleNewSector}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            Novo setor
          </button>

          <button
            type="button"
            onClick={handleConsultSectors}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Consultar setores
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      {showSearchBox && (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Pesquisa de setores</h2>
          <p style={styles.sectionText}>
            Informe o nome ou o código do setor para pesquisar.
          </p>

          <div style={styles.actions}>
            <SearchInputAction
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onSearch={handleSearch}
              placeholder="Digite o nome ou código"
              style={styles.actionFieldWide}
              buttonStyle={styles.primaryButton}
            />
          </div>
        </section>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ ...styles.card, marginBottom: "24px" }}>
          <h2 style={styles.sectionTitle}>
            {editingSectorId ? "Editar setor" : "Novo setor"}
          </h2>
          <p style={styles.sectionText}>
            Preencha a unidade, o nome e o código do setor.
          </p>

          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Unidade</label>
              <select
                value={formData.unitId}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, unitId: event.target.value }))
                }
                required
                style={styles.input}
                disabled={!viewerAccess.canViewAll}
              >
                <option value="">Selecione</option>
                {unitOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                required
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Código</label>
              <input
                type="text"
                value={formData.code}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, code: event.target.value }))
                }
                style={styles.input}
              />
            </div>

            {editingSectorId && (
              <div style={styles.field}>
                <label style={styles.label}>Status</label>
                <select
                  value={formData.isActive ? "ATIVO" : "INATIVO"}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: event.target.value === "ATIVO",
                    }))
                  }
                  style={styles.input}
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>
            )}
          </div>

          <div style={styles.footerActions}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              Cancelar
            </button>
            <button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>
              {editingSectorId ? "Salvar alterações" : "Salvar setor"}
            </button>
          </div>
        </form>
      )}

      {showTable && (
        <section style={{ ...styles.tableCard, marginTop: "24px" }}>
          {selectedSector && (
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
                  <h2 style={styles.sectionTitle}>Detalhes do setor</h2>
                  <p style={styles.sectionText}>
                    Consulte os dados cadastrais do setor selecionado.
                  </p>
                </div>
                <div style={styles.tableHeaderActions}>
                  <button
                    type="button"
                    onClick={handleCloseSectorDetails}
                    style={{ ...styles.button, ...styles.secondaryButton }}
                  >
                    ← Voltar
                  </button>
                  {viewerAccess.canManage && (
                    <button
                      type="button"
                      onClick={() => handleEditSector(selectedSector)}
                      style={{ ...styles.button, ...styles.primaryButton }}
                    >
                      ✏ Editar
                    </button>
                  )}
                </div>
              </div>

              <SectorDetailSection
                title="Identificação"
                fields={[
                  ["Nome", formatSectorLabel(selectedSector)],
                  ["Código", selectedSector.code || "-"],
                  ["Unidade", unitMap[selectedSector.unit_id] ?? selectedSector.unit_id],
                  ["Status", selectedSector.is_active ? "Ativo" : "Inativo"],
                ]}
              />

              {viewerAccess.canManage && (
                <div style={{ ...styles.actions, marginTop: "18px" }}>
                  {selectedSector.is_active ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteSector(selectedSector.id)}
                      style={{ ...styles.button, ...styles.dangerButton }}
                    >
                      Inativar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRestoreSector(selectedSector.id)}
                      style={{ ...styles.button, ...styles.primaryButton }}
                    >
                      Reativar
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          <div style={styles.tableHeader}>
            <div>
              <h2 style={styles.tableTitle}>Consulta de setores</h2>
              <p style={styles.tableMeta}>{sectors.length} registro(s) encontrado(s)</p>
            </div>
            <ReportExportButtons
              disabled={reportRows.length === 0}
              onExportExcel={() =>
                exportExcelReport({
                  fileBaseName: "setores",
                  sheetName: "Setores",
                  title: "Relatório de setores",
                  subtitle: reportSubtitle,
                  columns: reportColumns,
                  rows: reportRows,
                })
              }
              onExportPdf={() =>
                exportPdfReport({
                  fileBaseName: "setores",
                  title: "Relatório de setores",
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
                <p style={styles.summaryLabel}>Registros</p>
                <p style={styles.summaryValue}>{sectors.length}</p>
              </div>
              <div style={styles.summaryCard}>
                <p style={styles.summaryLabel}>Setores ativos</p>
                <p style={styles.summaryValue}>{activeSectorsCount}</p>
              </div>
              <div style={styles.summaryCard}>
                <p style={styles.summaryLabel}>Setores inativos</p>
                <p style={styles.summaryValue}>{inactiveSectorsCount}</p>
              </div>
            </div>
          </div>

          <div className="desktop-table-view" style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: "60px", whiteSpace: "nowrap" }}>Ver</th>
                  <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>
                    Unidade
                  </th>
                  <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>
                    Nome
                  </th>
                  <th style={{ ...styles.th, width: "140px", whiteSpace: "nowrap" }}>
                    Código
                  </th>
                  <th style={{ ...styles.th, width: "120px", whiteSpace: "nowrap" }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sectors.map((sector, index) => (
                  <tr
                    key={sector.id}
                    style={
                      index % 2 === 1
                        ? { backgroundColor: "var(--app-surface-muted)" }
                        : undefined
                    }
                  >
                    <td style={{ ...styles.td, padding: "10px 12px" }}>
                      <button
                        type="button"
                        onClick={() => handleViewSector(sector)}
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
                      {unitMap[sector.unit_id] ?? sector.unit_id}
                    </td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {formatSectorLabel(sector)}
                    </td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {sector.code || "-"}
                    </td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(sector.is_active ? styles.activeBadge : styles.inactiveBadge),
                        }}
                      >
                        {sector.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sectors.length === 0 && (
              <div style={styles.emptyState}>
                Nenhum setor encontrado para o filtro informado.
              </div>
            )}
          </div>

          {sectors.length > 0 && (
            <div className="mobile-card-view" style={styles.mobileCards}>
              {sectors.map((sector) => (
                <article key={sector.id} style={styles.mobileCard}>
                  <div style={styles.mobileCardHeader}>
                    <div>
                      <h3 style={styles.mobileCardTitle}>{formatSectorLabel(sector)}</h3>
                      <p style={styles.mobileCardMeta}>
                        {unitMap[sector.unit_id] ?? sector.unit_id}
                      </p>
                    </div>
                    <span
                      style={{
                        ...styles.badge,
                        ...(sector.is_active ? styles.activeBadge : styles.inactiveBadge),
                      }}
                    >
                      {sector.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div style={styles.mobileCardGrid}>
                    <div style={styles.mobileCardRow}>
                      <p style={styles.mobileCardLabel}>Código</p>
                      <p style={styles.mobileCardValue}>{sector.code || "-"}</p>
                    </div>
                  </div>

                  <div style={styles.mobileCardActions}>
                    <button
                      type="button"
                      onClick={() => handleViewSector(sector)}
                      style={{
                        ...styles.button,
                        ...styles.secondaryButton,
                        ...styles.tableActionButton,
                      }}
                    >
                      Ver
                    </button>
                    {viewerAccess.canManage && (
                      <button
                        type="button"
                        onClick={() => handleEditSector(sector)}
                        style={{
                          ...styles.button,
                          ...styles.primaryButton,
                          ...styles.tableActionButton,
                        }}
                      >
                        Editar
                      </button>
                    )}
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

function SectorDetailSection({ title, fields }) {
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

export default Sectors;
