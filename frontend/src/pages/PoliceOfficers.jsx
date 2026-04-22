import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import PoliceOfficerDetailsPanel from "./PoliceOfficerDetailsPanel";
import ReportExportButtons from "../components/ReportExportButtons";
import SearchInputAction from "../components/SearchInputAction";
import { buildReportSubtitle } from "../utils/reportContext";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";
import {
  deletePoliceOfficer,
  exportPoliceOfficerPdf,
  getPoliceOfficerLinkedAssets,
  getPoliceOfficers,
  previewPoliceOfficerPdf,
  restorePoliceOfficer,
} from "../services/policeOfficerService";
import { getUnits } from "../services/referenceDataService";
import { readViewerAccess as readAuthAccess } from "../utils/authAccess";
import { formatServiceTime } from "../utils/policeOfficerUtils";
import { buildHierarchicalUnitLabelMap } from "../utils/unitOptions";
import {
  buildUnitFilterDescription,
  buildUnitFilterOptions,
  resolveEffectiveUnitFilter,
} from "../utils/unitFilters";
import { maskCpf } from "./policeOfficerRegistrationUtils";

function PoliceOfficers({
  onBack,
  onNewPoliceOfficer,
  onEditPoliceOfficer,
  onMovePoliceOfficer,
  onViewMovements,
}) {
  const [officers, setOfficers] = useState([]);
  const [unitMap, setUnitMap] = useState({});
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [linkedAssets, setLinkedAssets] = useState({
    items: [],
    material_belico: [],
    total_count: 0,
  });
  const [linkedAssetsLoading, setLinkedAssetsLoading] = useState(false);
  const [linkedAssetsError, setLinkedAssetsError] = useState("");
  const [units, setUnits] = useState([]);
  const [viewerAccess, setViewerAccess] = useState({
    unitId: null,
    unitType: null,
    unitLabel: null,
    canViewAll: false,
  });
  const [selectedUnitFilter, setSelectedUnitFilter] = useState("ALL_VISIBLE");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
  const reportColumns = useMemo(
    () => [
      { key: "fullName", label: "Nome completo", width: 28 },
      { key: "warName", label: "Nome de guerra", width: 20 },
      { key: "re", label: "RE", width: 14 },
      { key: "cpf", label: "CPF", width: 16 },
      { key: "unit", label: "Unidade", width: 26 },
      { key: "serviceTime", label: "Tempo de serviço", width: 18 },
      { key: "status", label: "Status", width: 12 },
    ],
    []
  );

  const reportRows = useMemo(
    () =>
      officers.map((officer) => ({
        fullName: officer.full_name || "-",
        warName: officer.war_name || "-",
        re: officer.re_with_digit || "-",
        cpf: maskCpf(officer.cpf || "") || "-",
        unit: officer.unit_label || unitMap[officer.unit_id] || "-",
        serviceTime: formatServiceTime(officer.admission_date),
        status: officer.is_active ? "Ativo" : "Inativo",
      })),
    [officers, unitMap]
  );
  const reportSubtitle = useMemo(
    () =>
      buildReportSubtitle({
        totalRows: reportRows.length,
        searchTerm,
        filterDescription,
      }),
    [filterDescription, reportRows.length, searchTerm]
  );
  const activeOfficersCount = useMemo(
    () => officers.filter((officer) => officer.is_active).length,
    [officers]
  );
  const inactiveOfficersCount = officers.length - activeOfficersCount;

  useEffect(() => {
    setViewerAccess(readAuthAccess());
  }, []);

  useEffect(() => {
    const loadLinkedAssets = async () => {
      if (!selectedOfficer?.id) {
        setLinkedAssets({ items: [], material_belico: [], total_count: 0 });
        setLinkedAssetsError("");
        setLinkedAssetsLoading(false);
        return;
      }

      try {
        setLinkedAssetsLoading(true);
        setLinkedAssetsError("");
        const data = await getPoliceOfficerLinkedAssets(selectedOfficer.id);
        setLinkedAssets({
          items: data.items || [],
          material_belico: data.material_belico || [],
          total_count: data.total_count || 0,
        });
      } catch (loadError) {
        setLinkedAssets({ items: [], material_belico: [], total_count: 0 });
        setLinkedAssetsError(loadError.message || "Erro ao carregar materiais vinculados");
      } finally {
        setLinkedAssetsLoading(false);
      }
    };

    loadLinkedAssets();
  }, [selectedOfficer]);

  const loadUnits = async () => {
    const data = await getUnits();
    setUnits(data);
    setUnitMap(buildHierarchicalUnitLabelMap(data));
  };

  const loadOfficers = async (term = "") => {
    try {
      const data = await getPoliceOfficers(term.trim(), effectiveUnitFilter, {
        includeInactive: true,
      });
      setOfficers(data);
      setShowTable(true);
    } catch (error) {
      setError(error.message || "Erro ao consultar policiais");
    }
  };

  const handleConsult = async () => {
    await loadUnits();
    setShowSearchBox(true);
    setShowTable(false);
    setOfficers([]);
    setSelectedOfficer(null);
  };

  const handleSearch = async () => {
    await loadOfficers(searchTerm);
  };

  const handleViewOfficer = (officer) => {
    setSelectedOfficer(officer);
  };

  const handleCloseOfficerDetails = () => {
    setSelectedOfficer(null);
  };

  const handleDelete = async (officerId) => {
    const confirmed = window.confirm("Deseja inativar este policial?");
    if (!confirmed) {
      return;
    }

    try {
      await deletePoliceOfficer(officerId);
      setSuccess("Policial inativado com sucesso.");
      await loadOfficers(searchTerm);
      return;
    } catch (error) {
      setError(error.message || "Erro ao inativar policial");
    }
  };

  const handleRestore = async (officerId) => {
    const confirmed = window.confirm("Deseja reativar este policial?");
    if (!confirmed) {
      return;
    }

    try {
      await restorePoliceOfficer(officerId);
      setSuccess("Policial reativado com sucesso.");
      await loadOfficers(searchTerm);
      return;
    } catch (error) {
      setError(error.message || "Erro ao reativar policial");
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Cadastro/Consulta de Policial</h1>
        <p style={styles.subtitle}>
          Cadastre e consulte policiais vinculados ao Estado-Maior, companhias e pelotões.
        </p>

        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
          <button
            onClick={onNewPoliceOfficer}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            Novo policial
          </button>
          <button
            onClick={handleConsult}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Consultar policiais
          </button>
          <button
            onClick={onViewMovements}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Movimentações
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      {showSearchBox && (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Pesquisa de policiais</h2>
          <p style={styles.sectionText}>
            Informe nome, nome de guerra, CPF ou RE com dígito para pesquisar.
          </p>

          <div style={styles.infoBox}>
            Depois da pesquisa, use a própria tabela para abrir detalhes, editar,
            movimentar ou alterar o status do policial.
          </div>

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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={handleSearch}
              placeholder="Digite nome, guerra, CPF ou RE"
              style={styles.actionFieldWide}
              buttonStyle={styles.primaryButton}
            />
          </div>
          <p style={{ ...styles.helperText, marginTop: "12px" }}>{filterDescription}</p>
        </section>
      )}

      {showTable && (
        <>
          {selectedOfficer && (
            <section style={{ ...styles.card, marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <h2 style={styles.sectionTitle}>Detalhes do policial</h2>
                  <p style={styles.sectionText}>
                    Visualize todos os dados cadastrais do policial selecionado.
                  </p>
                </div>
                <div style={styles.tableHeaderActions}>
                  <button
                    type="button"
                    onClick={handleCloseOfficerDetails}
                    style={{ ...styles.button, ...styles.secondaryButton }}
                  >
                    ← Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditPoliceOfficer(selectedOfficer.id)}
                    style={{ ...styles.button, ...styles.primaryButton }}
                  >
                    ✏ Editar
                  </button>
                </div>
              </div>
              <div style={{ ...styles.actions, marginTop: "12px", marginBottom: "8px" }}>
                <button
                  type="button"
                  onClick={() => previewPoliceOfficerPdf(selectedOfficer.id)}
                  style={{ ...styles.button, ...styles.secondaryButton }}
                >
                  Visualizar/Imprimir ficha
                </button>
                <button
                  type="button"
                  onClick={() => exportPoliceOfficerPdf(selectedOfficer.id)}
                  style={{ ...styles.button, ...styles.primaryButton }}
                >
                  Exportar ficha PDF
                </button>
              </div>

              <PoliceOfficerDetailsPanel officer={selectedOfficer} unitMap={unitMap} />

              <div style={{ marginTop: "28px" }}>
                <div style={{ marginBottom: "16px" }}>
                  <h3 style={{ ...styles.sectionTitle, marginBottom: "6px" }}>
                    Material vinculado
                  </h3>
                  <p style={styles.sectionText}>
                    Consulte os materiais comuns e o material bélico atualmente vinculados ao policial.
                  </p>
                </div>

                {linkedAssetsLoading && (
                  <div style={styles.infoBox}>Carregando materiais vinculados...</div>
                )}
                {linkedAssetsError && <div style={styles.errorBox}>{linkedAssetsError}</div>}

                {!linkedAssetsLoading && !linkedAssetsError && (
                  <div style={styles.summaryGrid}>
                    <div style={styles.summaryCard}>
                      <p style={styles.summaryLabel}>Total vinculado</p>
                      <p style={styles.summaryValue}>{linkedAssets.total_count}</p>
                    </div>
                    <div style={styles.summaryCard}>
                      <p style={styles.summaryLabel}>Materiais</p>
                      <p style={styles.summaryValue}>{linkedAssets.items.length}</p>
                    </div>
                    <div style={styles.summaryCard}>
                      <p style={styles.summaryLabel}>Material bélico</p>
                      <p style={styles.summaryValue}>{linkedAssets.material_belico.length}</p>
                    </div>
                  </div>
                )}

                {!linkedAssetsLoading && !linkedAssetsError && linkedAssets.total_count === 0 && (
                  <div style={{ ...styles.emptyState, marginTop: "16px" }}>
                    Nenhum material vinculado a este policial no momento.
                  </div>
                )}

                {!linkedAssetsLoading && !linkedAssetsError && linkedAssets.total_count > 0 && (
                  <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
                    <LinkedAssetsGroup
                      title="Materiais"
                      assets={linkedAssets.items}
                      emptyMessage="Nenhum material comum vinculado."
                    />
                    <LinkedAssetsGroup
                      title="Material Bélico"
                      assets={linkedAssets.material_belico}
                      emptyMessage="Nenhum material bélico vinculado."
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          <section style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <div>
                <h2 style={styles.tableTitle}>Consulta de policiais</h2>
                <p style={styles.tableMeta}>{officers.length} registro(s) encontrado(s)</p>
              </div>
              <ReportExportButtons
                disabled={reportRows.length === 0}
                onExportExcel={() =>
                  exportExcelReport({
                    fileBaseName: "policiais",
                    sheetName: "Policiais",
                    title: "Relatório de policiais",
                    subtitle: reportSubtitle,
                    columns: reportColumns,
                    rows: reportRows,
                  })
                }
                onExportPdf={() =>
                  exportPdfReport({
                    fileBaseName: "policiais",
                    title: "Relatório de policiais",
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
                  <p style={styles.summaryLabel}>Registros</p>
                  <p style={styles.summaryValue}>{officers.length}</p>
                </div>
                <div style={styles.summaryCard}>
                  <p style={styles.summaryLabel}>Policiais ativos</p>
                  <p style={styles.summaryValue}>{activeOfficersCount}</p>
                </div>
                <div style={styles.summaryCard}>
                  <p style={styles.summaryLabel}>Filtro de unidade</p>
                  <p style={styles.summaryValue}>{filterDescription}</p>
                </div>
                <div style={styles.summaryCard}>
                  <p style={styles.summaryLabel}>Policiais inativos</p>
                  <p style={styles.summaryValue}>{inactiveOfficersCount}</p>
                </div>
              </div>
            </div>

            <div className="desktop-table-view" style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: "60px", whiteSpace: "nowrap" }}>Ver</th>
                    <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>
                      Nome completo
                    </th>
                    <th style={{ ...styles.th, width: "170px", whiteSpace: "nowrap" }}>
                      Nome de guerra
                    </th>
                    <th style={{ ...styles.th, width: "110px", whiteSpace: "nowrap" }}>RE</th>
                    <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>Unidade</th>
                    <th style={{ ...styles.th, width: "110px", whiteSpace: "nowrap" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {officers.map((officer, index) => (
                    <tr
                      key={officer.id}
                      style={
                        index % 2 === 1
                          ? { backgroundColor: "var(--app-surface-muted)" }
                          : undefined
                      }
                    >
                      <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          onClick={() => handleViewOfficer(officer)}
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
                        <div style={{ fontWeight: 600 }}>{officer.full_name}</div>
                      </td>
                      <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 600 }}>{officer.war_name}</div>
                      </td>
                      <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 600 }}>{officer.re_with_digit}</div>
                      </td>
                      <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 600 }}>
                          {officer.unit_label || unitMap[officer.unit_id] || "-"}
                        </div>
                      </td>
                      <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            ...styles.badge,
                            ...(officer.is_active ? styles.activeBadge : styles.inactiveBadge),
                          }}
                        >
                          {officer.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {officers.length === 0 && (
                <div style={styles.emptyState}>
                  Nenhum policial encontrado para o filtro informado.
                </div>
              )}
            </div>

            {officers.length > 0 && (
              <div className="mobile-card-view" style={styles.mobileCards}>
                {officers.map((officer) => (
                  <article key={officer.id} style={styles.mobileCard}>
                    <div style={styles.mobileCardHeader}>
                      <div>
                        <h3 style={styles.mobileCardTitle}>{officer.full_name}</h3>
                        <p style={styles.mobileCardMeta}>
                          {officer.war_name || "-"} • {officer.re_with_digit || "-"}
                        </p>
                      </div>
                      <span
                        style={{
                          ...styles.badge,
                          ...(officer.is_active ? styles.activeBadge : styles.inactiveBadge),
                        }}
                      >
                        {officer.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <div style={styles.mobileCardGrid}>
                      <div style={styles.mobileCardRow}>
                        <p style={styles.mobileCardLabel}>CPF</p>
                        <p style={styles.mobileCardValue}>{maskCpf(officer.cpf || "") || "-"}</p>
                      </div>
                      <div style={styles.mobileCardRow}>
                        <p style={styles.mobileCardLabel}>Unidade</p>
                        <p style={styles.mobileCardValue}>
                          {officer.unit_label || unitMap[officer.unit_id] || "-"}
                        </p>
                      </div>
                      <div style={styles.mobileCardRow}>
                        <p style={styles.mobileCardLabel}>Tempo de serviço</p>
                        <p style={styles.mobileCardValue}>
                          {formatServiceTime(officer.admission_date)}
                        </p>
                      </div>
                    </div>

                    <div style={styles.mobileCardActions}>
                      <button
                        onClick={() => handleViewOfficer(officer)}
                        style={{
                          ...styles.button,
                          ...styles.secondaryButton,
                          ...styles.tableActionButton,
                        }}
                      >
                        Detalhes
                      </button>
                      <button
                        onClick={() => onEditPoliceOfficer(officer.id)}
                        style={{
                          ...styles.button,
                          ...styles.secondaryButton,
                          ...styles.tableActionButton,
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onMovePoliceOfficer(officer.id)}
                        style={{
                          ...styles.button,
                          ...styles.primaryButton,
                          ...styles.tableActionButton,
                        }}
                      >
                        Movimentar
                      </button>
                      {officer.is_active ? (
                        <button
                          onClick={() => handleDelete(officer.id)}
                          style={{
                            ...styles.button,
                            ...styles.dangerButton,
                            ...styles.tableActionButton,
                          }}
                        >
                          Inativar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestore(officer.id)}
                          style={{
                            ...styles.button,
                            ...styles.primaryButton,
                            ...styles.tableActionButton,
                          }}
                        >
                          Reativar
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function LinkedAssetsGroup({ title, assets, emptyMessage }) {
  return (
    <div style={styles.card}>
      <div style={{ marginBottom: "14px" }}>
        <h4 style={{ ...styles.sectionTitle, marginBottom: "4px" }}>{title}</h4>
        <p style={styles.sectionText}>{assets.length} registro(s) vinculado(s).</p>
      </div>

      {assets.length === 0 ? (
        <div style={styles.infoBox}>{emptyMessage}</div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {assets.map((asset) => (
            <div
              key={`${asset.module}-${asset.id}`}
              style={{
                padding: "14px 16px",
                borderRadius: "16px",
                border: "1px solid var(--app-border)",
                backgroundColor: "var(--app-surface-muted)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "var(--app-text)" }}>{asset.name}</div>
                  <div style={{ color: "var(--app-text-muted)", fontSize: "0.92rem", marginTop: "4px" }}>
                    {[asset.category, asset.unit_label].filter(Boolean).join(" | ") || "-"}
                  </div>
                </div>
                <span style={{ ...styles.badge, ...styles.activeBadge }}>
                  {asset.status || "Vinculado"}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                  marginTop: "14px",
                }}
              >
                <LinkedAssetMeta label="Número / série" value={asset.serial_number} />
                <LinkedAssetMeta label="Patrimônio" value={asset.asset_tag} />
                <LinkedAssetMeta label="Local" value={asset.location} />
                <LinkedAssetMeta label="Detalhes" value={asset.details} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LinkedAssetMeta({ label, value }) {
  return (
    <div>
      <div style={{ color: "var(--app-text-muted)", fontSize: "0.82rem", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ color: "var(--app-text)", fontWeight: 600 }}>{value || "-"}</div>
    </div>
  );
}


export default PoliceOfficers;



