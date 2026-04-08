"use client";

import { cn, initials, avatarColor } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import type { NavPage } from "@/types";
import {
  LayoutDashboard, Box, ClipboardList, Wrench, Users2,
  LayoutTemplate, AlertTriangle, Package, BarChart3, Settings,
  Zap, Briefcase, ListChecks, Activity, FileText, FolderOpen,
  ChevronLeft, ChevronRight, Menu
} from "lucide-react";

interface SidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  collapsed: boolean;
  onToggle: () => void;
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


export function Sidebar({ activePage, onNavigate, collapsed, onToggle }: SidebarProps) {
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
    <aside className={cn(
      "bg-[#0f172a] flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out border-r border-slate-800 relative",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Brand */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-slate-800", collapsed && "justify-center px-0")}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
          <Zap size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-in fade-in duration-300">
            <div className="text-[17px] font-bold text-white tracking-tight leading-none mb-1">FMNexus</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">FACILITY GUARDIAN</div>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-10 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white border-2 border-[#0f172a] hover:bg-blue-500 transition-colors z-30"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Nav Groups */}
      <nav className="flex-1 px-3 py-6 space-y-7 overflow-y-auto no-scrollbar">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="space-y-2">
            {!collapsed && (
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-3">
                {group.label}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map(item => {
                const count = getBadgeCount(item.badge);
                const isActive = activePage === item.page;
                return (
                  <button
                    key={item.page}
                    onClick={() => onNavigate(item.page)}
                    title={collapsed ? item.label : ""}
                    className={cn(
                      "w-full flex items-center rounded-xl transition-all duration-200 group relative",
                      collapsed ? "justify-center p-3" : "px-4 py-2.5 gap-3",
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    )}
                  >
                    <span className={cn("flex-shrink-0", isActive ? "text-white" : "group-hover:text-blue-400")}>
                      {item.icon}
                    </span>
                    {!collapsed && <span className="text-[13.5px] font-semibold flex-1 text-left">{item.label}</span>}
                    {count > 0 && (
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[18px]",
                        collapsed ? "absolute -top-1 -right-1" : "",
                        isActive ? "bg-white/20 text-white" : 
                        item.badge === "low" ? "bg-amber-500/20 text-amber-500" : "bg-red-500/20 text-red-500"
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
      <div className="border-t border-slate-800 p-4">
        <div className={cn(
          "flex items-center rounded-xl transition-all",
          collapsed ? "justify-center p-1" : "gap-3 p-2 bg-slate-900/50 hover:bg-slate-800"
        )}>
          <div className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0 shadow-inner",
            avatarColor(currentUser.name)
          )}>
            {initials(currentUser.name)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-in fade-in duration-300">
              <div className="text-[13.5px] font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[11px] text-slate-500 capitalize font-medium">{currentUser.role}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
