"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import type { MeterType, MeterReading } from "@/types";
import {
  Activity, TrendingUp, TrendingDown, Plus, CheckCircle2,
  Droplets, Zap, Wind, Clock, Pencil, Trash2,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ─── Meter definitions ─────────────────────────────────────────────────────────
const METER_DEFS: {
  type: MeterType; label: string; location: string;
  unit: string; icon: React.ReactNode; color: string;
}[] = [
  { type: "Electricity-HT", label: "HT Main Meter",        location: "Main LT Panel",   unit: "kWh",  icon: <Zap size={15}/>,      color: "text-amber-600 bg-amber-50" },
  { type: "Electricity-LT", label: "LT Distribution Board", location: "Ground Floor DB", unit: "kWh",  icon: <Zap size={15}/>,      color: "text-yellow-600 bg-yellow-50" },
  { type: "Water-Main",     label: "Water Main Supply",     location: "Pump House",       unit: "m³",   icon: <Droplets size={15}/>, color: "text-blue-600 bg-blue-50" },
  { type: "Water-Garden",   label: "Garden Water Meter",    location: "Landscape Area",   unit: "m³",   icon: <Droplets size={15}/>, color: "text-cyan-600 bg-cyan-50" },
  { type: "DG-Runtime",     label: "DG Runtime Hours",      location: "DG Room",          unit: "hrs",  icon: <Activity size={15}/>, color: "text-orange-600 bg-orange-50" },
  { type: "STP-Flow",       label: "STP Inlet Flow",        location: "STP Plant",        unit: "m³/d", icon: <Wind size={15}/>,     color: "text-violet-600 bg-violet-50" },
];

const TYPE_BADGE: Record<string, string> = {
  "Electricity-HT": "bg-amber-50 text-amber-700 border-amber-200",
  "Electricity-LT": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Water-Main":     "bg-blue-50 text-blue-700 border-blue-200",
  "Water-Garden":   "bg-cyan-50 text-cyan-700 border-cyan-200",
  "DG-Runtime":     "bg-orange-50 text-orange-700 border-orange-200",
  "STP-Flow":       "bg-violet-50 text-violet-700 border-violet-200",
  "Other":          "bg-slate-100 text-slate-600 border-slate-200",
};

interface ReadingForm {
  meterType: MeterType;
  previousReading: string;
  currentReading: string;
  notes: string;
  readingDate: string;
}

const BLANK_FORM: ReadingForm = {
  meterType: "Electricity-HT",
  previousReading: "",
  currentReading: "",
  notes: "",
  readingDate: new Date().toISOString().slice(0, 10),
};

export function MeterReadings() {
  const { state, submitMeterReading, updateMeterReading, deleteMeterReading, toast, fetchMeterReadings } = useApp();

  // ── Server-side filter ────────────────────────────────────────────────────
  const [filterType, setFilterType] = useState<MeterType | "all">("all");

  const load = useCallback(() => {
    const params: Record<string, string> = {};
    if (filterType !== "all") params.meterType = filterType;
    fetchMeterReadings(params);
  }, [filterType, fetchMeterReadings]);

  useEffect(() => { load(); }, [load]);

  const readings = state.meterReadings;

  // ── Form / Edit ────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<MeterReading | null>(null);
  const [form, setForm]           = useState<ReadingForm>(BLANK_FORM);
  const [saving, setSaving]       = useState(false);

  const selectedMeter = METER_DEFS.find(m => m.type === form.meterType)!;
  const prev          = parseFloat(form.previousReading) || 0;
  const current       = parseFloat(form.currentReading) || 0;
  const consumption   = Math.max(0, current - prev);

  function openAdd() {
    setForm(BLANK_FORM);
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(r: MeterReading) {
    setForm({
      meterType:       r.meterType,
      previousReading: String(r.previousReading),
      currentReading:  String(r.currentReading),
      notes:           r.notes,
      readingDate:     r.readingDate,
    });
    setEditing(r);
    setModalOpen(true);
  }

  function handleMeterChange(type: MeterType) {
    if (editing) return; // don't auto-fill when editing
    const last = readings
      .filter(r => r.meterType === type)
      .sort((a, b) => b.readingDate.localeCompare(a.readingDate))[0];
    setForm(prev => ({
      ...prev,
      meterType: type,
      previousReading: last ? String(last.currentReading) : "",
    }));
  }

  async function handleSubmit() {
    if (!form.currentReading) { toast("Enter current reading", "error"); return; }
    if (!editing && current < prev) { toast("Current reading cannot be less than previous reading", "error"); return; }
    setSaving(true);
    try {
      const meter = METER_DEFS.find(m => m.type === form.meterType)!;
      const payload = {
        meterType:       form.meterType,
        meterName:       meter.label,
        location:        meter.location,
        unit:            meter.unit,
        previousReading: prev,
        currentReading:  current,
        consumption:     editing ? Math.max(0, current - prev) : consumption,
        readingDate:     form.readingDate,
        submittedBy:     state.currentUser.name,
        notes:           form.notes,
      };
      if (editing) {
        await updateMeterReading(editing.id, payload);
        toast("Reading updated", "success");
      } else {
        await submitMeterReading(payload);
        toast("Meter reading submitted", "success");
      }
      setModalOpen(false);
      setForm(BLANK_FORM);
      setEditing(null);
    } catch (err) {
      toast((err as Error).message ?? "Failed to save reading", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this meter reading?")) return;
    try {
      await deleteMeterReading(id);
      toast("Reading deleted", "success");
    } catch (err) {
      toast((err as Error).message ?? "Failed to delete", "error");
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const today      = new Date().toISOString().slice(0, 10);
  const todayCount = readings.filter(r => r.readingDate === today).length;
  const totalKwh   = readings.filter(r => r.meterType === "Electricity-HT").reduce((s, r) => s + r.consumption, 0);
  const totalWater = readings.filter(r => r.meterType === "Water-Main").reduce((s, r) => s + r.consumption, 0);

  // Chart (HT Electricity last 7)
  const chartData = readings
    .filter(r => r.meterType === "Electricity-HT")
    .sort((a, b) => a.readingDate.localeCompare(b.readingDate))
    .slice(-7)
    .map(r => ({ date: r.readingDate.slice(5), consumption: r.consumption }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Meter Readings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Log and manage daily utility consumption readings.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={14}/>} onClick={openAdd}>
          Log Reading
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Logged Today",     val: todayCount,               icon: <Clock size={18}/>,     color: "text-indigo-600 bg-indigo-50" },
          { label: "Total Readings",   val: readings.length,          icon: <Activity size={18}/>,  color: "text-blue-600 bg-blue-50" },
          { label: "Total kWh (HT)",   val: totalKwh.toLocaleString(),icon: <Zap size={18}/>,       color: "text-amber-600 bg-amber-50" },
          { label: "Water Usage (m³)", val: totalWater.toFixed(1),    icon: <Droplets size={18}/>,  color: "text-cyan-600 bg-cyan-50" },
        ].map(k => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${k.color}`}>{k.icon}</div>
            <div className="text-[22px] font-extrabold text-slate-800">{k.val}</div>
            <div className="text-[11px] text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Meter overview cards */}
      <div className="grid grid-cols-3 gap-3">
        {METER_DEFS.map(m => {
          const last  = readings.filter(r => r.meterType === m.type).sort((a, b) => b.readingDate.localeCompare(a.readingDate))[0];
          const prev2 = readings.filter(r => r.meterType === m.type).sort((a, b) => b.readingDate.localeCompare(a.readingDate))[1];
          const trend = last && prev2 ? (last.consumption > prev2.consumption ? "up" : "down") : null;
          return (
            <div key={m.type} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${m.color}`}>{m.icon}</div>
                <div>
                  <div className="text-[12px] font-bold text-slate-700">{m.label}</div>
                  <div className="text-[10px] text-slate-400">{m.location}</div>
                </div>
              </div>
              {last ? (
                <>
                  <div className="text-[20px] font-extrabold text-slate-800">{last.currentReading.toLocaleString()} <span className="text-[12px] font-normal text-slate-400">{m.unit}</span></div>
                  <div className="flex items-center gap-1 text-[11px] mt-1">
                    {trend === "up" ? <TrendingUp size={11} className="text-red-500"/> : trend === "down" ? <TrendingDown size={11} className="text-emerald-500"/> : null}
                    <span className="text-slate-500">Consumption: {last.consumption} {m.unit}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{last.readingDate}</div>
                </>
              ) : (
                <div className="text-[12px] text-slate-400">No readings yet</div>
              )}
            </div>
          );
        })}
      </div>

      {/* HT chart */}
      {chartData.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-[14px] font-bold text-slate-800 mb-4">HT Electricity — 7-Day Trend</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={v => [`${v} kWh`, "Consumption"]}/>
              <Area type="monotone" dataKey="consumption" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filter + History table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <div className="text-[14px] font-bold text-slate-800 flex-1">Reading History</div>
          {/* Meter type filter — calls backend */}
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterType === "all" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200"}`}>
              All
            </button>
            {METER_DEFS.map(m => (
              <button key={m.type} onClick={() => setFilterType(m.type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterType === m.type ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200"}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {readings.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <Activity size={28} className="mx-auto mb-2 opacity-30"/>
            No meter readings logged yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Date","Meter","Location","Previous","Current","Consumption","By",""].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {readings.slice().sort((a, b) => b.readingDate.localeCompare(a.readingDate)).map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3 font-medium text-slate-700">{r.readingDate}</td>
                    <td className="px-4 py-3">
                      <Badge className={TYPE_BADGE[r.meterType] ?? TYPE_BADGE.Other}>{r.meterName}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{r.location}</td>
                    <td className="px-4 py-3 text-slate-600">{r.previousReading.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.currentReading.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-indigo-600">{r.consumption.toFixed(2)}</span>
                      <span className="text-slate-400 ml-1 text-[11px]">{r.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{r.submittedBy}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(r)} title="Edit"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><Pencil size={13}/></button>
                        <button onClick={() => handleDelete(r.id)} title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setForm(BLANK_FORM); setEditing(null); }}
        title={editing ? "Edit Meter Reading" : "Log Meter Reading"}
        footer={<>
          <Button variant="secondary" onClick={() => { setModalOpen(false); setForm(BLANK_FORM); setEditing(null); }}>Cancel</Button>
          <Button variant="primary" loading={saving} leftIcon={<CheckCircle2 size={14}/>} onClick={handleSubmit}>
            {editing ? "Save Changes" : "Submit Reading"}
          </Button>
        </>}>
        <div className="space-y-4">
          {/* Meter selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Meter</label>
            <div className="grid grid-cols-2 gap-2">
              {METER_DEFS.map(m => (
                <button key={m.type} onClick={() => handleMeterChange(m.type)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-[12px] font-medium transition-all",
                    form.meterType === m.type ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                  )}>
                  <span>{m.icon}</span>
                  <span className="truncate">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Date</label>
              <input type="date" value={form.readingDate} onChange={e => setForm(p => ({ ...p, readingDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400"/>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Unit</label>
              <div className="px-3 py-2 border border-slate-100 rounded-lg text-sm bg-slate-50 text-slate-500">{selectedMeter?.unit}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Previous Reading</label>
              <input type="number" value={form.previousReading} onChange={e => setForm(p => ({ ...p, previousReading: e.target.value }))}
                placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400"/>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Current Reading *</label>
              <input type="number" value={form.currentReading} onChange={e => setForm(p => ({ ...p, currentReading: e.target.value }))}
                placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400"/>
            </div>
          </div>

          {form.currentReading && (
            <div className={cn("flex items-center justify-between px-4 py-3 rounded-xl",
              consumption >= 0 ? "bg-indigo-50 border border-indigo-100" : "bg-red-50 border border-red-100")}>
              <div className="text-[12px] font-semibold text-slate-700">Consumption</div>
              <div className={cn("text-[16px] font-extrabold", consumption >= 0 ? "text-indigo-700" : "text-red-600")}>
                {consumption.toFixed(2)} {selectedMeter?.unit}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</label>
            <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400"/>
          </div>
        </div>
      </Modal>
    </div>
  );
}
