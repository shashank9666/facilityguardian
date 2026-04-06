"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/Button";
import { cn, uid } from "@/lib/utils";
import type { ChecklistTemplate, ChecklistField, ChecklistCategory, ChecklistSubmission } from "@/types";
import {
  ClipboardCheck, ChevronRight, ArrowLeft, CheckCircle2,
  AlertTriangle, Clock, Camera, Send,
} from "lucide-react";

// ─── Checklist Templates ───────────────────────────────────────────────────────
const TEMPLATES: ChecklistTemplate[] = [
  // ── MEP ──────────────────────────────────────────────────────────────────────
  {
    id: "tpl-dg", name: "DG Log (Running)", category: "MEP",
    frequency: "daily", estimatedMinutes: 10,
    fields: [
      { id: "f1", label: "Current Run Hours",  type: "number",  unit: "HRS", required: true },
      { id: "f2", label: "Fuel Tank Level",    type: "number",  unit: "%",   required: true },
      { id: "f3", label: "Engine Oil Quality", type: "options", options: ["Clean","Dirty","Replaced"], required: true },
      { id: "f4", label: "Noise & Vibration",  type: "options", options: ["Normal","Abnormal"] },
      { id: "f5", label: "Coolant Level",      type: "options", options: ["OK","Low","Critical"] },
      { id: "f6", label: "Battery Voltage",    type: "number",  unit: "V" },
      { id: "f7", label: "Remarks",            type: "text" },
    ],
  },
  {
    id: "tpl-lift", name: "LIFT Monthly PPM", category: "MEP",
    frequency: "monthly", estimatedMinutes: 20,
    fields: [
      { id: "f1", label: "Door Opening / Closing",  type: "options", options: ["OK","Issue"], required: true },
      { id: "f2", label: "Emergency Lighting",      type: "options", options: ["OK","Faulty"] },
      { id: "f3", label: "Emergency Intercom",      type: "options", options: ["Working","Not Working"], required: true },
      { id: "f4", label: "Leveling Accuracy",       type: "options", options: ["Accurate","Slight Offset","Off"] },
      { id: "f5", label: "Cabin Cleanliness",       type: "options", options: ["Clean","Moderate","Dirty"] },
      { id: "f6", label: "Remarks",                 type: "text" },
    ],
  },
  {
    id: "tpl-transformer", name: "Transformer Check", category: "MEP",
    frequency: "daily", estimatedMinutes: 8,
    fields: [
      { id: "f1", label: "Oil Temperature",    type: "number",  unit: "°C", required: true },
      { id: "f2", label: "Winding Temperature",type: "number",  unit: "°C", required: true },
      { id: "f3", label: "Oil Level",          type: "options", options: ["OK","Low","Critical"] },
      { id: "f4", label: "Buzzing / Humming",  type: "options", options: ["Normal","Abnormal"] },
      { id: "f5", label: "Earthing Check",     type: "options", options: ["OK","Issue"] },
      { id: "f6", label: "Remarks",            type: "text" },
    ],
  },
  {
    id: "tpl-epanel", name: "Electrical Panel", category: "MEP",
    frequency: "daily", estimatedMinutes: 8,
    fields: [
      { id: "f1", label: "Panel Temperature",  type: "number",  unit: "°C", required: true },
      { id: "f2", label: "MCB / MCCB Status",  type: "options", options: ["OK","Tripped"], required: true },
      { id: "f3", label: "Cable Condition",    type: "options", options: ["Good","Worn","Damaged"] },
      { id: "f4", label: "Indicator Lights",   type: "options", options: ["OK","Faulty"] },
      { id: "f5", label: "Remarks",            type: "text" },
    ],
  },
  {
    id: "tpl-hvac", name: "AC / HVAC Units", category: "MEP",
    frequency: "daily", estimatedMinutes: 12,
    fields: [
      { id: "f1", label: "Supply Air Temperature",  type: "number",  unit: "°C", required: true },
      { id: "f2", label: "Return Air Temperature",  type: "number",  unit: "°C", required: true },
      { id: "f3", label: "Compressor Running",      type: "options", options: ["Yes","No"] },
      { id: "f4", label: "Filter Status",           type: "options", options: ["Clean","Dirty","Replaced"] },
      { id: "f5", label: "Condensate Drain",        type: "options", options: ["Clear","Blocked"] },
      { id: "f6", label: "Remarks",                 type: "text" },
    ],
  },
  {
    id: "tpl-motor", name: "Motor Log (Multi)", category: "MEP",
    frequency: "daily", estimatedMinutes: 8,
    fields: [
      { id: "f1", label: "Motor Running",        type: "options", options: ["Yes","No"], required: true },
      { id: "f2", label: "Current Draw",         type: "number",  unit: "A", required: true },
      { id: "f3", label: "Bearing Temperature",  type: "number",  unit: "°C" },
      { id: "f4", label: "Vibration Level",      type: "options", options: ["Low","Medium","High"] },
      { id: "f5", label: "Remarks",              type: "text" },
    ],
  },
  {
    id: "tpl-ro", name: "RO Plant System", category: "MEP",
    frequency: "daily", estimatedMinutes: 10,
    fields: [
      { id: "f1", label: "Feed Water TDS",      type: "number",  unit: "ppm", required: true },
      { id: "f2", label: "Product Water TDS",   type: "number",  unit: "ppm", required: true },
      { id: "f3", label: "Recovery Rate",       type: "number",  unit: "%" },
      { id: "f4", label: "Pre-filter Pressure", type: "number",  unit: "bar" },
      { id: "f5", label: "System Running",      type: "options", options: ["Yes","No"] },
      { id: "f6", label: "Remarks",             type: "text" },
    ],
  },
  {
    id: "tpl-stp", name: "STP Plant Operation", category: "MEP",
    frequency: "daily", estimatedMinutes: 10,
    fields: [
      { id: "f1", label: "Inlet Flow Rate",       type: "number",  unit: "m³/hr", required: true },
      { id: "f2", label: "BOD Level",             type: "number",  unit: "mg/L" },
      { id: "f3", label: "Blower Running",        type: "options", options: ["Yes","No"], required: true },
      { id: "f4", label: "Treated Water Quality", type: "options", options: ["Clear","Cloudy","Dark"] },
      { id: "f5", label: "Remarks",               type: "text" },
    ],
  },

  // ── Fire Safety ───────────────────────────────────────────────────────────────
  {
    id: "tpl-fire-alarm", name: "Fire Alarm Panel", category: "Fire Safety",
    frequency: "daily", estimatedMinutes: 5,
    fields: [
      { id: "f1", label: "Panel Status",     type: "options", options: ["Normal","Fault"], required: true },
      { id: "f2", label: "Battery Backup",   type: "options", options: ["OK","Low"], required: true },
      { id: "f3", label: "Active Zone Faults", type: "number", unit: "zones" },
      { id: "f4", label: "Remarks",          type: "text" },
    ],
  },
  {
    id: "tpl-sprinkler", name: "Sprinkler System", category: "Fire Safety",
    frequency: "weekly", estimatedMinutes: 10,
    fields: [
      { id: "f1", label: "Main Valve Open",         type: "options", options: ["Yes","No"], required: true },
      { id: "f2", label: "Flow Switch Test",        type: "options", options: ["OK","Bypass","Failed"] },
      { id: "f3", label: "Spare Heads Available",   type: "options", options: ["Yes","No"] },
      { id: "f4", label: "Remarks",                 type: "text" },
    ],
  },
  {
    id: "tpl-hose-reel", name: "Fire Hose Reels", category: "Fire Safety",
    frequency: "weekly", estimatedMinutes: 15,
    fields: [
      { id: "f1", label: "Reel Condition",    type: "options", options: ["Good","Damaged","Missing"], required: true },
      { id: "f2", label: "Water Pressure",    type: "number",  unit: "bar" },
      { id: "f3", label: "Hose Condition",    type: "options", options: ["Good","Worn","Replace"] },
      { id: "f4", label: "Isolation Valve",   type: "options", options: ["Open","Closed"] },
      { id: "f5", label: "Remarks",           type: "text" },
    ],
  },
  {
    id: "tpl-pump-house", name: "Fire Pump House", category: "Fire Safety",
    frequency: "daily", estimatedMinutes: 8,
    fields: [
      { id: "f1", label: "Jockey Pump Mode", type: "options", options: ["Auto","Manual","Off"], required: true },
      { id: "f2", label: "Main Pump",        type: "options", options: ["Running","Stopped"], required: true },
      { id: "f3", label: "Diesel Pump",      type: "options", options: ["OK","Issue"] },
      { id: "f4", label: "Header Pressure",  type: "number",  unit: "bar" },
      { id: "f5", label: "Remarks",          type: "text" },
    ],
  },
  {
    id: "tpl-extinguishers", name: "Fire Extinguishers", category: "Fire Safety",
    frequency: "weekly", estimatedMinutes: 20,
    fields: [
      { id: "f1", label: "Seal Intact",       type: "options", options: ["Yes","No"], required: true },
      { id: "f2", label: "Pressure Gauge",    type: "options", options: ["OK","Low","Overpressure"], required: true },
      { id: "f3", label: "Safety Pin",        type: "options", options: ["Secured","Missing"] },
      { id: "f4", label: "Access Clear",      type: "options", options: ["Yes","No"] },
      { id: "f5", label: "Remarks",           type: "text" },
    ],
  },

  // ── Housekeeping ──────────────────────────────────────────────────────────────
  {
    id: "tpl-washroom", name: "Washroom Inspection", category: "Housekeeping",
    frequency: "daily", estimatedMinutes: 5,
    fields: [
      { id: "f1", label: "Cleanliness",       type: "options", options: ["Clean","Moderate","Dirty"], required: true },
      { id: "f2", label: "Soap / Sanitizer",  type: "options", options: ["Available","Empty"], required: true },
      { id: "f3", label: "Tissue Paper",      type: "options", options: ["Available","Empty"] },
      { id: "f4", label: "Floor Condition",   type: "options", options: ["Dry","Wet","Stained"] },
      { id: "f5", label: "Remarks",           type: "text" },
    ],
  },
  {
    id: "tpl-cafeteria", name: "Cafeteria Cleanliness", category: "Housekeeping",
    frequency: "daily", estimatedMinutes: 5,
    fields: [
      { id: "f1", label: "Tables Clean",       type: "options", options: ["Yes","No"], required: true },
      { id: "f2", label: "Floor Mopped",       type: "options", options: ["Yes","No"], required: true },
      { id: "f3", label: "Dustbin Emptied",    type: "options", options: ["Yes","No"] },
      { id: "f4", label: "Food Waste Disposed",type: "options", options: ["Yes","No"] },
      { id: "f5", label: "Remarks",            type: "text" },
    ],
  },
  {
    id: "tpl-common-areas", name: "Common Areas Round", category: "Housekeeping",
    frequency: "daily", estimatedMinutes: 8,
    fields: [
      { id: "f1", label: "Lobby Cleanliness",  type: "options", options: ["Clean","Moderate","Dirty"], required: true },
      { id: "f2", label: "Corridors Swept",    type: "options", options: ["Yes","No"] },
      { id: "f3", label: "Elevators Cleaned",  type: "options", options: ["Yes","No"] },
      { id: "f4", label: "Waste Bins",         type: "options", options: ["Empty","Half","Full"] },
      { id: "f5", label: "Remarks",            type: "text" },
    ],
  },
  {
    id: "tpl-garden", name: "Lawn & Garden Check", category: "Housekeeping",
    frequency: "weekly", estimatedMinutes: 10,
    fields: [
      { id: "f1", label: "Grass Cut",            type: "options", options: ["Yes","No"], required: true },
      { id: "f2", label: "Watering Done",        type: "options", options: ["Yes","No"] },
      { id: "f3", label: "Garden Waste Removed", type: "options", options: ["Yes","No"] },
      { id: "f4", label: "Irrigation System",    type: "options", options: ["Working","Issue"] },
      { id: "f5", label: "Remarks",              type: "text" },
    ],
  },
];

