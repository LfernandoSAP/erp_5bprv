import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import { apiFetch } from "../services/api";
import { getSectors, getUnits } from "../services/referenceDataService";
import {
  PASSWORD_POLICY_MESSAGE,
  validateStrongPassword,
} from "../utils/passwordPolicy";
import { buildModuleAccessOptions } from "../utils/moduleAccessOptions";
import { buildHierarchicalUnitOptions } from "../utils/unitOptions";
import { formatSectorLabel } from "../utils/sectorOptions";
import { getCpfInputProps, maskCpf } from "./policeOfficerRegistrationUtils";

const ROLE_OPTIONS = [
  { value: "ADMIN_GLOBAL", label: "Administrador global" },
  { value: "ADMIN_UNIDADE", label: "Administrador da unidade" },
  { value: "OPERADOR", label: "Operador" },
  { value: "CONSULTA", label: "Consulta" },
];

function NewUser({ onBack }) {
  const cpfInputProps = getCpfInputProps();
  const [cpf, setCpf] = useState("");
  const [name, setName] = useState("");
  const [re, setRe] = useState("");
  const [rank, setRank] = useState("");
  const [unitId, setUnitId] = useState("");
  const [units, setUnits] = useState([]);
  const [sectorId, setSectorId] = useState("");
  const [sectors, setSectors] = useState([]);
  const [moduleAccessCodes, setModuleAccessCodes] = useState([]);
  const [password, setPassword] = useState("");
  const [roleCode, setRoleCode] = useState("OPERADOR");
  const [error, setError] = useState("");

  async function loadUnits() {
    try {
      setUnits(await getUnits());
    } catch (currentError) {
      setError(currentError.message || "Erro ao carregar unidades");
    }
  }

  async function loadSectors() {
    try {
      setSectors(await getSectors());
    } catch (currentError) {
      setError(currentError.message || "Erro ao carregar setores");
    }
  }

  useEffect(() => {
    void loadUnits();
    void loadSectors();
  }, []);

  const availableRoleOptions = useMemo(() => {
    if (String(unitId) === "1") {
      return ROLE_OPTIONS;
    }
    return ROLE_OPTIONS.filter((role) => role.value !== "ADMIN_GLOBAL");
  }, [unitId]);

  const availableSectors = useMemo(() => {
    if (!unitId) {
      return [];
    }
    return sectors.filter((sector) => String(sector.unit_id) === String(unitId));
  }, [sectors, unitId]);

  const principalSectorCode = useMemo(() => {
    const selectedSector = availableSectors.find(
      (sector) => String(sector.id) === String(sectorId)
    );
    return selectedSector?.code || null;
  }, [availableSectors, sectorId]);

  const moduleAccessOptions = useMemo(
    () => buildModuleAccessOptions(sectors, unitId),
    [sectors, unitId]
  );

  useEffect(() => {
    if (roleCode === "ADMIN_GLOBAL" && String(unitId) !== "1") {
      setRoleCode("ADMIN_UNIDADE");
    }
  }, [roleCode, unitId]);

  useEffect(() => {
    if (
      sectorId &&
      !availableSectors.some((sector) => String(sector.id) === String(sectorId))
    ) {
      setSectorId("");
    }
  }, [availableSectors, sectorId]);

  useEffect(() => {
    setModuleAccessCodes((current) =>
      current.filter((code) => moduleAccessOptions.some((option) => option.code === code))
    );
  }, [moduleAccessOptions]);

  useEffect(() => {
    if (!principalSectorCode) {
      return;
    }

    setModuleAccessCodes((current) =>
      current.includes(principalSectorCode) ? current : [...current, principalSectorCode]
    );
  }, [principalSectorCode]);

  const unitOptions = useMemo(() => buildHierarchicalUnitOptions(units), [units]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const normalizedCpf = cpf.replace(/\D/g, "");
    if (normalizedCpf.length !== 11) {
      setError("CPF deve conter exatamente 11 dígitos.");
      return;
    }

    const passwordError = validateStrongPassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      await apiFetch("/telematica/users/", {
        method: "POST",
        body: JSON.stringify({
          cpf: normalizedCpf,
          name,
          re,
          rank,
          unit_id: Number(unitId),
          sector_id: sectorId ? Number(sectorId) : null,
          module_access_codes: moduleAccessCodes,
          role_code: roleCode,
          password,
          is_admin: roleCode === "ADMIN_GLOBAL" || roleCode === "ADMIN_UNIDADE",
          is_active: true,
        }),
      });
      onBack();
    } catch (currentError) {
      setError(currentError.message || "Erro ao cadastrar usuário");
    }
  };

  const handleToggleModuleAccess = (moduleCode) => {
    if (moduleCode === principalSectorCode) {
      return;
    }

    setModuleAccessCodes((current) =>
      current.includes(moduleCode)
        ? current.filter((code) => code !== moduleCode)
        : [...current, moduleCode]
    );
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Novo usuário</h1>
        <p style={styles.subtitle}>
          Cadastre um novo usuário vinculando-o à unidade, ao setor e ao perfil corretos.
        </p>

        <div style={styles.actions}>
          <button type="button" onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.sectionTitle}>Dados do usuário</h2>
        <p style={styles.sectionText}>
          Preencha as informações básicas de identificação, unidade, setor e perfil.
        </p>

        <div style={styles.infoBox}>
          O perfil controla o alcance operacional do usuário. Para unidades subordinadas,
          o perfil global não fica disponível.
        </div>

        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>CPF</label>
            <input
              type="text"
              value={cpf}
              onChange={(event) => setCpf(maskCpf(event.target.value))}
              inputMode={cpfInputProps.inputMode}
              maxLength={cpfInputProps.maxLength}
              placeholder={cpfInputProps.placeholder}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Nome</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>RE</label>
            <input
              type="text"
              value={re}
              onChange={(event) => setRe(event.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Posto/Graduação</label>
            <select
              value={rank}
              onChange={(event) => setRank(event.target.value)}
              required
              style={styles.input}
            >
              <option value="">Selecione</option>
              <option value="Cel PM">Cel PM</option>
              <option value="Ten Cel PM">Ten Cel PM</option>
              <option value="Maj PM">Maj PM</option>
              <option value="Cap PM">Cap PM</option>
              <option value="Ten PM">Ten PM</option>
              <option value="Sgt PM">Sgt PM</option>
              <option value="Cb PM">Cb PM</option>
              <option value="Sd PM">Sd PM</option>
              <option value="Civil">Civil</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Unidade</label>
            <select
              value={unitId}
              onChange={(event) => setUnitId(event.target.value)}
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
            <label style={styles.label}>Setor</label>
            <select
              value={sectorId}
              onChange={(event) => setSectorId(event.target.value)}
              style={styles.input}
              disabled={!unitId}
            >
              <option value="">Selecione</option>
              {availableSectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {formatSectorLabel(sector)}
                </option>
              ))}
            </select>
            <small style={styles.helperText}>
              O setor é opcional, mas ajuda a organizar acessos e responsabilidades.
            </small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Perfil</label>
            <select
              value={roleCode}
              onChange={(event) => setRoleCode(event.target.value)}
              required
              style={styles.input}
            >
              {availableRoleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.fieldFull}>
            <label style={styles.label}>Acessos por módulo</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "10px",
                marginTop: "8px",
              }}
            >
              {moduleAccessOptions.map((option) => (
                <label
                  key={option.code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    border: "1px solid var(--app-border)",
                    backgroundColor: "var(--app-surface-muted)",
                    cursor: option.code === principalSectorCode ? "default" : "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={moduleAccessCodes.includes(option.code)}
                    onChange={() => handleToggleModuleAccess(option.code)}
                    disabled={option.code === principalSectorCode}
                  />
                  <span>
                    {option.label}
                    {option.code === principalSectorCode ? " (setor principal)" : ""}
                  </span>
                </label>
              ))}
            </div>
            <small style={styles.helperText}>
              O setor principal continua sendo a lotação do usuário e fica sempre ativo.
              Aqui você libera apenas módulos adicionais.
            </small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              style={styles.input}
            />
            <small style={styles.helperText}>{PASSWORD_POLICY_MESSAGE}</small>
          </div>
        </div>

        <div style={styles.footerActions}>
          <button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>
            Salvar usuário
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewUser;
