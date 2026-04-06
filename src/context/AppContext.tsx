"use client";

// ─── Global App State ──────────────────────────────────────────────────────────
// React Context + useReducer for global state.
// Auth is JWT-based; data is fetched from the Express/MongoDB API on login.

import React, {
  createContext, useContext, useReducer, useCallback,
  useEffect, useState, type ReactNode,
} from "react";
import type {
  AppState, Toast, Asset, WorkOrder, InventoryItem, Incident, Vendor, User,
  ChecklistSubmission, MeterReading, AMCContract, FMDocument, NavPage,
} from "@/types";
import { uid } from "@/lib/utils";
import {
  getToken, setToken, clearToken,
  apiLogin, apiGetMe,
  apiGetAssets, apiCreateAsset, apiUpdateAsset, apiDeleteAsset,
  apiGetWorkOrders, apiCreateWorkOrder, apiUpdateWorkOrder, apiDeleteWorkOrder,
  apiGetIncidents, apiCreateIncident, apiUpdateIncident,
  apiGetInventory, apiCreateInventoryItem, apiUpdateInventoryItem, apiRestockItem,
  apiGetVendors, apiCreateVendor, apiUpdateVendor,
  apiGetSpaces, apiGetMaintenance,
  apiGetAMC, apiCreateAMC, apiUpdateAMC,
  apiGetDocuments, apiCreateDocument, apiUpdateDocument,
  apiGetChecklists, apiSubmitChecklist,
  apiGetMeterReadings, apiSubmitMeterReading,
} from "@/lib/api";

// ─── Seed data for frontend-only features ─────────────────────────────────────
const SEED_AMC: AMCContract[] = [
  {
    id: "amc-001", contractNumber: "AMC/DG/2024-01", title: "DG Set Annual Maintenance",
    vendorName: "Johnson Controls India Pvt. Ltd.", category: "Mechanical",
    scope: "Quarterly servicing, emergency call-outs, spare parts (oil, filters)",
    startDate: "2024-04-01", endDate: "2026-03-31", value: 180000,
    status: "active", renewalAlertDays: 60,
    contactPerson: "Rajesh Kumar", contactPhone: "+91 98765 43210", notes: "",
    createdAt: "2024-04-01T00:00:00Z", updatedAt: "2024-04-01T00:00:00Z",
  },

  {
    id: "amc-002", contractNumber: "AMC/LIFT/2024-02", title: "Elevator Maintenance Contract",
    vendorName: "Schindler India Pvt. Ltd.", category: "Vertical Transport",
    scope: "Monthly PPM, 24x7 breakdown support, entrapment rescue",
    startDate: "2024-06-01", endDate: "2026-05-31", value: 240000,
    status: "active", renewalAlertDays: 60,
    contactPerson: "Suresh Nair", contactPhone: "+91 99887 76655", notes: "",
    createdAt: "2024-06-01T00:00:00Z", updatedAt: "2024-06-01T00:00:00Z",
  },

  {
    id: "amc-003", contractNumber: "AMC/HVAC/2024-03", title: "HVAC & Chiller Maintenance",
    vendorName: "Blue Star Ltd.", category: "HVAC",
    scope: "Monthly filters, quarterly coil cleaning, refrigerant top-up",
    startDate: "2025-01-01", endDate: "2026-05-15", value: 320000,
    status: "expiring_soon", renewalAlertDays: 45,
    contactPerson: "Priya Mehta", contactPhone: "+91 90123 45678", notes: "Renewal quote awaited",
    createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z",
  },

  {
    id: "amc-004", contractNumber: "AMC/FIRE/2024-04", title: "Fire Safety Systems AMC",
    vendorName: "Minimax India Pvt. Ltd.", category: "Fire Safety",
    scope: "Monthly inspection, annual hydraulic test, FM200 refill",
    startDate: "2024-07-01", endDate: "2026-06-30", value: 95000,
    status: "active", renewalAlertDays: 60,
    contactPerson: "Anil Desai", contactPhone: "+91 91234 56789", notes: "",
    createdAt: "2024-07-01T00:00:00Z", updatedAt: "2024-07-01T00:00:00Z",
  },

  {
    id: "amc-005", contractNumber: "AMC/BMS/2023-05", title: "BMS & IBMS Support Contract",
    vendorName: "Honeywell Automation India", category: "IT Infrastructure",
    scope: "Remote monitoring, on-site support, software license renewal",
    startDate: "2023-08-01", endDate: "2025-07-31", value: 150000,
    status: "expired", renewalAlertDays: 30,
    contactPerson: "Vikram Singh", contactPhone: "+91 88776 65544", notes: "Renewal in discussion",
    createdAt: "2023-08-01T00:00:00Z", updatedAt: "2023-08-01T00:00:00Z",
  },

  {
    id: "amc-006", contractNumber: "AMC/STP/2025-06", title: "STP & WTP Maintenance",
    vendorName: "Ion Exchange India Ltd.", category: "Water Treatment",
    scope: "Monthly chemical dosing, quarterly membrane cleaning, lab testing",
    startDate: "2025-03-01", endDate: "2027-02-28", value: 72000,
    status: "active", renewalAlertDays: 60,
    contactPerson: "Deepak Joshi", contactPhone: "+91 77665 54433", notes: "",
    createdAt: "2025-03-01T00:00:00Z", updatedAt: "2025-03-01T00:00:00Z",
  },

];

