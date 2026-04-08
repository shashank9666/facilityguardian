"use client";

import { useState,useEffect, useCallback } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { Sidebar }       from "@/components/layout/Sidebar";
import { TopBar }        from "@/components/layout/TopBar";
import { ToastContainer } from "@/components/ui/Toast";
import { LoginScreen }   from "./auth/LoginScreen";
import { getToken }      from "@/lib/api";

// Module pages
import { Dashboard }   from "./dashboard/Dashboard";
import { Assets }      from "./assets/Assets";
import { WorkOrders }  from "./work-orders/WorkOrders";
import { Maintenance } from "./maintenance/Maintenance";
import { Vendors }     from "./vendors/Vendors";
import { Spaces }      from "./spaces/Spaces";
import { Incidents }   from "./incidents/Incidents";
import { Inventory }   from "./inventory/Inventory";
import { Reports }     from "./reports/Reports";
import { Settings }    from "./settings/Settings";
import { MyTasks }     from "./tasks/MyTasks";
import { Checklists }  from "./checklists/Checklists";
import { MeterReadings } from "./meter-readings/MeterReadings";
import { AMC }         from "./amc/AMC";
import { Documents }   from "./documents/Documents";
import { Notifications } from "./notifications/Notifications";


import { NavPage } from "@/types";
import { Building2, X, Zap, Menu, RefreshCw, LogOut } from "lucide-react";

// ─── Loading spinner ──────────────────────────────────────────────────────────
function FullPageSpinner() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center animate-pulse">
        <Building2 className="w-6 h-6 text-white" />
      </div>
      <div className="flex gap-1">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <p className="text-slate-400 text-sm">Loading FMNexus…</p>
    </div>
  );
}

// ─── Main App (inside AppProvider context) ────────────────────────────────────
function FMNexusApp() {
  const { state, loading, logout, activePage, navigateTo, refreshAll } = useApp();
  const [search, setSearch]         = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [mounted, setMounted]       = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSearch   = useCallback((v: string)  => setSearch(v), []);
  const handleNavigate = useCallback((p: NavPage)  => { navigateTo(p); setSearch(""); }, [navigateTo]);
  const handleRefresh  = useCallback(() => {
    refreshAll();
  }, [refreshAll]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("fm_sidebar_collapsed") === "true";
    }
    return false;
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("fm_sidebar_collapsed", String(next));
      return next;
    });
  };

  // Mobile menu state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Solve hydration mismatch: return null or a simple shell until mounted
  if (!mounted) return null;

  // Show spinner while loading initial data (token present but data not yet fetched)
  if (loading) return <FullPageSpinner />;

  // Show login if no user loaded
  if (!state.currentUser.id && !getToken()) return <LoginScreen />;
  if (!state.currentUser.id) return <FullPageSpinner />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] text-slate-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar 
          activePage={activePage} 
          onNavigate={handleNavigate} 
          collapsed={sidebarCollapsed} 
          onToggle={toggleSidebar} 
        />
      </div>

      {/* Mobile Sidebar (Overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setMobileOpen(false)} />
           <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#0f172a] shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
             <div className="flex items-center justify-between p-4 border-b border-slate-800">
               <div className="flex items-center gap-2">
                 <Zap className="text-blue-500" size={20} />
                 <span className="font-bold text-white tracking-tight">FMNexus</span>
               </div>
               <button onClick={() => setMobileOpen(false)} className="p-2 text-slate-400 hover:text-white">
                 <X size={20} />
               </button>
             </div>
             <Sidebar 
               activePage={activePage} 
               onNavigate={(p) => { handleNavigate(p); setMobileOpen(false); }} 
               collapsed={false} 
               onToggle={() => setMobileOpen(false)} 
             />
           </div>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Unified TopBar / Mobile Header */}
        <div className="flex items-center h-[60px] bg-white border-b border-slate-200 px-4 md:px-6 gap-3 flex-shrink-0 z-20">
           {/* Mobile Trigger */}
           <button 
             onClick={() => setMobileOpen(true)} 
             className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
           >
             <Menu size={22} />
           </button>
           
           {/* Desktop Page Title (hidden on mobile if needed, but keeping it visible is fine if space exists) */}
           <div className="hidden lg:block flex-1">
             <TopBar
               activePage={activePage}
               search={search}
               onSearch={handleSearch}
               onRefresh={handleRefresh}
               onLogout={logout}
               navigateTo={handleNavigate}
             />
           </div>

           {/* Mobile-only title */}
           <div className="lg:hidden flex-1 font-bold text-slate-800 truncate">
             {activePage.charAt(0).toUpperCase() + activePage.slice(1).replace("-", " ")}
           </div>

           {/* Always visible actions (Refresh, Logout) */}
           <div className="lg:hidden flex items-center gap-1">
             <button onClick={handleRefresh} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
               <RefreshCw size={18} />
             </button>
             <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
               <LogOut size={18} />
             </button>
           </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-slide-up space-y-6">
            {activePage === "dashboard"   && <Dashboard />}
            {activePage === "assets"      && <Assets search={search} />}
            {activePage === "work-orders" && <WorkOrders search={search} />}
            {activePage === "maintenance" && <Maintenance search={search} />}
            {activePage === "vendors"     && <Vendors search={search} />}
            {activePage === "spaces"      && <Spaces search={search} />}
            {activePage === "incidents"   && <Incidents search={search} />}
            {activePage === "inventory"   && <Inventory search={search} />}
            {activePage === "reports"     && <Reports />}
            {activePage === "settings"    && <Settings />}
            {activePage === "my-tasks"    && <MyTasks />}
            {activePage === "checklists"  && <Checklists />}
            {activePage === "meter-readings" && <MeterReadings />}
            {activePage === "amc"         && <AMC search={search} />}
            {activePage === "documents"   && <Documents search={search} />}
            {activePage === "notifications" && <Notifications />}
          </div>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}

// ─── Root Page ─────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <AppProvider>
      <FMNexusApp />
    </AppProvider>
  );
}
