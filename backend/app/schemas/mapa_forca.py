from datetime import datetime

from pydantic import BaseModel, Field


class MapaForcaBase(BaseModel):
    viatura_id: int
    seq: int | None = Field(default=None, ge=1)
    pel: int = Field(default=0, ge=0, le=2)
    grafismo: str | None = None
    tag_sem_parar: str | None = None
    observacao: str | None = None


class MapaForcaCreate(MapaForcaBase):
    pass


class MapaForcaUpdate(BaseModel):
    viatura_id: int | None = None
    seq: int | None = Field(default=None, ge=1)
    pel: int | None = Field(default=None, ge=0, le=2)
    grafismo: str | None = None
    tag_sem_parar: str | None = None
    observacao: str | None = None


class MapaForcaRowOut(BaseModel):
    id: int | None = None
    viatura_id: int
    seq: int
    bprv: int
    cia: int
    pel: int
    grupo: str | None = None
    situacao: str | None = None
    prefixo: str
    placa: str | None = None
    marca: str | None = None
    modelo: str | None = None
    tipo_veiculo: str | None = None
    rodas: str | None = None
    cor: str | None = None
    chassi: str | None = None
    renavam: str | None = None
    ano_fab: str | None = None
    ano_mod: str | None = None
    orgao: str | None = None
    patrimonio: str | None = None
    locadora: str | None = None
    grafismo: str | None = None
    tag_sem_parar: str | None = None
    telemetria: str | None = None
    observacao: str | None = None
    unidade_id: int | None = None
    unidade_label: str | None = None
    policial_id: int | None = None
    policial_re: str | None = None
    policial_nome: str | None = None
    policial_posto: str | None = None
    ultima_atualizacao: datetime | None = None


class MapaForcaResumoOut(BaseModel):
    ultima_atualizacao: str | None = None
    total_registros: int
    tabela_grupo_situacao_orgao: list[dict]
    tabela_tipo_orgao: list[dict]
    tabela_grafismo: dict
    tabela_descaracterizadas: dict
    tabela_tag: dict
    tabela_telemetria: dict


class BuscarViaturaOut(BaseModel):
    viatura_id: int
    prefixo: str
    seq: int
    bprv: int
    cia: int
    pel: int
    grupo: str | None = None
    placa: str | None = None
    marca: str | None = None
    modelo: str | None = None
    tipo_veiculo: str | None = None
    rodas: str | None = None
    cor: str | None = None
    chassi: str | None = None
    renavam: str | None = None
    ano_fab: str | None = None
    ano_mod: str | None = None
    orgao: str | None = None
    patrimonio: str | None = None
    locadora: str | None = None
    telemetria: str | None = None
    situacao: str | None = None
    unidade_id: int | None = None
    unidade_label: str | None = None
    policial_id: int | None = None
    policial_re: str | None = None
    policial_nome: str | None = None
    policial_posto: str | None = None
