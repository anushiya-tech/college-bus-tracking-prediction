from datetime import datetime, timedelta


TRAFFIC_MULTIPLIERS = {
    "light": 0.88,
    "moderate": 1.0,
    "heavy": 1.22,
    "peak-hour": 1.35,
}


def predict_eta(bus, stop, route, current_speed, traffic_condition):
    stops = sorted(route.stops, key=lambda item: item.stop_order)
    stop_names = [item.name for item in stops]
    current_index = max(bus.current_stop_index, 0)
    target_index = stop_names.index(stop.name) if stop.name in stop_names else current_index
    remaining_stops = max(target_index - current_index, 0)
    distance_factor = max(route.distance_km / max(len(stops) - 1, 1), 1.2)
    traffic_multiplier = TRAFFIC_MULTIPLIERS.get(traffic_condition, 1.0)
    speed_factor = max(current_speed, 12)
    eta_minutes = max(
        2,
        round(((remaining_stops * distance_factor * 3.6) / speed_factor) * traffic_multiplier + 2),
    )
    expected_arrival = datetime.utcnow() + timedelta(minutes=eta_minutes)
    confidence = max(
        68,
        min(
            98,
            round(
                96
                - abs(speed_factor - bus.speed_kmh) * 0.9
                - (traffic_multiplier - 1) * 18
                - remaining_stops * 1.5
            ),
        ),
    )
    status = "On Time" if eta_minutes <= 10 else "Arriving" if eta_minutes <= 16 else "Delayed"
    return {
        "eta_minutes": eta_minutes,
        "expected_arrival_time": expected_arrival,
        "status": status,
        "confidence": confidence,
        "traffic_multiplier": traffic_multiplier,
        "remaining_stops": remaining_stops,
    }
