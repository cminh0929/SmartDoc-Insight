## Implementation Plan: Multi-Tenant Enterprise Isolation (Doanh Nghiệp / SaaS SaaS Workspace)

This plan outlines the complete implementation of multi-tenancy for the document management platform. Every user, document, folder, audit log, and custom role will belong to a specific **Tenant (Corporate Workspace)**, ensuring absolute logical data isolation between different companies.

### Task Type

- [x] Frontend (→ UI/UX & Responsive Register/Workspace Settings)
- [x] Backend (→ Drizzle ORM Schema migrations, TenantsModule, Security Query Scoping)
- [x] Fullstack (→ End-to-End dynamic workspace invite code registration and management)

---

### Technical Solution

To support clean enterprise multi-tenancy, we will introduce a **Shared-Database, Shared-Schema (Logical Isolation)** architecture. This is highly performant, cost-effective, and fully compatible with our PostgreSQL + Drizzle ORM stack.

#### 1. Database Schema Extensions (`backend/src/db/schema.ts`)
We will create a `tenants` table and add `tenantId` columns to scope all entity datasets:

```typescript
// Tenants Table
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  domain: varchar('domain', { length: 255 }), // e.g. "acme.corp"
  tenantCode: varchar('tenant_code', { length: 10 }).notNull().unique(), // e.g., "ENT98A" for dynamic invite
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Update standard tables:
// 1. users: add tenantId (references tenants.id)
// 2. folders: add tenantId (references tenants.id)
// 3. documents: add tenantId (references tenants.id)
// 4. auditLogs: add tenantId (references tenants.id)
// 5. roles: add tenantId (references tenants.id, nullable - if null, it's a global role like admin/staff/intern)
```

#### 2. Backend Modules & Controllers (`backend/src/modules/tenants/`)
We will build a dedicated `TenantsModule` to manage workspaces:
*   `tenants.service.ts`:
    *   `createTenant(name: string, domain?: string)`: Generates a unique 6-character uppercase alphanumeric code (e.g. `ACME92` or `SDC123`), inserts a tenant row, and returns it.
    *   `findByCode(code: string)`: Searches for a tenant by invite code.
    *   `getEmployees(tenantId: string)`: Returns all users enrolled under this company.
*   `tenants.controller.ts`:
    *   `GET /tenants/my-workspace`: Fetches active tenant name, invite code, and employee roster (authenticated).

#### 3. Authentication & Sign Up Scoping (`backend/src/modules/auth/auth.service.ts`)
We will update the registration endpoint to handle two separate corporate paths:
*   **Path A: Register New Enterprise**
    *   Accepts `companyName` in payload.
    *   Creates a new Tenant row and assigns the generated `tenantId` to the registering user.
    *   Saves user role as `'admin'` (the default workspace founder).
*   **Path B: Join Existing Workspace**
    *   Accepts `companyCode` in payload.
    *   Verifies the workspace exists via invite code. If invalid, throws `BadRequestException("Invalid enterprise invite code")`.
    *   Saves the user under the resolved `tenantId` and the chosen initial role (e.g. `staff`, `intern`).

#### 4. Automatic Tenant Isolation Filters (Query Scoping)
To guarantee strict corporate privacy (Company A cannot view or share with Company B):
*   **Folders / Documents query**:
    *   In `FoldersService.getFoldersTree()` and `DocumentsService`: append `.where(and(..., eq(folders.tenantId, user.tenantId)))`.
*   **Audit logs**:
    *   Log inserts will automatically inject the `user.tenantId` column.
    *   Log queries will be restricted to `eq(auditLogs.tenantId, user.tenantId)`.
*   **Sharing and Permissions**:
    *   Sharing query only searches user list belonging to `eq(users.tenantId, user.tenantId)` to prevent sharing outside the company folder.

#### 5. Frontend UI/UX Premium Experience
*   **Sign-Up Page Layout (`register/page.tsx`)**:
    *   A Segmented Toggle switch (Glassmorphism layout) with micro-animations:
        *   `[ Join Existing Corporate Workspace ]`
        *   `[ Register New Enterprise Workspace ]`
    *   In "Join Workspace", user inputs the **Company Code** (validated inline).
    *   In "Register Enterprise", user inputs **Enterprise Name** (e.g., Acme Corp).
