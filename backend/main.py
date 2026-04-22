# main.py (entrada do container)
# Mantém uvicorn main:app, mas o app real fica em backend/app/main.py

from app.main import app  # noqa: F401
