// frontend/src/components/AuthModal.jsx
import React, { useState } from 'react';
import { X, User, Lock, Mail, Sparkles, Check, ArrowRight } from 'lucide-react';
import { loginUser, registerUser } from '../api';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, demoUsers }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await registerUser(email, name, password);
        onLoginSuccess(res.user);
        onClose();
      } else {
        const res = await loginUser(email, password);
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickLogin(demoEmail, demoPass) {
    setError(null);
    setLoading(true);
    try {
      const res = await loginUser(demoEmail, demoPass);
      onLoginSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-100">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isRegister ? 'Create Traveler Profile' : 'Traveler Sign In'}
            </h3>
            <p className="text-xs text-slate-400">
              Persist custom itinerary priorities and constraints in SQLite.
            </p>
          </div>
        </div>

        {/* Quick Demo Logins for Hackathon Judges */}
        <div className="mb-5 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            1-Click Demo Profiles (For Judges)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('arjun.sharma@delhitour.io', 'hackathon2026')}
              className="p-2 text-left rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700/80 transition"
            >
              <div className="text-xs font-bold text-slate-200">Arjun Sharma</div>
              <div className="text-[10px] text-slate-400">Lead Solo Traveler</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('priya.kapoor@traveler.com', 'delhi2026')}
              className="p-2 text-left rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700/80 transition"
            >
              <div className="text-xs font-bold text-slate-200">Priya Kapoor</div>
              <div className="text-[10px] text-slate-400">Family Outing</div>
            </button>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vikram Seth"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(null); }}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register here"}
          </button>
        </div>

      </div>
    </div>
  );
}

