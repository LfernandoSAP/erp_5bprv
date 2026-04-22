import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import { custodyOptions } from "../constants/custodyOptions";
import { getResponsibilityVehicles } from "../services/fleetService";
import { getPoliceOfficers } from "../services/policeOfficerService";
import { getSectors, getUnits } from "../services/referenceDataService";
import { getTpdTalonarioById, updateTpdTalonario } from "../services/tpdTalonarioService";
import { readViewerAccess as readAuthAccess } from "../utils/authAccess";
import { buildFleetVehicleOptionLabel } from "../utils/fleetVehicleLabels";
import { normalizeUpperIdentifier } from "../utils/identifierFormat";
import { getLogisticaCustodyValidationMessage } from "../utils/logisticaCustody";
import { LOGISTICA_HOLDER_OPTIONS } from "../utils/logisticaOptions";
import { buildOfficerOptionLabel } from "../utils/officerLabels";
import { formatSectorLabel } from "../utils/sectorOptions";
import {
  getLogisticaCustodyHeadline,
  getLogisticaCustodySavedAsText,
  getLogisticaCustodySummaryText,
  getLogisticaPoliceHint,
  getLogisticaSectorHint,
  getLogisticaVehicleHint,
} from "../utils/logisticaPresentation";
import { buildHierarchicalUnitOptions } from "../utils/unitOptions";

const TPD_CATEGORY_OPTIONS = ["Talonário Eletrônico", "TPD PMESP"];

