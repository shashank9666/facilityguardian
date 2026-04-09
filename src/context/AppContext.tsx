"use client";

// ─── Global App State ──────────────────────────────────────────────────────────
// React Context + useReducer for global state.
// Auth is JWT-based; data is fetched from the Express/MongoDB API on login.

import React, {
  createContext, useContext, useReducer, useCallback,
  useEffect, useState, type ReactNode,
} from "react";
import type {
  AppState, Toast, Asset, WorkOrder, InventoryItem, ServiceRequest, Vendor, Space, User,
  ChecklistSubmission, MeterReading, AMCContract, FMDocument, NavPage, PreventiveMaintenance, FmNotification,
} from "@/types";
import { uid } from "@/lib/utils";
import {
  getToken, setToken, clearToken,
  apiLogin, apiGetMe, apiGetUsers, apiGetTechnicians,
  apiGetAssets, apiCreateAsset, apiUpdateAsset, apiDeleteAsset,
  apiGetWorkOrders, apiCreateWorkOrder, apiUpdateWorkOrder, apiDeleteWorkOrder,
  apiGetServiceRequests, apiCreateServiceRequest, apiUpdateServiceRequest,
  apiGetInventory, apiCreateInventoryItem, apiUpdateInventoryItem, apiDeleteInventoryItem, apiRestockItem,
  apiGetVendors, apiCreateVendor, apiUpdateVendor,
  apiGetSpaces, apiCreateSpace, apiUpdateSpace, apiDeleteSpace,
  apiGetMaintenance, apiCreateMaintenance, apiUpdateMaintenance, apiDeleteMaintenance,
  apiGetAMC, apiCreateAMC, apiUpdateAMC, apiDeleteAMC,
  apiGetDocuments, apiCreateDocument, apiUpdateDocument, apiDeleteDocument,
  apiGetChecklists, apiSubmitChecklist,
  apiGetMeterReadings, apiSubmitMeterReading, apiUpdateMeterReading, apiDeleteMeterReading,
  apiGetNotifications, apiMarkNotificationRead, apiMarkAllNotificationsRead,
} from "@/lib/api";

// ─── Blank initial state (filled from API after login) ────────────────────────
const BLANK_USER: User = {
  id: "", name: "", email: "", role: "viewer",
  department: "", active: true,
  notificationPreferences: {
    workOrderAssigned: true,
    pmScheduleDue: true,
    serviceRequestReported: true,
    lowStockAlert: true,
    assetStatusChange: false,
    vendorContractExpiry: true,
    workOrderOverdue: true,
    dailySummary: false,
  },
  createdAt: "", updatedAt: "",
};

