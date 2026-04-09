"use client";

import { Bell, Search, RefreshCw, LogOut, AlertTriangle, Package, Clock, X, QrCode } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { NavPage } from "@/types";
import { cn, daysUntil, timeAgo } from "@/lib/utils";
import { titleMap } from "@/lib/titleMap";
import { useState, useEffect, useRef } from "react";



interface TopBarProps {
  activePage: NavPage;
  search: string;
  onSearch: (v: string) => void;
  onRefresh: () => void;
  onLogout: () => void;
  navigateTo: (p: NavPage) => void;
  onOpenScanner: () => void;
}

export function TopBar({ activePage, search, onSearch, onRefresh, onLogout, navigateTo, onOpenScanner }: TopBarProps) {
  const { state, markNotificationRead } = useApp();
  const meta = titleMap[activePage] || { title: activePage, subtitle: "" };
  const [dateStr, setDateStr] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString("en-IN", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    }));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  // Use global notifications from backend
  const notifications = state.notifications.map(n => ({
    id: n.id,
    color: n.type === "error" ? "text-red-600 bg-red-50" :
           n.type === "warning" ? "text-amber-600 bg-amber-50" :
           n.type === "success" ? "text-green-600 bg-green-50" :
           "text-blue-600 bg-blue-50",
    icon: n.type === "error" ? <X size={13}/> :
          n.type === "warning" ? <AlertTriangle size={13}/> :
          <Bell size={13}/>,
    title: n.title,
    sub: n.message,
    time: n.createdAt,
    isRead: n.isRead
  })).slice(0, 12);

  const unreadCount = state.notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-[60px] bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0 z-20 shadow-[0_1px_0_rgba(0,0,0,.04)]">
      {/* Page Title */}
      <div className="flex-1">
        <div className="text-[17px] font-bold text-slate-800 leading-tight">{meta.title}</div>
        <div className="text-[11px] text-slate-400">{meta.subtitle}</div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-2 focus-within:border-blue-400 focus-within:bg-white transition-all">
        <Search size={14} className="text-slate-400 flex-shrink-0"/>
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search…"
          className="border-none bg-transparent outline-none text-[13px] text-slate-700 placeholder-slate-400 w-44"
        />
      </div>

      {/* Refresh */}
      <div className="flex items-center gap-1.5 border-r border-slate-100 pr-4">
        <button
          onClick={onOpenScanner}
          className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
          title="Scan QR Code"
        >
          <QrCode size={15}/>
        </button>
        <button
          onClick={onRefresh}
          className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          title="Refresh data"
        >
          <RefreshCw size={15}/>
        </button>
      </div>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setNotifOpen(o => !o)}
          className={cn(
            "relative w-9 h-9 rounded-lg border flex items-center justify-center transition-colors",
            notifOpen
              ? "bg-blue-50 border-blue-300 text-blue-600"
              : "border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          )}
        >
          <Bell size={16}/>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white text-[9px] text-white font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {notifOpen && (
          <div className="absolute right-0 top-[calc(100%+8px)] w-[360px] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="font-semibold text-[14px] text-slate-800">Notifications</div>
              {unreadCount > 0 && (
                <span className="text-[11px] font-semibold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
              <button onClick={() => setNotifOpen(false)} className="ml-2 text-slate-400 hover:text-slate-600">
                <X size={14}/>
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                <Bell size={24} className="mx-auto mb-2 opacity-30"/>
                All clear — no alerts right now
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-50">
                {notifications.map(n => (
                  <div key={n.id} 
                    onClick={() => {
                      if (!n.isRead) markNotificationRead(n.id);
                    }}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors cursor-pointer",
                      !n.isRead && "bg-blue-50/20"
                    )}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${n.color}`}>
                      {n.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-slate-700 leading-snug">{n.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{n.sub}</div>
                      {n.time && <div className="text-[10px] text-slate-300 mt-0.5">{timeAgo(n.time)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
               <button
                onClick={() => { setNotifOpen(false); navigateTo("notifications"); }}
                className="w-full text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider"
              >
                View all notifications
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Date */}
      <div className="text-[12px] text-slate-400 font-medium border-l border-slate-100 pl-4" suppressHydrationWarning>
        {dateStr}
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
        title="Sign out"
      >
        <LogOut size={15}/>
      </button>
    </header>
  );
}
