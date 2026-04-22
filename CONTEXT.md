# CONTEXT.md — نظام إدارة المراسلات الداخلية

## Project Description

Internal Correspondence Management System (نظام إدارة المراسلات الداخلية) for Delta Higher Institute (معهد دلتا العالي). A fully Arabic, RTL enterprise web application for managing incoming/outgoing institutional correspondence, built as a graduation project.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + TypeScript |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 4 + tw-animate-css |
| UI Components | Radix UI primitives + shadcn/ui pattern |
| Routing | Wouter |
| Data Fetching | TanStack React Query 5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Backend Framework | Express 5 (Node.js) |
| ORM | Drizzle ORM |
| Database / Auth / Storage | Supabase (PostgreSQL + Auth + Storage) |
| PDF Export | html2canvas + jsPDF |
| Excel Export | xlsx |
| Animations | Framer Motion |
| Package Manager | pnpm (workspace monorepo) |
| Runtime | Node.js 24 |
| Hosting | Replit (Autoscale deployment) |

---

## Monorepo Structure

```
nabil/
├── artifacts/
│   ├── correspondence/        # Frontend SPA (React + Vite)
│   │   ├── src/
│   │   │   ├── components/    # Layout + shadcn/ui components
│   │   │   ├── contexts/      # AuthContext (Supabase Auth)
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   └── pages/         # Route-level page components
│   │   ├── public/            # Static assets
│   │   └── vite.config.ts     # Vite config (port 5177, base path support)
│   └── api-server/            # Express REST API
│       └── src/
│           ├── routes/        # correspondences, departments, employees, archive, dashboard
│           └── lib/           # Logger (pino)
├── lib/
│   ├── db/                    # Drizzle ORM schema + config
│   │   └── src/schema/        # correspondences, departments, employees, archive, history
│   ├── api-zod/               # Zod schemas generated from OpenAPI spec
│   ├── api-spec/              # OpenAPI YAML spec + Orval config (code generation)
│   └── api-client-react/      # Generated React Query hooks for frontend consumption
├── package.json               # Root workspace (typecheck + build scripts)
├── pnpm-workspace.yaml        # Workspace + dependency catalog
└── SUMMARY.md                 # Arabic changelog / bug fix log
```

---

## Architectural & Design Guidelines

- **RTL-first**: All UI is Arabic, `dir="rtl"` enforced globally. Layout mirrors are handled via Tailwind RTL utilities.
- **Enterprise color palette**: Blue/indigo primary tones, neutral grays, red for destructive actions.
- **Font**: Cairo (Arabic-optimized Google Font) — must be loaded via CSS `@import` or `<link>`.
- **Auth**: Supabase Auth (email/password). Session managed via `AuthContext`. `ProtectedRoute` guards all app routes.
- **RBAC**: Three roles — `مدير` (admin), `مشرف` (supervisor), `موظف` (employee). Navigation and route access filtered per role.
- **PDF Export strategy**: Use `html2canvas` to snapshot the DOM element as an image, then embed in jsPDF — this preserves Arabic RTL rendering without encoding issues.
- **Excel Export**: Use the `xlsx` library to generate `.xlsx` files client-side.
- **File Attachments**: Uploaded to Supabase Storage bucket `attachments` with RLS policies for authenticated users.
- **API layer**: Frontend consumes the Express API via generated React Query hooks (`lib/api-client-react`). Supabase is also accessed directly from the frontend for auth and storage.
- **Code generation**: `lib/api-spec/openapi.yaml` → Orval → `lib/api-zod` + `lib/api-client-react` (run manually after schema changes).
- **Ports**: Frontend `5177`, API server `8080` (Replit maps 8081→80, 8082→3001).
