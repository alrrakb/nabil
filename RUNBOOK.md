# RUNBOOK.md — Operations Guide

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 24.x |
| pnpm | 9.x (`npm install -g pnpm`) |
| Git | any recent |
| Supabase account | cloud or local CLI |

---

## Installation

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd nabil

# 2. Install all workspace dependencies
pnpm install
```

---

## Environment Variables

Create `artifacts/correspondence/.env.local`:

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

Create `artifacts/api-server/.env` (if running API server locally):

```env
DATABASE_URL=postgresql://postgres:<password>@db.<project-id>.supabase.co:5432/postgres
NODE_ENV=development
PORT=8080
```

> Get `SUPABASE_URL` and `ANON_KEY` from: Supabase Dashboard → Project Settings → API.

---

## Development

### Frontend only (fastest)
```bash
cd artifacts/correspondence
pnpm dev
# Opens at http://localhost:5177
```

### API server only
```bash
cd artifacts/api-server
pnpm dev
# Runs at http://localhost:8080
```

### Both (from workspace root)
```bash
pnpm -r --parallel run dev
```

---

## Production Build

```bash
# From workspace root — typechecks all packages then builds all artifacts
pnpm run build
```

Frontend output: `artifacts/correspondence/dist/public/`
API server output: `artifacts/api-server/dist/index.mjs`

---

## Database / Supabase Management

### Push schema changes
```bash
cd lib/db
npx drizzle-kit push
```

### Generate migrations
```bash
cd lib/db
npx drizzle-kit generate
```

### Drizzle config
See `lib/db/drizzle.config.ts` — reads `DATABASE_URL` from env.

### Supabase Storage Setup
Ensure the `attachments` bucket exists with these RLS policies on `storage.objects`:

```sql
-- Allow authenticated users full access to attachments bucket
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Authenticated users can view attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'attachments');

CREATE POLICY "Authenticated users can update attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'attachments');

CREATE POLICY "Authenticated users can delete attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'attachments');
```

### API Client Code Generation (after OpenAPI spec changes)
```bash
cd lib/api-spec
npx orval
# Regenerates: lib/api-zod/src/generated/ and lib/api-client-react/src/generated/
```

---

## Typecheck

```bash
# Root (all packages)
pnpm run typecheck

# Frontend only
cd artifacts/correspondence && pnpm run typecheck

# API server only
cd artifacts/api-server && pnpm run typecheck
```

---

## Common Troubleshooting

| Problem | Fix |
|---|---|
| `pnpm install` fails with release age error | Package published < 24h ago. Add to `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`, reinstall, then remove the exclusion. |
| Vite starts on wrong port | Set `PORT` env var or check `vite.config.ts` default (5177). |
| Supabase storage upload 400 RLS error | Verify `attachments` bucket exists and RLS policies are applied (see above). |
| Arabic text garbled in PDF | Never use jsPDF text API for Arabic. Always use `html2canvas` DOM snapshot approach. |
| `id = -1` in correspondence detail | Ensure the link uses `item.id` (not index), and `CorrespondenceDetail` reads `useParams()` from wouter with `enabled: !!id` guard on the query. |
| Replit-specific plugins crash locally | Safe — vite.config.ts guards them behind `process.env.REPL_ID !== undefined`. |
| Chart labels overlap in Reports | Do not use `label`/`labelLine` on `<Pie>`. Use `<Legend>` only with `cy="42%"` offset. |
