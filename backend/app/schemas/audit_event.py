from datetime import datetime

from pydantic import BaseModel


class AuditEventOut(BaseModel):
    id: int
    module: str
    action: str
    resource_type: str
    resource_id: str | None = None
    status: str
    ip_address: str | None = None
    details: dict | None = None
    actor_user_id: int | None = None
    actor_name: str | None = None
    actor_cpf: str | None = None
    actor_unit_id: int | None = None
    target_user_id: int | None = None
    target_name: str | None = None
    target_cpf: str | None = None
    target_unit_id: int | None = None
    created_at: datetime
