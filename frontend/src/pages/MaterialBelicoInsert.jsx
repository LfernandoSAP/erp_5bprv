import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import { custodyOptions } from "../constants/custodyOptions";
import { createMaterialBelico } from "../services/materialBelicoService";
import { getPoliceOfficers } from "../services/policeOfficerService";
import { getSectors, getUnits } from "../services/referenceDataService";
import { readViewerAccess as readAuthAccess } from "../utils/authAccess";
import { buildCustodySummary } from "../utils/custodyLabels";
import {
  buildOfficerOptionLabel,
  buildOfficerSummary,
  findOfficerByLookup,
} from "../utils/officerLabels";
import { formatSectorLabel } from "../utils/sectorOptions";
import { buildHierarchicalUnitOptions } from "../utils/unitOptions";
import { getDateInputProps, maskDate, toIsoDate } from "./policeOfficerRegistrationUtils";
import {
  buildMaterialBelicoExtraColumns,
  buildMaterialBelicoFieldState,
  buildCdcMaterialLabel,
  getMaterialBelicoCategoryConfig,
  isMaterialBelicoFieldRequired,
  isMaterialBelicoFieldVisible,
  normalizeMaterialBelicoCaliber,
} from "../utils/materialBelicoUtils";

function MaterialBelicoInsert({ category, onBack }) {
  const dateInputProps = getDateInputProps();
  const [form, setForm] = useState({
    numeroSerie: "",
    patrimonio: "",
    observacoes: "",
    unitId: "",
    custodyType: "RESERVA_UNIDADE",
    custodySectorId: "",
    status: "Ativo",
    officerLookup: "",
    policeOfficerId: "",
    ...buildMaterialBelicoFieldState(),
  });
  const [units, setUnits] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [policeOfficers, setPoliceOfficers] = useState([]);
  const [viewerAccess, setViewerAccess] = useState({
    unitId: null,
    canViewAll: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const categoryConfig = useMemo(
    () => getMaterialBelicoCategoryConfig(category),
    [category]
  );
  const extraFields = useMemo(
    () => buildMaterialBelicoExtraColumns(category),
    [category]
  );

  useEffect(() => {
    const access = readAuthAccess();
    setViewerAccess(access);
    void loadUnits(access);
    void loadSectors();
    void loadPoliceOfficers();
  }, []);

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

  const availableSectors = useMemo(() => {
    if (!form.unitId) {
      return [];
    }
    return sectors.filter((sector) => String(sector.unit_id) === String(form.unitId));
  }, [sectors, form.unitId]);

  const availablePoliceOfficers = useMemo(() => {
    if (!form.unitId) {
      return [];
    }
    return policeOfficers.filter(
      (officer) => String(officer.unit_id) === String(form.unitId)
    );
  }, [policeOfficers, form.unitId]);

  const selectedOfficer = useMemo(
    () =>
      availablePoliceOfficers.find(
        (officer) => String(officer.id) === String(form.policeOfficerId)
      ),
    [availablePoliceOfficers, form.policeOfficerId]
  );

  const selectedSector = useMemo(
    () =>
      availableSectors.find(
        (sector) => String(sector.id) === String(form.custodySectorId)
      ),
    [availableSectors, form.custodySectorId]
  );

  useEffect(() => {
    if (form.custodyType !== "POLICIAL" && (form.policeOfficerId || form.officerLookup)) {
      setForm((prev) => ({
        ...prev,
        policeOfficerId: "",
        officerLookup: "",
      }));
    }
  }, [form.custodyType, form.policeOfficerId, form.officerLookup]);

  useEffect(() => {
    if (form.custodyType !== "SETOR" && form.custodySectorId) {
      setForm((prev) => ({
        ...prev,
        custodySectorId: "",
      }));
    }
  }, [form.custodyType, form.custodySectorId]);

  useEffect(() => {
    if (
      form.custodySectorId &&
      !availableSectors.some((sector) => String(sector.id) === String(form.custodySectorId))
    ) {
      setForm((prev) => ({
        ...prev,
        custodySectorId: "",
      }));
    }
  }, [availableSectors, form.custodySectorId]);

  useEffect(() => {
    if (form.cdc_material_type !== "EXOESQUELETO" && form.cdc_exoskeleton_size) {
      setForm((prev) => ({
        ...prev,
        cdc_exoskeleton_size: "",
      }));
    }
  }, [form.cdc_material_type, form.cdc_exoskeleton_size]);

  useEffect(() => {
    if (String(form.item_model || "").trim().toUpperCase() !== "OUTROS" && form.item_model_other) {
      setForm((prev) => ({
        ...prev,
        item_model_other: "",
      }));
    }
  }, [form.item_model, form.item_model_other]);

  useEffect(() => {
    if (String(form.item_holder || "").trim().toUpperCase() !== "CONCESSIONARIA" && form.item_holder_other) {
      setForm((prev) => ({
        ...prev,
        item_holder_other: "",
      }));
    }
  }, [form.item_holder, form.item_holder_other]);

  useEffect(() => {
    if (form.policeOfficerId && !selectedOfficer) {
      setForm((prev) => ({
        ...prev,
        policeOfficerId: "",
        officerLookup: "",
      }));
    }
  }, [form.policeOfficerId, selectedOfficer]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: maskDate(event.target.value) }));
  };

  const handleDateBlur = (field, label) => () => {
    setForm((prev) => {
      const value = prev[field];
      if (!value) {
        return prev;
      }
      if (toIsoDate(value)) {
        return prev;
      }
      setError(`Informe uma data válida para ${label} no formato DD/MM/AAAA.`);
      return { ...prev, [field]: "" };
    });
  };

  const handleOfficerLookupChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      officerLookup: value,
      policeOfficerId: "",
    }));
  };

  const handleOfficerSearch = () => {
    const matchedOfficer = findOfficerByLookup(
      availablePoliceOfficers,
      form.officerLookup
    );

    if (!matchedOfficer) {
      setError("Policial não encontrado para a unidade selecionada.");
      setForm((prev) => ({
        ...prev,
        policeOfficerId: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      officerLookup: buildOfficerOptionLabel(matchedOfficer),
      policeOfficerId: String(matchedOfficer.id),
    }));
  };

  async function loadUnits(access) {
    try {
      const activeUnits = await getUnits();
      setUnits(activeUnits);
      if (!access.canViewAll && access.unitId) {
        setForm((prev) => ({
          ...prev,
          unitId: String(access.unitId),
        }));
      }
    } catch (error) {
      setError(error.message || "Erro ao carregar unidades");
    }
  }

  async function loadSectors() {
    try {
      setSectors(await getSectors());
    } catch (error) {
      setError(error.message || "Erro ao carregar setores");
    }
  }

  async function loadPoliceOfficers() {
    try {
      setPoliceOfficers(await getPoliceOfficers());
    } catch (error) {
      setError(error.message || "Erro ao carregar policiais");
    }
  }

  const handleSave = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (form.custodyType === "POLICIAL" && !selectedOfficer) {
        throw new Error("Selecione o policial responsável pelo material.");
      }
      if (form.custodyType === "SETOR" && !selectedSector) {
        throw new Error("Selecione o setor responsável pelo material.");
      }

      const selectedUnit = units.find(
        (unit) => String(unit.id) === String(form.unitId)
      );

      await createMaterialBelico(
        buildMaterialBelicoPayload({
          form,
          category,
          unitName: selectedUnit?.display_name || selectedUnit?.name || "",
          officer: selectedOfficer,
          sector: selectedSector,
        })
      );

      onBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setError(message || "Erro de conexao");
    } finally {
      setLoading(false);
    }
  };

  const renderExtraField = (field) => {
    const visible = isMaterialBelicoFieldVisible(field, form);

    return (
      <div
        key={field.key}
        style={{
          ...styles.field,
          overflow: "hidden",
          maxHeight: visible ? "160px" : "0",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-6px)",
          transition: "max-height 220ms ease, opacity 220ms ease, transform 220ms ease",
          padding: visible ? undefined : 0,
          margin: visible ? undefined : 0,
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        <label style={styles.label}>{field.label}</label>
        {field.type === "select" ? (
          <select
            value={form[field.key] || ""}
            onChange={handleChange(field.key)}
            style={styles.input}
            required={visible && isMaterialBelicoFieldRequired(field, form)}
          >
            <option value="">Selecione</option>
            {field.options.map((option) => (
              <option
                key={typeof option === "string" ? option : option.value}
                value={typeof option === "string" ? option : option.value}
              >
                {typeof option === "string" ? option : option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={field.type === "number" ? "number" : "text"}
            value={form[field.key] || ""}
            onChange={
              field.type === "date"
                ? handleDateChange(field.key)
                : handleChange(field.key)
            }
            onBlur={
              field.type === "date"
                ? handleDateBlur(field.key, field.label)
                : undefined
            }
            inputMode={field.type === "date" ? dateInputProps.inputMode : undefined}
            maxLength={field.type === "date" ? dateInputProps.maxLength : undefined}
            placeholder={
              field.type === "date"
                ? dateInputProps.placeholder
                : field.placeholder || ""
            }
            style={styles.input}
            required={visible && isMaterialBelicoFieldRequired(field, form)}
          />
        )}
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Cadastro - {category}</h1>
        <p style={styles.subtitle}>
          Preencha os dados principais do material bélico para registrar um novo material.
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

      {error && <div style={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSave} style={styles.card}>
        <h2 style={styles.sectionTitle}>Dados do registro</h2>
        <p style={styles.sectionText}>
          Os campos abaixo são usados como base para o cadastro do submódulo selecionado.
        </p>

        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            borderRadius: "16px",
            border: "1px solid var(--app-border)",
            backgroundColor: "var(--app-surface-muted)",
            color: "var(--app-text-muted)",
            lineHeight: 1.6,
          }}
        >
          Defina se o material esta com um policial, sob responsabilidade de um
          setor ou em reserva da unidade.
        </div>

        {category === "Material de CDC" && (
          <div style={styles.infoBox}>
            Material selecionado:{" "}
            {buildCdcMaterialLabel(
              form.cdc_material_type,
              form.cdc_exoskeleton_size
            )}
          </div>
        )}

        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Nome do Material</label>
            <input
              type="text"
              value={form.item_name}
              onChange={handleChange("item_name")}
              placeholder="Digite o nome do material"
              style={styles.input}
              required
            />
          </div>

          {categoryConfig.showPrimary && (
            <div style={styles.field}>
              <label style={styles.label}>{categoryConfig.primaryLabel}</label>
              <input
                type="text"
                value={form.numeroSerie}
                onChange={handleChange("numeroSerie")}
                style={styles.input}
                required
              />
            </div>
          )}

          {categoryConfig.showAsset && (
            <div style={styles.field}>
              <label style={styles.label}>Patrimônio</label>
              <input
                type="text"
                value={form.patrimonio}
                onChange={handleChange("patrimonio")}
                style={styles.input}
                required
              />
            </div>
          )}

          {extraFields.map(renderExtraField)}

          <div style={styles.field}>
            <label style={styles.label}>Unidade</label>
            <select
              value={form.unitId}
              onChange={handleChange("unitId")}
              style={styles.input}
              required
              disabled={!viewerAccess.canViewAll}
            >
              <option value="">Selecione</option>
              {unitOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <small style={{ color: "var(--app-text-muted)", fontSize: "0.88rem" }}>
              A unidade limita a lista de setores e policiais disponiveis para o vinculo.
            </small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Responsabilidade atual</label>
            <select
              value={form.custodyType}
              onChange={handleChange("custodyType")}
              style={styles.input}
            >
              {custodyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small style={{ color: "var(--app-text-muted)", fontSize: "0.88rem" }}>
              {buildCustodySummary({
                custodyType: form.custodyType,
                custodySectorName: selectedSector?.name,
                policeOfficer: selectedOfficer,
              })}
            </small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Status</label>
            <select
              value={form.status}
              onChange={handleChange("status")}
              style={styles.input}
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Manutencao">Manutenção</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              {form.custodyType === "SETOR" ? "Setor responsável" : "Setor"}
            </label>
            <select
              value={form.custodySectorId}
              onChange={handleChange("custodySectorId")}
              style={styles.input}
              disabled={form.custodyType !== "SETOR" || !form.unitId}
            >
              <option value="">
                {form.custodyType === "SETOR" ? "Selecione" : "Não se aplica"}
              </option>
              {availableSectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {formatSectorLabel(sector)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.fieldFull}>
            <label style={styles.label}>Policial</label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                value={form.officerLookup}
                onChange={handleOfficerLookupChange}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleOfficerSearch();
                  }
                }}
                list="material-belico-officers"
                placeholder="Digite o RE do policial responsável"
                style={{ ...styles.input, flex: 1 }}
                required={form.custodyType === "POLICIAL"}
                disabled={form.custodyType !== "POLICIAL"}
              />
              <button
                type="button"
                onClick={handleOfficerSearch}
                disabled={form.custodyType !== "POLICIAL"}
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                Pesquisar
              </button>
            </div>
            <datalist id="material-belico-officers">
              {availablePoliceOfficers.map((officer) => (
                <option key={officer.id} value={buildOfficerOptionLabel(officer)} />
              ))}
            </datalist>
            <small style={{ color: "var(--app-text-muted)", fontSize: "0.88rem" }}>
              {selectedOfficer
                ? `Policial selecionado: ${selectedOfficer.rank || "Policial"} - ${buildOfficerSummary(selectedOfficer)}`
                : form.custodyType === "POLICIAL"
                  ? "Selecione um policial ativo da unidade para vincular o material."
                  : "Ative a responsabilidade por policial para pesquisar uma pessoa."}
            </small>
          </div>

          <div style={styles.fieldFull}>
            <label style={styles.label}>Observações</label>
            <textarea
              value={form.observacoes}
              onChange={handleChange("observacoes")}
              style={styles.textarea}
            />
          </div>
        </div>

        <div style={styles.footerActions}>
          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function buildMaterialBelicoPayload({ form, category, unitName, officer, sector }) {
  const normalizedCategory = String(category || "").toLowerCase();
  const normalizedCaliber = normalizeMaterialBelicoCaliber(form.item_model);
  const payload = {
    unit_id: Number(form.unitId),
    custody_type: form.custodyType,
    custody_sector_id:
      form.custodyType === "SETOR" && form.custodySectorId
        ? Number(form.custodySectorId)
        : null,
    police_officer_id:
      form.custodyType === "POLICIAL" && officer ? officer.id : null,
    category,
    ordem: 1,
    posto_grad: form.custodyType === "POLICIAL" ? officer?.rank || "" : form.custodyType,
    re:
      form.custodyType === "POLICIAL"
        ? officer?.re_with_digit || ""
        : form.custodyType,
    nome:
      form.custodyType === "POLICIAL"
        ? officer?.full_name || ""
        : form.custodyType === "SETOR"
          ? sector?.name || "Setor"
          : "Reserva da unidade",
    cia_em:
      form.custodyType === "POLICIAL"
        ? officer?.unit_label || unitName
        : sector?.name || unitName,
    opm_atual: unitName || officer?.unit_label || sector?.name || "",
    armamento_num_serie: "",
    armamento_patrimonio: "",
    municao_lote: "",
    algema_num_serie: "",
    algema_patrimonio: "",
    colete_num_serie: "",
    colete_patrimonio: "",
    item_name: form.item_name || null,
    lot_number: form.lot_number || null,
    expiration_date: form.expiration_date ? toIsoDate(form.expiration_date) : null,
    quantity: form.quantity === "" ? null : Number(form.quantity),
    item_brand: form.item_brand || null,
    item_model: normalizedCaliber || null,
    item_model_other:
      String(form.item_model || "").trim().toUpperCase() === "OUTROS"
        ? form.item_model_other || null
        : null,
    item_type: form.item_type || null,
    item_gender: form.item_gender || null,
    item_size: form.item_size || null,
    item_holder: form.item_holder || null,
    item_holder_other:
      String(form.item_holder || "").trim().toUpperCase() === "CONCESSIONARIA"
        ? form.item_holder_other || null
        : null,
    cdc_material_type: form.cdc_material_type || null,
    cdc_exoskeleton_size:
      form.cdc_material_type === "EXOESQUELETO"
        ? form.cdc_exoskeleton_size || null
        : null,
    is_active: form.status === "Ativo",
  };

  if (normalizedCategory.includes("algema")) {
    payload.algema_num_serie = form.numeroSerie;
    payload.algema_patrimonio = form.patrimonio;
    return payload;
  }

  if (normalizedCategory.includes("colete")) {
    payload.colete_num_serie = form.numeroSerie;
    payload.colete_patrimonio = form.patrimonio;
    return payload;
  }

  if (normalizedCategory.includes("muni")) {
    payload.municao_lote = form.numeroSerie || form.lot_number || "";
    return payload;
  }

  if (normalizedCategory.includes("tonfa")) {
    payload.lot_number = form.lot_number || form.numeroSerie || "";
    return payload;
  }

  payload.armamento_num_serie = form.numeroSerie;
  payload.armamento_patrimonio = form.patrimonio;
  return payload;
}

export default MaterialBelicoInsert;
