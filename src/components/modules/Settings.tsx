"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { USERS } from "@/lib/seed-data";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { initials, avatarColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/rbac";
import { Shield, Users, Bell, Database, Lock } from "lucide-react";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin:      ["View All","Create/Edit Assets","Create Work Orders","Manage Vendors","Manage Users","View Reports","System Settings"],
  manager:    ["View All","Create/Edit Assets","Create Work Orders","Manage Vendors","View Reports"],
  technician: ["View Assets","Create Work Orders","Update Work Order Status","View PM Schedules"],
  viewer:     ["View Assets","View Work Orders","View Reports"],
};

export function Settings() {
  const { state, toast } = useApp();
  const { canManageUsers, isAdmin } = useRole();
  const [activeTab, setActiveTab] = useState(canManageUsers ? "users" : "notif");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[
          {key:"users",   icon:<Users size={13}/>,    label:"Users & Roles",  adminOnly: true},
          {key:"security",icon:<Shield size={13}/>,   label:"Security",       adminOnly: true},
          {key:"notif",   icon:<Bell size={13}/>,     label:"Notifications",  adminOnly: false},
          {key:"system",  icon:<Database size={13}/>, label:"System",         adminOnly: false},
        ].filter(t => !t.adminOnly || isAdmin).map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium border transition-all",
              activeTab===t.key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
            )}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <div className="grid grid-cols-2 gap-5">
          <Card>
            <CardHeader title="Users" subtitle={`${USERS.length} total users`}
              action={canManageUsers ? <Button variant="primary" size="sm">+ Invite User</Button> : undefined}/>
            <div>
              {USERS.map(u=>(
                <div key={u.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0", avatarColor(u.name))}>
                    {initials(u.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13px] text-slate-700">{u.name}</div>
                    <div className="text-xs text-slate-400">{u.email} · {u.department}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      u.role==="admin"?"bg-violet-50 text-violet-700 border-violet-200":
                      u.role==="manager"?"bg-blue-50 text-blue-700 border-blue-200":
                      u.role==="technician"?"bg-amber-50 text-amber-700 border-amber-200":
                      "bg-slate-100 text-slate-500 border-slate-200"
                    }>
                      {u.role}
                    </Badge>
                    <div className={`w-2 h-2 rounded-full ${u.active?"bg-green-400":"bg-slate-300"}`} title={u.active?"Active":"Inactive"}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Role Permissions" subtitle="RBAC configuration"/>
            <CardBody>
              <div className="space-y-4">
                {Object.entries(ROLE_PERMISSIONS).map(([role, perms])=>(
                  <div key={role}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full capitalize",
                        role==="admin"?"bg-violet-100 text-violet-700":
                        role==="manager"?"bg-blue-100 text-blue-700":
                        role==="technician"?"bg-amber-100 text-amber-700":
                        "bg-slate-100 text-slate-500"
                      )}>{role}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {perms.map(p=>(
                        <span key={p} className="text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-500">{p}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === "security" && (
        <div className="grid grid-cols-2 gap-5">
          {[
            {
              title:"Password Policy", icon:<Lock size={14}/>,
              items:["Minimum 8 characters","Uppercase + lowercase required","Numbers + special characters","Password expires every 90 days","No password reuse (last 5)"]
            },
            {
              title:"Session Security", icon:<Shield size={14}/>,
              items:["Session timeout: 30 minutes","Max concurrent sessions: 2","IP whitelisting enabled","2FA available for admin roles","Audit log retention: 1 year"]
            },
          ].map(sec=>(
            <Card key={sec.title}>
              <CardHeader title={<span className="flex items-center gap-2">{sec.icon}{sec.title}</span>}
                action={<Button variant="ghost" size="sm">Edit</Button>}/>
              <CardBody>
                <ul className="space-y-2">
                  {sec.items.map(item=>(
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"/>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
          <Card className="col-span-2">
            <CardHeader title="Recent Security Events" subtitle="Last 5 events"/>
            <div>
              {[
                {event:"Admin login",user:"Arjun Sharma",time:"Today 09:02",type:"success"},
                {event:"Failed login attempt",user:"unknown@test.com",time:"Yesterday 23:41",type:"danger"},
                {event:"User created: Karan Gupta",user:"Arjun Sharma",time:"Mar 10",type:"info"},
                {event:"Role changed: Sneha → Technician",user:"Arjun Sharma",time:"Feb 28",type:"info"},
                {event:"Password reset",user:"Priya Nair",time:"Feb 20",type:"warning"},
              ].map((e,i)=>(
                <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.type==="success"?"bg-green-400":e.type==="danger"?"bg-red-500":e.type==="warning"?"bg-amber-400":"bg-blue-400"}`}/>
                  <div className="flex-1 text-sm text-slate-600">{e.event}</div>
                  <div className="text-xs text-slate-400">{e.user}</div>
                  <div className="text-xs text-slate-300">{e.time}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "notif" && (
        <Card>
          <CardHeader title="Notification Preferences"/>
          <CardBody>
            <div className="space-y-3 max-w-lg">
              {[
                ["Work Order Assigned",       true ],
                ["PM Schedule Due",           true ],
                ["Incident Reported",         true ],
                ["Low Stock Alert",           true ],
                ["Asset Status Change",       false],
                ["Vendor Contract Expiry",    true ],
                ["Work Order Overdue",        true ],
                ["Daily Summary Report",      false],
              ].map(([label, enabled])=>(
                <div key={String(label)} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-600">{label}</span>
                  <div className={`w-10 h-5 rounded-full cursor-pointer transition-colors relative ${enabled?"bg-blue-500":"bg-slate-200"}`}
                    onClick={()=>toast("Notification settings updated","info")}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${enabled?"left-5":"left-0.5"}`}/>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === "system" && (
        <div className="grid grid-cols-2 gap-5">
          <Card>
            <CardHeader title="System Info"/>
            <CardBody>
              <div className="space-y-2">
                {[
                  ["Platform",     "FMNexus v1.0.0"],
                  ["Framework",    "Next.js 15 + React 19"],
                  ["Database",     "PostgreSQL (production)"],
                  ["Cache",        "Redis"],
                  ["Storage",      "AWS S3"],
                  ["Auth",         "JWT + RBAC"],
                  ["Environment",  "Production"],
                  ["Last Updated", "Apr 1, 2026"],
                ].map(([l,v])=>(
                  <div key={l} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-400 uppercase tracking-wide">{l}</span>
                    <span className="text-sm font-medium text-slate-700">{v}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Data Management"/>
            <CardBody>
              <div className="space-y-3">
                {[
                  {label:"Export All Data",      desc:"Download complete facility data as CSV/Excel", btn:"Export", variant:"secondary" as const},
                  {label:"Backup Database",       desc:"Create a full backup of the database",         btn:"Backup",  variant:"secondary" as const},
                  {label:"Clear Cache",           desc:"Flush Redis cache to reload fresh data",       btn:"Clear",   variant:"warning"   as const},
                  {label:"Audit Log Export",      desc:"Export system audit trail (last 90 days)",    btn:"Export",  variant:"ghost"      as const},
                ].map(item=>(
                  <div key={item.label} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">{item.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                    <Button variant={item.variant} size="sm" onClick={()=>toast(`${item.label} initiated`,"info")}>{item.btn}</Button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
