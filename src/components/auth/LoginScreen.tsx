"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Lock, Mail, AlertCircle, Eye, EyeOff, Zap, Shield, BarChart3, Wrench, Users, CheckCircle } from "lucide-react";

const FEATURES = [
  { icon: <BarChart3 size={16} />, title: "Real-time Analytics", desc: "Live KPIs across all facility operations" },
  { icon: <Wrench    size={16} />, title: "Work Order Management", desc: "Track corrective, preventive & emergency tasks" },
  { icon: <Shield    size={16} />, title: "Role-Based Access", desc: "Admin · Manager · Technician · Viewer roles" },
  { icon: <Users     size={16} />, title: "Multi-site Support", desc: "Manage assets across campus, offices & sites" },
];

const DEMO_ACCOUNTS = [
  { role: "Admin",      email: "admin@fmnexus.in",   color: "bg-violet-100 text-violet-700 border-violet-200",   dot: "bg-violet-500" },
  { role: "Manager",    email: "manager@fmnexus.in",  color: "bg-blue-100 text-blue-700 border-blue-200",         dot: "bg-blue-500" },
  { role: "Technician", email: "tech1@fmnexus.in",    color: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
  { role: "Viewer",     email: "viewer@fmnexus.in",   color: "bg-slate-100 text-slate-600 border-slate-200",       dot: "bg-slate-400" },
];

export function LoginScreen() {
  const { login } = useApp();
  const [email,    setEmail]    = useState("admin@fmnexus.in");
  const [password, setPassword] = useState("Admin@123");
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [busy,     setBusy]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError((err as Error).message ?? "Invalid credentials. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — brand & features ── */}
      <div className="hidden lg:flex lg:w-[54%] relative bg-[#0f172a] flex-col justify-between p-12 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] right-[-60px] w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <div className="text-[22px] font-extrabold text-white tracking-tight">FMNexus</div>
              <div className="text-[11px] text-slate-500 uppercase tracking-widest">Facility Management</div>
            </div>
          </div>

          <h2 className="text-[36px] font-extrabold text-white leading-tight mb-4">
            Everything your<br/>
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              facility needs,
            </span><br/>
            in one platform.
          </h2>
          <p className="text-slate-400 text-[15px] leading-relaxed max-w-sm">
            Manage assets, work orders, preventive maintenance, vendors, inventory, and incidents — all in real time.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-4">
          {FEATURES.map(f => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                {f.icon}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-white">{f.title}</div>
                <div className="text-[12px] text-slate-500 mt-0.5">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats strip */}
        <div className="relative z-10 grid grid-cols-3 gap-4 pt-6 border-t border-slate-800">
          {[
            { val: "99.9%", label: "Uptime" },
            { val: "< 3s",  label: "Response" },
            { val: "256-bit", label: "Encryption" },
          ].map(s => (
            <div key={s.label}>
              <div className="text-[20px] font-extrabold text-white">{s.val}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-[18px] font-bold text-slate-800">FMNexus</span>
          </div>

          <div className="mb-8">
            <h1 className="text-[26px] font-extrabold text-slate-900 leading-tight">Welcome back</h1>
            <p className="text-slate-500 text-[14px] mt-1">Sign in to your workspace</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="you@fmnexus.in"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 px-4 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-[14px] transition-all shadow-md shadow-blue-500/20 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-7">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Demo accounts</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(c => (
                <button
                  key={c.role}
                  type="button"
                  onClick={() => { setEmail(c.email); setPassword("Admin@123"); setError(""); }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white border hover:shadow-sm transition-all text-left ${c.color}`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                  <div>
                    <div className="text-[12px] font-bold">{c.role}</div>
                    <div className="text-[10px] opacity-70 truncate max-w-[110px]">{c.email}</div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2.5">All demo accounts use password: <span className="font-mono font-semibold">Admin@123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
