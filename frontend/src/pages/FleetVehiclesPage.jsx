import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import ReportExportButtons from "../components/ReportExportButtons";
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
  FLEET_BRAND_OPTIONS,
  FLEET_COLOR_OPTIONS,
  FLEET_CONTRACT_TERM_OPTIONS,
  FLEET_EMPLOYMENT_OPTIONS,
  FLEET_FUEL_OPTIONS,
  FLEET_GROUP_OPTIONS,
  FLEET_HOLDER_OPTIONS,
  FLEET_MODEL_OPTIONS_BY_BRAND,
  FLEET_SITUATION_OPTIONS,
  FLEET_TELEMETRY_OPTIONS,
  FLEET_WHEEL_OPTIONS,
} from "../utils/fleetOptions";
import { getOfficerDisplayName } from "../utils/officerLabels";
import { buildReportSubtitle } from "../utils/reportContext";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";
import { formatIdentifier, maskPlate, normalizeUpperIdentifier } from "../utils/identifierFormat";
import { buildHierarchicalUnitLabelMap } from "../utils/unitOptions";
import {
  buildUnitFilterDescription,
  buildUnitFilterOptions,
  resolveEffectiveUnitFilter,
} from "../utils/unitFilters";
import { getDateInputProps, maskDate, toIsoDate } from "./policeOfficerRegistrationUtils";


const CATEGORY_CONFIG = {
  VIATURA_04_RODAS: {
    title: "Frota - Cadastro de Viaturas",
    description:
      "Cadastre as viaturas conforme a ficha operacional da frota, com vínculos de contrato, revisão, emprego e identificação completa.",
    entityLabel: "viatura",
    moduleLabel: "viaturas",
    searchPlaceholder:
      "Pesquisar por prefixo, placa, marca, modelo, patrimônio, detentor ou locadora",
    emptyText:
      "Nenhuma viatura cadastrada ainda. Use o botão `Nova viatura` para iniciar o cadastro.",
    activeLabel: "Ativa",
    inactiveLabel: "Inativa",
    unitLabel: "OPM",
    responsibleLabel: "Policial responsável",
  },
  MOTOCICLETA: {
    title: "Frota - Motocicletas",
    description: "Cadastre e acompanhe as motocicletas da unidade no mesmo padrão operacional da frota.",
    entityLabel: "motocicleta",
    moduleLabel: "motocicletas",
    searchPlaceholder: "Pesquisar por marca, modelo, prefixo ou detentor",
    emptyText: "Nenhuma motocicleta cadastrada.",
    activeLabel: "Ativa",
    inactiveLabel: "Inativa",
    unitLabel: "Unidade",
    responsibleLabel: "Policial responsável",
  },
  OUTROS: {
    title: "Frota - Outros",
    description: "Submódulo complementar da frota.",
    entityLabel: "registro da frota",
    moduleLabel: "outros itens da frota",
    searchPlaceholder: "Pesquisar por marca, modelo, prefixo ou detentor",
    emptyText: "Nenhum registro cadastrado neste submódulo.",
    activeLabel: "Ativo",
    inactiveLabel: "Inativo",
    unitLabel: "Unidade",
    responsibleLabel: "Policial responsável",
  },
};

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

