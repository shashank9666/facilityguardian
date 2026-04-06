"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fmtDate, daysUntil } from "@/lib/utils";
import { Wrench, CheckCircle, Clock, Calendar } from "lucide-react";

export function Maintenance({ search }: { search: string }) {
  const { state } = useApp();
  const [activeId, setActiveId] = useState<string | null>(null);

  const schedules = state.preventiveMaintenance.filter(pm => {
    const q = search.toLowerCase();
    return !q || pm.title.toLowerCase().includes(q) || pm.assetName.toLowerCase().includes(q);
  });

  const active = schedules.find(s => s.id === activeId);

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Schedule List */}
      <div className="space-y-3">
        <h3 className="text-[15px] font-semibold text-slate-700 mb-2">PM Schedules ({schedules.length})</h3>
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
              <div className="mt-2 flex items-center gap-2">
                <div className="text-xs text-slate-400">
                  Last: {fmtDate(pm.lastCompleted ?? "")} · Next: <span className={overdue?"text-red-500 font-semibold":""}>{fmtDate(pm.nextDue)}</span>
                </div>
                <div className="ml-auto text-xs">
                  {pm.checklist.filter(c=>c.completed).length}/{pm.checklist.length} checked
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full transition-all"
                  style={{width:`${pm.checklist.length>0?pm.checklist.filter(c=>c.completed).length/pm.checklist.length*100:0}%`}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checklist Panel */}
      <div>
        {active ? (
          <Card>
            <CardHeader title={<><CheckCircle size={15} className="inline mr-1"/>Checklist</>} subtitle={active.title} />
            <CardBody>
              <div className="space-y-2">
                {active.checklist.map(item => (
                  <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
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
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-xs font-semibold text-blue-700 mb-1">Progress</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all"
                      style={{width:`${active.checklist.length>0?active.checklist.filter(c=>c.completed).length/active.checklist.length*100:0}%`}}/>
                  </div>
                  <span className="text-xs font-semibold text-blue-700">
                    {active.checklist.filter(c=>c.completed).length}/{active.checklist.length}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-10 text-center">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-[14px] font-semibold text-slate-500">Select a schedule</div>
            <div className="text-xs text-slate-400 mt-1">Click a PM schedule to view its checklist</div>
          </div>
        )}

        {/* PM Summary */}
        <Card className="mt-4">
          <CardHeader title="PM Summary" />
          <CardBody>
            <div className="space-y-2">
              {[
                ["Total Schedules", state.preventiveMaintenance.length],
                ["Active",          state.preventiveMaintenance.filter(p=>p.status==="active").length],
                ["Overdue",         state.preventiveMaintenance.filter(p=>daysUntil(p.nextDue)<0).length],
                ["Due This Week",   state.preventiveMaintenance.filter(p=>daysUntil(p.nextDue)>=0&&daysUntil(p.nextDue)<=7).length],
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
  );
}
