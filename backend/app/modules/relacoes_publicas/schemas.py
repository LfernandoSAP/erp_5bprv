from datetime import date

from pydantic import BaseModel


class BirthdayOfficerOut(BaseModel):
    id: int
    full_name: str
    war_name: str
    rank: str | None = None
    re_with_digit: str
    unit_id: int | None = None
    unit_label: str | None = None
    birth_date: date
    birthday_date: date
    current_age: int
    age_turning: int
    days_until_birthday: int
    is_today: bool = False


class BirthdayListOut(BaseModel):
    reference_date: date
    period_start: date
    period_end: date
    period_label: str
    total: int
    items: list[BirthdayOfficerOut]
