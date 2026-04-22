import { useEffect, useMemo, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import {
  atualizarBloco,
  buscarPoliciaisQuinquenio,
  buscarPorPolicial,
  buscarTimeline,
  registrarBloco,
  registrarInterrupcao,
  removerInterrupcao,
  salvarPeriodo,
} from "../services/quinquenioService";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("pt-BR");
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function diffLabel(from, to = new Date()) {
  if (!from) return "-";
  const start = parseDate(from);
  if (!start) return "-";
  const totalMonths = Math.max(
    (to.getFullYear() - start.getFullYear()) * 12 + (to.getMonth() - start.getMonth()),
    0,
  );
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return `${years} ano(s), ${months} mês(es)`;
}

function progressPercent(admissionDate, nextDate) {
  const start = parseDate(admissionDate);
  const end = parseDate(nextDate);
  if (!start || !end) return 0;
  const now = new Date();
  const total = end.getTime() - start.getTime();
  const current = now.getTime() - start.getTime();
  if (total <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((current / total) * 100)));
}

function createInterrupcaoForm(policialId = null) {
  return {
    policial_id: policialId,
    data_inicio: "",
    data_fim: "",
    motivo: "",
  };
}

function createBlocoDraft(bloco) {
  return {
    bol_geral_concessao: bloco.bol_geral_concessao || "",
    data_concessao_real: bloco.data_concessao_real || "",
  };
}

function createPeriodoDraft(periodo) {
  return {
    numero_periodo: periodo.numero_periodo,
    tipo_uso: periodo.tipo_uso || "",
    fracionamento: periodo.fracionamento || "",
    data_inicio: periodo.data_inicio || "",
    boletim: periodo.boletim || "",
    observacao: periodo.observacao || "",
  };
}

function saveBadge(status) {
  if (status === "ENCERRADO" || status === "CONCLUIDO") return styles.activeBadge;
  if (status === "EM_USO" || status === "EM_ANDAMENTO") return styles.infoBadge;
  if (status === "PREVISTO" || status === "AGENDADO") return styles.neutralBadge;
  return styles.warningBadge || styles.infoBadge;
}

function statusSaldoBadge(bloco) {
  if (bloco.dias_saldo <= 0) return styles.neutralBadge;
  if (bloco.dias_utilizados > 0) return styles.infoBadge;
  return styles.activeBadge;
}

function resolveOfficerId(item) {
  return item?.policial_id ?? item?.id ?? null;
}

