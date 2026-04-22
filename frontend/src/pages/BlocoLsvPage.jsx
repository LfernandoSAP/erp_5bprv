import { useEffect, useMemo, useState } from "react";

import ReportExportButtons from "../components/ReportExportButtons";
import { appShellStyles as styles } from "../components/appShellStyles";
import { getPoliceOfficers } from "../services/policeOfficerService";
import {
  createLsvRegistro,
  deleteLsvRegistro,
  getLsvRegistroById,
  getLsvRegistros,
  updateLsvRegistro,
} from "../services/lsvService";
import { exportExcelReport, exportPdfReport } from "../utils/reportExport";

const SUMMARY_COLUMNS = [
  { key: "re_dc", label: "RE", width: 14 },
  { key: "nome", label: "NOME", width: 28 },
  { key: "quadro", label: "QUADRO", width: 12 },
  { key: "total_blocos", label: "Nº LSV", width: 12 },
  { key: "ultimo_bol_g", label: "ÚLTIMO DOE/CONCESSÃO", width: 22 },
  { key: "ultimo_inicio", label: "ÚLTIMO INÍCIO", width: 18 },
  { key: "status", label: "STATUS", width: 10 },
];

function createEmptyLsv(id) {
  return {
    id,
    numero_bloco: id,
    doe_concessao: "",
    data_inicio_fruicao: "",
    doe_fruicao: "",
  };
}

function normalizeLsv(lsv, index) {
  return {
    id: lsv.id || index + 1,
    numero_bloco: index + 1,
    doe_concessao: lsv.doe_concessao || "",
    data_inicio_fruicao: lsv.data_inicio_fruicao || "",
    doe_fruicao: lsv.doe_fruicao || "",
  };
}

