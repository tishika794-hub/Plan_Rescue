# backend/main.py
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any, Optional
import time
import io
import unittest
import json

from solver import ScheduleSolver, format_minutes_to_time
import db

app = FastAPI(
    title="Plan Rescue - Constraint-Aware Day Itinerary Recovery API",
    description="Deterministic Operations Research Engine for Urban Multi-Stop Day Recovery",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    db.init_db()

# Canonical 5-Stop Curated Delhi Dataset
DELHI_STOPS = [
    {
        "id": "india_gate",
        "name": "India Gate",
        "category": "Open Monument",
        "lat": 28.6129,
        "lng": 77.2295,
        "open_time": 360,    # 06:00
        "close_time": 1320,  # 22:00
        "duration": 45,
        "priority": 4,
        "is_fixed_res": False,
        "description": "Iconic war memorial archway surrounded by public lawns."
    },
    {
        "id": "ngma",
        "name": "Nat. Gallery Modern Art",
        "category": "Museum",
        "lat": 28.6096,
        "lng": 77.2346,
        "open_time": 600,    # 10:00
        "close_time": 1080,  # 18:00
        "duration": 60,
        "priority": 3,
        "is_fixed_res": False,
        "description": "Premier modern art museum located at Jaipur House."
    },
    {
        "id": "gulati_pandara",
        "name": "Gulati Restaurant (Pandara Rd)",
        "category": "Fixed Reservation",
        "lat": 28.6053,
        "lng": 77.2323,
        "open_time": 720,    # 12:00
        "close_time": 930,   # 15:30
        "duration": 60,
        "priority": 5,
        "is_fixed_res": True,
        "res_time": 810,     # 13:30 (1:30 PM)
        "description": "Legendary North Indian culinary institution with strict table booking."
    },
    {
        "id": "humayuns_tomb",
        "name": "Humayun's Tomb",
        "category": "UNESCO World Heritage",
        "lat": 28.5933,
        "lng": 77.2507,
        "open_time": 360,    # 06:00
        "close_time": 1080,  # 18:00
        "duration": 75,
        "priority": 5,
        "is_fixed_res": False,
        "description": "Magnificent Mughal garden tomb, precursor to the Taj Mahal."
    },
    {
        "id": "lodhi_garden",
        "name": "Lodhi Garden",
        "category": "Public Park",
        "lat": 28.5931,
        "lng": 77.2197,
        "open_time": 360,    # 06:00
        "close_time": 1200,  # 20:00
        "duration": 45,
        "priority": 2,
        "is_fixed_res": False,
        "description": "Historic 90-acre park dotted with 15th-century Sayyid and Lodi tombs."
    }
]

TRAVEL_MATRIX = {
    "india_gate":    {"india_gate": 0, "ngma": 5, "gulati_pandara": 7, "humayuns_tomb": 15, "lodhi_garden": 12},
    "ngma":          {"india_gate": 5, "ngma": 0, "gulati_pandara": 6, "humayuns_tomb": 14, "lodhi_garden": 11},
    "gulati_pandara":{"india_gate": 7, "ngma": 6, "gulati_pandara": 0, "humayuns_tomb": 12, "lodhi_garden": 10},
    "humayuns_tomb": {"india_gate": 15, "ngma": 14, "gulati_pandara": 12, "humayuns_tomb": 0, "lodhi_garden": 14},
    "lodhi_garden":  {"india_gate": 12, "ngma": 11, "gulati_pandara": 10, "humayuns_tomb": 14, "lodhi_garden": 0}
}

# Catalog of additional popular Delhi destinations users can add
DELHI_CATALOG = [
    {
        "id": "qutub_minar",
        "name": "Qutub Minar Complex",
        "category": "UNESCO World Heritage",
        "lat": 28.5245,
        "lng": 77.1855,
        "open_time": 420,    # 07:00
        "close_time": 1140,  # 19:00
        "duration": 60,
        "priority": 4,
        "is_fixed_res": False,
        "description": "73m soaring victory tower built in 1193, surrounded by ancient ruins."
    },
    {
        "id": "red_fort",
        "name": "Red Fort (Lal Qila)",
        "category": "Historical Fort",
        "lat": 28.6562,
        "lng": 77.2410,
        "open_time": 570,    # 09:30
        "close_time": 1050,  # 17:30
        "duration": 90,
        "priority": 4,
        "is_fixed_res": False,
        "description": "Historic red sandstone fortress, heart of the Mughal Empire."
    },
    {
        "id": "akshardham",
        "name": "Swaminarayan Akshardham",
        "category": "Spiritual Temple",
        "lat": 28.6127,
        "lng": 77.2773,
        "open_time": 600,    # 10:00
        "close_time": 1170,  # 19:30
        "duration": 120,
        "priority": 3,
        "is_fixed_res": False,
        "description": "Vast spiritual complex featuring traditional Hindu architectural craft."
    },
    {
        "id": "bangla_sahib",
        "name": "Gurudwara Bangla Sahib",
        "category": "Sikh Shrine",
        "lat": 28.6263,
        "lng": 77.2090,
        "open_time": 300,    # 05:00
        "close_time": 1380,  # 23:00
        "duration": 45,
        "priority": 3,
        "is_fixed_res": False,
        "description": "Prominent Sikh house of worship renowned for serene pool and community kitchen (langar)."
    },
    {
        "id": "dilli_haat",
        "name": "Dilli Haat (INA)",
        "category": "Crafts & Food Bazaar",
        "lat": 28.5732,
        "lng": 77.2078,
        "open_time": 630,    # 10:30
        "close_time": 1320,  # 22:00
        "duration": 60,
        "priority": 3,
        "is_fixed_res": False,
        "description": "Open-air food plaza and craft bazaar representing states across India."
    },
    {
        "id": "national_museum",
        "name": "National Museum (Janpath)",
        "category": "Museum",
        "lat": 28.6118,
        "lng": 77.2193,
        "open_time": 600,    # 10:00
        "close_time": 1080,  # 18:00
        "duration": 75,
        "priority": 3,
        "is_fixed_res": False,
        "description": "Vast collection of Indian antiquities spanning 5,000 years of history."
    }
]

solver = ScheduleSolver(TRAVEL_MATRIX)

# Pydantic Schemas
class StopItem(BaseModel):
    id: str
    name: str
    category: Optional[str] = "Destination"
    lat: float
    lng: float
    open_time: int
    close_time: int
    duration: int
    priority: int
    is_fixed_res: bool = False
    res_time: Optional[int] = None
    description: Optional[str] = ""

class RescuePayload(BaseModel):
    current_time: int
    current_location_id: str
    completed_stop_ids: List[str]
    active_stop_ids: List[str]
    venue_closures: Optional[List[str]] = []
    custom_stops: Optional[List[StopItem]] = None
    day_end: Optional[int] = 1200
    user_id: Optional[int] = None

class SaveItineraryPayload(BaseModel):
    user_id: int
    title: str
    current_time: int
    current_location_id: str
    day_end: int = 1200
    stops: List[StopItem]
    active_stop_ids: List[str]
    completed_stop_ids: List[str]
    venue_closures: List[str]
    last_rescue: Optional[Dict[str, Any]] = None

class RegisterPayload(BaseModel):
    email: str
    name: str
    password: str

class LoginPayload(BaseModel):
    email: str
    password: str

# Endpoints

@app.get("/api/system/info")
def get_system_info():
    """Returns architecture overview, thesis, and judge defense material."""
    return {
        "title": "Plan Rescue: Constraint-Aware Day Itinerary Recovery",
        "thesis": "Separation of concerns: 100% Deterministic Discrete Optimization for time and physics. Zero LLM hallucinations.",
        "formulation": "Orienteering Problem with Time Windows (OPTW)",
        "tiers": [
            {"tier": 1, "name": "Hard Feasibility Gate", "desc": "Binary rejection for missed closing hours, reservation violations (+/-15m), and day cutoff."},
            {"tier": 2, "name": "User Priority Preservation (J1)", "desc": "Maximize sum of priority * 1000."},
            {"tier": 3, "name": "Disruption Minimization (J2)", "desc": "Penalize dropped stops and sequence swaps against original plan."},
            {"tier": 4, "name": "Transit Minimization (J3)", "desc": "Minimize total road transit time across equally ranked feasible plans."}
        ],
        "legal_boundaries": "OpenStreetMap / Leaflet compliant. Respects Google Maps TOS §3.2.3 and §3.2.4."
    }

@app.get("/api/system/tests")
def run_live_tests():
    """Runs the backend test suite live and returns certified results for judges."""
    loader = unittest.TestLoader()
    suite = loader.discover("backend", pattern="test_solver.py")
    stream = io.StringIO()
    runner = unittest.TextTestRunner(stream=stream, verbosity=2)
    start_time = time.perf_counter()
    result = runner.run(suite)
    elapsed = round((time.perf_counter() - start_time) * 1000, 2)
    
    return {
        "total_tests": result.testsRun,
        "passed": result.wasSuccessful(),
        "errors": len(result.errors),
        "failures": len(result.failures),
        "execution_time_ms": elapsed,
        "log": stream.getvalue()
    }

@app.get("/api/places/catalog")
def get_catalog():
    """Returns curated Delhi places for easy user addition."""
    return {"catalog": DELHI_CATALOG}

@app.get("/api/auth/demo-users")
def get_demo_users():
    """Returns preloaded accounts for instant testing."""
    return [
        {"email": "arjun.sharma@delhitour.io", "name": "Arjun Sharma", "role": "Lead Traveler"},
        {"email": "priya.kapoor@traveler.com", "name": "Priya Kapoor", "role": "Traveler"}
    ]

@app.post("/api/auth/register")
def register(payload: RegisterPayload):
    existing = db.get_user_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    user = db.create_user(payload.email, payload.name, payload.password)
    return {"status": "success", "user": user}

@app.post("/api/auth/login")
def login(payload: LoginPayload):
    user = db.get_user_by_email(payload.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if user["password_hash"] != db.hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    clean_user = {k: user[k] for k in ["id", "email", "name", "role", "created_at"]}
    return {"status": "success", "user": clean_user}

@app.get("/api/itinerary/initial")
def get_initial(user_id: Optional[int] = None):
    """Returns pristine 5-stop Delhi itinerary or user's saved plan."""
    if user_id:
        saved = db.get_user_itinerary(user_id)
        if saved:
            return {"stops": saved["stops"], "saved_itinerary": saved}
            
    candidates = [s for s in DELHI_STOPS if s["id"] != "india_gate"]
    res = solver.rescue(
        current_time=600,
        current_location="india_gate",
        remaining_stops=candidates,
        original_order_ids=[s["id"] for s in DELHI_STOPS],
        day_end=1200
    )
    return {"stops": DELHI_STOPS, "schedule": res}

@app.post("/api/itinerary/save")
def save_itinerary(payload: SaveItineraryPayload):
    """Saves user's custom stops and priority preferences to SQLite."""
    stops_dicts = [s.model_dump() for s in payload.stops]
    itinerary_id = db.save_user_itinerary(
        user_id=payload.user_id,
        title=payload.title,
        current_time=payload.current_time,
        current_location_id=payload.current_location_id,
        day_end=payload.day_end,
        stops=stops_dicts,
        active_stop_ids=payload.active_stop_ids,
        completed_stop_ids=payload.completed_stop_ids,
        venue_closures=payload.venue_closures,
        last_rescue=payload.last_rescue
    )
    return {"status": "success", "itinerary_id": itinerary_id}

@app.post("/api/itinerary/rescue")
def execute_rescue(req: RescuePayload):
    """Core recovery engine evaluating all candidate schedules."""
    t0 = time.perf_counter()
    stops_pool = [s.model_dump() for s in req.custom_stops] if req.custom_stops else DELHI_STOPS
    stops_dict = {s["id"]: s for s in stops_pool}

    candidates = [
        s for s in stops_pool 
        if s["id"] in req.active_stop_ids 
        and s["id"] not in req.completed_stop_ids 
        and s["id"] not in (req.venue_closures or [])
        and s["id"] != req.current_location_id
    ]

    original_order = [s["id"] for s in stops_pool]
    day_end_val = req.day_end if req.day_end else 1200

    res = solver.rescue(
        current_time=req.current_time,
        current_location=req.current_location_id,
        remaining_stops=candidates,
        original_order_ids=original_order,
        day_end=day_end_val,
        all_stops_dict=stops_dict
    )
    
    compute_ms = round((time.perf_counter() - t0) * 1000, 2)
    res["telemetry"]["compute_time_ms"] = compute_ms

    # Construct side-by-side Diff items for every stop in the original itinerary
    diff = []
    rescued_timeline_map = {}
    if res.get("timeline"):
        for item in res["timeline"]:
            rescued_timeline_map[item["id"]] = item

    for stop in stops_pool:
        s_id = stop["id"]
        if s_id in req.completed_stop_ids:
            diff.append({
                "id": s_id,
                "name": stop["name"],
                "status": "COMPLETED",
                "badge": "Completed",
                "badge_color": "emerald",
                "reason": "Visited as scheduled prior to disruption."
            })
        elif s_id == req.current_location_id:
            diff.append({
                "id": s_id,
                "name": stop["name"],
                "status": "CURRENT",
                "badge": "Current Location",
                "badge_color": "amber",
                "reason": f"Active location at {format_minutes_to_time(req.current_time)}."
            })
        elif s_id in (req.venue_closures or []):
            diff.append({
                "id": s_id,
                "name": stop["name"],
                "status": "CLOSED",
                "badge": "Venue Closed",
                "badge_color": "rose",
                "reason": "Unexpected closure reported. Bypassed immediately."
            })
        elif s_id in rescued_timeline_map:
            t_item = rescued_timeline_map[s_id]
            diff.append({
                "id": s_id,
                "name": stop["name"],
                "status": "PRESERVED",
                "badge": "Preserved",
                "badge_color": "emerald" if not stop.get("is_fixed_res") else "indigo",
                "arrival_fmt": t_item["arrival_fmt"],
                "start_fmt": t_item["start_fmt"],
                "departure_fmt": t_item["departure_fmt"],
                "reason": "Protected fixed reservation" if stop.get("is_fixed_res") else "Optimized for maximum priority value."
            })
        else:
            diff.append({
                "id": s_id,
                "name": stop["name"],
                "status": "DROPPED",
                "badge": "Dropped",
                "badge_color": "rose",
                "reason": "Exceeds daily time cutoff or clashes with higher-priority commitments."
            })

    res["diff"] = diff
    return res

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
