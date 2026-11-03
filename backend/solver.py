# backend/solver.py
import itertools
import math
from typing import List, Dict, Any, Tuple, Optional

def format_minutes_to_time(minutes: int) -> str:
    """Converts minutes from midnight (e.g., 810) to 12-hour format ('1:30 PM')."""
    hours = (minutes // 60) % 24
    mins = minutes % 60
    period = "AM" if hours < 12 else "PM"
    display_hour = hours % 12
    if display_hour == 0:
        display_hour = 12
    return f"{display_hour}:{mins:02d} {period}"

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def compute_urban_transit_time(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    dist = haversine_km(lat1, lon1, lat2, lon2)
    if dist < 0.05:
        return 0
    # Average Delhi urban road speed: ~22 km/h + 3m signal/parking buffer
    minutes = round((dist / 22.0) * 60.0 + 3.0)
    return max(4, minutes)

class ScheduleSolver:
    def __init__(self, travel_matrix: Optional[Dict[str, Dict[str, int]]] = None):
        self.matrix = travel_matrix or {}

    def get_transit_time(self, from_loc: Any, to_loc: Any) -> int:
        from_id = from_loc if isinstance(from_loc, str) else from_loc.get("id")
        to_id = to_loc if isinstance(to_loc, str) else to_loc.get("id")

        if from_id == to_id:
            return 0

        # Hardcoded matrix lookup if available
        if from_id in self.matrix and to_id in self.matrix[from_id]:
            return self.matrix[from_id][to_id]

        # Dynamic Haversine fallback if stop objects with coordinates provided
        if isinstance(from_loc, dict) and isinstance(to_loc, dict):
            if "lat" in from_loc and "lat" in to_loc:
                return compute_urban_transit_time(
                    from_loc["lat"], from_loc["lng"], to_loc["lat"], to_loc["lng"]
                )

        # Conservative fallback
        return 12

    def evaluate_sequence(
        self, current_time: int, current_location: str,
        sequence: List[Dict[str, Any]], day_end: int = 1200,
        stop_lookup: Optional[Dict[str, Dict[str, Any]]] = None
    ) -> Tuple[bool, Optional[List[Dict[str, Any]]], Optional[str]]:
        timeline = []
        curr_t = current_time
        curr_loc = current_location
        lookup = stop_lookup or {s["id"]: s for s in sequence}

        for stop in sequence:
            from_obj = lookup.get(curr_loc, curr_loc)
            transit_time = self.get_transit_time(from_obj, stop)
            arrival_time = curr_t + transit_time

            # Hard Check: Fixed Reservation window (+/- 15m tolerance)
            if stop.get("is_fixed_res"):
                res_time = stop["res_time"]
                if arrival_time > res_time + 15:
                    return False, None, f"Misses reservation at {stop['name']} (Arrives {format_minutes_to_time(arrival_time)}, Window ends {format_minutes_to_time(res_time + 15)})"
                start_time = max(arrival_time, res_time)
            else:
                # Hard Check: Opening hours
                if arrival_time > stop["close_time"]:
                    return False, None, f"Arrives at {stop['name']} after closing ({format_minutes_to_time(arrival_time)} > {format_minutes_to_time(stop['close_time'])})"
                start_time = max(arrival_time, stop["open_time"])

            departure_time = start_time + stop["duration"]
            if departure_time > stop["close_time"]:
                return False, None, f"Cannot finish visit before close at {stop['name']} ({format_minutes_to_time(departure_time)} > {format_minutes_to_time(stop['close_time'])})"

            timeline.append({
                "id": stop["id"],
                "name": stop["name"],
                "transit_from_prev": transit_time,
                "arrival": arrival_time,
                "arrival_fmt": format_minutes_to_time(arrival_time),
                "start": start_time,
                "start_fmt": format_minutes_to_time(start_time),
                "departure": departure_time,
                "departure_fmt": format_minutes_to_time(departure_time),
                "duration": stop["duration"],
                "priority": stop.get("priority", 3),
                "is_fixed_res": stop.get("is_fixed_res", False),
                "res_time": stop.get("res_time"),
                "lat": stop.get("lat"),
                "lng": stop.get("lng")
            })
            curr_t = departure_time
            curr_loc = stop["id"]

        if curr_t > day_end:
            return False, None, f"Exceeds day limit ({format_minutes_to_time(curr_t)} > {format_minutes_to_time(day_end)})"
        return True, timeline, None

    def rescue(
        self, current_time: int, current_location: str,
        remaining_stops: List[Dict[str, Any]], original_order_ids: List[str], day_end: int = 1200,
        all_stops_dict: Optional[Dict[str, Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        best_schedule, best_timeline, best_score = None, [], -float('inf')
        evaluated_count, valid_count = 0, 0
        stop_map = {s["id"]: s for s in remaining_stops}
        lookup = dict(stop_map)
        if all_stops_dict:
            lookup.update(all_stops_dict)

        n = len(remaining_stops)

        # Tier 1 & 2: Constrained Search across subset sizes k (greedy on stop count, then priority)
        for k in range(n, 0, -1):
            for subset in itertools.combinations(remaining_stops, k):
                # Never drop a fixed reservation if present in candidates
                if any(s.get("is_fixed_res") for s in remaining_stops) and not any(s.get("is_fixed_res") for s in subset):
                    continue

                for perm in itertools.permutations(subset):
                    evaluated_count += 1
                    is_valid, timeline, _ = self.evaluate_sequence(
                        current_time, current_location, list(perm), day_end, lookup
                    )
                    if not is_valid: 
                        continue
                    valid_count += 1

                    # Tier 2: Priority Score J1
                    p_score = sum(s["priority"] * 1000 for s in perm)
                    
                    # Tier 3: Disruption Penalty J2 (dropped stops + sequence inversions)
                    dropped_ids = set(stop_map.keys()) - {s["id"] for s in perm}
                    drop_penalty = sum(stop_map[d]["priority"] * 500 for d in dropped_ids)
                    
                    perm_ids = [s["id"] for s in perm]
                    inversions = sum(
                        1 for i in range(len(perm_ids)) for j in range(i+1, len(perm_ids))
                        if perm_ids[i] in original_order_ids and perm_ids[j] in original_order_ids
                        and original_order_ids.index(perm_ids[i]) > original_order_ids.index(perm_ids[j])
                    )
                    order_penalty = inversions * 50
                    
                    # Tier 4: Total Travel Time Penalty J3
                    travel_penalty = sum(item["transit_from_prev"] for item in timeline) * 2

                    score = p_score - drop_penalty - order_penalty - travel_penalty
                    if score > best_score:
                        best_score, best_schedule, best_timeline = score, perm, timeline

            # Early exit: optimal schedule preserving k stops found
            if best_schedule is not None and len(best_schedule) == k:
                break 

        if best_schedule is None:
            # Generate intelligent fallback suggestions for user
            fallbacks = []
            has_fixed_res = any(s.get("is_fixed_res") for s in remaining_stops)
            if has_fixed_res:
                fixed_stop = next(s for s in remaining_stops if s.get("is_fixed_res"))
                fallbacks.append({
                    "action": "RELAX_RESERVATION",
                    "title": f"Relax '{fixed_stop['name']}' reservation to walk-in",
                    "description": "Remove the strict +/-15m table reservation constraint so arrival can shift later.",
                    "param": {"stop_id": fixed_stop["id"]}
                })
            fallbacks.append({
                "action": "EXTEND_DAY_END",
                "title": f"Extend day cutoff to {format_minutes_to_time(day_end + 90)}",
                "description": "Give your itinerary an extra 90 minutes of evening budget.",
                "param": {"new_day_end": day_end + 90}
            })
            if remaining_stops:
                lowest_p = min(remaining_stops, key=lambda s: s.get("priority", 1))
                fallbacks.append({
                    "action": "MANUAL_DROP",
                    "title": f"Drop lower-priority stop '{lowest_p['name']}'",
                    "description": f"Manually omit {lowest_p['name']} (Priority {lowest_p['priority']}) to free up schedule time.",
                    "param": {"stop_id": lowest_p["id"]}
                })

            return {
                "status": "infeasible",
                "message": "No feasible itinerary satisfies hard constraints (closing hours or fixed reservation).",
                "fallbacks": fallbacks,
                "telemetry": {
                    "evaluated": evaluated_count, 
                    "valid": 0,
                    "engine": "Deterministic Exhaustive Search (O(N!))"
                }
            }

        preserved_ids = {s["id"] for s in best_schedule}
        dropped = []
        for s in remaining_stops:
            if s["id"] not in preserved_ids:
                code = "MISSED_HARD_RESERVATION" if s.get("is_fixed_res") else "DROPPED_FOR_TIME_WINDOW_VIOLATION"
                dropped.append({
                    "id": s["id"], 
                    "name": s["name"], 
                    "priority": s["priority"],
                    "reason_code": code,
                    "reason_description": (
                        f"Omitted because visit duration ({s['duration']}m) and transit would exceed the {format_minutes_to_time(day_end)} day cutoff or clash with fixed commitments."
                    )
                })

        # Calculate transit & experience statistics
        total_transit = sum(item["transit_from_prev"] for item in best_timeline)
        total_experience = sum(item["duration"] for item in best_timeline)

        return {
            "status": "success", 
            "score": best_score, 
            "timeline": best_timeline,
            "dropped_stops": dropped,
            "stats": {
                "total_transit_mins": total_transit,
                "total_experience_mins": total_experience,
                "stops_preserved": len(best_timeline),
                "stops_dropped": len(dropped),
            },
            "telemetry": {
                "evaluated": evaluated_count, 
                "valid": valid_count, 
                "engine": "Deterministic Exhaustive Search (O(N!))"
            }
        }
