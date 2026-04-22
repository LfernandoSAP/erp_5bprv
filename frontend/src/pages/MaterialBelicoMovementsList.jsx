import { useCallback, useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import ReportExportButtons from "../components/ReportExportButtons";
import SearchInputAction from "../components/SearchInputAction";
import { getMaterialBelicoMovements } from "../services/materialBelicoService";
import { getUnits } from "../services/referenceDataService";
import { readViewerAccess } from "../utils/authAccess";
import { buildReportSubtitle } from "../utils/reportContext";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";
import {
  buildUnitFilterDescription,
  buildUnitFilterOptions,
  resolveEffectiveUnitFilter,
} from "../utils/unitFilters";

function MaterialBelicoMovementsList({ onBack }) {
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
        movement.item_name,
        movement.user_name,
        movement.movement_type,
        movement.from_unit_label,
        movement.to_unit_label,
        movement.from_officer_re,
        movement.from_officer_name,
        movement.to_officer_re,
        movement.to_officer_name,
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
      { key: "item", label: "Categoria", width: 24 },
      { key: "type", label: "Tipo", width: 14 },
      { key: "from", label: "Origem", width: 30 },
      { key: "to", label: "Destino", width: 30 },
      { key: "user", label: "Usuário", width: 20 },
      { key: "createdAt", label: "Data/Hora", width: 18 },
      { key: "details", label: "Detalhes", width: 28 },
    ],
    []
  );

  const reportRows = useMemo(
    () =>
      filteredMovements.map((movement) => ({
        item: movement.item_name || "Material bélico",
        type: formatMovementType(movement.movement_type),
        from: `${movement.from_unit_label || "-"} | Policial: ${formatOfficerSummary(
          movement.from_officer_re,
          movement.from_officer_name
        )}`,
        to: `${movement.to_unit_label || "-"} | Policial: ${formatOfficerSummary(
          movement.to_officer_re,
          movement.to_officer_name
        )}`,
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

  const movementTypeCounts = useMemo(
    () =>
      filteredMovements.reduce(
        (accumulator, movement) => {
          if (
            movement.movement_type === "TRANSFERENCIA" ||
            movement.movement_type === "TRANSFERENCIA_MUNICAO" ||
            movement.movement_type === "TRANSFERENCIA_QUANTIDADE"
          ) {
            accumulator.transferencias += 1;
          } else if (movement.movement_type === "MANUTENCAO") {
            accumulator.manutencoes += 1;
          } else if (movement.movement_type === "BAIXA") {
            accumulator.baixas += 1;
          }
          return accumulator;
        },
        { transferencias: 0, manutencoes: 0, baixas: 0 }
      ),
    [filteredMovements]
  );

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
      const data = await getMaterialBelicoMovements({
        unitId: effectiveUnitFilter,
      });
      setMovements(data);
    } catch (currentError) {
      setError(
        currentError.message ||
          "Erro ao carregar movimentações do material bélico"
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
        <h1 style={styles.title}>Material Bélico - Movimentações</h1>
        <p style={styles.subtitle}>
          Consulte o histórico de transferências, manutenções e baixas do
          material bélico.
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
          Filtre por categoria, usuário, unidade, policial responsável ou
          detalhes.
        </p>

        <div style={styles.infoBox}>
          O histórico abaixo mostra origem e destino completos de cada
          movimentação, incluindo o policial responsável em cada ponta da
          transferência.
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
                  Consulte as informações completas do registro de material
                  bélico selecionado.
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
                ["Categoria", viewingMovement.item_name || "Material bélico"],
                ["Tipo", formatMovementType(viewingMovement.movement_type)],
                ["Data/Hora", formatDateTime(viewingMovement.created_at)],
                ["Usuário", viewingMovement.user_name || "Usuário não informado"],
                ["Detalhes", viewingMovement.details || "-"],
              ]}
            />

            <div style={{ marginTop: "16px" }}>
              <MovementDetailSection
                title="Origem"
                fields={[
                  ["Unidade", viewingMovement.from_unit_label || "-"],
                  [
                    "Policial",
                    formatOfficerSummary(
                      viewingMovement.from_officer_re,
                      viewingMovement.from_officer_name
                    ),
                  ],
                ]}
              />
            </div>

            <div style={{ marginTop: "16px" }}>
              <MovementDetailSection
                title="Destino"
                fields={[
                  ["Unidade", viewingMovement.to_unit_label || "-"],
                  [
                    "Policial",
                    formatOfficerSummary(
                      viewingMovement.to_officer_re,
                      viewingMovement.to_officer_name
                    ),
                  ],
                ]}
              />
            </div>
          </section>
        )}

        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.tableTitle}>Histórico do material bélico</h2>
            <p style={styles.tableMeta}>
              {filteredMovements.length} registro(s) encontrado(s)
            </p>
          </div>
          <ReportExportButtons
            disabled={reportRows.length === 0}
            onExportExcel={() =>
              exportExcelReport({
                fileBaseName: "material-belico-movimentacoes",
                sheetName: "Movimentações",
                title: "Relatório de movimentações do material bélico",
                subtitle: reportSubtitle,
                columns: reportColumns,
                rows: reportRows,
              })
            }
            onExportPdf={() =>
              exportPdfReport({
                fileBaseName: "material-belico-movimentacoes",
                title: "Relatório de movimentações do material bélico",
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
              <p style={styles.summaryValue}>{filteredMovements.length}</p>
            </div>
            <div style={styles.summaryCard}>
              <p style={styles.summaryLabel}>Transferências</p>
              <p style={styles.summaryValue}>{movementTypeCounts.transferencias}</p>
            </div>
            <div style={styles.summaryCard}>
              <p style={styles.summaryLabel}>Manutenções</p>
              <p style={styles.summaryValue}>{movementTypeCounts.manutencoes}</p>
            </div>
            <div style={styles.summaryCard}>
              <p style={styles.summaryLabel}>Baixas</p>
              <p style={styles.summaryValue}>{movementTypeCounts.baixas}</p>
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
                  Categoria
                </th>
                <th style={{ ...styles.th, width: "140px", whiteSpace: "nowrap" }}>
                  Tipo
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
                    <div style={{ fontWeight: 600 }}>
                      {movement.item_name || "Material bélico"}
                    </div>
                    <div style={styles.helperText}>
                      Registro #{movement.material_belico_id}
                    </div>
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        ...styles.badge,
                        ...resolveMovementBadgeStyle(movement.movement_type),
                      }}
                    >
                      {formatMovementType(movement.movement_type)}
                    </span>
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    <div style={{ fontWeight: 600 }}>{movement.from_unit_label || "-"}</div>
                    <div style={styles.helperText}>
                      {formatOfficerSummary(
                        movement.from_officer_re,
                        movement.from_officer_name
                      )}
                    </div>
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    <div style={{ fontWeight: 600 }}>{movement.to_unit_label || "-"}</div>
                    <div style={styles.helperText}>
                      {formatOfficerSummary(
                        movement.to_officer_re,
                        movement.to_officer_name
                      )}
                    </div>
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
              Nenhuma movimentação do material bélico encontrada para o filtro
              informado.
            </div>
          )}

          {loading && (
            <div style={styles.emptyState}>
              Carregando movimentações do material bélico...
            </div>
          )}
        </div>

        {!loading && filteredMovements.length > 0 && (
          <div className="mobile-card-view" style={styles.mobileCards}>
            {filteredMovements.map((movement) => (
              <article key={movement.id} style={styles.mobileCard}>
                <div style={styles.mobileCardHeader}>
                  <div>
                    <h3 style={styles.mobileCardTitle}>
                      {movement.item_name || "Material bélico"}
                    </h3>
                    <p style={styles.mobileCardMeta}>
                      {formatMovementType(movement.movement_type)}
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
                  <div style={styles.mobileCardRow}>
                    <p style={styles.mobileCardLabel}>Data/Hora</p>
                    <p style={styles.mobileCardValue}>
                      {formatDateTime(movement.created_at)}
                    </p>
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

function formatMovementType(value) {
  const typeMap = {
    TRANSFERENCIA: "Transferência",
    TRANSFERENCIA_MUNICAO: "Transferência",
    TRANSFERENCIA_QUANTIDADE: "Transferência",
    MANUTENCAO: "Manutenção",
    BAIXA: "Baixa",
  };

  return typeMap[value] || value || "-";
}

function resolveMovementBadgeStyle(type) {
  if (
    type === "TRANSFERENCIA" ||
    type === "TRANSFERENCIA_MUNICAO" ||
    type === "TRANSFERENCIA_QUANTIDADE"
  ) {
    return styles.infoBadge;
  }
  if (type === "MANUTENCAO") {
    return styles.neutralBadge;
  }
  if (type === "BAIXA") {
    return styles.inactiveBadge;
  }
  return styles.neutralBadge;
}

function formatOfficerSummary(re, name) {
  const parts = [re, name].filter(Boolean);
  return parts.length > 0 ? parts.join(" - ") : "Não informado";
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

export default MaterialBelicoMovementsList;
