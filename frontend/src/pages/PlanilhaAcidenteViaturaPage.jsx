import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import ReportExportButtons from "../components/ReportExportButtons";
import {
  atualizarPlanilhaAcidenteViatura,
  buscarPoliciaisAcidenteViatura,
  criarPlanilhaAcidenteViatura,
  excluirPlanilhaAcidenteViatura,
  listarPlanilhaAcidenteViatura,
} from "../services/planilhaAcidenteViaturaService";
import { exportExcelReport } from "../utils/reportExport";

const TEXT = {
  title: "Planilha de Acidentes de Viatura",
  subtitle: "Cadastre e consulte os lan\u00e7amentos do PAAVI com base no RE-DC e nos campos da planilha.",
  systemTitle: "PLANILHA DE ACIDENTE DE VIATURAS",
  systemSubtitle: "Sistem\u00e1tica de Preven\u00e7\u00e3o de Acidentes de Tr\u00e2nsito Envolvendo Policiais Militares",
  note: "Nota de Instru\u00e7\u00e3o n\u00ba PM3-002/02/17, de 01NOV17",
  paavi: "PAAVI",
  paaviSubtitle: "Procedimento de An\u00e1lise de Acidente com Viatura",
  command: "Comando de Policiamento Rodovi\u00e1rio",
  quickSearch: "Busca r\u00e1pida",
  action: "A\u00e7\u00e3o",
  victimsPm: "V\u00edtimas PM",
  victimsCivil: "V\u00edtimas civis",
  victimsHeader: "Existe(m) v\u00edtima(s)? Quantidade",
  mainRe: "RE-DC principal",
  rank: "Posto/Gradua\u00e7\u00e3o",
  officerName: "Nome do policial",
  portaria: "Portaria de Sindic\u00e2ncia n\u00ba",
  victimPm: "V\u00edtima policial militar",
  victimCivil: "V\u00edtima civil",
  observation: "Observa\u00e7\u00e3o",
  saveChanges: "Salvar altera\u00e7\u00f5es",
  printOpenError: "N\u00e3o foi poss\u00edvel abrir a visualiza\u00e7\u00e3o de impress\u00e3o do PAAVI.",
  saveError: "N\u00e3o foi poss\u00edvel salvar o registro.",
  deleteError: "N\u00e3o foi poss\u00edvel remover o registro.",
  listError: "Erro ao carregar a planilha de acidentes de viatura.",
  officerNotFound: "Policial n\u00e3o identificado",
};

const emptyForm = {
  re_dc: "",
  portaria_sindicancia: "",
  re_enc: "",
  data_hora_fato: "",
  rodovia_sp: "SP 280",
  km: "",
  quantidade_policial_militar: 0,
  quantidade_civil: 0,
  observacao: "",
};

const headerPanelStyle = {
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "18px",
  background: "linear-gradient(180deg, rgba(226,232,240,0.96), rgba(203,213,225,0.92))",
  color: "#0f172a",
  padding: "18px 20px",
  textAlign: "center",
  boxShadow: "0 18px 36px rgba(15, 23, 42, 0.16)",
};

function normalizeOfficer(officer) {
  return {
    id: officer?.policial_id ?? officer?.id ?? officer?.re_dc ?? officer?.re ?? null,
    re: officer?.re_dc ?? officer?.re_with_digit ?? officer?.re ?? "",
    rank: officer?.posto_graduacao ?? officer?.graduacao ?? officer?.rank ?? "",
    name: officer?.nome_completo ?? officer?.full_name ?? officer?.nome ?? officer?.nome_guerra ?? "",
    warName: officer?.nome_guerra ?? officer?.war_name ?? "",
  };
}

function officerLabel(officer) {
  const normalized = normalizeOfficer(officer);
  return [normalized.re, normalized.rank, normalized.name].filter(Boolean).join(" | ");
}

