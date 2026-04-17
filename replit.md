# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL (local) + Drizzle ORM + Supabase (cloud, for auth & profile lookups)
- **Auth**: Supabase Auth (email/password) with role-based access control
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + Cairo font (RTL Arabic)

## Applications

### نظام إدارة المراسلات الداخلية (Internal Correspondence Management System)
- **Artifact**: `artifacts/correspondence`
- **Preview path**: `/`
- **Description**: Arabic RTL enterprise dashboard for Delta Higher Institute to track documents from creation to archiving
- **Roles**: Admin, Supervisor, Employee
- **Pages**: Login, Dashboard, Inbox, Add Correspondence, Archive, Reports, Departments, Employees, Correspondence Detail
- **Auth flow**: Supabase Auth → fetch employee profile by email → RBAC on frontend

## Auth System

### Supabase Project
- **Project ref**: `znlhhnrkricpywowqwtu`
- **Tables on Supabase**: departments, employees, correspondences, correspondence_history, archive
- **RLS**: Enabled with "allow authenticated" policies on all tables

### Test Accounts
| Email | Password | Role |
|-------|----------|------|
| admin@delta.edu.eg | DeltaAdmin@2026 | مدير (Admin) |
| supervisor@delta.edu.eg | DeltaSuper@2026 | مشرف (Supervisor) |
| employee@delta.edu.eg | DeltaEmp@2026 | موظف (Employee) |

### RBAC - Page Access by Role
| Page | Admin | Supervisor | Employee |
|------|-------|-----------|---------|
| Dashboard (/) | ✓ | ✓ | ✓ |
| Inbox (/inbox) | ✓ | ✓ | ✓ |
| Add (/add) | ✓ | ✓ | ✓ |
| Archive (/archive) | ✓ | ✓ | — |
| Reports (/reports) | ✓ | ✓ | — |
| Departments (/departments) | ✓ | — | — |
| Employees (/employees) | ✓ | — | — |

### Key Files
- `artifacts/correspondence/src/lib/supabase.ts` — Supabase client
- `artifacts/correspondence/src/contexts/AuthContext.tsx` — Auth state, role fetch, signIn/signOut
- `artifacts/correspondence/src/pages/Login.tsx` — Arabic login page
- `artifacts/correspondence/src/components/ProtectedRoute.tsx` — Route guard with role check
- `artifacts/correspondence/src/App.tsx` — Router with public/protected route split

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

Tables in local PostgreSQL (Express API):
- `departments` — Institute departments
- `employees` — Staff members with roles (admin/supervisor/employee)
- `correspondences` — All correspondence items with status tracking
- `correspondence_history` — Audit trail for each correspondence
- `archive` — Archived correspondence records

Same schema also deployed to Supabase cloud DB (used for auth profile lookups via Supabase client).

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
