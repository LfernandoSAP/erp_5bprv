import { Children, cloneElement, isValidElement, useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import SearchInputAction from "../components/SearchInputAction";
import { getPoliceOfficers } from "../services/policeOfficerService";
import { getUnits } from "../services/referenceDataService";
import {
  createFleetVehicle,
  deleteFleetVehicle,
  getFleetVehicles,
  restoreFleetVehicle,
  updateFleetVehicle,
} from "../services/fleetService";
import { readViewerAccess as readAuthAccess } from "../utils/authAccess";
import {
  FLEET_COLOR_OPTIONS as COLOR_OPTIONS,
  FLEET_FUEL_OPTIONS as FUEL_OPTIONS,
  FLEET_HOLDER_OPTIONS as HOLDER_OPTIONS,
  FLEET_SITUATION_OPTIONS as VEHICLE_SITUATION_OPTIONS,
} from "../utils/fleetOptions";
import { formatIdentifier, maskPlate, normalizeUpperIdentifier } from "../utils/identifierFormat";
import { getOfficerDisplayName } from "../utils/officerLabels";
import { buildHierarchicalUnitLabelMap } from "../utils/unitOptions";
import {
  buildUnitFilterDescription,
  buildUnitFilterOptions,
  resolveEffectiveUnitFilter,
} from "../utils/unitFilters";

const CATEGORY = "CONTROLE_GERAL_VIATURAS";

function stickyColumn(left, minWidth, isHeader = false) {
  return {
    position: "sticky",
    left,
    zIndex: isHeader ? 4 : 2,
    backgroundColor: isHeader ? "var(--app-surface-muted)" : "var(--app-surface)",
    minWidth,
    boxShadow: left > 0 ? "6px 0 12px rgba(15, 23, 42, 0.06)" : "none",
  };
}

function FleetGeneralControlPage({ onBack, onMoveItem, startWithForm = false }) {
  const [showForm, setShowForm] = useState(startWithForm);
  const [items, setItems] = useState([]);
  const [policeOfficers, setPoliceOfficers] = useState([]);
  const [units, setUnits] = useState([]);
  const [unitMap, setUnitMap] = useState({});
  const [viewerAccess, setViewerAccess] = useState({
    unitId: null,
    unitType: null,
    unitLabel: null,
    canViewAll: false,
  });
  const [selectedUnitFilter, setSelectedUnitFilter] = useState("ALL_VISIBLE");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState(createInitialForm());
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

  useEffect(() => {
    setShowForm(startWithForm);
    if (!startWithForm) {
      setEditingId(null);
      setForm(createInitialForm());
    }
  }, [startWithForm]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    setViewerAccess(readAuthAccess());
    loadVehicles();
    loadPoliceOfficers();
    loadUnits();
  }, [effectiveUnitFilter]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const resolvedHolder = useMemo(() => {
    if (form.holder === "CONCESSIONÁRIA") {
      return form.customHolder.trim();
    }
    return form.holder;
  }, [form]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleUpperIdentifier = (field, maxLength = null) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: normalizeUpperIdentifier(event.target.value, maxLength),
    }));
  };

  const handlePlateChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: maskPlate(event.target.value) }));
  };

  const handleYearChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value.replace(/\D/g, "").slice(0, 4),
    }));
  };

  const loadPoliceOfficers = async () => {
    try {
      const data = await getPoliceOfficers("");
      setPoliceOfficers(data);
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar policiais.");
    }
  };

  const loadUnits = async () => {
    try {
      const data = await getUnits();
      setUnits(data);
      setUnitMap(buildHierarchicalUnitLabelMap(data));
    } catch {
      // ignore
    }
  };

  const loadVehicles = async (search = "") => {
    try {
      setLoading(true);
      setError("");
      const data = await getFleetVehicles({
        includeInactive: true,
        category: CATEGORY,
        search,
        unitId: effectiveUnitFilter,
      });
      setItems(data);
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar o controle geral de viaturas.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!resolvedHolder) {
      setError("Informe o detentor da viatura.");
      return;
    }

    try {
      const access = readAuthAccess();
      if (!access.unitId) {
        throw new Error("Não foi possível identificar a unidade do usuário.");
      }

      const payload = {
        police_officer_id: form.policeOfficerId ? Number(form.policeOfficerId) : null,
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: form.modelYear.trim() || form.manufactureYear.trim(),
        prefix: form.prefix.trim(),
        holder: resolvedHolder,
        plate: form.plate.trim(),
        fuel_type: form.fuelType.trim() || null,
        current_mileage: form.currentMileage.trim() || null,
        situation: form.situation.trim() || null,
        renavam: form.renavam.trim() || null,
        chassis: form.chassis.trim() || null,
        color: form.color.trim() || null,
        manufacture_year: form.manufactureYear.trim() || null,
        model_year: form.modelYear.trim() || null,
        fixed_driver: form.fixedDriver.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (editingId) {
        await updateFleetVehicle(editingId, payload);
        setSuccess("Controle geral de viatura atualizado com sucesso.");
      } else {
        await createFleetVehicle({
          unit_id: access.unitId,
          category: CATEGORY,
          ...payload,
          is_active: true,
        });
        setSuccess("Viatura cadastrada no controle geral com sucesso.");
      }

      resetForm();
      await loadVehicles(searchTerm);
    } catch (submitError) {
      setError(submitError.message || "Erro ao salvar viatura.");
    }
  };

  const handleSearch = async () => {
    await loadVehicles(searchTerm);
  };

  const handleEdit = (item) => {
    setSelectedItem(null);
    setEditingId(item.id);
    setForm({
      prefix: normalizeUpperIdentifier(item.prefix || ""),
      plate: maskPlate(item.plate || ""),
      brand: item.brand || "",
      model: item.model || "",
      fuelType: item.fuel_type || "",
      currentMileage: item.current_mileage || "",
      situation: item.situation || "",
      renavam: normalizeUpperIdentifier(item.renavam || ""),
      chassis: normalizeUpperIdentifier(item.chassis || ""),
      color: item.color || "",
      manufactureYear: item.manufacture_year || item.year || "",
      modelYear: item.model_year || item.year || "",
      fixedDriver: item.fixed_driver || "",
      holder: HOLDER_OPTIONS.includes(item.holder) ? item.holder : "CONCESSIONÁRIA",
      customHolder: HOLDER_OPTIONS.includes(item.holder) ? "" : item.holder || "",
      policeOfficerId: item.police_officer_id ? String(item.police_officer_id) : "",
      notes: item.notes || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Deseja inativar esta viatura?")) {
      return;
    }

    try {
      await deleteFleetVehicle(itemId);
      setSuccess("Viatura inativada com sucesso.");
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }
      await loadVehicles(searchTerm);
    } catch (deleteError) {
      setError(deleteError.message || "Erro ao inativar viatura.");
    }
  };

  const handleRestore = async (itemId) => {
    if (!window.confirm("Deseja reativar esta viatura?")) {
      return;
    }

    try {
      await restoreFleetVehicle(itemId);
      setSuccess("Viatura reativada com sucesso.");
      await loadVehicles(searchTerm);
    } catch (restoreError) {
      setError(restoreError.message || "Erro ao reativar viatura.");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(createInitialForm());
    setShowForm(false);
  };

  const handleViewItem = (item) => {
    setSelectedItem(item);
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Controle Geral de Viaturas</h1>
        <p style={styles.subtitle}>
          Cadastre e acompanhe os dados principais das viaturas em uma visão operacional única.
        </p>

        <div style={styles.actions}>
          <button
            onClick={onBack}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Voltar
          </button>
          <button
            onClick={() => {
              if (!showForm) {
                setEditingId(null);
                setForm(createInitialForm());
              }
              setShowForm((current) => !current);
            }}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            Nova viatura
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      <section style={{ ...styles.card, marginBottom: "24px" }}>
        <h2 style={styles.sectionTitle}>Consulta do controle geral</h2>
        <p style={styles.sectionText}>
          Pesquise por prefixo, placa, marca, modelo, chassi, RENAVAM ou situação da viatura.
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
            onSearch={handleSearch}
            placeholder="Pesquisar por prefixo, placa, marca, modelo, chassis ou RENAVAM"
            style={styles.actionFieldWide}
          />
        </div>
        <p style={{ ...styles.helperText, marginTop: "12px" }}>{filterDescription}</p>
      </section>

      {showForm && (
        <section style={{ ...styles.card, marginBottom: "24px" }}>
          <h2 style={styles.sectionTitle}>
            {editingId ? "Editar viatura" : "Cadastrar viatura"}
          </h2>
          <p style={styles.sectionText}>
            Preencha os dados do controle geral da viatura para manter a base operacional atualizada.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <Field label="Prefixo">
                <input value={form.prefix} onChange={handleUpperIdentifier("prefix", 20)} required style={styles.input} />
              </Field>
              <Field label="Placa">
                <input value={form.plate} onChange={handlePlateChange("plate")} required style={styles.input} />
              </Field>
              <Field label="Marca">
                <input value={form.brand} onChange={handleChange("brand")} required style={styles.input} />
              </Field>
              <Field label="Modelo">
                <input value={form.model} onChange={handleChange("model")} required style={styles.input} />
              </Field>
              <Field label="Combustível">
                <select value={form.fuelType} onChange={handleChange("fuelType")}>
                  <option value="">Selecione</option>
                  {FUEL_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="KM atual">
                <input value={form.currentMileage} onChange={handleChange("currentMileage")} style={styles.input} />
              </Field>
              <Field label="Situação da viatura">
                <select value={form.situation} onChange={handleChange("situation")}>
                  <option value="">Selecione</option>
                  {VEHICLE_SITUATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="RENAVAM">
                <input value={form.renavam} onChange={handleUpperIdentifier("renavam", 20)} style={styles.input} />
              </Field>
              <Field label="Chassi">
                <input value={form.chassis} onChange={handleUpperIdentifier("chassis", 30)} style={styles.input} />
              </Field>
              <Field label="Cor">
                <select value={form.color} onChange={handleChange("color")}>
                  <option value="">Selecione</option>
                  {COLOR_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ano fabricação">
                <input
                  value={form.manufactureYear}
                  onChange={handleYearChange("manufactureYear")}
                  inputMode="numeric"
                  maxLength={4}
                  required
                  style={styles.input}
                />
              </Field>
              <Field label="Ano modelo">
                <input
                  value={form.modelYear}
                  onChange={handleYearChange("modelYear")}
                  inputMode="numeric"
                  maxLength={4}
                  required
                  style={styles.input}
                />
              </Field>
              <Field label="Condutor fixo">
                <input value={form.fixedDriver} onChange={handleChange("fixedDriver")} style={styles.input} />
              </Field>
              <Field label="Detentor">
                <select
                  value={form.holder}
                  onChange={handleChange("holder")}
                  required
                  style={styles.input}
                >
                  <option value="">Selecione</option>
                  {HOLDER_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              {form.holder === "CONCESSIONÁRIA" && (
                <Field label="Digite a concessionária">
                  <input
                    value={form.customHolder}
                    onChange={handleChange("customHolder")}
                    required
                    style={styles.input}
                  />
                </Field>
              )}
              <Field label="Policial responsável">
                <select
                  value={form.policeOfficerId}
                  onChange={handleChange("policeOfficerId")}
                  style={styles.input}
                >
                  <option value="">Não vincular</option>
                  {policeOfficers.map((officer) => (
                    <option key={officer.id} value={officer.id}>
                      {officer.re_with_digit} - {getOfficerDisplayName(officer)}
                    </option>
                  ))}
                </select>
              </Field>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Observações</label>
                <textarea value={form.notes} onChange={handleChange("notes")} style={styles.textarea} />
              </div>
            </div>

            <div style={styles.footerActions}>
              <button
                type="button"
                onClick={resetForm}
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{ ...styles.button, ...styles.primaryButton }}
              >
                {editingId ? "Salvar alterações" : "Cadastrar viatura"}
              </button>
            </div>
          </form>
        </section>
      )}

      {selectedItem && (
        <section style={{ ...styles.card, marginBottom: "24px" }}>
          <h2 style={styles.sectionTitle}>Resumo da viatura selecionada</h2>
          <p style={styles.sectionText}>Visão rápida da viatura aberta no controle geral.</p>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Prefixo</p><p style={styles.summaryValue}>{formatIdentifier(selectedItem.prefix) || "-"}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Placa</p><p style={styles.summaryValue}>{formatIdentifier(selectedItem.plate) || "-"}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Marca/Modelo</p><p style={styles.summaryValue}>{[selectedItem.brand, selectedItem.model].filter(Boolean).join(" / ") || "-"}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Unidade</p><p style={styles.summaryValue}>{selectedItem.unit_label || selectedItem.unit_name || "-"}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Situação</p><p style={styles.summaryValue}>{selectedItem.situation || "-"}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Detentor</p><p style={styles.summaryValue}>{selectedItem.holder || "-"}</p></div>
          </div>
        </section>
      )}

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
                <h2 style={styles.sectionTitle}>Detalhes da viatura</h2>
                <p style={styles.sectionText}>
                  Consulte os dados completos da viatura selecionada.
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
                  onClick={() => handleEdit(selectedItem)}
                  style={{ ...styles.button, ...styles.primaryButton }}
                >
                  ✏ Editar
                </button>
              </div>
            </div>

            <DetailSection
              title="Identificação"
              fields={[
                ["Prefixo", formatIdentifier(selectedItem.prefix) || "-"],
                ["Placa", formatIdentifier(selectedItem.plate) || "-"],
                ["Marca", selectedItem.brand || "-"],
                ["Modelo", selectedItem.model || "-"],
                ["Unidade", selectedItem.unit_label || selectedItem.unit_name || "-"],
                ["Situação", selectedItem.situation || "-"],
                ["Combustível", selectedItem.fuel_type || "-"],
                ["KM atual", selectedItem.current_mileage || "-"],
              ]}
            />

            <div style={{ marginTop: "16px" }}>
              <DetailSection
                title="Informações complementares"
                fields={[
                  ["RENAVAM", selectedItem.renavam || "-"],
                  ["Chassi", selectedItem.chassis || "-"],
                  ["Cor", selectedItem.color || "-"],
                  ["Ano fabricação", selectedItem.manufacture_year || selectedItem.year || "-"],
                  ["Ano modelo", selectedItem.model_year || selectedItem.year || "-"],
                  ["Detentor", selectedItem.holder || "-"],
                  ["Condutor fixo", selectedItem.fixed_driver || "-"],
                  [
                    "Policial responsável",
                    selectedItem.police_officer_name || selectedItem.police_officer_re
                      ? `${selectedItem.police_officer_re || ""} ${selectedItem.police_officer_name || ""}`.trim()
                      : "Não vinculado",
                  ],
                ]}
              />
            </div>

            {selectedItem.notes ? (
              <div style={{ marginTop: "16px" }}>
                <DetailSection title="Observações" fields={[["Notas", selectedItem.notes]]} />
              </div>
            ) : null}

            <div style={{ ...styles.actions, marginTop: "18px" }}>
              {selectedItem.is_active && onMoveItem ? (
                <button
                  type="button"
                  onClick={() => onMoveItem(selectedItem.id)}
                  style={{ ...styles.button, ...styles.primaryButton }}
                >
                  Movimentar
                </button>
              ) : null}
              {selectedItem.is_active ? (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedItem.id)}
                  style={{ ...styles.button, ...styles.dangerButton }}
                >
                  Inativar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRestore(selectedItem.id)}
                  style={{ ...styles.button, ...styles.secondaryButton }}
                >
                  Reativar
                </button>
              )}
            </div>
          </section>
        )}

        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.tableTitle}>Controle geral cadastrado</h2>
            <p style={styles.tableMeta}>{items.length} registro(s) encontrado(s)</p>
          </div>
        </div>

        <div className="desktop-table-view" style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, ...stickyColumn(0, 84, true), width: "60px", whiteSpace: "nowrap" }}>Ver</th>
                <th style={{ ...styles.th, ...stickyColumn(84, 140, true), width: "120px", whiteSpace: "nowrap" }}>Prefixo</th>
                <th style={{ ...styles.th, ...stickyColumn(224, 150, true), width: "130px", whiteSpace: "nowrap" }}>Placa</th>
                <th style={{ ...styles.th, width: "160px", whiteSpace: "nowrap" }}>Marca</th>
                <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>Modelo</th>
                <th style={{ ...styles.th, width: "180px", whiteSpace: "nowrap" }}>Unidade</th>
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
                  <td style={{ ...styles.td, ...stickyColumn(0, 84), padding: "10px 12px" }}>
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
                  <td style={{ ...styles.td, ...stickyColumn(84, 140), padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {formatIdentifier(item.prefix)}
                  </td>
                  <td style={{ ...styles.td, ...stickyColumn(224, 150), padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {formatIdentifier(item.plate)}
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {item.brand || "-"}
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {item.model || "-"}
                  </td>
                  <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {item.unit_label || item.unit_name || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && items.length === 0 && (
            <div style={styles.emptyState}>
              Nenhuma viatura cadastrada no controle geral ainda.
            </div>
          )}

        {loading && <div style={styles.emptyState}>Carregando controle geral...</div>}
        </div>

        {items.length > 0 && !loading && (
          <div className="mobile-card-view" style={styles.mobileCards}>
            {items.map((item) => (
              <article key={item.id} style={styles.mobileCard}>
                <div style={styles.mobileCardHeader}>
                  <div>
                    <h3 style={styles.mobileCardTitle}>
                      {formatIdentifier(item.prefix) || "-"}
                    </h3>
                    <p style={styles.mobileCardMeta}>
                      {[item.brand, item.model].filter(Boolean).join(" • ") || "-"}
                    </p>
                  </div>
                </div>

                <div style={styles.mobileCardGrid}>
                  <div style={styles.mobileCardRow}>
                    <p style={styles.mobileCardLabel}>Placa</p>
                    <p style={styles.mobileCardValue}>{formatIdentifier(item.plate)}</p>
                  </div>
                  <div style={styles.mobileCardRow}>
                    <p style={styles.mobileCardLabel}>Unidade</p>
                    <p style={styles.mobileCardValue}>
                      {item.unit_label || item.unit_name || "-"}
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
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const controlFieldInputStyle = {
  ...styles.input,
  minHeight: "52px",
  borderRadius: "16px",
};

function Field({ label, children }) {
  const enhancedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    const nextStyle = {
      ...controlFieldInputStyle,
      ...(child.props.style || {}),
    };

    return cloneElement(child, { style: nextStyle });
  });

  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {enhancedChildren}
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

function createInitialForm() {
  return {
    prefix: "",
    plate: "",
    brand: "",
    model: "",
    fuelType: "",
    currentMileage: "",
    situation: "",
    renavam: "",
    chassis: "",
    color: "",
    manufactureYear: "",
    modelYear: "",
    fixedDriver: "",
    holder: "",
    customHolder: "",
    policeOfficerId: "",
    notes: "",
  };
}

export default FleetGeneralControlPage;


