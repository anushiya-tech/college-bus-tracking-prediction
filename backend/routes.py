from datetime import datetime

from flask import Blueprint, jsonify, request

from database import db
from models import Bus, ETAPrediction, Notification, Route, Stop
from prediction import predict_eta

api = Blueprint("api", __name__)

TRAFFIC_BIAS = {
    "light": 0.9,
    "moderate": 1.0,
    "heavy": 1.2,
    "peak-hour": 1.35,
}


def api_error(message, status_code=400):
    return jsonify({"ok": False, "error": message}), status_code


def parse_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def parse_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def simulate_tracking_tick():
    routes = {route.route_code: route for route in Route.query.all()}
    now = datetime.utcnow()
    changed = False
    for bus in Bus.query.all():
        delta = (now - bus.last_updated).total_seconds()
        if delta < 4:
            continue
        route_code = bus.route.route_code if bus.route else None
        if not route_code and bus.route_id:
            route_obj = Route.query.get(bus.route_id)
            route_code = route_obj.route_code if route_obj else None
        route = routes.get(route_code)
        if not route:
            continue
        stops = sorted(route.stops, key=lambda stop: stop.stop_order)
        if not stops:
            continue
        next_index = min(bus.current_stop_index + 1, len(stops) - 1)
        status_lower = bus.status.lower()
        if status_lower == "offline":
            continue

        bus.current_stop_index = next_index
        bus.current_stop = stops[next_index].name
        bus.next_stop = stops[min(next_index + 1, len(stops) - 1)].name
        bus.latitude = stops[next_index].latitude
        bus.longitude = stops[next_index].longitude
        bus.progress_percent = min(100, bus.progress_percent + (2 if "delay" in status_lower else 4))
        bus.eta_minutes = max(2, bus.eta_minutes - 1)
        if "delay" in status_lower:
            bus.status = "Delayed"
        elif bus.eta_minutes <= 6:
            bus.status = "Arriving"
        else:
            bus.status = "On Time"
        bus.last_updated = now
        bus.last_seen = now
        changed = True
    if changed:
        db.session.commit()


@api.route("/dashboard", methods=["GET"])
def dashboard():
    simulate_tracking_tick()
    buses = Bus.query.all()
    unread = Notification.query.filter_by(read=False).count()
    active = sum(1 for bus in buses if bus.status.lower() != "offline")
    on_time = sum(1 for bus in buses if bus.status.lower() in {"on time", "arriving"})
    delayed = sum(1 for bus in buses if "delay" in bus.status.lower())
    routes = Route.query.count()
    return jsonify(
        {
            "ok": True,
            "stats": {
                "active_buses": active,
                "on_time_buses": on_time,
                "delayed_buses": delayed,
                "total_routes": routes,
                "unread_notifications": unread,
            },
            "buses": [bus.to_dict() for bus in buses],
        }
    )


@api.route("/buses", methods=["GET", "POST"])
def buses():
    if request.method == "POST":
        data = request.get_json(force=True, silent=True) or {}
        route = Route.query.filter_by(route_code=data.get("route_id")).first()
        if not route:
            return api_error("Valid route_id is required.")
        required = ["bus_code", "bus_number", "current_stop", "next_stop", "speed", "status", "eta", "latitude", "longitude"]
        for key in required:
            if data.get(key) in (None, ""):
                return api_error(f"{key} is required.")
        bus = Bus(
            bus_code=data["bus_code"],
            bus_number=data["bus_number"],
            route_id=route.id,
            current_stop=data["current_stop"],
            next_stop=data["next_stop"],
            current_stop_index=parse_int(data.get("current_stop_index"), 0),
            speed_kmh=parse_int(data.get("speed")),
            status=data.get("status"),
            eta_minutes=parse_int(data.get("eta")),
            latitude=parse_float(data.get("latitude")),
            longitude=parse_float(data.get("longitude")),
            progress_percent=parse_int(data.get("progress_percent"), 0),
            last_updated=datetime.utcnow(),
            last_seen=datetime.utcnow(),
        )
        db.session.add(bus)
        db.session.commit()
        return jsonify({"ok": True, "bus": bus.to_dict()}), 201

    simulate_tracking_tick()
    return jsonify({"ok": True, "buses": [bus.to_dict() for bus in Bus.query.all()]})


