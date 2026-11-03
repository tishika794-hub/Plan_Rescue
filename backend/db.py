# backend/db.py
import sqlite3
import hashlib
import json
import os
from typing import Optional, Dict, Any, List

DB_PATH = os.path.join(os.path.dirname(__file__), "plan_rescue.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'traveler',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Itineraries / User Preferences table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS itineraries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        city TEXT DEFAULT 'Delhi',
        current_time INTEGER DEFAULT 600,
        current_location_id TEXT DEFAULT 'india_gate',
        day_end INTEGER DEFAULT 1200,
        stops_json TEXT NOT NULL,
        active_stop_ids_json TEXT NOT NULL,
        completed_stop_ids_json TEXT DEFAULT '[]',
        venue_closures_json TEXT DEFAULT '[]',
        last_rescue_json TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)
    
    # Seed default user if not exists
    cursor.execute("SELECT id FROM users WHERE email = 'arjun.sharma@delhitour.io'")
    user = cursor.fetchone()
    if not user:
        cursor.execute(
            "INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)",
            ("arjun.sharma@delhitour.io", "Arjun Sharma", hash_password("hackathon2026"), "lead_traveler")
        )
        user_id = cursor.lastrowid
        
        # Seed another user for quick multi-user login demo
        cursor.execute(
            "INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)",
            ("priya.kapoor@traveler.com", "Priya Kapoor", hash_password("delhi2026"), "traveler")
        )
    conn.commit()
    conn.close()

# Helper queries
def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT id, email, name, password_hash, role, created_at FROM users WHERE email = ?", (email,))
    row = c.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT id, email, name, role, created_at FROM users WHERE id = ?", (user_id,))
    row = c.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def create_user(email: str, name: str, password: str) -> Dict[str, Any]:
    conn = get_connection()
    c = conn.cursor()
    pwd_hash = hash_password(password)
    c.execute("INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)", (email, name, pwd_hash))
    conn.commit()
    user_id = c.lastrowid
    conn.close()
    return {"id": user_id, "email": email, "name": name, "role": "traveler"}

def save_user_itinerary(user_id: int, title: str, current_time: int, current_location_id: str,
                        day_end: int, stops: list, active_stop_ids: list,
                        completed_stop_ids: list, venue_closures: list, last_rescue: Optional[dict] = None) -> int:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT id FROM itineraries WHERE user_id = ?", (user_id,))
    existing = c.fetchone()
    
    stops_json = json.dumps(stops)
    active_json = json.dumps(active_stop_ids)
    completed_json = json.dumps(completed_stop_ids)
    closures_json = json.dumps(venue_closures)
    rescue_json = json.dumps(last_rescue) if last_rescue else None

    if existing:
        c.execute("""
            UPDATE itineraries 
            SET title = ?, current_time = ?, current_location_id = ?, day_end = ?,
                stops_json = ?, active_stop_ids_json = ?, completed_stop_ids_json = ?,
                venue_closures_json = ?, last_rescue_json = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (title, current_time, current_location_id, day_end, stops_json, active_json,
              completed_json, closures_json, rescue_json, existing["id"]))
        itinerary_id = existing["id"]
    else:
        c.execute("""
            INSERT INTO itineraries 
            (user_id, title, current_time, current_location_id, day_end, stops_json, active_stop_ids_json, completed_stop_ids_json, venue_closures_json, last_rescue_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, title, current_time, current_location_id, day_end, stops_json, active_json,
              completed_json, closures_json, rescue_json))
        itinerary_id = c.lastrowid
    conn.commit()
    conn.close()
    return itinerary_id

def get_user_itinerary(user_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM itineraries WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1", (user_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["stops"] = json.loads(d["stops_json"])
    d["active_stop_ids"] = json.loads(d["active_stop_ids_json"])
    d["completed_stop_ids"] = json.loads(d["completed_stop_ids_json"])
    d["venue_closures"] = json.loads(d["venue_closures_json"])
    d["last_rescue"] = json.loads(d["last_rescue_json"]) if d["last_rescue_json"] else None
    return d

