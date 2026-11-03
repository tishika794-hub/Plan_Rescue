# backend/test_solver.py
import unittest
from solver import ScheduleSolver
from main import DELHI_STOPS, TRAVEL_MATRIX

class TestPlanRescueSolver(unittest.TestCase):
    def setUp(self):
        self.solver = ScheduleSolver(TRAVEL_MATRIX)

    def test_initial_plan_validity(self):
        candidates = [s for s in DELHI_STOPS if s["id"] != "india_gate"]
        res = self.solver.rescue(600, "india_gate", candidates, [s["id"] for s in DELHI_STOPS])
        self.assertEqual(res["status"], "success")
        self.assertEqual(len(res["timeline"]), 4)

    def test_unexpected_delay_drops_lowest_priority_and_saves_reservation(self):
        # Roadblock delay at NGMA, departing at 13:10 (790 mins) instead of 11:50 (710 mins).
        # With day ending at 16:30 (990 mins), remaining candidates: Gulati, Humayun's Tomb, Lodhi Garden.
        candidates = [s for s in DELHI_STOPS if s["id"] in ["gulati_pandara", "humayuns_tomb", "lodhi_garden"]]
        res = self.solver.rescue(790, "ngma", candidates, [s["id"] for s in DELHI_STOPS], day_end=990)
        
        self.assertEqual(res["status"], "success")
        timeline_ids = [item["id"] for item in res["timeline"]]
        # Gulati lunch reservation (13:30 / 810) MUST be preserved
        self.assertIn("gulati_pandara", timeline_ids)
        # Humayun's Tomb (Priority 5) MUST be preserved
        self.assertIn("humayuns_tomb", timeline_ids)
        # Lodhi Garden (Priority 2) MUST be dropped due to time budget constraints
        self.assertNotIn("lodhi_garden", timeline_ids)
        self.assertTrue(any(d["id"] == "lodhi_garden" for d in res["dropped_stops"]))

    def test_venue_closure_handling(self):
        # NGMA closed, immediately re-route from India Gate at 10:45 AM (645 mins)
        candidates = [s for s in DELHI_STOPS if s["id"] in ["gulati_pandara", "humayuns_tomb", "lodhi_garden"]]
        res = self.solver.rescue(645, "india_gate", candidates, [s["id"] for s in DELHI_STOPS])
        self.assertEqual(res["status"], "success")
        timeline_ids = [item["id"] for item in res["timeline"]]
        self.assertIn("gulati_pandara", timeline_ids)

    def test_honesty_on_gridlock_infeasibility(self):
        # 120m delay (Current time 13:45 / 825) - Gulati lunch (13:30) is physically missed!
        candidates = [s for s in DELHI_STOPS if s["id"] in ["gulati_pandara", "humayuns_tomb", "lodhi_garden"]]
        res = self.solver.rescue(825, "ngma", candidates, [s["id"] for s in DELHI_STOPS])
        self.assertEqual(res["status"], "infeasible")
        self.assertEqual(res["telemetry"]["valid"], 0)

if __name__ == "__main__":
    unittest.main()
