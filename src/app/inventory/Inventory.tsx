"use client";

import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { apiGetInventoryStats } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { fmtDate, fmtCurrency, sanitize } from "@/lib/utils";
import type { InventoryItem, InventoryStatus } from "@/types";
import { useRole } from "@/lib/rbac";
import { Plus, AlertTriangle, RefreshCw, Pencil, Trash2 } from "lucide-react";

const STATUS_STYLE: Record<InventoryStatus, string> = {
  in_stock:     "bg-green-50 text-green-700 border-green-200",
  low_stock:    "bg-amber-50 text-amber-700 border-amber-200",
  out_of_stock: "bg-red-50 text-red-700 border-red-200",
};

export function Inventory({ search }: { search: string }) {
  const { state, addInventoryItem, updateInventoryItem, deleteInventoryItem, restockInventoryItem, toast, fetchInventory } = useApp();
  const { canCreate, canDeleteInv } = useRole();
  const [filterStatus, setFilterStatus] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState(0);
  const [form, setForm] = useState<Partial<InventoryItem>>({});
  const [stats, setStats] = useState({ total: 0, in_stock: 0, low_stock: 0, out_of_stock: 0, totalValue: 0 });

  function loadStats() {
    apiGetInventoryStats().then(s => setStats(s as typeof stats)).catch(console.error);
  }

  useEffect(() => {
    loadStats();
    fetchInventory();
  }, [fetchInventory]);

  const filtered = useMemo(() => state.inventory.filter(i => {
    const q = search.toLowerCase();
    const matchQ = !q || i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q);
    const matchS = filterStatus === "all" || i.status === filterStatus;
    return matchQ && matchS;
  }), [state.inventory, search, filterStatus]);

  async function handleRestock() {
    const item = state.inventory.find(i => i.id === restockId);
    if (!item || restockQty <= 0) return;
    try {
      await restockInventoryItem(item.id, restockQty);
      toast(`${item.name} restocked (+${restockQty})`, "success");
      setRestockId(null); setRestockQty(0);
      loadStats();
    } catch (err) { toast((err as Error).message ?? "Failed to restock", "error"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteInventoryItem(id);
      toast("Item deleted", "success");
      loadStats();
    } catch (err) { toast((err as Error).message ?? "Failed to delete", "error"); }
  }

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:"Total Items",   value: stats.total, bg:"bg-blue-50",   icon:"📦" },
          { label:"In Stock",      value: stats.in_stock,     bg:"bg-green-50",  icon:"✅" },
          { label:"Low Stock",     value: stats.low_stock,    bg:"bg-amber-50",  icon:"⚠️" },
          { label:"Out of Stock",  value: stats.out_of_stock, bg:"bg-red-50",    icon:"🚫" },
        ].map(s=>(
          <div key={s.label} className={`${s.bg} border border-white rounded-xl p-4`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-[22px] font-extrabold text-slate-800">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {["all","in_stock","low_stock","out_of_stock"].map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filterStatus===s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
              }`}>{s==="all"?"All":s.replace("_"," ")}</button>
          ))}
        </div>
        <div className="ml-auto text-xs font-semibold text-slate-500">
          Total Inventory Value: <span className="text-blue-600">{fmtCurrency(stats.totalValue)}</span>
        </div>
        {canCreate && <Button variant="primary" size="sm" leftIcon={<Plus size={14}/>} onClick={()=>{setForm({});setEditingId(null);setAddOpen(true);}}>Add Item</Button>}
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Code","Name","Category","Qty / Min / Max","Status","Unit Cost","Total Value","Supplier","Last Restocked","Actions"].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/80 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const pct = Math.min(100, Math.round(item.quantity / item.maxQuantity * 100));
                const alert = item.status !== "in_stock";
                return (
                  <tr key={item.id} className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors group ${alert?"bg-amber-50/20":""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{item.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-700">{item.name}</div>
                      {alert && <div className="flex items-center gap-1 text-xs text-amber-600 mt-0.5"><AlertTriangle size={11}/> Reorder needed</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{item.category}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-slate-700">{item.quantity} {item.unit}</div>
                      <div className="text-xs text-slate-400">min {item.minQuantity} · max {item.maxQuantity}</div>
                      <div className="mt-1 h-1.5 bg-slate-100 rounded-full w-20 overflow-hidden">
                        <div className={`h-full rounded-full ${pct < 30 ? "bg-red-400" : pct < 60 ? "bg-amber-400" : "bg-green-400"}`} style={{width:`${pct}%`}}/>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge className={STATUS_STYLE[item.status]}>{item.status.replace("_"," ")}</Badge></td>
                    <td className="px-4 py-3 text-sm">{fmtCurrency(item.unitCost)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">{fmtCurrency(item.quantity * item.unitCost)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{item.supplierName||"—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(item.lastRestocked)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canCreate && (
                          <button onClick={()=>{setRestockId(item.id);setRestockQty(item.minQuantity);}}
                            className="p-1.5 rounded hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors" title="Restock">
                            <RefreshCw size={14}/>
                          </button>
                        )}
                        {canCreate && (
                          <button onClick={()=>{setEditingId(item.id);setForm(item);setAddOpen(true);}}
                            className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                            <Pencil size={14}/>
                          </button>
                        )}
                        {canDeleteInv && (
                          <button onClick={()=>handleDelete(item.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                            <Trash2 size={14}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length===0 && <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400">No items found</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Restock Modal */}
      <Modal open={!!restockId} onClose={()=>{setRestockId(null);setRestockQty(0);}} title="Restock Item"
        footer={<><Button variant="secondary" onClick={()=>setRestockId(null)}>Cancel</Button><Button variant="success" onClick={handleRestock}>Confirm Restock</Button></>}>
        {restockId && (() => {
          const item = state.inventory.find(i=>i.id===restockId)!;
          return (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Restocking: <span className="font-semibold">{item.name}</span></p>
              <p className="text-sm text-slate-500">Current quantity: {item.quantity} {item.unit}</p>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Quantity to Add</label>
                <input type="number" value={restockQty} onChange={e=>setRestockQty(+e.target.value)} min={1}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                New quantity: <strong>{item.quantity + restockQty} {item.unit}</strong> · Cost: <strong>{fmtCurrency(restockQty * item.unitCost)}</strong>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Add/Edit Item Modal */}
      <Modal open={addOpen} onClose={()=>{setAddOpen(false);setForm({});setEditingId(null);}} title={editingId ? "Edit Inventory Item" : "Add Inventory Item"}
        footer={<><Button variant="secondary" onClick={()=>{setAddOpen(false);setEditingId(null);}}>Cancel</Button><Button variant="primary" onClick={async ()=>{
          if (!form.name?.trim()) return;
          try {
            const payload = {
              name: sanitize(form.name!), category: sanitize(form.category||"General"),
              unit: sanitize(form.unit||"Pcs"), quantity: Number(form.quantity)||0,
              minQuantity: Number(form.minQuantity)||0, maxQuantity: Number(form.maxQuantity)||100,
              location: sanitize(form.location||""), supplierName: sanitize(form.supplierName||""),
              unitCost: Number(form.unitCost)||0,
            };
            if (editingId) {
              await updateInventoryItem(editingId, payload);
              toast("Item updated","success");
            } else {
              await addInventoryItem(payload);
              toast("Item added","success");
            }
            setAddOpen(false); setForm({}); setEditingId(null);
            loadStats();
          } catch (err) { toast((err as Error).message ?? "Failed to save","error"); }
        }}>{editingId ? "Save Changes" : "Add Item"}</Button></>}>
        <div className="grid grid-cols-2 gap-3">
          {[
            {l:"Name *",k:"name",t:"text",ph:"Item name"},
            {l:"Category",k:"category",t:"text",ph:"e.g. Electrical"},
            {l:"Unit",k:"unit",t:"text",ph:"Pcs / Ltr / Kg"},
            {l:"Location",k:"location",t:"text",ph:"Storage location"},
            {l:"Current Qty",k:"quantity",t:"number",ph:"0"},
            {l:"Min Qty",k:"minQuantity",t:"number",ph:"0"},
            {l:"Max Qty",k:"maxQuantity",t:"number",ph:"100"},
            {l:"Unit Cost (₹)",k:"unitCost",t:"number",ph:"0"},
            {l:"Supplier",k:"supplierName",t:"text",ph:"Supplier name"},
          ].map(f=>(
            <div key={f.k}>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{f.l}</label>
              <input type={f.t} value={(form as Record<string,string|number>)[f.k]||""} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}
                placeholder={f.ph} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
