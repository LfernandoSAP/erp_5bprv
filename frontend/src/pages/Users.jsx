import { useCallback, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import ReportExportButtons from "../components/ReportExportButtons";
import SearchInputAction from "../components/SearchInputAction";
import { apiFetch } from "../services/api";
import { getSectors, getUnits } from "../services/referenceDataService";
import { buildModuleAccessOptions } from "../utils/moduleAccessOptions";
import { buildReportSubtitle } from "../utils/reportContext";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";
import { buildSectorLabelMap } from "../utils/sectorOptions";
import { buildHierarchicalUnitLabelMap } from "../utils/unitOptions";
import { maskCpf } from "./policeOfficerRegistrationUtils";

const roleMap = {
  ADMIN_GLOBAL: "Administrador global",
  ADMIN_UNIDADE: "Administrador da unidade",
  OPERADOR: "Operador",
  CONSULTA: "Consulta",
};

function Users({ onBack, onNewUser, onEditUser }) {
  const [users, setUsers] = useState([]);
  const [unitMap, setUnitMap] = useState({});
  const [sectorMap, setSectorMap] = useState({});
  const [moduleLabelMap, setModuleLabelMap] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUsers = async (term = "") => {
    const query = term.trim() ? `?q=${encodeURIComponent(term.trim())}` : "";

    try {
      setError("");
      const data = await apiFetch(`/telematica/users/${query}`);
      setUsers(data);
      setShowTable(true);
    } catch (fetchError) {
      setError(fetchError.message || "Erro ao consultar usuários");
    }
  };

  const loadUnits = async () => {
    try {
      const data = await getUnits({ activeOnly: false });
      setUnitMap(buildHierarchicalUnitLabelMap(data));
    } catch (fetchError) {
      setError(fetchError.message || "Erro ao carregar unidades");
    }
  };

  const loadSectors = async () => {
    try {
      const data = await getSectors({ activeOnly: false });
      setSectorMap(buildSectorLabelMap(data));

      const groupedLabels = {};
      const unitIds = [...new Set(data.map((sector) => sector.unit_id))];
      unitIds.forEach((unitId) => {
        buildModuleAccessOptions(data, unitId).forEach((option) => {
          groupedLabels[`${unitId}:${option.code}`] = option.label;
        });
      });

      setModuleLabelMap(groupedLabels);
    } catch (fetchError) {
      setError(fetchError.message || "Erro ao carregar setores");
    }
  };

  const formatModuleAccessList = useCallback(
    (user) => {
      if (!user.module_access_codes || user.module_access_codes.length === 0) {
        return "-";
      }

      return user.module_access_codes
        .map((code) => moduleLabelMap[`${user.unit_id}:${code}`] || code)
        .join(", ");
    },
    [moduleLabelMap]
  );

  const reportColumns = useMemo(
    () => [
      { key: "cpf", label: "CPF", width: 16 },
      { key: "name", label: "Nome", width: 24 },
      { key: "re", label: "RE", width: 14 },
      { key: "rank", label: "Posto/Graduação", width: 18 },
      { key: "unit", label: "Unidade", width: 26 },
      { key: "sector", label: "Setor", width: 24 },
      { key: "modules", label: "Módulos", width: 30 },
      { key: "role", label: "Perfil", width: 18 },
      { key: "status", label: "Status", width: 12 },
    ],
    []
  );

  const reportRows = useMemo(
    () =>
      users.map((user) => ({
        cpf: maskCpf(user.cpf || "") || "-",
        name: user.name,
        re: user.re || "-",
        rank: user.rank || "-",
        unit: unitMap[user.unit_id] ?? user.unit_id,
        sector: sectorMap[user.sector_id] ?? "-",
        modules: formatModuleAccessList(user),
        role: roleMap[user.role_code] ?? user.role_code ?? "-",
        status: user.is_active ? "Ativo" : "Inativo",
      })),
    [formatModuleAccessList, sectorMap, unitMap, users]
  );

  const reportSubtitle = useMemo(
    () =>
      buildReportSubtitle({
        totalRows: reportRows.length,
        searchTerm,
      }),
    [reportRows.length, searchTerm]
  );

  const activeUsersCount = useMemo(
    () => users.filter((user) => user.is_active).length,
    [users]
  );
  const inactiveUsersCount = users.length - activeUsersCount;

  const handleConsultUsers = async () => {
    await loadUnits();
    await loadSectors();
    setShowSearchBox(true);
    setShowTable(false);
    setUsers([]);
    setSelectedUser(null);
  };

  const handleSearchUsers = async () => {
    await loadUsers(searchTerm);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
  };

  const handleCloseUserDetails = () => {
    setSelectedUser(null);
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm("Deseja excluir este usuário?");
    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/telematica/users/${userId}`, { method: "DELETE" });
      setSuccess("Usuário inativado com sucesso.");
      await loadUsers(searchTerm);
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
    } catch (fetchError) {
      setError(fetchError.message || "Erro ao inativar usuário");
    }
  };

  const handleRestoreUser = async (userId) => {
    const confirmed = window.confirm("Deseja reativar este usuário?");
    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/telematica/users/${userId}/restore`, { method: "PUT" });
      setSuccess("Usuário reativado com sucesso.");
      await loadUsers(searchTerm);
    } catch (fetchError) {
      setError(fetchError.message || "Erro ao reativar usuário");
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Usuários</h1>
        <p style={styles.subtitle}>
          Gerencie o acesso ao sistema com um fluxo simples: volte ao painel,
          cadastre um novo usuário ou consulte usuários por CPF ou nome.
        </p>

        <div style={styles.actions}>
          <button type="button" onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>

          <button type="button" onClick={onNewUser} style={{ ...styles.button, ...styles.primaryButton }}>
            Novo usuário
          </button>

          <button
            type="button"
            onClick={handleConsultUsers}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            Consultar usuários
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      {showSearchBox && (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Pesquisa de usuários</h2>
          <p style={styles.sectionText}>
            Informe o CPF ou o nome do usuário para pesquisar.
          </p>

          <div style={styles.actions}>
            <SearchInputAction
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onSearch={handleSearchUsers}
              placeholder="Digite o CPF ou o nome"
              style={styles.actionFieldWide}
              buttonStyle={styles.primaryButton}
            />
          </div>
        </section>
      )}

      {showTable && (
        <section style={{ ...styles.tableCard, marginTop: "24px" }}>
          {selectedUser && (
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
                  <h2 style={styles.sectionTitle}>Detalhes do usuário</h2>
                  <p style={styles.sectionText}>
                    Consulte os dados cadastrais e os acessos do usuário selecionado.
                  </p>
                </div>
                <div style={styles.tableHeaderActions}>
                  <button
                    type="button"
                    onClick={handleCloseUserDetails}
                    style={{ ...styles.button, ...styles.secondaryButton }}
                  >
                    ← Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditUser(selectedUser.id)}
                    style={{ ...styles.button, ...styles.primaryButton }}
                  >
                    ✏ Editar
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gap: "16px" }}>
                <UsersDetailSection
                  title="Identificação"
                  fields={[
                    ["CPF", maskCpf(selectedUser.cpf || "") || "-"],
                    ["Nome", selectedUser.name || "-"],
                    ["RE", selectedUser.re || "-"],
                    ["Posto/Graduação", selectedUser.rank || "-"],
                    ["Unidade", unitMap[selectedUser.unit_id] ?? selectedUser.unit_id],
                    ["Setor", sectorMap[selectedUser.sector_id] ?? "-"],
                  ]}
                />
                <UsersDetailSection
                  title="Acesso"
                  fields={[
                    ["Perfil", roleMap[selectedUser.role_code] ?? selectedUser.role_code ?? "-"],
                    ["Módulos", formatModuleAccessList(selectedUser)],
                    ["Status", selectedUser.is_active ? "Ativo" : "Inativo"],
                  ]}
                />
              </div>

              <div style={{ ...styles.actions, marginTop: "18px" }}>
                {selectedUser.is_active ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    style={{ ...styles.button, ...styles.dangerButton }}
                  >
                    Inativar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRestoreUser(selectedUser.id)}
                    style={{ ...styles.button, ...styles.primaryButton }}
                  >
                    Reativar
                  </button>
                )}
              </div>
            </section>
          )}

          <div style={styles.tableHeader}>
            <div>
              <h2 style={styles.tableTitle}>Consulta de usuários</h2>
              <p style={styles.tableMeta}>{users.length} registro(s) encontrado(s)</p>
            </div>
            <ReportExportButtons
              disabled={reportRows.length === 0}
              onExportExcel={() =>
                exportExcelReport({
                  fileBaseName: "usuarios",
                  sheetName: "Usuários",
                  title: "Relatório de usuários",
                  subtitle: reportSubtitle,
                  columns: reportColumns,
                  rows: reportRows,
                })
              }
              onExportPdf={() =>
                exportPdfReport({
                  fileBaseName: "usuarios",
                  title: "Relatório de usuários",
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
                <p style={styles.summaryLabel}>Registros</p>
                <p style={styles.summaryValue}>{users.length}</p>
              </div>
              <div style={styles.summaryCard}>
                <p style={styles.summaryLabel}>Usuários ativos</p>
                <p style={styles.summaryValue}>{activeUsersCount}</p>
              </div>
              <div style={styles.summaryCard}>
                <p style={styles.summaryLabel}>Usuários inativos</p>
                <p style={styles.summaryValue}>{inactiveUsersCount}</p>
              </div>
            </div>
          </div>

          <div className="desktop-table-view" style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: "60px", whiteSpace: "nowrap" }}>Ver</th>
                  <th style={{ ...styles.th, width: "180px", whiteSpace: "nowrap" }}>CPF</th>
                  <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>Nome</th>
                  <th style={{ ...styles.th, width: "110px", whiteSpace: "nowrap" }}>RE</th>
                  <th style={{ ...styles.th, width: "220px", whiteSpace: "nowrap" }}>Unidade</th>
                  <th style={{ ...styles.th, width: "160px", whiteSpace: "nowrap" }}>Perfil</th>
                  <th style={{ ...styles.th, width: "110px", whiteSpace: "nowrap" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    style={
                      index % 2 === 1
                        ? { backgroundColor: "var(--app-surface-muted)" }
                        : undefined
                    }
                  >
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        onClick={() => handleViewUser(user)}
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
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {maskCpf(user.cpf || "") || "-"}
                    </td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {user.name}
                    </td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {user.re || "-"}
                    </td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {unitMap[user.unit_id] ?? user.unit_id}
                    </td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(user.role_code?.includes("ADMIN")
                            ? styles.infoBadge
                            : styles.neutralBadge),
                        }}
                      >
                        {roleMap[user.role_code] ?? user.role_code ?? "-"}
                      </span>
                    </td>
                    <td style={{ ...styles.td, padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(user.is_active ? styles.activeBadge : styles.inactiveBadge),
                        }}
                      >
                        {user.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div style={styles.emptyState}>
                Nenhum usuário encontrado para o filtro informado.
              </div>
            )}
          </div>

          {users.length > 0 && (
            <div className="mobile-card-view" style={styles.mobileCards}>
              {users.map((user) => (
                <article key={user.id} style={styles.mobileCard}>
                  <div style={styles.mobileCardHeader}>
                    <div>
                      <h3 style={styles.mobileCardTitle}>{user.name}</h3>
                      <p style={styles.mobileCardMeta}>{maskCpf(user.cpf || "") || "-"}</p>
                    </div>
                    <span
                      style={{
                        ...styles.badge,
                        ...(user.is_active ? styles.activeBadge : styles.inactiveBadge),
                      }}
                    >
                      {user.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div style={styles.mobileCardGrid}>
                    <div style={styles.mobileCardRow}>
                      <p style={styles.mobileCardLabel}>RE</p>
                      <p style={styles.mobileCardValue}>{user.re || "-"}</p>
                    </div>
                    <div style={styles.mobileCardRow}>
                      <p style={styles.mobileCardLabel}>Posto/Graduação</p>
                      <p style={styles.mobileCardValue}>{user.rank || "-"}</p>
                    </div>
                    <div style={styles.mobileCardRow}>
                      <p style={styles.mobileCardLabel}>Unidade</p>
                      <p style={styles.mobileCardValue}>{unitMap[user.unit_id] ?? user.unit_id}</p>
                    </div>
                    <div style={styles.mobileCardRow}>
                      <p style={styles.mobileCardLabel}>Setor</p>
                      <p style={styles.mobileCardValue}>{sectorMap[user.sector_id] ?? "-"}</p>
                    </div>
                    <div style={styles.mobileCardRow}>
                      <p style={styles.mobileCardLabel}>Perfil</p>
                      <p style={styles.mobileCardValue}>
                        {roleMap[user.role_code] ?? user.role_code ?? "-"}
                      </p>
                    </div>
                    <div style={styles.mobileCardRow}>
                      <p style={styles.mobileCardLabel}>Módulos</p>
                      <p style={styles.mobileCardValue}>{formatModuleAccessList(user)}</p>
                    </div>
                  </div>

                  <div style={styles.mobileCardActions}>
                    <button
                      type="button"
                      onClick={() => handleViewUser(user)}
                      style={{
                        ...styles.button,
                        ...styles.secondaryButton,
                        ...styles.tableActionButton,
                      }}
                    >
                      Ver
                    </button>
                    {user.is_active ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditUser(user.id)}
                          style={{
                            ...styles.button,
                            ...styles.secondaryButton,
                            ...styles.tableActionButton,
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.id)}
                          style={{
                            ...styles.button,
                            ...styles.dangerButton,
                            ...styles.tableActionButton,
                          }}
                        >
                          Excluir
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRestoreUser(user.id)}
                        style={{
                          ...styles.button,
                          ...styles.primaryButton,
                          ...styles.tableActionButton,
                        }}
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
      )}
    </div>
  );
}

function UsersDetailSection({ title, fields }) {
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

export default Users;