function FleetVehiclesPage({
  onBack,
  onMoveItem,
  category = "VIATURA_04_RODAS",
  title,
  description,
  entityLabel,
  startWithForm = false,
}) {
  const categoryConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.VIATURA_04_RODAS;
  const isVehicleRegistration = category === "VIATURA_04_RODAS";
  const resolvedTitle = title || categoryConfig.title;
  const resolvedDescription = description || categoryConfig.description;
  const resolvedEntityLabel = entityLabel || categoryConfig.entityLabel;

  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState([]);
  const [policeOfficers, setPoliceOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
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
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("");
  const [selectedTelemetryFilter, setSelectedTelemetryFilter] = useState("");
  const [viewingItem, setViewingItem] = useState(null);
  const [form, setForm] = useState(createInitialForm());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const createButtonLabel = isVehicleRegistration ? "Nova viatura" : "Novo registro";

  const effectiveUnitFilter = useMemo(
    () => resolveEffectiveUnitFilter(selectedUnitFilter, viewerAccess.unitId),
    [selectedUnitFilter, viewerAccess.unitId]
  );

  const filterUnitOptions = useMemo(
    () => buildUnitFilterOptions(units, viewerAccess),
    [units, viewerAccess]
  );

  const creationUnitOptions = useMemo(() => {
    if (filterUnitOptions.length > 0) {
      return filterUnitOptions;
    }
    return viewerAccess.unitId
      ? [{ id: viewerAccess.unitId, name: viewerAccess.unitLabel || "Minha unidade" }]
      : [];
  }, [filterUnitOptions, viewerAccess.unitId, viewerAccess.unitLabel]);

  const vehicleGroupOptions = useMemo(() => FLEET_GROUP_OPTIONS, []);

  const vehicleBrandOptions = useMemo(
    () => FLEET_BRAND_OPTIONS[form.wheelCount] || [],
    [form.wheelCount]
  );

  const vehicleModelOptions = useMemo(() => {
    if (!form.brand || form.useCustomBrand) {
      return [];
    }
    return FLEET_MODEL_OPTIONS_BY_BRAND[form.brand] || [];
  }, [form.brand, form.useCustomBrand]);

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

  const reportColumns = useMemo(() => {
    if (!isVehicleRegistration) {
      return [
        { key: "brand", label: "Marca", width: 16 },
        { key: "model", label: "Modelo", width: 18 },
        { key: "year", label: "Ano", width: 10 },
        { key: "prefix", label: "Prefixo", width: 16 },
        { key: "holder", label: "Detentor", width: 18 },
        { key: "unit", label: "Unidade", width: 24 },
        { key: "status", label: "Status", width: 12 },
      ];
    }

    return [
      { key: "unit", label: "OPM", width: 24 },
      { key: "prefix", label: "Prefixo", width: 14 },
      { key: "plate", label: "Placa", width: 12 },
      { key: "brand", label: "Marca", width: 16 },
      { key: "model", label: "Modelo", width: 18 },
      { key: "groupCode", label: "Grupo", width: 10 },
      { key: "telemetry", label: "Telemetria", width: 12 },
      { key: "wheelCount", label: "Rodas", width: 10 },
      { key: "holder", label: "Detentor", width: 16 },
      { key: "patrimony", label: "Patrimônio", width: 14 },
      { key: "rentalCompany", label: "Locadora", width: 18 },
      { key: "situation", label: "Situação", width: 18 },
      { key: "contractNumber", label: "Nº Contrato", width: 14 },
      { key: "contractStart", label: "Início", width: 12 },
      { key: "contractEnd", label: "Término", width: 12 },
      { key: "contractTerm", label: "Vigência", width: 14 },
      { key: "licensing", label: "Licenciamento", width: 14 },
      { key: "color", label: "Cor", width: 12 },
      { key: "chassis", label: "Chassi", width: 18 },
      { key: "renavam", label: "RENAVAM", width: 16 },
      { key: "fabMod", label: "Ano Fab/Mod", width: 14 },
      { key: "currentMileage", label: "KM Atual", width: 12 },
      { key: "currentMileageDate", label: "Data KM", width: 12 },
      { key: "lastReviewDate", label: "Última Revisão", width: 14 },
      { key: "lastReviewMileage", label: "KM Revisão", width: 12 },
      { key: "employment", label: "Emprego", width: 16 },
      { key: "officer", label: "Policial", width: 20 },
      { key: "status", label: "Status", width: 12 },
    ];
  }, [isVehicleRegistration]);

  const reportRows = useMemo(() => {
    if (!isVehicleRegistration) {
      return items.map((item) => ({
        brand: item.brand || "-",
        model: item.model || "-",
        year: item.year || "-",
        prefix: formatIdentifier(item.prefix),
        holder: item.holder || "-",
        unit: item.unit_label || item.unit_name || "-",
        status: item.is_active ? categoryConfig.activeLabel : categoryConfig.inactiveLabel,
      }));
    }

    return items.map((item) => ({
      unit: item.unit_label || item.unit_name || "-",
      prefix: formatIdentifier(item.prefix),
      plate: formatIdentifier(item.plate),
      brand: item.brand || "-",
      model: item.model || "-",
      groupCode: item.group_code || "-",
      telemetry: item.telemetry || "-",
      wheelCount: item.wheel_count || "-",
      holder: item.holder || "-",
      patrimony: formatIdentifier(item.patrimony),
      rentalCompany: item.rental_company || "-",
      situation: item.situation || "-",
      contractNumber: formatIdentifier(item.contract_number),
      contractStart: item.contract_start || "-",
      contractEnd: item.contract_end || "-",
      contractTerm: item.contract_term || "-",
      licensing: item.licensing || "-",
      color: item.color || "-",
      chassis: formatIdentifier(item.chassis),
      renavam: formatIdentifier(item.renavam),
      fabMod: [item.manufacture_year, item.model_year].filter(Boolean).join("/") || item.year || "-",
      currentMileage: item.current_mileage || "-",
      currentMileageDate: item.current_mileage_date || "-",
      lastReviewDate: item.last_review_date || "-",
      lastReviewMileage: item.last_review_mileage || "-",
      employment: item.employment || "-",
      officer: item.police_officer_re
        ? `${item.police_officer_re} - ${getOfficerDisplayName(item) || ""}`.trim()
        : "Não vinculado",
      status: item.is_active ? categoryConfig.activeLabel : categoryConfig.inactiveLabel,
    }));
  }, [categoryConfig.activeLabel, categoryConfig.inactiveLabel, isVehicleRegistration, items]);

  const reportSubtitle = useMemo(
    () =>
      buildReportSubtitle({
        totalRows: reportRows.length,
        searchTerm,
        filterDescription,
        extraDetails: [resolvedTitle],
      }),
    [filterDescription, reportRows.length, resolvedTitle, searchTerm]
  );

  const activeItemsCount = useMemo(
    () => items.filter((item) => item.is_active).length,
    [items]
  );
  const inactiveItemsCount = items.length - activeItemsCount;

  useEffect(() => {
    setShowForm(startWithForm);
    setViewingItem(null);
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
  }, [category, effectiveUnitFilter]);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (!form.unitId && viewerAccess.unitId) {
      setForm((prev) => ({ ...prev, unitId: String(viewerAccess.unitId) }));
    }
  }, [form.unitId, viewerAccess.unitId]);

  const resolvedHolder = useMemo(() => {
    if (form.holder === "CONCESSIONÁRIA") {
      return form.customHolder.trim();
    }
    return form.holder;
  }, [form.customHolder, form.holder]);

  const resolvedContractTerm = useMemo(() => {
    if (form.contractTerm === "Outro") {
      return form.customContractTerm.trim();
    }
    return form.contractTerm;
  }, [form.contractTerm, form.customContractTerm]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleWheelChange = (event) => {
    const wheelCount = event.target.value;
    setForm((prev) => ({
      ...prev,
      wheelCount,
      groupCode: "",
      brand: "",
      model: "",
      customBrand: "",
      customModel: "",
      useCustomBrand: false,
      useCustomModel: false,
    }));
  };

  const handleBrandSelect = (event) => {
    const brand = event.target.value;
    if (brand === "Outros") {
      setForm((prev) => ({
        ...prev,
        brand: "",
        model: "",
        customBrand: "",
        customModel: "",
        useCustomBrand: true,
        useCustomModel: true,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      brand,
      model: "",
      customModel: "",
      useCustomBrand: false,
      useCustomModel: false,
    }));
  };

  const handleCustomBrandChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      brand: value,
      customBrand: value,
    }));
  };

  const handleBackToBrandList = () => {
    setForm((prev) => ({
      ...prev,
      brand: "",
      model: "",
      customBrand: "",
      customModel: "",
      useCustomBrand: false,
      useCustomModel: false,
    }));
  };

  const handleModelSelect = (event) => {
    const model = event.target.value;
    if (model === "Outros") {
      setForm((prev) => ({
        ...prev,
        model: "",
        customModel: "",
        useCustomModel: true,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      model,
      customModel: "",
      useCustomModel: false,
    }));
  };

  const handleCustomModelChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      model: value,
      customModel: value,
    }));
  };

  const handleBackToModelList = () => {
    setForm((prev) => ({
      ...prev,
      model: "",
      customModel: "",
      useCustomModel: false,
    }));
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

  const handleMaskedNumeric = (field, maxLength = null) => (event) => {
    const numeric = event.target.value.replace(/\D/g, "");
    setForm((prev) => ({
      ...prev,
      [field]: maxLength ? numeric.slice(0, maxLength) : numeric,
    }));
  };

  const handleMaskedDate = (field) => (event) => {
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!resolvedHolder) {
      setError(`Informe o detentor de ${resolvedEntityLabel}.`);
      return;
    }

    const targetUnitId = Number(form.unitId || viewerAccess.unitId || 0);
    if (!targetUnitId) {
      setError("Selecione a OPM responsável pela viatura.");
      return;
    }

    if (!form.useCustomBrand && form.brand && !vehicleBrandOptions.includes(form.brand)) {
      setError("Selecione uma marca válida na lista ou use a opção Outros.");
      return;
    }

    if (!form.useCustomModel && form.model && vehicleModelOptions.length > 0 && !vehicleModelOptions.includes(form.model)) {
      setError("Selecione um modelo válido na lista ou use a opção Outros.");
      return;
    }

    try {
      const payload = {
        unit_id: targetUnitId,
        police_officer_id: form.policeOfficerId ? Number(form.policeOfficerId) : null,
        category,
        brand: normalizeOptionalText(form.useCustomBrand ? form.customBrand : form.brand),
        model: normalizeOptionalText(form.useCustomModel ? form.customModel : form.model),
        year: resolvePrimaryYear(form),
        prefix: form.prefix.trim(),
        group_code: form.groupCode || null,
        telemetry: form.telemetry || null,
        wheel_count: form.wheelCount || null,
        holder: resolvedHolder,
        patrimony: normalizeOptionalText(form.patrimony),
        rental_company:
          form.holder === "CONCESSIONÁRIA" ? normalizeOptionalText(form.rentalCompany) : null,
        contract_number: normalizeOptionalText(form.contractNumber),
        contract_start: normalizeOptionalText(form.contractStart),
        contract_end: normalizeOptionalText(form.contractEnd),
        contract_term: normalizeOptionalText(resolvedContractTerm),
        licensing: normalizeOptionalText(form.licensing),
        plate: normalizeOptionalText(form.plate),
        fuel_type: normalizeOptionalText(form.fuelType),
        current_mileage: normalizeOptionalText(form.currentMileage),
        current_mileage_date: normalizeOptionalText(form.currentMileageDate),
        last_review_date: normalizeOptionalText(form.lastReviewDate),
        last_review_mileage: normalizeOptionalText(form.lastReviewMileage),
        situation: normalizeOptionalText(form.situation),
        employment: normalizeOptionalText(form.employment),
        renavam: normalizeOptionalText(form.renavam),
        chassis: normalizeOptionalText(form.chassis),
        color: normalizeOptionalText(form.color),
        manufacture_year: normalizeOptionalText(form.manufactureYear),
        model_year: normalizeOptionalText(form.modelYear),
        fixed_driver: normalizeOptionalText(form.fixedDriver),
        notes: normalizeOptionalText(form.notes),
        is_active: true,
      };

      if (editingId) {
        await updateFleetVehicle(editingId, payload);
        setSuccess("Viatura atualizada com sucesso.");
      } else {
        await createFleetVehicle(payload);
        setSuccess("Viatura cadastrada com sucesso.");
      }

      resetForm();
      await loadVehicles(searchTerm);
    } catch (saveError) {
      setError(saveError.message || "Erro ao salvar registro.");
    }
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
        category,
        search,
        unitId: effectiveUnitFilter,
        groupCode: selectedGroupFilter,
        telemetry: selectedTelemetryFilter,
      });
      setItems(data);
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar registros da frota.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    await loadVehicles(searchTerm);
  };

  const handleEdit = (item) => {
    const availableBrands = FLEET_BRAND_OPTIONS[item.wheel_count] || [];
    const useCustomBrand = item.brand ? !availableBrands.includes(item.brand) : false;
    const availableModels = item.brand ? FLEET_MODEL_OPTIONS_BY_BRAND[item.brand] || [] : [];
    const useCustomModel = item.model
      ? availableModels.length === 0 || !availableModels.includes(item.model)
      : false;

    setEditingId(item.id);
    setViewingItem(null);
    setForm({
      unitId: item.unit_id ? String(item.unit_id) : String(viewerAccess.unitId || ""),
      brand: item.brand || "",
      model: item.model || "",
      year: item.year || "",
      manufactureYear: item.manufacture_year || item.year || "",
      modelYear: item.model_year || "",
      prefix: normalizeUpperIdentifier(item.prefix || ""),
      groupCode: item.group_code || "",
      telemetry: item.telemetry || "",
      wheelCount: item.wheel_count || "",
      useCustomBrand,
      customBrand: useCustomBrand ? item.brand || "" : "",
      useCustomModel,
      customModel: useCustomModel ? item.model || "" : "",
      holder: FLEET_HOLDER_OPTIONS.includes(item.holder) ? item.holder : "CONCESSIONÁRIA",
      customHolder: FLEET_HOLDER_OPTIONS.includes(item.holder) ? "" : item.holder || "",
      patrimony: normalizeUpperIdentifier(item.patrimony || ""),
      rentalCompany: item.rental_company || "",
      situation: item.situation || "",
      contractNumber: normalizeUpperIdentifier(item.contract_number || ""),
      contractStart: item.contract_start || "",
      contractEnd: item.contract_end || "",
      contractTerm: FLEET_CONTRACT_TERM_OPTIONS.includes(item.contract_term)
        ? item.contract_term
        : item.contract_term
          ? "Outro"
          : "",
      customContractTerm: FLEET_CONTRACT_TERM_OPTIONS.includes(item.contract_term)
        ? ""
        : item.contract_term || "",
      licensing: item.licensing || "",
      plate: maskPlate(item.plate || ""),
      color: item.color || "",
      chassis: normalizeUpperIdentifier(item.chassis || ""),
      renavam: normalizeUpperIdentifier(item.renavam || ""),
      currentMileage: item.current_mileage || "",
      currentMileageDate: item.current_mileage_date || "",
      lastReviewDate: item.last_review_date || "",
      lastReviewMileage: item.last_review_mileage || "",
      employment: item.employment || "",
      policeOfficerId: item.police_officer_id ? String(item.police_officer_id) : "",
      fixedDriver: item.fixed_driver || "",
      fuelType: item.fuel_type || "",
      notes: item.notes || "",
    });
    setShowForm(true);
  };

  const handleView = (item) => {
    setShowForm(false);
    setEditingId(null);
    setViewingItem(item);
  };

  const handleBackFromDetail = () => {
    setViewingItem(null);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Deseja inativar esta viatura?")) {
      return;
    }

    try {
      await deleteFleetVehicle(itemId);
      setSuccess("Viatura inativada com sucesso.");
      await loadVehicles(searchTerm);
    } catch (deleteError) {
      setError(deleteError.message || "Erro ao inativar registro.");
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
      setError(restoreError.message || "Erro ao reativar registro.");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(createInitialForm(viewerAccess.unitId));
    setShowForm(false);
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>{resolvedTitle}</h1>
        <p style={styles.subtitle}>{resolvedDescription}</p>

        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
          <button
            onClick={() => {
              setViewingItem(null);
              if (!showForm) {
                setEditingId(null);
                setForm(createInitialForm(viewerAccess.unitId));
              }
              setShowForm((current) => !current);
            }}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            {createButtonLabel}
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      <section style={{ ...styles.card, marginBottom: "24px" }}>
        <h2 style={styles.sectionTitle}>Consulta do módulo</h2>
        <p style={styles.sectionText}>
          Pesquise por OPM, prefixo, placa, patrimônio, marca, modelo, detentor ou locadora para localizar as viaturas.
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
          {isVehicleRegistration ? (
            <select
              value={selectedGroupFilter}
              onChange={(event) => setSelectedGroupFilter(event.target.value)}
              style={{ ...styles.input, ...styles.actionField }}
            >
              <option value="">Todos os grupos</option>
              {FLEET_GROUP_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : null}
          {isVehicleRegistration ? (
            <select
              value={selectedTelemetryFilter}
              onChange={(event) => setSelectedTelemetryFilter(event.target.value)}
              style={{ ...styles.input, ...styles.actionField }}
            >
              <option value="">Toda telemetria</option>
              {FLEET_TELEMETRY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : null}
          <SearchInputAction
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onSearch={handleSearch}
            placeholder={categoryConfig.searchPlaceholder}
            style={styles.actionFieldWide}
          />
        </div>
        <p style={{ ...styles.helperText, marginTop: "12px" }}>{filterDescription}</p>
      </section>

      {isVehicleRegistration && viewingItem && !showForm ? (
        <section style={{ ...styles.card, marginBottom: "24px" }}>
          <div style={{ ...styles.tableHeader, padding: 0, borderBottom: "none", backgroundColor: "transparent" }}>
            <div>
              <h2 style={styles.sectionTitle}>Detalhes da viatura</h2>
              <p style={styles.sectionText}>
                Consulte todos os dados cadastrados da viatura selecionada.
              </p>
            </div>
            <div style={styles.tableHeaderActions}>
              <button
                type="button"
                onClick={handleBackFromDetail}
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                ← Voltar
              </button>
              <button
                type="button"
                onClick={() => handleEdit(viewingItem)}
                style={{ ...styles.button, ...styles.primaryButton }}
              >
                ✏ Editar
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: "16px" }}>
            <DetailSection
              title="Identificação da viatura"
              fields={[
                ["OPM", viewingItem.unit_label || viewingItem.unit_name || "-"],
                ["Rodas", viewingItem.wheel_count || "-"],
                ["Prefixo", formatIdentifier(viewingItem.prefix)],
                ["Placa", formatIdentifier(viewingItem.plate)],
                ["Marca", viewingItem.brand || "-"],
                ["Modelo", viewingItem.model || "-"],
                ["Grupo", viewingItem.group_code || "-"],
                ["Telemetria", viewingItem.telemetry || "-"],
                ["Patrimônio", formatIdentifier(viewingItem.patrimony)],
              ]}
            />
            <DetailSection
              title="Detenção e situação"
              fields={[
                ["Detentor", viewingItem.holder || "-"],
                ["Locadora", viewingItem.rental_company || "-"],
                ["Situação", viewingItem.situation || "-"],
                ["Emprego", viewingItem.employment || "-"],
                [
                  "Policial responsável",
                  viewingItem.police_officer_re
                    ? `${viewingItem.police_officer_re} - ${getOfficerDisplayName(viewingItem) || ""}`.trim()
                    : "Não vinculado",
                ],
                ["Motorista fixo", viewingItem.fixed_driver || "-"],
              ]}
            />
            <DetailSection
              title="Contrato e documentação"
              fields={[
                ["Nº Contrato", formatIdentifier(viewingItem.contract_number)],
                ["Início", viewingItem.contract_start || "-"],
                ["Término", viewingItem.contract_end || "-"],
                ["Vigência do contrato", viewingItem.contract_term || "-"],
                ["Licenciamento", viewingItem.licensing || "-"],
              ]}
            />
            <DetailSection
              title="Identificação técnica"
              fields={[
                ["Cor", viewingItem.color || "-"],
                ["Chassi", formatIdentifier(viewingItem.chassis)],
                ["RENAVAM", formatIdentifier(viewingItem.renavam)],
                ["Ano fabricação", viewingItem.manufacture_year || "-"],
                ["Ano modelo", viewingItem.model_year || viewingItem.year || "-"],
                ["Combustível", viewingItem.fuel_type || "-"],
              ]}
            />
            <DetailSection
              title="KM e revisão"
              fields={[
                ["KM atual", viewingItem.current_mileage || "-"],
                ["Data última revisão", viewingItem.last_review_date || "-"],
                ["Próxima revisão", "-"],
                ["KM na revisão", viewingItem.last_review_mileage || "-"],
                ["Data do KM atual", viewingItem.current_mileage_date || "-"],
              ]}
            />
          </div>
        </section>
      ) : null}

      {showForm && (
        <section style={{ ...styles.card, marginBottom: "24px" }}>
          <h2 style={styles.sectionTitle}>
            {editingId ? "Editar viatura" : "Cadastro de Viaturas"}
          </h2>
          <p style={styles.sectionText}>
            O cadastro segue a planilha operacional da frota, incluindo vínculos de contrato, revisão, emprego e detenção.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ ...styles.formGrid, marginBottom: "22px" }}>
              <SectionHeading title="Identificação da viatura" />
              <FormSelect
                label="OPM"
                value={form.unitId}
                onChange={handleChange("unitId")}
                options={creationUnitOptions.map((unit) => ({
                  value: String(unit.id),
                  label: unitMap[unit.id] ?? unit.name,
                }))}
                required
              />
              <FormSelect
                label="Rodas"
                value={form.wheelCount}
                onChange={handleWheelChange}
                options={FLEET_WHEEL_OPTIONS}
              />
              <FormInput label="Prefixo" value={form.prefix} onChange={handleUpperIdentifier("prefix", 20)} required />
              <FormInput label="Placa" value={form.plate} onChange={handlePlateChange("plate")} />
              {form.useCustomBrand ? (
                <TextOptionField
                  label="Marca"
                  value={form.customBrand}
                  onChange={handleCustomBrandChange}
                  placeholder="Digite a marca"
                  onBack={handleBackToBrandList}
                  required
                />
              ) : (
                <SearchableSelectField
                  label="Marca"
                  value={form.brand}
                  options={vehicleBrandOptions}
                  onChange={handleBrandSelect}
                  placeholder="Selecione ou pesquise a marca"
                  required
                />
              )}
              {vehicleModelOptions.length > 0 && !form.useCustomModel ? (
                <SearchableSelectField
                  label="Modelo"
                  value={form.model}
                  options={vehicleModelOptions}
                  onChange={handleModelSelect}
                  placeholder="Selecione ou pesquise o modelo"
                  required
                />
              ) : (
                <TextOptionField
                  label="Modelo"
                  value={form.useCustomModel ? form.customModel : form.model}
                  onChange={form.useCustomModel ? handleCustomModelChange : handleChange("model")}
                  placeholder={form.brand ? "Digite o modelo" : "Selecione o tipo de rodas e a marca primeiro"}
                  disabled={!form.brand && !form.useCustomBrand}
                  onBack={form.useCustomModel ? handleBackToModelList : null}
                  required
                />
              )}
              <FormSelect label="Grupo" value={form.groupCode} onChange={handleChange("groupCode")} options={toOptions(vehicleGroupOptions)} />
              <FormSelect label="Telemetria" value={form.telemetry} onChange={handleChange("telemetry")} options={toOptions(FLEET_TELEMETRY_OPTIONS)} />
              <FormInput label="Patrimônio" value={form.patrimony} onChange={handleUpperIdentifier("patrimony", 30)} />
            </div>

            <div style={{ ...styles.formGrid, marginBottom: "22px" }}>
              <SectionHeading title="Detenção e situação" />
              <FormSelect
                label="Detentor"
                value={form.holder}
                onChange={handleChange("holder")}
                options={toOptions(FLEET_HOLDER_OPTIONS)}
                required
              />
              {form.holder === "CONCESSIONÁRIA" && (
                <FormInput
                  label="Nome da concessionária"
                  value={form.customHolder}
                  onChange={handleChange("customHolder")}
                  required
                />
              )}
              <FormInput
                label="Locadora"
                value={form.rentalCompany}
                onChange={handleChange("rentalCompany")}
                disabled={form.holder !== "CONCESSIONÁRIA"}
              />
              <FormSelect
                label="Situação"
                value={form.situation}
                onChange={handleChange("situation")}
                options={toOptions(FLEET_SITUATION_OPTIONS)}
              />
              <FormSelect
                label="Emprego (BOP, ADM, CMT)"
                value={form.employment}
                onChange={handleChange("employment")}
                options={toOptions(FLEET_EMPLOYMENT_OPTIONS)}
              />
              <FormSelect
                label="Policial responsável"
                value={form.policeOfficerId}
                onChange={handleChange("policeOfficerId")}
                options={policeOfficers.map((officer) => ({
                  value: String(officer.id),
                  label: `${officer.re_with_digit} - ${getOfficerDisplayName(officer)}`,
                }))}
                includeEmptyOptionLabel="Não vincular"
              />
              <FormInput label="Motorista fixo" value={form.fixedDriver} onChange={handleChange("fixedDriver")} />
            </div>

            <div style={{ ...styles.formGrid, marginBottom: "22px" }}>
              <SectionHeading title="Contrato e documentação" />
              <FormInput label="Nº Contrato" value={form.contractNumber} onChange={handleUpperIdentifier("contractNumber", 30)} />
              <FormInput label="Início" value={form.contractStart} onChange={handleMaskedDate("contractStart")} onBlur={handleDateBlur("contractStart", "Início")} isDateField />
              <FormInput label="Término" value={form.contractEnd} onChange={handleMaskedDate("contractEnd")} onBlur={handleDateBlur("contractEnd", "Término")} isDateField />
              <FormSelect
                label="Vigência do contrato"
                value={form.contractTerm}
                onChange={handleChange("contractTerm")}
                options={toOptions(FLEET_CONTRACT_TERM_OPTIONS)}
              />
              {form.contractTerm === "Outro" && (
                <FormInput
                  label="Outra vigência"
                  value={form.customContractTerm}
                  onChange={handleChange("customContractTerm")}
                  required
                />
              )}
              <FormInput label="Licenciamento" value={form.licensing} onChange={handleMaskedDate("licensing")} onBlur={handleDateBlur("licensing", "Licenciamento")} isDateField />
            </div>

            <div style={{ ...styles.formGrid, marginBottom: "22px" }}>
              <SectionHeading title="Identificação técnica" />
              <FormSelect
                label="Cor"
                value={form.color}
                onChange={handleChange("color")}
                options={toOptions(FLEET_COLOR_OPTIONS)}
              />
              <FormInput label="Chassi" value={form.chassis} onChange={handleUpperIdentifier("chassis", 30)} />
              <FormInput label="RENAVAM" value={form.renavam} onChange={handleUpperIdentifier("renavam", 20)} />
              <FormInput label="Ano fabricação" value={form.manufactureYear} onChange={handleMaskedNumeric("manufactureYear", 4)} />
              <FormInput label="Ano modelo" value={form.modelYear} onChange={handleMaskedNumeric("modelYear", 4)} />
              <FormSelect
                label="Combustível"
                value={form.fuelType}
                onChange={handleChange("fuelType")}
                options={toOptions(FLEET_FUEL_OPTIONS)}
              />
            </div>

            <div style={{ ...styles.formGrid, marginBottom: "22px" }}>
              <SectionHeading title="Vínculos operacionais" />
              <GroupedPair
                title="KM atual"
                leftLabel="KM atual"
                leftValue={form.currentMileage}
                leftOnChange={handleMaskedNumeric("currentMileage")}
                rightLabel="Data"
                rightValue={form.currentMileageDate}
                rightOnChange={handleMaskedDate("currentMileageDate")}
                rightOnBlur={handleDateBlur("currentMileageDate", "Data do KM atual")}
                rightIsDateField
              />
              <GroupedPair
                title="Última revisão"
                leftLabel="Data da última revisão"
                leftValue={form.lastReviewDate}
                leftOnChange={handleMaskedDate("lastReviewDate")}
                leftOnBlur={handleDateBlur("lastReviewDate", "Data da última revisão")}
                leftIsDateField
                rightLabel="KM da última revisão"
                rightValue={form.lastReviewMileage}
                rightOnChange={handleMaskedNumeric("lastReviewMileage")}
              />
            </div>

            <div style={{ ...styles.formGrid, marginBottom: "18px" }}>
              <SectionHeading title="Observações" />
              <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Notas complementares</label>
                <textarea
                  value={form.notes}
                  onChange={handleChange("notes")}
                  rows={4}
                  style={{ ...styles.input, resize: "vertical", minHeight: "120px" }}
                />
              </div>
            </div>

            <div style={styles.footerActions}>
              <button type="button" onClick={resetForm} style={{ ...styles.button, ...styles.secondaryButton }}>
                Cancelar
              </button>
              <button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>
                {editingId ? "Salvar alterações" : "Salvar cadastro"}
              </button>
            </div>
          </form>
        </section>
      )}

      {isVehicleRegistration && viewingItem ? (
        <section style={{ ...styles.card, marginBottom: "24px" }}>
          <h2 style={styles.sectionTitle}>Resumo da viatura selecionada</h2>
          <p style={styles.sectionText}>Visão rápida da viatura aberta no cadastro principal da frota.</p>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>OPM</p><p style={styles.summaryValue}>{viewingItem.unit_label || viewingItem.unit_name || "-"}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Prefixo</p><p style={styles.summaryValue}>{formatIdentifier(viewingItem.prefix) || "-"}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Placa</p><p style={styles.summaryValue}>{formatIdentifier(viewingItem.plate) || "-"}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Marca/Modelo</p><p style={styles.summaryValue}>{[viewingItem.brand, viewingItem.model].filter(Boolean).join(" / ") || "-"}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Situação</p><p style={styles.summaryValue}>{viewingItem.situation || "-"}</p></div>
            <div style={styles.summaryCard}><p style={styles.summaryLabel}>Detentor</p><p style={styles.summaryValue}>{viewingItem.holder || "-"}</p></div>
          </div>
        </section>
      ) : null}

      <section style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.tableTitle}>Lista de registros</h2>
            <p style={styles.tableMeta}>{items.length} registro(s) encontrado(s)</p>
          </div>
          <ReportExportButtons
            disabled={reportRows.length === 0}
            onExportExcel={() =>
              exportExcelReport({
                fileBaseName: "cadastro-de-viaturas",
                sheetName: "Viaturas",
                title: resolvedTitle,
                subtitle: reportSubtitle,
                columns: reportColumns,
                rows: reportRows,
              })
            }
            onExportPdf={() =>
              exportPdfReport({
                fileBaseName: "cadastro-de-viaturas",
                title: resolvedTitle,
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
              <p style={styles.summaryLabel}>Viaturas</p>
              <p style={styles.summaryValue}>{items.length}</p>
            </div>
            <div style={styles.summaryCard}>
              <p style={styles.summaryLabel}>{categoryConfig.activeLabel}</p>
              <p style={styles.summaryValue}>{activeItemsCount}</p>
            </div>
            <div style={styles.summaryCard}>
              <p style={styles.summaryLabel}>{categoryConfig.inactiveLabel}</p>
              <p style={styles.summaryValue}>{inactiveItemsCount}</p>
            </div>
            <div style={styles.summaryCard}>
              <p style={styles.summaryLabel}>Escopo da consulta</p>
              <p style={{ ...styles.summaryValue, ...styles.summaryValueSoft }}>{filterDescription}</p>
            </div>
          </div>
        </div>

        <div className="desktop-table-view" style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {isVehicleRegistration ? (
                  <>
                    <th style={{ ...styles.th, ...stickyColumn(0, 84, true), width: "60px", whiteSpace: "nowrap" }}>Ver</th>
                    <th style={{ ...styles.th, ...stickyColumn(84, 160, true), width: "100px", whiteSpace: "nowrap" }}>OPM</th>
                    <th style={{ ...styles.th, ...stickyColumn(244, 130, true), width: "100px", whiteSpace: "nowrap" }}>Prefixo</th>
                    <th style={{ ...styles.th, ...stickyColumn(374, 140, true), width: "110px", whiteSpace: "nowrap" }}>Placa</th>
                    <th style={{ ...styles.th, width: "120px", whiteSpace: "nowrap" }}>Marca</th>
                    <th style={{ ...styles.th, whiteSpace: "nowrap" }}>Modelo</th>
                  </>
                ) : (
                  <>
                    <th style={styles.th}>OPM</th>
                    <th style={styles.th}>Prefixo</th>
                    <th style={styles.th}>Placa</th>
                    <th style={styles.th}>Marca</th>
                    <th style={styles.th}>Modelo</th>
                    <th style={styles.th}>Grupo</th>
                    <th style={styles.th}>Telemetria</th>
                    <th style={styles.th}>Rodas</th>
                    <th style={styles.th}>Detentor</th>
                    <th style={styles.th}>Patrimônio</th>
                    <th style={styles.th}>Locadora</th>
                    <th style={styles.th}>Situação</th>
                    <th style={styles.th}>Contrato</th>
                    <th style={styles.th}>Fab/Mod</th>
                    <th style={styles.th}>KM / Revisão</th>
                    <th style={styles.th}>Emprego</th>
                    <th style={styles.th}>Policial</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Ações</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  style={
                    isVehicleRegistration && index % 2 === 1
                      ? { backgroundColor: "var(--app-surface-muted)" }
                      : undefined
                  }
                >
                  {isVehicleRegistration ? (
                    <>
                      <td style={{ ...styles.td, ...stickyColumn(0, 84), padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          onClick={() => handleView(item)}
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
                      <td style={{ ...styles.td, ...stickyColumn(84, 160), padding: "10px 12px", whiteSpace: "nowrap" }}>
                        {item.unit_label || item.unit_name || "-"}
                      </td>
                      <td style={{ ...styles.td, ...stickyColumn(244, 130), padding: "10px 12px", whiteSpace: "nowrap" }}>
                        {formatIdentifier(item.prefix)}
                      </td>
                      <td style={{ ...styles.td, ...stickyColumn(374, 140), padding: "10px 12px", whiteSpace: "nowrap" }}>
                        {formatIdentifier(item.plate)}
                      </td>
                      <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                        {item.brand || "-"}
                      </td>
                      <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                        {item.model || "-"}
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={styles.td}>{item.unit_label || item.unit_name || "-"}</td>
                      <td style={styles.td}>{formatIdentifier(item.prefix)}</td>
                      <td style={styles.td}>{formatIdentifier(item.plate)}</td>
                      <td style={styles.td}>{item.brand || "-"}</td>
                      <td style={styles.td}>{item.model || "-"}</td>
                      <td style={styles.td}>{item.group_code || "-"}</td>
                      <td style={styles.td}>{item.telemetry || "-"}</td>
                      <td style={styles.td}>{item.wheel_count || "-"}</td>
                      <td style={styles.td}>{item.holder || "-"}</td>
                      <td style={styles.td}>{formatIdentifier(item.patrimony)}</td>
                      <td style={styles.td}>{item.rental_company || "-"}</td>
                      <td style={styles.td}>{item.situation || "-"}</td>
                      <td style={styles.td}>
                        <div>{formatIdentifier(item.contract_number)}</div>
                        <div style={styles.helperText}>
                          {[item.contract_start, item.contract_end].filter(Boolean).join(" até ") || item.contract_term || "-"}
                        </div>
                      </td>
                      <td style={styles.td}>
                        {[item.manufacture_year, item.model_year].filter(Boolean).join("/") || item.year || "-"}
                      </td>
                      <td style={styles.td}>
                        <div>{item.current_mileage || "-"} km</div>
                        <div style={styles.helperText}>
                          {[item.current_mileage_date, item.last_review_date, item.last_review_mileage].filter(Boolean).join(" | ") || "-"}
                        </div>
                      </td>
                      <td style={styles.td}>{item.employment || "-"}</td>
                      <td style={styles.td}>
                        {item.police_officer_re ? (
                          <>
                            <div style={{ fontWeight: 600 }}>{item.police_officer_re}</div>
                            <div style={styles.helperText}>{getOfficerDisplayName(item) || "-"}</div>
                          </>
                        ) : (
                          <span style={styles.helperText}>Não vinculado</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            ...(item.is_active ? styles.activeBadge : styles.inactiveBadge),
                          }}
                        >
                          {item.is_active ? categoryConfig.activeLabel : categoryConfig.inactiveLabel}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.tableActionGroup}>
                          <button
                            onClick={() => handleEdit(item)}
                            style={{ ...styles.button, ...styles.secondaryButton, ...styles.tableActionButton }}
                          >
                            Editar
                          </button>
                          {item.is_active && onMoveItem && (
                            <button
                              onClick={() => onMoveItem(item.id)}
                              style={{ ...styles.button, ...styles.secondaryButton, ...styles.tableActionButton }}
                            >
                              Movimentar
                            </button>
                          )}
                          {item.is_active ? (
                            <button
                              onClick={() => handleDelete(item.id)}
                              style={{ ...styles.button, ...styles.dangerButton, ...styles.tableActionButton }}
                            >
                              Inativar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(item.id)}
                              style={{ ...styles.button, ...styles.primaryButton, ...styles.tableActionButton }}
                            >
                              Reativar
                            </button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && items.length === 0 && <div style={styles.emptyState}>{categoryConfig.emptyText}</div>}
          {loading && <div style={styles.emptyState}>Carregando registros...</div>}
        </div>

        {!loading && items.length > 0 && !isVehicleRegistration && (
          <div className="mobile-card-view" style={styles.mobileCards}>
            {items.map((item) => (
              <article key={item.id} style={styles.mobileCard}>
                <div style={styles.mobileCardHeader}>
                  <div>
                    <h3 style={styles.mobileCardTitle}>
                      {[item.prefix, item.brand, item.model].filter(Boolean).join(" - ") || "Viatura"}
                    </h3>
                    <p style={styles.mobileCardMeta}>{item.unit_label || item.unit_name || "-"}</p>
                  </div>
                  <span
                    style={{
                      ...styles.badge,
                      ...(item.is_active ? styles.activeBadge : styles.inactiveBadge),
                    }}
                  >
                    {item.is_active ? categoryConfig.activeLabel : categoryConfig.inactiveLabel}
                  </span>
                </div>

                <div style={styles.mobileCardGrid}>
                  <MobileRow label="Placa" value={formatIdentifier(item.plate)} />
                  <MobileRow label="Grupo / Rodas" value={[item.group_code, item.wheel_count].filter(Boolean).join(" / ") || "-"} />
                  <MobileRow label="Telemetria" value={item.telemetry || "-"} />
                  <MobileRow label="Detentor" value={item.holder || "-"} />
                  <MobileRow label="Patrimônio" value={formatIdentifier(item.patrimony)} />
                  <MobileRow label="Situação" value={item.situation || "-"} />
                  <MobileRow label="Emprego" value={item.employment || "-"} />
                </div>

                <div style={styles.mobileCardActions}>
                  <button
                    onClick={() => handleEdit(item)}
                    style={{ ...styles.button, ...styles.secondaryButton, ...styles.tableActionButton }}
                  >
                    Editar
                  </button>
                  {item.is_active && onMoveItem && (
                    <button
                      onClick={() => onMoveItem(item.id)}
                      style={{ ...styles.button, ...styles.secondaryButton, ...styles.tableActionButton }}
                    >
                      Movimentar
                    </button>
                  )}
                  {item.is_active ? (
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{ ...styles.button, ...styles.dangerButton, ...styles.tableActionButton }}
                    >
                      Inativar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestore(item.id)}
                      style={{ ...styles.button, ...styles.primaryButton, ...styles.tableActionButton }}
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
    </div>
  );
}

function SectionHeading({ title }) {
  return (
    <div style={{ gridColumn: "1 / -1", marginBottom: "4px" }}>
      <p style={{ ...styles.summaryLabel, marginBottom: "6px" }}>{title}</p>
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

const fleetFieldInputStyle = {
  ...styles.input,
  minHeight: "52px",
  borderRadius: "16px",
};

const fleetFieldDisabledStyle = {
  opacity: 0.7,
  cursor: "not-allowed",
};

function FormInput({
  label,
  value,
  onChange,
  onBlur,
  required = false,
  placeholder = "",
  disabled = false,
  isDateField = false,
}) {
  const dateInputProps = isDateField ? getDateInputProps() : {};
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        placeholder={placeholder || dateInputProps.placeholder || ""}
        disabled={disabled}
        maxLength={dateInputProps.maxLength}
        inputMode={dateInputProps.inputMode}
        style={disabled ? { ...fleetFieldInputStyle, ...fleetFieldDisabledStyle } : fleetFieldInputStyle}
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  required = false,
  includeEmptyOptionLabel = "Selecione",
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <select value={value} onChange={onChange} required={required} style={fleetFieldInputStyle}>
        <option value="">{includeEmptyOptionLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SearchableSelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione",
  required = false,
}) {
  const listId = `fleet-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        list={listId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={fleetFieldInputStyle}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  );
}

function TextOptionField({
  label,
  value,
  onChange,
  placeholder = "",
  disabled = false,
  onBack = null,
  required = false,
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required && !disabled}
        style={disabled ? { ...fleetFieldInputStyle, ...fleetFieldDisabledStyle } : fleetFieldInputStyle}
      />
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          style={{
            border: "none",
            backgroundColor: "transparent",
            color: "var(--app-primary)",
            padding: "8px 0 0",
            fontWeight: 600,
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          ← Voltar para lista
        </button>
      ) : null}
    </div>
  );
}

function GroupedPair({
  title,
  leftLabel,
  leftValue,
  leftOnChange,
  leftOnBlur,
  leftPlaceholder = "",
  leftIsDateField = false,
  rightLabel,
  rightValue,
  rightOnChange,
  rightOnBlur,
  rightPlaceholder = "",
  rightIsDateField = false,
}) {
  return (
    <div
      style={{
        ...styles.field,
        gridColumn: "1 / -1",
        padding: "16px",
        borderRadius: "18px",
        border: "1px solid var(--app-border)",
        backgroundColor: "var(--app-surface-muted)",
      }}
    >
      <p style={{ ...styles.summaryLabel, marginBottom: "12px" }}>{title}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        <FormInput label={leftLabel} value={leftValue} onChange={leftOnChange} onBlur={leftOnBlur} placeholder={leftPlaceholder} isDateField={leftIsDateField} />
        <FormInput label={rightLabel} value={rightValue} onChange={rightOnChange} onBlur={rightOnBlur} placeholder={rightPlaceholder} isDateField={rightIsDateField} />
      </div>
    </div>
  );
}

function MobileRow({ label, value }) {
  return (
    <div style={styles.mobileCardRow}>
      <p style={styles.mobileCardLabel}>{label}</p>
      <p style={styles.mobileCardValue}>{value}</p>
    </div>
  );
}

function createInitialForm(defaultUnitId = null) {
  return {
    unitId: defaultUnitId ? String(defaultUnitId) : "",
    brand: "",
    model: "",
    useCustomBrand: false,
    customBrand: "",
    useCustomModel: false,
    customModel: "",
    year: "",
    manufactureYear: "",
    modelYear: "",
    prefix: "",
    groupCode: "",
    telemetry: "",
    wheelCount: "",
    holder: "",
    customHolder: "",
    patrimony: "",
    rentalCompany: "",
    situation: "",
    contractNumber: "",
    contractStart: "",
    contractEnd: "",
    contractTerm: "",
    customContractTerm: "",
    licensing: "",
    plate: "",
    color: "",
    chassis: "",
    renavam: "",
    currentMileage: "",
    currentMileageDate: "",
    lastReviewDate: "",
    lastReviewMileage: "",
    employment: "",
    policeOfficerId: "",
    fixedDriver: "",
    fuelType: "",
    notes: "",
  };
}

function normalizeOptionalText(value) {
  const normalized = (value || "").trim();
  return normalized || null;
}

function resolvePrimaryYear(form) {
  const candidate = (form.modelYear || form.manufactureYear || form.year || "").trim();
  const numeric = candidate.replace(/\D/g, "");
  return numeric.slice(0, 4) || "0000";
}

function toOptions(values) {
  return values.map((value) => ({ value, label: value }));
}

export default FleetVehiclesPage;


