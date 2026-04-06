"use client";

import { cn, initials, avatarColor } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import type { NavPage } from "@/types";
import {
  LayoutDashboard, Box, ClipboardList, Wrench, Users2,
  LayoutTemplate, AlertTriangle, Package, BarChart3, Settings,
  Zap, Briefcase, ListChecks, Activity, FileText, FolderOpen,
} from "lucide-react";

interface SidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
}

const NAV_GROUPS = [
  {
    label: "Operations",
    items: [
      { page: "dashboard"   as NavPage, icon: <LayoutDashboard size={17} />, label: "Dashboard" },
      { page: "my-tasks"    as NavPage, icon: <Briefcase       size={17} />, label: "My Tasks" },
      { page: "work-orders" as NavPage, icon: <ClipboardList   size={17} />, label: "Work Orders",    badge: "open" },
      { page: "incidents"   as NavPage, icon: <AlertTriangle   size={17} />, label: "Incidents",      badge: "new"  },
    ],
  },
  {
    label: "Field Work",
    items: [
      { page: "checklists"  as NavPage, icon: <ListChecks      size={17} />, label: "Checklists" },
      { page: "meter-readings" as NavPage, icon: <Activity     size={17} />, label: "Meter Readings" },
    ],
  },
  {
    label: "Assets & Facilities",
    items: [
      { page: "assets"      as NavPage, icon: <Box             size={17} />, label: "Assets" },
      { page: "maintenance" as NavPage, icon: <Wrench          size={17} />, label: "Maintenance" },
      { page: "spaces"      as NavPage, icon: <LayoutTemplate  size={17} />, label: "Spaces" },
      { page: "amc"         as NavPage, icon: <FileText        size={17} />, label: "AMC" },
    ],
  },
  {
    label: "Resources",
    items: [
      { page: "vendors"     as NavPage, icon: <Users2          size={17} />, label: "Vendors" },
      { page: "inventory"   as NavPage, icon: <Package         size={17} />, label: "Inventory",      badge: "low"  },
      { page: "documents"   as NavPage, icon: <FolderOpen      size={17} />, label: "Documents" },
    ],
  },
  {
    label: "Insights",
    items: [
      { page: "reports"     as NavPage, icon: <BarChart3       size={17} />, label: "Reports & KPIs" },
      { page: "settings"    as NavPage, icon: <Settings        size={17} />, label: "Settings" },
    ],
  },
];


export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { state } = useApp();
  const { currentUser, workOrders, incidents, inventory } = state;

  const openWOs  = workOrders.filter(w => w.status === "open" || w.status === "assigned").length;
  const newInc   = incidents.filter(i => i.status === "reported").length;
  const lowStock = inventory.filter(i => i.status !== "in_stock").length;

  function getBadgeCount(badge?: string): number {
    if (badge === "open") return openWOs;
    if (badge === "new")  return newInc;
    if (badge === "low")  return lowStock;
    return 0;
  }

  return (
    <aside className="w-64 bg-[#0f172a] flex flex-col flex-shrink-0 overflow-y-auto border-r border-slate-800">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <div className="text-[16px] font-bold text-white tracking-tight">FMNexus</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Facility Management</div>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 px-2 py-3 space-y-5">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <div className="px-3 pb-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const count = getBadgeCount(item.badge);
                const isActive = activePage === item.page;
                return (
                  <button
                    key={item.page}
                    onClick={() => onNavigate(item.page)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-medium",
                      "border border-transparent transition-all duration-150 text-left relative",
                      isActive
                        ? "bg-blue-500/15 text-blue-400 border-blue-500/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5/6 bg-blue-400 rounded-r" />
                    )}
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {count > 0 && (
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                        item.badge === "low"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-red-500/20 text-red-400"
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0",
            avatarColor(currentUser.name)
          )}>
            {initials(currentUser.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-white truncate">{currentUser.name}</div>
            <div className="text-[11px] text-slate-500 capitalize">{currentUser.role}</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Online" />
        </div>
      </div>
    </aside>
  );
}
