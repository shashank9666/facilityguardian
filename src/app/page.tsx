"use client";

import { useState,useEffect, useCallback } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { Sidebar }       from "@/components/layout/Sidebar";
import { TopBar }        from "@/components/layout/TopBar";
import { ToastContainer } from "@/components/ui/Toast";
import { LoginScreen }   from "@/components/auth/LoginScreen";
import { getToken }      from "@/lib/api";

// Module pages
import { Dashboard }   from "@/components/modules/Dashboard";
import { Assets }      from "@/components/modules/Assets";
import { WorkOrders }  from "@/components/modules/WorkOrders";
import { Maintenance } from "@/components/modules/Maintenance";
import { Vendors }     from "@/components/modules/Vendors";
import { Spaces }      from "@/components/modules/Spaces";
import { Incidents }   from "@/components/modules/Incidents";
import { Inventory }   from "@/components/modules/Inventory";
import { Reports }     from "@/components/modules/Reports";
import { Settings }    from "@/components/modules/Settings";
import { MyTasks }     from "@/components/modules/MyTasks";
import { Checklists }  from "@/components/modules/Checklists";
import { MeterReadings } from "@/components/modules/MeterReadings";
import { AMC }         from "@/components/modules/AMC";
import { Documents }   from "@/components/modules/Documents";


import type { NavPage } from "@/types";
import { Building2 }   from "lucide-react";

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
  const { state, loading, logout, activePage, navigateTo } = useApp();
  const [search, setSearch]         = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [mounted, setMounted]       = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSearch   = useCallback((v: string)  => setSearch(v), []);
  const handleNavigate = useCallback((p: NavPage)  => { navigateTo(p); setSearch(""); }, []);
  const handleRefresh  = useCallback(() => setRefreshKey(k => k + 1), []);

  // Solve hydration mismatch: return null or a simple shell until mounted
  if (!mounted) return null;

  // Show spinner while loading initial data (token present but data not yet fetched)
  if (loading) return <FullPageSpinner />;


  // Show login if no user loaded
  if (!state.currentUser.id && !getToken()) return <LoginScreen />;
  if (!state.currentUser.id) return <FullPageSpinner />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          activePage={activePage}
          search={search}
          onSearch={handleSearch}
          onRefresh={handleRefresh}
          onLogout={logout}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div key={`${activePage}-${refreshKey}`} className="animate-slide-up">
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
