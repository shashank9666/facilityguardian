"use client";

import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fmtDate, timeAgo, priorityVariant, woStatusVariant, daysUntil, severityVariant } from "@/lib/utils";
import {
  Box, ClipboardList, AlertTriangle, Package,
  TrendingUp, Clock, CheckCircle, Wrench, BarChart3,
  AlertOctagon, ShieldAlert, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from "recharts";

export function Dashboard() {
  const { state, refreshAll } = useApp();
  const { assets, workOrders, incidents, inventory, preventiveMaintenance, spaces } = state;

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // ── KPIs ──
  const totalAssets     = assets.length;
  const faultyAssets    = assets.filter(a => a.status === "faulty").length;
  const openWOs         = workOrders.filter(w => ["open","assigned","in_progress"].includes(w.status)).length;
  const criticalWOs     = workOrders.filter(w => w.priority === "critical" && w.status !== "completed").length;
  const activeIncidents = incidents.filter(i => i.status !== "closed" && i.status !== "resolved").length;
  const lowStockItems   = inventory.filter(i => i.status !== "in_stock").length;
  const overdueWOs      = workOrders.filter(w => w.status !== "completed" && daysUntil(w.dueDate) < 0).length;
  const completedThisWeek = workOrders.filter(w => w.status === "completed" && daysUntil(w.completedAt ?? "") > -7).length;
  const totalCapacity   = spaces.reduce((s,sp) => s + sp.capacity, 0);
  const totalOccupied   = spaces.reduce((s,sp) => s + sp.occupied, 0);
  const occupancyPct    = totalCapacity > 0 ? Math.round(totalOccupied / totalCapacity * 100) : 0;

  // ── Calculated Stats ──
  // 1. Avg Response Time (Work Order created -> started)
  const respondedWOs = workOrders.filter(w => w.startedAt);
  const avgResponseHrs = respondedWOs.length > 0 
    ? respondedWOs.reduce((acc, w) => acc + (new Date(w.startedAt!).getTime() - new Date(w.createdAt).getTime()), 0) / (respondedWOs.length * 3600000)
    : 0;

  // 2. SLA Compliance (% of completed WOs done before dueDate)
  const completedWOs = workOrders.filter(w => w.status === "completed");
  const onTimeWOs = completedWOs.filter(w => w.completedAt && new Date(w.completedAt) <= new Date(w.dueDate));
  const slaCompliance = completedWOs.length > 0 ? Math.round((onTimeWOs.length / completedWOs.length) * 100) : 100;

  // 3. PM Completion Rate (% of preventive WOs completed)
  const preventiveWOs = workOrders.filter(w => w.type === "preventive");
  const completedPreventive = preventiveWOs.filter(w => w.status === "completed");
  const pmCompletionRate = preventiveWOs.length > 0 ? Math.round((completedPreventive.length / preventiveWOs.length) * 100) : 100;

  // ── Critical Alerts ──
  const alerts = [
    ...workOrders.filter(w => w.priority === "critical" && w.status !== "completed")
      .map(w => ({ type: "critical" as const, msg: `Critical WO: ${w.title}`, sub: w.woNumber, icon: <AlertOctagon size={14}/> })),
    ...incidents.filter(i => i.severity === "critical" && i.status !== "closed")
      .map(i => ({ type: "critical" as const, msg: `Critical Incident: ${i.title}`, sub: i.incidentNumber, icon: <ShieldAlert size={14}/> })),
    ...workOrders.filter(w => w.status !== "completed" && daysUntil(w.dueDate) < 0)
      .map(w => ({ type: "warning" as const, msg: `Overdue: ${w.title}`, sub: `${Math.abs(daysUntil(w.dueDate))}d past due`, icon: <Clock size={14}/> })),
    ...inventory.filter(i => i.status === "out_of_stock")
      .map(i => ({ type: "warning" as const, msg: `Out of stock: ${i.name}`, sub: `${i.code}`, icon: <Package size={14}/> })),
  ].slice(0, 5);

  // ── Chart Data ──
  const woByType = [
    { name: "Corrective",  value: workOrders.filter(w=>w.type==="corrective").length  },
    { name: "Preventive",  value: workOrders.filter(w=>w.type==="preventive").length  },
    { name: "Inspection",  value: workOrders.filter(w=>w.type==="inspection").length  },
    { name: "Emergency",   value: workOrders.filter(w=>w.type==="emergency").length   },
  ].filter(d => d.value > 0);
  const PIE_COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444"];

  const assetByStatus = [
    { name: "Operational",    count: assets.filter(a=>a.status==="operational").length,    fill: "#10b981" },
    { name: "Maintenance",    count: assets.filter(a=>a.status==="maintenance").length,    fill: "#f59e0b" },
    { name: "Faulty",         count: assets.filter(a=>a.status==="faulty").length,         fill: "#ef4444" },
    { name: "Decommissioned", count: assets.filter(a=>a.status==="decommissioned").length, fill: "#94a3b8" },
  ];

  // WO trend last 7 days
  const woTrend = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const label = d.toLocaleDateString("en-IN", { weekday: "short" });
    const dateStr = d.toISOString().slice(0, 10);
    return {
      day: label,
      open: workOrders.filter(w => w.createdAt?.slice(0,10) === dateStr).length,
      done: workOrders.filter(w => w.status === "completed" && (w.completedAt ?? "").slice(0,10) === dateStr).length,
    };
  });

  // ── Activity Feed ──
  type FeedItem = { time: string; icon: React.ReactNode; text: string; sub: string; color: string };
  const feed: FeedItem[] = [
    ...workOrders.slice().sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,4).map(w=>({
      time: w.createdAt, icon: <ClipboardList size={13}/>, color: "text-blue-500 bg-blue-50",
      text: w.title, sub: `Work Order · ${w.woNumber}`,
    })),
    ...incidents.slice().sort((a,b)=>new Date(b.reportedAt).getTime()-new Date(a.reportedAt).getTime()).slice(0,3).map(i=>({
      time: i.reportedAt, icon: <AlertTriangle size={13}/>, color: "text-amber-500 bg-amber-50",
      text: i.title, sub: `Incident · ${i.incidentNumber}`,
    })),
    ...assets.slice().sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,2).map(a=>({
      time: a.createdAt, icon: <Box size={13}/>, color: "text-emerald-500 bg-emerald-50",
      text: `Asset registered: ${a.name}`, sub: `${a.category} · ${a.code}`,
    })),
  ].sort((a,b)=>new Date(b.time).getTime()-new Date(a.time).getTime()).slice(0,7);

  // ── Recent Work Orders ──
  const recentWOs = [...workOrders]
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // ── Upcoming PM ──
  const upcomingPM = [...preventiveMaintenance]
    .filter(p => p.status !== "paused")
    .sort((a,b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-5">

      {/* ── Critical Alerts Strip ── */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 text-red-700 font-semibold text-[13px] mr-2">
            <ShieldAlert size={15} />
            {alerts.filter(a=>a.type==="critical").length > 0
              ? `${alerts.filter(a=>a.type==="critical").length} Critical Alert${alerts.filter(a=>a.type==="critical").length>1?"s":""}`
              : "Operational Alerts"}
          </div>
          {alerts.map((a, i) => (
            <span key={i} className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
              a.type==="critical"
                ? "bg-red-100 text-red-700 border-red-200"
                : "bg-amber-100 text-amber-700 border-amber-200"
            }`}>
              {a.icon}{a.msg}
            </span>
          ))}
        </div>
      )}

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-5 gap-4">
        <KpiCard label="Total Assets"     value={totalAssets}
          icon="🏗️" iconBg="bg-blue-50"
          sub={`${faultyAssets} faulty`}
          trend={{ value: faultyAssets > 0 ? `${faultyAssets} faulty` : "All healthy", up: faultyAssets > 0 ? false : null }}
        />
        <KpiCard label="Open Work Orders" value={openWOs}
          icon="📋" iconBg="bg-amber-50"
          sub={`${criticalWOs} critical · ${overdueWOs} overdue`}
          trend={{ value: criticalWOs > 0 ? `${criticalWOs} urgent` : "On track", up: criticalWOs > 0 ? false : null }}
        />
        <KpiCard label="Active Incidents" value={activeIncidents}
          icon="⚠️" iconBg="bg-red-50"
          sub="Reported or investigating"
          trend={{ value: activeIncidents > 0 ? "Needs attention" : "All clear", up: activeIncidents > 0 ? false : null }}
        />
        <KpiCard label="Low Stock Items"  value={lowStockItems}
          icon="📦" iconBg="bg-violet-50"
          sub={`${inventory.filter(i=>i.status==="out_of_stock").length} out of stock`}
          trend={{ value: lowStockItems > 0 ? "Reorder needed" : "Well stocked", up: lowStockItems > 0 ? false : null }}
        />
        <KpiCard label="Space Occupancy"  value={`${occupancyPct}%`}
          icon="🏢" iconBg="bg-emerald-50"
          sub={`${totalOccupied} / ${totalCapacity} seats`}
          trend={{ value: occupancyPct > 85 ? "Near capacity" : occupancyPct > 50 ? "Moderate" : "Low usage", up: null }}
        />
      </div>

      {/* ── Row 2: Charts ── */}
      <div className="grid grid-cols-3 gap-5">
        {/* WO 7-day trend */}
        <Card className="col-span-2">
          <CardHeader title={<><Activity size={14} className="inline mr-1.5"/>Work Order Trend — Last 7 Days</>} />
          <CardBody>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={woTrend} margin={{top:4, right:4, left:-20, bottom:0}}>
                <defs>
                  <linearGradient id="gOpen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="day" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip contentStyle={{fontSize:12,borderRadius:8,border:"1px solid #e2e8f0"}}/>
                <Area type="monotone" dataKey="open" name="Created"   stroke="#3b82f6" fill="url(#gOpen)" strokeWidth={2}/>
                <Area type="monotone" dataKey="done" name="Completed" stroke="#10b981" fill="url(#gDone)" strokeWidth={2}/>
                <Legend iconSize={10} wrapperStyle={{fontSize:12}}/>
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* WO by type donut */}
        <Card>
          <CardHeader title={<><BarChart3 size={14} className="inline mr-1.5"/>Work Order Types</>}/>
          <CardBody>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={woByType} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                  dataKey="value" paddingAngle={3}>
                  {woByType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{fontSize:11, borderRadius:8}}/>
                <Legend iconSize={9} iconType="circle" wrapperStyle={{fontSize:11}}/>
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* ── Row 3: Asset Health + Quick Stats ── */}
      <div className="grid grid-cols-3 gap-5">
        {/* Asset Health */}
        <Card>
          <CardHeader title={<><Box size={14} className="inline mr-1.5"/>Asset Health</>}/>
          <CardBody>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={assetByStatus} barSize={28} margin={{left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="name" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:"1px solid #e2e8f0"}}/>
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {assetByStatus.map((entry, i) => <Cell key={i} fill={entry.fill}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader title="Quick Stats"/>
          <CardBody className="space-y-2">
            {[
              { label:"Completed This Week", value: completedThisWeek, icon:<CheckCircle size={14} className="text-emerald-500"/>, color:"text-emerald-600" },
              { label:"Avg Response Time",   value: avgResponseHrs > 0 ? `${avgResponseHrs.toFixed(1)} hrs` : "N/A", icon:<Clock size={14} className="text-amber-500"/>, color:"text-amber-600"  },
              { label:"SLA Compliance",      value: `${slaCompliance}%`, icon:<TrendingUp size={14} className="text-blue-500"/>,    color:"text-blue-600"   },
              { label:"PM Completion Rate",  value: `${pmCompletionRate}%`,
                icon:<Wrench size={14} className="text-violet-500"/>, color:"text-violet-600" },
              { label:"Active Vendors",      value: state.vendors.filter(v=>v.status==="active").length,
                icon:<Package size={14} className="text-slate-500"/>, color:"text-slate-600" },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2 text-[12px] text-slate-500">
                  {s.icon}{s.label}
                </div>
                <span className={`text-[14px] font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Upcoming PM */}
        <Card>
          <CardHeader title="Upcoming Maintenance" subtitle="Next scheduled tasks"/>
          <div>
            {upcomingPM.length === 0 && (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No upcoming PM schedules</div>
            )}
            {upcomingPM.map(pm => {
              const days = daysUntil(pm.nextDue);
              const overdue = days < 0;
              return (
                <div key={pm.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${overdue?"bg-red-50":"bg-blue-50"}`}>
                    <Wrench size={14} className={overdue?"text-red-500":"text-blue-500"}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-700 truncate">{pm.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{pm.assetName}</div>
                  </div>
                  <span className={`text-[11px] font-bold whitespace-nowrap ${overdue?"text-red-500":"text-blue-600"}`}>
                    {overdue ? `${Math.abs(days)}d late` : days===0 ? "Today" : `${days}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Row 4: Recent Work Orders + Activity Feed ── */}
      <div className="grid grid-cols-2 gap-5">
        {/* Recent Work Orders */}
        <Card>
          <CardHeader title="Recent Work Orders" subtitle="Latest 5 work orders"/>
          <div>
            {recentWOs.map(wo => (
              <div key={wo.id} className="flex items-start gap-3 px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  wo.priority==="critical"?"bg-red-600":wo.priority==="high"?"bg-red-400":wo.priority==="medium"?"bg-amber-400":"bg-green-400"
                }`}/>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-slate-700 truncate">{wo.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{wo.woNumber} · {timeAgo(wo.createdAt)}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={woStatusVariant[wo.status]}>{wo.status.replace("_"," ")}</Badge>
                  <Badge className={priorityVariant[wo.priority]}>{wo.priority}</Badge>
                </div>
              </div>
            ))}
            {recentWOs.length === 0 && <div className="px-5 py-8 text-center text-slate-400 text-sm">No work orders yet</div>}
          </div>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader title="Activity Feed" subtitle="Latest activity across all modules"/>
          <div>
            {feed.length === 0 && (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No recent activity</div>
            )}
            {feed.map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${item.color}`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-slate-700 truncate">{item.text}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.sub}</div>
                </div>
                <div className="text-[11px] text-slate-300 whitespace-nowrap">{timeAgo(item.time)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
