from datetime import datetime, timedelta

from models import Bus, ETAPrediction, Notification, Route, Stop


def seed_database(db):
    if Route.query.count():
        return

    routes_data = [
        {
            "route_code": "R1",
            "name": "North Gate - Main Campus",
            "start_point": "North Gate",
            "destination": "Main Campus",
            "distance_km": 11.5,
            "duration_min": 28,
            "stops": [
                ("North Gate", 13.085, 80.258),
                ("Bus Stand", 13.086, 80.261),
                ("Library Junction", 13.088, 80.266),
                ("CSE Block", 13.091, 80.271),
                ("Main Auditorium", 13.094, 80.277),
                ("Main Campus", 13.097, 80.281),
            ],
        },
        {
            "route_code": "R2",
            "name": "Hostel Loop",
            "start_point": "Girls Hostel",
            "destination": "Admin Block",
            "distance_km": 7.8,
            "duration_min": 21,
            "stops": [
                ("Girls Hostel", 13.078, 80.259),
                ("Boys Hostel", 13.080, 80.264),
                ("Canteen", 13.083, 80.269),
                ("Library Junction", 13.088, 80.266),
                ("Admin Block", 13.092, 80.271),
            ],
        },
        {
            "route_code": "R3",
            "name": "City Center Express",
            "start_point": "City Center",
            "destination": "College Gate",
            "distance_km": 16.2,
            "duration_min": 34,
            "stops": [
                ("City Center", 13.062, 80.251),
                ("City Mall", 13.067, 80.256),
                ("Bus Depot", 13.071, 80.261),
                ("College Gate", 13.076, 80.266),
            ],
        },
        {
            "route_code": "R4",
            "name": "Railway Station Shuttle",
            "start_point": "Railway Station",
            "destination": "Sports Complex",
            "distance_km": 9.1,
            "duration_min": 24,
            "stops": [
                ("Railway Station", 13.072, 80.242),
                ("Police Quarters", 13.077, 80.248),
                ("Sports Complex", 13.082, 80.255),
                ("ECE Block", 13.088, 80.262),
            ],
        },
        {
            "route_code": "R5",
            "name": "East Wing Loop",
            "start_point": "East Gate",
            "destination": "Mechanical Block",
            "distance_km": 8.6,
            "duration_min": 22,
            "stops": [
                ("East Gate", 13.094, 80.244),
                ("Pharmacy Block", 13.096, 80.248),
                ("Mechanical Block", 13.099, 80.254),
                ("Research Center", 13.101, 80.259),
            ],
        },
        {
            "route_code": "R6",
            "name": "South Campus Shuttle",
            "start_point": "South Gate",
            "destination": "Main Hostel",
            "distance_km": 10.4,
            "duration_min": 26,
            "stops": [
                ("South Gate", 13.071, 80.285),
                ("Main Hostel", 13.075, 80.289),
                ("Auditorium Circle", 13.080, 80.286),
                ("Main Campus", 13.097, 80.281),
            ],
        },
        {
            "route_code": "R7",
            "name": "Library Special",
            "start_point": "Main Gate",
            "destination": "Central Library",
            "distance_km": 5.8,
            "duration_min": 16,
            "stops": [
                ("Main Gate", 13.090, 80.254),
                ("Central Library", 13.089, 80.262),
                ("Digital Lab", 13.087, 80.268),
            ],
        },
        {
            "route_code": "R8",
            "name": "Medical Wing Connector",
            "start_point": "Medical Center",
            "destination": "Academic Block",
            "distance_km": 6.9,
            "duration_min": 18,
            "stops": [
                ("Medical Center", 13.084, 80.240),
                ("Academic Block", 13.088, 80.248),
                ("Admin Block", 13.092, 80.271),
            ],
        },
        {
            "route_code": "R9",
            "name": "West End Circular",
            "start_point": "West Gate",
            "destination": "Campus Plaza",
            "distance_km": 12.3,
            "duration_min": 30,
            "stops": [
                ("West Gate", 13.088, 80.236),
                ("Campus Plaza", 13.091, 80.243),
                ("Student Center", 13.094, 80.250),
                ("CSE Block", 13.091, 80.271),
            ],
        },
        {
            "route_code": "R10",
            "name": "Technology Park Link",
            "start_point": "Tech Park",
            "destination": "Innovation Hub",
            "distance_km": 14.1,
            "duration_min": 32,
            "stops": [
                ("Tech Park", 13.100, 80.236),
                ("Innovation Hub", 13.104, 80.242),
                ("Design Studio", 13.101, 80.249),
                ("Main Campus", 13.097, 80.281),
            ],
        },
        {
            "route_code": "R11",
            "name": "North Hostel Shuttle",
            "start_point": "North Hostel",
            "destination": "Library Gate",
            "distance_km": 8.1,
            "duration_min": 21,
            "stops": [
                ("North Hostel", 13.102, 80.258),
                ("Library Gate", 13.095, 80.263),
                ("Library Junction", 13.088, 80.266),
                ("Main Campus", 13.097, 80.281),
            ],
        },
        {
            "route_code": "R12",
            "name": "Exam Hall Express",
            "start_point": "Exam Hall",
            "destination": "Central Auditorium",
            "distance_km": 9.7,
            "duration_min": 23,
            "stops": [
                ("Exam Hall", 13.082, 80.279),
                ("Central Auditorium", 13.089, 80.275),
                ("Canteen", 13.083, 80.269),
                ("Main Campus", 13.097, 80.281),
            ],
        },
    ]

    route_models = []
    for route_data in routes_data:
      route = Route(
          route_code=route_data["route_code"],
          name=route_data["name"],
          start_point=route_data["start_point"],
          destination=route_data["destination"],
          distance_km=route_data["distance_km"],
          duration_min=route_data["duration_min"],
      )
      db.session.add(route)
      db.session.flush()
      for index, (stop_name, lat, lng) in enumerate(route_data["stops"], start=1):
          db.session.add(
              Stop(
                  route_id=route.id,
                  name=stop_name,
                  stop_order=index,
                  latitude=lat,
                  longitude=lng,
              )
          )
      route_models.append(route)

    bus_seed = [
        ("BUS-101", "CB-101", "R1", 0, 32, "On Time", 6, 44),
        ("BUS-102", "CB-102", "R2", 1, 24, "Delayed", 9, 38),
        ("BUS-103", "CB-103", "R3", 1, 38, "Arriving", 12, 51),
        ("BUS-104", "CB-104", "R4", 0, 29, "On Time", 5, 76),
        ("BUS-105", "CB-105", "R5", 0, 22, "Offline", 4, 21),
        ("BUS-106", "CB-106", "R6", 1, 26, "On Time", 8, 33),
        ("BUS-107", "CB-107", "R7", 0, 28, "On Time", 5, 29),
        ("BUS-108", "CB-108", "R8", 1, 24, "Delayed", 11, 36),
        ("BUS-109", "CB-109", "R9", 0, 31, "On Time", 7, 43),
        ("BUS-110", "CB-110", "R10", 1, 35, "Arriving", 10, 55),
        ("BUS-111", "CB-111", "R11", 2, 27, "On Time", 6, 61),
        ("BUS-112", "CB-112", "R12", 1, 30, "On Time", 8, 67),
        ("BUS-113", "CB-113", "R1", 2, 33, "On Time", 7, 58),
        ("BUS-114", "CB-114", "R2", 3, 25, "Delayed", 10, 47),
        ("BUS-115", "CB-115", "R3", 2, 36, "Arriving", 13, 72),
        ("BUS-116", "CB-116", "R4", 1, 28, "On Time", 4, 64),
        ("BUS-117", "CB-117", "R5", 1, 29, "On Time", 6, 39),
        ("BUS-118", "CB-118", "R6", 2, 24, "On Time", 7, 45),
        ("BUS-119", "CB-119", "R7", 1, 22, "Offline", 9, 12),
        ("BUS-120", "CB-120", "R8", 0, 30, "On Time", 5, 34),
        ("BUS-121", "CB-121", "R9", 2, 34, "On Time", 6, 57),
        ("BUS-122", "CB-122", "R10", 2, 27, "Delayed", 12, 63),
        ("BUS-123", "CB-123", "R11", 1, 26, "On Time", 7, 71),
        ("BUS-124", "CB-124", "R12", 2, 31, "On Time", 9, 80),
        ("BUS-125", "CB-125", "R1", 3, 28, "Arriving", 5, 87),
    ]

    for index, (bus_code, bus_number, route_code, stop_index, speed, status, eta, progress) in enumerate(bus_seed):
        route = next(item for item in route_models if item.route_code == route_code)
        ordered_stops = sorted(route.stops, key=lambda item: item.stop_order)
        current_index = min(stop_index, len(ordered_stops) - 1)
        next_index = min(current_index + 1, len(ordered_stops) - 1)
        current_stop = ordered_stops[current_index]
        next_stop = ordered_stops[next_index]
        db.session.add(
            Bus(
                bus_code=bus_code,
                bus_number=bus_number,
                route_id=route.id,
                current_stop=current_stop.name,
                next_stop=next_stop.name,
                current_stop_index=current_index,
                speed_kmh=speed,
                status=status,
                eta_minutes=eta,
                latitude=current_stop.latitude,
                longitude=current_stop.longitude,
                progress_percent=progress,
                last_updated=datetime.utcnow() - timedelta(minutes=index % 4),
                last_seen=datetime.utcnow() - timedelta(minutes=index % 3),
            )
        )

    notification_seed = [
        ("Delay Alert", "Bus CB-102 delayed by 8 minutes", "Route 2 traffic is slow near the library junction.", "delayed", False, "BUS-102", "R2"),
        ("Arrival Alert", "Bus CB-104 approaching Sports Complex", "The bus will reach the stop shortly.", "on-time", False, "BUS-104", "R4"),
        ("Route Update", "Route 3 temporary stop shift", "City Mall stop is active for today only.", "moving", True, "BUS-103", "R3"),
        ("Announcement", "Extra buses for exams", "Additional service is available during exam week.", "announcement", False, None, None),
        ("Delay Alert", "Bus CB-114 delayed at Canteen", "A short delay has been reported on Route 2.", "delayed", False, "BUS-114", "R2"),
        ("Route Update", "Route 10 corridor update", "The Innovation Hub stop has been added to the route.", "moving", True, "BUS-110", "R10"),
        ("Arrival Alert", "Bus CB-125 nearing Main Campus", "Selected bus is a few minutes away.", "on-time", False, "BUS-125", "R1"),
        ("Announcement", "Transport desk hours extended", "College transport help desk will stay open till 7 PM.", "announcement", True, None, None),
    ]

    for note_type, title, description, tone, read, bus_id, route_id in notification_seed:
        db.session.add(
            Notification(
                notification_type=note_type,
                title=title,
                description=description,
                tone=tone,
                read=read,
                created_at=datetime.utcnow() - timedelta(minutes=5 * (len(title) % 8 + 1)),
                bus_id=bus_id,
                route_id=route_id,
            )
        )

    db.session.commit()
