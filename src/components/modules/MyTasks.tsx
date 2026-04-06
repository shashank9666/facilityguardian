"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { cn, daysUntil } from "@/lib/utils";
import type { WOStatus } from "@/types";
import {
  ClipboardList, Clock, CheckCircle2, AlertTriangle, ChevronRight,
  Zap, ClipboardCheck, Activity, BookOpen, ArrowRight, CalendarDays,
  User, MapPin,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const STATUS_BADGE: Record<string, string> = {
  open:        "bg-blue-50 text-blue-700 border-blue-200",
  assigned:    "bg-violet-50 text-violet-700 border-violet-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  on_hold:     "bg-slate-100 text-slate-500 border-slate-200",
  completed:   "bg-green-50 text-green-700 border-green-200",
  cancelled:   "bg-red-50 text-red-600 border-red-200",
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: "bg-red-500",
  high:     "bg-orange-500",
  medium:   "bg-amber-500",
  low:      "bg-blue-400",
};

type TabKey = "all" | "open" | "in_progress" | "completed";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all",         label: "All" },
  { key: "open",        label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed",   label: "Completed" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Build last 5 days bar chart data
function buildWeekData(wos: { status: WOStatus; completedAt?: string; createdAt: string }[]) {
  const days: { name: string; total: number; done: number }[] = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
    const dayWOs = wos.filter(w => (w.createdAt || "").slice(0, 10) === key);
    const done   = dayWOs.filter(w => w.status === "completed").length;
    days.push({ name: label, total: dayWOs.length, done });
  }
  return days;
}

export function MyTasks() {
  const { state } = useApp();
  const { currentUser, workOrders, preventiveMaintenance, checklistSubmissions } = state;

  const [tab, setTab] = useState<TabKey>("all");

  // My assigned work orders
  const myWOs = useMemo(() =>
    workOrders.filter(w =>
      w.assignedTo?.toLowerCase() === currentUser.name?.toLowerCase()
    ), [workOrders, currentUser.name]);

  // My PPMs
  const myPPMs = useMemo(() =>
    preventiveMaintenance.filter(pm =>
      pm.assignedTo?.toLowerCase() === currentUser.name?.toLowerCase()
    ), [preventiveMaintenance, currentUser.name]);

  // Today's checklist submissions
  const today = new Date().toISOString().slice(0, 10);
  const todayChecklists = checklistSubmissions.filter(c =>
    c.submittedBy === currentUser.name && c.submittedAt.slice(0, 10) === today
  );

  // Stats
  const openWOs      = myWOs.filter(w => w.status === "open" || w.status === "assigned").length;
  const inProgressWOs = myWOs.filter(w => w.status === "in_progress").length;
  const doneWOs      = myWOs.filter(w => w.status === "completed").length;
  const duePPMs      = myPPMs.filter(pm => daysUntil(pm.nextDue) <= 7).length;
  const overdueWOs   = myWOs.filter(w => w.status !== "completed" && daysUntil(w.dueDate) < 0).length;

  // Filtered WOs for table
  const filtered = useMemo(() => {
    if (tab === "all")         return myWOs;
    if (tab === "open")        return myWOs.filter(w => w.status === "open" || w.status === "assigned");
    if (tab === "in_progress") return myWOs.filter(w => w.status === "in_progress");
    if (tab === "completed")   return myWOs.filter(w => w.status === "completed");
    return myWOs;
  }, [myWOs, tab]);

  const weekData = useMemo(() => buildWeekData(myWOs), [myWOs]);

  const QUICK_ACTIONS = [
    { label: "Update DG Log",        color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100",   icon: <Zap size={14}/> },
    { label: "Submit Washroom HK",   color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100", icon: <ClipboardCheck size={14}/> },
    { label: "Report Faulty Asset",  color: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100", icon: <AlertTriangle size={14}/> },
  ];

  return (
    <div className="space-y-5">

      {/* Greeting */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl px-7 py-5 text-white">
        <h1 className="text-2xl font-bold">{greeting()}, {currentUser.name.split(" ")[0]} 👋</h1>
        <p className="text-blue-200 text-sm mt-0.5">Here&apos;s what&apos;s happening in your facility today.</p>
        <div className="flex items-center gap-2 mt-3 text-blue-200 text-xs">
          <CalendarDays size={13}/>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Daily Checklists", icon: <ClipboardCheck size={22}/>,
            val: `${todayChecklists.length}/12`, sub: "Submitted today",
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            label: "Assigned PPMs", icon: <Activity size={22}/>,
            val: duePPMs, sub: "Due this week",
            color: "text-violet-600 bg-violet-50",
          },
          {
            label: "Pending SRs", icon: <AlertTriangle size={22}/>,
            val: openWOs + inProgressWOs, sub: "Requires action",
            color: "text-amber-600 bg-amber-50",
          },
          {
            label: "Log Book Entries", icon: <BookOpen size={22}/>,
            val: state.meterReadings.filter(m => m.submittedBy === currentUser.name && m.readingDate.slice(0,10) === today).length,
            sub: "Logged today",
            color: "text-blue-600 bg-blue-50",
          },
        ].map(k => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${k.color}`}>
              {k.icon}
            </div>
            <div className="text-[26px] font-extrabold text-slate-800 leading-none">{k.val}</div>
            <div className="text-[12px] font-semibold text-slate-700 mt-1">{k.label}</div>
            <div className="text-[11px] text-slate-400">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        {/* Task Progress Chart */}
        <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-[14px] font-bold text-slate-800 mb-4">My Task Progress</div>
          {myWOs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm">
              <ClipboardList size={28} className="mb-2 opacity-30"/>
              No work orders assigned to you yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weekData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}/>
                <Bar dataKey="total" fill="#c7d2fe" radius={[4,4,0,0]} name="Assigned"/>
                <Bar dataKey="done"  fill="#6366f1" radius={[4,4,0,0]} name="Completed"/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-[14px] font-bold text-slate-800 mb-4">Quick Actions</div>
          <div className="space-y-2.5">
            {QUICK_ACTIONS.map(a => (
              <button key={a.label}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-semibold border transition-all",
                  a.color
                )}>
                <div className="flex items-center gap-2">
                  {a.icon}
                  {a.label}
                </div>
                <ArrowRight size={14}/>
              </button>
            ))}
          </div>

          {overdueWOs > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex items-center gap-2 text-red-600 text-[12px] font-semibold">
                <AlertTriangle size={13}/>
                {overdueWOs} overdue task{overdueWOs > 1 ? "s" : ""}
              </div>
              <div className="text-[11px] text-red-400 mt-0.5">Requires immediate attention</div>
            </div>
          )}
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <div className="text-[14px] font-bold text-slate-800">My Work Orders</div>
            <div className="text-[11px] text-slate-400">{myWOs.length} total assigned</div>
          </div>
          <div className="flex gap-1">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  tab === t.key ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"
                )}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <ClipboardList size={28} className="mx-auto mb-2 opacity-30"/>
            No tasks in this category
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.slice(0, 10).map(wo => (
              <div key={wo.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                {/* Priority dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLOR[wo.priority] ?? "bg-slate-300"}`}/>

                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-slate-800 truncate">{wo.title}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin size={10}/>{wo.location}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock size={10}/>
                      {daysUntil(wo.dueDate) < 0
                        ? <span className="text-red-500 font-medium">{Math.abs(daysUntil(wo.dueDate))}d overdue</span>
                        : daysUntil(wo.dueDate) === 0
                          ? <span className="text-amber-500 font-medium">Due today</span>
                          : `Due in ${daysUntil(wo.dueDate)}d`
                      }
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-mono text-slate-400">{wo.woNumber}</span>
                  <Badge className={STATUS_BADGE[wo.status] ?? STATUS_BADGE.open}>{wo.status.replace("_"," ")}</Badge>
                </div>

                <ChevronRight size={14} className="text-slate-300 flex-shrink-0"/>
              </div>
            ))}
          </div>
        )}

        {myWOs.length === 0 && (
          <div className="px-5 py-10 text-center">
            <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2"/>
            <div className="text-slate-500 text-sm font-medium">All clear! No work orders assigned.</div>
            <div className="text-slate-400 text-xs mt-1">Contact your supervisor for task assignments.</div>
          </div>
        )}
      </div>

      {/* PPM Upcoming */}
      {myPPMs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="text-[14px] font-bold text-slate-800">Upcoming PPMs</div>
            <div className="text-[11px] text-slate-400">Preventive maintenance scheduled for you</div>
          </div>
          <div className="divide-y divide-slate-50">
            {myPPMs.slice(0, 5).map(pm => {
              const days = daysUntil(pm.nextDue);
              return (
                <div key={pm.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    days < 0 ? "bg-red-500" : days <= 3 ? "bg-amber-500" : "bg-emerald-400"
                  )}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-slate-800 truncate">{pm.title}</div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <User size={10}/>{pm.assetName}
                    </div>
                  </div>
                  <div className={cn(
                    "text-[11px] font-semibold px-2.5 py-1 rounded-full",
                    days < 0 ? "bg-red-50 text-red-600" : days <= 3 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `In ${days}d`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
