from pathlib import Path

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "college_bus_tracking.sqlite3"


def database_uri() -> str:
    return f"sqlite:///{DATABASE_PATH}"
