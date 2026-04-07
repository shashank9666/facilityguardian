"use client";

import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { apiGetDocumentStats } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn, uid, daysUntil, sanitize, fmtDate } from "@/lib/utils";
import type { FMDocument, DocCategory, DocStatus } from "@/types";
import {
  FileText, FileBadge, FileCheck, ScrollText, BookOpen,
  Plus, Pencil, Download, AlertTriangle, CheckCircle2, Clock,
  Search, Tag,
} from "lucide-react";

const CAT_ICON: Record<DocCategory, React.ReactNode> = {
  SOP:         <ScrollText size={16}/>,
  Certificate: <FileBadge size={16}/>,
  Permit:      <FileCheck size={16}/>,
  Policy:      <BookOpen size={16}/>,
  Manual:      <FileText size={16}/>,
};

const CAT_COLOR: Record<DocCategory, string> = {
  SOP:         "bg-blue-50 text-blue-600",
  Certificate: "bg-emerald-50 text-emerald-600",
  Permit:      "bg-amber-50 text-amber-600",
  Policy:      "bg-violet-50 text-violet-600",
  Manual:      "bg-slate-100 text-slate-600",
};

const STATUS_BADGE: Record<DocStatus, string> = {
  active:       "bg-green-50 text-green-700 border-green-200",
  expired:      "bg-red-50 text-red-700 border-red-200",
  under_review: "bg-amber-50 text-amber-700 border-amber-200",
  archived:     "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_LABEL: Record<DocStatus, string> = {
  active:       "Active",
  expired:      "Expired",
  under_review: "Under Review",
  archived:     "Archived",
};

const DOC_CATEGORIES: DocCategory[] = ["SOP","Certificate","Permit","Policy","Manual"];
const DOC_STATUSES: DocStatus[] = ["active","under_review","expired","archived"];

