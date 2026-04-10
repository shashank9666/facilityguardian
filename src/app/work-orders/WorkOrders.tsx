"use client";

import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { priorityVariant, woStatusVariant, priorityDot, fmtDate, timeAgo, sanitize, daysUntil } from "@/lib/utils";
import { useRole } from "@/lib/rbac";
import type { WorkOrder, WOStatus, WOType, Priority } from "@/types";
import { Plus, ChevronRight, AlertOctagon, Clock } from "lucide-react";

const STATUS_COLS: { status: WOStatus; label: string; color: string; bg: string }[] = [
  { status:"open",        label:"Open",        color:"text-blue-700",   bg:"bg-blue-100"  },
  { status:"assigned",    label:"Assigned",    color:"text-indigo-700", bg:"bg-indigo-100"},
  { status:"in_progress", label:"In Progress", color:"text-amber-700",  bg:"bg-amber-100" },
  { status:"on_hold",     label:"On Hold",     color:"text-slate-600",  bg:"bg-slate-100" },
  { status:"completed",   label:"Completed",   color:"text-green-700",  bg:"bg-green-100" },
];

export function WorkOrders({ search }: { search: string }) {
  const { state, addWorkOrder, updateWorkOrder, toast, fetchWorkOrders, fetchAssets, fetchTechnicians } = useApp();

  const { canCreate, canDeleteWO } = useRole();
  const [view, setView] = useState<"list"|"kanban">("list");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [detailWO, setDetailWO] = useState<WorkOrder | null>(null);
  const [form, setForm] = useState<Partial<WorkOrder & {assetName: string}>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWorkOrders({
      q: search,
      priority: filterPriority === "all" ? "" : filterPriority,
      type: filterType === "all" ? "" : filterType,
    });
    fetchAssets();
    fetchTechnicians();
  }, [fetchWorkOrders, fetchAssets, fetchTechnicians, search, filterPriority, filterType]);

  const filtered = state.workOrders;

  async function handleAdd() {
    if (!form.title?.trim()) return;
    setSaving(true);
    try {
      await addWorkOrder({
        title: sanitize(form.title!), description: sanitize(form.description || ""),
        type: form.type || "corrective", priority: form.priority || "medium",
        location: sanitize(form.location || ""),
        dueDate: form.dueDate || new Date(Date.now()+7*86400000).toISOString(),
        estimatedHours: Number(form.estimatedHours) || 2,
        assignedTo: form.assignedTo || undefined,
      });
      toast("Work order created", "success");
      setAddOpen(false); setForm({});
    } catch (err) { 
      toast((err as Error).message ?? "Failed to create", "error"); 
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(wo: WorkOrder, status: WOStatus) {
    try {
      const updated = await updateWorkOrder(wo.id, { status }) as unknown as WorkOrder;
      setDetailWO(updated ?? { ...wo, status });
      toast(`Work order ${status.replace("_"," ")}`, "info");
    } catch (err) { toast((err as Error).message ?? "Failed to update", "error"); }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {["all","critical","high","medium","low"].map(p => (
            <button key={p} onClick={()=>setFilterPriority(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
                filterPriority===p ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
              }`}>{p}</button>
          ))}
        </div>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)}
          className="ml-auto px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
          {["all","corrective","preventive","inspection","emergency"].map(t=><option key={t}>{t}</option>)}
        </select>
        <Button variant="ghost" size="sm" onClick={()=>setView(v=>v==="list"?"kanban":"list")}>
          {view==="list" ? "Kanban" : "List"}
        </Button>
        {canCreate && <Button variant="primary" size="sm" leftIcon={<Plus size={14}/>} onClick={()=>setAddOpen(true)}>New Work Order</Button>}
      </div>

      {/* List View */}
      {view === "list" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["","WO#","Title","Type","Priority","Status","Assigned To","Due Date","Actions"].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/80">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(wo => {
                  const overdue = wo.status!=="completed" && daysUntil(wo.dueDate) < 0;
                  return (
                    <tr key={wo.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="pl-4">
                        <div className={`w-2 h-2 rounded-full ${priorityDot[wo.priority]}`} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{wo.woNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-700 truncate max-w-[220px]">{wo.title}</div>
                        {wo.assetName && <div className="text-xs text-slate-400">🔧 {wo.assetName}</div>}
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-500 text-xs">{wo.type}</td>
                      <td className="px-4 py-3"><Badge className={priorityVariant[wo.priority]}>{wo.priority}</Badge></td>
                      <td className="px-4 py-3"><Badge className={woStatusVariant[wo.status]}>{wo.status.replace("_"," ")}</Badge></td>
                      <td className="px-4 py-3 text-xs text-slate-500">{wo.assignedTo || "—"}</td>
                      <td className={`px-4 py-3 text-xs font-medium ${overdue?"text-red-500":"text-slate-500"}`}>
                        {overdue && <AlertOctagon size={12} className="inline mr-1"/>}{fmtDate(wo.dueDate)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={()=>setDetailWO(wo)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                            <ChevronRight size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length===0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-sm">No work orders found</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400 rounded-b-xl">
            {filtered.length} work orders · {state.workOrders.filter(w=>w.status==="completed").length} completed
          </div>
        </Card>
      )}

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {STATUS_COLS.map(col => {
            const cards = filtered.filter(w => w.status === col.status);
            return (
              <div key={col.status} className="min-w-[220px] flex-1 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                  <span className={`text-[13px] font-semibold ${col.color}`}>{col.label}</span>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${col.bg} ${col.color}`}>{cards.length}</span>
                </div>
                <div className="p-2 space-y-2 min-h-[60px]">
                  {cards.map(wo => (
                    <div key={wo.id} onClick={()=>setDetailWO(wo)}
                      className="bg-white border border-slate-200 rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all">
                      <div className="flex items-start gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priorityDot[wo.priority]}`}/>
                        <div className="text-[13px] font-semibold text-slate-700 leading-tight">{wo.title}</div>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge className={priorityVariant[wo.priority]}>{wo.priority}</Badge>
                        <span className="text-[11px] text-slate-400">{timeAgo(wo.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add WO Modal */}
      <Modal open={addOpen} onClose={()=>{setAddOpen(false);setForm({});}} title="Create Work Order" size="lg"
        footer={<><Button variant="secondary" onClick={()=>setAddOpen(false)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleAdd}>Create</Button></>}>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Title *</label>
            <input value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}
              placeholder="Describe the issue or task"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</label>
            <textarea value={form.description||""} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 resize-none"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Type</label>
              <select value={form.type||"corrective"} onChange={e=>setForm(p=>({...p,type:e.target.value as WOType}))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400">
                {["corrective","preventive","inspection","emergency"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Priority</label>
              <select value={form.priority||"medium"} onChange={e=>setForm(p=>({...p,priority:e.target.value as Priority}))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400">
                {["low","medium","high","critical"].map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Location</label>
              <input value={form.location||""} onChange={e=>setForm(p=>({...p,location:e.target.value}))} placeholder="e.g. Block A, Floor 2"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Due Date</label>
              <input type="date" value={form.dueDate||""} onChange={e=>setForm(p=>({...p,dueDate:e.target.value}))}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Est. Hours</label>
              <input type="number" value={form.estimatedHours||""} onChange={e=>setForm(p=>({...p,estimatedHours:+e.target.value}))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" min={0.5} step={0.5}/>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Assigned To</label>
              <select
                value={form.assignedTo || ""}
                onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
              >
                <option value="">Select Technician</option>
                {state.technicians.map(u => (
                  <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {detailWO && (
        <Modal open={!!detailWO} onClose={()=>setDetailWO(null)} title={detailWO.woNumber} size="lg"
          footer={
          <div className="flex gap-2 w-full items-center">
              {(() => {
                const isAssigned = detailWO.assignedTo === state.currentUser?.name;
                const isAdminOrManager = state.currentUser?.role === "admin" || state.currentUser?.role === "manager";
                
                return (
                  <div className="flex gap-2 flex-wrap items-center">
                    {/* Admin Assignment Logic */}
                    {isAdminOrManager && !detailWO.assignedTo && detailWO.status === "open" && (
                      <select
                        onChange={async (e) => {
                          if (e.target.value) {
                            const updated = await updateWorkOrder(detailWO.id, { assignedTo: e.target.value, status: "assigned" }) as unknown as WorkOrder;
                            setDetailWO(updated ?? { ...detailWO, assignedTo: e.target.value, status: "assigned" });
                          }
                        }}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:border-blue-400"
                      >
                        <option value="">Assign To...</option>
                        {state.technicians.map(u => (
                          <option key={u.id} value={u.name}>{u.name}</option>
                        ))}
                      </select>
                    )}

                    {/* Technician Execution Actions (Only for assignee) */}
                    {isAssigned && (
                      <div className="flex gap-2">
                        {(detailWO.status === "open" || detailWO.status === "assigned") && (
                          <Button variant="primary" size="sm" onClick={() => updateStatus(detailWO, "in_progress")}>▶ Start Work</Button>
                        )}
                        {detailWO.status === "on_hold" && (
                          <Button variant="primary" size="sm" onClick={() => updateStatus(detailWO, "in_progress")}>▶ Resume</Button>
                        )}
                        {detailWO.status === "in_progress" && (
                          <Button variant="success" size="sm" onClick={() => updateStatus(detailWO, "completed")}>✓ Mark Complete</Button>
                        )}
                        {detailWO.status !== "on_hold" && detailWO.status !== "completed" && detailWO.status !== "cancelled" && (
                          <Button variant="ghost" size="sm" onClick={() => updateStatus(detailWO, "on_hold")}>⏸ Hold</Button>
                        )}
                      </div>
                    )}

                    {/* Admin Cancellation */}
                    {canDeleteWO && detailWO.status !== "completed" && detailWO.status !== "cancelled" && (
                      <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 border-red-200"
                        onClick={() => { updateStatus(detailWO, "cancelled"); setDetailWO(null); }}>
                        ✕ Cancel
                      </Button>
                    )}
                  </div>
                );
              })()}
              <Button variant="secondary" size="sm" className="ml-auto" onClick={() => setDetailWO(null)}>Close</Button>
            </div>

          }>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Badge className={woStatusVariant[detailWO.status]}>{detailWO.status.replace("_"," ")}</Badge>
              <Badge className={priorityVariant[detailWO.priority]}>{detailWO.priority}</Badge>
              <Badge className="bg-slate-100 text-slate-600">{detailWO.type}</Badge>
            </div>
            <h3 className="text-[16px] font-bold text-slate-800">{detailWO.title}</h3>
            <p className="text-sm text-slate-500">{detailWO.description || "No description provided."}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Location",    detailWO.location],
                ["Requested By",detailWO.requestedBy],
                ["Assigned To", detailWO.assignedTo||"Unassigned"],
                ["Created",     timeAgo(detailWO.createdAt)],
                ["Due Date",    fmtDate(detailWO.dueDate)],
                ["Est. Hours",  `${detailWO.estimatedHours}h`],
              ].map(([l,v])=>(
                <div key={l} className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{l}</div>
                  <div className="text-sm font-medium text-slate-700 mt-0.5">{v}</div>
                </div>
              ))}
            </div>
            {/* Audit Log */}
            <div>
              <div className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Activity Log</div>
              <div className="space-y-2">
                {detailWO.auditLog.map((e, idx) => (
                  <div key={(e as any).id || (e as any)._id || idx} className="flex gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"/>
                    <div>
                      <span className="font-semibold text-slate-600">{e.action}</span>
                      <span className="text-slate-400"> by {e.performedBy} · {timeAgo(e.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