const SEED_DOCS: FMDocument[] = [
  {
    id: "doc-001", docNumber: "SOP-001", title: "DG Set Emergency Start Procedure",
    category: "SOP", version: "v2.1", status: "active",
    expiryDate: "", uploadedBy: "Admin User", uploadedAt: "2025-01-15",
    tags: ["DG", "Emergency", "Electrical"], description: "Step-by-step procedure for emergency DG start and load transfer.",
    createdAt: "2025-01-15T00:00:00Z", updatedAt: "2025-01-15T00:00:00Z",
  },

  {
    id: "doc-002", docNumber: "SOP-002", title: "Fire Evacuation & Muster Point Plan",
    category: "SOP", version: "v3.0", status: "active",
    expiryDate: "", uploadedBy: "Safety Officer", uploadedAt: "2024-10-01",
    tags: ["Fire", "Evacuation", "Safety"], description: "Facility evacuation procedure with floor warden assignments.",
    createdAt: "2024-10-01T00:00:00Z", updatedAt: "2024-10-01T00:00:00Z",
  },

  {
    id: "doc-003", docNumber: "CERT-001", title: "Fire NOC Certificate",
    category: "Certificate", version: "v1.0", status: "active",
    expiryDate: "2026-09-30", uploadedBy: "Admin User", uploadedAt: "2024-09-30",
    tags: ["Fire", "NOC", "Compliance"], description: "Fire No-Objection Certificate issued by Fire Department.",
    createdAt: "2024-09-30T00:00:00Z", updatedAt: "2024-09-30T00:00:00Z",
  },

  {
    id: "doc-004", docNumber: "CERT-002", title: "Lift Fitness Certificate",
    category: "Certificate", version: "v1.0", status: "active",
    expiryDate: "2026-06-15", uploadedBy: "Admin User", uploadedAt: "2025-06-15",
    tags: ["Lift", "Elevator", "Compliance"], description: "Annual fitness certificate for all lifts by CMVR authority.",
    createdAt: "2025-06-15T00:00:00Z", updatedAt: "2025-06-15T00:00:00Z",
  },

  {
    id: "doc-005", docNumber: "CERT-003", title: "Electrical Safety Audit Report",
    category: "Certificate", version: "v1.0", status: "under_review",
    expiryDate: "2026-03-31", uploadedBy: "Safety Officer", uploadedAt: "2025-03-31",
    tags: ["Electrical", "Audit", "Safety"], description: "Annual electrical safety audit by certified third-party inspector.",
    createdAt: "2025-03-31T00:00:00Z", updatedAt: "2025-03-31T00:00:00Z",
  },

  {
    id: "doc-006", docNumber: "PERMIT-001", title: "Hot Work Permit Template",
    category: "Permit", version: "v1.2", status: "active",
    expiryDate: "", uploadedBy: "Admin User", uploadedAt: "2024-11-01",
    tags: ["Hot Work", "Welding", "Permit"], description: "Standard permit form for welding/grinding/cutting activities.",
    createdAt: "2024-11-01T00:00:00Z", updatedAt: "2024-11-01T00:00:00Z",
  },

  {
    id: "doc-007", docNumber: "POLICY-001", title: "Health, Safety & Environment Policy",
    category: "Policy", version: "v4.0", status: "active",
    expiryDate: "", uploadedBy: "Admin User", uploadedAt: "2025-01-01",
    tags: ["HSE", "Policy", "Safety"], description: "Organisation-wide HSE policy statement signed by management.",
    createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z",
  },

  {
    id: "doc-008", docNumber: "MANUAL-001", title: "DG Set Operation Manual",
    category: "Manual", version: "v1.0", status: "active",
    expiryDate: "", uploadedBy: "Admin User", uploadedAt: "2024-05-01",
    tags: ["DG", "Manual", "Electrical"], description: "OEM operation and maintenance manual for Cummins 500 kVA DG.",
    createdAt: "2024-05-01T00:00:00Z", updatedAt: "2024-05-01T00:00:00Z",
  },

];

