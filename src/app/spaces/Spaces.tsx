"use client";

import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useRole } from "@/lib/rbac";
import { sanitize } from "@/lib/utils";
import type { Space, SpaceStatus } from "@/types";
import { Plus, Pencil, Trash2, Building2, LayoutGrid } from "lucide-react";

const STATUS_STYLE: Record<SpaceStatus, { cell: string; badge: string; label: string }> = {
  available:   { cell: "bg-green-50 border-green-300",  badge: "bg-green-50 text-green-700 border-green-200",  label: "Available" },
  occupied:    { cell: "bg-red-50 border-red-300",      badge: "bg-red-50 text-red-700 border-red-200",        label: "Occupied" },
  maintenance: { cell: "bg-amber-50 border-amber-300",  badge: "bg-amber-50 text-amber-700 border-amber-200",  label: "Maintenance" },
  reserved:    { cell: "bg-blue-50 border-blue-300",    badge: "bg-blue-50 text-blue-700 border-blue-200",     label: "Reserved" },
};

const TYPE_ICON: Record<string, string> = {
  Conference: "🏛️", Workstation: "💼", Utility: "⚙️", Cafeteria: "☕",
  Recreation: "🏃", Parking: "🚗", Storage: "📦", Other: "🏢",
};

const SPACE_TYPES = ["Conference", "Workstation", "Utility", "Cafeteria", "Recreation", "Parking", "Storage", "Other"];
const SPACE_STATUSES: SpaceStatus[] = ["available", "occupied", "maintenance", "reserved"];

