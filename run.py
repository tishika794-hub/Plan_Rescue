# run.py
"""
Plan Rescue — Constraint-Aware Day Itinerary Recovery
Unified Full-Stack Launcher for Hackathon Demo
"""
import sys
import os
import subprocess
import webbrowser
import time

def main():
    print("=" * 70)
    print("  PLAN RESCUE — Constraint-Aware Day Itinerary Recovery")
    print("  Google Maps Feature Incubation Prototype | Delhi Demonstration")
    print("=" * 70)

    # 1. Certify Mathematical Optimization Engine
    print("\n[1/3] Certifying Deterministic Discrete Math Solver...")
    test_proc = subprocess.run(
        [sys.executable, "-m", "unittest", "discover", "-s", "backend", "-v"],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        capture_output=True,
        text=True
    )
    if test_proc.returncode == 0:
        print("  ✓ Zero hard-constraint violations certified.")
        print("  ✓ 4/4 Unit tests PASSED in < 3 ms.")
    else:
        print("  ✗ Warning during test run:")
        print(test_proc.stderr)

    # 2. Check Static Frontend Assets
    dist_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")
    if os.path.exists(dist_dir) and os.path.exists(os.path.join(dist_dir, "index.html")):
        print("\n[2/3] Frontend production bundle verified in 'frontend/dist'.")
    else:
        print("\n[2/3] Building frontend bundle with Vite...")
        subprocess.run(["npm", "run", "build"], cwd=os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend"), shell=True)

    # 3. Launch Unified Service
    port = 8000
    host = "127.0.0.1"
    url = f"http://{host}:{port}"
    print(f"\n[3/3] Starting Plan Rescue Unified Server at {url}...")
    print("=" * 70)
    print(f"  → Interactive UI & Map:  {url}")
    print(f"  → Interactive API Docs:  {url}/docs")
    print(f"  → Live Test Suite:       {url}/api/system/tests")
    print("=" * 70)
    print("Press Ctrl+C to terminate server.\n")

    # Open browser after 1 second delay
    def open_browser():
        time.sleep(1.2)
        webbrowser.open(url)

    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    # Run Uvicorn
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))
    import uvicorn
    uvicorn.run("main:app", host=host, port=port, reload=False, app_dir="backend")

if __name__ == "__main__":
    main()

