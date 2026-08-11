import os
from pathlib import Path

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from database import db, database_uri
from models import Bus, ETAPrediction, Notification, Route, Stop
from routes import api
from seed import seed_database


BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
FRONTEND_DIR = PROJECT_DIR / "frontend"


def create_app():
    app = Flask(__name__, static_folder=None)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", database_uri())
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JSON_SORT_KEYS"] = False

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    app.register_blueprint(api, url_prefix="/api")

    @app.before_request
    def initialize_database():
        if getattr(app, "_db_ready", False):
            return
        with app.app_context():
            db.create_all()
            seed_database(db)
        app._db_ready = True

    @app.route("/api/health")
    def health():
        return jsonify({"ok": True, "message": "College Bus Tracking API is running"})

    @app.route("/")
    def root_index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.route("/<path:filename>")
    def frontend_assets(filename):
        target = FRONTEND_DIR / filename
        if target.is_file():
            return send_from_directory(FRONTEND_DIR, filename)
        return send_from_directory(FRONTEND_DIR, "index.html")

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
