import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import { custodyOptions } from "../constants/custodyOptions";
import { itemCategories } from "../constants/itemCategories";
import { getResponsibilityVehicles } from "../services/fleetService";
import { getPoliceOfficers } from "../services/policeOfficerService";
import { getSectors, getUnits } from "../services/referenceDataService";
import { createItem } from "../services/itemService";
import { readViewerAccess as readAuthAccess } from "../utils/authAccess";
import { buildFleetVehicleOptionLabel } from "../utils/fleetVehicleLabels";
import { buildOfficerOptionLabel } from "../utils/officerLabels";
import { formatSectorLabel } from "../utils/sectorOptions";
import { buildHierarchicalUnitOptions } from "../utils/unitOptions";
import { normalizeUpperIdentifier } from "../utils/identifierFormat";
import { getLogisticaCustodyValidationMessage } from "../utils/logisticaCustody";
import { LOGISTICA_HOLDER_OPTIONS } from "../utils/logisticaOptions";
import {
  getLogisticaCustodyHeadline,
  getLogisticaCustodySavedAsText,
  getLogisticaCustodySummaryText,
  getLogisticaPoliceHint,
  getLogisticaSectorHint,
  getLogisticaVehicleHint,
} from "../utils/logisticaPresentation";

function NewItem({ onBack }) {
  const [viewerAccess, setViewerAccess] = useState({
    unitId: null,
    canViewAll: false,
  });
  const [name, setName] = useState("");
  const [modelo, setModelo] = useState("");
  const [category, setCategory] = useState("");
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
  const [status, setStatus] = useState("EM_USO");
  const [policeOfficerId, setPoliceOfficerId] = useState("");
  const [fleetVehicleId, setFleetVehicleId] = useState("");
  const [error, setError] = useState("");

  const handleUpperIdentifier = (setter, maxLength = null) => (e) => {
    setter(normalizeUpperIdentifier(e.target.value, maxLength));
  };

  async function loadUnits(access = viewerAccess) {
    try {
      const activeUnits = await getUnits();
      setUnits(activeUnits);
      if (!access.canViewAll && access.unitId) {
        setUnitId(String(access.unitId));
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
      const data = await getPoliceOfficers();
      setPoliceOfficers(data);
    } catch (error) {
      console.error("Erro ao carregar policiais:", error);
    }
  }

  async function loadFleetVehicles(targetUnitId = "") {
    try {
      const data = await getResponsibilityVehicles(targetUnitId ? Number(targetUnitId) : null);
      setFleetVehicles(data);
    } catch (error) {
      console.error("Erro ao carregar viaturas:", error);
    }
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const access = readAuthAccess();
    setViewerAccess(access);
    loadUnits(access);
    loadSectors();
    loadPoliceOfficers();
    loadFleetVehicles(access.canViewAll ? "" : access.unitId ? String(access.unitId) : "");
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const availableUnits = useMemo(() => {
    if (viewerAccess.canViewAll) {
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
    return policeOfficers.filter(
      (officer) => String(officer.unit_id) === String(unitId)
    );
  }, [policeOfficers, unitId]);
  const availableFleetVehicles = useMemo(() => {
    if (!unitId) {
      return [];
    }
    return fleetVehicles.filter(
      (vehicle) => String(vehicle.unit_id) === String(unitId)
    );
  }, [fleetVehicles, unitId]);

  const unitOptions = useMemo(
    () => buildHierarchicalUnitOptions(availableUnits),
    [availableUnits]
  );

  useEffect(() => {
    if (
      sectorId &&
      !availableSectors.some((sector) => String(sector.id) === String(sectorId))
    ) {
      setSectorId("");
    }
  }, [availableSectors, sectorId]);

  useEffect(() => {
    if (
      custodySectorId &&
      !availableSectors.some(
        (sector) => String(sector.id) === String(custodySectorId)
      )
    ) {
      setCustodySectorId("");
    }
  }, [availableSectors, custodySectorId]);

  useEffect(() => {
    if (
      policeOfficerId &&
      !availablePoliceOfficers.some(
        (officer) => String(officer.id) === String(policeOfficerId)
      )
    ) {
      setPoliceOfficerId("");
    }
  }, [availablePoliceOfficers, policeOfficerId]);

  useEffect(() => {
    if (
      fleetVehicleId &&
      !availableFleetVehicles.some(
        (vehicle) => String(vehicle.id) === String(fleetVehicleId)
      )
    ) {
      setFleetVehicleId("");
    }
  }, [availableFleetVehicles, fleetVehicleId]);

  useEffect(() => {
    if (custodyType !== "SETOR" && custodySectorId) {
      setCustodySectorId("");
    }
  }, [custodyType, custodySectorId]);

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
  }, [policeOfficerId, custodyType]);

  useEffect(() => {
    if (custodySectorId && custodyType !== "SETOR") {
      setCustodyType("SETOR");
    }
  }, [custodySectorId, custodyType]);

  useEffect(() => {
    if (fleetVehicleId && custodyType !== "VIATURA") {
      setCustodyType("VIATURA");
    }
  }, [fleetVehicleId, custodyType]);

  useEffect(() => {
    if (!unitId) {
      setFleetVehicles([]);
      return;
    }
    loadFleetVehicles(unitId);
  }, [unitId]);

  const selectedCustodySector = useMemo(
    () =>
      availableSectors.find(
        (sector) => String(sector.id) === String(custodySectorId)
      ),
    [availableSectors, custodySectorId]
  );
  const selectedOfficer = useMemo(
    () =>
      availablePoliceOfficers.find(
        (officer) => String(officer.id) === String(policeOfficerId)
      ),
    [availablePoliceOfficers, policeOfficerId]
  );
  const selectedFleetVehicle = useMemo(
    () =>
      availableFleetVehicles.find(
        (vehicle) => String(vehicle.id) === String(fleetVehicleId)
      ),
    [availableFleetVehicles, fleetVehicleId]
  );
  const custodyValidationMessage = useMemo(
    () =>
      getLogisticaCustodyValidationMessage(
        "o material",
        custodyType,
        custodySectorId,
        policeOfficerId,
        fleetVehicleId
      ),
    [custodyType, custodySectorId, policeOfficerId, fleetVehicleId]
  );
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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
      await createItem({
        name,
        modelo: modelo || null,
        category,
        unit_id: Number(unitId),
        sector_id: sectorId ? Number(sectorId) : null,
        custody_type: custodyType,
        custody_sector_id:
          custodyType === "SETOR" && custodySectorId
            ? Number(custodySectorId)
            : null,
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
    } catch (error) {
      console.error("Erro ao cadastrar material:", error);
      setError(error.message || "Erro ao cadastrar material.");
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Novo material</h1>
        <p style={styles.subtitle}>
          Cadastre um novo material com categoria, unidade, setor, localização e
          status inicial.
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

      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.sectionTitle}>Dados do material</h2>
        <p style={styles.sectionText}>
          Informe os dados essenciais para o controle do material no sistema.
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
          Defina primeiro a unidade e, quando houver, o setor responsável pelo
          material. Agora você também pode registrar se o bem está com um policial,
          com um setor específico ou na reserva da unidade.
        </div>

        <div style={styles.infoBox}>
          <strong>{getLogisticaCustodyHeadline("create")}</strong>{" "}
          {getLogisticaCustodySummaryText({
            custodyType,
            custodySectorName: selectedCustodySector?.name,
            policeOfficer: selectedOfficer,
            fleetVehicleLabel: selectedFleetVehicle?.prefix || selectedFleetVehicle?.plate,
            location,
          })}
        </div>

        {custodyValidationMessage && (
          <div style={styles.errorBox}>{custodyValidationMessage}</div>
        )}

        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Nome do material</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Modelo do material</label>
            <input
              type="text"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              placeholder="Ex: iPhone 14, Glock G17, Dell Latitude..."
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              style={styles.input}
            >
              <option value="">Selecione</option>
              {itemCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Unidade</label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
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
            <label style={styles.label}>Tipo de responsabilidade</label>
            <select
              value={custodyType}
              onChange={(e) => setCustodyType(e.target.value)}
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
              onChange={(e) => setSectorId(e.target.value)}
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
              onChange={(e) => setCustodySectorId(e.target.value)}
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
              {getLogisticaSectorHint("create", custodyType)}
            </small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Policial responsável</label>
            <select
              value={policeOfficerId}
              onChange={(e) => setPoliceOfficerId(e.target.value)}
              style={styles.input}
              disabled={!unitId || custodyType !== "POLICIAL"}
              required={custodyType === "POLICIAL"}
            >
              <option value="">{custodyType === "POLICIAL" ? "Selecione" : "Não se aplica"}</option>
              {availablePoliceOfficers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {buildOfficerOptionLabel(officer)}
                </option>
              ))}
            </select>
            <small style={{ color: "var(--app-text-muted)", fontSize: "0.88rem" }}>
              {getLogisticaPoliceHint("create", custodyType)}
            </small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Viatura vinculada</label>
            <select
              value={fleetVehicleId}
              onChange={(e) => setFleetVehicleId(e.target.value)}
              style={styles.input}
              disabled={!unitId || custodyType !== "VIATURA"}
              required={custodyType === "VIATURA"}
            >
              <option value="">{custodyType === "VIATURA" ? "Selecione" : "Não se aplica"}</option>
              {availableFleetVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {buildFleetVehicleOptionLabel(vehicle)}
                </option>
              ))}
            </select>
            <small style={{ color: "var(--app-text-muted)", fontSize: "0.88rem" }}>
              {getLogisticaVehicleHint("create", custodyType)}
            </small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
              onChange={(e) => setDescription(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Número de série</label>
            <input
              type="text"
              value={serialNumber}
              onChange={handleUpperIdentifier(setSerialNumber, 40)}
              placeholder="Opcional"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Patrimônio</label>
            <input
              type="text"
              value={assetTag}
              onChange={handleUpperIdentifier(setAssetTag, 40)}
              placeholder="Opcional"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Detentor</label>
            <select
              value={detentor}
              onChange={(e) => {
                setDetentor(e.target.value);
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
                onChange={(e) => setDetentorOutros(e.target.value)}
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
              onChange={(e) => setLocation(e.target.value)}
              style={styles.input}
            />
            <small style={{ color: "var(--app-text-muted)", fontSize: "0.88rem" }}>
              Exemplo: Armário 2, Sala de Operações, Telemática ou Reserva da unidade.
            </small>
          </div>
        </div>

        <div style={styles.footerActions}>
          <button
            type="submit"
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            Salvar material
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewItem;


