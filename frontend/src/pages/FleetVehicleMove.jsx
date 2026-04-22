import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import {
  getFleetVehicleById,
  moveFleetVehicle,
} from "../services/fleetService";
import { getPoliceOfficers } from "../services/policeOfficerService";
import { getUnits } from "../services/referenceDataService";
import {
  buildOfficerOptionLabel,
  buildOfficerSummary,
  findOfficerByLookup,
} from "../utils/officerLabels";
import {
  buildHierarchicalUnitLabelMap,
  buildHierarchicalUnitOptions,
} from "../utils/unitOptions";

function FleetVehicleMove({ vehicleId, onBack }) {
  const [vehicle, setVehicle] = useState(null);
  const [units, setUnits] = useState([]);
  const [policeOfficers, setPoliceOfficers] = useState([]);
  const [movementType, setMovementType] = useState("TRANSFERENCIA");
  const [toUnitId, setToUnitId] = useState("");
  const [officerLookup, setOfficerLookup] = useState("");
  const [toPoliceOfficerId, setToPoliceOfficerId] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    loadUnits();
    loadPoliceOfficers();
    loadVehicle();
  }, [vehicleId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const unitOptions = useMemo(() => buildHierarchicalUnitOptions(units), [units]);
  const unitLabelMap = useMemo(() => buildHierarchicalUnitLabelMap(units), [units]);

  const availablePoliceOfficers = useMemo(() => {
    if (!toUnitId) {
      return policeOfficers;
    }
    return policeOfficers.filter(
      (officer) => String(officer.unit_id) === String(toUnitId)
    );
  }, [policeOfficers, toUnitId]);

  const selectedOfficer = useMemo(
    () =>
      availablePoliceOfficers.find(
        (officer) => String(officer.id) === String(toPoliceOfficerId)
      ),
    [availablePoliceOfficers, toPoliceOfficerId]
  );

  useEffect(() => {
    if (toPoliceOfficerId && policeOfficers.length > 0 && !selectedOfficer) {
      setToPoliceOfficerId("");
      setOfficerLookup("");
    }
  }, [toPoliceOfficerId, policeOfficers.length, selectedOfficer]);

  const loadUnits = async () => {
    try {
      const data = await getUnits();
      setUnits(data);
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar unidades");
    }
  };

  const loadPoliceOfficers = async () => {
    try {
      const data = await getPoliceOfficers();
      setPoliceOfficers(data);
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar policiais");
    }
  };

  const loadVehicle = async () => {
    try {
      setError("");
      const data = await getFleetVehicleById(vehicleId);
      setVehicle(data);
      setToUnitId(data.unit_id ? String(data.unit_id) : "");
      if (data.police_officer_id) {
        setToPoliceOfficerId(String(data.police_officer_id));
      }
      if (data.police_officer_re || data.police_officer_name) {
        setOfficerLookup(buildOfficerSummary(data));
      }
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar registro da frota");
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleOfficerLookupChange = (event) => {
    const value = event.target.value;
    setOfficerLookup(value);
    setToPoliceOfficerId("");
  };

  const handleOfficerSearch = () => {
    const matchedOfficer = findOfficerByLookup(
      availablePoliceOfficers,
      officerLookup
    );

    if (!matchedOfficer) {
      setError("Policial não encontrado para a unidade selecionada.");
      setToPoliceOfficerId("");
      return;
    }

    setOfficerLookup(buildOfficerOptionLabel(matchedOfficer));
    setToPoliceOfficerId(String(matchedOfficer.id));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await moveFleetVehicle(vehicleId, {
        movement_type: movementType,
        to_unit_id: toUnitId ? Number(toUnitId) : null,
        to_police_officer_id: toPoliceOfficerId ? Number(toPoliceOfficerId) : null,
        details: details || null,
      });
      onBack();
    } catch (submitError) {
      setError(submitError.message || "Erro ao movimentar registro da frota");
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          Carregando registro da frota e preparando a movimentação...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Movimentar registro da frota</h1>
        <p style={styles.subtitle}>
          A origem fica travada e você altera apenas o destino e o policial responsável.
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
          Use esta tela para transferir a unidade do registro ou atualizar o policial responsável.
        </p>

        <div style={styles.infoBox}>
          Use este formulário para atualizar a unidade de destino e, se necessário,
          o policial responsável pelo registro.
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
            <div style={styles.label}>Registro atual</div>
            <div style={{ marginTop: "8px", fontWeight: 700 }}>
              {`${vehicle?.brand || ""} ${vehicle?.model || ""}`.trim() || "Frota"}
            </div>
            <div
              style={{
                marginTop: "6px",
                color: "var(--app-text-muted)",
                fontSize: "0.92rem",
              }}
            >
              Prefixo: {vehicle?.prefix || "Não informado"}
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
              {vehicle?.unit_label || vehicle?.unit_name || "-"}
            </div>
            <div
              style={{
                marginTop: "6px",
                color: "var(--app-text-muted)",
                fontSize: "0.92rem",
              }}
            >
              Policial: {buildOfficerSummary(vehicle)}
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
            <div
              style={{
                marginTop: "6px",
                color: "var(--app-text-muted)",
                fontSize: "0.92rem",
              }}
            >
              Policial: {buildOfficerSummary(selectedOfficer)}
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
            <input
              type="text"
              value={vehicle?.unit_label || vehicle?.unit_name || ""}
              style={styles.input}
              disabled
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Policial de origem</label>
            <input
              type="text"
              value={vehicle?.police_officer_re ? buildOfficerSummary(vehicle) : ""}
              style={styles.input}
              disabled
            />
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

          <div style={styles.fieldFull}>
            <label style={styles.label}>Policial destino</label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                value={officerLookup}
                onChange={handleOfficerLookupChange}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleOfficerSearch();
                  }
                }}
                list="fleet-move-officers"
                placeholder="Digite o RE do policial responsável"
                style={{ ...styles.input, flex: 1 }}
              />
              <button
                type="button"
                onClick={handleOfficerSearch}
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                Pesquisar
              </button>
            </div>
            <datalist id="fleet-move-officers">
              {availablePoliceOfficers.map((officer) => (
                <option key={officer.id} value={buildOfficerOptionLabel(officer)} />
              ))}
            </datalist>
            <small style={{ color: "var(--app-text-muted)", fontSize: "0.88rem" }}>
              {selectedOfficer
                ? `Policial selecionado: ${buildOfficerSummary(selectedOfficer)}`
                : "Pesquise por RE ou nome para definir o policial de destino."}
            </small>
          </div>

          <div style={styles.fieldFull}>
            <label style={styles.label}>Detalhes</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              style={styles.textarea}
            />
          </div>
        </div>

        <div style={styles.footerActions}>
          <button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>
            Salvar movimentação
          </button>
        </div>
      </form>
    </div>
  );
}

export default FleetVehicleMove;
