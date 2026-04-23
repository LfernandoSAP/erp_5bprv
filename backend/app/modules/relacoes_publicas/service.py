import calendar
from datetime import date, timedelta

from app.modules.relacoes_publicas import repository
from app.shared.utils.scope import can_access_unit


def _build_birthday_for_year(birth_date: date, year: int) -> date:
    try:
        return birth_date.replace(year=year)
    except ValueError:
        # Officers born on Feb 29 appear on Feb 28 during non-leap years.
        return date(year, 2, 28)


def _serialize_officer(officer, birthday_date: date, reference_date: date) -> dict:
    unit = getattr(officer, "unit", None)
    unit_label = getattr(unit, "display_name", None) or getattr(unit, "name", None)
    current_age = reference_date.year - officer.birth_date.year
    if (reference_date.month, reference_date.day) < (officer.birth_date.month, officer.birth_date.day):
        current_age -= 1

    return {
        "id": officer.id,
        "full_name": officer.full_name,
        "war_name": officer.war_name,
        "rank": officer.rank,
        "re_with_digit": officer.re_with_digit,
        "unit_id": officer.unit_id,
        "unit_label": unit_label,
        "birth_date": officer.birth_date,
        "birthday_date": birthday_date,
        "current_age": current_age,
        "age_turning": birthday_date.year - officer.birth_date.year,
        "days_until_birthday": (birthday_date - reference_date).days,
        "is_today": birthday_date == reference_date,
    }


def _sort_key(item: dict):
    return (
        item["birthday_date"],
        item.get("rank") or "",
        item.get("war_name") or "",
        item.get("full_name") or "",
    )


def _filter_accessible_officers(db, current_user, unit_id: int | None):
    if unit_id is not None and not can_access_unit(current_user, unit_id):
        raise PermissionError("Forbidden")

    officers = repository.list_active_officers_with_birth_date(db, current_user)
    if unit_id is not None:
        officers = [officer for officer in officers if officer.unit_id == unit_id]
    return officers


def list_weekly_birthdays(
    *,
    db,
    current_user,
    reference_date: date,
    unit_id: int | None = None,
):
    officers = _filter_accessible_officers(db, current_user, unit_id)
    period_start = reference_date - timedelta(days=reference_date.weekday())
    period_end = period_start + timedelta(days=6)

    items = []
    for officer in officers:
        candidate_years = {period_start.year, period_end.year}
        for year in candidate_years:
            birthday_date = _build_birthday_for_year(officer.birth_date, year)
            if period_start <= birthday_date <= period_end:
                items.append(_serialize_officer(officer, birthday_date, reference_date))

    items.sort(key=_sort_key)
    return {
        "reference_date": reference_date,
        "period_start": period_start,
        "period_end": period_end,
        "period_label": f"Semana de {period_start.strftime('%d/%m/%Y')} a {period_end.strftime('%d/%m/%Y')}",
        "total": len(items),
        "items": items,
    }


def list_monthly_birthdays(
    *,
    db,
    current_user,
    year: int,
    month: int,
    unit_id: int | None = None,
):
    officers = _filter_accessible_officers(db, current_user, unit_id)
    last_day = calendar.monthrange(year, month)[1]
    reference_date = date.today()
    period_start = date(year, month, 1)
    period_end = date(year, month, last_day)

    items = []
    for officer in officers:
        birthday_date = _build_birthday_for_year(officer.birth_date, year)
        if birthday_date.month == month:
            items.append(_serialize_officer(officer, birthday_date, reference_date))

    items.sort(key=_sort_key)
    return {
        "reference_date": reference_date,
        "period_start": period_start,
        "period_end": period_end,
        "period_label": period_start.strftime("%m/%Y"),
        "total": len(items),
        "items": items,
    }


def list_upcoming_birthdays(
    *,
    db,
    current_user,
    reference_date: date,
    days: int = 7,
    unit_id: int | None = None,
):
    officers = _filter_accessible_officers(db, current_user, unit_id)
    period_start = reference_date
    period_end = reference_date + timedelta(days=max(days, 1) - 1)

    items = []
    for officer in officers:
        candidate_years = {period_start.year, period_end.year}
        for year in candidate_years:
            birthday_date = _build_birthday_for_year(officer.birth_date, year)
            if period_start <= birthday_date <= period_end:
                items.append(_serialize_officer(officer, birthday_date, reference_date))

    items.sort(key=_sort_key)
    return {
        "reference_date": reference_date,
        "period_start": period_start,
        "period_end": period_end,
        "period_label": f"Proximos {max(days, 1)} dias: {period_start.strftime('%d/%m/%Y')} a {period_end.strftime('%d/%m/%Y')}",
        "total": len(items),
        "items": items,
    }