@api.route("/buses/<bus_code>", methods=["GET", "PUT", "DELETE"])
def bus_detail(bus_code):
    bus = Bus.query.filter_by(bus_code=bus_code).first_or_404()
    if request.method == "GET":
        simulate_tracking_tick()
        db.session.refresh(bus)
        return jsonify({"ok": True, "bus": bus.to_dict()})
    if request.method == "DELETE":
        db.session.delete(bus)
        db.session.commit()
        return jsonify({"ok": True, "deleted": bus_code})

    data = request.get_json(force=True, silent=True) or {}
    if "status" in data:
        bus.status = data["status"]
    if "current_stop" in data:
        bus.current_stop = data["current_stop"]
    if "next_stop" in data:
        bus.next_stop = data["next_stop"]
    if "speed" in data:
        bus.speed_kmh = parse_int(data["speed"], bus.speed_kmh)
    if "eta" in data:
        bus.eta_minutes = parse_int(data["eta"], bus.eta_minutes)
    if "progress_percent" in data:
        bus.progress_percent = parse_int(data["progress_percent"], bus.progress_percent)
    if "latitude" in data:
        bus.latitude = parse_float(data["latitude"], bus.latitude)
    if "longitude" in data:
        bus.longitude = parse_float(data["longitude"], bus.longitude)
    bus.last_updated = datetime.utcnow()
    db.session.commit()
    return jsonify({"ok": True, "bus": bus.to_dict()})


@api.route("/routes", methods=["GET", "POST"])
def routes():
    if request.method == "POST":
        data = request.get_json(force=True, silent=True) or {}
        required = ["route_code", "name", "start_point", "destination", "distance_km", "duration_min"]
        for key in required:
            if data.get(key) in (None, ""):
                return api_error(f"{key} is required.")
        route = Route(
            route_code=data["route_code"],
            name=data["name"],
            start_point=data["start_point"],
            destination=data["destination"],
            distance_km=parse_float(data["distance_km"]),
            duration_min=parse_int(data["duration_min"]),
        )
        db.session.add(route)
        db.session.commit()
        return jsonify({"ok": True, "route": route.to_dict()}), 201
    return jsonify({"ok": True, "routes": [route.to_dict() for route in Route.query.all()]})


@api.route("/routes/<route_code>", methods=["GET", "PUT", "DELETE"])
def route_detail(route_code):
    route = Route.query.filter_by(route_code=route_code).first_or_404()
    if request.method == "GET":
        return jsonify({"ok": True, "route": route.to_dict()})
    if request.method == "DELETE":
        db.session.delete(route)
        db.session.commit()
        return jsonify({"ok": True, "deleted": route_code})
    data = request.get_json(force=True, silent=True) or {}
    if "name" in data:
        route.name = data["name"]
    if "start_point" in data:
        route.start_point = data["start_point"]
    if "destination" in data:
        route.destination = data["destination"]
    if "distance_km" in data:
        route.distance_km = parse_float(data["distance_km"], route.distance_km)
    if "duration_min" in data:
        route.duration_min = parse_int(data["duration_min"], route.duration_min)
    db.session.commit()
    return jsonify({"ok": True, "route": route.to_dict()})


@api.route("/stops", methods=["GET"])
def stops():
    route_code = request.args.get("route_id")
    query = Stop.query.join(Route)
    if route_code:
        query = query.filter(Route.route_code == route_code)
    all_stops = sorted(query.all(), key=lambda stop: (stop.route_id, stop.stop_order))
    return jsonify({"ok": True, "stops": [stop.to_dict() for stop in all_stops]})