// ─── Blank initial state (filled from API after login) ────────────────────────
const BLANK_USER: User = {
  id: "", name: "", email: "", role: "viewer",
  department: "", active: true, createdAt: "", updatedAt: "",
};

const BLANK_STATE: AppState = {
  currentUser: BLANK_USER,
  assets: [], workOrders: [], preventiveMaintenance: [],
  vendors: [], spaces: [], incidents: [], inventory: [], toasts: [],
  checklistSubmissions: [],
  meterReadings: [],
  amcContracts: [],
  documents: [],
};

// ─── Actions ───────────────────────────────────────────────────────────────────
type Action =
  | { type: "SET_ALL_DATA";           payload: Partial<AppState> }
  | { type: "SET_CURRENT_USER";       payload: User }
  | { type: "ADD_ASSET";              payload: Asset }
  | { type: "UPDATE_ASSET";           payload: Asset }
  | { type: "DELETE_ASSET";           payload: string }
  | { type: "ADD_WO";                 payload: WorkOrder }
  | { type: "UPDATE_WO";              payload: WorkOrder }
  | { type: "ADD_INCIDENT";           payload: Incident }
  | { type: "UPDATE_INCIDENT";        payload: Incident }
  | { type: "UPDATE_INVENTORY";       payload: InventoryItem }
  | { type: "ADD_INVENTORY";          payload: InventoryItem }
  | { type: "ADD_VENDOR";             payload: Vendor }
  | { type: "UPDATE_VENDOR";          payload: Vendor }
  | { type: "ADD_CHECKLIST";          payload: ChecklistSubmission }
  | { type: "ADD_METER_READING";      payload: MeterReading }
  | { type: "ADD_AMC";                payload: AMCContract }
  | { type: "UPDATE_AMC";             payload: AMCContract }
  | { type: "ADD_DOCUMENT";           payload: FMDocument }
  | { type: "UPDATE_DOCUMENT";        payload: FMDocument }
  | { type: "TOAST_ADD";              payload: Omit<Toast, "id"> }
  | { type: "TOAST_REMOVE";           payload: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_ALL_DATA":
      return { ...state, ...action.payload };
    case "SET_CURRENT_USER":
      return { ...state, currentUser: action.payload };
    case "ADD_ASSET":
      return { ...state, assets: [action.payload, ...state.assets] };
    case "UPDATE_ASSET":
      return { ...state, assets: state.assets.map(a => a.id === action.payload.id ? action.payload : a) };
    case "DELETE_ASSET":
      return { ...state, assets: state.assets.filter(a => a.id !== action.payload) };
    case "ADD_WO":
      return { ...state, workOrders: [action.payload, ...state.workOrders] };
    case "UPDATE_WO":
      return { ...state, workOrders: state.workOrders.map(w => w.id === action.payload.id ? action.payload : w) };
    case "ADD_INCIDENT":
      return { ...state, incidents: [action.payload, ...state.incidents] };
    case "UPDATE_INCIDENT":
      return { ...state, incidents: state.incidents.map(i => i.id === action.payload.id ? action.payload : i) };
    case "ADD_INVENTORY":
      return { ...state, inventory: [action.payload, ...state.inventory] };
    case "UPDATE_INVENTORY":
      return { ...state, inventory: state.inventory.map(i => i.id === action.payload.id ? action.payload : i) };
    case "ADD_VENDOR":
      return { ...state, vendors: [action.payload, ...state.vendors] };
    case "UPDATE_VENDOR":
      return { ...state, vendors: state.vendors.map(v => v.id === action.payload.id ? action.payload : v) };
    case "ADD_CHECKLIST":
      return { ...state, checklistSubmissions: [action.payload, ...state.checklistSubmissions] };
    case "ADD_METER_READING":
      return { ...state, meterReadings: [action.payload, ...state.meterReadings] };
    case "ADD_AMC":
      return { ...state, amcContracts: [action.payload, ...state.amcContracts] };
    case "UPDATE_AMC":
      return { ...state, amcContracts: state.amcContracts.map(a => a.id === action.payload.id ? action.payload : a) };
    case "ADD_DOCUMENT":
      return { ...state, documents: [action.payload, ...state.documents] };
    case "UPDATE_DOCUMENT":
      return { ...state, documents: state.documents.map(d => d.id === action.payload.id ? action.payload : d) };
    case "TOAST_ADD":
      return { ...state, toasts: [...state.toasts, { id: uid(), ...action.payload }] };
    case "TOAST_REMOVE":
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    default:
      return state;
  }
}

