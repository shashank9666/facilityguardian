// ─── FMNexus API Gateway (Feature-Modularized) ──────────────────────────────────
// This file re-exports all API functions from their new feature locations in src/app.
// This preserves backward compatibility for global imports from '@/lib/api'.

export * from "./api/client";
export * from "../app/auth/api";
export * from "../app/assets/api";
export * from "../app/work-orders/api";
export * from "../app/vendors/api";
export * from "../app/incidents/api";
export * from "../app/inventory/api";
export * from "../app/spaces/api";
export * from "../app/maintenance/api";
export * from "../app/amc/api";
export * from "../app/documents/api";
export * from "../app/checklists/api";
export * from "../app/meter-readings/api";
export * from "../app/reports/api";
export * from "../app/settings/api";
export * from "../app/tasks/api";
export * from "../app/dashboard/api";