export default function QuinquenioPage({ onBack }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [expandedBlocks, setExpandedBlocks] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showInterrupcaoForm, setShowInterrupcaoForm] = useState(false);
  const [interrupcaoForm, setInterrupcaoForm] = useState(createInterrupcaoForm());
  const [blocoDrafts, setBlocoDrafts] = useState({});
  const [periodoDrafts, setPeriodoDrafts] = useState({});

  const police = summary?.policial || null;
  const nextPredictedBlock = useMemo(
    () => summary?.blocos?.find((item) => !item.registrado) || null,
    [summary],
  );

  const activePecuniaByBlock = useMemo(() => {
    const map = {};
    (summary?.blocos || []).forEach((bloco) => {
      const fromDraft = Object.values(periodoDrafts[bloco.numero_bloco] || {}).some(
        (periodo) => periodo?.tipo_uso === "PECUNIA",
      );
      const fromSaved = bloco.periodos.some((periodo) => periodo.tipo_uso === "PECUNIA");
      map[bloco.numero_bloco] = fromDraft || fromSaved;
    });
    return map;
  }, [periodoDrafts, summary]);

  const alertas = useMemo(() => {
    if (!summary || !police) return [];
    const items = [];
    const today = new Date();
    summary.blocos.forEach((bloco) => {
      const prevista = parseDate(bloco.data_prevista);
      if (!prevista || bloco.registrado) return;
      const diffDays = Math.ceil((prevista.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        items.push({
          tone: "danger",
          text: `O ${bloco.numero_bloco}º bloco de LP do policial ${police.nome} deveria ter sido concedido em ${formatDate(bloco.data_prevista)} e ainda não foi registrado no sistema.`,
        });
      } else if (diffDays <= 90) {
        items.push({
          tone: "warning",
          text: `Atenção: o policial ${police.nome} tem direito ao ${bloco.numero_bloco}º bloco de LP a partir de ${formatDate(bloco.data_prevista)}. Faltam ${diffDays} dia(s) para a concessão.`,
        });
      }
    });
    return items;
  }, [summary, police]);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        setSearching(true);
        const results = await buscarPoliciaisQuinquenio(searchTerm.trim());
        if (!active) return;
        setSearchResults(Array.isArray(results) ? results : []);
      } catch {
        if (active) setSearchResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [searchTerm]);

  async function loadPolicial(policialId, options = {}) {
    const expandBlockNumber = options.expandBlockNumber ?? null;
    try {
      setLoading(true);
      setError("");
      const [resumo, timelineData] = await Promise.all([
        buscarPorPolicial(policialId),
        buscarTimeline(policialId),
      ]);
      setSummary(resumo);
      setTimeline(Array.isArray(timelineData) ? timelineData : []);
      setInterrupcaoForm(createInterrupcaoForm(policialId));
      setBlocoDrafts(
        Object.fromEntries((resumo.blocos || []).map((bloco) => [bloco.numero_bloco, createBlocoDraft(bloco)])),
      );
      setPeriodoDrafts(
        Object.fromEntries(
          (resumo.blocos || []).map((bloco) => [
            bloco.numero_bloco,
            Object.fromEntries(bloco.periodos.map((periodo) => [periodo.numero_periodo, createPeriodoDraft(periodo)])),
          ]),
        ),
      );
      setExpandedBlocks(
        Object.fromEntries(
          (resumo.blocos || []).map((bloco) => [bloco.numero_bloco, expandBlockNumber === bloco.numero_bloco]),
        ),
      );
    } catch (loadError) {
      setError(loadError.message || "Não foi possível carregar o Quinquênio do policial.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event) {
    event?.preventDefault();
    if (!searchTerm.trim()) return;
    const exact =
      searchResults.find((item) => String(item.re_dc || item.re || "").toUpperCase() === searchTerm.trim().toUpperCase()) ||
      searchResults[0];
    const officerId = resolveOfficerId(exact);
    if (!officerId) {
      setError("Policial não encontrado para o RE informado.");
      return;
    }
    await loadPolicial(officerId);
  }

  function toggleExpanded(numeroBloco) {
    setExpandedBlocks((current) => ({ ...current, [numeroBloco]: !current[numeroBloco] }));
  }

  async function handleRegistrarInterrupcao(event) {
    event.preventDefault();
    if (!police?.policial_id) return;
    try {
      setSaving(true);
      setError("");
      const data = await registrarInterrupcao(police.policial_id, interrupcaoForm);
      setSummary(data);
      setInterrupcaoForm(createInterrupcaoForm(police.policial_id));
      setShowInterrupcaoForm(false);
      setSuccess("Interrupção registrada com sucesso.");
      const timelineData = await buscarTimeline(police.policial_id);
      setTimeline(Array.isArray(timelineData) ? timelineData : []);
    } catch (saveError) {
      setError(saveError.message || "Não foi possível registrar a interrupção.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveInterrupcao(interrupcaoId) {
    if (!police?.policial_id) return;
    try {
      setSaving(true);
      setError("");
      const data = await removerInterrupcao(interrupcaoId);
      setSummary(data);
      setSuccess("Interrupção removida com sucesso.");
      const timelineData = await buscarTimeline(police.policial_id);
      setTimeline(Array.isArray(timelineData) ? timelineData : []);
    } catch (saveError) {
      setError(saveError.message || "Não foi possível remover a interrupção.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegistrarBloco(bloco) {
    if (!police?.policial_id) return;
    try {
      setSaving(true);
      setError("");
      await registrarBloco(police.policial_id, {
        policial_id: police.policial_id,
        numero_bloco: bloco.numero_bloco,
        ...blocoDrafts[bloco.numero_bloco],
      });
      await loadPolicial(police.policial_id, { expandBlockNumber: bloco.numero_bloco });
      setSuccess("Bloco registrado com sucesso.");
    } catch (saveError) {
      setError(saveError.message || "Não foi possível registrar o bloco.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBloco(bloco) {
    if (!bloco.id) return;
    try {
      setSaving(true);
      setError("");
      await atualizarBloco(bloco.id, blocoDrafts[bloco.numero_bloco]);
      await loadPolicial(police.policial_id);
      setSuccess("Dados do bloco atualizados com sucesso.");
    } catch (saveError) {
      setError(saveError.message || "Não foi possível atualizar o bloco.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegistrarProximoBloco() {
    if (!nextPredictedBlock) return;
    await handleRegistrarBloco(nextPredictedBlock);
  }

  async function persistPeriodo(bloco, periodoNumero) {
    const draft = periodoDrafts[bloco.numero_bloco]?.[periodoNumero];
    if (!draft || !bloco.id) return;
    try {
      setError("");
      await salvarPeriodo(bloco.id, draft);
      await loadPolicial(police.policial_id);
      setSuccess(`Período ${periodoNumero} salvo com sucesso.`);
    } catch (saveError) {
      setError(saveError.message || "Não foi possível salvar o período.");
    }
  }

  function updatePeriodoDraft(bloco, periodoNumero, field, value) {
    setPeriodoDrafts((current) => {
      const blocoDraft = current[bloco.numero_bloco] || {};
      const nextDraft = {
        ...(blocoDraft[periodoNumero] || {}),
        [field]: value,
      };
      if (field === "tipo_uso" && value === "PECUNIA") {
        nextDraft.fracionamento = "";
        nextDraft.data_inicio = "";
      }
      if (field === "tipo_uso" && value === "FRUICAO") {
        nextDraft.fracionamento = nextDraft.fracionamento || "";
        nextDraft.data_inicio = nextDraft.data_inicio || "";
      }
      const next = {
        ...current,
        [bloco.numero_bloco]: {
          ...blocoDraft,
          [periodoNumero]: nextDraft,
        },
      };
      return next;
    });
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.actions}>
          <button type="button" onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
        </div>
        <h1 style={styles.title}>Controle de Bloco Quinquênio</h1>
        <p style={styles.subtitle}>Gerencie blocos, períodos, interrupções e a linha do tempo de Licença Prêmio.</p>
      </section>

      {error ? <div style={{ ...styles.card, ...styles.dangerButton, marginBottom: "18px" }}>{error}</div> : null}
      {success ? (
        <div style={{ ...styles.card, marginBottom: "18px", borderColor: "rgba(34,197,94,0.35)", color: "#bbf7d0" }}>
          {success}
        </div>
      ) : null}

      <section style={styles.card}>
        <form onSubmit={handleSearch}>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>RE do policial</label>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Digite o RE e pressione Enter"
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Ação</label>
              <button type="submit" style={{ ...styles.button, ...styles.primaryButton, height: "50px" }}>
                {searching || loading ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </div>

          {searchResults.length > 0 ? (
            <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
              {searchResults.slice(0, 6).map((item) => (
                <button
                  key={`${resolveOfficerId(item)}-${item.re_dc || item.re || item.nome_completo || item.nome || "resultado"}`}
                  type="button"
                  onClick={() => void loadPolicial(resolveOfficerId(item))}
                  style={{ ...styles.card, textAlign: "left", padding: "14px 16px", cursor: "pointer" }}
                >
                  <strong>{item.posto_graduacao || item.graduacao || "-"}</strong> {item.nome_guerra || item.nome_completo || item.nome}
                  <div style={{ color: "var(--app-text-muted)", marginTop: "4px" }}>
                    {(item.re_dc || item.re || "-")} | {item.nome_completo || item.nome || "-"}
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </form>
      </section>

      {police ? (
        <>
          <section style={{ ...styles.card, marginTop: "18px" }}>
            <h2 style={styles.sectionTitle}>Dados do policial</h2>
            <div style={styles.formGrid}>
              <div style={styles.field}><label style={styles.label}>RE</label><div style={styles.input}>{police.re}</div></div>
              <div style={styles.field}><label style={styles.label}>Nome completo</label><div style={styles.input}>{police.nome}</div></div>
              <div style={styles.field}><label style={styles.label}>Posto / Graduação</label><div style={styles.input}>{police.graduacao || "-"}</div></div>
              <div style={styles.field}><label style={styles.label}>Unidade</label><div style={styles.input}>{police.unidade || "-"}</div></div>
              <div style={styles.field}><label style={styles.label}>Data de admissão</label><div style={styles.input}>{formatDate(police.data_admissao)}</div></div>
              <div style={styles.field}><label style={styles.label}>Tempo de serviço</label><div style={styles.input}>{diffLabel(police.data_admissao)}</div></div>
            </div>
            <div style={{ marginTop: "18px" }}>
              <div style={{ ...styles.label, marginBottom: "8px" }}>
                Próximo bloco em: {nextPredictedBlock ? formatDate(nextPredictedBlock.data_prevista) : "-"}
              </div>
              <div style={{ height: "14px", backgroundColor: "var(--app-surface-soft)", borderRadius: "999px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${progressPercent(police.data_admissao, nextPredictedBlock?.data_prevista)}%`,
                    background: "linear-gradient(90deg, #14b8a6, #38bdf8)",
                  }}
                />
              </div>
            </div>
          </section>

          {alertas.length > 0 ? (
            <section style={{ ...styles.card, marginTop: "18px" }}>
              <h2 style={styles.sectionTitle}>Alertas</h2>
              <div style={{ display: "grid", gap: "10px" }}>
                {alertas.map((alerta, index) => (
                  <div
                    key={`${alerta.tone}-${index}`}
                    style={{
                      ...styles.card,
                      padding: "14px 16px",
                      borderColor: alerta.tone === "danger" ? "rgba(248,113,113,0.45)" : "rgba(251,191,36,0.45)",
                    }}
                  >
                    {alerta.text}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section style={{ ...styles.card, marginTop: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <h2 style={styles.sectionTitle}>Interrupções</h2>
                <p style={styles.sectionText}>
                  Total de dias de interrupção: {summary.dias_interrupcao_total} dia(s) somados ao cálculo do próximo bloco.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInterrupcaoForm((current) => !current)}
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                {showInterrupcaoForm ? "Cancelar" : "Registrar Interrupção"}
              </button>
            </div>

            {showInterrupcaoForm ? (
              <form onSubmit={handleRegistrarInterrupcao} style={{ ...styles.card, marginBottom: "18px" }}>
                <div style={styles.formGrid}>
                  <div style={styles.field}>
                    <label style={styles.label}>Data início</label>
                    <input type="date" value={interrupcaoForm.data_inicio} onChange={(event) => setInterrupcaoForm((current) => ({ ...current, data_inicio: event.target.value }))} style={styles.input} />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Data fim</label>
                    <input type="date" value={interrupcaoForm.data_fim} onChange={(event) => setInterrupcaoForm((current) => ({ ...current, data_fim: event.target.value }))} style={styles.input} />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Motivo</label>
                    <input value={interrupcaoForm.motivo} onChange={(event) => setInterrupcaoForm((current) => ({ ...current, motivo: event.target.value }))} style={styles.input} />
                  </div>
                </div>
                <div style={styles.footerActions}>
                  <button type="submit" disabled={saving} style={{ ...styles.button, ...styles.primaryButton }}>Salvar</button>
                </div>
              </form>
            ) : null}

            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Data início</th>
                    <th style={styles.th}>Data fim</th>
                    <th style={styles.th}>Dias</th>
                    <th style={styles.th}>Motivo</th>
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.interrupcoes.length === 0 ? (
                    <tr><td colSpan={5} style={styles.td}>Nenhuma interrupção registrada.</td></tr>
                  ) : summary.interrupcoes.map((item) => (
                    <tr key={item.id}>
                      <td style={styles.td}>{formatDate(item.data_inicio)}</td>
                      <td style={styles.td}>{formatDate(item.data_fim)}</td>
                      <td style={styles.td}>{item.dias_interrompidos}</td>
                      <td style={styles.td}>{item.motivo || "-"}</td>
                      <td style={styles.td}>
                        <button type="button" onClick={() => void handleRemoveInterrupcao(item.id)} style={{ ...styles.button, ...styles.dangerButton, padding: "8px 12px" }}>
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ ...styles.card, marginTop: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "flex-start" }}>
              <div>
                <h2 style={styles.sectionTitle}>Blocos</h2>
                <p style={styles.sectionText}>
                  Os blocos ficam recolhidos por padrão. O histórico suporta mais de 5 blocos, acompanhando carreiras longas sem limite fixo.
                </p>
              </div>
              {nextPredictedBlock ? (
                <button
                  type="button"
                  onClick={() => void handleRegistrarProximoBloco()}
                  disabled={saving}
                  style={{ ...styles.button, ...styles.primaryButton }}
                >
                  Registrar próximo bloco
                </button>
              ) : null}
            </div>
            <div style={{ display: "grid", gap: "16px" }}>
              {summary.blocos.map((bloco) => {
                const blocoDraft = blocoDrafts[bloco.numero_bloco] || createBlocoDraft(bloco);
                const expanded = Boolean(expandedBlocks[bloco.numero_bloco]);
                return (
                  <div key={`bloco-${bloco.numero_bloco}`} style={styles.card}>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(bloco.numero_bloco)}
                      style={{ width: "100%", background: "transparent", border: "none", color: "var(--app-text)", textAlign: "left", padding: 0, cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
                        <div>
                          <strong>{bloco.numero_bloco}º Bloco de LP</strong>
                          <div style={{ color: "var(--app-text-muted)", marginTop: "6px" }}>
                            Período: {formatDate(bloco.data_inicio_contagem)} a {formatDate(bloco.intervalo_fim_contagem)}
                          </div>
                          <div style={{ color: "var(--app-text-muted)", marginTop: "4px" }}>
                            {bloco.registrado ? `Boletim: ${bloco.bol_geral_concessao || "-"} | Saldo: ${bloco.dias_saldo} dia(s)` : `Previsão: a partir de ${formatDate(bloco.data_prevista)}`}
                          </div>
                          <div style={{ color: "var(--app-text-soft)", marginTop: "4px", fontSize: "0.92rem" }}>
                            Base 1825 dias: {formatDate(bloco.intervalo_fim_contagem)} | Interrupções somadas: {bloco.interrupcoes_aplicadas || 0} dia(s) | Previsão final: {formatDate(bloco.data_prevista)}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <span style={{ ...styles.badge, ...saveBadge(bloco.status) }}>{bloco.status}</span>
                          <span style={{ ...styles.badge, ...statusSaldoBadge(bloco) }}>
                            {bloco.dias_saldo > 0 ? `${bloco.dias_saldo} dia(s) de saldo` : "Sem saldo"}
                          </span>
                          <span>{expanded ? "▲" : "▼"}</span>
                        </div>
                      </div>
                    </button>

                    {expanded ? (
                      <div style={{ marginTop: "18px", display: "grid", gap: "16px" }}>
                        <div style={styles.formGrid}>
                          <div style={styles.field}>
                            <label style={styles.label}>Boletim GM PM Concessão</label>
                            <input
                              value={blocoDraft.bol_geral_concessao}
                              onChange={(event) => setBlocoDrafts((current) => ({ ...current, [bloco.numero_bloco]: { ...blocoDraft, bol_geral_concessao: event.target.value } }))}
                              style={styles.input}
                              disabled={!bloco.registrado || bloco.status === "ENCERRADO"}
                            />
                          </div>
                          <div style={styles.field}>
                            <label style={styles.label}>Data da concessão real</label>
                            <input
                              type="date"
                              value={blocoDraft.data_concessao_real}
                              onChange={(event) => setBlocoDrafts((current) => ({ ...current, [bloco.numero_bloco]: { ...blocoDraft, data_concessao_real: event.target.value } }))}
                              style={styles.input}
                              disabled={!bloco.registrado || bloco.status === "ENCERRADO"}
                            />
                          </div>
                          <div style={styles.field}><label style={styles.label}>Houve interrupção?</label><div style={styles.input}>{summary.dias_interrupcao_total > 0 ? "Sim" : "Não"}</div></div>
                          <div style={styles.field}><label style={styles.label}>Período de direito</label><div style={styles.input}>{formatDate(bloco.data_inicio_contagem)} a {formatDate(bloco.intervalo_fim_contagem)}</div></div>
                          <div style={styles.field}><label style={styles.label}>Base do bloco por 1825 dias</label><div style={styles.input}>{formatDate(bloco.intervalo_fim_contagem)}</div></div>
                          <div style={styles.field}><label style={styles.label}>Dias de interrupção somados</label><div style={styles.input}>{bloco.interrupcoes_aplicadas || 0} dia(s)</div></div>
                          <div style={styles.fieldFull}><label style={styles.label}>Data final prevista do bloco</label><div style={styles.input}>{formatDate(bloco.data_prevista)}</div></div>
                        </div>

                        {!bloco.registrado ? (
                          <div style={styles.footerActions}>
                            <button type="button" onClick={() => void handleRegistrarBloco(bloco)} style={{ ...styles.button, ...styles.primaryButton }}>
                              Registrar Boletim de Concessão
                            </button>
                          </div>
                        ) : (
                          <>
                            <div style={{ ...styles.card, backgroundColor: "var(--app-surface-muted)" }}>
                              <div style={styles.formGrid}>
                                <div style={styles.field}><label style={styles.label}>RE</label><div style={styles.input}>{police.re}</div></div>
                                <div style={styles.field}><label style={styles.label}>Nome</label><div style={styles.input}>{police.nome}</div></div>
                                <div style={styles.field}><label style={styles.label}>Posto / Graduação</label><div style={styles.input}>{police.graduacao || "-"}</div></div>
                                <div style={styles.field}><label style={styles.label}>Unidade</label><div style={styles.input}>{police.unidade || "-"}</div></div>
                              </div>
                            </div>

                            <div style={{ ...styles.card, marginBottom: "4px", padding: "12px 14px", color: "var(--app-text-muted)", borderColor: "rgba(56,189,248,0.25)", backgroundColor: "rgba(15,23,42,0.55)" }}>
                              {"As altera\u00e7\u00f5es do per\u00edodo s\u00f3 s\u00e3o gravadas ao clicar em Salvar Per\u00edodo."}
                            </div>

                            <div style={{ display: "grid", gap: "14px" }}>
                              {bloco.periodos.map((periodo) => {
                                const draft = periodoDrafts[bloco.numero_bloco]?.[periodo.numero_periodo] || createPeriodoDraft(periodo);
                                const pecuniaLocked = draft.tipo_uso !== "PECUNIA" && activePecuniaByBlock[bloco.numero_bloco];

                                return (
                                  <div key={`periodo-${bloco.numero_bloco}-${periodo.numero_periodo}`} style={{ ...styles.card, backgroundColor: "var(--app-surface-muted)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                                      <strong>{periodo.numero_periodo}º Período</strong>
                                      <span style={{ ...styles.badge, ...saveBadge(periodo.status) }}>{periodo.status}</span>
                                    </div>

                                    <div style={{ ...styles.formGrid, marginTop: "14px" }}>
                                      <div style={styles.field}>
                                        <label style={styles.label}>Tipo de uso</label>
                                        <select value={draft.tipo_uso} onChange={(event) => updatePeriodoDraft(bloco, periodo.numero_periodo, "tipo_uso", event.target.value)} style={styles.input} disabled={bloco.status === "ENCERRADO"}>
                                          <option value="">Selecione</option>
                                          <option value="FRUICAO">Fruição</option>
                                          <option value="PECUNIA" disabled={pecuniaLocked}>Pecúnia</option>
                                        </select>
                                      </div>

                                      {draft.tipo_uso === "FRUICAO" ? (
                                        <>
                                          <div style={styles.field}>
                                            <label style={styles.label}>Dias</label>
                                            <select value={draft.fracionamento} onChange={(event) => updatePeriodoDraft(bloco, periodo.numero_periodo, "fracionamento", event.target.value)} style={styles.input}>
                                              <option value="">Selecione</option>
                                              <option value="15">15</option>
                                              <option value="30">30</option>
                                            </select>
                                          </div>
                                          <div style={styles.field}><label style={styles.label}>Boletim</label><input value={draft.boletim} onChange={(event) => updatePeriodoDraft(bloco, periodo.numero_periodo, "boletim", event.target.value)} style={styles.input} /></div>
                                          <div style={styles.field}><label style={styles.label}>Data de início</label><input type="date" value={draft.data_inicio} onChange={(event) => updatePeriodoDraft(bloco, periodo.numero_periodo, "data_inicio", event.target.value)} style={styles.input} /></div>
                                          <div style={styles.field}>
                                            <label style={styles.label}>Data de fim</label>
                                            <div style={styles.input}>
                                              {draft.data_inicio && draft.fracionamento ? formatDate(new Date(new Date(`${draft.data_inicio}T00:00:00`).getTime() + (Number(draft.fracionamento) - 1) * 86400000).toISOString().slice(0, 10)) : "-"}
                                            </div>
                                          </div>
                                        </>
                                      ) : null}

                                      {draft.tipo_uso === "PECUNIA" ? (
                                        <div style={styles.field}><label style={styles.label}>Boletim</label><input value={draft.boletim} onChange={(event) => updatePeriodoDraft(bloco, periodo.numero_periodo, "boletim", event.target.value)} style={styles.input} /></div>
                                      ) : null}

                                      <div style={styles.fieldFull}><label style={styles.label}>Observação</label><input value={draft.observacao} onChange={(event) => updatePeriodoDraft(bloco, periodo.numero_periodo, "observacao", event.target.value)} style={styles.input} /></div>
                                    </div>

                                    {pecuniaLocked ? <div style={{ ...styles.card, ...styles.dangerButton, marginTop: "14px", padding: "12px 14px" }}>Apenas 1 período por bloco pode ser Pecúnia.</div> : null}

                                    <div style={styles.footerActions}>
                                      <button type="button" onClick={() => void persistPeriodo(bloco, periodo.numero_periodo)} style={{ ...styles.button, ...styles.primaryButton }}>
                                        Salvar Período
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div style={styles.footerActions}>
                              <button type="button" onClick={() => void handleSaveBloco(bloco)} style={{ ...styles.button, ...styles.secondaryButton }}>
                                Salvar dados do bloco
                              </button>
                            </div>
                          </>
                        )}

                        <div style={{ marginTop: "4px" }}>
                          <div style={{ color: "var(--app-text-soft)", fontWeight: 700, marginBottom: "8px" }}>
                            Utilizado: {bloco.dias_utilizados} dias | Saldo: {bloco.dias_saldo} dias
                          </div>
                          <div style={{ height: "12px", backgroundColor: "var(--app-surface-soft)", borderRadius: "999px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${bloco.percentual_uso}%`, background: bloco.percentual_uso >= 100 ? "linear-gradient(90deg, #22c55e, #16a34a)" : "linear-gradient(90deg, #38bdf8, #14b8a6)" }} />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section style={{ ...styles.card, marginTop: "18px" }}>
            <h2 style={styles.sectionTitle}>Timeline</h2>
            <div style={{ display: "grid", gap: "12px" }}>
              {timeline.map((item, index) => (
                <div key={`${item.tipo}-${item.numero_bloco || index}`} style={{ ...styles.card, backgroundColor: "var(--app-surface-muted)", padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <strong>{item.titulo}</strong>
                    <span style={{ ...styles.badge, ...saveBadge(item.status) }}>{item.status}</span>
                  </div>
                  <div style={{ color: "var(--app-text-muted)", marginTop: "6px" }}>{formatDate(item.data)}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