export function Spaces({ search }: { search: string }) {
  const { state, addSpace, updateSpace, deleteSpace, toast, fetchSpaces } = useApp();

  const { canManageSpaces } = useRole();
  const [filterSite, setFilterSite] = useState("all");
  const [filterFloor, setFilterFloor] = useState("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Space | null>(null);
  const [form, setForm] = useState<Partial<Space>>({});
  const [saving, setSaving] = useState(false);
  const [detailSpace, setDetailSpace] = useState<Space | null>(null);

  useEffect(() => {
    fetchSpaces({
      q: search,
      status: filterStatus === "all" ? "" : filterStatus,
      site: filterSite === "all" ? "" : filterSite,
      floor: filterFloor === "all" ? "" : filterFloor,
    });
  }, [fetchSpaces, search, filterStatus, filterSite, filterFloor]);

  const filtered = state.spaces;

  // For dropdowns, we can still derive from state.spaces (or have another fetch)
  const sites = useMemo(() =>
    [...new Set(state.spaces.map(s => s.site || "Main Campus"))].sort(),
  [state.spaces]);

  const floors = useMemo(() => {
    const src = filterSite === "all" ? state.spaces : state.spaces.filter(s => (s.site || "Main Campus") === filterSite);
    return [...new Set(src.map(s => s.floor))].sort();
  }, [state.spaces, filterSite]);

  const bySite = useMemo(() => {
    const map = new Map<string, Space[]>();
    filtered.forEach(s => {
      const key = s.site || "Main Campus";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [filtered]);

  const totalCapacity = state.spaces.reduce((s, sp) => s + sp.capacity, 0);
  const totalOccupied = state.spaces.reduce((s, sp) => s + sp.occupied, 0);
  const occupancyPct  = totalCapacity > 0 ? Math.round(totalOccupied / totalCapacity * 100) : 0;

  function openAdd() {
    setForm({ status: "available", type: "Workstation", capacity: 1, occupied: 0, area: 0 });
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(space: Space, e: React.MouseEvent) {
    e.stopPropagation();
    setForm({ ...space });
    setEditing(space);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name?.trim() || !form.floor?.trim() || !form.building?.trim()) {
      toast("Name, Floor, and Building are required", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name:       sanitize(form.name!),
        type:       form.type || "Other",
        site:       sanitize(form.site || "Main Campus"),
        floor:      sanitize(form.floor!),
        building:   sanitize(form.building!),
        capacity:   Number(form.capacity) || 0,
        occupied:   Number(form.occupied) || 0,
        status:     form.status || "available",
        assignedTo: sanitize(form.assignedTo || ""),
        area:       Number(form.area) || 0,
      };
      if (editing) {
        await updateSpace(editing.id, payload);
        toast("Space updated", "success");
      } else {
        await addSpace(payload);
        toast("Space added", "success");
      }
      setModalOpen(false);
      setForm({});
    } catch (err) {
      toast((err as Error).message ?? "Failed to save space", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this space? This cannot be undone.")) return;
    try {
      await deleteSpace(id);
      toast("Space deleted", "success");
    } catch (err) {
      toast((err as Error).message ?? "Failed to delete space", "error");
    }
  }

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Spaces",  val: state.spaces.length,                                    icon: "🏢", bg: "bg-blue-50"   },
          { label: "Occupancy",     val: `${occupancyPct}%`,                                      icon: "📊", bg: "bg-amber-50"  },
          { label: "Available",     val: state.spaces.filter(s => s.status === "available").length, icon: "✅", bg: "bg-green-50"  },
          { label: "Maintenance",   val: state.spaces.filter(s => s.status === "maintenance").length, icon: "🔧", bg: "bg-red-50" },
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
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Site:</span>
          <button onClick={() => { setFilterSite("all"); setFilterFloor("all"); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterSite === "all" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-400"}`}>
            All Sites
          </button>
          {sites.map(site => (
            <button key={site} onClick={() => { setFilterSite(site); setFilterFloor("all"); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterSite === site ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-400"}`}>
              {site} <span className="opacity-60 text-[10px] ml-1">{state.spaces.filter(s => (s.site || "Main Campus") === site).length}</span>
            </button>
          ))}
        </div>
        {canManageSpaces && (
          <Button variant="primary" size="sm" leftIcon={<Plus size={14}/>} onClick={openAdd}>
            Add Space
          </Button>
        )}
      </div>

      {/* Floor + Status Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterFloor("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterFloor === "all" ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-500 border-slate-200"}`}>
            All Floors
          </button>
          {floors.map(f => (
            <button key={f} onClick={() => setFilterFloor(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterFloor === f ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-500 border-slate-200"}`}>
              Floor {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 ml-auto">
          {["all", "available", "occupied", "maintenance", "reserved"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${filterStatus === s ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-500 border-slate-200"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Spaces grouped by site */}
      {bySite.size === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
          <LayoutGrid size={36} className="opacity-20"/>
          <p className="text-sm">No spaces found</p>
          {canManageSpaces && <Button variant="primary" size="sm" leftIcon={<Plus size={14}/>} onClick={openAdd}>Add First Space</Button>}
        </div>
      )}
      {[...bySite.entries()].map(([site, spaces]) => (
        <div key={site}>
          {filterSite === "all" && (
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[13px] font-bold text-slate-700">📍 {site}</span>
              <span className="text-xs text-slate-400">{spaces.length} spaces</span>
              <div className="flex-1 h-px bg-slate-100"/>
            </div>
          )}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {spaces.map(space => {
              const style = STATUS_STYLE[space.status];
              const occ = space.capacity > 0 ? Math.round(space.occupied / space.capacity * 100) : 0;
              return (
                <div key={space.id} onClick={() => setDetailSpace(space)}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md group relative ${style.cell}`}>
                  {/* Action buttons */}
                  {canManageSpaces && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => openEdit(space, e)}
                        className="w-6 h-6 rounded-lg bg-white/80 flex items-center justify-center text-slate-500 hover:text-blue-600 shadow-sm transition-colors"
                        title="Edit"
                      ><Pencil size={11}/></button>
                      <button
                        onClick={e => handleDelete(space.id, e)}
                        className="w-6 h-6 rounded-lg bg-white/80 flex items-center justify-center text-slate-500 hover:text-red-600 shadow-sm transition-colors"
                        title="Delete"
                      ><Trash2 size={11}/></button>
                    </div>
                  )}
                  <div className="text-2xl mb-1">{TYPE_ICON[space.type] || "🏢"}</div>
                  <div className="font-semibold text-slate-800 text-[13px] leading-tight mb-1">{space.name}</div>
                  <div className="text-xs text-slate-400 mb-2">Floor {space.floor} · {space.building} · {space.area} sqft</div>
                  <Badge className={style.badge}>{style.label}</Badge>
                  {space.capacity > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>{space.occupied}/{space.capacity}</span><span>{occ}%</span>
                      </div>
                      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${occ > 80 ? "bg-red-400" : occ > 60 ? "bg-amber-400" : "bg-green-400"}`} style={{ width: `${occ}%` }}/>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setForm({}); }}
        title={editing ? `Edit — ${editing.name}` : "Add Space"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); setForm({}); }}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {editing ? "Save Changes" : "Add Space"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Space Name *</label>
            <input value={form.name || ""} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Conference Room A"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Type</label>
            <select value={form.type || "Workstation"} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400">
              {SPACE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Status</label>
            <select value={form.status || "available"} onChange={e => setForm(p => ({ ...p, status: e.target.value as SpaceStatus }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400">
              {SPACE_STATUSES.map(s => <option key={s} value={s}>{STATUS_STYLE[s].label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Site / Campus</label>
            <input value={form.site || ""} onChange={e => setForm(p => ({ ...p, site: e.target.value }))}
              placeholder="e.g. Main Campus"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Building *</label>
            <input value={form.building || ""} onChange={e => setForm(p => ({ ...p, building: e.target.value }))}
              placeholder="e.g. Block A"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Floor *</label>
            <input value={form.floor || ""} onChange={e => setForm(p => ({ ...p, floor: e.target.value }))}
              placeholder="e.g. G, 1, 2B"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Area (sqft)</label>
            <input type="number" min={0} value={form.area || ""} onChange={e => setForm(p => ({ ...p, area: +e.target.value }))}
              placeholder="0"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Capacity</label>
            <input type="number" min={0} value={form.capacity ?? ""} onChange={e => setForm(p => ({ ...p, capacity: +e.target.value }))}
              placeholder="0"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Current Occupancy</label>
            <input type="number" min={0} value={form.occupied ?? ""} onChange={e => setForm(p => ({ ...p, occupied: +e.target.value }))}
              placeholder="0"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Assigned To</label>
            <select
              value={form.assignedTo || ""}
              onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
            >
              <option value="">Select Manager / Responsible Person</option>
              {state.technicians.map((u) => (
                <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {detailSpace && (
        <Modal open={!!detailSpace} onClose={() => setDetailSpace(null)} title={detailSpace.name}
          footer={
            <div className="flex gap-2 w-full justify-between">
              {canManageSpaces && (
                <div className="flex gap-2">
                  <Button variant="secondary" leftIcon={<Pencil size={13}/>} onClick={e => { setDetailSpace(null); openEdit(detailSpace, e as unknown as React.MouseEvent); }}>
                    Edit
                  </Button>
                  <Button variant="secondary" leftIcon={<Trash2 size={13}/>}
                    onClick={async e => { await handleDelete(detailSpace.id, e as unknown as React.MouseEvent); setDetailSpace(null); }}
                    className="text-red-600 hover:bg-red-50 border-red-200">
                    Delete
                  </Button>
                </div>
              )}
              <Button variant="primary" onClick={() => setDetailSpace(null)}>Close</Button>
            </div>
          }>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Site",         detailSpace.site || "Main Campus"],
              ["Type",         `${TYPE_ICON[detailSpace.type] || "🏢"} ${detailSpace.type}`],
              ["Status",       STATUS_STYLE[detailSpace.status].label],
              ["Floor",        `Floor ${detailSpace.floor}`],
              ["Building",     detailSpace.building],
              ["Area",         `${detailSpace.area} sqft`],
              ["Capacity",     String(detailSpace.capacity)],
              ["Occupied",     String(detailSpace.occupied)],
              ["Assigned To",  detailSpace.assignedTo || "—"],
            ].map(([l, v]) => (
              <div key={l} className="bg-slate-50 rounded-lg p-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{l}</div>
                <div className="text-sm font-medium text-slate-700">{v || "—"}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