function EditTpdTalonario({ itemId, onBack }) {
  const [viewerAccess, setViewerAccess] = useState({
    unitId: null,
    canViewAll: false,
  });
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [modelo, setModelo] = useState("");
  const [unitId, setUnitId] = useState("");
  const [units, setUnits] = useState([]);
  const [sectorId, setSectorId] = useState("");
  const [custodySectorId, setCustodySectorId] = useState("");
  const [custodyType, setCustodyType] = useState("RESERVA_UNIDADE");
  const [sectors, setSectors] = useState([]);
  const [policeOfficers, setPoliceOfficers] = useState([]);
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [description, setDescription] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [detentor, setDetentor] = useState("");
  const [detentorOutros, setDetentorOutros] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("");
  const [policeOfficerId, setPoliceOfficerId] = useState("");
  const [fleetVehicleId, setFleetVehicleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const defaultUnitId = useMemo(() => {
    if (viewerAccess.canViewAll || !viewerAccess.unitId) {
      return "";
    }
    return String(viewerAccess.unitId);
  }, [viewerAccess]);

  const handleUpperIdentifier = (setter, maxLength = null) => (event) => {
    setter(normalizeUpperIdentifier(event.target.value, maxLength));
  };

  const resetFormBelowCategory = (nextCategory = "") => {
    setCategory(nextCategory);
    setName("");
    setModelo("");
    setUnitId(defaultUnitId);
    setSectorId("");
    setCustodySectorId("");
    setCustodyType("RESERVA_UNIDADE");
    setDescription("");
    setSerialNumber("");
    setAssetTag("");
    setDetentor("");
    setDetentorOutros("");
    setLocation("");
    setStatus("EM_USO");
    setPoliceOfficerId("");
    setFleetVehicleId("");
    setError("");
  };

  async function loadUnits(access = viewerAccess) {
    try {
      const activeUnits = await getUnits();
      setUnits(activeUnits);
      if (!access.canViewAll && access.unitId) {
        setUnitId((current) => current || String(access.unitId));
      }
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar TPD/Talonário.");
    }
  }

  async function loadSectors() {
    try {
      setSectors(await getSectors());
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar TPD/Talonário.");
    }
  }

  async function loadPoliceOfficers() {
    try {
      const data = await getPoliceOfficers();
      setPoliceOfficers(data);
    } catch (loadError) {
      console.error("Erro ao carregar TPD/Talonário:", loadError);
    }
  }

  async function loadFleetVehicles(targetUnitId = "") {
    try {
      const data = await getResponsibilityVehicles(targetUnitId ? Number(targetUnitId) : null);
      setFleetVehicles(data);
    } catch (loadError) {
      console.error("Erro ao carregar TPD/Talonário:", loadError);
    }
  }

  const hydrateItem = (data) => {
    setName(data.name || "");
    setModelo(data.modelo || "");
    setCategory(data.category || "");
    setUnitId(data.unit_id ? String(data.unit_id) : defaultUnitId);
    setSectorId(data.sector_id ? String(data.sector_id) : "");
    setCustodySectorId(
      data.custody_sector_id
        ? String(data.custody_sector_id)
        : data.custody_type === "SETOR" && data.sector_id
          ? String(data.sector_id)
          : ""
    );
    setCustodyType(data.custody_type || "RESERVA_UNIDADE");
    setDescription(data.description || "");
    setSerialNumber(data.serial_number || "");
    setAssetTag(data.asset_tag || "");
    setDetentor(
      data.detentor && LOGISTICA_HOLDER_OPTIONS.includes(data.detentor)
        ? data.detentor
        : data.detentor
          ? "OUTROS"
          : ""
    );
    setDetentorOutros(
      data.detentor === "OUTROS"
        ? data.detentor_outros || ""
        : data.detentor && !LOGISTICA_HOLDER_OPTIONS.includes(data.detentor)
          ? data.detentor_outros || data.detentor
          : data.detentor_outros || ""
    );
    setLocation(data.location || "");
    setStatus(data.status || "EM_USO");
    setPoliceOfficerId(data.police_officer_id ? String(data.police_officer_id) : "");
    setFleetVehicleId(data.fleet_vehicle_id ? String(data.fleet_vehicle_id) : "");
  };

  async function loadItem() {
    try {
      setError("");
      setLoading(true);
      const data = await getTpdTalonarioById(itemId);
      hydrateItem(data);
    } catch (loadError) {
      console.error("Erro ao carregar TPD/Talonário:", loadError);
      setError(loadError.message || "Erro ao carregar TPD/Talonário.");
    } finally {
      setLoading(false);
    }
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const access = readAuthAccess();
    setViewerAccess(access);
    loadUnits(access);
    loadSectors();
    loadPoliceOfficers();
  }, []);

  useEffect(() => {
    loadItem();
  }, [itemId, defaultUnitId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const availableUnits = useMemo(() => {
    if (viewerAccess.canViewAll || !viewerAccess.unitId) {
      return units;
    }
    return units.filter((unit) => String(unit.id) === String(viewerAccess.unitId));
  }, [units, viewerAccess]);

  const availableSectors = useMemo(() => {
    if (!unitId) {
      return [];
    }
    return sectors.filter((sector) => String(sector.unit_id) === String(unitId));
  }, [sectors, unitId]);

  const availablePoliceOfficers = useMemo(() => {
    if (!unitId) {
      return [];
    }
    return policeOfficers.filter((officer) => String(officer.unit_id) === String(unitId));
  }, [policeOfficers, unitId]);

  const availableFleetVehicles = useMemo(() => {
    if (!unitId) {
      return [];
    }
    return fleetVehicles.filter((vehicle) => String(vehicle.unit_id) === String(unitId));
  }, [fleetVehicles, unitId]);

  const unitOptions = useMemo(
    () => buildHierarchicalUnitOptions(availableUnits),
    [availableUnits]
  );

  useEffect(() => {
    if (sectorId && !availableSectors.some((sector) => String(sector.id) === String(sectorId))) {
      setSectorId("");
    }
  }, [availableSectors, sectorId]);

  useEffect(() => {
    if (
      custodySectorId &&
      !availableSectors.some((sector) => String(sector.id) === String(custodySectorId))
    ) {
      setCustodySectorId("");
    }
  }, [availableSectors, custodySectorId]);

  useEffect(() => {
    if (
      policeOfficerId &&
      !availablePoliceOfficers.some((officer) => String(officer.id) === String(policeOfficerId))
    ) {
      setPoliceOfficerId("");
    }
  }, [availablePoliceOfficers, policeOfficerId]);

  useEffect(() => {
    if (
      fleetVehicleId &&
      !availableFleetVehicles.some((vehicle) => String(vehicle.id) === String(fleetVehicleId))
    ) {
      setFleetVehicleId("");
    }
  }, [availableFleetVehicles, fleetVehicleId]);

  useEffect(() => {
    if (custodyType !== "SETOR" && custodySectorId) {
      setCustodySectorId("");
    }
  }, [custodySectorId, custodyType]);

  useEffect(() => {
    if (custodyType !== "POLICIAL" && policeOfficerId) {
      setPoliceOfficerId("");
    }
  }, [custodyType, policeOfficerId]);

  useEffect(() => {
    if (custodyType !== "VIATURA" && fleetVehicleId) {
      setFleetVehicleId("");
    }
  }, [custodyType, fleetVehicleId]);

  useEffect(() => {
    if (policeOfficerId && custodyType !== "POLICIAL") {
      setCustodyType("POLICIAL");
    }
  }, [custodyType, policeOfficerId]);

  useEffect(() => {
    if (custodySectorId && custodyType !== "SETOR") {
      setCustodyType("SETOR");
    }
  }, [custodySectorId, custodyType]);

  useEffect(() => {
    if (fleetVehicleId && custodyType !== "VIATURA") {
      setCustodyType("VIATURA");
    }
  }, [custodyType, fleetVehicleId]);

  useEffect(() => {
    if (!unitId) {
      setFleetVehicles([]);
      return;
    }
    loadFleetVehicles(unitId);
  }, [unitId]);

  const selectedCustodySector = useMemo(
    () => availableSectors.find((sector) => String(sector.id) === String(custodySectorId)),
    [availableSectors, custodySectorId]
  );

  const selectedOfficer = useMemo(
    () => availablePoliceOfficers.find((officer) => String(officer.id) === String(policeOfficerId)),
    [availablePoliceOfficers, policeOfficerId]
  );

  const selectedFleetVehicle = useMemo(
    () => availableFleetVehicles.find((vehicle) => String(vehicle.id) === String(fleetVehicleId)),
    [availableFleetVehicles, fleetVehicleId]
  );

  const custodyValidationMessage = useMemo(
    () =>
      getLogisticaCustodyValidationMessage(
        "o TPD/Talonário",
        custodyType,
        custodySectorId,
        policeOfficerId,
        fleetVehicleId
      ),
    [custodyType, custodySectorId, fleetVehicleId, policeOfficerId]
  );

  const selectedCategoryHelpText = useMemo(() => {
    if (category === "Talonário Eletrônico") {
      return "Preencha os dados do talonário eletrônico para continuar.";
    }
    if (category === "TPD PMESP") {
      return "Preencha os dados do TPD PMESP para continuar.";
    }
    return "Selecione uma categoria para continuar.";
  }, [category]);

  const handleCategoryChange = (nextCategory) => {
    resetFormBelowCategory(nextCategory);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!category) {
      setError("Selecione uma categoria para continuar.");
      return;
    }

    if (!unitId) {
      setError("Unidade é obrigatória.");
      return;
    }

    if (custodyValidationMessage) {
      setError(custodyValidationMessage);
      return;
    }

    if (detentor === "OUTROS" && !detentorOutros.trim()) {
      setError("Informe o detentor quando selecionar OUTROS.");
      return;
    }

    try {
      await updateTpdTalonario(itemId, {
        name,
        modelo: modelo || null,
        category,
        unit_id: Number(unitId),
        sector_id: sectorId ? Number(sectorId) : null,
        custody_type: custodyType,
        custody_sector_id:
          custodyType === "SETOR" && custodySectorId ? Number(custodySectorId) : null,
        police_officer_id:
          custodyType === "POLICIAL" && policeOfficerId ? Number(policeOfficerId) : null,
        fleet_vehicle_id:
          custodyType === "VIATURA" && fleetVehicleId ? Number(fleetVehicleId) : null,
        description,
        serial_number: serialNumber || null,
        asset_tag: assetTag || null,
        detentor: detentor || null,
        detentor_outros: detentor === "OUTROS" ? detentorOutros.trim() || null : null,
        location,
        status,
      });

      onBack();
    } catch (loadError) {
      console.error("Erro ao atualizar TPD/Talonário:", loadError);
      setError(loadError.message || "Erro ao atualizar TPD/Talonário.");
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          Carregando TPD/Talonário e preparando os dados para edição...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Editar TPD/Talonário</h1>
        <p style={styles.subtitle}>
          Revise a categoria e ajuste os dados de controle do TPD/Talonário.
        </p>

        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.sectionTitle}>Dados do TPD/Talonário</h2>
        <p style={styles.sectionText}>
          Defina a categoria primeiro. Os demais campos permanecem vinculados ao tipo selecionado.
        </p>

        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Categoria</label>
            <select
              value={category}
              onChange={(event) => handleCategoryChange(event.target.value)}
              required
              style={styles.input}
            >
              <option value="">Selecione</option>
              {TPD_CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <small style={{ color: "var(--app-text-muted)", fontSize: "0.88rem" }}>
              {selectedCategoryHelpText}
            </small>
          </div>
        </div>

        {!category ? null : (
          <>
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
              {selectedCategoryHelpText}
            </div>

            <div style={styles.infoBox}>
              Esta tela preserva o histórico do item. Revise unidade, responsabilidade, status e
              localização antes de confirmar qualquer ajuste.
            </div>

            <div style={styles.infoBox}>
              <strong>{getLogisticaCustodyHeadline("edit")}</strong>{" "}
              {getLogisticaCustodySummaryText({
                custodyType,
                custodySectorName: selectedCustodySector?.name,
                policeOfficer: selectedOfficer,
                fleetVehicleLabel: selectedFleetVehicle?.prefix || selectedFleetVehicle?.plate,
                location,
              })}
            </div>

            {custodyValidationMessage && <div style={styles.errorBox}>{custodyValidationMessage}</div>}

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Nome do material</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Modelo do material</label>
                <input
                  type="text"
                  value={modelo}
                  onChange={(event) => setModelo(event.target.value)}
                  placeholder="Ex: tablet corporativo, impressora térmica..."
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Unidade</label>
                <select
                  value={unitId}
                  onChange={(event) => setUnitId(event.target.value)}
                  required
                  style={styles.input}
                  disabled={!viewerAccess.canViewAll && Boolean(viewerAccess.unitId)}
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
                <label style={styles.label}>Tipo de responsabilidade</label>
                <select
                  value={custodyType}
                  onChange={(event) => setCustodyType(event.target.value)}
                  style={styles.input}
                >
                  {custodyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small style={{ color: "var(--app-text-muted)", fontSize: "0.88rem" }}>
                  {getLogisticaCustodySavedAsText({
                    custodyType,
                    custodySectorName: selectedCustodySector?.name,
                    policeOfficer: selectedOfficer,
                    fleetVehicleLabel: selectedFleetVehicle?.prefix || selectedFleetVehicle?.plate,
                  })}
                </small>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Setor do material</label>
                <select
                  value={sectorId}
                  onChange={(event) => setSectorId(event.target.value)}
                  style={styles.input}
                  disabled={!unitId}
                >
                  <option value="">Não informado</option>
                  {availableSectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {formatSectorLabel(sector)}
                    </option>
                  ))}
                </select>
                <small style={{ color: "var(--app-text-muted)", fontSize: "0.88rem" }}>
                  Setor administrativo ou organizacional onde o material fica vinculado.
                </small>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Setor responsável</label>
                <select
                  value={custodySectorId}
                  onChange={(event) => setCustodySectorId(event.target.value)}
                  style={styles.input}
                  disabled={!unitId || custodyType !== "SETOR"}
                  required={custodyType === "SETOR"}
                >
                  <option value="">{custodyType === "SETOR" ? "Selecione" : "Não se aplica"}</option>
                  {availableSectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {formatSectorLabel(sector)}
                    </option>
                  ))}
                </select>
                <small style={{ color: "var(--app-text-muted)", fontSize: "0.88rem" }}>
                  {getLogisticaSectorHint("edit", custodyType)}
                </small>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Policial responsável</label>
                <select
                  value={policeOfficerId}
                  onChange={(event) => setPoliceOfficerId(event.target.value)}
                  style={styles.input}
                  disabled={!unitId || custodyType !== "POLICIAL"}
                  required={custodyType === "POLICIAL"}
                >
                  <option value="">
                    {custodyType === "POLICIAL" ? "Selecione" : "Não se aplica"}
                  </option>
                  {availablePoliceOfficers.map((officer) => (
                    <option key={officer.id} value={officer.id}>
                      {buildOfficerOptionLabel(officer)}
                    </option>
                  ))}
                </select>
                <small style={{ color: "var(--app-text-muted)", fontSize: "0.88rem" }}>
                  {getLogisticaPoliceHint("edit", custodyType)}
                </small>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Viatura vinculada</label>
                <select
                  value={fleetVehicleId}
                  onChange={(event) => setFleetVehicleId(event.target.value)}
                  style={styles.input}
                  disabled={!unitId || custodyType !== "VIATURA"}
                  required={custodyType === "VIATURA"}
                >
                  <option value="">
                    {custodyType === "VIATURA" ? "Selecione" : "Não se aplica"}
                  </option>
                  {availableFleetVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {buildFleetVehicleOptionLabel(vehicle)}
                    </option>
                  ))}
                </select>
                <small style={{ color: "var(--app-text-muted)", fontSize: "0.88rem" }}>
                  {getLogisticaVehicleHint("edit", custodyType)}
                </small>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Status</label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  required
                  style={styles.input}
                >
                  <option value="EM_USO">Em uso</option>
                  <option value="EM_ESTOQUE">Em estoque</option>
                  <option value="MANUTENCAO">Manutenção</option>
                  <option value="BAIXADO">Baixado</option>
                </select>
              </div>

              <div style={styles.fieldFull}>
                <label style={styles.label}>Descrição</label>
                <input
                  type="text"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Número de série</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={handleUpperIdentifier(setSerialNumber, 40)}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Patrimônio</label>
                <input
                  type="text"
                  value={assetTag}
                  onChange={handleUpperIdentifier(setAssetTag, 40)}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Detentor</label>
                <select
                  value={detentor}
                  onChange={(event) => {
                    setDetentor(event.target.value);
                    setDetentorOutros("");
                  }}
                  style={styles.input}
                >
                  <option value="">Selecione</option>
                  {LOGISTICA_HOLDER_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {detentor === "OUTROS" && (
                <div style={styles.field}>
                  <label style={styles.label}>Informe o detentor</label>
                  <input
                    type="text"
                    value={detentorOutros}
                    onChange={(event) => setDetentorOutros(event.target.value)}
                    placeholder="Informe o detentor"
                    style={styles.input}
                    required
                  />
                </div>
              )}

              <div style={styles.fieldFull}>
                <label style={styles.label}>Localização</label>
                <input
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  style={styles.input}
                />
                <small style={{ color: "var(--app-text-muted)", fontSize: "0.88rem" }}>
                  Atualize quando o material mudar fisicamente de sala, armário ou setor.
                </small>
              </div>
            </div>

            <div style={styles.footerActions}>
              <button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>
                Salvar alterações
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

export default EditTpdTalonario;
