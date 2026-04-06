"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useRole } from "@/lib/rbac";
import { fmtDate, sanitize } from "@/lib/utils";
import type { Vendor } from "@/types";
import { Star, Phone, Mail, MapPin, Plus, Pencil, Building2, TrendingUp } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  active:      "bg-green-50 text-green-700 border-green-200",
  inactive:    "bg-slate-100 text-slate-500 border-slate-200",
  blacklisted: "bg-red-50 text-red-700 border-red-200",
};

const VENDOR_CATEGORIES = [
  "HVAC","Electrical","Plumbing","Security","Cleaning","IT Infrastructure",
  "Civil Works","Elevators","Fire Safety","Landscaping","Pest Control","Other",
];

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={12}
          className={s <= Math.round(value) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}/>
      ))}
      <span className="text-xs text-slate-500 ml-1">{value.toFixed(1)}</span>
    </div>
  );
}

export function Vendors({ search }: { search: string }) {
  const { state, addVendor, updateVendor, toast } = useApp();
  const { canManageVendors } = useRole();

  const [filter, setFilter]     = useState("all");
  const [addOpen, setAddOpen]   = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [form, setForm]         = useState<Partial<Vendor>>({});
  const [saving, setSaving]     = useState(false);

  const filtered = useMemo(() => state.vendors.filter(v => {
    const q = search.toLowerCase();
    const matchQ = !q || v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q);
    const matchF = filter === "all" || v.status === filter;
    return matchQ && matchF;
  }), [state.vendors, search, filter]);

  function openAdd() {
    setForm({ status: "active", category: "Other", slaHours: 24, rating: 4.0, totalOrders: 0, completedOnTime: 0 });
    setEditVendor(null);
    setAddOpen(true);
  }

  function openEdit(v: Vendor) {
    setForm({ ...v });
    setEditVendor(v);
    setAddOpen(true);
  }

  async function handleSave() {
    if (!form.name?.trim() || !form.email?.trim()) return;
    setSaving(true);
    try {
      const body = {
        name:             sanitize(form.name!),
        category:         form.category || "Other",
        email:            sanitize(form.email!),
        phone:            sanitize(form.phone || ""),
        address:          sanitize(form.address || ""),
        status:           form.status || "active",
        slaHours:         Number(form.slaHours) || 24,
        contractStart:    form.contractStart || new Date().toISOString(),
        contractEnd:      form.contractEnd || new Date(Date.now()+365*86400000).toISOString(),
        rating:           Number(form.rating) || 4.0,
        totalOrders:      Number(form.totalOrders) || 0,
        completedOnTime:  Number(form.completedOnTime) || 0,
      };
      if (editVendor) {
        await updateVendor(editVendor.id, body);
        toast("Vendor updated", "success");
      } else {
        await addVendor(body);
        toast("Vendor added", "success");
      }
      setAddOpen(false); setForm({});
    } catch (err) {
      toast((err as Error).message ?? "Failed to save vendor", "error");
    } finally {
      setSaving(false);
    }
  }

  // Stats
  const activeCount = state.vendors.filter(v => v.status === "active").length;
  const avgRating   = state.vendors.length > 0
    ? (state.vendors.reduce((s,v) => s + v.rating, 0) / state.vendors.length).toFixed(1) : "—";
  const avgCompliance = state.vendors.filter(v => v.totalOrders > 0).length > 0
    ? Math.round(state.vendors.filter(v=>v.totalOrders>0).reduce((s,v)=>s+Math.round(v.completedOnTime/v.totalOrders*100),0)
        / state.vendors.filter(v=>v.totalOrders>0).length) : 0;

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Vendors",    val: state.vendors.length, icon: "🏢", bg: "bg-blue-50"   },
          { label: "Active",           val: activeCount,           icon: "✅", bg: "bg-green-50"  },
          { label: "Avg Rating",       val: avgRating,             icon: "⭐", bg: "bg-amber-50"  },
          { label: "Avg On-time %",    val: `${avgCompliance}%`,   icon: "📈", bg: "bg-violet-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-white rounded-xl p-4`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-[22px] font-extrabold text-slate-800">{s.val}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1.5">
          {["all","active","inactive","blacklisted"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${
                filter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
              }`}>{s}</button>
          ))}
        </div>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} vendor{filtered.length !== 1 ? "s" : ""}</span>
        {canManageVendors && (
          <Button variant="primary" size="sm" leftIcon={<Plus size={14}/>} onClick={openAdd}>
            Add Vendor
          </Button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(v => {
          const compliance = v.totalOrders > 0 ? Math.round(v.completedOnTime / v.totalOrders * 100) : 0;
          return (
            <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group relative">
              {/* Edit button */}
              {canManageVendors && (
                <button
                  onClick={() => openEdit(v)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all"
                  title="Edit vendor"
                >
                  <Pencil size={14}/>
                </button>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-slate-500"/>
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-[15px]">{v.name}</div>
                    <div className="text-xs text-slate-400">{v.category}</div>
                  </div>
                </div>
                <Badge className={STATUS_BADGE[v.status] ?? STATUS_BADGE.inactive}>{v.status}</Badge>
              </div>

              <StarRating value={v.rating} />

              <div className="space-y-1 mt-3 mb-3">
                <div className="flex items-center gap-2 text-xs text-slate-500"><Mail size={11}/>{v.email}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500"><Phone size={11}/>{v.phone}</div>
                {v.address && <div className="flex items-center gap-2 text-xs text-slate-500"><MapPin size={11}/><span className="truncate">{v.address}</span></div>}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                <div className="text-center">
                  <div className="text-[15px] font-bold text-slate-700">{v.slaHours}h</div>
                  <div className="text-[10px] text-slate-400">SLA</div>
                </div>
                <div className="text-center">
                  <div className="text-[15px] font-bold text-slate-700">{v.totalOrders}</div>
                  <div className="text-[10px] text-slate-400">Orders</div>
                </div>
                <div className="text-center">
                  <div className={`text-[15px] font-bold flex items-center justify-center gap-0.5 ${compliance>=90?"text-green-600":compliance>=70?"text-amber-600":"text-red-500"}`}>
                    <TrendingUp size={11}/>{compliance}%
                  </div>
                  <div className="text-[10px] text-slate-400">On-time</div>
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-3">
                Contract: {fmtDate(v.contractStart)} – {fmtDate(v.contractEnd)}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 py-16 text-center text-slate-400 text-sm">No vendors found</div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); setForm({}); }}
        title={editVendor ? `Edit — ${editVendor.name}` : "Add Vendor"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setAddOpen(false); setForm({}); }}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {editVendor ? "Save Changes" : "Add Vendor"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          {/* Name */}
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Vendor Name *</label>
            <input value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
              placeholder="e.g. SparkTech Electricals Pvt. Ltd."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          {/* Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Category</label>
            <select value={form.category||"Other"} onChange={e=>setForm(p=>({...p,category:e.target.value}))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400">
              {VENDOR_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Status</label>
            <select value={form.status||"active"} onChange={e=>setForm(p=>({...p,status:e.target.value as Vendor["status"]}))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400">
              {["active","inactive","blacklisted"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {/* Email */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Email *</label>
            <input type="email" value={form.email||""} onChange={e=>setForm(p=>({...p,email:e.target.value}))}
              placeholder="contact@vendor.com"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          {/* Phone */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Phone</label>
            <input value={form.phone||""} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          {/* Address */}
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Address</label>
            <input value={form.address||""} onChange={e=>setForm(p=>({...p,address:e.target.value}))}
              placeholder="Street, City, State"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          {/* SLA */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">SLA (hours)</label>
            <input type="number" min={1} value={form.slaHours||24} onChange={e=>setForm(p=>({...p,slaHours:+e.target.value}))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          {/* Rating */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Rating (1–5)</label>
            <input type="number" min={1} max={5} step={0.1} value={form.rating||4} onChange={e=>setForm(p=>({...p,rating:+e.target.value}))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          {/* Contract Start */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Contract Start</label>
            <input type="date" value={form.contractStart?.slice(0,10)||""} onChange={e=>setForm(p=>({...p,contractStart:e.target.value}))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          {/* Contract End */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Contract End</label>
            <input type="date" value={form.contractEnd?.slice(0,10)||""} onChange={e=>setForm(p=>({...p,contractEnd:e.target.value}))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
        </div>
      </Modal>
    </div>
  );
}