const CATEGORY_TABS: { key: "ALL" | ChecklistCategory; label: string; color: string }[] = [
  { key: "ALL",          label: "ALL",   color: "bg-indigo-600 text-white border-indigo-600" },
  { key: "MEP",          label: "MEP",   color: "bg-blue-600 text-white border-blue-600" },
  { key: "Fire Safety",  label: "FIRE",  color: "bg-red-600 text-white border-red-600" },
  { key: "Housekeeping", label: "HK",    color: "bg-emerald-600 text-white border-emerald-600" },
];

const CATEGORY_SUB: Record<string, string> = {
  "tpl-dg":           "MECHANICAL",
  "tpl-lift":         "VERTICAL TRANSPORT",
  "tpl-transformer":  "ELECTRICAL",
  "tpl-epanel":       "ELECTRICAL",
  "tpl-hvac":         "COOLING",
  "tpl-motor":        "MECHANICAL",
  "tpl-ro":           "WATER",
  "tpl-stp":          "WATER",
  "tpl-fire-alarm":   "FIRE DETECTION",
  "tpl-sprinkler":    "SUPPRESSION",
  "tpl-hose-reel":    "SUPPRESSION",
  "tpl-pump-house":   "FIRE PUMPS",
  "tpl-extinguishers":"PORTABLE",
  "tpl-washroom":     "SANITATION",
  "tpl-cafeteria":    "FOOD AREA",
  "tpl-common-areas": "COMMON",
  "tpl-garden":       "OUTDOOR",
};