*   **Settings Corporate Dashboard (`settings/page.tsx`)**:
    *   A premium sub-tab **"Enterprise Settings"** (visible only to Workspace Admins/Managers):
        *   Displays Corporate Name, Invited Domain, and the **Workspace Invite Code** with an animated "Copy to Clipboard" utility.
        *   An interactive list of corporate employees, allowing managers to edit user roles or revoke workspace access in real time.

---

### Implementation Steps

#### Phase 1: Database Migration & Schema Extensions
1.  **Drizzle Schema Upgrades**: Add `tenants` table, link `tenantId` (nullable/notNull) in `users`, `folders`, `documents`, `auditLogs`, and `roles` in `backend/src/db/schema.ts`.
2.  **Generate Migration**: Run Drizzle migrations to establish relational constraints and seed default data (assign existing users to a default "Demo Corp" tenant so no data is corrupted!).

#### Phase 2: Backend Tenants module & Registration Logic
3.  **Create TenantsModule**: Implement `TenantsService` and `TenantsController` to manage company profiles and generate secure invite codes.
4.  **Rewrite Auth Registration**: Expand registration endpoint to support `companyName` (workspace creator) and `companyCode` (workspace joiner). Implement transaction safeguards.
5.  **Inject Tenant Scoping in Guards**: Ensure `PermissionsGuard` and `JwtStrategy` capture and inject the `tenantId` in every request context payload.

#### Phase 3: Data Isolation & Scoped Services
6.  **Scope Folders Service**: Append `tenantId` validations on root folder creation, tree building, and children searches.
7.  **Scope Documents Service**: Scope uploads, versions, search engines, and full-text Meilisearch indexing by tenant identifier.
8.  **Scope Audit Logs & Sharing**: Verify audit queries and directory user-sharing listings only fetch elements belonging to the logged-in user's corporate directory.

#### Phase 4: Frontend High-Fidelity UI Design
9.  **Develop Register Tabs**: Update registration page with smooth Tailwind transitions and dual workspace paths.
10. **Build Enterprise Settings Panel**: Build profile dashboards, animated invite code copy utilities, and active roster management inside the Settings Hub.
11. **Refine Sidebar Brand Header**: Display the resolved enterprise name and brief icon in the left-hand navigation panel dynamically.

---

### Key Files

| File | Operation | Description |
| --- | --- | --- |
| `backend/src/db/schema.ts` | Modify | Define `tenants` table and add `tenantId` columns to all related entities. |
| `backend/src/modules/auth/auth.service.ts` | Modify | Extend signup payload to dynamically create a new tenant or validate an existing invite code. |
| `backend/src/modules/folders/folders.service.ts` | Modify | Scope folder creation and hierarchy fetches by user's `tenantId`. |
| `backend/src/modules/documents/documents.service.ts` | Modify | Isolate document uploads, version logs, and searches by workspace. |
| `backend/src/modules/tenants/` | Create | New backend module to manage tenants, dynamic invite codes, and roster lists. |
| `frontend/src/app/register/page.tsx` | Modify | Update signup page with Segmented Workspace Tab selection and inline validate inputs. |
| `frontend/src/app/settings/page.tsx` | Modify | Add "Enterprise Settings" sub-tab to display Workspace invite code and roster directory. |

---

### Risks and Mitigation

| Risk | Mitigation |
| --- | --- |
| **Orphaned / Existing Data Mismatch**: Existing database records lack a `tenantId`, potentially causing Drizzle queries to fail. | Write a custom seeding SQL transaction in the migration phase to auto-group all legacy database records under a baseline "SmartDoc Global" tenant (`tenantId` seeded first) so all data remains fully functional. |
| **Cross-Tenant Data Leakage**: A malicious user might craft requests using a folder ID of a rival company. | The updated `PermissionsGuard` will validate that the targeted resource's `tenantId` matches the requesting user's `tenantId` before checking granular permissions. |
| **Multiple Admins Limit**: A user joining a company via Invite Code might try to choose the 'Admin' role, exceeding corporate limits. | Keep our robust dynamic admin counter active, but scoped *per tenant* (e.g. `count(users) where role = 'admin' and tenantId = targetTenantId < 2`). |

---

### SESSION_ID (for /ccg:execute use)

- CODEX_SESSION: "enterprise_rbac_backend_v1"
- GEMINI_SESSION: "enterprise_rbac_frontend_v1"
