// ─── Domain Types ─────────────────────────────────────────────────────────────
// All enums use string literal unions for type-safety without enum overhead.

export type Role = "admin" | "manager" | "technician" | "viewer";
export type AssetStatus = "operational" | "maintenance" | "faulty" | "decommissioned";
export type AssetCategory = "HVAC" | "Electrical" | "Plumbing" | "Elevator" | "Fire Safety" | "IT" | "Furniture" | "Vehicle" | "Other";
export type Priority = "critical" | "high" | "medium" | "low";
export type WOStatus = "open" | "assigned" | "in_progress" | "on_hold" | "completed" | "cancelled";
export type WOType = "corrective" | "preventive" | "inspection" | "emergency";
export type PMFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "semi-annual" | "annual";
export type PMStatus = "active" | "paused" | "overdue";
export type SpaceStatus = "available" | "occupied" | "maintenance" | "reserved";
export type ServiceRequestStatus = "reported" | "investigating" | "resolved" | "closed";
export type ServiceRequestSeverity = "low" | "medium" | "high" | "critical";
export type VendorStatus = "active" | "inactive" | "blacklisted";
export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

// ─── Entity Types ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  avatar?: string;
  active: boolean;
  notificationPreferences: {
    workOrderAssigned: boolean;
    pmScheduleDue: boolean;
    serviceRequestReported: boolean;
    lowStockAlert: boolean;
    assetStatusChange: boolean;
    vendorContractExpiry: boolean;
    workOrderOverdue: boolean;
    dailySummary: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  location: string;
  floor: string;
  building: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  purchaseDate: string;
  warrantyExpiry: string;
  lastMaintenance: string;
  nextMaintenance: string;
  value: number;
  assignedTo?: string;
  department: string;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}


export interface WorkOrder {
  id: string;
  woNumber: string;
  title: string;
  description: string;
  type: WOType;
  status: WOStatus;
  priority: Priority;
  assetId?: string;
  assetName?: string;
  location: string;
  assignedTo?: string;
  assignedTeam?: string;
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  startedAt?: string;
  completedAt?: string;
  estimatedHours: number;
  actualHours?: number;
  cost?: number;
  notes: string;
  attachments: string[];
  auditLog: AuditEntry[];
}

export interface PreventiveMaintenance {
  id: string;
  title: string;
  assetId: string;
  assetName: string;
  frequency: PMFrequency;
  lastCompleted?: string;
  nextDue: string;
  assignedTo: string;
  estimatedMinutes: number;
  checklist: ChecklistItem[];
  status: PMStatus;
  createdAt: string;
  updatedAt: string;
}


export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  notes?: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  status: VendorStatus;
  rating: number; // 1-5
  contractStart: string;
  contractEnd: string;
  slaHours: number;
  totalOrders: number;
  completedOnTime: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}


export interface Space {
  id: string;
  name: string;
  type: string;
  site: string;
  floor: string;
  building: string;
  capacity: number;
  occupied: number;
  status: SpaceStatus;
  assignedTo?: string;
  lastInspection: string;
  area: number; // sq ft
  createdAt: string;
  updatedAt: string;
}


export interface ServiceRequest {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  severity: ServiceRequestSeverity;
  status: ServiceRequestStatus;
  location: string;
  reportedBy: string;
  reportedAt: string;
  assignedTo?: string;
  resolvedAt?: string;
  assetId?: string;
  assetName?: string;
  category: string;
  timeline: AuditEntry[];
  createdAt: string;
  updatedAt: string;
}


export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  status: InventoryStatus;
  location: string;
  supplierId?: string;
  supplierName?: string;
  unitCost: number;
  lastRestocked: string;
  createdAt: string;
  updatedAt: string;
}


export interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  notes?: string;
}

// ─── UI / State Types ──────────────────────────────────────────────────────────

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

export interface AppState {
  currentUser: User;
  assets: Asset[];
  workOrders: WorkOrder[];
  preventiveMaintenance: PreventiveMaintenance[];
  vendors: Vendor[];
  spaces: Space[];
  serviceRequests: ServiceRequest[];
  inventory: InventoryItem[];
  users: User[];
  toasts: Toast[];
  checklistSubmissions: ChecklistSubmission[];
  meterReadings: MeterReading[];
  amcContracts: AMCContract[];
  documents: FMDocument[];
  technicians: User[];
  notifications: FmNotification[];
}

// ─── Checklist Types ───────────────────────────────────────────────────────────

export type ChecklistCategory = "MEP" | "Fire Safety" | "Housekeeping";

export interface ChecklistField {
  id: string;
  label: string;
  type: "text" | "number" | "options";
  value?: string;
  required?: boolean;
  unit?: string;
  options?: string[];
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  category: ChecklistCategory;
  fields: ChecklistField[];
  frequency: "daily" | "weekly" | "monthly";
  estimatedMinutes: number;
}

export interface ChecklistSubmission {
  id: string;
  templateId: string;
  templateName: string;
  category: ChecklistCategory;
  submittedBy: string;
  submittedAt: string;
  fields: ChecklistField[];
  notes: string;
  issueCount: number;
}

// ─── Meter Reading Types ───────────────────────────────────────────────────────

export type MeterType = "Electricity-HT" | "Electricity-LT" | "Water-Main" | "Water-Garden" | "DG-Runtime" | "STP-Flow" | "Other";

export interface MeterReading {
  id: string;
  meterType: MeterType;
  meterName: string;
  location: string;
  unit: string;
  previousReading: number;
  currentReading: number;
  consumption: number;
  readingDate: string;
  submittedBy: string;
  notes: string;
}

// ─── AMC Types ─────────────────────────────────────────────────────────────────

export type AMCStatus = "active" | "expiring_soon" | "expired" | "under_renewal";

export interface AMCContract {
  id: string;
  contractNumber: string;
  title: string;
  vendorName: string;
  category: string;
  scope: string;
  startDate: string;
  endDate: string;
  value: number;
  status: AMCStatus;
  renewalAlertDays: number;
  contactPerson: string;
  contactPhone: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}


// ─── Document Types ────────────────────────────────────────────────────────────

export type DocCategory = "SOP" | "Certificate" | "Permit" | "Policy" | "Manual";
export type DocStatus = "active" | "expired" | "under_review" | "archived";

export interface FMDocument {
  id: string;
  docNumber: string;
  title: string;
  category: DocCategory;
  version: string;
  status: DocStatus;
  expiryDate: string;
  uploadedBy: string;
  uploadedAt: string;
  tags: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface FmNotification {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export type NavPage =
  | "dashboard" | "assets" | "work-orders" | "maintenance" | "vendors"
  | "spaces" | "service-requests" | "inventory" | "reports" | "settings"
  | "my-tasks" | "checklists" | "meter-readings" | "amc" | "documents" | "notifications";