// ─── Context shape ─────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  loading: boolean;
  toast: (msg: string, type?: Toast["type"]) => void;
  // Auth
  login:  (email: string, password: string) => Promise<void>;
  logout: () => void;
  // API-backed CRUD helpers
  addAsset:    (body: Record<string, unknown>) => Promise<void>;
  updateAsset: (id: string, body: Record<string, unknown>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  addWorkOrder:    (body: Record<string, unknown>) => Promise<void>;
  updateWorkOrder: (id: string, body: Record<string, unknown>) => Promise<void>;
  addVendor:    (body: Record<string, unknown>) => Promise<void>;
  updateVendor: (id: string, body: Record<string, unknown>) => Promise<void>;
  addIncident:    (body: Record<string, unknown>) => Promise<void>;
  updateIncident: (id: string, body: Record<string, unknown>) => Promise<void>;
  addInventoryItem:    (body: Record<string, unknown>) => Promise<void>;
  updateInventoryItem: (id: string, body: Record<string, unknown>) => Promise<void>;
  restockInventoryItem:(id: string, qty: number) => Promise<void>;
  // Frontend-only CRUD
  submitChecklist:   (body: Record<string, unknown>) => Promise<void>;
  submitMeterReading:(body: Record<string, unknown>) => Promise<void>;
  addAMC:    (body: Record<string, unknown>) => Promise<void>;
  updateAMC: (id: string, body: Record<string, unknown>) => Promise<void>;
  addDocument:    (body: Record<string, unknown>) => Promise<void>;
  updateDocument: (id: string, body: Record<string, unknown>) => Promise<void>;
  activePage: NavPage;
  navigateTo: (page: NavPage) => void;
  refreshAll: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch]   = useReducer(reducer, BLANK_STATE);
  const [loading, setLoading] = useState(false);

  // toast helper
  const toast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = uid();
    dispatch({ type: "TOAST_ADD", payload: { message, type } });
    setTimeout(() => dispatch({ type: "TOAST_REMOVE", payload: id }), 3500);
  }, []);

  // fetch everything from API and populate state
  const [activePage, setActivePage] = useState<NavPage>("dashboard");

  const navigateTo = useCallback((p: NavPage) => {
    setActivePage(p);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [assets, workOrders, vendors, incidents, inventory, spaces, preventiveMaintenance, amc, docs, check, meter] =
        await Promise.all([
          apiGetAssets(),
          apiGetWorkOrders(),
          apiGetVendors(),
          apiGetIncidents(),
          apiGetInventory(),
          apiGetSpaces(),
          apiGetMaintenance(),
          apiGetAMC(),
          apiGetDocuments(),
          apiGetChecklists(),
          apiGetMeterReadings(),
        ]);
      dispatch({ type: "SET_ALL_DATA", payload: {
        assets, workOrders, vendors, incidents, inventory, spaces, preventiveMaintenance,
        amcContracts: amc, documents: docs, checklistSubmissions: check, meterReadings: meter,
      }});
    } catch (err) {
      toast((err as Error).message ?? "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // on mount: if token exists, load user + data
  useEffect(() => {
    if (!getToken()) return;
    setLoading(true);
    apiGetMe()
      .then((me) => {
        dispatch({ type: "SET_CURRENT_USER", payload: me as User });
        return refreshAll();
      })
      .catch(() => { clearToken(); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      setToken(res.token);
      const me = await apiGetMe();
      dispatch({ type: "SET_CURRENT_USER", payload: me as User });
      await refreshAll();
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, [refreshAll]);

  const logout = useCallback(() => {
    clearToken();
    dispatch({ type: "SET_ALL_DATA", payload: BLANK_STATE });
  }, []);

  // ── Asset helpers ─────────────────────────────────────────────────────────
  const addAsset = useCallback(async (body: Record<string, unknown>) => {
    const asset = await apiCreateAsset(body) as Asset;
    dispatch({ type: "ADD_ASSET", payload: asset });
  }, []);

  const updateAsset = useCallback(async (id: string, body: Record<string, unknown>) => {
    const asset = await apiUpdateAsset(id, body) as Asset;
    dispatch({ type: "UPDATE_ASSET", payload: asset });
  }, []);

  const deleteAsset = useCallback(async (id: string) => {
    await apiDeleteAsset(id);
    dispatch({ type: "DELETE_ASSET", payload: id });
  }, []);

  // ── Work order helpers ────────────────────────────────────────────────────
  const addWorkOrder = useCallback(async (body: Record<string, unknown>) => {
    const wo = await apiCreateWorkOrder(body) as WorkOrder;
    dispatch({ type: "ADD_WO", payload: wo });
  }, []);

  const updateWorkOrder = useCallback(async (id: string, body: Record<string, unknown>) => {
    const wo = await apiUpdateWorkOrder(id, body) as WorkOrder;
    dispatch({ type: "UPDATE_WO", payload: wo });
  }, []);

  // ── Vendor helpers ────────────────────────────────────────────────────────
  const addVendor = useCallback(async (body: Record<string, unknown>) => {
    const vendor = await apiCreateVendor(body) as Vendor;
    dispatch({ type: "ADD_VENDOR", payload: vendor });
  }, []);

  const updateVendor = useCallback(async (id: string, body: Record<string, unknown>) => {
    const vendor = await apiUpdateVendor(id, body) as Vendor;
    dispatch({ type: "UPDATE_VENDOR", payload: vendor });
  }, []);

  // ── Incident helpers ──────────────────────────────────────────────────────
  const addIncident = useCallback(async (body: Record<string, unknown>) => {
    const inc = await apiCreateIncident(body) as Incident;
    dispatch({ type: "ADD_INCIDENT", payload: inc });
  }, []);

  const updateIncident = useCallback(async (id: string, body: Record<string, unknown>) => {
    const inc = await apiUpdateIncident(id, body) as Incident;
    dispatch({ type: "UPDATE_INCIDENT", payload: inc });
  }, []);

  // ── Inventory helpers ─────────────────────────────────────────────────────
  const addInventoryItem = useCallback(async (body: Record<string, unknown>) => {
    const item = await apiCreateInventoryItem(body) as InventoryItem;
    dispatch({ type: "ADD_INVENTORY", payload: item });
  }, []);

  const updateInventoryItem = useCallback(async (id: string, body: Record<string, unknown>) => {
    const item = await apiUpdateInventoryItem(id, body) as InventoryItem;
    dispatch({ type: "UPDATE_INVENTORY", payload: item });
  }, []);

  const restockInventoryItem = useCallback(async (id: string, qty: number) => {
    const item = await apiRestockItem(id, qty) as InventoryItem;
    dispatch({ type: "UPDATE_INVENTORY", payload: item });
  }, []);

  // ── Frontend-only helpers ─────────────────────────────────────────────────
  const submitChecklist = useCallback(async (body: Record<string, unknown>) => {
    const sub = await apiSubmitChecklist(body) as ChecklistSubmission;
    dispatch({ type: "ADD_CHECKLIST", payload: sub });
  }, []);

  const submitMeterReading = useCallback(async (body: Record<string, unknown>) => {
    const reading = await apiSubmitMeterReading(body) as MeterReading;
    dispatch({ type: "ADD_METER_READING", payload: reading });
  }, []);

  const addAMC = useCallback(async (body: Record<string, unknown>) => {
    const amc = await apiCreateAMC(body) as AMCContract;
    dispatch({ type: "ADD_AMC", payload: amc });
  }, []);

  const updateAMC = useCallback(async (id: string, body: Record<string, unknown>) => {
    const amc = await apiUpdateAMC(id, body) as AMCContract;
    dispatch({ type: "UPDATE_AMC", payload: amc });
  }, []);

  const addDocument = useCallback(async (body: Record<string, unknown>) => {
    const doc = await apiCreateDocument(body) as FMDocument;
    dispatch({ type: "ADD_DOCUMENT", payload: doc });
  }, []);

  const updateDocument = useCallback(async (id: string, body: Record<string, unknown>) => {
    const doc = await apiUpdateDocument(id, body) as FMDocument;
    dispatch({ type: "UPDATE_DOCUMENT", payload: doc });
  }, []);

  return (
    <AppContext.Provider value={{
      state, dispatch, loading, toast,
      login, logout,
      addAsset, updateAsset, deleteAsset,
      addWorkOrder, updateWorkOrder,
      addVendor, updateVendor,
      addIncident, updateIncident,
      addInventoryItem, updateInventoryItem, restockInventoryItem,
      submitChecklist, submitMeterReading,
      addAMC, updateAMC,
      addDocument, updateDocument,
      activePage, navigateTo,
      refreshAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Custom Hook ───────────────────────────────────────────────────────────────
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
