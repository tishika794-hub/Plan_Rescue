// frontend/src/api.js
const API_BASE = '/api';

export async function fetchInitialPlan(userId = null) {
  const url = userId ? `${API_BASE}/itinerary/initial?user_id=${userId}` : `${API_BASE}/itinerary/initial`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load initial itinerary');
  return res.json();
}

export async function triggerRescue(payload) {
  const res = await fetch(`${API_BASE}/itinerary/rescue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Optimization rescue failed');
  }
  return res.json();
}

export async function saveItinerary(payload) {
  const res = await fetch(`${API_BASE}/itinerary/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save itinerary');
  return res.json();
}

export async function fetchCatalog() {
  const res = await fetch(`${API_BASE}/places/catalog`);
  if (!res.ok) throw new Error('Failed to load places catalog');
  return res.json();
}

export async function runSystemTests() {
  const res = await fetch(`${API_BASE}/system/tests`);
  if (!res.ok) throw new Error('Failed to run backend verification');
  return res.json();
}

export async function fetchSystemInfo() {
  const res = await fetch(`${API_BASE}/system/info`);
  if (!res.ok) throw new Error('Failed to load system info');
  return res.json();
}

export async function fetchDemoUsers() {
  const res = await fetch(`${API_BASE}/auth/demo-users`);
  if (!res.ok) throw new Error('Failed to load demo accounts');
  return res.json();
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function registerUser(email, name, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Registration failed');
  }
  return res.json();
}

