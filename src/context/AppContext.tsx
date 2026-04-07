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
  apiGetInventory, apiCreateInventoryItem, apiUpdateInventoryItem, apiDeleteInventoryItem, apiRestockItem,
  apiGetVendors, apiCreateVendor, apiUpdateVendor,
  apiGetSpaces, apiGetMaintenance,
  apiGetAMC, apiCreateAMC, apiUpdateAMC,
  apiGetDocuments, apiCreateDocument, apiUpdateDocument,
  apiGetChecklists, apiSubmitChecklist,
  apiGetMeterReadings, apiSubmitMeterReading,
} from "@/lib/api";

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
  | { type: "DELETE_INVENTORY";       payload: string }
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
    case "DELETE_INVENTORY":
      return { ...state, inventory: state.inventory.filter(i => i.id !== action.payload) };
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
  deleteInventoryItem: (id: string) => Promise<void>;
  restockInventoryItem:(id: string, qty: number) => Promise<void>;
  // Module-specific helpers
  submitChecklist:   (body: Partial<ChecklistSubmission>) => Promise<void>;
  submitMeterReading:(body: Partial<MeterReading>) => Promise<void>;
  addAMC:    (body: Partial<AMCContract>) => Promise<void>;
  updateAMC: (id: string, body: Partial<AMCContract>) => Promise<void>;
  addDocument:    (body: Partial<FMDocument>) => Promise<void>;
  updateDocument: (id: string, body: Partial<FMDocument>) => Promise<void>;
  activePage: NavPage;
  navigateTo: (page: NavPage) => void;
  refreshAll: () => Promise<void>;
  fetchAssets: () => Promise<void>;
  fetchWorkOrders: () => Promise<void>;
  fetchVendors: () => Promise<void>;
  fetchIncidents: () => Promise<void>;
  fetchInventory: () => Promise<void>;
  fetchSpaces: () => Promise<void>;
  fetchMaintenance: () => Promise<void>;
  fetchAMC: () => Promise<void>;
  fetchDocuments: () => Promise<void>;
  fetchChecklists: () => Promise<void>;
  fetchMeterReadings: () => Promise<void>;
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

  // Persistent activePage
  const [activePage, setActivePage] = useState<NavPage>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("fm_active_page") as NavPage) || "dashboard";
    }
    return "dashboard";
  });

  const navigateTo = useCallback((p: NavPage) => {
    setActivePage(p);
    localStorage.setItem("fm_active_page", p);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [assets, workOrders, vendors, incidents, inventory, spaces, preventiveMaintenance, amc, docs, check, meter] =
        await Promise.all([
          apiGetAssets(), apiGetWorkOrders(), apiGetVendors(), apiGetIncidents(),
          apiGetInventory(), apiGetSpaces(), apiGetMaintenance(), apiGetAMC(),
          apiGetDocuments(), apiGetChecklists(), apiGetMeterReadings(),
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

  // Individual fetchers
  const fetchAssets      = useCallback(async () => { const data = await apiGetAssets();      dispatch({ type: "SET_ALL_DATA", payload: { assets: data }}); }, []);
  const fetchWorkOrders  = useCallback(async () => { const data = await apiGetWorkOrders();  dispatch({ type: "SET_ALL_DATA", payload: { workOrders: data }}); }, []);
  const fetchVendors     = useCallback(async () => { const data = await apiGetVendors();     dispatch({ type: "SET_ALL_DATA", payload: { vendors: data }}); }, []);
  const fetchIncidents   = useCallback(async () => { const data = await apiGetIncidents();   dispatch({ type: "SET_ALL_DATA", payload: { incidents: data }}); }, []);
  const fetchInventory   = useCallback(async () => { const data = await apiGetInventory();   dispatch({ type: "SET_ALL_DATA", payload: { inventory: data }}); }, []);
  const fetchSpaces      = useCallback(async () => { const data = await apiGetSpaces();      dispatch({ type: "SET_ALL_DATA", payload: { spaces: data }}); }, []);
  const fetchMaintenance = useCallback(async () => { const data = await apiGetMaintenance(); dispatch({ type: "SET_ALL_DATA", payload: { preventiveMaintenance: data }}); }, []);
  const fetchAMC         = useCallback(async () => { const data = await apiGetAMC();         dispatch({ type: "SET_ALL_DATA", payload: { amcContracts: data }}); }, []);
  const fetchDocuments   = useCallback(async () => { const data = await apiGetDocuments();   dispatch({ type: "SET_ALL_DATA", payload: { documents: data }}); }, []);
  const fetchChecklists  = useCallback(async () => { const data = await apiGetChecklists();  dispatch({ type: "SET_ALL_DATA", payload: { checklistSubmissions: data }}); }, []);
  const fetchMeterReadings=useCallback(async () => { const data = await apiGetMeterReadings();dispatch({ type: "SET_ALL_DATA", payload: { meterReadings: data }}); }, []);

  // on mount: if token exists, load user ONLY (lazy load modules when entered)
  useEffect(() => {
    if (!getToken()) return;
    setLoading(true);
    apiGetMe()
      .then((me) => {
        dispatch({ type: "SET_CURRENT_USER", payload: me as User });
      })
      .catch(() => { clearToken(); })
      .finally(() => setLoading(false));
  }, []);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      setToken(res.token);
      const me = await apiGetMe();
      dispatch({ type: "SET_CURRENT_USER", payload: me as User });
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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

  const deleteInventoryItem = useCallback(async (id: string) => {
    await apiDeleteInventoryItem(id);
    dispatch({ type: "DELETE_INVENTORY", payload: id });
  }, []);

  const restockInventoryItem = useCallback(async (id: string, qty: number) => {
    const item = await apiRestockItem(id, qty) as InventoryItem;
    dispatch({ type: "UPDATE_INVENTORY", payload: item });
  }, []);

  // ── Module-specific helpers ───────────────────────────────────────────────
  const submitChecklist = useCallback(async (body: Partial<ChecklistSubmission>) => {
    const sub = await apiSubmitChecklist(body) as ChecklistSubmission;
    dispatch({ type: "ADD_CHECKLIST", payload: sub });
  }, []);

  const submitMeterReading = useCallback(async (body: Partial<MeterReading>) => {
    const reading = await apiSubmitMeterReading(body) as MeterReading;
    dispatch({ type: "ADD_METER_READING", payload: reading });
  }, []);

  const addAMC = useCallback(async (body: Partial<AMCContract>) => {
    const amc = await apiCreateAMC(body) as AMCContract;
    dispatch({ type: "ADD_AMC", payload: amc });
  }, []);

  const updateAMC = useCallback(async (id: string, body: Partial<AMCContract>) => {
    const amc = await apiUpdateAMC(id, body) as AMCContract;
    dispatch({ type: "UPDATE_AMC", payload: amc });
  }, []);

  const addDocument = useCallback(async (body: Partial<FMDocument>) => {
    const doc = await apiCreateDocument(body) as FMDocument;
    dispatch({ type: "ADD_DOCUMENT", payload: doc });
  }, []);

  const updateDocument = useCallback(async (id: string, body: Partial<FMDocument>) => {
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
      addInventoryItem, updateInventoryItem, deleteInventoryItem, restockInventoryItem,
      submitChecklist, submitMeterReading,
      addAMC, updateAMC,
      addDocument, updateDocument,
      activePage, navigateTo,
      refreshAll,
      fetchAssets, fetchWorkOrders, fetchVendors, fetchIncidents, fetchInventory,
      fetchSpaces, fetchMaintenance, fetchAMC, fetchDocuments, fetchChecklists, fetchMeterReadings,
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
