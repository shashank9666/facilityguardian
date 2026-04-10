"use client";

import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { severityVariant, fmtDate, timeAgo, sanitize } from "@/lib/utils";
import type { ServiceRequest, ServiceRequestSeverity, ServiceRequestStatus } from "@/types";
import { useRole } from "@/lib/rbac";
import { Plus, AlertTriangle, ChevronRight, CheckCircle } from "lucide-react";

const STATUS_COLOR: Record<ServiceRequestStatus, string> = {
  reported:     "bg-blue-50 text-blue-700 border-blue-200",
  investigating:"bg-amber-50 text-amber-700 border-amber-200",
  resolved:     "bg-green-50 text-green-700 border-green-200",
  closed:       "bg-slate-100 text-slate-500 border-slate-200",
};

export function ServiceRequests({ search }: { search: string }) {
  const { state, addServiceRequest, updateServiceRequest, toast, fetchServiceRequests, fetchTechnicians } = useApp();

  const { canCreate, canDeleteInc } = useRole();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [detailSR, setDetailSR] = useState<ServiceRequest | null>(null);
  const [form, setForm] = useState<Partial<ServiceRequest>>({});

  useEffect(() => {
    fetchServiceRequests({
      q: search,
      status: filterStatus === "all" ? "" : filterStatus,
      severity: filterSeverity === "all" ? "" : filterSeverity,
    });
    fetchTechnicians?.(); // Ensure technicians list is available for assignment
  }, [fetchServiceRequests, fetchTechnicians, search, filterStatus, filterSeverity]);

  const filtered = state.serviceRequests;

  async function handleAdd() {
    if (!form.title?.trim()) return;
    if (!form.description?.trim()) {
      toast("Description is mandatory", "error");
      return;
    }

    // Duplicate check: Same title and location within last 5 mins (TC_ALERT_03)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60000);
    const isDup = state.serviceRequests.some(i =>
      i.title.toLowerCase() === form.title?.toLowerCase() &&
      i.location.toLowerCase() === (form.location || "").toLowerCase() &&
      new Date(i.createdAt) > fiveMinsAgo
    );
    if (isDup) {
      toast("A similar request was recently reported", "warning");
      return;
    }

    try {
      await addServiceRequest({
        title: sanitize(form.title!), description: sanitize(form.description || ""),
        severity: form.severity || "medium",
        location: sanitize(form.location || ""),
        category: sanitize(form.category || "Other"),
      });
      toast("Service Request reported", "warning");
      setAddOpen(false); setForm({});
    } catch (err) { toast((err as Error).message ?? "Failed to report", "error"); }
  }

  async function updateStatus(sr: ServiceRequest, status: ServiceRequestStatus) {
    try {
      const updated = await updateServiceRequest(sr.id, { status }) as unknown as ServiceRequest;
      setDetailSR(updated ?? { ...sr, status });
      toast(`Request ${status}`, "success");
    } catch (err) { toast((err as Error).message ?? "Failed to update", "error"); }
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {([
          ["reported","Reported","🔵",state.serviceRequests.filter(i=>i.status==="reported").length],
          ["investigating","Investigating","🟡",state.serviceRequests.filter(i=>i.status==="investigating").length],
          ["resolved","Resolved","🟢",state.serviceRequests.filter(i=>i.status==="resolved").length],
          ["closed","Closed","⚫",state.serviceRequests.filter(i=>i.status==="closed").length],
        ] as const).map(([s,label,emoji,count]) => (
          <div key={s} onClick={()=>setFilterStatus(filterStatus===s?"all":s)}
            className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${filterStatus===s?"border-blue-400 shadow-md":""}`}>
            <div className="text-2xl mb-1">{emoji}</div>
            <div className="text-[22px] font-extrabold text-slate-800">{count}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* Status Filters */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
          <div className="flex gap-1.5">
            {["all", "reported", "investigating", "resolved", "closed"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight border transition-all ${
                  filterStatus === s 
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                    : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Severity:</span>
          <div className="flex gap-1.5">
            {["all", "critical", "high", "medium", "low"].map(s => (
              <button key={s} onClick={() => setFilterSeverity(s)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight border transition-all ${
                  filterSeverity === s 
                    ? "bg-red-600 text-white border-red-600 shadow-sm" 
                    : "bg-white text-slate-500 border-slate-200 hover:border-red-300"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {canCreate && (
          <Button variant="primary" size="sm" leftIcon={<Plus size={14}/>} className="ml-auto" onClick={() => setAddOpen(true)}>
            New Request
          </Button>
        )}
      </div>

      {/* Service Request List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["SR#","Title","Category","Severity","Status","Location","Reported","Actions"].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/80 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(sr => (
                <tr key={sr.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{sr.requestNumber}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-700 max-w-[200px] truncate">{sr.title}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{sr.category}</td>
                  <td className="px-4 py-3"><Badge className={severityVariant[sr.severity]}>{sr.severity}</Badge></td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLOR[sr.status]}>{sr.status}</Badge></td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate">{sr.location}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{timeAgo(sr.reportedAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={()=>setDetailSR(sr)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                      <ChevronRight size={14}/>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No requests found</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Modal */}
      <Modal open={addOpen} onClose={()=>{setAddOpen(false);setForm({});}} title="New Service Request"
        footer={<><Button variant="secondary" onClick={()=>setAddOpen(false)}>Cancel</Button><Button variant="danger" onClick={handleAdd}>Submit</Button></>}>
        <div className="space-y-3">
          {[
            {label:"Title *",key:"title",type:"text",ph:"Brief description of the request"},
            {label:"Location *",key:"location",type:"text",ph:"Where did it occur?"},
            {label:"Category",key:"category",type:"text",ph:"e.g. Plumbing, Electrical, Safety"},
          ].map(f=>(
            <div key={f.key}>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{f.label}</label>
              <input value={(form as Record<string,string>)[f.key]||""} onChange={e=>setForm((p: Partial<ServiceRequest>)=>({...p,[f.key]:e.target.value}))}
                placeholder={f.ph} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Severity</label>
            <select value={form.severity||"medium"} onChange={e=>setForm((p: Partial<ServiceRequest>)=>({...p,severity:e.target.value as ServiceRequestSeverity}))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400">
              {["low","medium","high","critical"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Description *</label>
            <textarea
              required
              value={form.description||""} onChange={e=>setForm((p: Partial<ServiceRequest>)=>({...p,description:e.target.value}))} rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 resize-none"
              placeholder="Detailed description of the request"
            />
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {detailSR && (
        <Modal open={!!detailSR} onClose={()=>setDetailSR(null)} title={detailSR.requestNumber} size="lg"
          footer={
            <div className="flex gap-2 w-full items-center">
              {(() => {
                const isAssigned = detailSR.assignedTo === state.currentUser?.name;
                const isAdminOrManager = state.currentUser?.role === "admin" || state.currentUser?.role === "manager";
                
                return (
                  <div className="flex gap-2 flex-grow items-center">
                    {/* Role-based Assignment Dropdown (Admin/Manager only) */}
                    {isAdminOrManager && (
                      <select
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:border-blue-400"
                        value={detailSR.assignedTo || ""}
                        onChange={async (e) => {
                          if (e.target.value) {
                            const updated = await updateServiceRequest(detailSR.id, { assignedTo: e.target.value }) as unknown as ServiceRequest;
                            setDetailSR(updated ?? { ...detailSR, assignedTo: e.target.value });
                          }
                        }}
                      >
                        <option value="">Assign To...</option>
                        {state.technicians.map(u => (
                          <option key={u.id} value={u.name}>{u.name}</option>
                        ))}
                      </select>
                    )}

                    {/* Investigation Action (Only for Assignee) */}
                    {isAssigned && detailSR.status === "reported" && (
                      <Button variant="warning" size="sm" onClick={() => updateStatus(detailSR, "investigating")}>Investigate</Button>
                    )}
                    
                    {/* Resolution/Closure Actions (Only for Assignee or Manager) */}
                    {(isAssigned || isAdminOrManager) && (
                      <>
                        {detailSR.status === "investigating" && <Button variant="success" size="sm" onClick={() => updateStatus(detailSR, "resolved")}>Resolve</Button>}
                        {detailSR.status === "resolved" && <Button variant="ghost" size="sm" onClick={() => updateStatus(detailSR, "closed")}>Close</Button>}
                      </>
                    )}
                  </div>
                );
              })()}
              <Button variant="secondary" size="sm" className="ml-auto" onClick={() => setDetailSR(null)}>Close</Button>
            </div>
          }>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Badge className={STATUS_COLOR[detailSR.status]}>{detailSR.status}</Badge>
              <Badge className={severityVariant[detailSR.severity]}>{detailSR.severity}</Badge>
            </div>
            <h3 className="text-[16px] font-bold">{detailSR.title}</h3>
            <p className="text-sm text-slate-500">{detailSR.description}</p>
            <div className="grid grid-cols-2 gap-3">
              {[["Location",detailSR.location],["Category",detailSR.category],["Reported By",detailSR.reportedBy],["Reported At",timeAgo(detailSR.reportedAt)]].map(([l,v])=>(
                <div key={l} className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{l}</div>
                  <div className="text-sm font-medium text-slate-700 mt-0.5">{v}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Timeline</div>
              <div className="space-y-2">
                {detailSR.timeline.map((t: any, i: number)=>(
                  <div key={t.id || i} className="flex gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"/>
                    <div>
                      <span className="font-semibold text-slate-600">{t.action}</span>
                      <span className="text-slate-400"> · {timeAgo(t.timestamp)}</span>
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
