"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { initials, avatarColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/rbac";
import { Shield, Users, Bell, Database, Lock, Edit2, Trash2, Mail } from "lucide-react";
import type { User } from "@/types";
import { UserModal } from "@/components/modals/UserModal";
import { Modal } from "@/components/ui/Modal";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin:      ["View All","Create/Edit Assets","Create Work Orders","Manage Vendors","Manage Users","View Reports","System Settings"],
  manager:    ["View All","Create/Edit Assets","Create Work Orders","Manage Vendors","View Reports"],
  technician: ["View Assets","Create Work Orders","Update Work Order Status","View PM Schedules"],
  viewer:     ["View Assets","View Work Orders","View Reports"],
};

export function Settings() {
  const { state, toast, fetchUsers, addUser, updateUser, deleteUser, updateMe } = useApp();
  const { canManageUsers, isAdmin } = useRole();
  const [activeTab, setActiveTab] = useState(canManageUsers ? "users" : "notif");

  useEffect(() => {
    if (activeTab === "users" && isAdmin) {
      fetchUsers();
    }
  }, [activeTab, isAdmin, fetchUsers]);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const displayUsers = state.users;

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader title="Users" subtitle={`${displayUsers.length} total users`}
              action={canManageUsers ? <Button variant="primary" size="sm" onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}>+ Invite User</Button> : undefined}/>
            <div className="max-h-[500px] overflow-y-auto">
              {displayUsers.map((u: User)=>(
                <div key={u.id} className="group flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0", avatarColor(u.name))}>
                    {initials(u.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13px] text-slate-700">{u.name} {u.id === state.currentUser.id && <span className="text-[10px] font-normal text-slate-400">(You)</span>}</div>
                    <div className="text-xs text-slate-400">{u.email} · {u.department}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={
                        u.role==="admin"?"bg-violet-50 text-violet-700 border-violet-200":
                        u.role==="manager"?"bg-blue-50 text-blue-700 border-blue-200":
                        u.role==="technician"?"bg-amber-50 text-amber-700 border-amber-200":
                        "bg-slate-100 text-slate-500 border-slate-200"
                      }>
                        {u.role}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${u.active?"bg-green-400":"bg-slate-300"}`}/>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">{u.active?"Active":"Inactive"}</span>
                      </div>
                    </div>

                    {canManageUsers && u.id !== state.currentUser.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => { setUserToDelete(u); setIsDeleteModalOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {displayUsers.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                    <Users size={24} />
                  </div>
                  <div className="text-slate-500 font-medium text-sm">No users found</div>
                  <div className="text-slate-400 text-xs mt-1">Start by inviting your first team member.</div>
                </div>
              )}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
           <Card>
            <CardHeader title={<span className="flex items-center gap-2"><Lock size={14}/>Change Password</span>}/>
            <CardBody>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const currentPassword = (form.elements.namedItem("currentPassword") as HTMLInputElement).value;
                const newPassword = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
                const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

                if (newPassword !== confirmPassword) {
                  toast("Passwords do not match", "error");
                  return;
                }

                try {
                  const { request } = await import("@/lib/api/client");
                  await request("/auth/change-password", {
                    method: "PATCH",
                    body: JSON.stringify({ currentPassword, newPassword }),
                  });
                  toast("Password changed successfully", "success");
                  form.reset();
                } catch (err) {
                  toast((err as Error).message ?? "Failed to change password", "error");
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Current Password</label>
                  <input name="currentPassword" type="password" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">New Password</label>
                  <input name="newPassword" type="password" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Confirm New Password</label>
                  <input name="confirmPassword" type="password" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
                </div>
                <Button type="submit" variant="primary" className="w-full">Update Password</Button>
              </form>
            </CardBody>
          </Card>

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
          <CardHeader title="Notification Preferences" subtitle="Control when you receive alerts"/>
          <CardBody>
            <div className="space-y-3 max-w-lg">
              {[
                { key: "workOrderAssigned",    label: "Work Order Assigned" },
                { key: "pmScheduleDue",        label: "PM Schedule Due" },
                { key: "incidentReported",      label: "Incident Reported" },
                { key: "lowStockAlert",        label: "Low Stock Alert" },
                { key: "assetStatusChange",    label: "Asset Status Change" },
                { key: "vendorContractExpiry", label: "Vendor Contract Expiry" },
                { key: "workOrderOverdue",     label: "Work Order Overdue" },
                { key: "dailySummary",         label: "Daily Summary Report" },
              ].map((opt)=>(
                <div key={opt.key} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-600">{opt.label}</span>
                  <div
                    className={cn(
                      "w-10 h-5 rounded-full cursor-pointer transition-colors relative",
                      (state.currentUser.notificationPreferences as any)?.[opt.key] ? "bg-blue-500" : "bg-slate-200"
                    )}
                    onClick={() => {
                      const current = (state.currentUser.notificationPreferences as any)?.[opt.key];
                      updateMe({
                        notificationPreferences: {
                          ...state.currentUser.notificationPreferences,
                          [opt.key]: !current
                        }
                      });
                    }}
                  >
                    <div className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                      (state.currentUser.notificationPreferences as any)?.[opt.key] ? "left-5" : "left-0.5"
                    )}/>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === "system" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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

      <UserModal
        open={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={editingUser}
        onSave={async (data) => {
          if (editingUser) {
            await updateUser(editingUser.id, data);
          } else {
            await addUser(data);
          }
        }}
      />

      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3">
            <Trash2 className="text-red-500 flex-shrink-0" size={20} />
            <div>
              <div className="text-sm font-bold text-red-700">Are you absolutely sure?</div>
              <div className="text-xs text-red-600 mt-0.5">
                This will permanentely remove <strong>{userToDelete?.name}</strong> from the system. This action cannot be undone.
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={async () => {
              if (userToDelete) {
                await deleteUser(userToDelete.id);
                setIsDeleteModalOpen(false);
              }
            }}>Delete User</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
