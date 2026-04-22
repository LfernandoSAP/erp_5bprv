import { appShellStyles as styles } from "../components/appShellStyles";
import { formatServiceTime } from "../utils/policeOfficerUtils";

function getOfficerChildren(officer) {
  if (Array.isArray(officer.children) && officer.children.length > 0) {
    return officer.children.filter((child) => child?.nome || child?.dataNascimento);
  }

  return [1, 2, 3]
    .map((index) => ({
      nome: officer[`child_${index}_name`],
      dataNascimento: officer[`child_${index}_birth_date`],
    }))
    .filter((child) => child.nome || child.dataNascimento);
}

function PoliceOfficerDetailsPanel({ officer, unitMap }) {
  const childrenFields = getOfficerChildren(officer);

  return (
    <>
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Status</p>
          <p style={styles.summaryValue}>{officer.is_active ? "Ativo" : "Inativo"}</p>
        </div>
        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Tempo de serviço</p>
          <p style={styles.summaryValue}>{formatServiceTime(officer.admission_date)}</p>
        </div>
        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Tipo sanguíneo</p>
          <p style={styles.summaryValue}>{officer.blood_type || "-"}</p>
        </div>
        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Motorista</p>
          <p style={styles.summaryValue}>{officer.is_driver ? "Sim" : "Não"}</p>
        </div>
      </div>

      <DetailsSection
        title="Dados pessoais"
        fields={[
          ["Nome completo", officer.full_name],
          ["Nome de guerra", officer.war_name],
          ["Posto/Graduação", officer.rank],
          ["RE-DC", officer.re_with_digit],
          ["Data de apresentação", formatDate(officer.presentation_date)],
          ["Data de admissão", formatDate(officer.admission_date)],
          ["CPF", formatCpf(officer.cpf)],
          ["RG", joinValues([officer.rg, officer.rg_state], " / ")],
          ["Data de nascimento", formatDate(officer.birth_date)],
          ["Naturalidade", joinValues([officer.naturality, officer.naturality_state], " / ")],
          ["Nacionalidade", officer.nationality],
          ["Unidade", officer.unit_label || unitMap[officer.unit_id] || "-"],
          ["OPM anterior", officer.previous_opm],
          ["Profissão civil", officer.civil_profession],
          ["Idiomas", officer.spoken_languages],
          ["Cursos PMESP", officer.pmesp_courses],
          ["Grau de instrução", officer.education_level],
          ["Curso superior", officer.higher_education_course],
        ]}
      />

      <DetailsSection
        title="Motorista e SAT PM"
        fields={[
          ["Motorista", officer.is_driver ? "Sim" : "Não"],
          ["CAT", officer.driver_category],
          ["Nº do registro", officer.driver_registration_number],
          ["Expedição", formatDate(officer.driver_issue_date)],
          ["Validade", formatDate(officer.driver_expiration_date)],
          ["SAT PM", officer.has_sat_pm ? "Sim" : "Não"],
        ]}
      />

      <DetailsSection
        title="Família"
        fields={[
          ["Nome da mãe", officer.mother_name],
          ["Nome do pai", officer.father_name],
          ["Estado civil", officer.marital_status],
          ["Data do casamento", formatDate(officer.marriage_date)],
          ["Nome do cônjuge", officer.spouse_name],
          ["Nascimento do cônjuge", formatDate(officer.spouse_birth_date)],
          ["RG do cônjuge", joinValues([officer.spouse_rg, officer.spouse_rg_state], " / ")],
          ["CPF do cônjuge", formatCpf(officer.spouse_cpf)],
          ...(childrenFields.length
            ? childrenFields.map((child, index) => [
                `${index + 1}º filho`,
                joinValues([child.nome, formatDate(child.dataNascimento)], " - "),
              ])
            : [["Filhos", "-"]]),
        ]}
      />

      <DetailsSection
        title="Endereço e contatos"
        fields={[
          ["CEP", formatCep(officer.cep)],
          ["Rua", officer.street],
          ["Número", officer.street_number],
          ["Complemento", officer.address_details],
          ["Bairro", officer.neighborhood],
          ["Cidade/UF", joinValues([officer.city, officer.state], " / ")],
          ["Ponto de referência", officer.reference_point],
          ["Endereço resumido", officer.address],
          ["Telefone celular", formatPhone(officer.cell_phone)],
          ["Telefone residencial", formatPhone(officer.residential_phone)],
          ["Telefone do cônjuge", formatPhone(officer.spouse_phone)],
          ["Telefone para recado", formatPhone(officer.message_phone)],
          ["E-mail funcional", officer.functional_email],
          ["E-mail particular", officer.personal_email],
        ]}
      />

      <DetailsSection
        title="Vínculos e observações"
        fields={[
          ["CPA", officer.nearest_unit_cpa],
          ["BTL", officer.nearest_unit_btl],
          ["CIA", officer.nearest_unit_cia],
          ["Fone", formatPhone(officer.nearest_unit_phone)],
          ["Associado", formatAssociations(officer)],
          ["Outras associações", officer.associate_other],
          ["Seguro particular", officer.has_private_insurance ? "Sim" : "Não"],
          ["Detalhes do seguro", officer.private_insurance_details],
          ["Telefone do seguro", formatPhone(officer.private_insurance_phone)],
          ["Observação", officer.observation],
          ["Ciência em", formatDate(officer.acknowledgement_date)],
          ["Assinatura do PM", officer.acknowledgement_signature],
        ]}
      />
    </>
  );
}

function DetailsSection({ title, fields }) {
  return (
    <div style={{ marginTop: "24px" }}>
      <h3 style={{ ...styles.sectionTitle, marginBottom: "12px" }}>{title}</h3>
      <div style={styles.formGrid}>
        {fields.map(([label, value]) => (
          <DetailField key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div style={styles.field}>
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

function joinValues(values, separator = " | ") {
  const filtered = values.filter((value) => value && value !== "-");
  return filtered.length ? filtered.join(separator) : "-";
}

function formatCpf(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 11) return value || "-";
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCep(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 8) return value || "-";
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return value || "-";
}

function formatAssociations(officer) {
  const associations = [];
  if (officer.associate_cb_sd) associations.push("CB/SD");
  if (officer.associate_afam) associations.push("AFAM");
  if (officer.associate_coopmil) associations.push("COOPMIL");
  if (officer.associate_adepom) associations.push("ADEPOM");
  if (officer.associate_apmdfesp) associations.push("APMDFESP");
  return associations.length ? associations.join(", ") : "-";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

export default PoliceOfficerDetailsPanel;
