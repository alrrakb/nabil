# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
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
- **Pages**: Dashboard, Inbox, Add Correspondence, Archive, Reports, Departments, Employees, Correspondence Detail

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

Tables in PostgreSQL:
- `departments` — Institute departments
- `employees` — Staff members with roles (admin/supervisor/employee)
- `correspondences` — All correspondence items with status tracking
- `correspondence_history` — Audit trail for each correspondence
- `archive` — Archived correspondence records

## Supabase SQL Schema

A `supabase-schema.sql` file at the project root contains the full schema with RLS policies for use with Supabase if needed.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
