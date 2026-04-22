import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import { OTHER_UNIT_OPTION } from "../constants/policeOfficerOptions";
import { getUnits } from "../services/referenceDataService";
import { getPoliceOfficer, movePoliceOfficer } from "../services/policeOfficerService";
import { buildHierarchicalUnitOptions } from "../utils/unitOptions";

function MovePoliceOfficer({ officerId, onBack }) {
  const [officer, setOfficer] = useState(null);
  const [units, setUnits] = useState([]);
  const [destination, setDestination] = useState("");
  const [externalUnitName, setExternalUnitName] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");

  async function loadOfficer() {
    try {
      setError("");
      const data = await getPoliceOfficer(officerId);
      setOfficer(data);
      setDestination(data.unit_id ? String(data.unit_id) : "");
      setExternalUnitName(data.external_unit_name || "");
    } catch (currentError) {
      setError(currentError.message || "Erro ao carregar policial");
      onBack();
    }
  }

  async function loadUnits() {
    try {
      setUnits(await getUnits());
    } catch {
      setUnits([]);
    }
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    void loadOfficer();
    void loadUnits();
  }, [officerId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const unitOptions = useMemo(() => buildHierarchicalUnitOptions(units), [units]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const payload =
      destination === OTHER_UNIT_OPTION
        ? { external_unit_name: externalUnitName.trim(), details: details.trim() }
        : { unit_id: Number(destination), external_unit_name: null, details: details.trim() };

    try {
      await movePoliceOfficer(officerId, payload);
      onBack();
    } catch (currentError) {
      setError(currentError.message || "Erro ao movimentar policial");
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Movimentar policial</h1>
        <p style={styles.subtitle}>
          Defina a nova lotação do policial entre as unidades cadastradas ou informe
          uma unidade externa.
        </p>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.infoBox}>
          Registre a nova lotação com uma observação objetiva para facilitar
          auditoria e consulta futura.
        </div>

        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Policial</label>
            <div
              style={{
                ...styles.input,
                minHeight: "46px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {officer ? `${officer.war_name || officer.full_name} - ${officer.re_with_digit}` : "-"}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Origem atual</label>
            <div
              style={{
                ...styles.input,
                minHeight: "46px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {officer?.external_unit_name || officer?.unit_label || "-"}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Destino</label>
            <select
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              required
              style={styles.input}
            >
              <option value="">Selecione</option>
              {unitOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
              <option value={OTHER_UNIT_OPTION}>Outras unidades</option>
            </select>
          </div>

          {destination === OTHER_UNIT_OPTION && (
            <div style={styles.field}>
              <label style={styles.label}>Digite a unidade</label>
              <input
                value={externalUnitName}
                onChange={(event) => setExternalUnitName(event.target.value)}
                required
                style={styles.input}
              />
            </div>
          )}

          <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
            <label style={styles.label}>Observação da movimentação</label>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={4}
              placeholder="Ex.: movimentado para reforço operacional, apresentação em outra unidade, redistribuição interna."
              style={{ ...styles.input, resize: "vertical", minHeight: "110px" }}
            />
          </div>
        </div>

        <div style={styles.footerActions}>
          <button
            type="button"
            onClick={onBack}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Cancelar
          </button>
          <button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>
            Salvar movimentação
          </button>
        </div>
      </form>
    </div>
  );
}

export default MovePoliceOfficer;
