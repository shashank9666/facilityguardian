"use client";

import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn, fmtDate, daysUntil, sanitize } from "@/lib/utils";
import type { AMCContract, AMCStatus } from "@/types";
import {
  FileText, Plus, Pencil, Phone, Calendar, AlertTriangle,
  CheckCircle2, Clock, RefreshCw, IndianRupee,
} from "lucide-react";

const STATUS_BADGE: Record<AMCStatus, string> = {
  active:          "bg-green-50 text-green-700 border-green-200",
  expiring_soon:   "bg-amber-50 text-amber-700 border-amber-200",
  expired:         "bg-red-50 text-red-700 border-red-200",
  under_renewal:   "bg-blue-50 text-blue-700 border-blue-200",
};

const STATUS_ICON: Record<AMCStatus, React.ReactNode> = {
  active:        <CheckCircle2 size={12}/>,
  expiring_soon: <AlertTriangle size={12}/>,
  expired:       <Clock size={12}/>,
  under_renewal: <RefreshCw size={12}/>,
};

const STATUS_LABEL: Record<AMCStatus, string> = {
  active:        "Active",
  expiring_soon: "Expiring Soon",
  expired:       "Expired",
  under_renewal: "Under Renewal",
};

const AMC_CATEGORIES = [
  "Mechanical","Electrical","HVAC","Fire Safety","Vertical Transport",
  "IT Infrastructure","Water Treatment","Security","Civil","Other",
];

function computeStatus(endDate: string): AMCStatus {
  const days = daysUntil(endDate);
  if (days < 0) return "expired";
  if (days <= 45) return "expiring_soon";
  return "active";
}