const BLANK_STATE: AppState = {
  currentUser: BLANK_USER,
  assets: [], workOrders: [], preventiveMaintenance: [],
  vendors: [], spaces: [],  serviceRequests: [], inventory: [], toasts: [],
  users: [],
  checklistSubmissions: [],
  meterReadings: [],
  amcContracts: [],
  documents: [],
  technicians: [],
  notifications: [],
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
  | { type: "ADD_SERVICE_REQUEST";    payload: ServiceRequest }
  | { type: "UPDATE_SERVICE_REQUEST"; payload: ServiceRequest }
  | { type: "UPDATE_INVENTORY";       payload: InventoryItem }
  | { type: "ADD_INVENTORY";          payload: InventoryItem }
  | { type: "DELETE_INVENTORY";       payload: string }
  | { type: "ADD_VENDOR";             payload: Vendor }
  | { type: "UPDATE_VENDOR";          payload: Vendor }
  | { type: "ADD_SPACE";              payload: Space }
  | { type: "UPDATE_SPACE";           payload: Space }
  | { type: "DELETE_SPACE";           payload: string }
  | { type: "ADD_CHECKLIST";          payload: ChecklistSubmission }
  | { type: "ADD_METER_READING";      payload: MeterReading }
  | { type: "UPDATE_METER_READING";   payload: MeterReading }
  | { type: "DELETE_METER_READING";   payload: string }
  | { type: "ADD_AMC";                payload: AMCContract }
  | { type: "UPDATE_AMC";             payload: AMCContract }
  | { type: "ADD_DOCUMENT";           payload: FMDocument }
  | { type: "UPDATE_DOCUMENT";        payload: FMDocument }
  | { type: "DELETE_DOCUMENT";        payload: string }
  | { type: "DELETE_AMC";             payload: string }
  | { type: "SET_USERS";               payload: User[] }
  | { type: "SET_TECHNICIANS";         payload: User[] }
  | { type: "ADD_USER";                payload: User }
  | { type: "UPDATE_USER";             payload: User }
  | { type: "DELETE_USER";             payload: string }
  | { type: "ADD_PM";                   payload: PreventiveMaintenance }
  | { type: "UPDATE_PM";                payload: PreventiveMaintenance }
  | { type: "DELETE_PM";                payload: string }
  | { type: "SET_NOTIFICATIONS";        payload: FmNotification[] }
  | { type: "UPDATE_NOTIFICATION";     payload: FmNotification }
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
    case "ADD_SERVICE_REQUEST":
      return { ...state, serviceRequests: [action.payload, ...state.serviceRequests] };
    case "UPDATE_SERVICE_REQUEST":
      return { ...state, serviceRequests: state.serviceRequests.map(i => i.id === action.payload.id ? action.payload : i) };
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
    case "ADD_SPACE":
      return { ...state, spaces: [action.payload, ...state.spaces] };
    case "UPDATE_SPACE":
      return { ...state, spaces: state.spaces.map(s => s.id === action.payload.id ? action.payload : s) };
    case "DELETE_SPACE":
      return { ...state, spaces: state.spaces.filter(s => s.id !== action.payload) };
    case "ADD_CHECKLIST":
      return { ...state, checklistSubmissions: [action.payload, ...state.checklistSubmissions] };
    case "ADD_METER_READING":
      return { ...state, meterReadings: [action.payload, ...state.meterReadings] };
    case "UPDATE_METER_READING":
      return { ...state, meterReadings: state.meterReadings.map(m => m.id === action.payload.id ? action.payload : m) };
    case "DELETE_METER_READING":
      return { ...state, meterReadings: state.meterReadings.filter(m => m.id !== action.payload) };
    case "ADD_PM":
      return { ...state, preventiveMaintenance: [action.payload, ...state.preventiveMaintenance] };
    case "UPDATE_PM":
      return { ...state, preventiveMaintenance: state.preventiveMaintenance.map(p => p.id === action.payload.id ? action.payload : p) };
    case "DELETE_PM":
      return { ...state, preventiveMaintenance: state.preventiveMaintenance.filter(p => p.id !== action.payload) };
    case "SET_NOTIFICATIONS":
      return { ...state, notifications: action.payload };
    case "UPDATE_NOTIFICATION":
      return { ...state, notifications: state.notifications.map(n => n.id === action.payload.id ? action.payload : n) };
    case "ADD_AMC":
      return { ...state, amcContracts: [action.payload, ...state.amcContracts] };
    case "UPDATE_AMC":
      return { ...state, amcContracts: state.amcContracts.map(a => a.id === action.payload.id ? action.payload : a) };
    case "ADD_DOCUMENT":
      return { ...state, documents: [action.payload, ...state.documents] };
    case "UPDATE_DOCUMENT":
      return { ...state, documents: state.documents.map(d => d.id === action.payload.id ? action.payload : d) };
    case "DELETE_DOCUMENT":
      return { ...state, documents: state.documents.filter(d => d.id !== action.payload) };
    case "DELETE_AMC":
      return { ...state, amcContracts: state.amcContracts.filter(a => a.id !== action.payload) };
    case "TOAST_ADD":
      return { ...state, toasts: [...state.toasts, { id: uid(), ...action.payload }] };
    case "TOAST_REMOVE":
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case "SET_USERS":
      return { ...state, users: action.payload };
    case "SET_TECHNICIANS":
      return { ...state, technicians: action.payload };
    case "ADD_USER":
      return { ...state, users: [action.payload, ...state.users] };
    case "UPDATE_USER":
      return { ...state, users: state.users.map(u => u.id === action.payload.id ? action.payload : u) };
    case "DELETE_USER":
      return { ...state, users: state.users.filter(u => u.id !== action.payload) };
    default:
      return state;
  }
}

