import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import { custodyOptions } from "../constants/custodyOptions";
import { getResponsibilityVehicles } from "../services/fleetService";
import { getItemById } from "../services/itemService";
import { createItemMovement } from "../services/itemMovementService";
import { getPoliceOfficers } from "../services/policeOfficerService";
import { getSectors, getUnits } from "../services/referenceDataService";
import { buildCustodySummary } from "../utils/custodyLabels";
import { buildFleetVehicleOptionLabel } from "../utils/fleetVehicleLabels";
import { buildOfficerOptionLabel } from "../utils/officerLabels";
import {
  buildSectorLabelMap,
  formatSectorLabel,
} from "../utils/sectorOptions";
import {
  buildHierarchicalUnitLabelMap,
  buildHierarchicalUnitOptions,
} from "../utils/unitOptions";

function Movement({ itemId, onBack }) {
  const [movementType, setMovementType] = useState("TRANSFERENCIA");
  const [units, setUnits] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [item, setItem] = useState(null);
  const [policeOfficers, setPoliceOfficers] = useState([]);
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [fromUnitId, setFromUnitId] = useState("");
  const [fromSectorId, setFromSectorId] = useState("");
  const [fromCustodyType, setFromCustodyType] = useState("RESERVA_UNIDADE");
  const [fromPoliceOfficerId, setFromPoliceOfficerId] = useState("");
  const [fromFleetVehicleId, setFromFleetVehicleId] = useState("");
  const [toUnitId, setToUnitId] = useState("");
  const [toSectorId, setToSectorId] = useState("");
  const [toCustodyType, setToCustodyType] = useState("RESERVA_UNIDADE");
  const [toPoliceOfficerId, setToPoliceOfficerId] = useState("");
  const [toFleetVehicleId, setToFleetVehicleId] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    loadUnits();
    loadSectors();
    loadPoliceOfficers();
    loadFleetVehicles();
    loadItem();
  }, [itemId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const fromSectors = useMemo(() => {
    if (!fromUnitId) {
      return [];
    }
    return sectors.filter((sector) => String(sector.unit_id) === String(fromUnitId));
  }, [sectors, fromUnitId]);

  const toSectors = useMemo(() => {
    if (!toUnitId) {
      return [];
    }
    return sectors.filter((sector) => String(sector.unit_id) === String(toUnitId));
  }, [sectors, toUnitId]);
  const fromPoliceOfficers = useMemo(() => {
    if (!fromUnitId) {
      return [];
    }
    return policeOfficers.filter(
      (officer) => String(officer.unit_id) === String(fromUnitId)
    );
  }, [policeOfficers, fromUnitId]);
  const toPoliceOfficers = useMemo(() => {
    if (!toUnitId) {
      return [];
    }
    return policeOfficers.filter(
      (officer) => String(officer.unit_id) === String(toUnitId)
    );
  }, [policeOfficers, toUnitId]);
  const fromFleetVehicles = useMemo(() => {
    if (!fromUnitId) {
      return [];
    }
    return fleetVehicles.filter(
      (vehicle) => String(vehicle.unit_id) === String(fromUnitId)
    );
  }, [fleetVehicles, fromUnitId]);
  const toFleetVehicles = useMemo(() => {
    if (!toUnitId) {
      return [];
    }
    return fleetVehicles.filter(
      (vehicle) => String(vehicle.unit_id) === String(toUnitId)
    );
  }, [fleetVehicles, toUnitId]);

  const unitOptions = useMemo(
    () => buildHierarchicalUnitOptions(units),
    [units]
  );
  const unitLabelMap = useMemo(
    () => buildHierarchicalUnitLabelMap(units),
    [units]
  );
  const sectorLabelMap = useMemo(() => {
    return buildSectorLabelMap(sectors);
  }, [sectors]);

  useEffect(() => {
    if (
      fromSectorId &&
      !fromSectors.some((sector) => String(sector.id) === String(fromSectorId))
    ) {
      setFromSectorId("");
    }
  }, [fromSectorId, fromSectors]);

  useEffect(() => {
    if (
      toSectorId &&
      !toSectors.some((sector) => String(sector.id) === String(toSectorId))
    ) {
      setToSectorId("");
    }
  }, [toSectorId, toSectors]);

  useEffect(() => {
    if (
      fromPoliceOfficerId &&
      !fromPoliceOfficers.some(
        (officer) => String(officer.id) === String(fromPoliceOfficerId)
      )
    ) {
      setFromPoliceOfficerId("");
    }
  }, [fromPoliceOfficerId, fromPoliceOfficers]);

  useEffect(() => {
    if (
      toPoliceOfficerId &&
      !toPoliceOfficers.some(
        (officer) => String(officer.id) === String(toPoliceOfficerId)
      )
    ) {
      setToPoliceOfficerId("");
    }
  }, [toPoliceOfficerId, toPoliceOfficers]);

  useEffect(() => {
    if (
      toFleetVehicleId &&
      !toFleetVehicles.some(
        (vehicle) => String(vehicle.id) === String(toFleetVehicleId)
      )
    ) {
      setToFleetVehicleId("");
    }
  }, [toFleetVehicleId, toFleetVehicles]);

  const loadUnits = async () => {
    try {
      setUnits(await getUnits());
    } catch (error) {
      setError(error.message || "Erro ao carregar unidades");
    }
  };

  const loadSectors = async () => {
    try {
      setSectors(await getSectors());
    } catch (error) {
      setError(error.message || "Erro ao carregar setores");
    }
  };

  const loadPoliceOfficers = async () => {
    try {
      const data = await getPoliceOfficers();
      setPoliceOfficers(data);
    } catch (error) {
      console.error("Erro ao carregar policiais:", error);
    }
  };

  const loadFleetVehicles = async () => {
    try {
      const data = await getResponsibilityVehicles();
      setFleetVehicles(data);
    } catch (error) {
      console.error("Erro ao carregar viaturas:", error);
    }
  };

  const loadItem = async () => {
    try {
      setLoading(true);
      const item = await getItemById(itemId);
      setItem(item);
      setFromUnitId(item.unit_id ? String(item.unit_id) : "");
      setToUnitId(item.unit_id ? String(item.unit_id) : "");
      setFromSectorId(item.sector_id ? String(item.sector_id) : "");
      setToSectorId(item.sector_id ? String(item.sector_id) : "");
      setFromCustodyType(item.custody_type || "RESERVA_UNIDADE");
      setToCustodyType(item.custody_type || "RESERVA_UNIDADE");
      setFromPoliceOfficerId(item.police_officer_id ? String(item.police_officer_id) : "");
      setToPoliceOfficerId(item.police_officer_id ? String(item.police_officer_id) : "");
      setFromFleetVehicleId(item.fleet_vehicle_id ? String(item.fleet_vehicle_id) : "");
      setToFleetVehicleId(item.fleet_vehicle_id ? String(item.fleet_vehicle_id) : "");
      setFromLocation(item.location || "");
      setToLocation("");
    } catch (error) {
      console.error("Erro ao carregar item para movimentação:", error);
      setError(error.message || "Erro ao carregar material");
      onBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (toCustodyType !== "SETOR" && toSectorId) {
      setToSectorId("");
    }
  }, [toCustodyType, toSectorId]);

  useEffect(() => {
    if (toCustodyType !== "POLICIAL" && toPoliceOfficerId) {
      setToPoliceOfficerId("");
    }
  }, [toCustodyType, toPoliceOfficerId]);

  useEffect(() => {
    if (toCustodyType !== "VIATURA" && toFleetVehicleId) {
      setToFleetVehicleId("");
    }
  }, [toCustodyType, toFleetVehicleId]);

  useEffect(() => {
    if (toPoliceOfficerId && toCustodyType !== "POLICIAL") {
      setToCustodyType("POLICIAL");
    }
  }, [toPoliceOfficerId, toCustodyType]);

  useEffect(() => {
    if (toSectorId && toCustodyType !== "SETOR") {
      setToCustodyType("SETOR");
    }
  }, [toSectorId, toCustodyType]);

  useEffect(() => {
    if (toFleetVehicleId && toCustodyType !== "VIATURA") {
      setToCustodyType("VIATURA");
    }
  }, [toFleetVehicleId, toCustodyType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await createItemMovement({
        item_id: itemId,
        movement_type: movementType,
        from_unit_id: fromUnitId ? Number(fromUnitId) : null,
        from_sector_id: fromSectorId ? Number(fromSectorId) : null,
        from_custody_type: fromCustodyType,
        from_custody_sector_id:
          fromCustodyType === "SETOR" && fromSectorId ? Number(fromSectorId) : null,
        from_police_officer_id: fromPoliceOfficerId ? Number(fromPoliceOfficerId) : null,
        from_fleet_vehicle_id:
          fromCustodyType === "VIATURA" && fromFleetVehicleId ? Number(fromFleetVehicleId) : null,
        to_unit_id: toUnitId ? Number(toUnitId) : null,
        to_sector_id: toCustodyType === "SETOR" && toSectorId ? Number(toSectorId) : null,
        to_custody_type: toCustodyType,
        to_custody_sector_id:
          toCustodyType === "SETOR" && toSectorId ? Number(toSectorId) : null,
        to_police_officer_id:
          toCustodyType === "POLICIAL" && toPoliceOfficerId ? Number(toPoliceOfficerId) : null,
        to_fleet_vehicle_id:
          toCustodyType === "VIATURA" && toFleetVehicleId ? Number(toFleetVehicleId) : null,
        from_location: fromLocation || null,
        to_location: toLocation || null,
        details,
      });
      onBack();
    } catch (error) {
      setError(error.message || "Erro ao registrar movimentação");
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          Carregando material e preparando o formulário de movimentação...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Movimentar material</h1>
        <p style={styles.subtitle}>
          Registre transferências, manutenções ou baixas com unidade, setor,
          local e observações.
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
        <h2 style={styles.sectionTitle}>Dados da movimentação</h2>
        <p style={styles.sectionText}>
          Informe origem, destino e detalhes. O item será atualizado conforme o
          tipo de movimentação.
        </p>

        <div style={styles.infoBox}>
            Confira com cuidado a origem atual antes de salvar. Essa operação atualiza o histórico
          e o estado operacional do material.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              padding: "16px",
              borderRadius: "16px",
              backgroundColor: "var(--app-surface-muted)",
              border: "1px solid var(--app-border)",
            }}
          >
            <div style={styles.label}>Item atual</div>
            <div style={{ marginTop: "8px", fontWeight: 700 }}>
              {item?.name || `Material ${itemId}`}
            </div>
            <div style={{ marginTop: "6px", color: "var(--app-text-muted)", fontSize: "0.92rem" }}>
              Status: {formatStatusLabel(item?.status)}
            </div>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: "16px",
              backgroundColor: "var(--app-surface-muted)",
              border: "1px solid var(--app-border)",
            }}
          >
            <div style={styles.label}>Origem</div>
            <div style={{ marginTop: "8px", fontWeight: 700 }}>
              {unitLabelMap[fromUnitId] || "Selecione a unidade"}
            </div>
            <div style={{ marginTop: "6px", color: "var(--app-text-muted)", fontSize: "0.92rem" }}>
              Setor: {sectorLabelMap[fromSectorId] || "Não informado"}
            </div>
            <div style={{ marginTop: "4px", color: "var(--app-text-muted)", fontSize: "0.92rem" }}>
              Responsabilidade: {buildCustodySummary({
                custodyType: fromCustodyType,
                custodySectorName: sectorLabelMap[fromSectorId],
                policeOfficer: fromPoliceOfficers.find((officer) => String(officer.id) === String(fromPoliceOfficerId)),
                fleetVehicleLabel: fromFleetVehicles.find((vehicle) => String(vehicle.id) === String(fromFleetVehicleId))?.prefix,
              })}
            </div>
            <div style={{ marginTop: "4px", color: "var(--app-text-muted)", fontSize: "0.92rem" }}>
              Local: {fromLocation || "Não informado"}
            </div>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: "16px",
              backgroundColor: "var(--app-surface-muted)",
              border: "1px solid var(--app-border)",
            }}
          >
            <div style={styles.label}>Destino</div>
            <div style={{ marginTop: "8px", fontWeight: 700 }}>
              {unitLabelMap[toUnitId] || "Selecione a unidade"}
            </div>
            <div style={{ marginTop: "6px", color: "var(--app-text-muted)", fontSize: "0.92rem" }}>
              Setor: {sectorLabelMap[toSectorId] || "Não informado"}
            </div>
            <div style={{ marginTop: "4px", color: "var(--app-text-muted)", fontSize: "0.92rem" }}>
              Responsabilidade: {buildCustodySummary({
                custodyType: toCustodyType,
                custodySectorName: sectorLabelMap[toSectorId],
                policeOfficer: toPoliceOfficers.find((officer) => String(officer.id) === String(toPoliceOfficerId)),
                fleetVehicleLabel: toFleetVehicles.find((vehicle) => String(vehicle.id) === String(toFleetVehicleId))?.prefix,
              })}
            </div>
            <div style={{ marginTop: "4px", color: "var(--app-text-muted)", fontSize: "0.92rem" }}>
              Local: {toLocation || "Não informado"}
            </div>
          </div>
        </div>

        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Tipo de movimentação</label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              style={styles.input}
            >
              <option value="TRANSFERENCIA">Transferência</option>
              <option value="MANUTENCAO">Manutenção</option>
              <option value="BAIXA">Baixa</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Unidade de origem</label>
            <select
              value={fromUnitId}
              onChange={(e) => setFromUnitId(e.target.value)}
              required
              style={styles.input}
              disabled
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
            <label style={styles.label}>Setor de origem</label>
            <select
              value={fromSectorId}
              onChange={(e) => setFromSectorId(e.target.value)}
              style={styles.input}
              disabled
            >
              <option value="">Selecione</option>
              {fromSectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {formatSectorLabel(sector)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Local de origem</label>
            <input
              type="text"
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              style={styles.input}
              disabled
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Responsabilidade de origem</label>
            <input
              type="text"
              value={buildCustodySummary({
                custodyType: fromCustodyType,
                custodySectorName: sectorLabelMap[fromSectorId],
                policeOfficer: fromPoliceOfficers.find((officer) => String(officer.id) === String(fromPoliceOfficerId)),
                fleetVehicleLabel: fromFleetVehicles.find((vehicle) => String(vehicle.id) === String(fromFleetVehicleId))?.prefix,
              })}
              style={styles.input}
              disabled
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Policial de origem</label>
            <select
              value={fromPoliceOfficerId}
              onChange={(e) => setFromPoliceOfficerId(e.target.value)}
              style={styles.input}
              disabled
            >
              <option value="">Não vinculado</option>
              {fromPoliceOfficers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {buildOfficerOptionLabel(officer)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Viatura de origem</label>
            <select
              value={fromFleetVehicleId}
              onChange={(e) => setFromFleetVehicleId(e.target.value)}
              style={styles.input}
              disabled
            >
              <option value="">Não vinculada</option>
              {fromFleetVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {buildFleetVehicleOptionLabel(vehicle)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Responsabilidade de destino</label>
            <select
              value={toCustodyType}
              onChange={(e) => setToCustodyType(e.target.value)}
              style={styles.input}
            >
              {custodyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Unidade de destino</label>
            <select
              value={toUnitId}
              onChange={(e) => setToUnitId(e.target.value)}
              required
              style={styles.input}
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
            <label style={styles.label}>
              {toCustodyType === "SETOR" ? "Setor responsável de destino" : "Setor de destino"}
            </label>
            <select
              value={toSectorId}
              onChange={(e) => setToSectorId(e.target.value)}
              style={styles.input}
              disabled={!toUnitId || toCustodyType !== "SETOR"}
            >
              <option value="">{toCustodyType === "SETOR" ? "Selecione" : "Não se aplica"}</option>
              {toSectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {formatSectorLabel(sector)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Local de destino</label>
            <input
              type="text"
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Policial de destino</label>
            <select
              value={toPoliceOfficerId}
              onChange={(e) => setToPoliceOfficerId(e.target.value)}
              style={styles.input}
              disabled={!toUnitId || toCustodyType !== "POLICIAL"}
            >
              <option value="">{toCustodyType === "POLICIAL" ? "Selecione" : "Não se aplica"}</option>
              {toPoliceOfficers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {buildOfficerOptionLabel(officer)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Viatura vinculada</label>
            <select
              value={toFleetVehicleId}
              onChange={(e) => setToFleetVehicleId(e.target.value)}
              style={styles.input}
              disabled={!toUnitId || toCustodyType !== "VIATURA"}
            >
              <option value="">{toCustodyType === "VIATURA" ? "Selecione" : "Não se aplica"}</option>
              {toFleetVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {buildFleetVehicleOptionLabel(vehicle)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.fieldFull}>
            <label style={styles.label}>Detalhes</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required
              style={styles.textarea}
            />
          </div>
        </div>

        <div style={styles.footerActions}>
          <button
            type="submit"
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            Salvar movimentação
          </button>
        </div>
      </form>
    </div>
  );
}

function formatStatusLabel(status) {
  if (!status) {
    return "Não informado";
  }

  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default Movement;


