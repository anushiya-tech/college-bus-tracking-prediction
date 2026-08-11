from datetime import datetime

from database import db


class Route(db.Model):
    __tablename__ = "routes"

    id = db.Column(db.Integer, primary_key=True)
    route_code = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    start_point = db.Column(db.String(120), nullable=False)
    destination = db.Column(db.String(120), nullable=False)
    distance_km = db.Column(db.Float, nullable=False)
    duration_min = db.Column(db.Integer, nullable=False)
    color = db.Column(db.String(32), nullable=True)
    stops = db.relationship("Stop", backref="route", cascade="all, delete-orphan", lazy=True)
    buses = db.relationship("Bus", backref="route", cascade="all, delete-orphan", lazy=True)

    def to_dict(self, include_stops=True):
        ordered_stops = sorted(self.stops, key=lambda stop: stop.stop_order)
        payload = {
            "id": self.route_code,
            "number": self.route_code,
            "name": self.name,
            "start": self.start_point,
            "destination": self.destination,
            "distance": f"{self.distance_km:.1f} km",
            "duration": f"{self.duration_min} min",
            "distance_km": self.distance_km,
            "duration_min": self.duration_min,
            "stop_count": len(ordered_stops),
            "bus_count": len(self.buses),
        }
        if include_stops:
            payload["stops"] = [stop.name for stop in ordered_stops]
            payload["stop_details"] = [stop.to_dict() for stop in ordered_stops]
        return payload


class Stop(db.Model):
    __tablename__ = "stops"

    id = db.Column(db.Integer, primary_key=True)
    route_id = db.Column(db.Integer, db.ForeignKey("routes.id"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    stop_order = db.Column(db.Integer, nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "route_id": self.route.route_code if self.route else None,
            "name": self.name,
            "order": self.stop_order,
            "latitude": self.latitude,
            "longitude": self.longitude,
        }


class Bus(db.Model):
    __tablename__ = "buses"

    id = db.Column(db.Integer, primary_key=True)
    bus_code = db.Column(db.String(20), unique=True, nullable=False)
    bus_number = db.Column(db.String(32), nullable=False)
    route_id = db.Column(db.Integer, db.ForeignKey("routes.id"), nullable=False)
    current_stop = db.Column(db.String(120), nullable=False)
    next_stop = db.Column(db.String(120), nullable=False)
    current_stop_index = db.Column(db.Integer, nullable=False, default=0)
    speed_kmh = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(32), nullable=False)
    eta_minutes = db.Column(db.Integer, nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    progress_percent = db.Column(db.Integer, nullable=False, default=0)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self, include_route=True):
        payload = {
            "id": self.bus_code,
            "number": self.bus_number,
            "route_id": self.route.route_code if self.route else None,
            "route": self.route.name if self.route else "",
            "currentStop": self.current_stop,
            "nextStop": self.next_stop,
            "speed": self.speed_kmh,
            "status": self.status,
            "eta": self.eta_minutes,
            "location": {"x": self.latitude, "y": self.longitude},
            "progress": self.progress_percent,
            "lastUpdated": self.last_updated.isoformat() + "Z",
        }
        if include_route and self.route:
            payload["route_details"] = self.route.to_dict(include_stops=False)
        return payload


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    notification_type = db.Column(db.String(40), nullable=False)
    title = db.Column(db.String(160), nullable=False)
    description = db.Column(db.String(240), nullable=False)
    tone = db.Column(db.String(24), nullable=False)
    read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    bus_id = db.Column(db.String(20), nullable=True)
    route_id = db.Column(db.String(20), nullable=True)

    def to_dict(self):
        return {
            "id": f"N{self.id}",
            "type": self.notification_type,
            "title": self.title,
            "description": self.description,
            "time": humanize_time(self.created_at),
            "read": self.read,
            "tone": self.tone,
            "created_at": self.created_at.isoformat() + "Z",
            "bus_id": self.bus_id,
            "route_id": self.route_id,
        }


class ETAPrediction(db.Model):
    __tablename__ = "eta_predictions"

    id = db.Column(db.Integer, primary_key=True)
    bus_id = db.Column(db.String(20), nullable=True)
    stop_name = db.Column(db.String(120), nullable=False)
    current_speed = db.Column(db.Integer, nullable=False)
    traffic_condition = db.Column(db.String(24), nullable=False)
    eta_minutes = db.Column(db.Integer, nullable=False)
    expected_arrival_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(24), nullable=False)
    confidence = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "bus_id": self.bus_id,
            "stop_name": self.stop_name,
            "current_speed": self.current_speed,
            "traffic_condition": self.traffic_condition,
            "eta_minutes": self.eta_minutes,
            "expected_arrival_time": self.expected_arrival_time.isoformat() + "Z",
            "status": self.status,
            "confidence": self.confidence,
            "created_at": self.created_at.isoformat() + "Z",
        }


def humanize_time(dt: datetime) -> str:
    delta = datetime.utcnow() - dt
    minutes = max(int(delta.total_seconds() // 60), 0)
    if minutes < 1:
        return "just now"
    if minutes == 1:
        return "1 min ago"
    if minutes < 60:
        return f"{minutes} min ago"
    hours = minutes // 60
    if hours == 1:
        return "1 hour ago"
    return f"{hours} hours ago"
