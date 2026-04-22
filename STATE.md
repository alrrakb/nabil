# STATE.md — Project State

## Completed Features

| Feature | Notes |
|---|---|
| Project scaffold | pnpm monorepo on Replit with React + Express + Supabase |
| Initial UI layout | Arabic RTL sidebar, header, app shell |
| Supabase Auth | Email/password login, session persistence via AuthContext |
| RBAC | Role-based nav and route guards (admin / supervisor / employee) |
| Login page | Arabic UI, gradient background, logo, Arabic error messages |
| Correspondence API | Express routes: CRUD for correspondences, departments, employees, archive, dashboard stats |
| Database schema | Drizzle ORM schemas: correspondences, departments, employees, archive, correspondence_history |
| Inbox page | Lists incoming correspondences with navigation to detail view |
| Correspondence detail | `useParams` via wouter, `enabled: !!id` guard, back navigation |
| Add correspondence form | react-hook-form + zod, file attachment support |
| File attachments | Drag & drop + file picker → Supabase Storage bucket `attachments`, RLS policies applied |
| Archive page | Advanced search (text, date range), clear filters button, flex-wrap layout |
| PDF export | html2canvas → jsPDF (DOM snapshot approach — Arabic RTL safe) |
| Excel export | xlsx library, client-side `.xlsx` generation |
| Export button placement | PDF + Excel export buttons on Inbox and Archive pages (removed from Reports) |
| Reports page | Pie chart (status distribution) — label overlap fixed, Legend-only display |
| Dashboard | Stats overview |
| Departments page | Department management |
| Employees page | Employee management |

---

## Current Project State

- **Status**: Feature-complete for graduation project scope.
- **Auth**: Working with 3 test accounts (see credentials below).
- **Storage**: Supabase `attachments` bucket live with RLS.
- **Exports**: PDF and Excel fully functional.
- **Known issues**: None documented as of last commit.

### Test Credentials

| Email | Password | Role |
|---|---|---|
| admin@delta.edu.eg | DeltaAdmin@2026 | مدير |
| supervisor@delta.edu.eg | DeltaSuper@2026 | مشرف |
| employee@delta.edu.eg | DeltaEmp@2026 | موظف |

---

## Pending / Backlog

- [ ] Notifications system for new correspondence
- [ ] Correspondence reply/forward workflow
- [ ] Audit log UI (history table exists in DB schema)
- [ ] Mobile-responsive sidebar (hamburger menu)
- [ ] Dark mode support (next-themes is installed)
- [ ] Unit / integration tests
- [ ] Production environment variable hardening
- [ ] Email notifications via Supabase Edge Functions
