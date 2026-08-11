# College Bus Tracking & Prediction System

Dynamic full-stack college transportation dashboard built with:

- Frontend: HTML5, CSS3, JavaScript, Bootstrap 5
- Backend: Python, Flask, Flask-CORS, SQLAlchemy
- Database: SQLite

## Features

- Home, Dashboard, Live Tracking, Routes, ETA Prediction, Notifications, About
- Red-themed responsive UI
- Flask REST API
- SQLite persistence with seeded demo data
- Dynamic dashboard statistics
- Bus, route, stop, and notification management
- Simulated GPS tracking
- Rule-based ETA prediction

## Project Structure

```text
college-bus-tracking/
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── tracking.html
│   ├── routes.html
│   ├── prediction.html
│   ├── notifications.html
│   ├── about.html
│   ├── css/
│   ├── js/
│   └── assets/
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── database.py
│   ├── routes.py
│   ├── prediction.py
│   ├── seed.py
│   └── requirements.txt
├── README.md
└── .gitignore
```

## Setup

### 1) Create and activate a virtual environment

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### 2) Install backend dependencies

```powershell
cd backend
pip install -r requirements.txt
```

### 3) Start the Flask app

```powershell
python app.py
```

The app runs at:

```text
http://127.0.0.1:5000/
```

## How it works

- The Flask backend creates the SQLite database automatically on first run.
- Seed data is inserted the first time the app starts.
- The frontend uses `fetch()` to call the REST API.
- Tracking and ETA are simulated and rule-based, not real GPS or ML.

## API Endpoints

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/buses`
- `POST /api/buses`
- `GET /api/buses/<bus_code>`
- `PUT /api/buses/<bus_code>`
- `DELETE /api/buses/<bus_code>`
- `GET /api/routes`
- `POST /api/routes`
- `GET /api/routes/<route_code>`
- `PUT /api/routes/<route_code>`
- `DELETE /api/routes/<route_code>`
- `GET /api/stops?route_id=R1`
- `GET /api/tracking`
- `POST /api/predict-eta`
- `GET /api/notifications`
- `POST /api/notifications`
- `PUT /api/notifications/<notification_id>`
- `DELETE /api/notifications/<notification_id>`
- `POST /api/notifications/mark-all-read`

## Notes

- The ETA prediction is simulated and rule-based.
- The tracking system uses predefined coordinates and periodic frontend/backend updates.
- No API keys, passwords, or external services are required.