export function Documents({ search }: { search: string }) {
  const { state, addDocument, updateDocument, toast, fetchDocuments } = useApp();

  const [catFilter, setCatFilter] = useState<DocCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<DocStatus | "all">("all");
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<FMDocument | null>(null);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState<Partial<FMDocument>>({});
  const [stats, setStats] = useState({ total: 0, active: 0, expiring: 0, expired: 0 });

  const loadStats = () => {
    apiGetDocumentStats().then(s => setStats(s as typeof stats)).catch(console.error);
  };

  useEffect(() => {
    fetchDocuments();
    loadStats();
  }, [fetchDocuments]);

  const documents = state.documents;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return documents.filter(d => {
      const matchQ = !q || d.title.toLowerCase().includes(q) || d.docNumber.toLowerCase().includes(q) || (d.tags ?? []).some(t => t.toLowerCase().includes(q));
      const matchC = catFilter === "all" || d.category === catFilter;
      const matchS = statusFilter === "all" || d.status === statusFilter;
      return matchQ && matchC && matchS;
    });
  }, [documents, search, catFilter, statusFilter]);

  function openAdd() {
    setForm({
      category: "SOP", status: "active", version: "v1.0",
      uploadedAt: new Date().toISOString().slice(0, 10),
      uploadedBy: state.currentUser.name,
      tags: [], expiryDate: "",
    });
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(d: FMDocument) {
    setForm({ ...d });
    setEditing(d);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title?.trim()) return;
    setSaving(true);
    try {
      const docNum = form.docNumber || `${form.category?.slice(0,3)?.toUpperCase() ?? "DOC"}-${String(documents.length + 1).padStart(3, "0")}`;
      const payload: Partial<FMDocument> = {
        docNumber:   sanitize(docNum),
        title:       sanitize(form.title!),
        category:    form.category as DocCategory || "SOP",
        version:     sanitize(form.version || "v1.0"),
        status:      form.status as DocStatus || "active",
        expiryDate:  form.expiryDate || "",
        uploadedBy:  sanitize(form.uploadedBy || state.currentUser.name),
        uploadedAt:  form.uploadedAt || new Date().toISOString().slice(0, 10),
        tags:        typeof form.tags === "string"
          ? (form.tags as string).split(",").map((t: string) => t.trim()).filter(Boolean)
          : form.tags ?? [],
        description: sanitize(form.description || ""),
      };

      if (editing) {
        await updateDocument(editing.id, payload);
        toast("Document updated", "success");
      } else {
        await addDocument(payload);
        toast("Document added", "success");
      }
      setModalOpen(false); setForm({});
      loadStats();
    } catch (err) {
      toast((err as Error).message ?? "Failed to save document", "error");
    } finally {
      setSaving(false);
    }
  }

  // Category counts for sidebar tabs
  const catCounts = DOC_CATEGORIES.reduce<Record<string, number>>((acc, c) => {
    acc[c] = documents.filter(d => d.category === c).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Documents", val: stats.total,  color: "text-blue-600 bg-blue-50",   icon: <FileText size={18}/> },
          { label: "Active",          val: stats.active,        color: "text-green-600 bg-green-50", icon: <CheckCircle2 size={18}/> },
          { label: "Expiring (30d)",  val: stats.expiring,      color: "text-amber-600 bg-amber-50", icon: <AlertTriangle size={18}/> },
          { label: "Expired",         val: stats.expired,       color: "text-red-600 bg-red-50",     icon: <Clock size={18}/> },
        ].map(k => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${k.color}`}>{k.icon}</div>
            <div className="text-[22px] font-extrabold text-slate-800">{k.val}</div>
            <div className="text-[11px] text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Expiry alert */}
      {stats.expiring > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5"/>
          <div>
            <div className="text-[13px] font-semibold text-amber-800">
              {stats.expiring} document{stats.expiring > 1 ? "s" : ""} expiring within 30 days
            </div>
            <div className="text-[11px] text-amber-600 mt-0.5">
              {documents
                .filter(d => d.expiryDate && daysUntil(d.expiryDate) <= 30 && daysUntil(d.expiryDate) >= 0)
                .map(d => `${d.docNumber}: ${d.title}`).join(" · ")}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Category tabs */}
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setCatFilter("all")}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              catFilter === "all" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400")}>
            All ({documents.length})
          </button>
          {DOC_CATEGORIES.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                catFilter === c ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-300")}>
              {CAT_ICON[c]}
              {c} ({catCounts[c] ?? 0})
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as DocStatus | "all")}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none text-slate-600 bg-white">
            <option value="all">All Status</option>
            {DOC_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14}/>} onClick={openAdd}>
            Add Document
          </Button>
        </div>
      </div>

      {/* Documents table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Doc #","Title","Category","Version","Status","Expiry","Uploaded By",""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(d => {
              const expDays = d.expiryDate ? daysUntil(d.expiryDate) : null;
              return (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{d.docNumber}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-800 leading-snug">{d.title}</div>
                    {d.description && <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[280px]">{d.description}</div>}
                    {(d.tags ?? []).length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {(d.tags ?? []).slice(0,3).map(tag => (
                          <span key={tag} className="flex items-center gap-0.5 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            <Tag size={8}/>{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className={cn("flex items-center gap-1.5 w-9 h-9 rounded-xl justify-center", CAT_COLOR[d.category])}>
                      {CAT_ICON[d.category]}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{d.category}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[12px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{d.version}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge className={STATUS_BADGE[d.status]}>{STATUS_LABEL[d.status]}</Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    {d.expiryDate ? (
                      <div>
                        <div className="text-[12px] text-slate-600">{fmtDate(d.expiryDate)}</div>
                        {expDays !== null && (
                          <div className={cn("text-[10px] font-medium mt-0.5",
                            expDays < 0 ? "text-red-500" : expDays <= 30 ? "text-amber-500" : "text-emerald-500")}>
                            {expDays < 0 ? `${Math.abs(expDays)}d expired` : expDays === 0 ? "Today" : `${expDays}d left`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-300">No expiry</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-[12px]">
                    <div>{d.uploadedBy}</div>
                    <div className="text-[10px] text-slate-400">{fmtDate(d.uploadedAt)}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button title="Download" className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Download size={13}/>
                      </button>
                      <button title="Edit" onClick={() => openEdit(d)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">
            <Search size={28} className="mx-auto mb-2 opacity-30"/>
            No documents found
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setForm({}); }}
        title={editing ? `Edit — ${editing.title}` : "Add Document"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); setForm({}); }}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {editing ? "Save Changes" : "Add Document"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Document Title *</label>
            <input value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}
              placeholder="e.g. DG Set Emergency Start Procedure"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Doc Number</label>
            <input value={form.docNumber||""} onChange={e=>setForm(p=>({...p,docNumber:e.target.value}))}
              placeholder="SOP-001"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Category</label>
            <select value={form.category||"SOP"} onChange={e=>setForm(p=>({...p,category:e.target.value as DocCategory}))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400">
              {DOC_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Version</label>
            <input value={form.version||""} onChange={e=>setForm(p=>({...p,version:e.target.value}))}
              placeholder="v1.0"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Status</label>
            <select value={form.status||"active"} onChange={e=>setForm(p=>({...p,status:e.target.value as DocStatus}))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400">
              {DOC_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Expiry Date</label>
            <input type="date" value={form.expiryDate?.slice(0,10)||""} onChange={e=>setForm(p=>({...p,expiryDate:e.target.value}))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</label>
            <textarea value={form.description||""} onChange={e=>setForm(p=>({...p,description:e.target.value}))}
              placeholder="Brief description of this document..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 resize-none"/>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Tags (comma separated)</label>
            <input
              value={Array.isArray(form.tags) ? form.tags.join(", ") : (form.tags as unknown as string ?? "")}
              onChange={e=>setForm(p=>({...p,tags:e.target.value as unknown as string[]}))}
              placeholder="e.g. Fire, Safety, Emergency"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"/>
          </div>
        </div>
      </Modal>
    </div>
  );
}
