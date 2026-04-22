import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import { apiFetch } from "../services/api";
import { getSectors, getUnits } from "../services/referenceDataService";
import { readViewerAccess as readAuthAccess } from "../utils/authAccess";
import { buildModuleAccessOptions } from "../utils/moduleAccessOptions";
import { buildHierarchicalUnitOptions } from "../utils/unitOptions";
import { formatSectorLabel } from "../utils/sectorOptions";
import { maskCpf } from "./policeOfficerRegistrationUtils";

const ROLE_OPTIONS = [
  { value: "ADMIN_GLOBAL", label: "Administrador global" },
  { value: "ADMIN_UNIDADE", label: "Administrador da unidade" },
  { value: "OPERADOR", label: "Operador" },
  { value: "CONSULTA", label: "Consulta" },
];

function EditUser({ userId, onBack }) {
  const [viewerAccess, setViewerAccess] = useState({
    userId: null,
    canManageUsers: false,
  });
  const [cpf, setCpf] = useState("");
  const [name, setName] = useState("");
  const [re, setRe] = useState("");
  const [rank, setRank] = useState("");
  const [unitId, setUnitId] = useState("");
  const [units, setUnits] = useState([]);
  const [sectorId, setSectorId] = useState("");
  const [sectors, setSectors] = useState([]);
  const [moduleAccessCodes, setModuleAccessCodes] = useState([]);
  const [roleCode, setRoleCode] = useState("OPERADOR");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
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

  async function loadUser() {
    try {
      setError("");
      const data = await apiFetch(`/telematica/users/${userId}`);
      setCpf(maskCpf(data.cpf || ""));
      setName(data.name || "");
      setRe(data.re || "");
      setRank(data.rank || "");
      setUnitId(data.unit_id ? String(data.unit_id) : "");
      setSectorId(data.sector_id ? String(data.sector_id) : "");
      setModuleAccessCodes(data.module_access_codes || []);
      setRoleCode(data.role_code || "OPERADOR");
      setIsActive(Boolean(data.is_active));
    } catch (currentError) {
      setError(currentError.message || "Erro ao carregar usuário");
      onBack();
    }
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const access = readAuthAccess();
    setViewerAccess({
      userId: access.userId,
      canManageUsers: Boolean(
        access.canViewAll ||
          access.isAdmin ||
          access.roleCode === "ADMIN_GLOBAL" ||
          access.roleCode === "ADMIN_UNIDADE"
      ),
    });
    void loadUnits();
    void loadSectors();
    void loadUser();
  }, [userId]);
  /* eslint-enable react-hooks/exhaustive-deps */

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

  const unitOptions = useMemo(() => buildHierarchicalUnitOptions(units), [units]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const payload = {
      name,
      re,
      rank,
    };

    if (viewerAccess.canManageUsers) {
      payload.unit_id = Number(unitId);
      payload.sector_id = sectorId ? Number(sectorId) : null;
      payload.module_access_codes = moduleAccessCodes;
      payload.role_code = roleCode;
      payload.is_admin = roleCode === "ADMIN_GLOBAL" || roleCode === "ADMIN_UNIDADE";
      payload.is_active = isActive;
    }

    if (password.trim()) {
      payload.password = password;
    }

    try {
      await apiFetch(`/telematica/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      onBack();
    } catch (currentError) {
      setError(currentError.message || "Erro ao atualizar usuário");
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
        <h1 style={styles.title}>Editar usuário</h1>
        <p style={styles.subtitle}>
          Atualize os dados do usuário mantendo a unidade, o setor e o perfil
          coerentes com a hierarquia do sistema.
        </p>

        <div style={styles.actions}>
          <button
            type="button"
            onClick={onBack}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Voltar
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.sectionTitle}>Dados do usuário</h2>
        <p style={styles.sectionText}>
          O CPF permanece apenas para consulta. Se quiser trocar a senha, basta
          preencher o campo abaixo.
        </p>

        <div style={styles.infoBox}>
          Revise perfil, unidade e setor com cuidado. Essas informações afetam o
          escopo de acesso e a visibilidade de dados do usuário.
        </div>

        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>CPF</label>
            <input type="text" value={cpf} disabled style={styles.input} />
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
              disabled={!viewerAccess.canManageUsers}
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
              disabled={!unitId || !viewerAccess.canManageUsers}
            >
              <option value="">Selecione</option>
              {availableSectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {formatSectorLabel(sector)}
                </option>
              ))}
            </select>
            <small style={styles.helperText}>
              O setor deve pertencer à unidade selecionada.
            </small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Perfil</label>
            <select
              value={roleCode}
              onChange={(event) => setRoleCode(event.target.value)}
              required
              style={styles.input}
              disabled={!viewerAccess.canManageUsers}
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
                    cursor:
                      viewerAccess.canManageUsers && option.code !== principalSectorCode
                        ? "pointer"
                        : "default",
                    opacity: viewerAccess.canManageUsers ? 1 : 0.75,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={moduleAccessCodes.includes(option.code)}
                    onChange={() => handleToggleModuleAccess(option.code)}
                    disabled={!viewerAccess.canManageUsers || option.code === principalSectorCode}
                  />
                  <span>
                    {option.label}
                    {option.code === principalSectorCode ? " (setor principal)" : ""}
                  </span>
                </label>
              ))}
            </div>
            <small style={styles.helperText}>
              O setor principal define a lotação e permanece sempre ativo. Os
              checkboxes liberam apenas módulos adicionais na mesma unidade.
            </small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Nova senha</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={styles.input}
              placeholder="Preencha apenas se quiser alterar"
            />
            <small style={styles.helperText}>
              Deixe em branco para manter a senha atual.
            </small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Status</label>
            <select
              value={isActive ? "ATIVO" : "INATIVO"}
              onChange={(event) => setIsActive(event.target.value === "ATIVO")}
              style={styles.input}
              disabled={!viewerAccess.canManageUsers}
            >
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
            </select>
          </div>
        </div>

        <div style={styles.footerActions}>
          <button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>
            Salvar alterações
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditUser;