@api.route("/tracking", methods=["GET"])
def tracking():
    simulate_tracking_tick()
    buses = [bus.to_dict() for bus in Bus.query.all()]
    for item in buses:
        item["lastUpdated"] = datetime.utcnow().isoformat() + "Z"
    return jsonify({"ok": True, "demo": "Demo GPS Simulation", "buses": buses})


@api.route("/predict-eta", methods=["POST"])
def predict_eta_endpoint():
    data = request.get_json(force=True, silent=True) or {}
    bus_id = data.get("bus_id")
    stop_name = data.get("stop")
    current_speed = parse_int(data.get("current_speed"), 28)
    traffic_condition = str(data.get("traffic_condition", "moderate")).lower()

    bus = Bus.query.filter_by(bus_code=bus_id).first() if bus_id else None
    if not bus:
        bus = Bus.query.first()
    if not bus:
        return api_error("No bus data available.", 404)

    route = bus.route
    stop = None
    if stop_name:
        stop = Stop.query.filter_by(route_id=route.id, name=stop_name).first()
    if not stop:
        ordered = sorted(route.stops, key=lambda item: item.stop_order)
        stop = ordered[-1]

    result = predict_eta(bus, stop, route, current_speed, traffic_condition)
    record = ETAPrediction(
        bus_id=bus.bus_code,
        stop_name=stop.name,
        current_speed=current_speed,
        traffic_condition=traffic_condition,
        eta_minutes=result["eta_minutes"],
        expected_arrival_time=result["expected_arrival_time"],
        status=result["status"],
        confidence=result["confidence"],
        created_at=datetime.utcnow(),
    )
    db.session.add(record)
    db.session.commit()

    return jsonify(
        {
            "ok": True,
            "simulation": True,
            "bus": bus.to_dict(),
            "route": route.to_dict(),
            "prediction": {
                "eta_minutes": result["eta_minutes"],
                "expected_arrival_time": result["expected_arrival_time"].isoformat() + "Z",
                "status": result["status"],
                "confidence": result["confidence"],
                "traffic_condition": traffic_condition,
                "note": "Simulated/rule-based ETA. Replace with ML later if needed.",
            },
        }
    )


@api.route("/notifications", methods=["GET", "POST"])
def notifications():
    if request.method == "POST":
        data = request.get_json(force=True, silent=True) or {}
        required = ["notification_type", "title", "description"]
        for key in required:
            if data.get(key) in (None, ""):
                return api_error(f"{key} is required.")
        notification = Notification(
            notification_type=data["notification_type"],
            title=data["title"],
            description=data["description"],
            tone=data.get("tone", "announcement"),
            read=bool(data.get("read", False)),
            created_at=datetime.utcnow(),
            bus_id=data.get("bus_id"),
            route_id=data.get("route_id"),
        )
        db.session.add(notification)
        db.session.commit()
        return jsonify({"ok": True, "notification": notification.to_dict()}), 201

    rows = sorted(Notification.query.all(), key=lambda item: item.created_at, reverse=True)
    return jsonify({"ok": True, "notifications": [row.to_dict() for row in rows], "unread": sum(1 for row in rows if not row.read)})


@api.route("/notifications/mark-all-read", methods=["POST", "PUT"])
def mark_all_read():
    rows = Notification.query.all()
    for row in rows:
        row.read = True
    db.session.commit()
    return jsonify({"ok": True, "updated": len(rows)})


@api.route("/notifications/<notification_id>", methods=["PUT", "DELETE"])
def notification_detail(notification_id):
    numeric_id = notification_id.replace("N", "")
    row = Notification.query.get_or_404(numeric_id)
    if request.method == "DELETE":
        db.session.delete(row)
        db.session.commit()
        return jsonify({"ok": True, "deleted": notification_id})
    data = request.get_json(force=True, silent=True) or {}
    if "read" in data:
        row.read = bool(data["read"])
    db.session.commit()
    return jsonify({"ok": True, "notification": row.to_dict()})
