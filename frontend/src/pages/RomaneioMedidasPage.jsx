import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { appShellStyles as styles } from "../components/appShellStyles";
import {
  createRomaneioMedidas,
  getRomaneioMedidas,
  searchPoliceOfficer,
  updateRomaneioMedidas,
} from "../services/romaneioService";

const NUMBER_OPTIONS = Array.from({ length: 35 }, (_, index) => String(index + 36)).concat("Especial");
const BELT_MEASURE_OPTIONS = ["1,00", "1,05", "1,10", "1,15", "1,20", "1,25", "1,30", "1,35", "1,40", "1,45", "1,50", "1,55", "1,60", "1,65", "1,70", "1,75", "1,80"];
const SHOE_OPTIONS = Array.from({ length: 14 }, (_, index) => String(index + 33)).concat("Especial");
const HEAD_OPTIONS = Array.from({ length: 13 }, (_, index) => String(index + 52)).concat("Especial");
const SHIRT_OPTIONS = Array.from({ length: 25 }, (_, index) => String(index + 36)).concat("Especial");
const SIZE_OPTIONS = ["PP", "P", "M", "G", "GG", "XG", "XXG", "Especial"];
const SOCK_OPTIONS = ["39-43", "44-46", "Especial"];
const COLETE_OPTIONS = ["PP (Extra Estreito)", "Estreito - P", "Estreito - M", "Estreito - G", "Estreito - GG", "Normal - P", "Normal - M", "Normal - G", "Normal - GG", "Normal - XG", "Especial"];

function emptyForm() {
  return {
    calca_tipo: "",
    calca_numeracao: "",
    cinto_lona_tipo: "",
    cinto_lona_medida: "",
    fiel_retratil: "",
    cinturao_preto_lado: "",
    cinturao_preto_medida: "",
    calcado: "",
    colete_balistico: "",
    calca_combat: "",
    quepe: "",
    boina: "",
    camisa: "",
    camisa_combat_manga_longa: "",
    camiseta_gola_careca: "",
    agasalho_blusa: "",
    agasalho_calca: "",
    meia: "",
  };
}

function parseCalca(value) {
  const text = String(value || "").trim();
  if (!text.includes(" - ")) {
    return { calca_tipo: "", calca_numeracao: text };
  }
  const [tipo, numeracao] = text.split(" - ");
  return { calca_tipo: tipo || "", calca_numeracao: numeracao || "" };
}

function payloadFromForm(form, officer) {
  return {
    re: officer?.re_dc,
    calca: `${form.calca_tipo} - ${form.calca_numeracao}`,
    cinto_lona_tipo: form.cinto_lona_tipo,
    cinto_lona_medida: form.cinto_lona_medida,
    fiel_retratil: form.fiel_retratil,
    cinturao_preto_lado: form.cinturao_preto_lado,
    cinturao_preto_medida: form.cinturao_preto_medida,
    calcado: form.calcado,
    colete_balistico: form.colete_balistico,
    calca_combat: form.calca_combat,
    quepe: form.quepe,
    boina: form.boina,
    camisa: form.camisa,
    camisa_combat_manga_longa: form.camisa_combat_manga_longa,
    camiseta_gola_careca: form.camiseta_gola_careca,
    agasalho_blusa: form.agasalho_blusa,
    agasalho_calca: form.agasalho_calca,
    meia: form.meia,
  };
}