// ─── Context shape ─────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
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
  addSpace:    (body: Record<string, unknown>) => Promise<void>;
  updateSpace: (id: string, body: Record<string, unknown>) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;
  addServiceRequest:    (body: Record<string, unknown>) => Promise<void>;
  updateServiceRequest: (id: string, body: Record<string, unknown>) => Promise<void>;
  addMaintenance:    (body: any) => Promise<void>;
  updateMaintenance: (id: string, body: any) => Promise<void>;
  deleteMaintenance: (id: string) => Promise<void>;
  addInventoryItem:    (body: Record<string, unknown>) => Promise<void>;
  updateInventoryItem: (id: string, body: Record<string, unknown>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  restockInventoryItem:(id: string, qty: number) => Promise<void>;
  // Module-specific helpers
  submitChecklist:   (body: Partial<ChecklistSubmission>) => Promise<void>;
  submitMeterReading:(body: Partial<MeterReading>) => Promise<void>;
  updateMeterReading:(id: string, body: Partial<MeterReading>) => Promise<void>;
  deleteMeterReading:(id: string) => Promise<void>;
  addAMC:    (body: Partial<AMCContract>) => Promise<void>;
  updateAMC: (id: string, body: Partial<AMCContract>) => Promise<void>;
  deleteAMC: (id: string) => Promise<void>;
  addDocument:    (body: Partial<FMDocument>) => Promise<void>;
  updateDocument: (id: string, body: Partial<FMDocument>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  activePage: NavPage;
  navigateTo: (page: NavPage) => void;
  refreshAll: () => Promise<void>;
  fetchAssets: (p?: any) => Promise<void>;
  fetchWorkOrders: (p?: any) => Promise<void>;
  fetchVendors: (p?: any) => Promise<void>;
  fetchServiceRequests: (p?: any) => Promise<void>;
  fetchInventory: (p?: any) => Promise<void>;
  fetchSpaces: (p?: any) => Promise<void>;
  fetchMaintenance: (p?: any) => Promise<void>;
  fetchAMC: (p?: any) => Promise<void>;
  fetchDocuments: (p?: any) => Promise<void>;
  fetchChecklists: (p?: any) => Promise<void>;
  fetchMeterReadings: (p?: any) => Promise<void>;
  fetchUsers: (p?: any) => Promise<void>;
  fetchTechnicians: (p?: any) => Promise<void>;
  addUser: (body: any) => Promise<void>;
  updateUser: (id: string, body: any) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateMe: (body: any) => Promise<void>;
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

  // Robust activePage initialization with SSR safety
  const [activePage, setActivePage] = useState<NavPage>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const m = params.get("m") as NavPage;
      if (m) return m;

      const saved = localStorage.getItem("fm_active_page") as NavPage;
      if (saved) return saved;
    }
    return "dashboard";
  });

  const navigateTo = useCallback((p: NavPage) => {
    setActivePage(p);
    localStorage.setItem("fm_active_page", p);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("m", p);
      window.history.pushState({}, "", url.toString());
    }
  }, []);

  // Ensure activePage stay sync'd on client switch/hydrate
  useEffect(() => {
    const saved = localStorage.getItem("fm_active_page") as NavPage;
    if (saved && saved !== activePage) {
      setActivePage(saved);
    }
  }, []); // Only once on mount

  const refreshAll = useCallback(async () => {
    const isInitial = !state.currentUser.id;
    if (isInitial) setLoading(true);

    try {
      const safeFetch = async <T,>(fn: () => Promise<T>, defaultValue: T): Promise<T> => {
        try { return await fn(); } catch (err) {
          console.error(`Fetch failed:`, err);
          return defaultValue;
        }
      };

      const [
        assets, workOrders, vendors, serviceRequests, inventory, spaces, 
        pm, amc, docs, check, meter, users, techs
      ] = await Promise.all([
        safeFetch(apiGetAssets, []),
        safeFetch(apiGetWorkOrders, []),
        safeFetch(apiGetVendors, []),
        safeFetch(apiGetServiceRequests, []),
        safeFetch(apiGetInventory, []),
        safeFetch(apiGetSpaces, []),
        safeFetch(apiGetMaintenance, []),
        safeFetch(apiGetAMC, []),
        safeFetch(apiGetDocuments, []),
        safeFetch(apiGetChecklists, []),
        safeFetch(apiGetMeterReadings, []),
        safeFetch(apiGetUsers, []),
        safeFetch(apiGetTechnicians, [])
      ]);

      dispatch({ type: "SET_ALL_DATA", payload: {
        assets, workOrders, vendors, serviceRequests, inventory, spaces,
        preventiveMaintenance: pm, amcContracts: amc, documents: docs,
        checklistSubmissions: check, meterReadings: meter,
        users: users as User[], technicians: techs as User[]
      } });

    } catch (err) {
      toast("An unexpected error occurred while loading data", "error");
    } finally {
      setLoading(false);
    }
  }, [toast, state.currentUser.id]);

  // Individual fetchers
  const fetchAssets      = useCallback(async (p?: any) => { const data = await apiGetAssets(p);      dispatch({ type: "SET_ALL_DATA", payload: { assets: data }}); }, []);
  const fetchWorkOrders  = useCallback(async (p?: any) => { const data = await apiGetWorkOrders(p);  dispatch({ type: "SET_ALL_DATA", payload: { workOrders: data }}); }, []);
  const fetchVendors     = useCallback(async (p?: any) => { const data = await apiGetVendors(p);     dispatch({ type: "SET_ALL_DATA", payload: { vendors: data }}); }, []);
  const fetchServiceRequests = useCallback(async (p?: any) => { const data = await apiGetServiceRequests(p); dispatch({ type: "SET_ALL_DATA", payload: { serviceRequests: data }}); }, []);
  const fetchInventory   = useCallback(async (p?: any) => { const data = await apiGetInventory(p);   dispatch({ type: "SET_ALL_DATA", payload: { inventory: data }}); }, []);
  const fetchSpaces      = useCallback(async (p?: any) => { const data = await apiGetSpaces(p);      dispatch({ type: "SET_ALL_DATA", payload: { spaces: data }}); }, []);
  const fetchMaintenance = useCallback(async (p?: any) => { const data = await apiGetMaintenance(p); dispatch({ type: "SET_ALL_DATA", payload: { preventiveMaintenance: data }}); }, []);
  const fetchAMC         = useCallback(async (p?: any) => { const data = await apiGetAMC(p);         dispatch({ type: "SET_ALL_DATA", payload: { amcContracts: data }}); }, []);
  const fetchDocuments   = useCallback(async (p?: any) => { const data = await apiGetDocuments(p);   dispatch({ type: "SET_ALL_DATA", payload: { documents: data }}); }, []);
  const fetchChecklists  = useCallback(async (p?: any) => { const data = await apiGetChecklists(p);  dispatch({ type: "SET_ALL_DATA", payload: { checklistSubmissions: data }}); }, []);
  const fetchMeterReadings = useCallback(async (p?: any) => { const data = await apiGetMeterReadings(p); dispatch({ type: "SET_ALL_DATA", payload: { meterReadings: data }}); }, []);
  const fetchUsers = useCallback(async (p?: any) => {
    try {
      const data = await apiGetUsers(p);
      dispatch({ type: "SET_USERS", payload: data as User[] });
    } catch {}
  }, []);

  const fetchTechnicians = useCallback(async () => {
    try {
      const data = await apiGetTechnicians();
      dispatch({ type: "SET_TECHNICIANS", payload: data as User[] });
    } catch {}
  }, []);

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
    // We don't set global loading here to prevent unmounting LoginScreen
    // if it's shown in page.tsx based on the loading state.
    try {
      const res = await apiLogin(email, password);
      setToken(res.token);
      const me = await apiGetMe();
      dispatch({ type: "SET_CURRENT_USER", payload: me as User });
    } catch (err) {
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    dispatch({ type: "SET_ALL_DATA", payload: BLANK_STATE });
  }, []);

  // ── Session Timeout (TC_AUTH_04) ───────────────────────────────────────────
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

    const resetTimer = () => {
      clearTimeout(timeout);
      if (getToken()) {
        timeout = setTimeout(() => {
          logout();
          toast("Session expired due to inactivity", "info");
        }, INACTIVITY_LIMIT);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", resetTimer);
      window.addEventListener("keypress", resetTimer);
      window.addEventListener("click", resetTimer);
      window.addEventListener("scroll", resetTimer);
      resetTimer();
    }

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keypress", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, [logout, toast]);

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

  // ── Space helpers ─────────────────────────────────────────────────────────────
  const addSpace = useCallback(async (body: Record<string, unknown>) => {
    const space = await apiCreateSpace(body) as Space;
    dispatch({ type: "ADD_SPACE", payload: space });
  }, []);

  const updateSpace = useCallback(async (id: string, body: Record<string, unknown>) => {
    const space = await apiUpdateSpace(id, body) as Space;
    dispatch({ type: "UPDATE_SPACE", payload: space });
  }, []);

  const deleteSpace = useCallback(async (id: string) => {
    await apiDeleteSpace(id);
    dispatch({ type: "DELETE_SPACE", payload: id });
  }, []);

  // ── Service Request helpers ──────────────────────────────────────────────────
  const addServiceRequest = useCallback(async (body: Record<string, unknown>) => {
    const sr = await apiCreateServiceRequest(body) as ServiceRequest;
    dispatch({ type: "ADD_SERVICE_REQUEST", payload: sr });
  }, []);

  const updateServiceRequest = useCallback(async (id: string, body: Record<string, unknown>) => {
    const sr = await apiUpdateServiceRequest(id, body) as ServiceRequest;
    dispatch({ type: "UPDATE_SERVICE_REQUEST", payload: sr });
  }, []);

  // ── PM helpers ─────────────────────────────────────────────────────────────
  const addMaintenance = useCallback(async (body: any) => {
    const pm = await apiCreateMaintenance(body) as PreventiveMaintenance;
    dispatch({ type: "ADD_PM", payload: pm });
  }, []);

  const updateMaintenance = useCallback(async (id: string, body: any) => {
    const pm = await apiUpdateMaintenance(id, body) as PreventiveMaintenance;
    dispatch({ type: "UPDATE_PM", payload: pm });
  }, []);

  const deleteMaintenance = useCallback(async (id: string) => {
    await apiDeleteMaintenance(id);
    dispatch({ type: "DELETE_PM", payload: id });
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

  const updateMeterReading = useCallback(async (id: string, body: Partial<MeterReading>) => {
    const reading = await apiUpdateMeterReading(id, body as Record<string, unknown>) as MeterReading;
    dispatch({ type: "UPDATE_METER_READING", payload: reading });
  }, []);

  const deleteMeterReading = useCallback(async (id: string) => {
    await apiDeleteMeterReading(id);
    dispatch({ type: "DELETE_METER_READING", payload: id });
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

  const deleteDocument = useCallback(async (id: string) => {
    await apiDeleteDocument(id);
    dispatch({ type: "DELETE_DOCUMENT", payload: id });
  }, []);

  const deleteAMC = useCallback(async (id: string) => {
    await apiDeleteAMC(id);
    dispatch({ type: "DELETE_AMC", payload: id });
  }, []);

  const fetchNotifications = useCallback(async () => {
    const data = await apiGetNotifications();
    dispatch({ type: "SET_NOTIFICATIONS", payload: data });
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    const data = await apiMarkNotificationRead(id);
    dispatch({ type: "UPDATE_NOTIFICATION", payload: data });
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    await apiMarkAllNotificationsRead();
    const data = await apiGetNotifications();
    dispatch({ type: "SET_NOTIFICATIONS", payload: data });
  }, []);

  const addUser = useCallback(async (body: any) => {
    const { apiRegister } = await import("@/lib/api");
    const res = await apiRegister(body);
    dispatch({ type: "ADD_USER", payload: res.data as User });
    toast("User created successfully", "success");
  }, [toast]);

  const updateUser = useCallback(async (id: string, body: any) => {
    const { apiUpdateUser } = await import("@/lib/api");
    const res = await apiUpdateUser(id, body);
    dispatch({ type: "UPDATE_USER", payload: res as User });
    toast("User updated", "success");
  }, [toast]);

  const deleteUser = useCallback(async (id: string) => {
    const { apiDeleteUser } = await import("@/lib/api");
    await apiDeleteUser(id);
    dispatch({ type: "DELETE_USER", payload: id });
    toast("User removed", "success");
  }, [toast]);

  const updateMe = useCallback(async (body: any) => {
    const { apiUpdateMe } = await import("@/lib/api");
    const res = await apiUpdateMe(body);
    dispatch({ type: "SET_CURRENT_USER", payload: res as User });
    toast("Settings updated", "success");
  }, [toast]);

  return (
    <AppContext.Provider value={{
      state, dispatch, loading, toast,
      login, logout,
      addAsset, updateAsset, deleteAsset,
      addWorkOrder, updateWorkOrder,
      addVendor, updateVendor,
      addSpace, updateSpace, deleteSpace,
      addServiceRequest, updateServiceRequest,
      addMaintenance, updateMaintenance, deleteMaintenance,
      addInventoryItem, updateInventoryItem, deleteInventoryItem, restockInventoryItem,
      submitChecklist, submitMeterReading, updateMeterReading, deleteMeterReading,
      addAMC, updateAMC, deleteAMC,
      addDocument, updateDocument, deleteDocument,
      activePage, navigateTo,
      refreshAll,
      fetchAssets, fetchWorkOrders, fetchVendors, fetchServiceRequests, fetchInventory,
      fetchSpaces, fetchMaintenance, fetchAMC, fetchDocuments, fetchChecklists, fetchMeterReadings,
      fetchNotifications, markNotificationRead, markAllNotificationsRead,
      fetchUsers, fetchTechnicians, addUser, updateUser, deleteUser, updateMe,
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