function formatDateInput(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function displayCellValue(value) {
  return value ? String(value) : "**";
}

function getLsvLabel(numero) {
  return `${numero}ª LSV`;
}

function LsvTable({ lsv }) {
  return (
    <table style={{ ...styles.table, minWidth: "760px" }}>
      <thead>
        <tr>
          <th style={{ ...styles.th, backgroundColor: "#fde047", color: "#111827" }}>LSV</th>
          <th style={{ ...styles.th, backgroundColor: "#fde047", color: "#111827" }}>DOE/Concessão</th>
          <th style={{ ...styles.th, backgroundColor: "#fde047", color: "#111827" }}>Data de início da fruição</th>
          <th style={{ ...styles.th, backgroundColor: "#fde047", color: "#111827" }}>DOE/Fruição</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ ...styles.td, backgroundColor: "#dc2626", color: "#fff", fontWeight: 800 }}>
            {getLsvLabel(lsv.numero_bloco)}
          </td>
          <td style={styles.td}>{displayCellValue(lsv.doe_concessao)}</td>
          <td style={styles.td}>{displayCellValue(lsv.data_inicio_fruicao)}</td>
          <td style={styles.td}>{displayCellValue(lsv.doe_fruicao)}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default function BlocoLsvPage({ onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState("list");
  const [editingId, setEditingId] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [selectedRegistro, setSelectedRegistro] = useState(null);
  const [officerSearch, setOfficerSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingOfficer, setSearchingOfficer] = useState(false);
  const [lsvs, setLsvs] = useState([createEmptyLsv(1)]);

  useEffect(() => {
    void loadItems();
  }, []);

  const visibleItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.trim().toLowerCase();
    return items.filter((item) => `${item.re_dc} ${item.nome}`.toLowerCase().includes(term));
  }, [items, searchTerm]);

  async function loadItems() {
    try {
      setLoading(true);
      setError("");
      const data = await getLsvRegistros();
      setItems(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setItems([]);
      setError(loadError.message || "Erro ao carregar os registros de LSV.");
    } finally {
      setLoading(false);
    }
  }

  function resetFlow() {
    setMode("list");
    setEditingId(null);
    setSelectedOfficer(null);
    setSelectedRegistro(null);
    setOfficerSearch("");
    setSearchResults([]);
    setLsvs([createEmptyLsv(1)]);
  }

  async function handleSearchOfficer() {
    const term = officerSearch.trim();
    if (term.length < 2) {
      setError("Digite pelo menos 2 caracteres para buscar.");
      setSearchResults([]);
      return;
    }
    try {
      setSearchingOfficer(true);
      setError("");
      const officers = await getPoliceOfficers(term, null, { includeInactive: true });
      if (Array.isArray(officers) && officers.length > 0) {
        setSearchResults(officers.slice(0, 20));
      } else {
        setSearchResults([]);
        setError("Nenhum policial encontrado.");
      }
    } catch (fetchError) {
      setSearchResults([]);
      setError(fetchError.message || "Erro ao buscar policial.");
    } finally {
      setSearchingOfficer(false);
    }
  }

  function handleSelectOfficer(officer) {
    setSelectedOfficer({
      id: officer.id,
      re_dc: officer.re_with_digit,
      nome: officer.full_name,
      posto_graduacao: officer.rank || "-",
      unidade: officer.unit_label || "-",
    });
    setOfficerSearch("");
    setSearchResults([]);
    setMode("create-form");
  }

  function addLsv() {
    setLsvs((current) => [...current, createEmptyLsv(current.length + 1)]);
  }

  function removeLsv(index) {
    setLsvs((current) =>
      current
        .filter((_, currentIndex) => currentIndex !== index)
        .map((lsv, currentIndex) => ({ ...lsv, id: currentIndex + 1, numero_bloco: currentIndex + 1 }))
    );
  }

  function updateLsv(index, field, value) {
    setLsvs((current) =>
      current.map((lsv, currentIndex) =>
        currentIndex !== index
          ? lsv
          : { ...lsv, [field]: field === "data_inicio_fruicao" ? formatDateInput(value) : value }
      )
    );
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!selectedOfficer) {
      setError("Selecione um policial antes de continuar.");
      return;
    }
    if (lsvs.some((lsv) => !lsv.doe_concessao.trim())) {
      setError("Preencha o DOE/Concessão em todas as LSV.");
      return;
    }

    try {
      const payload = {
        police_officer_id: selectedOfficer.id,
        re_dc: selectedOfficer.re_dc,
        nome: selectedOfficer.nome,
        posto_graduacao: selectedOfficer.posto_graduacao,
        unidade: selectedOfficer.unidade,
        blocos: lsvs.map((lsv, index) => ({
          numero_bloco: index + 1,
          doe_concessao: lsv.doe_concessao,
          data_inicio_fruicao: lsv.data_inicio_fruicao || null,
          doe_fruicao: lsv.doe_fruicao || null,
        })),
      };

      if (editingId) {
        await updateLsvRegistro(editingId, { blocos: payload.blocos });
        setSuccess("LSV atualizada com sucesso.");
      } else {
        await createLsvRegistro(payload);
        setSuccess("LSV cadastrada com sucesso.");
      }

      resetFlow();
      await loadItems();
    } catch (saveError) {
      setError(saveError.message || "Erro ao salvar o LSV.");
    }
  }

  async function handleView(item) {
    try {
      setSelectedRegistro(await getLsvRegistroById(item.id));
      setMode("view");
    } catch (detailError) {
      setError(detailError.message || "Erro ao carregar o LSV.");
    }
  }

  async function handleEdit(item) {
    try {
      const details = await getLsvRegistroById(item.id);
      setEditingId(details.id);
      setSelectedOfficer({
        id: details.police_officer_id,
        re_dc: details.re_dc,
        nome: details.nome,
        posto_graduacao: details.posto_graduacao || "-",
        unidade: details.unidade || "-",
      });
      setOfficerSearch(details.re_dc);
      setLsvs(details.blocos.length ? details.blocos.map((lsv, index) => normalizeLsv(lsv, index)) : [createEmptyLsv(1)]);
      setMode("create-form");
    } catch (editError) {
      setError(editError.message || "Erro ao editar o LSV.");
    }
  }

  async function handleDelete(item) {
    try {
      await deleteLsvRegistro(item.id);
      setSuccess("Registro de LSV excluído.");
      await loadItems();
      if (selectedRegistro?.id === item.id) {
        setSelectedRegistro(null);
        setMode("list");
      }
    } catch (deleteError) {
      setError(deleteError.message || "Erro ao excluir o LSV.");
    }
  }

  function exportRegistroExcel(registro) {
    const rows = registro.blocos.map((lsv) => ({
      lsv: getLsvLabel(lsv.numero_bloco),
      doe_concessao: lsv.doe_concessao || "**",
      data_inicio_fruicao: lsv.data_inicio_fruicao || "**",
      doe_fruicao: lsv.doe_fruicao || "**",
    }));

    exportExcelReport({
      fileBaseName: `lsv_${registro.re_dc}`,
      sheetName: "LSV",
      title: "LSV",
      subtitle: `${registro.nome} · ${registro.re_dc}`,
      columns: [
        { key: "lsv", label: "LSV", width: 14 },
        { key: "doe_concessao", label: "DOE/Concessão", width: 20 },
        { key: "data_inicio_fruicao", label: "Data de início da fruição", width: 22 },
        { key: "doe_fruicao", label: "DOE/Fruição", width: 18 },
      ],
      rows,
    });
  }

  function exportRegistroPdf(registro) {
    const rows = registro.blocos.map((lsv) => ({
      lsv: getLsvLabel(lsv.numero_bloco),
      doe_concessao: lsv.doe_concessao || "**",
      data_inicio_fruicao: lsv.data_inicio_fruicao || "**",
      doe_fruicao: lsv.doe_fruicao || "**",
    }));

    exportPdfReport({
      fileBaseName: `lsv_${registro.re_dc}`,
      title: "LSV",
      subtitle: `${registro.nome} · ${registro.re_dc}`,
      columns: [
        { key: "lsv", label: "LSV" },
        { key: "doe_concessao", label: "DOE/Concessão" },
        { key: "data_inicio_fruicao", label: "Data de início da fruição" },
        { key: "doe_fruicao", label: "DOE/Fruição" },
      ],
      rows,
      orientation: "landscape",
    });
  }

  function printRegistro(registro) {
    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) return;

    const sections = registro.blocos
      .map(
        (lsv) =>
          `<div style="margin-top:18px"><h2 style="font-size:16px">${getLsvLabel(lsv.numero_bloco)}</h2><table style="width:100%;border-collapse:collapse"><thead><tr><th>LSV</th><th>DOE/Concessão</th><th>Data de início da fruição</th><th>DOE/Fruição</th></tr></thead><tbody><tr><td class="bol">${getLsvLabel(lsv.numero_bloco)}</td><td>${lsv.doe_concessao || "**"}</td><td>${lsv.data_inicio_fruicao || "**"}</td><td>${lsv.doe_fruicao || "**"}</td></tr></tbody></table></div>`
      )
      .join("");

    printWindow.document.write(
      `<html><head><title>LSV</title><style>body{font-family:Arial,sans-serif;padding:24px}h1{text-align:center;font-size:20px}th,td{border:1px solid #111;padding:8px;text-align:center}th{background:#fde047}.bol{background:#dc2626;color:#fff;font-weight:bold}</style></head><body><h1>LSV</h1><p><strong>Nome:</strong> ${registro.nome} | <strong>RE:</strong> ${registro.re_dc} | <strong>Posto/Grad.:</strong> ${registro.posto_graduacao || "-"} | <strong>Unidade:</strong> ${registro.unidade || "-"}</p>${sections}</body></html>`
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>LSV</h1>
        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>Voltar</button>
          <button
            onClick={() => {
              setError("");
              setSuccess("");
              setMode("create-search");
              setEditingId(null);
              setSelectedOfficer(null);
              setLsvs([createEmptyLsv(1)]);
            }}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            + Criar LSV
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      {mode === "create-search" && (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Pesquisar Policial</h2>
          <div style={styles.actions}>
            <input
              value={officerSearch}
              onChange={(event) => {
                setSelectedOfficer(null);
                setOfficerSearch(event.target.value);
                setSearchResults([]);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSearchOfficer();
                }
              }}
              placeholder="Digite parte do RE ou nome"
              style={{ ...styles.input, ...styles.actionFieldWide }}
            />
            <button type="button" onClick={() => void handleSearchOfficer()} style={{ ...styles.button, ...styles.primaryButton }}>
              Pesquisar
            </button>
          </div>
          {searchingOfficer ? <div style={{ ...styles.emptyState, marginTop: "16px" }}>Buscando policiais...</div> : null}
          {searchResults.length > 0 && (
            <div style={{ ...styles.tableWrap, overflowX: "auto", marginTop: "16px" }}>
              <table style={{ ...styles.table, minWidth: "880px" }}>
                <thead>
                  <tr>
                    <th style={styles.th}>RE-DC</th>
                    <th style={styles.th}>NOME COMPLETO</th>
                    <th style={styles.th}>POSTO/GRAD.</th>
                    <th style={styles.th}>UNIDADE</th>
                    <th style={{ ...styles.th, width: "120px" }}>AÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((officer, index) => (
                    <tr key={officer.id} style={index % 2 === 1 ? { backgroundColor: "var(--app-surface-muted)" } : undefined}>
                      <td style={styles.td}>{officer.re_with_digit || "-"}</td>
                      <td style={styles.td}>{officer.full_name || "-"}</td>
                      <td style={styles.td}>{officer.rank || "-"}</td>
                      <td style={styles.td}>{officer.unit_label || "-"}</td>
                      <td style={styles.td}>
                        <button type="button" onClick={() => handleSelectOfficer(officer)} style={{ ...styles.button, ...styles.infoButton, minWidth: "92px" }}>
                          Selecionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {mode === "create-form" && (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>{editingId ? "Editar LSV" : "Criar LSV"}</h2>
          {selectedOfficer && (
            <div style={{ ...styles.card, marginBottom: "16px" }}>
              <div style={styles.formGrid}>
                <div style={styles.field}><span style={styles.label}>Nome Completo</span><div style={styles.input}>{selectedOfficer.nome}</div></div>
                <div style={styles.field}><span style={styles.label}>RE-DC</span><div style={styles.input}>{selectedOfficer.re_dc}</div></div>
                <div style={styles.field}><span style={styles.label}>Posto/Grad.</span><div style={styles.input}>{selectedOfficer.posto_graduacao}</div></div>
                <div style={styles.field}><span style={styles.label}>Unidade</span><div style={styles.input}>{selectedOfficer.unidade}</div></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSave}>
            {lsvs.map((lsv, index) => (
              <section key={`lsv-${lsv.id}`} style={{ ...styles.card, marginBottom: "16px", padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ ...styles.sectionTitle, marginBottom: 0 }}>{getLsvLabel(index + 1)}</h3>
                  {lsvs.length > 1 && <button type="button" onClick={() => removeLsv(index)} style={{ ...styles.button, ...styles.dangerButton }}>✕ Remover</button>}
                </div>
                <div style={styles.formGrid}>
                  <div style={styles.field}><label style={styles.label}>DOE/Concessão *</label><input value={lsv.doe_concessao} onChange={(event) => updateLsv(index, "doe_concessao", event.target.value)} style={styles.input} placeholder="Ex: 059/09" required /></div>
                  <div style={styles.field}><label style={styles.label}>Data de início da fruição</label><input value={lsv.data_inicio_fruicao} onChange={(event) => updateLsv(index, "data_inicio_fruicao", event.target.value)} placeholder="DD/MM/AAAA" style={styles.input} /></div>
                  <div style={styles.field}><label style={styles.label}>DOE/Fruição</label><input value={lsv.doe_fruicao} onChange={(event) => updateLsv(index, "doe_fruicao", event.target.value)} placeholder="Ex: DOE/Fruição" style={styles.input} /></div>
                </div>
                {index === lsvs.length - 1 && lsv.doe_concessao.trim() && <div style={{ ...styles.actions, marginTop: "14px" }}><button type="button" onClick={addLsv} style={{ ...styles.button, ...styles.secondaryButton }}>{`+ Inserir ${getLsvLabel(lsvs.length + 1)}`}</button></div>}
              </section>
            ))}
            <div style={styles.footerActions}><button type="button" onClick={resetFlow} style={{ ...styles.button, ...styles.secondaryButton }}>Cancelar</button><button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>Salvar</button></div>
          </form>
        </section>
      )}

      {mode === "view" && selectedRegistro && (
        <section style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
            <div>
              <h2 style={{ ...styles.sectionTitle, textAlign: "center" }}>LSV</h2>
              <p style={styles.sectionText}>{selectedRegistro.nome} | {selectedRegistro.re_dc} | {selectedRegistro.posto_graduacao || "-"} | {selectedRegistro.unidade || "-"}</p>
            </div>
            <div style={styles.tableHeaderActions}>
              <button type="button" onClick={() => setMode("list")} style={{ ...styles.button, ...styles.secondaryButton }}>← Voltar</button>
              <button type="button" onClick={() => void handleEdit(selectedRegistro)} style={{ ...styles.button, ...styles.primaryButton }}>✏ Editar</button>
              <button type="button" onClick={() => printRegistro(selectedRegistro)} style={{ ...styles.button, ...styles.secondaryButton }}>🖨 Imprimir</button>
              <button type="button" onClick={() => exportRegistroPdf(selectedRegistro)} style={{ ...styles.button, ...styles.secondaryButton }}>⬇ Exportar PDF</button>
              <button type="button" onClick={() => exportRegistroExcel(selectedRegistro)} style={{ ...styles.button, ...styles.secondaryButton }}>⬇ Exportar Excel</button>
            </div>
          </div>
          <div style={{ display: "grid", gap: "16px" }}>
            {selectedRegistro.blocos.map((lsv) => (
              <section key={lsv.id || lsv.numero_bloco} style={{ ...styles.card, padding: "18px" }}>
                <div style={{ marginBottom: "12px" }}>
                  <h3 style={{ ...styles.sectionTitle, marginBottom: "4px" }}>{getLsvLabel(lsv.numero_bloco)}</h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <LsvTable lsv={lsv} />
                </div>
              </section>
            ))}
          </div>
        </section>
      )}

      {mode === "list" && (
        <section style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <div>
              <h2 style={styles.tableTitle}>LSV</h2>
              <p style={styles.tableMeta}>{items.length} registros cadastrados</p>
            </div>
            <ReportExportButtons
              disabled={!visibleItems.length}
              onExportExcel={() => exportExcelReport({ fileBaseName: "lsv", sheetName: "LSV", title: "LSV", subtitle: "Listagem resumida dos registros de LSV", columns: SUMMARY_COLUMNS, rows: visibleItems })}
              onExportPdf={() => exportPdfReport({ fileBaseName: "lsv", title: "LSV", subtitle: "Listagem resumida dos registros de LSV", columns: SUMMARY_COLUMNS, rows: visibleItems, orientation: "landscape" })}
            />
          </div>
          <div style={{ ...styles.card, margin: "16px" }}>
            <div style={styles.actions}>
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Pesquisar por RE ou nome" style={{ ...styles.input, ...styles.actionFieldWide }} />
              <button onClick={() => void loadItems()} style={{ ...styles.button, ...styles.primaryButton }}>Pesquisar</button>
            </div>
          </div>
          <div style={{ ...styles.tableWrap, overflowX: "auto" }}>
            <table style={{ ...styles.table, minWidth: "1260px" }}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: "80px" }}>VER</th>
                  <th style={styles.th}>RE</th>
                  <th style={styles.th}>NOME</th>
                  <th style={styles.th}>QUADRO</th>
                  <th style={styles.th}>Nº LSV</th>
                  <th style={styles.th}>ÚLTIMO DOE/CONCESSÃO</th>
                  <th style={styles.th}>ÚLTIMO INÍCIO</th>
                  <th style={styles.th}>STATUS</th>
                  <th style={styles.th}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item, index) => (
                  <tr key={item.id} style={index % 2 === 1 ? { backgroundColor: "var(--app-surface-muted)" } : undefined}>
                    <td style={styles.td}><button type="button" onClick={() => void handleView(item)} style={{ ...styles.button, ...styles.infoButton, minWidth: "52px", padding: "8px 12px" }}>Ver</button></td>
                    <td style={styles.td}>{item.re_dc}</td>
                    <td style={styles.td}>{item.nome}</td>
                    <td style={styles.td}>{item.quadro || "-"}</td>
                    <td style={styles.td}>{item.total_blocos}</td>
                    <td style={styles.td}>{item.ultimo_bol_g || "-"}</td>
                    <td style={styles.td}>{item.ultimo_inicio || "-"}</td>
                    <td style={styles.td}>{item.status}</td>
                    <td style={styles.td}><div style={styles.tableActionGroup}><button type="button" onClick={() => void handleEdit(item)} style={{ ...styles.button, ...styles.secondaryButton, ...styles.tableActionButton }}>Editar</button><button type="button" onClick={() => void handleDelete(item)} style={{ ...styles.button, ...styles.dangerButton, ...styles.tableActionButton }}>Excluir</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !error && visibleItems.length === 0 ? <div style={styles.emptyState}>Nenhum registro de LSV cadastrado. Clique em [+ Criar LSV] para começar.</div> : null}
            {loading ? <div style={styles.emptyState}>Carregando registros de LSV...</div> : null}
          </div>
        </section>
      )}
    </div>
  );
}