// ─── Field renderer ────────────────────────────────────────────────────────────
function FieldInput({
  field, value, onChange, idx,
}: {
  field: ChecklistField;
  value: string;
  onChange: (v: string) => void;
  idx: number;
}) {
  return (
    <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/40">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-[13px] font-bold flex items-center justify-center flex-shrink-0">
            {idx}
          </div>
          <div className="text-[14px] font-semibold text-slate-800">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </div>
        </div>
        {/* Camera icon (decorative) */}
        <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors">
          <Camera size={14}/>
        </button>
      </div>

      {field.type === "number" && (
        <div className="relative">
          <input
            type="number"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-[15px] text-slate-800 outline-none focus:border-indigo-400 bg-white transition-colors"
          />
          {field.unit && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-slate-400">
              {field.unit}
            </span>
          )}
        </div>
      )}

      {field.type === "text" && (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Enter remarks..."
          rows={2}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-[13px] text-slate-800 outline-none focus:border-indigo-400 bg-white resize-none transition-colors"
        />
      )}

      {field.type === "options" && field.options && (
        <div className={cn(
          "flex gap-2 flex-wrap",
          field.options.length === 2 ? "grid grid-cols-2" : "grid grid-cols-3"
        )}>
          {field.options.map(opt => (
            <button
              key={opt}
              onClick={() => onChange(value === opt ? "" : opt)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-all",
                value === opt
                  ? opt === "Abnormal" || opt === "Dirty" || opt === "Damaged" || opt === "Critical" || opt === "Fault" || opt === "Blocked" || opt === "Missing" || opt === "Tripped" || opt === "Not Working" || opt === "Full" || opt === "High" || opt === "Dark" || opt === "Faulty" || opt === "Off" || opt === "Replaced" || opt === "Worn" || opt === "Issue" || opt === "Empty" || opt === "Low" || opt === "Cloudy"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function Checklists() {
  const { state, submitChecklist, toast } = useApp();
  const [catFilter, setCatFilter] = useState<"ALL" | ChecklistCategory>("ALL");
  const [activeTemplate, setActiveTemplate] = useState<ChecklistTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const filtered = useMemo(() =>
    catFilter === "ALL" ? TEMPLATES : TEMPLATES.filter(t => t.category === catFilter),
  [catFilter]);

  function openTemplate(tpl: ChecklistTemplate) {
    const init: Record<string, string> = {};
    tpl.fields.forEach(f => { init[f.id] = ""; });
    setFieldValues(init);
    setActiveTemplate(tpl);
    setSubmitted(false);
  }

  function handleSubmit() {
    if (!activeTemplate) return;
    // Check required fields
    const missing = activeTemplate.fields.filter(f => f.required && !fieldValues[f.id]);
    if (missing.length > 0) {
      toast(`Please fill required fields: ${missing.map(f => f.label).join(", ")}`, "error");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const fields = activeTemplate.fields.map(f => ({ ...f, value: fieldValues[f.id] ?? "" }));
      const issueCount = fields.filter(f =>
        f.value && ["Abnormal","Dirty","Damaged","Critical","Fault","Blocked","Missing","Tripped","Not Working","Faulty","Issue"].includes(f.value)
      ).length;

      const sub: ChecklistSubmission = {
        id: uid(),
        templateId: activeTemplate.id,
        templateName: activeTemplate.name,
        category: activeTemplate.category,
        submittedBy: state.currentUser.name,
        submittedAt: new Date().toISOString(),
        fields,
        notes: fieldValues["remarks"] ?? "",
        issueCount,
      };
      submitChecklist(sub);
      setSubmitting(false);
      setSubmitted(true);
      toast(`${activeTemplate.name} submitted successfully`, "success");
    }, 700);
  }

  // Count today's submissions
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = state.checklistSubmissions.filter(s =>
    s.submittedBy === state.currentUser.name && s.submittedAt.slice(0, 10) === today
  ).length;

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted && activeTemplate) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-emerald-500"/>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-800">Checklist Submitted!</div>
          <div className="text-slate-500 text-sm mt-1">{activeTemplate.name} logged successfully</div>
          <div className="text-slate-400 text-xs mt-0.5">{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => { setActiveTemplate(null); setSubmitted(false); }}>
            Back to Checklists
          </Button>
          <Button variant="primary" onClick={() => openTemplate(activeTemplate)}>
            Submit Again
          </Button>
        </div>
      </div>
    );
  }

  // ── Form view ──────────────────────────────────────────────────────────────
  if (activeTemplate) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTemplate(null)}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={16}/>
          </button>
          <div>
            <div className="text-[18px] font-bold text-slate-800">{activeTemplate.name}</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wide">{CATEGORY_SUB[activeTemplate.id] ?? activeTemplate.category} · Est. {activeTemplate.estimatedMinutes} min</div>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          {activeTemplate.fields.map((field, idx) => (
            <FieldInput
              key={field.id}
              field={field}
              idx={idx + 1}
              value={fieldValues[field.id] ?? ""}
              onChange={v => setFieldValues(prev => ({ ...prev, [field.id]: v }))}
            />
          ))}
        </div>

        {/* Submit footer */}
        <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-slate-100 py-4 flex items-center gap-3 rounded-2xl">
          <div className="flex items-center gap-2 flex-1 text-[11px] text-slate-400">
            <Clock size={12}/>
            Data auto-syncs when signal is found.
          </div>
          <Button
            variant="primary"
            loading={submitting}
            onClick={handleSubmit}
            leftIcon={<Send size={14}/>}
            className="bg-indigo-600 hover:bg-indigo-700 px-6"
          >
            Finalize &amp; Submit
          </Button>
        </div>
      </div>
    );
  }

  // ── Grid view ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Field Checklists</h1>
        <p className="text-slate-500 text-sm mt-0.5">Select a system to log daily operation data.</p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
        <ClipboardCheck size={20} className="text-indigo-600"/>
        <div className="text-[13px] font-semibold text-indigo-800">
          {todayCount} of {TEMPLATES.length} checklists submitted today
        </div>
        <div className="ml-auto flex gap-1">
          {TEMPLATES.map((_, i) => (
            <div key={i} className={cn(
              "w-2 h-2 rounded-full",
              i < todayCount ? "bg-indigo-600" : "bg-indigo-200"
            )}/>
          ))}
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setCatFilter(tab.key)}
            className={cn(
              "px-5 py-2 rounded-full text-[13px] font-semibold border transition-all",
              catFilter === tab.key
                ? tab.color
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(tpl => {
          const todaySub = state.checklistSubmissions.find(s =>
            s.templateId === tpl.id &&
            s.submittedBy === state.currentUser.name &&
            s.submittedAt.slice(0, 10) === today
          );
          return (
            <button
              key={tpl.id}
              onClick={() => openTemplate(tpl)}
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all group",
                todaySub
                  ? "bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                  : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md"
              )}
            >
              <div className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0",
                todaySub ? "bg-emerald-100" : "bg-slate-100"
              )}>
                {todaySub
                  ? <CheckCircle2 size={20} className="text-emerald-600"/>
                  : <ClipboardCheck size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors"/>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-[14px] font-bold truncate",
                  todaySub ? "text-emerald-800" : "text-slate-800"
                )}>
                  {tpl.name}
                </div>
                <div className={cn(
                  "text-[10px] font-semibold uppercase tracking-wide mt-0.5",
                  todaySub ? "text-emerald-500" : "text-slate-400"
                )}>
                  {todaySub ? "✓ Submitted today" : CATEGORY_SUB[tpl.id] ?? tpl.category}
                </div>
              </div>
              <ChevronRight size={16} className={todaySub ? "text-emerald-400" : "text-slate-300 group-hover:text-indigo-400 transition-colors"}/>
            </button>
          );
        })}
      </div>

      {/* Recent submissions */}
      {state.checklistSubmissions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="text-[14px] font-bold text-slate-800">Recent Submissions</div>
          </div>
          <div className="divide-y divide-slate-50">
            {state.checklistSubmissions.slice(0, 5).map(sub => (
              <div key={sub.id} className="flex items-center gap-3 px-5 py-3">
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                  sub.issueCount > 0 ? "bg-amber-50" : "bg-emerald-50"
                )}>
                  {sub.issueCount > 0
                    ? <AlertTriangle size={14} className="text-amber-600"/>
                    : <CheckCircle2 size={14} className="text-emerald-600"/>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-slate-800 truncate">{sub.templateName}</div>
                  <div className="text-[11px] text-slate-400">
                    {sub.submittedBy} · {new Date(sub.submittedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                {sub.issueCount > 0 && (
                  <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                    {sub.issueCount} issue{sub.issueCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
