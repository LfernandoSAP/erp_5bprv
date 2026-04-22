import { useCallback, useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import ReportExportButtons from "../components/ReportExportButtons";
import SearchInputAction from "../components/SearchInputAction";
import { getPoliceOfficerMovements } from "../services/policeOfficerService";
import { getUnits } from "../services/referenceDataService";
import { readViewerAccess } from "../utils/authAccess";
import { buildReportSubtitle } from "../utils/reportContext";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";
import {
  buildUnitFilterDescription,
  buildUnitFilterOptions,
  resolveEffectiveUnitFilter,
} from "../utils/unitFilters";

function PoliceOfficerMovementsList({ onBack }) {
  const [movements, setMovements] = useState([]);
  const [units, setUnits] = useState([]);
  const [viewerAccess, setViewerAccess] = useState(readViewerAccess());
  const [selectedUnitFilter, setSelectedUnitFilter] = useState("ALL_VISIBLE");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingMovement, setViewingMovement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const access = readViewerAccess();
    setViewerAccess(access);
    void loadUnits();
  }, []);

  const unitMap = useMemo(
    () =>
      units.reduce((accumulator, unit) => {
        accumulator[unit.id] = unit.display_name || unit.name;
        return accumulator;
      }, {}),
    [units]
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

  const effectiveUnitFilter = resolveEffectiveUnitFilter(
    selectedUnitFilter,
    viewerAccess.unitId
  );

  const filteredMovements = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) {
      return movements;
    }

    return movements.filter((movement) => {
      const haystack = [
        movement.officer_name,
        movement.user_name,
        movement.from_unit_label,
        movement.to_unit_label,
        movement.details,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedTerm);
    });
  }, [movements, searchTerm]);

  const reportColumns = useMemo(
    () => [
      { key: "officer", label: "Policial", width: 24 },
      { key: "from", label: "Origem", width: 24 },
      { key: "to", label: "Destino", width: 24 },
      { key: "user", label: "Usuário", width: 20 },
      { key: "createdAt", label: "Data/Hora", width: 18 },
      { key: "details", label: "Detalhes", width: 28 },
    ],
    []
  );

  const reportRows = useMemo(
    () =>
      filteredMovements.map((movement) => ({
        officer: movement.officer_name || "-",
        from: movement.from_unit_label || "-",
        to: movement.to_unit_label || "-",
        user: movement.user_name || "Usuário não informado",
        createdAt: formatDateTime(movement.created_at),
        details: movement.details || "-",
      })),
    [filteredMovements]
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

  const movementCount = filteredMovements.length;

  const loadUnits = async () => {
    try {
      const data = await getUnits();
      setUnits(data);
    } catch {
      setUnits([]);
    }
  };

  const loadMovements = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPoliceOfficerMovements(effectiveUnitFilter);
      setMovements(data);
    } catch (currentError) {
      setError(
        currentError.message || "Erro ao carregar movimentações de policiais."
      );
    } finally {
      setLoading(false);
    }
  }, [effectiveUnitFilter]);

  useEffect(() => {
    void loadMovements();
  }, [loadMovements]);

  const handleViewMovement = (movement) => {
    setViewingMovement(movement);
  };

  const handleCloseDetail = () => {
    setViewingMovement(null);
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Policiais - Movimentações</h1>
        <p style={styles.subtitle}>
          Consulte o histórico de alterações de lotação dos policiais
          cadastrados.
        </p>

        <div style={styles.actions}>
          <button
            onClick={onBack}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Voltar
          </button>
          <button
            onClick={loadMovements}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            Recarregar
          </button>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Pesquisar movimentações</h2>
        <p style={styles.sectionText}>
          Filtre por policial, usuário, origem, destino ou detalhes.
        </p>

        <div style={styles.infoBox}>
          Use esta tela para acompanhar a lotação histórica do policial, com
          origem, destino e usuário responsável pelo registro.
        </div>

        <div style={styles.actions}>
          <select
            value={selectedUnitFilter}
            onChange={(event) => setSelectedUnitFilter(event.target.value)}
            style={{ ...styles.input, ...styles.actionField }}
          >
            <option value="ALL_VISIBLE">Todas as unidades visíveis</option>
            <option value="SELF">
              Somente minha unidade ({viewerAccess.unitLabel || "unidade atual"})
            </option>
            {filterUnitOptions.map((unit) => (
              <option key={unit.id} value={String(unit.id)}>
                {unit.display_name || unit.name}
              </option>
            ))}
          </select>
          <SearchInputAction
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onSearch={loadMovements}
            placeholder="Digite para filtrar a lista"
            style={styles.actionFieldWide}
          />
        </div>
        <div style={{ ...styles.helperText, marginTop: "10px" }}>
          {filterDescription}
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}

      <section style={{ ...styles.tableCard, marginTop: "24px" }}>
        {viewingMovement && (
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
                <h2 style={styles.sectionTitle}>Detalhes da movimentação</h2>
                <p style={styles.sectionText}>
                  Consulte os dados completos do registro de lotação
                  selecionado.
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
              </div>
            </div>

            <MovementDetailSection
              title="Dados principais"
              fields={[
                ["Policial", viewingMovement.officer_name || "-"],
                ["Origem", viewingMovement.from_unit_label || "-"],
                ["Destino", viewingMovement.to_unit_label || "-"],
                ["Usuário", viewingMovement.user_name || "Usuário não informado"],
                ["Data/Hora", formatDateTime(viewingMovement.created_at)],
                ["Detalhes", viewingMovement.details || "-"],
              ]}
            />
          </section>
        )}

        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.tableTitle}>Histórico de movimentações</h2>
            <p style={styles.tableMeta}>{filteredMovements.length} registro(s) encontrado(s)</p>
          </div>
          <ReportExportButtons
            disabled={reportRows.length === 0}
            onExportExcel={() =>
              exportExcelReport({
                fileBaseName: "policiais-movimentacoes",
                sheetName: "Movimentações",
                title: "Relatório de movimentações de policiais",
                subtitle: reportSubtitle,
                columns: reportColumns,
                rows: reportRows,
              })
            }
            onExportPdf={() =>
              exportPdfReport({
                fileBaseName: "policiais-movimentacoes",
                title: "Relatório de movimentações de policiais",
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
              <p style={styles.summaryValue}>{movementCount}</p>
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
                <th style={{ ...styles.th, width: "60px", whiteSpace: "nowrap" }}>
                  Ver
                </th>
                <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>
                  Policial
                </th>
                <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>
                  Origem
                </th>
                <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>
                  Destino
                </th>
                <th style={{ ...styles.th, width: "170px", whiteSpace: "nowrap" }}>
                  Data/Hora
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((movement, index) => (
                <tr
                  key={movement.id}
                  style={
                    index % 2 === 1
                      ? { backgroundColor: "var(--app-surface-muted)" }
                      : undefined
                  }
                >
                  <td style={{ ...styles.td, padding: "10px 12px" }}>
                    <button
                      type="button"
                      onClick={() => handleViewMovement(movement)}
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
                    <div style={{ fontWeight: 600 }}>{movement.officer_name || "-"}</div>
                    <div style={styles.helperText}>Registro #{movement.police_officer_id}</div>
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {movement.from_unit_label || "-"}
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {movement.to_unit_label || "-"}
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {formatDateTime(movement.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filteredMovements.length === 0 && (
            <div style={styles.emptyState}>
              Nenhuma movimentação de policial encontrada para o filtro
              informado.
            </div>
          )}

          {loading && (
            <div style={styles.emptyState}>Carregando movimentações de policiais...</div>
          )}
        </div>

        {!loading && filteredMovements.length > 0 && (
          <div className="mobile-card-view" style={styles.mobileCards}>
            {filteredMovements.map((movement) => (
              <article key={movement.id} style={styles.mobileCard}>
                <div style={styles.mobileCardHeader}>
                  <div>
                    <h3 style={styles.mobileCardTitle}>{movement.officer_name || "-"}</h3>
                    <p style={styles.mobileCardMeta}>
                      {formatDateTime(movement.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleViewMovement(movement)}
                    style={{
                      ...styles.button,
                      ...styles.secondaryButton,
                      ...styles.tableActionButton,
                    }}
                  >
                    Ver
                  </button>
                </div>

                <div style={styles.mobileCardGrid}>
                  <div style={styles.mobileCardRow}>
                    <p style={styles.mobileCardLabel}>Origem</p>
                    <p style={styles.mobileCardValue}>{movement.from_unit_label || "-"}</p>
                  </div>
                  <div style={styles.mobileCardRow}>
                    <p style={styles.mobileCardLabel}>Destino</p>
                    <p style={styles.mobileCardValue}>{movement.to_unit_label || "-"}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MovementDetailSection({ title, fields }) {
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

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("pt-BR");
}

export default PoliceOfficerMovementsList;
