from sqlalchemy import text


def ensure_police_schema_compatibility(engine) -> None:
    if engine.dialect.name == "postgresql":
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS presentation_date DATE;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS previous_opm VARCHAR(180);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS naturality_state VARCHAR(10);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS is_driver BOOLEAN NOT NULL DEFAULT FALSE;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS driver_category VARCHAR(30);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS driver_registration_number VARCHAR(40);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS driver_issue_date DATE;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS driver_expiration_date DATE;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS has_sat_pm BOOLEAN NOT NULL DEFAULT FALSE;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS sat_pm_category VARCHAR(80);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS pmesp_courses TEXT;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS education_level VARCHAR(120);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS higher_education_course VARCHAR(180);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS rg_state VARCHAR(10);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS civil_profession VARCHAR(120);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS spoken_languages TEXT;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS mother_name VARCHAR(200);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS father_name VARCHAR(200);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS marriage_date DATE;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS spouse_name VARCHAR(200);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS spouse_birth_date DATE;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS spouse_rg VARCHAR(30);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS spouse_rg_state VARCHAR(10);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS spouse_cpf VARCHAR(20);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS child_1_name VARCHAR(200);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS child_1_birth_date DATE;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS child_2_name VARCHAR(200);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS child_2_birth_date DATE;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS child_3_name VARCHAR(200);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS child_3_birth_date DATE;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS children_json TEXT;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS reference_point VARCHAR(180);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS nearest_unit_cpa VARCHAR(120);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS nearest_unit_btl VARCHAR(120);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS nearest_unit_cia VARCHAR(120);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS nearest_unit_phone VARCHAR(20);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS cell_phone VARCHAR(20);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS residential_phone VARCHAR(20);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS spouse_phone VARCHAR(20);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS message_phone VARCHAR(20);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS functional_email VARCHAR(180);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS personal_email VARCHAR(180);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS associate_cb_sd BOOLEAN NOT NULL DEFAULT FALSE;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS associate_afam BOOLEAN NOT NULL DEFAULT FALSE;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS associate_coopmil BOOLEAN NOT NULL DEFAULT FALSE;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS associate_adepom BOOLEAN NOT NULL DEFAULT FALSE;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS associate_apmdfesp BOOLEAN NOT NULL DEFAULT FALSE;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS associate_other VARCHAR(180);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS has_private_insurance BOOLEAN NOT NULL DEFAULT FALSE;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS private_insurance_details VARCHAR(180);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS private_insurance_phone VARCHAR(20);
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS observation TEXT;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS acknowledgement_date DATE;
                    ALTER TABLE rh.police_officers ADD COLUMN IF NOT EXISTS acknowledgement_signature VARCHAR(180);
                    """
                )
            )
        return

    if engine.dialect.name != "sqlite":
        return

    with engine.begin() as conn:
        tables = {
            row[0]
            for row in conn.execute(
                text("SELECT name FROM sqlite_master WHERE type='table'")
            ).fetchall()
        }

        if "police_officers" in tables:
            officer_columns = {
                row[1]
                for row in conn.execute(text("PRAGMA table_info(police_officers)")).fetchall()
            }

            if "rank" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN rank VARCHAR(50)"))
            if "presentation_date" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN presentation_date DATE"))
            if "sexual_orientation" not in officer_columns:
                conn.execute(
                    text("ALTER TABLE police_officers ADD COLUMN sexual_orientation VARCHAR(60)")
                )
            if "previous_opm" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN previous_opm VARCHAR(180)"))
            if "naturality_state" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN naturality_state VARCHAR(10)"))
            if "is_driver" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN is_driver BOOLEAN NOT NULL DEFAULT 0"))
            if "driver_category" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN driver_category VARCHAR(30)"))
            if "driver_registration_number" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN driver_registration_number VARCHAR(40)"))
            if "driver_issue_date" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN driver_issue_date DATE"))
            if "driver_expiration_date" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN driver_expiration_date DATE"))
            if "has_sat_pm" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN has_sat_pm BOOLEAN NOT NULL DEFAULT 0"))
            if "sat_pm_category" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN sat_pm_category VARCHAR(80)"))
            if "pmesp_courses" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN pmesp_courses TEXT"))
            if "education_level" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN education_level VARCHAR(120)"))
            if "higher_education_course" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN higher_education_course VARCHAR(180)"))
            if "blood_type" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN blood_type VARCHAR(10)"))
            if "external_unit_name" not in officer_columns:
                conn.execute(
                    text("ALTER TABLE police_officers ADD COLUMN external_unit_name VARCHAR(180)")
                )
            if "rg_state" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN rg_state VARCHAR(10)"))
            if "civil_profession" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN civil_profession VARCHAR(120)"))
            if "spoken_languages" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN spoken_languages TEXT"))
            if "mother_name" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN mother_name VARCHAR(200)"))
            if "father_name" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN father_name VARCHAR(200)"))
            if "marriage_date" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN marriage_date DATE"))
            if "spouse_name" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN spouse_name VARCHAR(200)"))
            if "spouse_birth_date" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN spouse_birth_date DATE"))
            if "spouse_rg" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN spouse_rg VARCHAR(30)"))
            if "spouse_rg_state" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN spouse_rg_state VARCHAR(10)"))
            if "spouse_cpf" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN spouse_cpf VARCHAR(20)"))
            if "child_1_name" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN child_1_name VARCHAR(200)"))
            if "child_1_birth_date" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN child_1_birth_date DATE"))
            if "child_2_name" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN child_2_name VARCHAR(200)"))
            if "child_2_birth_date" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN child_2_birth_date DATE"))
            if "child_3_name" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN child_3_name VARCHAR(200)"))
            if "child_3_birth_date" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN child_3_birth_date DATE"))
            if "children_json" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN children_json TEXT"))
            if "cep" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN cep VARCHAR(10)"))
            if "street" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN street VARCHAR(180)"))
            if "street_number" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN street_number VARCHAR(20)"))
            if "address_details" not in officer_columns:
                conn.execute(
                    text("ALTER TABLE police_officers ADD COLUMN address_details VARCHAR(120)")
                )
            if "neighborhood" not in officer_columns:
                conn.execute(
                    text("ALTER TABLE police_officers ADD COLUMN neighborhood VARCHAR(120)")
                )
            if "state" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN state VARCHAR(80)"))
            if "city" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN city VARCHAR(120)"))
            if "reference_point" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN reference_point VARCHAR(180)"))
            if "nearest_unit_cpa" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN nearest_unit_cpa VARCHAR(120)"))
            if "nearest_unit_btl" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN nearest_unit_btl VARCHAR(120)"))
            if "nearest_unit_cia" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN nearest_unit_cia VARCHAR(120)"))
            if "nearest_unit_phone" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN nearest_unit_phone VARCHAR(20)"))
            if "cell_phone" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN cell_phone VARCHAR(20)"))
            if "residential_phone" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN residential_phone VARCHAR(20)"))
            if "spouse_phone" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN spouse_phone VARCHAR(20)"))
            if "message_phone" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN message_phone VARCHAR(20)"))
            if "functional_email" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN functional_email VARCHAR(180)"))
            if "personal_email" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN personal_email VARCHAR(180)"))
            if "associate_cb_sd" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN associate_cb_sd BOOLEAN NOT NULL DEFAULT 0"))
            if "associate_afam" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN associate_afam BOOLEAN NOT NULL DEFAULT 0"))
            if "associate_coopmil" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN associate_coopmil BOOLEAN NOT NULL DEFAULT 0"))
            if "associate_adepom" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN associate_adepom BOOLEAN NOT NULL DEFAULT 0"))
            if "associate_apmdfesp" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN associate_apmdfesp BOOLEAN NOT NULL DEFAULT 0"))
            if "associate_other" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN associate_other VARCHAR(180)"))
            if "has_private_insurance" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN has_private_insurance BOOLEAN NOT NULL DEFAULT 0"))
            if "private_insurance_details" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN private_insurance_details VARCHAR(180)"))
            if "private_insurance_phone" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN private_insurance_phone VARCHAR(20)"))
            if "observation" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN observation TEXT"))
            if "acknowledgement_date" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN acknowledgement_date DATE"))
            if "acknowledgement_signature" not in officer_columns:
                conn.execute(text("ALTER TABLE police_officers ADD COLUMN acknowledgement_signature VARCHAR(180)"))
            return

        conn.execute(
            text(
                """
                CREATE TABLE police_officers (
                    id INTEGER NOT NULL PRIMARY KEY,
                    full_name VARCHAR(200) NOT NULL,
                    war_name VARCHAR(120) NOT NULL,
                    rank VARCHAR(50),
                    re_with_digit VARCHAR(30) NOT NULL,
                    presentation_date DATE,
                    admission_date DATE,
                    previous_opm VARCHAR(180),
                    unit_id INTEGER NOT NULL,
                    naturality_state VARCHAR(10),
                    is_driver BOOLEAN NOT NULL DEFAULT 0,
                    driver_category VARCHAR(30),
                    driver_registration_number VARCHAR(40),
                    driver_issue_date DATE,
                    driver_expiration_date DATE,
                    has_sat_pm BOOLEAN NOT NULL DEFAULT 0,
                    sat_pm_category VARCHAR(80),
                    pmesp_courses TEXT,
                    education_level VARCHAR(120),
                    higher_education_course VARCHAR(180),
                    blood_type VARCHAR(10),
                    cpf VARCHAR(20) NOT NULL,
                    rg VARCHAR(30),
                    rg_state VARCHAR(10),
                    birth_date DATE,
                    naturality VARCHAR(120),
                    nationality VARCHAR(120),
                    marital_status VARCHAR(60),
                    sexual_orientation VARCHAR(60),
                    civil_profession VARCHAR(120),
                    spoken_languages TEXT,
                    mother_name VARCHAR(200),
                    father_name VARCHAR(200),
                    marriage_date DATE,
                    spouse_name VARCHAR(200),
                    spouse_birth_date DATE,
                    spouse_rg VARCHAR(30),
                    spouse_rg_state VARCHAR(10),
                    spouse_cpf VARCHAR(20),
                    child_1_name VARCHAR(200),
                    child_1_birth_date DATE,
                    child_2_name VARCHAR(200),
                    child_2_birth_date DATE,
                    child_3_name VARCHAR(200),
                    child_3_birth_date DATE,
                    children_json TEXT,
                    external_unit_name VARCHAR(180),
                    cep VARCHAR(10),
                    street VARCHAR(180),
                    street_number VARCHAR(20),
                    address_details VARCHAR(120),
                    neighborhood VARCHAR(120),
                    state VARCHAR(80),
                    city VARCHAR(120),
                    reference_point VARCHAR(180),
                    nearest_unit_cpa VARCHAR(120),
                    nearest_unit_btl VARCHAR(120),
                    nearest_unit_cia VARCHAR(120),
                    nearest_unit_phone VARCHAR(20),
                    cell_phone VARCHAR(20),
                    residential_phone VARCHAR(20),
                    spouse_phone VARCHAR(20),
                    message_phone VARCHAR(20),
                    functional_email VARCHAR(180),
                    personal_email VARCHAR(180),
                    associate_cb_sd BOOLEAN NOT NULL DEFAULT 0,
                    associate_afam BOOLEAN NOT NULL DEFAULT 0,
                    associate_coopmil BOOLEAN NOT NULL DEFAULT 0,
                    associate_adepom BOOLEAN NOT NULL DEFAULT 0,
                    associate_apmdfesp BOOLEAN NOT NULL DEFAULT 0,
                    associate_other VARCHAR(180),
                    has_private_insurance BOOLEAN NOT NULL DEFAULT 0,
                    private_insurance_details VARCHAR(180),
                    private_insurance_phone VARCHAR(20),
                    observation TEXT,
                    acknowledgement_date DATE,
                    acknowledgement_signature VARCHAR(180),
                    address VARCHAR(300),
                    is_active BOOLEAN NOT NULL DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at DATETIME
                )
                """
            )
        )
        conn.execute(text("CREATE INDEX ix_police_officers_id ON police_officers (id)"))
        conn.execute(text("CREATE INDEX ix_police_officers_full_name ON police_officers (full_name)"))
        conn.execute(text("CREATE INDEX ix_police_officers_war_name ON police_officers (war_name)"))
        conn.execute(text("CREATE UNIQUE INDEX ix_police_officers_re_with_digit ON police_officers (re_with_digit)"))
        conn.execute(text("CREATE INDEX ix_police_officers_unit_id ON police_officers (unit_id)"))
        conn.execute(text("CREATE UNIQUE INDEX ix_police_officers_cpf ON police_officers (cpf)"))
