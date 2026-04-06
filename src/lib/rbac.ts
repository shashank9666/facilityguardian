// ─── Frontend RBAC ────────────────────────────────────────────────────────────
// Mirrors the server-side role hierarchy so the UI hides actions the user
// cannot perform. The API still enforces permissions server-side.

import { useApp } from "@/context/AppContext";
import type { Role } from "@/types";

const HIERARCHY: Record<Role, number> = {
  admin:      4,
  manager:    3,
  technician: 2,
  viewer:     1,
};

function level(role: Role): number { return HIERARCHY[role] ?? 0; }

export function useRole() {
  const { state } = useApp();
  const role = (state.currentUser.role ?? "viewer") as Role;
  const lvl  = level(role);

  return {
    role,
    isAdmin:      lvl >= HIERARCHY.admin,
    isManager:    lvl >= HIERARCHY.manager,
    isTechnician: lvl >= HIERARCHY.technician,
    isViewer:     lvl >= HIERARCHY.viewer,

    // Specific permission checks
    canCreate:      lvl >= HIERARCHY.technician,   // tech+
    canDeleteAsset: lvl >= HIERARCHY.manager,       // manager+
    canDeleteWO:    lvl >= HIERARCHY.manager,
    canDeleteInc:   lvl >= HIERARCHY.admin,
    canDeleteInv:   lvl >= HIERARCHY.manager,
    canManageVendors: lvl >= HIERARCHY.manager,
    canManageSpaces:  lvl >= HIERARCHY.manager,
    canManageUsers:   lvl >= HIERARCHY.admin,
  };
}