function SelectField({ label, value, onChange, options, disabled }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label} <span style={{ color: "var(--app-danger-text)" }}>*</span>
      </label>
      <select value={value} onChange={onChange} style={styles.input} required disabled={disabled}>
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function DetailField({ label, value, fullWidth = false }) {
  return (
    <div style={fullWidth ? styles.fieldFull : styles.field}>
      <span style={styles.label}>{label}</span>
      <div
        style={{
          ...styles.input,
          minHeight: "46px",
          display: "flex",
          alignItems: "center",
          backgroundColor: "var(--app-surface-muted)",
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function DetailSection({ title, fields }) {
  return (
    <div style={{ marginTop: "24px" }}>
      <h3 style={{ ...styles.sectionTitle, marginBottom: "12px" }}>{title}</h3>
      <div style={styles.formGrid}>
        {fields.map((field) => (
          <DetailField key={`${title}-${field.label}`} {...field} />
        ))}
      </div>
    </div>
  );
}

function RomaneioMedidasPage({ onBack }) {
  const [form, setForm] = useState(emptyForm());
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [hasExistingRecord, setHasExistingRecord] = useState(false);
  const [error, setError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(0);

  const doubleGrid = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
      gap: "16px",
    }),
    []
  );

  const setField = (field) => (event) => {
    const value = event.target.value;
    setForm((current) =>
      field === "calca_tipo"
        ? { ...current, calca_tipo: value, calca_numeracao: "" }
        : { ...current, [field]: value }
    );
  };

  const handleClear = () => {
    setForm(emptyForm());
    setSearchTerm("");
    setResults([]);
    setSelectedOfficer(null);
    setPreviewData(null);
    setHasExistingRecord(false);
    setError("");
    setSearchError("");
    setSuccess("");
  };

  const loadMeasuresForForm = useCallback(async (officer) => {
    try {
      const existing = await getRomaneioMedidas(officer.re_dc);
      if (existing?.medidas) {
        setForm({
          ...emptyForm(),
          ...existing.medidas,
          ...parseCalca(existing.medidas.calca),
        });
        setHasExistingRecord(true);
      } else {
        setForm(emptyForm());
        setHasExistingRecord(false);
      }
    } catch {
      setForm(emptyForm());
      setHasExistingRecord(false);
    }
  }, []);

  const activateOfficer = useCallback(
    async (lookup) => {
      const policial = lookup?.policial;
      if (!policial?.re_dc) {
        return;
      }
      setSelectedOfficer(policial);
      setPreviewData(null);
      setResults([]);
      setSearchTerm(policial.re_dc);
      setSearchError("");
      await loadMeasuresForForm(policial);
    },
    [loadMeasuresForForm]
  );

  const performSearch = useCallback(
    async (forcedTerm = searchTerm) => {
      const term = String(forcedTerm || "").trim();
      const currentId = Date.now();
      searchRef.current = currentId;
      setError("");
      setSearchError("");
      setSuccess("");

      if (term.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const data = await searchPoliceOfficer(term);
        if (searchRef.current !== currentId) {
          return;
        }
        const rows = Array.isArray(data) ? data : [];
        setResults(rows);
        setSelectedOfficer(null);
        setPreviewData(null);
        if (!rows.length) {
          setSearchError(
            `Nenhum policial encontrado para '${term}'. Tente digitar o RE-DC ou nome de forma diferente.`
          );
        }
      } catch (fetchError) {
        if (searchRef.current !== currentId) {
          return;
        }
        setResults([]);
        setSelectedOfficer(null);
        setPreviewData(null);
        setSearchError(
          fetchError?.message ||
            `Nenhum policial encontrado para '${term}'. Tente digitar o RE-DC ou nome de forma diferente.`
        );
      } finally {
        if (searchRef.current === currentId) {
          setIsSearching(false);
        }
      }
    },
    [searchTerm]
  );

  useEffect(() => {
    const term = searchTerm.trim();
    if (term.length < 3) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      void performSearch(term);
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [performSearch, searchTerm]);

  const openPreview = async (officer) => {
    try {
      const lookup = await getRomaneioMedidas(officer.re_dc);
      setPreviewData(lookup);
      setSearchError("");
    } catch (fetchError) {
      setSearchError(fetchError?.message || "Erro ao carregar as medidas do policial.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedOfficer?.re_dc) {
      setError("Pesquise e selecione um policial antes de salvar.");
      return;
    }

    try {
      const payload = payloadFromForm(form, selectedOfficer);
      if (hasExistingRecord) {
        const confirmed = window.confirm(
          "Já existe um cadastro para este policial.\nDeseja atualizar as medidas?"
        );
        if (!confirmed) {
          return;
        }
        await updateRomaneioMedidas(selectedOfficer.re_dc, payload);
      } else {
        await createRomaneioMedidas(payload);
        setHasExistingRecord(true);
      }

      setSuccess("Medidas salvas com sucesso.");
    } catch (submitError) {
      setError(submitError?.message || "Erro ao salvar as medidas.");
    }
  };

  const policialResumo = previewData?.policial;
  const medidas = previewData?.medidas;

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Cadastro de Medidas</h1>
        <p style={styles.subtitle}>
          Pesquise o policial e consulte ou registre apenas as medidas do uniforme.
        </p>
        <div style={styles.actions}>
          <button onClick={onBack} style={{ ...styles.button, ...styles.secondaryButton }}>
            Voltar
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Pesquisa de policiais</h2>
        <p style={styles.sectionText}>Pesquise por RE-DC, parte do RE, nome completo ou nome de guerra.</p>

        <div style={{ ...doubleGrid, marginBottom: "18px", alignItems: "end" }}>
          <div style={styles.field}>
            <label style={styles.label}>Buscar Policial</label>
            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setSelectedOfficer(null);
                setPreviewData(null);
                setSearchError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void performSearch();
                }
              }}
              style={styles.input}
              placeholder="Digite o RE-DC ou nome"
            />
          </div>
          <div style={styles.field}>
            <button
              type="button"
              onClick={() => void performSearch()}
              style={{ ...styles.button, ...styles.primaryButton, width: "fit-content" }}
            >
              {isSearching ? "Pesquisando..." : "Pesquisar"}
            </button>
          </div>
        </div>

        {searchError && <div style={styles.errorBox}>{searchError}</div>}

        <div className="desktop-table-view" style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "60px" }}>VER</th>
                <th style={styles.th}>NOME COMPLETO</th>
                <th style={styles.th}>NOME DE GUERRA</th>
                <th style={styles.th}>RE</th>
                <th style={styles.th}>UNIDADE</th>
                <th style={styles.th}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {results.length ? (
                results.map((officer, index) => (
                  <tr
                    key={officer.policial_id}
                    style={index % 2 === 1 ? { backgroundColor: "var(--app-surface-muted)" } : undefined}
                  >
                    <td style={styles.td}>
                      <button
                        type="button"
                        onClick={() => void openPreview(officer)}
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
                    <td style={styles.td}>{officer.nome_completo || "-"}</td>
                    <td style={styles.td}>{officer.nome_guerra || "-"}</td>
                    <td style={styles.td}>{officer.re_dc || "-"}</td>
                    <td style={styles.td}>{officer.unidade || "-"}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(officer.is_active ? styles.activeBadge : styles.inactiveBadge),
                        }}
                      >
                        {officer.status || (officer.is_active ? "Ativo" : "Inativo")}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={styles.td} colSpan={6}>
                    Nenhum resultado de pesquisa exibido no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {previewData ? (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Policial selecionado</h2>
          <p style={styles.sectionText}>
            Dados resumidos do policial e situação atual das medidas de uniforme.
          </p>

          <div style={{ ...styles.infoBox, marginBottom: "18px" }}>
            <div>
              <strong>Nome Completo:</strong> {policialResumo?.nome_completo || "-"}
            </div>
            <div>
              <strong>Nome de Guerra:</strong> {policialResumo?.nome_guerra || "-"}
            </div>
            <div>
              <strong>RE-DC:</strong> {policialResumo?.re_dc || "-"}
            </div>
            <div>
              <strong>Posto/Graduação:</strong> {policialResumo?.posto_graduacao || "-"}
            </div>
            <div>
              <strong>Unidade:</strong> {policialResumo?.unidade || "-"}
            </div>
          </div>

          {medidas ? (
            <>
              <DetailSection
                title="Uniformes — Calças e Cintos"
                fields={[
                  { label: "Calça Operacional/Passeio", value: medidas.calca || "-" },
                  {
                    label: "Cinto de Lona",
                    value: [medidas.cinto_lona_tipo, medidas.cinto_lona_medida]
                      .filter(Boolean)
                      .join(" - ") || "-",
                  },
                  { label: "Fiel Retrátil", value: medidas.fiel_retratil || "-" },
                  {
                    label: "Cinturão Preto",
                    value: [medidas.cinturao_preto_lado, medidas.cinturao_preto_medida]
                      .filter(Boolean)
                      .join(" - ") || "-",
                  },
                ]}
              />

              <DetailSection
                title="Uniformes — Calçados e Proteção"
                fields={[
                  { label: "Calçado", value: medidas.calcado || "-" },
                  { label: "Colete Balístico", value: medidas.colete_balistico || "-" },
                ]}
              />

              <DetailSection
                title="Uniformes — Camisas e Roupas"
                fields={[
                  { label: "Calça Combat", value: medidas.calca_combat || "-" },
                  { label: "Camisa Masculina", value: medidas.camisa || "-" },
                  {
                    label: "Camisa Combat Manga Longa",
                    value: medidas.camisa_combat_manga_longa || "-",
                  },
                  { label: "Camiseta Gola Careca", value: medidas.camiseta_gola_careca || "-" },
                ]}
              />

              <DetailSection
                title="Uniformes — Acessórios"
                fields={[
                  { label: "Quepe", value: medidas.quepe || "-" },
                  { label: "Boina", value: medidas.boina || "-" },
                  { label: "Agasalho Blusa", value: medidas.agasalho_blusa || "-" },
                  { label: "Agasalho Calça", value: medidas.agasalho_calca || "-" },
                  { label: "Meia", value: medidas.meia || "-" },
                ]}
              />
            </>
          ) : (
            <div style={styles.infoBox}>
              Este policial ainda não possui medidas de uniforme cadastradas.
            </div>
          )}

          <div style={styles.footerActions}>
            <button
              type="button"
              onClick={() => setPreviewData(null)}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              ← Voltar para pesquisa
            </button>
            <button
              type="button"
              onClick={() => void activateOfficer(previewData)}
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              {medidas ? "✏ Editar Medidas" : "📐 Cadastrar Medidas"}
            </button>
          </div>
        </section>
      ) : null}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Medidas do Policial</h2>
        <p style={styles.sectionText}>
          Preencha ou edite as medidas do uniforme depois de confirmar o policial.
        </p>

        <form onSubmit={handleSubmit}>
          {selectedOfficer ? (
            <div style={{ ...styles.infoBox, marginBottom: "18px" }}>
              <div>
                <strong>Nome Completo:</strong> {selectedOfficer.nome_completo || "-"}
              </div>
              <div>
                <strong>Nome de Guerra:</strong> {selectedOfficer.nome_guerra || "-"}
              </div>
              <div>
                <strong>RE-DC:</strong> {selectedOfficer.re_dc || "-"}
              </div>
              <div>
                <strong>Posto/Graduação:</strong> {selectedOfficer.posto_graduacao || "-"}
              </div>
              <div>
                <strong>Unidade:</strong> {selectedOfficer.unidade || "-"}
              </div>
            </div>
          ) : (
            <div style={{ ...styles.infoBox, marginBottom: "18px" }}>
              Clique em <strong>Ver</strong> e depois em{" "}
              <strong>Cadastrar Medidas</strong> ou <strong>Editar Medidas</strong> para habilitar o formulário.
            </div>
          )}

          <div style={styles.formGrid}>
            <div style={styles.fieldFull}>
              <label style={styles.label}>
                Calça Operacional/Passeio <span style={{ color: "var(--app-danger-text)" }}>*</span>
              </label>
              <div style={doubleGrid}>
                <select
                  value={form.calca_tipo}
                  onChange={setField("calca_tipo")}
                  style={styles.input}
                  required
                  disabled={!selectedOfficer}
                >
                  <option value="">Selecione</option>
                  <option value="Masculina">Masculina</option>
                  <option value="Feminina">Feminina</option>
                </select>
                <select
                  value={form.calca_numeracao}
                  onChange={setField("calca_numeracao")}
                  style={styles.input}
                  required
                  disabled={!selectedOfficer || !form.calca_tipo}
                >
                  <option value="">{form.calca_tipo ? "Selecione" : "Selecione o tipo primeiro"}</option>
                  {NUMBER_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.fieldFull}>
              <label style={styles.label}>
                Cinto de Lona <span style={{ color: "var(--app-danger-text)" }}>*</span>
              </label>
              <div style={doubleGrid}>
                <select
                  value={form.cinto_lona_tipo}
                  onChange={setField("cinto_lona_tipo")}
                  style={styles.input}
                  required
                  disabled={!selectedOfficer}
                >
                  <option value="">Tipo</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                </select>
                <select
                  value={form.cinto_lona_medida}
                  onChange={setField("cinto_lona_medida")}
                  style={styles.input}
                  required
                  disabled={!selectedOfficer}
                >
                  <option value="">Medida</option>
                  {BELT_MEASURE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <SelectField
              label="Fiel Retrátil"
              value={form.fiel_retratil}
              onChange={setField("fiel_retratil")}
              options={["Destro", "Canhoto"]}
              disabled={!selectedOfficer}
            />

            <div style={styles.fieldFull}>
              <label style={styles.label}>
                Cinturão Preto <span style={{ color: "var(--app-danger-text)" }}>*</span>
              </label>
              <div style={doubleGrid}>
                <select
                  value={form.cinturao_preto_lado}
                  onChange={setField("cinturao_preto_lado")}
                  style={styles.input}
                  required
                  disabled={!selectedOfficer}
                >
                  <option value="">Lado</option>
                  <option value="Destro">Destro</option>
                  <option value="Canhoto">Canhoto</option>
                </select>
                <select
                  value={form.cinturao_preto_medida}
                  onChange={setField("cinturao_preto_medida")}
                  style={styles.input}
                  required
                  disabled={!selectedOfficer}
                >
                  <option value="">Medida</option>
                  {BELT_MEASURE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <SelectField
              label="Calçado (Coturno, Sapato, etc.)"
              value={form.calcado}
              onChange={setField("calcado")}
              options={SHOE_OPTIONS}
              disabled={!selectedOfficer}
            />
            <SelectField
              label="Colete Balístico"
              value={form.colete_balistico}
              onChange={setField("colete_balistico")}
              options={COLETE_OPTIONS}
              disabled={!selectedOfficer}
            />
            <SelectField
              label="Calça Combat Shirt Masculino"
              value={form.calca_combat}
              onChange={setField("calca_combat")}
              options={NUMBER_OPTIONS}
              disabled={!selectedOfficer}
            />
            <SelectField
              label="Quepe"
              value={form.quepe}
              onChange={setField("quepe")}
              options={HEAD_OPTIONS}
              disabled={!selectedOfficer}
            />
            <SelectField
              label="Boina"
              value={form.boina}
              onChange={setField("boina")}
              options={HEAD_OPTIONS}
              disabled={!selectedOfficer}
            />
            <SelectField
              label="Camisa Masculina (Operacional / Passeio)"
              value={form.camisa}
              onChange={setField("camisa")}
              options={SHIRT_OPTIONS}
              disabled={!selectedOfficer}
            />
            <SelectField
              label="Camisa Combat Shirt Masculino Manga Longa"
              value={form.camisa_combat_manga_longa}
              onChange={setField("camisa_combat_manga_longa")}
              options={SIZE_OPTIONS}
              disabled={!selectedOfficer}
            />
            <SelectField
              label="Camiseta Gola Careca"
              value={form.camiseta_gola_careca}
              onChange={setField("camiseta_gola_careca")}
              options={SIZE_OPTIONS}
              disabled={!selectedOfficer}
            />

            <div style={styles.fieldFull}>
              <label style={styles.label}>
                Agasalho (Blusa + Calça) <span style={{ color: "var(--app-danger-text)" }}>*</span>
              </label>
              <div style={doubleGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Blusa do Agasalho</label>
                  <select
                    value={form.agasalho_blusa}
                    onChange={setField("agasalho_blusa")}
                    style={styles.input}
                    required
                    disabled={!selectedOfficer}
                  >
                    <option value="">Selecione</option>
                    {SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Calça do Agasalho</label>
                  <select
                    value={form.agasalho_calca}
                    onChange={setField("agasalho_calca")}
                    style={styles.input}
                    required
                    disabled={!selectedOfficer}
                  >
                    <option value="">Selecione</option>
                    {NUMBER_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <SelectField
              label="Meia"
              value={form.meia}
              onChange={setField("meia")}
              options={SOCK_OPTIONS}
              disabled={!selectedOfficer}
            />
          </div>

          <div style={styles.footerActions}>
            <button
              type="button"
              onClick={handleClear}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              Limpar Formulário
            </button>
            <button type="submit" style={{ ...styles.button, ...styles.primaryButton }}>
              Salvar Medidas
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default RomaneioMedidasPage;
