"use client";

import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useRole } from "@/lib/rbac";
import type { Space, SpaceStatus } from "@/types";

const STATUS_STYLE: Record<SpaceStatus, {cell:string; badge:string; label:string}> = {
  available:   { cell:"bg-green-50 border-green-300",  badge:"bg-green-50 text-green-700 border-green-200",  label:"Available" },
  occupied:    { cell:"bg-red-50 border-red-300",      badge:"bg-red-50 text-red-700 border-red-200",        label:"Occupied" },
  maintenance: { cell:"bg-amber-50 border-amber-300",  badge:"bg-amber-50 text-amber-700 border-amber-200",  label:"Maintenance" },
  reserved:    { cell:"bg-blue-50 border-blue-300",    badge:"bg-blue-50 text-blue-700 border-blue-200",     label:"Reserved" },
};

const TYPE_ICON: Record<string, string> = {
  Conference:"🏛️", Workstation:"💼", Utility:"⚙️", Cafeteria:"☕",
  Recreation:"🏃", Parking:"🚗", Storage:"📦", Other:"🏢",
};

export function Spaces({ search }: { search: string }) {
  const { state, fetchSpaces } = useApp();

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const { canManageSpaces } = useRole();

  const [filterSite,   setFilterSite]   = useState("all");
  const [filterFloor,  setFilterFloor]  = useState("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [detailSpace,  setDetailSpace]  = useState<Space | null>(null);

  // Derive unique sites
  const sites = useMemo(() =>
    [...new Set(state.spaces.map(s => s.site || "Main Campus"))].sort(),
  [state.spaces]);

  // Floors within the selected site
  const floors = useMemo(() => {
    const src = filterSite === "all" ? state.spaces : state.spaces.filter(s => (s.site || "Main Campus") === filterSite);
    return [...new Set(src.map(s => s.floor))].sort();
  }, [state.spaces, filterSite]);

  const filtered = useMemo(() => state.spaces.filter(s => {
    const q = search.toLowerCase();
    const siteName = s.site || "Main Campus";
    return (!q || s.name.toLowerCase().includes(q) || siteName.toLowerCase().includes(q))
      && (filterSite   === "all" || siteName === filterSite)
      && (filterFloor  === "all" || s.floor  === filterFloor)
      && (filterStatus === "all" || s.status === filterStatus);
  }), [state.spaces, search, filterSite, filterFloor, filterStatus]);

  // Group filtered spaces by site
  const bySite = useMemo(() => {
    const map = new Map<string, Space[]>();
    filtered.forEach(s => {
      const key = s.site || "Main Campus";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [filtered]);

  const totalCapacity = state.spaces.reduce((s,sp)=>s+sp.capacity,0);
  const totalOccupied = state.spaces.reduce((s,sp)=>s+sp.occupied,0);
  const occupancyPct  = totalCapacity > 0 ? Math.round(totalOccupied/totalCapacity*100) : 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {label:"Total Spaces",  val:state.spaces.length,                                     icon:"🏢",bg:"bg-blue-50"},
          {label:"Occupancy",     val:`${occupancyPct}%`,                                       icon:"📊",bg:"bg-amber-50"},
          {label:"Available",     val:state.spaces.filter(s=>s.status==="available").length,   icon:"✅",bg:"bg-green-50"},
          {label:"Maintenance",   val:state.spaces.filter(s=>s.status==="maintenance").length, icon:"🔧",bg:"bg-red-50"},
        ].map(s=>(
          <div key={s.label} className={`${s.bg} border border-white rounded-xl p-4`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-[22px] font-extrabold text-slate-800">{s.val}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Site Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mr-1">Site:</span>
        <button onClick={()=>{setFilterSite("all");setFilterFloor("all");}}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            filterSite==="all" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-400"
          }`}>
          All Sites
        </button>
        {sites.map(site=>(
          <button key={site} onClick={()=>{setFilterSite(site);setFilterFloor("all");}}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filterSite===site ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-400"
            }`}>
            {site}
            <span className="ml-1.5 opacity-60 text-[10px]">
              {state.spaces.filter(s=>(s.site||"Main Campus")===site).length}
            </span>
          </button>
        ))}
      </div>

      {/* Floor + Status Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={()=>setFilterFloor("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterFloor==="all"?"bg-slate-700 text-white border-slate-700":"bg-white text-slate-500 border-slate-200"}`}>
            All Floors
          </button>
          {floors.map(f=>(
            <button key={f} onClick={()=>setFilterFloor(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterFloor===f?"bg-slate-700 text-white border-slate-700":"bg-white text-slate-500 border-slate-200"}`}>
              Floor {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 ml-auto">
          {["all","available","occupied","maintenance","reserved"].map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${
                filterStatus===s ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-500 border-slate-200"
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Spaces grouped by site */}
      {bySite.size === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">No spaces found</div>
      )}
      {[...bySite.entries()].map(([site, spaces]) => (
        <div key={site}>
          {/* Site header (only show when viewing all sites) */}
          {filterSite === "all" && (
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[13px] font-bold text-slate-700">📍 {site}</span>
              <span className="text-xs text-slate-400">{spaces.length} spaces</span>
              <div className="flex-1 h-px bg-slate-100"/>
            </div>
          )}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {spaces.map(space => {
              const style = STATUS_STYLE[space.status];
              const occ = space.capacity > 0 ? Math.round(space.occupied/space.capacity*100) : 0;
              return (
                <div key={space.id} onClick={()=>setDetailSpace(space)}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${style.cell}`}>
                  <div className="text-2xl mb-1">{TYPE_ICON[space.type]||"🏢"}</div>
                  <div className="font-semibold text-slate-800 text-[13px] leading-tight mb-1">{space.name}</div>
                  <div className="text-xs text-slate-400 mb-2">Floor {space.floor} · {space.building} · {space.area} sqft</div>
                  <Badge className={style.badge}>{style.label}</Badge>
                  {space.capacity > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>{space.occupied}/{space.capacity}</span><span>{occ}%</span>
                      </div>
                      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${occ>80?"bg-red-400":occ>60?"bg-amber-400":"bg-green-400"}`} style={{width:`${occ}%`}}/>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Space Detail Modal */}
      {detailSpace && (
        <Modal open={!!detailSpace} onClose={()=>setDetailSpace(null)} title={detailSpace.name}
          footer={<Button variant="secondary" onClick={()=>setDetailSpace(null)}>Close</Button>}>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Site",         detailSpace.site || "Main Campus"],
              ["Type",         `${TYPE_ICON[detailSpace.type]||"🏢"} ${detailSpace.type}`],
              ["Status",       detailSpace.status],
              ["Floor",        `Floor ${detailSpace.floor}`],
              ["Building",     detailSpace.building],
              ["Area",         `${detailSpace.area} sqft`],
              ["Capacity",     String(detailSpace.capacity)],
              ["Occupied",     String(detailSpace.occupied)],
              ["Assigned To",  detailSpace.assignedTo || "—"],
            ].map(([l,v])=>(
              <div key={l} className="bg-slate-50 rounded-lg p-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{l}</div>
                <div className="text-sm font-medium text-slate-700">{v||"—"}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