export function AMC({ search }: { search: string }) {
  const { state, addAMC, updateAMC, toast, fetchAMC } = useApp();

  useEffect(() => {
    fetchAMC();
  }, [fetchAMC]);

  const contracts = state.amcContracts;

  const [filterStatus, setFilterStatus] = useState("all");
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<AMCContract | null>(null);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState<Partial<AMCContract>>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contracts.filter(c => {
      const matchQ = !q || c.title.toLowerCase().includes(q) || c.vendorName.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
      const matchS = filterStatus === "all" || c.status === filterStatus;
      return matchQ && matchS;
    });
  }, [contracts, search, filterStatus]);

  function openAdd() {
    setForm({
      status: "active", category: "Mechanical",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      value: 0, renewalAlertDays: 60,
    });
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(c: AMCContract) {
    setForm({ ...c });
    setEditing(c);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title?.trim() || !form.vendorName?.trim()) return;
    setSaving(true);
    try {
      const payload = {
        contractNumber:   sanitize(form.contractNumber || `AMC/${(contracts.length + 1).toString().padStart(3,"0")}`),
        title:            sanitize(form.title!),
        vendorName:       sanitize(form.vendorName!),
        category:         form.category || "Other",
        scope:            sanitize(form.scope || ""),
        startDate:        form.startDate || new Date().toISOString().slice(0, 10),
        endDate:          form.endDate || "",
        value:            Number(form.value) || 0,
        status:           computeStatus(form.endDate || ""),
        renewalAlertDays: Number(form.renewalAlertDays) || 60,
        contactPerson:    sanitize(form.contactPerson || ""),
        contactPhone:     sanitize(form.contactPhone || ""),
        notes:            sanitize(form.notes || ""),
      };

      if (editing) {
        await updateAMC(editing.id, payload);
        toast("Contract updated", "success");
      } else {
        await addAMC(payload);
        toast("Contract added", "success");
      }
      setModalOpen(false); setForm({});
    } catch (err) {
      toast((err as Error).message ?? "Failed to save contract", "error");
    } finally {
      setSaving(false);
    }
  }

  // Stats
  const activeCount  = contracts.filter(c => c.status === "active").length;
  const expiringCount = contracts.filter(c => c.status === "expiring_soon").length;
  const expiredCount = contracts.filter(c => c.status === "expired").length;
  const totalValue   = contracts.filter(c => c.status !== "expired").reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Contracts",  val: contracts.length,  icon: <FileText size={18}/>,        color: "text-blue-600 bg-blue-50" },
          { label: "Active",           val: activeCount,        icon: <CheckCircle2 size={18}/>,    color: "text-green-600 bg-green-50" },
          { label: "Expiring Soon",    val: expiringCount,      icon: <AlertTriangle size={18}/>,   color: "text-amber-600 bg-amber-50" },
          { label: "Active Value",     val: `₹${(totalValue/100000).toFixed(1)}L`, icon: <IndianRupee size={18}/>, color: "text-indigo-600 bg-indigo-50" },
        ].map(k => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${k.color}`}>{k.icon}</div>
            <div className="text-[22px] font-extrabold text-slate-800">{k.val}</div>
            <div className="text-[11px] text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Expiry alerts */}
      {expiringCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5"/>
          <div>
            <div className="text-[13px] font-semibold text-amber-800">
              {expiringCount} contract{expiringCount > 1 ? "s" : ""} expiring within 45 days
            </div>
            <div className="text-[11px] text-amber-600 mt-0.5">
              {contracts.filter(c => c.status === "expiring_soon").map(c => c.title).join(" · ")}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1.5">
          {["all","active","expiring_soon","expired","under_renewal"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all",
                filterStatus === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
              )}>
              {s.replace("_"," ")}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} contract{filtered.length !== 1 ? "s" : ""}</span>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14}/>} onClick={openAdd}>
          Add Contract
        </Button>
      </div>

      {/* Contract list */}
      <div className="space-y-3">
        {filtered.map(c => {
          const days = daysUntil(c.endDate);
          return (
            <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative">
              {/* Edit */}
              <button onClick={() => openEdit(c)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all">
                <Pencil size={14}/>
              </button>

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-slate-500"/>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <div className="text-[15px] font-bold text-slate-800">{c.title}</div>
                    <Badge className={STATUS_BADGE[c.status]}>
                      <span className="flex items-center gap-1">{STATUS_ICON[c.status]} {STATUS_LABEL[c.status]}</span>
                    </Badge>
                  </div>
                  <div className="text-[12px] text-slate-500 mb-2">{c.vendorName} · <span className="text-slate-400">{c.contractNumber}</span></div>
                  {c.scope && <div className="text-[12px] text-slate-400 mb-3 leading-relaxed">{c.scope}</div>}

                  <div className="grid grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide">Category</div>
                      <div className="text-[12px] font-semibold text-slate-700 mt-0.5">{c.category}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide">Contract Period</div>
                      <div className="text-[12px] font-semibold text-slate-700 mt-0.5">
                        {fmtDate(c.startDate)} – {fmtDate(c.endDate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide">Annual Value</div>
                      <div className="text-[12px] font-semibold text-indigo-600 mt-0.5">
                        ₹{c.value.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide">Expires In</div>
                      <div className={cn(
                        "text-[12px] font-semibold mt-0.5",
                        days < 0 ? "text-red-600" : days <= 45 ? "text-amber-600" : "text-green-600"
                      )}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days} days`}
                      </div>
                    </div>
                  </div>

                  {(c.contactPerson || c.contactPhone) && (
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
                      {c.contactPerson && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Calendar size={11}/>{c.contactPerson}
                        </div>
                      )}
                      {c.contactPhone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Phone size={11}/>{c.contactPhone}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">
            <FileText size={28} className="mx-auto mb-2 opacity-30"/>
            No AMC contracts found
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setForm({}); }}
        title={editing ? `Edit — ${editing.title}` : "Add AMC Contract"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); setForm({}); }}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {editing ? "Save Changes" : "Add Contract"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Contract Title *</label>
            <input value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}
              placeholder="e.g. HVAC Annual Maintenance Contract"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Contract Number</label>
            <input value={form.contractNumber||""} onChange={e=>setForm(p=>({...p,contractNumber:e.target.value}))}
              placeholder="AMC/001"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Category</label>
            <select value={form.category||"Mechanical"} onChange={e=>setForm(p=>({...p,category:e.target.value}))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400">
              {AMC_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Vendor Name *</label>
            <input value={form.vendorName||""} onChange={e=>setForm(p=>({...p,vendorName:e.target.value}))}
              placeholder="e.g. Johnson Controls India Pvt. Ltd."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Scope of Work</label>
            <textarea value={form.scope||""} onChange={e=>setForm(p=>({...p,scope:e.target.value}))}
              placeholder="Describe what is covered under this AMC..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 resize-none"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Start Date</label>
            <input type="date" value={form.startDate?.slice(0,10)||""} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">End Date</label>
            <input type="date" value={form.endDate?.slice(0,10)||""} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Annual Value (₹)</label>
            <input type="number" min={0} value={form.value||""} onChange={e=>setForm(p=>({...p,value:+e.target.value}))}
              placeholder="150000"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Renewal Alert (days before)</label>
            <input type="number" min={1} value={form.renewalAlertDays||60} onChange={e=>setForm(p=>({...p,renewalAlertDays:+e.target.value}))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Contact Person</label>
            <input value={form.contactPerson||""} onChange={e=>setForm(p=>({...p,contactPerson:e.target.value}))}
              placeholder="Vendor contact name"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Contact Phone</label>
            <input value={form.contactPhone||""} onChange={e=>setForm(p=>({...p,contactPhone:e.target.value}))}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</label>
            <input value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
        </div>
      </Modal>
    </div>
  );
}
