# 🎨 FM-Nexus Developer Guide: Frontend

## 🚀 Module Overview
FM-Nexus frontend is a single-page application (SPA) architecture leveraging Next.js App Router for server-side initialization and Client-side navigation.

### Integrated Modules
1. **Asset Life-cycle**: Grid/Table view, maintenance tracking, serial number mapping.
2. **Work Order Engine**: Automated numbering, status flows (Open -> Assigned -> Done), and KanBan support.
3. **Smart Inventory**: Real-time stock counts, alerts for low/out-of-stock, and cost tracking.
4. **Maintenance Planner**: Recurring schedule engine (Daily to Annual) with auto-resetting checklists.
5. **Incidents Center**: Severity-based reporting with real-time notifications to Managers/Admins.
6. **Alert Center**: Unified Personal history for role-based notifications.

## 🧠 State & Data Flow
- **Context Provider**: `AppContext.tsx` acts as the single source of truth.
- **Data Normalization**: IDs are strictly handled as `string` namespaced under `id` (automatically mapped from `_id`).
- **Permission Guard**: `lib/rbac.ts` provides the `useRole()` hook which determines UI element visibility.

## 🎨 UI & UX Standards
- **Icons**: [Lucide React](https://lucide.dev/icons)
- **Colors**:
  - `Primaries`: Indigo-600, Blue-500
  - `Status`: Green-500 (Success), Amber-500 (Warning), Red-500 (Error/Critical)
- **Consistency**: All forms must use the `*` marker for mandatory fields and validate using `lib/form.ts` before API dispatch.

## 🛠 Adding a Feature (Quick Guide)
1. **Define Types**: Update `src/types/index.ts`.
2. **Implement Logic**: Create a new service folder in `src/app/`.
3. **Register Route**: Add the page identifier to `FMNexusApp` in `src/app/page.tsx`.
4. **Link Sidebar**: Update the `NavItems` list in `src/components/layout/Sidebar.tsx`.

---
*Happy Coding! 🚀*
