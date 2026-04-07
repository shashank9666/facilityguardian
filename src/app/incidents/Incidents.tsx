"use client";

import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { severityVariant, fmtDate, timeAgo, sanitize } from "@/lib/utils";
import type { Incident, IncidentSeverity, IncidentStatus } from "@/types";
import { useRole } from "@/lib/rbac";
import { Plus, AlertTriangle, ChevronRight, CheckCircle } from "lucide-react";

const STATUS_COLOR: Record<IncidentStatus, string> = {
  reported:     "bg-blue-50 text-blue-700 border-blue-200",
  investigating:"bg-amber-50 text-amber-700 border-amber-200",
  resolved:     "bg-green-50 text-green-700 border-green-200",
  closed:       "bg-slate-100 text-slate-500 border-slate-200",
};

export function Incidents({ search }: { search: string }) {
  const { state, addIncident, updateIncident, toast, fetchIncidents } = useApp();

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const { canCreate, canDeleteInc } = useRole();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [detailInc, setDetailInc] = useState<Incident | null>(null);
  const [form, setForm] = useState<Partial<Incident>>({});

  const filtered = useMemo(() => state.incidents.filter(i => {
    const q = search.toLowerCase();
    const matchQ = !q || i.title.toLowerCase().includes(q) || i.incidentNumber.toLowerCase().includes(q);
    const matchS = filterStatus === "all" || i.status === filterStatus;
    const matchV = filterSeverity === "all" || i.severity === filterSeverity;
    return matchQ && matchS && matchV;
  }), [state.incidents, search, filterStatus, filterSeverity]);

  async function handleAdd() {
    if (!form.title?.trim()) return;
    try {
      await addIncident({
        title: sanitize(form.title!), description: sanitize(form.description || ""),
        severity: form.severity || "medium",
        location: sanitize(form.location || ""),
        category: sanitize(form.category || "Other"),
      });
      toast("Incident reported", "warning");
      setAddOpen(false); setForm({});
    } catch (err) { toast((err as Error).message ?? "Failed to report", "error"); }
  }

  async function updateStatus(inc: Incident, status: IncidentStatus) {
    try {
      const updated = await updateIncident(inc.id, { status }) as unknown as Incident;
      setDetailInc(updated ?? { ...inc, status });
      toast(`Incident ${status}`, "success");
    } catch (err) { toast((err as Error).message ?? "Failed to update", "error"); }
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {([
          ["reported","Reported","🔵",state.incidents.filter(i=>i.status==="reported").length],
          ["investigating","Investigating","🟡",state.incidents.filter(i=>i.status==="investigating").length],
          ["resolved","Resolved","🟢",state.incidents.filter(i=>i.status==="resolved").length],
          ["closed","Closed","⚫",state.incidents.filter(i=>i.status==="closed").length],
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
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          {["all","critical","high","medium","low"].map(s => (
            <button key={s} onClick={()=>setFilterSeverity(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${
                filterSeverity===s ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-500 border-slate-200 hover:border-red-300"
              }`}>{s}</button>
          ))}
        </div>
        {canCreate && (
          <Button variant="primary" size="sm" leftIcon={<Plus size={14}/>} className="ml-auto" onClick={()=>setAddOpen(true)}>
            Report Incident
          </Button>
        )}
      </div>

      {/* Incident List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["INC#","Title","Category","Severity","Status","Location","Reported","Actions"].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/80 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inc => (
                <tr key={inc.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{inc.incidentNumber}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-700 max-w-[200px] truncate">{inc.title}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{inc.category}</td>
                  <td className="px-4 py-3"><Badge className={severityVariant[inc.severity]}>{inc.severity}</Badge></td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLOR[inc.status]}>{inc.status}</Badge></td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate">{inc.location}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{timeAgo(inc.reportedAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={()=>setDetailInc(inc)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                      <ChevronRight size={14}/>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No incidents found</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Modal */}
      <Modal open={addOpen} onClose={()=>{setAddOpen(false);setForm({});}} title="Report Incident"
        footer={<><Button variant="secondary" onClick={()=>setAddOpen(false)}>Cancel</Button><Button variant="danger" onClick={handleAdd}>Report</Button></>}>
        <div className="space-y-3">
          {[
            {label:"Title *",key:"title",type:"text",ph:"Brief description of the incident"},
            {label:"Location",key:"location",type:"text",ph:"Where did it occur?"},
            {label:"Category",key:"category",type:"text",ph:"e.g. Plumbing, Electrical, Safety"},
          ].map(f=>(
            <div key={f.key}>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{f.label}</label>
              <input value={(form as Record<string,string>)[f.key]||""} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                placeholder={f.ph} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Severity</label>
            <select value={form.severity||"medium"} onChange={e=>setForm(p=>({...p,severity:e.target.value as IncidentSeverity}))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400">
              {["low","medium","high","critical"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</label>
            <textarea value={form.description||""} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 resize-none"/>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {detailInc && (
        <Modal open={!!detailInc} onClose={()=>setDetailInc(null)} title={detailInc.incidentNumber} size="lg"
          footer={
            <div className="flex gap-2 w-full">
              {canCreate && detailInc.status==="reported" && <Button variant="warning" size="sm" onClick={()=>updateStatus(detailInc,"investigating")}>Investigate</Button>}
              {canCreate && detailInc.status==="investigating" && <Button variant="success" size="sm" onClick={()=>updateStatus(detailInc,"resolved")}>Resolve</Button>}
              {canCreate && detailInc.status==="resolved" && <Button variant="ghost" size="sm" onClick={()=>updateStatus(detailInc,"closed")}>Close</Button>}
              <Button variant="secondary" size="sm" className="ml-auto" onClick={()=>setDetailInc(null)}>Close</Button>
            </div>
          }>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Badge className={STATUS_COLOR[detailInc.status]}>{detailInc.status}</Badge>
              <Badge className={severityVariant[detailInc.severity]}>{detailInc.severity}</Badge>
            </div>
            <h3 className="text-[16px] font-bold">{detailInc.title}</h3>
            <p className="text-sm text-slate-500">{detailInc.description}</p>
            <div className="grid grid-cols-2 gap-3">
              {[["Location",detailInc.location],["Category",detailInc.category],["Reported By",detailInc.reportedBy],["Reported At",timeAgo(detailInc.reportedAt)]].map(([l,v])=>(
                <div key={l} className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{l}</div>
                  <div className="text-sm font-medium text-slate-700 mt-0.5">{v}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Timeline</div>
              <div className="space-y-2">
                {detailInc.timeline.map(t=>(
                  <div key={t.id} className="flex gap-2 text-xs">
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
