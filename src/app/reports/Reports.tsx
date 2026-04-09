"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { fmtCurrency, daysUntil } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#f97316",
  "#06b6d4",
  "#ec4899",
];

type Tab = "overview" | "assets" | "vendors" | "service-requests";

export function Reports() {
  const { 
    state, fetchAssets, fetchWorkOrders, fetchServiceRequests, fetchInventory, 
    fetchSpaces, fetchVendors, fetchMaintenance, fetchAMC, fetchDocuments 
  } = useApp();
  const [tab, setTab] = useState<Tab>("overview");
  const [filters, setFilters] = useState({
    site: "All",
    department: "All",
    dateRange: "Last 6 Months",
  });

  useEffect(() => {
    const f = {
      site: filters.site === "All" ? "" : filters.site,
      department: filters.department === "All" ? "" : filters.department,
    };
    // Fetch all needed data with parameters
    fetchAssets(f);
    fetchWorkOrders(f);
    fetchServiceRequests(f);
    fetchInventory(); // Inventory usually global
    fetchSpaces(f);
    fetchVendors();
    fetchMaintenance(f);
    fetchAMC();
    fetchDocuments();
  }, [filters.site, filters.department, fetchAssets, fetchWorkOrders, fetchServiceRequests, fetchInventory, fetchSpaces, fetchVendors, fetchMaintenance, fetchAMC, fetchDocuments]);

  const { assets, workOrders, serviceRequests, inventory, vendors, preventiveMaintenance, spaces } = state;

  const sites = ["All", ...new Set(spaces.map(s => s.site || "Main Campus"))].sort();
  const departments = ["All", ...new Set(assets.map(a => a.department).filter(Boolean))].sort();

  // ── WO by month ──
  const monthLabels = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5 + i);
    return d.toLocaleString("en-IN", { month: "short" });
  });
  const woByMonth = monthLabels.map((m) => ({
    month: m,
    created: workOrders.filter(
      (w) =>
        new Date(w.createdAt).toLocaleString("en-IN", { month: "short" }) === m,
    ).length,
    completed: workOrders.filter(
      (w) =>
        w.status === "completed" &&
        w.completedAt &&
        new Date(w.completedAt).toLocaleString("en-IN", { month: "short" }) ===
          m,
    ).length,
  }));

  // ── Asset category distribution ──
  const assetCats = [...new Set(assets.map((a) => a.category))].map((cat) => ({
    name: cat,
    value: assets.filter((a) => a.category === cat).length,
  }));

  // ── Vendor performance ──
  const vendorPerf = vendors.map((v) => ({
    name: v.name.split(" ").slice(0, 2).join(" "),
    onTime:
      v.totalOrders > 0
        ? Math.round((v.completedOnTime / v.totalOrders) * 100)
        : 0,
    orders: v.totalOrders,
    rating: v.rating,
  }));

  // ── Service Request breakdown by category ──
  const serviceRequestCats = [...new Set(serviceRequests.map((i) => i.category || "Other"))]
    .map((cat) => ({
      name: cat,
      value: serviceRequests.filter((i) => (i.category || "Other") === cat).length,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // ── Inventory health by category ──
  const invCats = [...new Set(inventory.map((i) => i.category))].map((cat) => ({
    name: cat.length > 12 ? cat.slice(0, 12) + "…" : cat,
    inStock: inventory.filter(
      (i) => i.category === cat && i.status === "in_stock",
    ).length,
    lowStock: inventory.filter(
      (i) => i.category === cat && i.status === "low_stock",
    ).length,
    outOfStock: inventory.filter(
      (i) => i.category === cat && i.status === "out_of_stock",
    ).length,
  }));

  // ── Space utilization by site ──
  const sitesData = [
    ...new Set(spaces.map((s) => s.site || "Main Campus")),
  ].map((site) => ({
    site: site.length > 12 ? site.slice(0, 12) + "…" : site,
    occupancy: (() => {
      const ss = spaces.filter((s) => (s.site || "Main Campus") === site);
      const cap = ss.reduce((a, s) => a + s.capacity, 0);
      const occ = ss.reduce((a, s) => a + s.occupied, 0);
      return cap > 0 ? Math.round((occ / cap) * 100) : 0;
    })(),
    spaces: spaces.filter((s) => (s.site || "Main Campus") === site).length,
  }));

  // ── Radar — operational health ──
  const radarData = [
    {
      subject: "Assets",
      A:
        assets.length > 0
          ? Math.round(
              (assets.filter((a) => a.status === "operational").length /
                assets.length) *
                100,
            )
          : 0,
    },
    {
      subject: "Work Orders",
      A:
        workOrders.length > 0
          ? Math.round(
              (workOrders.filter((w) => w.status === "completed").length /
                workOrders.length) *
                100,
            )
          : 0,
    },
    {
      subject: "Service Requests",
      A:
        serviceRequests.length > 0
          ? Math.round(
              (serviceRequests.filter((i) =>
                ["resolved", "closed"].includes(i.status),
              ).length /
                serviceRequests.length) *
                100,
            )
          : 0,
    },
    {
      subject: "Inventory",
      A:
        inventory.length > 0
          ? Math.round(
              (inventory.filter((i) => i.status === "in_stock").length /
                inventory.length) *
                100,
            )
          : 0,
    },
    {
      subject: "Vendors",
      A:
        vendors.length > 0
          ? Math.round(
              (vendors.filter((v) => v.status === "active").length /
                vendors.length) *
                100,
            )
          : 0,
    },
    {
      subject: "PM",
      A:
        preventiveMaintenance.length > 0
          ? Math.round(
              (preventiveMaintenance.filter((p) => p.status !== "overdue")
                .length /
                preventiveMaintenance.length) *
                100,
            )
          : 100,
    },
  ];

  // ── KPIs ──
  const totalAssetValue = assets.reduce((s, a) => s + a.value, 0);
  const inventoryValue = inventory.reduce(
    (s, i) => s + i.quantity * i.unitCost,
    0,
  );
  const completedWOs = workOrders.filter(
    (w) => w.status === "completed",
  ).length;
  const completionRate =
    workOrders.length > 0
      ? Math.round((completedWOs / workOrders.length) * 100)
      : 0;
  const overdueWOs = workOrders.filter(
    (w) => w.status !== "completed" && daysUntil(w.dueDate) < 0,
  ).length;
  const avgVendorRating =
    vendors.length > 0
      ? (vendors.reduce((s, v) => s + v.rating, 0) / vendors.length).toFixed(1)
      : "—";
  const serviceRequestResolution =
    serviceRequests.length > 0
      ? Math.round(
          (serviceRequests.filter(
            (i) => i.status === "resolved" || i.status === "closed",
          ).length /
            serviceRequests.length) *
            100,
        )
      : 0;
  const openWOs = workOrders.filter((w) =>
    ["open", "assigned", "in_progress"].includes(w.status),
  ).length;

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "assets", label: "Assets" },
    { key: "vendors", label: "Vendors" },
    { key: "service-requests", label: "Service Requests" },
  ];

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase">
            Site:
          </span>
          <select
            value={filters.site}
            onChange={(e) => setFilters({ ...filters, site: e.target.value })}
            className="text-sm font-semibold text-slate-700 outline-none bg-transparent"
          >
            {sites.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 border-l border-slate-100 pl-6">
          <span className="text-xs font-bold text-slate-400 uppercase">
            Dept:
          </span>
          <select
            value={filters.department}
            onChange={(e) =>
              setFilters({ ...filters, department: e.target.value })
            }
            className="text-sm font-semibold text-slate-700 outline-none bg-transparent"
          >
            {departments.map((d) => (
              <option key={String(d)} value={String(d)}>
                {String(d)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 border-l border-slate-100 pl-6">
          <span className="text-xs font-bold text-slate-400 uppercase">
            Period:
          </span>
          <select className="text-sm font-semibold text-slate-700 outline-none bg-transparent">
            <option>Last 6 Months</option>
            <option>Last 12 Months</option>
            <option>This Quarter</option>
            <option>Custom Range</option>
          </select>
        </div>
        <div className="flex-1 flex justify-end">
          <Button variant="secondary" size="sm" className="gap-2">
            <TrendingUp size={14} /> Generate PDF Report
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Asset Value",
            value: fmtCurrency(totalAssetValue),
            icon: "🏗️",
            bg: "bg-blue-50",
          },
          {
            label: "Inventory Value",
            value: fmtCurrency(inventoryValue),
            icon: "📦",
            bg: "bg-violet-50",
          },
          {
            label: "WO Completion Rate",
            value: `${completionRate}%`,
            icon: "✅",
            bg: "bg-green-50",
          },
          {
            label: "Request Resolution Rate",
            value: `${serviceRequestResolution}%`,
            icon: "⚠️",
            bg: "bg-amber-50",
          },
        ].map((k) => (
          <div
            key={k.label}
            className={`${k.bg} border border-white rounded-xl p-4`}
          >
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="text-[22px] font-extrabold text-slate-800">
              {k.value}
            </div>
            <div className="text-xs text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium border transition-all ${
              tab === t.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {tab === "overview" && (
        <>
          <div className="grid grid-cols-3 gap-5">
            {/* WO by month */}
            <Card className="col-span-2">
              <CardHeader title="Work Orders — Last 6 Months" />
              <CardBody>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={woByMonth} barSize={20} barGap={4}>
                    <defs>
                      <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="gCompleted"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                      }}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="created"
                      name="Created"
                      stroke="#3b82f6"
                      fill="url(#gCreated)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke="#10b981"
                      fill="url(#gCompleted)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Operational Health Radar */}
            <Card>
              <CardHeader title="Operational Health" />
              <CardBody>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fontSize: 9 }}
                    />
                    <Radar
                      name="Health %"
                      dataKey="A"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.25}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      formatter={(v: number) => [`${v}%`, "Health"]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>

          {/* KPI Table + Space utilization */}
          <div className="grid grid-cols-2 gap-5">
            <Card>
              <CardHeader title="Operational KPIs" />
              <CardBody>
                <div className="space-y-1">
                  {[
                    [
                      "Open Work Orders",
                      openWOs,
                      openWOs > 5 ? "text-red-500" : "text-green-600",
                    ],
                    [
                      "Overdue Work Orders",
                      overdueWOs,
                      overdueWOs > 0 ? "text-red-500" : "text-green-600",
                    ],
                    ["Completed Work Orders", completedWOs, "text-green-600"],
                    ["Total Assets", assets.length, "text-blue-600"],
                    [
                      "Faulty Assets",
                      assets.filter((a) => a.status === "faulty").length,
                      "text-red-500",
                    ],
                    [
                      "Low/Out-of-stock Items",
                      inventory.filter((i) => i.status !== "in_stock").length,
                      "text-amber-600",
                    ],
                    ["Avg Vendor Rating", avgVendorRating, "text-amber-600"],
                    [
                      "Active Service Requests",
                      serviceRequests.filter(
                        (i) => !["resolved", "closed"].includes(i.status),
                      ).length,
                      "text-amber-600",
                    ],
                    [
                      "PM Schedules Overdue",
                      preventiveMaintenance.filter(
                        (p) => daysUntil(p.nextDue) < 0,
                      ).length,
                      "text-red-500",
                    ],
                  ].map(([l, v, c]) => (
                    <div
                      key={String(l)}
                      className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0"
                    >
                      <span className="text-sm text-slate-500">{l}</span>
                      <span className={`text-[15px] font-bold ${c}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Space utilization by site */}
            <Card>
              <CardHeader title="Space Utilization by Site" />
              <CardBody>
                {sitesData.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">
                    No space data available
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={sitesData}
                      barSize={32}
                      layout="vertical"
                      margin={{ left: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `${v}%`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="site"
                        tick={{ fontSize: 11 }}
                        width={90}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8 }}
                        formatter={(v: number) => [`${v}%`, "Occupancy"]}
                      />
                      <Bar
                        dataKey="occupancy"
                        name="Occupancy %"
                        radius={[0, 4, 4, 0]}
                      >
                        {sitesData.map((s, i) => (
                          <Cell
                            key={i}
                            fill={
                              s.occupancy > 85
                                ? "#ef4444"
                                : s.occupancy > 60
                                  ? "#f59e0b"
                                  : "#10b981"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {/* ── Assets Tab ── */}
      {tab === "assets" && (
        <div className="grid grid-cols-2 gap-5">
          <Card>
            <CardHeader title="Asset Category Distribution" />
            <CardBody>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={assetCats}
                    cx="45%"
                    cy="50%"
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={3}
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={false}
                  >
                    {assetCats.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Asset Status Breakdown" />
            <CardBody>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={[
                    {
                      name: "Operational",
                      count: assets.filter((a) => a.status === "operational")
                        .length,
                      fill: "#10b981",
                    },
                    {
                      name: "Maintenance",
                      count: assets.filter((a) => a.status === "maintenance")
                        .length,
                      fill: "#f59e0b",
                    },
                    {
                      name: "Faulty",
                      count: assets.filter((a) => a.status === "faulty").length,
                      fill: "#ef4444",
                    },
                    {
                      name: "Decomm.",
                      count: assets.filter((a) => a.status === "decommissioned")
                        .length,
                      fill: "#94a3b8",
                    },
                  ]}
                  barSize={40}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {[0, 1, 2, 3].map((i) => (
                      <Cell
                        key={i}
                        fill={["#10b981", "#f59e0b", "#ef4444", "#94a3b8"][i]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* Inventory health */}
          <Card className="col-span-2">
            <CardHeader title="Inventory Health by Category" />
            <CardBody>
              {invCats.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">
                  No inventory data
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={invCats} barSize={20} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Legend iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                    <Bar
                      dataKey="inStock"
                      name="In Stock"
                      fill="#10b981"
                      radius={[2, 2, 0, 0]}
                      stackId="a"
                    />
                    <Bar
                      dataKey="lowStock"
                      name="Low Stock"
                      fill="#f59e0b"
                      radius={[0, 0, 0, 0]}
                      stackId="a"
                    />
                    <Bar
                      dataKey="outOfStock"
                      name="Out of Stock"
                      fill="#ef4444"
                      radius={[2, 2, 0, 0]}
                      stackId="a"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── Vendors Tab ── */}
      {tab === "vendors" && (
        <div className="grid grid-cols-2 gap-5">
          <Card className="col-span-2">
            <CardHeader title="Vendor On-Time Delivery (%)" />
            <CardBody>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={vendorPerf} layout="vertical" barSize={18}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={130}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(v: number) => [`${v}%`, "On-time %"]}
                  />
                  <Bar dataKey="onTime" name="On-time %" radius={[0, 4, 4, 0]}>
                    {vendorPerf.map((v, i) => (
                      <Cell
                        key={i}
                        fill={
                          v.onTime >= 90
                            ? "#10b981"
                            : v.onTime >= 70
                              ? "#f59e0b"
                              : "#ef4444"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Vendor Ratings" />
            <CardBody>
              <div className="space-y-2">
                {vendorPerf
                  .sort((a, b) => b.rating - a.rating)
                  .map((v, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="text-[11px] text-slate-500 w-28 truncate">
                        {v.name}
                      </div>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: `${(v.rating / 5) * 100}%` }}
                        />
                      </div>
                      <div className="text-[12px] font-bold text-slate-700 w-8 text-right">
                        {v.rating.toFixed(1)}
                      </div>
                    </div>
                  ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Total Orders by Vendor" />
            <CardBody>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={vendorPerf.filter((v) => v.orders > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="orders"
                    nameKey="name"
                    paddingAngle={2}
                  >
                    {vendorPerf.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(v: number) => [v, "Orders"]}
                  />
                  <Legend iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── Service Requests Tab ── */}
      {tab === "service-requests" && (
        <div className="grid grid-cols-2 gap-5">
          <Card>
            <CardHeader title="Requests by Category" />
            <CardBody>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={serviceRequestCats}
                    cx="45%"
                    cy="50%"
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={3}
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={false}
                  >
                    {serviceRequestCats.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Requests by Severity & Status" />
            <CardBody>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={[
                    {
                      name: "Critical",
                      open: serviceRequests.filter(
                        (i) =>
                          i.severity === "critical" &&
                          !["resolved", "closed"].includes(i.status),
                      ).length,
                      closed: serviceRequests.filter(
                        (i) =>
                          i.severity === "critical" &&
                          ["resolved", "closed"].includes(i.status),
                      ).length,
                    },
                    {
                      name: "High",
                      open: serviceRequests.filter(
                        (i) =>
                          i.severity === "high" &&
                          !["resolved", "closed"].includes(i.status),
                      ).length,
                      closed: serviceRequests.filter(
                        (i) =>
                          i.severity === "high" &&
                          ["resolved", "closed"].includes(i.status),
                      ).length,
                    },
                    {
                      name: "Medium",
                      open: serviceRequests.filter(
                        (i) =>
                          i.severity === "medium" &&
                          !["resolved", "closed"].includes(i.status),
                      ).length,
                      closed: serviceRequests.filter(
                        (i) =>
                          i.severity === "medium" &&
                          ["resolved", "closed"].includes(i.status),
                      ).length,
                    },
                    {
                      name: "Low",
                      open: serviceRequests.filter(
                        (i) =>
                          i.severity === "low" &&
                          !["resolved", "closed"].includes(i.status),
                      ).length,
                      closed: serviceRequests.filter(
                        (i) =>
                          i.severity === "low" &&
                          ["resolved", "closed"].includes(i.status),
                      ).length,
                    },
                  ]}
                  barSize={28}
                  barGap={2}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    dataKey="open"
                    name="Open"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="closed"
                    name="Resolved"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* Service Request stats table */}
          <Card className="col-span-2">
            <CardHeader title="Service Request Statistics" />
            <CardBody>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Total Requests",
                    val: serviceRequests.length,
                    color: "text-blue-600",
                  },
                  {
                    label: "Open / Active",
                    val: serviceRequests.filter(
                      (i) => !["resolved", "closed"].includes(i.status),
                    ).length,
                    color: "text-amber-600",
                  },
                  {
                    label: "Resolved",
                    val: serviceRequests.filter((i) => i.status === "resolved")
                      .length,
                    color: "text-green-600",
                  },
                  {
                    label: "Critical Open",
                    val: serviceRequests.filter(
                      (i) => i.severity === "critical" && i.status !== "closed",
                    ).length,
                    color: "text-red-600",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-slate-50 rounded-xl p-4 text-center"
                  >
                    <div className={`text-[28px] font-extrabold ${s.color}`}>
                      {s.val}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {s.label}
                    </div>
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
