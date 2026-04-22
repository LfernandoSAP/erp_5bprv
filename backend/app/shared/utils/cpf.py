def normalize_cpf(value: str | None) -> str:
    if value is None:
        return ""
    return "".join(ch for ch in str(value) if ch.isdigit())


def is_valid_cpf_length(value: str | None) -> bool:
    return len(normalize_cpf(value)) == 11
