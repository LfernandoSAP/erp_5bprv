import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import ReportExportButtons from "../components/ReportExportButtons";
import { apiFetch } from "../services/api";
import { getUnitTreeRoot } from "../services/referenceDataService";
import { readViewerAccess as readAuthAccess } from "../utils/authAccess";
import { buildReportSubtitle } from "../utils/reportContext";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";
import { buildHierarchicalUnitOptions } from "../utils/unitOptions";

function Units({ onBack }) {
  const [viewerAccess, setViewerAccess] = useState({ canViewAll: false });
  const [units, setUnits] = useState([]);
  const [flatUnits, setFlatUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    codigo_opm: "",
    type: "CIA",
    parent_unit_id: "",
    can_view_all: false,
    is_active: true,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadUnits() {
    try {
      setError("");
      const data = await getUnitTreeRoot();
      setUnits(data);
      setFlatUnits(buildHierarchicalUnitOptions(flattenTreeToUnits(data)));
    } catch (currentError) {
      setError(currentError.message || "Erro ao carregar unidades");
    }
  }

  useEffect(() => {
    setViewerAccess(readAuthAccess());
    void loadUnits();
  }, []);

  const allUnits = useMemo(() => flattenTreeToUnits(units), [units]);

  const unitReportRows = useMemo(
    () =>
      allUnits.map((unit) => ({
        name: unit.name || "-",
        code: unit.code || "-",
        codigo_opm: unit.codigo_opm || "-",
        type: formatUnitType(unit.type),
        parent: resolveParentUnitName(unit, allUnits),
        scope: unit.can_view_all ? "Visão global" : "Escopo local",
        status: unit.is_active ? "Ativa" : "Inativa",
      })),
    [allUnits]
  );

  const unitReportColumns = useMemo(
    () => [
      { key: "name", label: "Nome", width: 24 },
      { key: "code", label: "Código", width: 14 },
      { key: "codigo_opm", label: "Código OPM", width: 16 },
      { key: "type", label: "Tipo", width: 14 },
      { key: "parent", label: "Unidade pai", width: 24 },
      { key: "scope", label: "Escopo", width: 16 },
      { key: "status", label: "Status", width: 12 },
    ],
    []
  );

  const reportSubtitle = useMemo(
    () =>
      buildReportSubtitle({
        totalRows: unitReportRows.length,
        extraDetails: ["Estrutura hierárquica das unidades"],
      }),
    [unitReportRows.length]
  );

  const activeUnitsCount = useMemo(
    () => unitReportRows.filter((unit) => unit.status === "Ativa").length,
    [unitReportRows]
  );

  const inactiveUnitsCount = unitReportRows.length - activeUnitsCount;

  const handleViewUnit = (unit) => {
    setSelectedUnit(unit);
  };

  const handleCloseDetails = () => {
    setSelectedUnit(null);
  };

  const handleUpdateSelectedUnit = async () => {
    if (!selectedUnit) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      const updated = await apiFetch(`/rh/units/${selectedUnit.id}`, {
        method: "PUT",
        body: JSON.stringify({
          codigo_opm: String(selectedUnit.codigo_opm || "").trim() || null,
        }),
      });
      setSelectedUnit(updated);
      setSuccess("Código OPM atualizado com sucesso!");
      await loadUnits();
    } catch (currentError) {
      setError(currentError.message || "Erro ao atualizar código OPM");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim() || null,
      codigo_opm: formData.codigo_opm.trim() || null,
      type: formData.type,
      parent_unit_id: formData.parent_unit_id
        ? Number(formData.parent_unit_id)
        : null,
      can_view_all: formData.can_view_all,
      is_active: formData.is_active,
    };

    try {
      await apiFetch("/rh/units/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuccess("Unidade cadastrada com sucesso!");
      setShowForm(false);
      setFormData({
        name: "",
        code: "",
        codigo_opm: "",
        type: "CIA",
        parent_unit_id: "",
        can_view_all: false,
        is_active: true,
      });
      await loadUnits();
    } catch (currentError) {
      setError(currentError.message || "Erro ao cadastrar unidade");
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Unidades</h1>
        <p style={styles.subtitle}>
          Consulte a hierarquia institucional do ERP e cadastre novas unidades
          quando isso fizer sentido na estrutura do batalhão.
        </p>

        <div style={styles.actions}>
          <button
            type="button"
            onClick={onBack}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Voltar
          </button>

          {viewerAccess.canViewAll && (
            <button
              type="button"
              onClick={() => setShowForm((current) => !current)}
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              {showForm ? "Fechar cadastro" : "Nova unidade"}
            </button>
          )}
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      {showForm && viewerAccess.canViewAll && (
        <form onSubmit={handleSubmit} style={{ ...styles.card, marginBottom: "24px" }}>
          <h2 style={styles.sectionTitle}>Cadastro de unidade</h2>
          <p style={styles.sectionText}>
            Preencha os dados básicos da unidade e vincule-a ao pai correto na
            hierarquia.
          </p>

          <div style={styles.formGrid}>
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

            <div style={styles.field}>
              <label style={styles.label}>Código OPM</label>
              <input
                type="text"
                value={formData.codigo_opm}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, codigo_opm: event.target.value }))
                }
                style={styles.input}
              />
              <small style={styles.helperText}>
                Use este campo para registrar o código operacional, como `620050000`.
              </small>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Tipo</label>
              <select
                value={formData.type}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, type: event.target.value }))
                }
                style={styles.input}
              >
                <option value="BATALHAO">Batalhão</option>
                <option value="CIA">CIA</option>
                <option value="PELOTAO">Pelotão</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Unidade pai</label>
              <select
                value={formData.parent_unit_id}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    parent_unit_id: event.target.value,
                  }))
                }
                style={styles.input}
              >
                <option value="">Sem unidade pai</option>
                {flatUnits.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Escopo global</label>
              <select
                value={formData.can_view_all ? "SIM" : "NAO"}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    can_view_all: event.target.value === "SIM",
                  }))
                }
                style={styles.input}
              >
                <option value="NAO">Não</option>
                <option value="SIM">Sim</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Status</label>
              <select
                value={formData.is_active ? "ATIVA" : "INATIVA"}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_active: event.target.value === "ATIVA",
                  }))
                }
                style={styles.input}
              >
                <option value="ATIVA">Ativa</option>
                <option value="INATIVA">Inativa</option>
              </select>
            </div>
          </div>

          <div style={styles.footerActions}>
            <button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>
              Salvar unidade
            </button>
          </div>
        </form>
      )}

      <section style={styles.card}>
        {selectedUnit && (
          <section style={{ ...styles.card, marginBottom: "24px" }}>
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
                <h2 style={styles.sectionTitle}>Detalhes da unidade</h2>
                <p style={styles.sectionText}>
                  Consulte os dados estruturais da unidade selecionada.
                </p>
                <p style={styles.helperText}>
                  O <strong>Código</strong> é o identificador técnico interno.
                  O <strong>Código OPM</strong> é o valor operacional editável.
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
                ["Nome", selectedUnit.name || "-"],
                ["Código", selectedUnit.code || "-"],
                [
                  "Código OPM",
                  viewerAccess.canViewAll ? (
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <input
                        type="text"
                        value={selectedUnit.codigo_opm || ""}
                        onChange={(event) =>
                          setSelectedUnit((current) =>
                            current ? { ...current, codigo_opm: event.target.value } : current
                          )
                        }
                        style={styles.input}
                      />
                      <button
                        type="button"
                        onClick={handleUpdateSelectedUnit}
                        style={{ ...styles.button, ...styles.primaryButton }}
                      >
                        Salvar
                      </button>
                    </div>
                  ) : (
                    selectedUnit.codigo_opm || "-"
                  ),
                ],
                ["Tipo", formatUnitType(selectedUnit.type)],
                ["Unidade pai", resolveParentUnitName(selectedUnit, allUnits)],
                [
                  "Escopo",
                  selectedUnit.can_view_all ? "Visão global" : "Escopo local",
                ],
                ["Status", selectedUnit.is_active ? "Ativa" : "Inativa"],
              ]}
            />
          </section>
        )}

        <div style={{ ...styles.tableHeader, margin: "-18px -18px 18px" }}>
          <div>
            <h2 style={styles.tableTitle}>Árvore de unidades</h2>
            <p style={styles.tableMeta}>
              {unitReportRows.length} unidade(s) cadastrada(s)
            </p>
          </div>
          <ReportExportButtons
            disabled={unitReportRows.length === 0}
            onExportExcel={() =>
              exportExcelReport({
                fileBaseName: "unidades",
                sheetName: "Unidades",
                title: "Relatório de unidades",
                subtitle: reportSubtitle,
                columns: unitReportColumns,
                rows: unitReportRows,
              })
            }
            onExportPdf={() =>
              exportPdfReport({
                fileBaseName: "unidades",
                title: "Relatório de unidades",
                subtitle: reportSubtitle,
                columns: unitReportColumns,
                rows: unitReportRows,
              })
            }
          />
        </div>

        <p style={styles.sectionText}>
          Visualize a estrutura principal e as subordinações cadastradas.
        </p>

        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Unidades</p>
            <p style={styles.summaryValue}>{unitReportRows.length}</p>
          </div>
          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Ativas</p>
            <p style={styles.summaryValue}>{activeUnitsCount}</p>
          </div>
          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Inativas</p>
            <p style={styles.summaryValue}>{inactiveUnitsCount}</p>
          </div>
          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Escopo do usuário</p>
            <p style={{ ...styles.summaryValue, ...styles.summaryValueSoft }}>
              {viewerAccess.canViewAll ? "Visão global" : "Escopo local"}
            </p>
          </div>
        </div>

        <div className="desktop-table-view" style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "60px", whiteSpace: "nowrap" }}>Ver</th>
                <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>Nome</th>
                <th style={{ ...styles.th, width: "140px", whiteSpace: "nowrap" }}>
                  Código
                </th>
                <th style={{ ...styles.th, width: "140px", whiteSpace: "nowrap" }}>
                  Código OPM
                </th>
                <th style={{ ...styles.th, width: "140px", whiteSpace: "nowrap" }}>Tipo</th>
                <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>
                  Unidade pai
                </th>
                <th style={{ ...styles.th, width: "140px", whiteSpace: "nowrap" }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {unitReportRows.map((unit, index) => (
                <tr
                  key={`${unit.name}-${unit.code}-${index}`}
                  style={
                    index % 2 === 1
                      ? { backgroundColor: "var(--app-surface-muted)" }
                      : undefined
                  }
                >
                  <td style={{ ...styles.td, padding: "10px 12px" }}>
                    <button
                      type="button"
                      onClick={() => handleViewUnit(allUnits[index])}
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
                    {unit.name}
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {unit.code}
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {unit.codigo_opm}
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {unit.type}
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {unit.parent}
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        ...styles.badge,
                        ...(unit.status === "Ativa"
                          ? styles.activeBadge
                          : styles.inactiveBadge),
                      }}
                    >
                      {unit.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {units.length === 0 ? (
          <div style={styles.emptyState}>Nenhuma unidade encontrada.</div>
        ) : (
          <div className="mobile-card-view" style={styles.mobileCards}>
            {allUnits.map((unit) => (
              <article key={unit.id} style={styles.mobileCard}>
                <div style={styles.mobileCardHeader}>
                  <div>
                    <h3 style={styles.mobileCardTitle}>{unit.name}</h3>
                    <p style={styles.mobileCardMeta}>
                      {formatUnitType(unit.type)} • Código: {unit.code || "-"} • OPM:{" "}
                      {unit.codigo_opm || "-"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleViewUnit(unit)}
                    style={{
                      ...styles.button,
                      ...styles.secondaryButton,
                      ...styles.tableActionButton,
                    }}
                  >
                    Ver
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

function flattenTreeToUnits(units) {
  return units.flatMap((unit) => [
    {
      ...unit,
      children: undefined,
    },
    ...flattenTreeToUnits(unit.children || []).map((child) => ({
      ...child,
      parent_unit_id: child.parent_unit_id ?? unit.id,
    })),
  ]);
}

function formatUnitType(type) {
  const normalizedType = String(type || "").trim().toUpperCase();
  const typeMap = {
    BATALHAO: "Batalhão",
    CIA: "CIA",
    PELOTAO: "Pelotão",
  };

  return typeMap[normalizedType] || type || "-";
}

function resolveParentUnitName(unit, allUnits) {
  if (!unit.parent_unit_id) {
    return "-";
  }

  const parent = allUnits.find((current) => current.id === unit.parent_unit_id);
  return parent?.name || String(unit.parent_unit_id);
}

export default Units;
