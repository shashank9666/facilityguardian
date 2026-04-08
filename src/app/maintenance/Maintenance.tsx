"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { fmtDate, daysUntil, sanitize } from "@/lib/utils";
import { useRole } from "@/lib/rbac";
import { request } from "@/lib/api/client";
import { apiCreateMaintenance } from "./api";
import { Wrench, CheckCircle, Clock, Calendar, Plus } from "lucide-react";
import { validateMaintenanceForm } from "@/lib/form";

export function Maintenance({ search }: { search: string }) {
  const { state, fetchMaintenance, fetchAssets, fetchTechnicians, updateMaintenance, toast } = useApp();
  const { canCreate } = useRole();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<any>({ checklist: [] });
  const [saving, setSaving] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    fetchMaintenance({ q: search });
    fetchAssets();
    fetchTechnicians();
  }, [fetchMaintenance, fetchAssets, fetchTechnicians, search]);

  const schedules = state.preventiveMaintenance;
  const active = schedules.find(s => s.id === activeId);

  async function handleToggleChecklist(itemId: string) {
    if (!active) return;
    const nextChecklist = active.checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    try {
      await updateMaintenance(active.id, { checklist: nextChecklist });
    } catch (err) {
      toast("Failed to update checklist item", "error");
    }
  }

  async function handleComplete() {
    if (!active) return;
    setIsFinishing(true);
    try {
      // The backend has a special complete endpoint
      await request(`/maintenance/${active.id}/complete`, { method: "PATCH" });
      toast("PM Schedule completed and advanced to next cycle", "success");
      fetchMaintenance();
    } catch (err) {
      toast("Failed to complete maintenance", "error");
    } finally {
      setIsFinishing(false);
    }
  }



  async function handleAddSchedule() {
    const validation = validateMaintenanceForm(form);
    if (Object.keys(validation).length > 0) {
      toast(Object.values(validation)[0], "error");
      return;
    }

    setSaving(true);
    try {
      const asset = state.assets.find(a => a.id === form.assetId);
      await apiCreateMaintenance({
        ...form,
        title: sanitize(form.title),
        assetName: asset?.name || "Unknown Asset",
        status: "active",
        nextDue: form.nextDue || new Date(),
        checklist: (form.checklist || []).map((c: any) => ({ ...c, task: sanitize(c.task) }))
      });
      toast("PM Schedule created", "success");
      setModalOpen(false);
      setForm({ checklist: [] });
      fetchMaintenance();
    } catch (err) {
      toast((err as Error).message ?? "Failed to create schedule", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-[17px] font-bold text-slate-800">PM Schedules ({schedules.length})</h3>
        {canCreate && (
          <Button variant="primary" size="sm" leftIcon={<Plus size={14}/>} onClick={() => setModalOpen(true)}>
            Add Schedule
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Schedule List */}
        <div className="space-y-3">
          {schedules.map(pm => {
            const days = daysUntil(pm.nextDue);
            const overdue = days < 0;
            const dueSoon = days >= 0 && days <= 7;
            return (
              <div key={pm.id} onClick={()=>setActiveId(pm.id===activeId?null:pm.id)}
                className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                  pm.id===activeId ? "border-blue-400 shadow-md" :
                  overdue ? "border-red-300 bg-red-50/30" :
                  dueSoon ? "border-amber-300 bg-amber-50/20" : "border-slate-200"
                }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-slate-800 text-[14px]">{pm.title}</div>
                    <div className="text-xs text-slate-400">🔧 {pm.assetName}</div>
                  </div>
                  <Badge className={overdue?"bg-red-50 text-red-700 border-red-200":dueSoon?"bg-amber-50 text-amber-700 border-amber-200":"bg-green-50 text-green-700 border-green-200"}>
                    {overdue ? `${Math.abs(days)}d overdue` : days===0 ? "Due today" : `${days}d left`}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Calendar size={11}/>{pm.frequency}</span>
                  <span className="flex items-center gap-1"><Clock size={11}/>{pm.estimatedMinutes} min</span>
                  <span className="flex items-center gap-1"><Wrench size={11}/>Assigned: {pm.assignedTo}</span>
                </div>
              </div>
            );
          })}
          {schedules.length === 0 && <div className="text-center py-10 text-slate-400 text-sm italic">No schedules found</div>}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {active ? (
            <Card>
              <CardHeader title={<><CheckCircle size={15} className="inline mr-1"/>Checklist</>} subtitle={active.title} />
              <CardBody>
                <div className="space-y-2">
                  {active.checklist.map(item => (
                    <div key={item.id} onClick={() => handleToggleChecklist(item.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-slate-100 ${
                        item.completed ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
                      }`}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        item.completed ? "bg-green-500 border-green-500" : "border-slate-300"
                      }`}>
                        {item.completed && <CheckCircle size={12} className="text-white"/>}
                      </div>
                      <span className={`text-sm flex-1 ${item.completed?"line-through text-slate-400":"text-slate-700"}`}>{item.task}</span>
                    </div>
                  ))}
                </div>
                {active.checklist.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-blue-600">
                        {active.checklist.filter(c=>c.completed).length} / {active.checklist.length} Completed
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${(active.checklist.filter(c=>c.completed).length / active.checklist.length) * 100}%` }}
                      />
                    </div>
                    <Button 
                      variant="primary" 
                      className="w-full h-11"
                      disabled={active.checklist.some(c => !c.completed)}
                      loading={isFinishing}
                      onClick={handleComplete}
                    >
                      Complete & Advance Cycle
                    </Button>
                    {active.checklist.some(c => !c.completed) && (
                      <p className="text-[11px] text-center text-slate-400 mt-2 italic">
                        Check all items to finish this maintenance task
                      </p>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-[14px] font-semibold text-slate-500">Select a schedule</div>
              <div className="text-xs text-slate-400 mt-1">Click a PM schedule to view its checklist</div>
            </div>
          )}

          <Card>
            <CardHeader title="PM Summary" />
            <CardBody>
              <div className="space-y-2">
                {[
                  ["Total Schedules", schedules.length],
                  ["Overdue",         schedules.filter(p=>daysUntil(p.nextDue)<0).length],
                  ["Due This Week",   schedules.filter(p=>daysUntil(p.nextDue)>=0&&daysUntil(p.nextDue)<=7).length],
                ].map(([l,v])=>(
                  <div key={String(l)} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <span className="text-sm text-slate-500">{l}</span>
                    <span className="text-sm font-bold text-slate-700">{v}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Add Schedule Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create PM Schedule" size="lg"
        footer={<><Button variant="secondary" onClick={()=>setModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleAddSchedule} loading={saving}>Create Schedule</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Schedule Title *</label>
            <input value={form.title||""} onChange={e=>setForm({...form,title:e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="e.g. Monthly HVAC Service"/>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase">Asset *</label>
            <select value={form.assetId||""} onChange={e=>setForm({...form,assetId:e.target.value})} className="w-full p-2 border rounded-lg text-sm">
              <option value="">Select Asset</option>
              {state.assets.map(a=><option key={a.id} value={a.id}>{a.name} ({a.location})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase">Frequency</label>
            <select value={form.frequency||"monthly"} onChange={e=>setForm({...form,frequency:e.target.value})} className="w-full p-2 border rounded-lg text-sm">
              {["daily","weekly","monthly","quarterly","semi-annual","annual"].map(f=><option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase">Assign To</label>
            <select value={form.assignedTo||""} onChange={e=>setForm({...form,assignedTo:e.target.value})} className="w-full p-2 border rounded-lg text-sm">
              <option value="">Select Technician</option>
              {state.technicians.map(t=><option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase">Next Due Date *</label>
            <input type="date" value={form.nextDue||""} onChange={e=>setForm({...form,nextDue:e.target.value})} className="w-full p-2 border rounded-lg text-sm"/>
          </div>
          <div className="col-span-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Checklist Tasks *</label>
            <div className="space-y-2 mt-1">
              {form.checklist.map((c: any, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <input value={c.task} onChange={e => {
                    const next = [...form.checklist];
                    next[idx].task = e.target.value;
                    setForm({...form, checklist: next});
                  }} className="flex-1 p-2 border rounded-lg text-sm" placeholder="Task description"/>
                  <button onClick={() => setForm({...form, checklist: form.checklist.filter((_:any,i:number)=>i!==idx)})} className="text-red-500 px-2">×</button>
                </div>
              ))}
              <Button variant="ghost" size="xs" onClick={() => setForm({...form, checklist: [...form.checklist, { id: Math.random().toString(), task: "", completed: false }]})}>+ Add Task</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
