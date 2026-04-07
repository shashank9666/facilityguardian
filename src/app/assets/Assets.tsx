"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { assetStatusVariant, fmtDate, fmtCurrency, sanitize } from "@/lib/utils";
import { useRole } from "@/lib/rbac";
import { apiGetAssets } from "./api";
import type { Asset, AssetCategory, AssetStatus } from "@/types";
import { Plus, Eye, Pencil, Trash2, LayoutGrid, Table2 } from "lucide-react";

const CATEGORY_ICONS: Record<AssetCategory, string> = {
  HVAC: "❄️", Electrical: "⚡", Plumbing: "🔧", Elevator: "🛗",
  "Fire Safety": "🔥", IT: "💻", Furniture: "🪑", Vehicle: "🚗", Other: "📦",
};

const STATUS_EMOJI: Record<AssetStatus, string> = {
  operational: "🟢", maintenance: "🟡", faulty: "🔴", decommissioned: "⚫",
};

const CATEGORY_LIST = ["HVAC","Electrical","Plumbing","Elevator","Fire Safety","IT","Furniture","Vehicle","Other"];
const STATUS_LIST: AssetStatus[] = ["operational","maintenance","faulty","decommissioned"];

export function Assets({ search }: { search: string }) {
  const { addAsset, updateAsset, deleteAsset, toast } = useApp();
  const { canCreate, canDeleteAsset } = useRole();

  // ── Server-driven filtered list ──────────────────────────────────────────
  const [assets, setAssets]           = useState<Asset[]>([]);
  const [total, setTotal]             = useState(0);
  const [filterStatus, setFilterStatus]     = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [loading, setLoading]         = useState(false);
  const [viewMode, setViewMode]       = useState<"table" | "grid">("table");

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<Asset | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [form, setForm]             = useState<Partial<Asset>>({});
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [saving, setSaving]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus !== "all")   params.status   = filterStatus;
      if (filterCategory !== "all") params.category = filterCategory;
      if (search)                   params.q        = search;
      const res = await apiGetAssets(params) as unknown as { data: Asset[]; total: number } | Asset[];
      // apiGetAssets returns normalized array directly
      if (Array.isArray(res)) {
        setAssets(res as Asset[]);
        setTotal((res as Asset[]).length);
      } else {
        setAssets((res as any).data ?? res);
        setTotal((res as any).total ?? (res as any).data?.length ?? 0);
      }
    } catch (err) {
      toast((err as Error).message ?? "Failed to fetch assets", "error");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory, search, toast]);

  useEffect(() => { load(); }, [load]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name?.trim())     e.name = "Asset name is required";
    if (!form.category)         e.category = "Category is required";
    if (!form.location?.trim()) e.location = "Location is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function openAdd() {
    setForm({ status: "operational", category: undefined });
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(a: Asset, e?: React.MouseEvent) {
    e?.stopPropagation();
    setForm({ ...a });
    setEditing(a);
    setDetailAsset(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: sanitize(form.name!), category: form.category,
        status: form.status || "operational",
        location: sanitize(form.location!), floor: sanitize(form.floor || ""),
        building: sanitize(form.building || ""), serialNumber: sanitize(form.serialNumber || ""),
        manufacturer: sanitize(form.manufacturer || ""), model: sanitize(form.model || ""),
        purchaseDate: form.purchaseDate || undefined, warrantyExpiry: form.warrantyExpiry || undefined,
        nextMaintenance: form.nextMaintenance || undefined,
        value: Number(form.value) || 0, notes: sanitize(form.notes || ""),
      };
      if (editing) {
        await updateAsset(editing.id, payload);
        toast("Asset updated", "success");
      } else {
        await addAsset(payload);
        toast("Asset added", "success");
      }
      setModalOpen(false); setForm({});
      load();
    } catch (err) {
      toast((err as Error).message ?? "Failed to save asset", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this asset? This cannot be undone.")) return;
    try {
      await deleteAsset(id);
      toast("Asset deleted", "warning");
      load();
    } catch (err) {
      toast((err as Error).message ?? "Failed to delete asset", "error");
    }
  }

  const fieldDefs = [
    { label: "Asset Name *", key: "name",            type: "text",   placeholder: "e.g. Central HVAC Unit" },
    { label: "Location *",   key: "location",        type: "text",   placeholder: "e.g. Mechanical Room" },
    { label: "Floor",        key: "floor",            type: "text",   placeholder: "e.g. B1" },
    { label: "Building",     key: "building",         type: "text",   placeholder: "e.g. Block A" },
    { label: "Serial Number",key: "serialNumber",     type: "text",   placeholder: "SN-XXXX" },
    { label: "Manufacturer", key: "manufacturer",     type: "text",   placeholder: "e.g. Daikin" },
    { label: "Model",        key: "model",            type: "text",   placeholder: "e.g. FT50MV16" },
    { label: "Purchase Date",key: "purchaseDate",     type: "date" },
    { label: "Warranty Expiry", key: "warrantyExpiry",type: "date" },
    { label: "Next Maintenance",key:"nextMaintenance",type: "date" },
    { label: "Value (₹)",   key: "value",            type: "number", placeholder: "0" },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status filter */}
        <div className="flex gap-1.5">
          {["all", ...STATUS_LIST].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterStatus === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-400"}`}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {/* Category filter */}
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="ml-auto px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-600">
          <option value="all">All Categories</option>
          {CATEGORY_LIST.map(c => <option key={c}>{c}</option>)}
        </select>
        <Button variant="ghost" size="sm"
          leftIcon={viewMode === "table" ? <LayoutGrid size={13}/> : <Table2 size={13}/>}
          onClick={() => setViewMode(v => v === "table" ? "grid" : "table")}>
          {viewMode === "table" ? "Grid" : "Table"}
        </Button>
        {canCreate && (
          <Button variant="primary" size="sm" leftIcon={<Plus size={14}/>} onClick={openAdd}>
            Add Asset
          </Button>
        )}
      </div>

      {/* Table view */}
      {viewMode === "table" ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Code","Asset","Category","Location","Status","Last Maint.","Value","Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/80 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">Loading…</td></tr>
                )}
                {!loading && assets.map(a => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{a.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-700">{a.name}</div>
                      <div className="text-xs text-slate-400">{a.manufacturer} {a.model}</div>
                    </td>
                    <td className="px-4 py-3"><span className="text-sm">{CATEGORY_ICONS[a.category]} {a.category}</span></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{a.location}<br/>{a.building} · {a.floor}</td>
                    <td className="px-4 py-3">
                      <Badge className={assetStatusVariant[a.status]}>{STATUS_EMOJI[a.status]} {a.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(a.lastMaintenance)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">{fmtCurrency(a.value)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setDetailAsset(a)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="View"><Eye size={14}/></button>
                        {canCreate && <button onClick={() => openEdit(a)} className="p-1.5 rounded hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit"><Pencil size={14}/></button>}
                        {canDeleteAsset && <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={14}/></button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && assets.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">No assets found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400 rounded-b-xl">
            Showing {assets.length} asset{assets.length !== 1 ? "s" : ""} {total !== assets.length && `of ${total}`}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {assets.map(a => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group relative"
              onClick={() => setDetailAsset(a)}>
              <div className="h-20 flex items-center justify-center text-5xl bg-gradient-to-br from-slate-50 to-blue-50 border-b border-slate-100">
                {CATEGORY_ICONS[a.category]}
              </div>
              {canCreate && (
                <button onClick={e => openEdit(a, e)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/80 flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                  <Pencil size={13}/>
                </button>
              )}
              <div className="p-4">
                <div className="font-semibold text-slate-800 text-[14px] truncate">{a.name}</div>
                <div className="text-xs font-mono text-slate-400 mb-2">{a.code}</div>
                <div className="flex items-center justify-between">
                  <Badge className={assetStatusVariant[a.status]}>{a.status}</Badge>
                  <span className="text-xs font-semibold text-slate-600">{fmtCurrency(a.value)}</span>
                </div>
                <div className="text-xs text-slate-400 mt-2">📍 {a.location}</div>
              </div>
            </div>
          ))}
          {assets.length === 0 && !loading && (
            <div className="col-span-3 py-16 text-center text-slate-400 text-sm">No assets found</div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setForm({}); setErrors({}); }}
        title={editing ? `Edit — ${editing.name}` : "Add New Asset"} size="lg"
        footer={<>
          <Button variant="secondary" onClick={() => { setModalOpen(false); setForm({}); setErrors({}); }}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>{editing ? "Save Changes" : "Add Asset"}</Button>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          {fieldDefs.map(f => (
            <div key={f.key}>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{f.label}</label>
              <input type={f.type}
                value={(form as Record<string, string | number>)[f.key] as string || ""}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${errors[f.key] ? "border-red-400" : "border-slate-200"} focus:border-blue-400`}
              />
              {errors[f.key] && <p className="text-xs text-red-500 mt-1">{errors[f.key]}</p>}
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Category *</label>
            <select value={form.category || ""} onChange={e => setForm(p => ({ ...p, category: e.target.value as AssetCategory }))}
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none ${errors.category ? "border-red-400" : "border-slate-200"} focus:border-blue-400`}>
              <option value="">Select category</option>
              {CATEGORY_LIST.map(c => <option key={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Status</label>
            <select value={form.status || "operational"} onChange={e => setForm(p => ({ ...p, status: e.target.value as AssetStatus }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400">
              {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</label>
            <textarea value={form.notes || ""} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 resize-none"/>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {detailAsset && (
        <Modal open={!!detailAsset} onClose={() => setDetailAsset(null)} title={detailAsset.name} size="lg"
          footer={
            <div className="flex w-full justify-between">
              {canCreate && (
                <div className="flex gap-2">
                  <Button variant="secondary" leftIcon={<Pencil size={13}/>} onClick={() => openEdit(detailAsset)}>Edit</Button>
                  {canDeleteAsset && (
                    <Button variant="secondary" leftIcon={<Trash2 size={13}/>}
                      onClick={() => { handleDelete(detailAsset.id); setDetailAsset(null); }}
                      className="text-red-600 hover:bg-red-50 border-red-200">Delete</Button>
                  )}
                </div>
              )}
              <Button variant="primary" onClick={() => setDetailAsset(null)}>Close</Button>
            </div>
          }>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Asset Code",    detailAsset.code],
              ["Category",      `${CATEGORY_ICONS[detailAsset.category]} ${detailAsset.category}`],
              ["Status",        `${STATUS_EMOJI[detailAsset.status]} ${detailAsset.status}`],
              ["Location",      detailAsset.location],
              ["Floor/Building",`${detailAsset.floor} · ${detailAsset.building}`],
              ["Serial Number", detailAsset.serialNumber],
              ["Manufacturer",  detailAsset.manufacturer],
              ["Model",         detailAsset.model],
              ["Purchase Date", fmtDate(detailAsset.purchaseDate)],
              ["Warranty",      fmtDate(detailAsset.warrantyExpiry)],
              ["Last Maint.",   fmtDate(detailAsset.lastMaintenance)],
              ["Next Maint.",   fmtDate(detailAsset.nextMaintenance)],
              ["Value",         fmtCurrency(detailAsset.value)],
            ].map(([l, v]) => (
              <div key={l} className="bg-slate-50 rounded-lg p-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{l}</div>
                <div className="text-sm font-medium text-slate-700">{v || "—"}</div>
              </div>
            ))}
            {detailAsset.notes && (
              <div className="col-span-2 bg-blue-50 rounded-lg p-3">
                <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide mb-1">Notes</div>
                <div className="text-sm text-slate-700">{detailAsset.notes}</div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