function escapeHtml(value) {
  return String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildPrintableHtml(rows) {
  const bodyRows = rows
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.portaria)}</td>
          <td>${escapeHtml(item.reMot)}</td>
          <td>${escapeHtml(item.postoGraduacao)}</td>
          <td>${escapeHtml(item.nome)}</td>
          <td>${escapeHtml(item.reEnc)}</td>
          <td>${escapeHtml(item.dataHora)}</td>
          <td>${escapeHtml(item.sp)}</td>
          <td>${escapeHtml(item.km)}</td>
          <td>${escapeHtml(item.pm)}</td>
          <td>${escapeHtml(item.civil)}</td>
          <td>${escapeHtml(item.observacao)}</td>
        </tr>`,
    )
    .join("");

  return `
    <html>
      <head>
        <title>PAAVI</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 18px; color: #111827; }
          .header { background: #dbe4ef; border: 1px solid #64748b; text-align: center; padding: 16px; }
          .header h1 { margin: 0; font-size: 22px; }
          .header h2 { margin: 8px 0 0; font-size: 18px; color: #dc2626; }
          .header p { margin: 6px 0 0; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #111; padding: 6px 8px; text-align: center; font-size: 12px; }
          thead th { background: #e5e7eb; font-weight: 700; }
          tbody td:nth-child(4), tbody td:nth-child(11) { text-align: left; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${TEXT.systemTitle}</h1>
          <p>${TEXT.systemSubtitle}</p>
          <p>${TEXT.note}</p>
          <h2>${TEXT.paavi}</h2>
          <p>${TEXT.paaviSubtitle}</p>
          <p>${TEXT.command}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th rowspan="2">${TEXT.portaria}</th>
              <th colspan="3">Envolvidos</th>
              <th rowspan="2">R.E. ENC</th>
              <th rowspan="2">Fato / Data-Hora</th>
              <th colspan="2">Local do fato</th>
              <th colspan="2">Existe(m) vítima(s)? Quantidade</th>
              <th rowspan="2">${TEXT.observation}</th>
            </tr>
            <tr>
              <th>R.E. MOT</th>
              <th>Posto/Grad.</th>
              <th>Nome</th>
              <th>SP</th>
              <th>KM</th>
              <th>Policial Militar</th>
              <th>Civil</th>
            </tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </body>
    </html>
  `;
}

export default function PlanilhaAcidenteViaturaPage({ onBack }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [officerSearch, setOfficerSearch] = useState("");
  const [officerResults, setOfficerResults] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState(null);

  async function loadData(nextQuery = "") {
    try {
      setLoading(true);
      const data = await listarPlanilhaAcidenteViatura({ q: nextQuery });
      setRecords(Array.isArray(data) ? data : []);
      setError("");
    } catch (loadError) {
      setError(loadError.message || TEXT.listError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (officerSearch.trim().length < 2) {
      setOfficerResults([]);
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const data = await buscarPoliciaisAcidenteViatura(officerSearch.trim());
        if (!active) return;
        const normalized = Array.isArray(data) ? data.map(normalizeOfficer).filter((item) => item.re || item.name) : [];
        setOfficerResults(normalized);
      } catch {
        if (active) setOfficerResults([]);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [officerSearch]);

  const totalPm = useMemo(() => records.reduce((acc, item) => acc + (item.quantidade_policial_militar || 0), 0), [records]);
  const totalCivil = useMemo(() => records.reduce((acc, item) => acc + (item.quantidade_civil || 0), 0), [records]);

  const reportColumns = useMemo(
    () => [
      { key: "portaria", label: "Portaria", width: 22 },
      { key: "reMot", label: "R.E. MOT", width: 14 },
      { key: "postoGraduacao", label: "Posto/Grad.", width: 18 },
      { key: "nome", label: "Nome", width: 34 },
      { key: "reEnc", label: "R.E. ENC", width: 14 },
      { key: "dataHora", label: "Data/Hora", width: 18 },
      { key: "sp", label: "SP", width: 14 },
      { key: "km", label: "KM", width: 10 },
      { key: "pm", label: "Policial Militar", width: 14 },
      { key: "civil", label: "Civil", width: 10 },
      { key: "observacao", label: TEXT.observation, width: 28 },
    ],
    [],
  );

  const reportRows = useMemo(
    () =>
      records.map((item) => ({
        portaria: item.portaria_sindicancia || "-",
        reMot: item.re_dc || "-",
        postoGraduacao: item.posto_graduacao || "-",
        nome: item.policial_nome || "-",
        reEnc: item.re_enc || "-",
        dataHora: item.data_hora_fato || "-",
        sp: item.rodovia_sp || "-",
        km: item.km || "-",
        pm: item.quantidade_policial_militar ?? 0,
        civil: item.quantidade_civil ?? 0,
        observacao: item.observacao || "-",
      })),
    [records],
  );

  async function handleExportExcel() {
    await exportExcelReport({
      fileBaseName: "planilha-acidente-viatura",
      sheetName: "PAAVI",
      title: TEXT.systemTitle,
      subtitle: TEXT.paaviSubtitle,
      columns: reportColumns,
      rows: reportRows,
    });
  }

  async function handleExportPdf() {
    const printWindow = window.open("", "_blank", "width=1400,height=900");
    if (!printWindow) {
      throw new Error(TEXT.printOpenError);
    }
    printWindow.document.write(buildPrintableHtml(reportRows));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function beginCreate() {
    setEditingId(null);
    setSelectedRecord(null);
    setSelectedOfficer(null);
    setOfficerSearch("");
    setOfficerResults([]);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function beginEdit(record) {
    setEditingId(record.id);
    setSelectedRecord(record);
    setSelectedOfficer(normalizeOfficer({
      re_dc: record.re_dc,
      posto_graduacao: record.posto_graduacao,
      nome_completo: record.policial_nome,
    }));
    setOfficerSearch([record.re_dc, record.posto_graduacao, record.policial_nome].filter(Boolean).join(" | "));
    setOfficerResults([]);
    setForm({
      re_dc: record.re_dc || "",
      portaria_sindicancia: record.portaria_sindicancia || "",
      re_enc: record.re_enc || "",
      data_hora_fato: record.data_hora_fato || "",
      rodovia_sp: record.rodovia_sp || "SP 280",
      km: record.km || "",
      quantidade_policial_militar: record.quantidade_policial_militar ?? 0,
      quantidade_civil: record.quantidade_civil ?? 0,
      observacao: record.observacao || "",
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      const payload = {
        ...form,
        re_dc: selectedOfficer?.re || form.re_dc,
        quantidade_policial_militar: Number(form.quantidade_policial_militar || 0),
        quantidade_civil: Number(form.quantidade_civil || 0),
      };
      if (editingId) {
        await atualizarPlanilhaAcidenteViatura(editingId, payload);
        setSuccess("Registro atualizado com sucesso.");
      } else {
        await criarPlanilhaAcidenteViatura(payload);
        setSuccess("Registro criado com sucesso.");
      }
      setShowForm(false);
      await loadData(query);
    } catch (saveError) {
      setError(saveError.message || TEXT.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record) {
    try {
      setError("");
      await excluirPlanilhaAcidenteViatura(record.id);
      if (selectedRecord?.id === record.id) {
        setSelectedRecord(null);
      }
      await loadData(query);
      setSuccess("Registro removido com sucesso.");
    } catch (deleteError) {
      setError(deleteError.message || TEXT.deleteError);
    }
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.actions}>
          <button type="button" onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
          <button type="button" onClick={beginCreate} style={{ ...styles.button, ...styles.primaryButton }}>
            + Nova Ficha
          </button>
        </div>
        <h1 style={styles.title}>{TEXT.title}</h1>
        <p style={styles.subtitle}>{TEXT.subtitle}</p>
      </section>

      <section style={{ ...styles.card, marginBottom: "18px" }}>
        <div style={headerPanelStyle}>
          <div style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "0.03em" }}>{TEXT.systemTitle}</div>
          <div style={{ marginTop: "8px", fontSize: "1.05rem", fontWeight: 700 }}>{TEXT.systemSubtitle}</div>
          <div style={{ marginTop: "4px", fontSize: "1rem", fontWeight: 600 }}>{TEXT.note}</div>
          <div style={{ marginTop: "12px", fontSize: "1.9rem", fontWeight: 900, color: "#dc2626", letterSpacing: "0.05em" }}>{TEXT.paavi}</div>
          <div style={{ marginTop: "2px", fontSize: "1.05rem", fontWeight: 700, color: "#991b1b" }}>{TEXT.paaviSubtitle}</div>
          <div style={{ marginTop: "8px", fontSize: "1.1rem", fontWeight: 800 }}>{TEXT.command}</div>
        </div>
      </section>

      {error ? <div style={{ ...styles.card, ...styles.dangerButton, marginBottom: "18px" }}>{error}</div> : null}
      {success ? <div style={{ ...styles.card, marginBottom: "18px", borderColor: "rgba(34,197,94,0.35)", color: "#bbf7d0" }}>{success}</div> : null}

      <section style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ ...styles.formGrid, flex: "1 1 560px" }}>
            <div style={styles.field}>
              <label style={styles.label}>{TEXT.quickSearch}</label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por RE-DC, nome ou portaria"
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{TEXT.action}</label>
              <button type="button" onClick={() => void loadData(query)} style={{ ...styles.button, ...styles.primaryButton, height: "50px" }}>
                Atualizar
              </button>
            </div>
          </div>
          <ReportExportButtons onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} disabled={loading || records.length === 0} />
        </div>
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginTop: "16px" }}>
          <div style={styles.card}>
            <strong>Total de fichas</strong>
            <div style={{ marginTop: "8px", fontSize: "1.35rem", fontWeight: 800 }}>{records.length}</div>
          </div>
          <div style={styles.card}>
            <strong>{TEXT.victimsPm}</strong>
            <div style={{ marginTop: "8px", fontSize: "1.35rem", fontWeight: 800 }}>{totalPm}</div>
          </div>
          <div style={styles.card}>
            <strong>{TEXT.victimsCivil}</strong>
            <div style={{ marginTop: "8px", fontSize: "1.35rem", fontWeight: 800 }}>{totalCivil}</div>
          </div>
        </div>
      </section>

      {showForm ? (
        <section style={{ ...styles.card, marginTop: "18px" }}>
          <h2 style={styles.sectionTitle}>{editingId ? "Editar ficha PAAVI" : "Nova ficha PAAVI"}</h2>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.fieldFull}>
                <label style={styles.label}>{TEXT.mainRe}</label>
                <input
                  value={officerSearch}
                  onChange={(event) => {
                    setOfficerSearch(event.target.value);
                    setSelectedOfficer(null);
                    setForm((current) => ({ ...current, re_dc: event.target.value }));
                  }}
                  placeholder="Digite o RE-DC ou nome"
                  style={styles.input}
                  required
                />
                {officerResults.length > 0 ? (
                  <div style={{ display: "grid", gap: "8px", marginTop: "10px" }}>
                    {officerResults.slice(0, 6).map((item) => (
                      <button
                        key={`${item.id || item.re || "pm"}`}
                        type="button"
                        onClick={() => {
                          setSelectedOfficer(item);
                          setOfficerSearch(officerLabel(item));
                          setForm((current) => ({ ...current, re_dc: item.re || current.re_dc }));
                          setOfficerResults([]);
                        }}
                        style={{ ...styles.card, textAlign: "left", padding: "10px 12px", cursor: "pointer" }}
                      >
                        <strong>{item.re || "-"}</strong>
                        <div style={{ color: "var(--app-text-muted)", marginTop: "4px" }}>
                          {[item.rank, item.name].filter(Boolean).join(" | ") || TEXT.officerNotFound}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {selectedOfficer ? (
              <div style={{ ...styles.card, marginTop: "16px", backgroundColor: "var(--app-surface-muted)" }}>
                <div style={styles.formGrid}>
                  <div style={styles.field}>
                    <label style={styles.label}>RE-DC</label>
                    <div style={styles.input}>{selectedOfficer.re || form.re_dc}</div>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>{TEXT.rank}</label>
                    <div style={styles.input}>{selectedOfficer.rank || "-"}</div>
                  </div>
                  <div style={styles.fieldFull}>
                    <label style={styles.label}>{TEXT.officerName}</label>
                    <div style={styles.input}>{selectedOfficer.name || "-"}</div>
                  </div>
                </div>
              </div>
            ) : null}

            <div style={{ ...styles.formGrid, marginTop: "16px" }}>
              <div style={styles.field}>
                <label style={styles.label}>{TEXT.portaria}</label>
                <input
                  value={form.portaria_sindicancia}
                  onChange={(event) => setForm((current) => ({ ...current, portaria_sindicancia: event.target.value }))}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>R.E. ENC</label>
                <input value={form.re_enc} onChange={(event) => setForm((current) => ({ ...current, re_enc: event.target.value }))} style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Data/Hora do fato</label>
                <input
                  value={form.data_hora_fato}
                  onChange={(event) => setForm((current) => ({ ...current, data_hora_fato: event.target.value }))}
                  placeholder="Ex: 011100JAN26"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>SP</label>
                <input value={form.rodovia_sp} onChange={(event) => setForm((current) => ({ ...current, rodovia_sp: event.target.value }))} style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>KM</label>
                <input value={form.km} onChange={(event) => setForm((current) => ({ ...current, km: event.target.value }))} placeholder="Ex: 18" style={styles.input} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>{TEXT.victimPm}</label>
                <input
                  type="number"
                  min="0"
                  value={form.quantidade_policial_militar}
                  onChange={(event) => setForm((current) => ({ ...current, quantidade_policial_militar: event.target.value }))}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>{TEXT.victimCivil}</label>
                <input
                  type="number"
                  min="0"
                  value={form.quantidade_civil}
                  onChange={(event) => setForm((current) => ({ ...current, quantidade_civil: event.target.value }))}
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldFull}>
                <label style={styles.label}>{TEXT.observation}</label>
                <input value={form.observacao} onChange={(event) => setForm((current) => ({ ...current, observacao: event.target.value }))} style={styles.input} />
              </div>
            </div>

            <div style={styles.footerActions}>
              <button type="button" onClick={() => setShowForm(false)} style={{ ...styles.button, ...styles.secondaryButton }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving} style={{ ...styles.button, ...styles.primaryButton }}>
                {saving ? "Salvando..." : editingId ? TEXT.saveChanges : "Salvar ficha"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section style={{ ...styles.card, marginTop: "18px" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th} rowSpan={2}>Ver</th>
                <th style={styles.th} rowSpan={2}>{TEXT.portaria}</th>
                <th style={styles.th} colSpan={3}>Envolvidos</th>
                <th style={styles.th} rowSpan={2}>Fato<br />Data/Hora</th>
                <th style={styles.th} colSpan={2}>Local do fato</th>
                <th style={styles.th} colSpan={2}>{TEXT.victimsHeader}</th>
              </tr>
              <tr>
                <th style={styles.th}>R.E. MOT</th>
                <th style={styles.th}>Posto/Grad.</th>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>SP</th>
                <th style={styles.th}>KM</th>
                <th style={styles.th}>Policial Militar</th>
                <th style={styles.th}>Civil</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td style={styles.td} colSpan={10}>Carregando...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan={10}>Nenhum registro cadastrado.</td>
                </tr>
              ) : (
                records.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      <button type="button" onClick={() => setSelectedRecord(item)} style={{ ...styles.button, ...styles.secondaryButton }}>
                        Ver
                      </button>
                    </td>
                    <td style={styles.td}>{item.portaria_sindicancia || "-"}</td>
                    <td style={styles.td}>{item.re_dc || "-"}</td>
                    <td style={styles.td}>{item.posto_graduacao || "-"}</td>
                    <td style={styles.td}>{item.policial_nome || "-"}</td>
                    <td style={styles.td}>{item.data_hora_fato || "-"}</td>
                    <td style={styles.td}>{item.rodovia_sp || "-"}</td>
                    <td style={styles.td}>{item.km || "-"}</td>
                    <td style={styles.td}>{item.quantidade_policial_militar ?? 0}</td>
                    <td style={styles.td}>{item.quantidade_civil ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedRecord ? (
        <section style={{ ...styles.card, marginTop: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <h2 style={styles.sectionTitle}>Detalhes da ficha</h2>
              <p style={styles.sectionText}>
                {selectedRecord.re_dc} | {selectedRecord.posto_graduacao || "-"} | {selectedRecord.policial_nome || "-"}
              </p>
            </div>
            <div style={styles.tableHeaderActions}>
              <button type="button" onClick={() => beginEdit(selectedRecord)} style={{ ...styles.button, ...styles.primaryButton }}>
                {"\u270F Editar"}
              </button>
              <button type="button" onClick={() => void handleDelete(selectedRecord)} style={{ ...styles.button, ...styles.secondaryButton }}>
                {"\u2715 Excluir"}
              </button>
            </div>
          </div>
          <div style={{ ...styles.formGrid, marginTop: "16px" }}>
            <div style={styles.field}><label style={styles.label}>Portaria</label><div style={styles.input}>{selectedRecord.portaria_sindicancia || "-"}</div></div>
            <div style={styles.field}><label style={styles.label}>R.E. MOT</label><div style={styles.input}>{selectedRecord.re_dc || "-"}</div></div>
            <div style={styles.field}><label style={styles.label}>{TEXT.rank}</label><div style={styles.input}>{selectedRecord.posto_graduacao || "-"}</div></div>
            <div style={styles.field}><label style={styles.label}>Nome</label><div style={styles.input}>{selectedRecord.policial_nome || "-"}</div></div>
            <div style={styles.field}><label style={styles.label}>R.E. ENC</label><div style={styles.input}>{selectedRecord.re_enc || "-"}</div></div>
            <div style={styles.field}><label style={styles.label}>Data/Hora</label><div style={styles.input}>{selectedRecord.data_hora_fato || "-"}</div></div>
            <div style={styles.field}><label style={styles.label}>SP</label><div style={styles.input}>{selectedRecord.rodovia_sp || "-"}</div></div>
            <div style={styles.field}><label style={styles.label}>KM</label><div style={styles.input}>{selectedRecord.km || "-"}</div></div>
            <div style={styles.field}><label style={styles.label}>{TEXT.victimPm}</label><div style={styles.input}>{selectedRecord.quantidade_policial_militar ?? 0}</div></div>
            <div style={styles.field}><label style={styles.label}>{TEXT.victimCivil}</label><div style={styles.input}>{selectedRecord.quantidade_civil ?? 0}</div></div>
            <div style={styles.fieldFull}><label style={styles.label}>{TEXT.observation}</label><div style={styles.input}>{selectedRecord.observacao || "-"}</div></div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
