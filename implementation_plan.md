# SisAbsen — School Attendance Management System

## Overview

A full-stack web application for school staff/teacher daily attendance, built with Next.js 14 App Router, TypeScript, Tailwind CSS v3, and Supabase (Auth + PostgreSQL + Storage). Optimized for mobile (primarily used on smartphones), deployed to Vercel on free tier.

---

## User Review Required

> [!IMPORTANT]
> **Project Location**: The app will be scaffolded inside `c:\Users\DATA-PSDKP\Documents\Project\Project\javascript\Sis Smart\` using `create-next-app`.

> [!IMPORTANT]
> **Face Recognition**: The spec mentions optional face recognition. Given complexity and free-tier constraints, I will implement a **placeholder structure** with a `face-api.js`-ready scaffold (runs entirely in-browser, no paid API). It can be activated later. Please confirm if you want the placeholder or skip entirely.

> [!WARNING]
> **GPS Validation**: The school's GPS coordinates and allowed radius (default 100m) will be stored in the `settings` table. They must be configured by the admin after setup before attendance will work.

> [!NOTE]
> **Supabase Setup**: You will need a free Supabase project. The plan includes full SQL schema you can paste into the Supabase SQL editor. No backend server needed — Next.js Server Actions call Supabase directly.

---

## Proposed Changes

### 1. Project Initialization

```
npx create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Post-init installs:
- `@supabase/supabase-js` + `@supabase/ssr` (server-side auth helpers)
- `date-fns` (date utilities)
- `lucide-react` (icons)
- `recharts` (dashboard charts)
- `react-hot-toast` (notifications)
- `clsx` + `tailwind-merge` (class utilities)

---

### 2. Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Sidebar + Navbar wrapper
│   │   ├── page.tsx                    # Dashboard (redirect by role)
│   │   ├── attendance/page.tsx         # Absensi Masuk/Pulang
│   │   ├── leave/
│   │   │   ├── page.tsx                # Daftar izin milik user
│   │   │   └── new/page.tsx            # Form pengajuan izin
│   │   └── admin/
│   │       ├── page.tsx                # Admin dashboard rekap
│   │       ├── users/page.tsx          # Manajemen user
│   │       ├── leave/page.tsx          # Approve/reject izin
│   │       └── settings/page.tsx       # Kustomisasi sekolah
│   ├── api/
│   │   └── export/attendance/route.ts  # CSV export endpoint
│   └── layout.tsx                      # Root layout
├── components/
│   ├── ui/                             # Reusable primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   └── Spinner.tsx
│   ├── attendance/
│   │   ├── AttendanceButton.tsx        # Masuk/Pulang button + GPS
│   │   ├── AttendanceHistory.tsx
│   │   └── LocationStatus.tsx
│   ├── leave/
│   │   ├── LeaveForm.tsx
│   │   └── LeaveCard.tsx
│   ├── admin/
│   │   ├── AttendanceTable.tsx
│   │   ├── UserTable.tsx
│   │   ├── AttendanceChart.tsx
│   │   └── StatsCard.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx
│   │   └── MobileNav.tsx
│   └── face/
│       └── FaceCapture.tsx             # Placeholder untuk face recognition
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser Supabase client
│   │   ├── server.ts                   # Server Supabase client
│   │   └── middleware.ts               # Auth middleware helpers
│   ├── actions/
│   │   ├── attendance.ts               # Server Actions: checkin/checkout
│   │   ├── leave.ts                    # Server Actions: leave CRUD
│   │   ├── admin.ts                    # Server Actions: admin ops
│   │   └── settings.ts                 # Server Actions: school settings
│   ├── hooks/
│   │   ├── useGeolocation.ts
│   │   ├── useAttendance.ts
│   │   └── useAuth.ts
│   ├── utils/
│   │   ├── distance.ts                 # Haversine formula
│   │   ├── csv.ts                      # CSV generate helper
│   │   └── cn.ts                       # clsx + twMerge
│   └── types/
│       └── index.ts                    # All shared TypeScript types
├── middleware.ts                        # Route protection
└── supabase/
    ├── schema.sql                       # Full DB schema
    ├── seed.sql                         # Example seed data
    └── policies.sql                     # RLS policies
```

---

### 3. Database Schema

#### `profiles` table (extends `auth.users`)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK, FK auth.users) | |
| full_name | text | |
| role | enum('admin','staff') | default 'staff' |
| position | text | jabatan/unit |
| phone | text | |
| avatar_url | text | |
| is_active | boolean | default true |
| created_at | timestamptz | |

#### `attendance` table
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK profiles) | |
| date | date | |
| check_in | timestamptz | jam masuk |
| check_out | timestamptz | jam pulang (nullable) |
| check_in_lat | float8 | |
| check_in_lng | float8 | |
| check_out_lat | float8 | nullable |
| check_out_lng | float8 | nullable |
| status | enum('hadir','telat','izin') | |
| note | text | optional |
| created_at | timestamptz | |

#### `leave_requests` table
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK profiles) | |
| start_date | date | |
| end_date | date | |
| leave_type | enum('sakit','izin','cuti','dinas') | |
| reason | text | |
| attachment_url | text | nullable |
| status | enum('pending','approved','rejected') | default 'pending' |
| reviewed_by | uuid (FK profiles) | nullable |
| reviewed_at | timestamptz | nullable |
| admin_note | text | nullable |
| created_at | timestamptz | |

#### `settings` table
| Column | Type | Notes |
|---|---|---|
| id | int (PK, always 1) | singleton row |
| school_name | text | |
| school_logo_url | text | nullable |
| primary_color | text | hex, default '#2563EB' |
| school_lat | float8 | koordinat GPS sekolah |
| school_lng | float8 | |
| allowed_radius_m | int | default 100 |
| work_start_time | time | jam masuk normal, e.g. '07:30' |
| work_end_time | time | jam pulang normal |
| updated_at | timestamptz | |

---

### 4. Key Features Implementation

#### Auth & Middleware
- Supabase Auth with email/password
- `middleware.ts` checks session → redirects unauthenticated to `/login`
- Role stored in `profiles.role`, read server-side via `getUser()`
- Admin routes (`/admin/*`) protected by role check

#### GPS Attendance Flow
1. User opens `/attendance`
2. Browser requests geolocation (HTML5 Geolocation API)
3. Client calculates distance using **Haversine formula** vs. `settings.school_lat/lng`
4. If within `allowed_radius_m` → enable "Absen Masuk" button
5. Server Action verifies: no duplicate check-in for today, saves to `attendance`
6. Status set automatically: `hadir` if before `work_start_time`, else `telat`

#### Admin Dashboard Charts
- **Recharts** BarChart: attendance per day (current month)
- Summary cards: hadir / telat / izin / absen counts
- Filter by user, date range
- Export CSV via `/api/export/attendance` route

#### School Customization
- Settings stored in `settings` table (singleton row)
- Logo uploaded to **Supabase Storage** bucket `school-assets`
- Primary color applied via CSS custom property (`--color-primary`)
- School name + logo shown in Navbar and Login page (fetched server-side)

#### Face Recognition Placeholder
- `FaceCapture.tsx` component: opens camera, captures frame
- Ready for `face-api.js` integration
- Currently renders a "Fitur segera hadir" UI if not enabled in settings

---

### 5. Row Level Security (RLS) Strategy

| Table | Staff can | Admin can |
|---|---|---|
| profiles | read own, update own | read all, update all |
| attendance | read own, insert own | read all |
| leave_requests | read own, insert own | read all, update status |
| settings | read | read + update |

---

### 6. File Breakdown

#### [NEW] `supabase/schema.sql`
Full SQL for all tables, enums, indexes, triggers (auto-create profile on auth signup), and RLS policies.

#### [NEW] `supabase/seed.sql`
Example data: 1 admin, 3 staff, attendance records for past 30 days, 2 leave requests.

#### [NEW] `src/middleware.ts`
Route protection using Supabase SSR session refresh.

#### [NEW] `src/app/(auth)/login/page.tsx`
Login page with school logo/name from settings, email+password form, role-aware redirect.

#### [NEW] `src/app/(dashboard)/layout.tsx`
Sidebar (desktop) + bottom nav (mobile), role-aware menu items.

#### [NEW] `src/app/(dashboard)/page.tsx`
User dashboard: today's status card, weekly summary, attendance history list.

#### [NEW] `src/app/(dashboard)/attendance/page.tsx`
GPS check-in/check-out with live location status indicator.

#### [NEW] `src/app/(dashboard)/leave/page.tsx` + `new/page.tsx`
Leave history + submission form.

#### [NEW] `src/app/(dashboard)/admin/*.tsx`
Admin pages: recap table, user management, leave approval, settings.

#### [NEW] `src/app/api/export/attendance/route.ts`
CSV export endpoint with date/user filters.

---

## Verification Plan

### Automated
- TypeScript compile: `npx tsc --noEmit`
- Lint: `npx eslint src/`
- Build check: `npm run build`

### Manual (Browser)
1. Login as admin and staff (separate sessions)
2. GPS check-in flow (allow/deny location)
3. Leave submission + admin approve
4. Admin export CSV
5. Settings: upload logo, change school name

### Deployment
- Push to GitHub → connect Vercel
- Set env vars in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Open Questions

> [!IMPORTANT]
> 1. **Nama sekolah default**: Apa nama sekolah yang akan digunakan sebagai default (bisa diganti lewat settings admin)? Atau pakai "SMAN 1 Contoh" saja?
> 2. **Koordinat GPS sekolah**: Apakah ada koordinat spesifik untuk dikonfigurasi di seed data, atau pakai placeholder (Jakarta Pusat)?
> 3. **Face Recognition**: Implementasikan placeholder scaffold (siap pakai) atau skip sepenuhnya?
> 4. **Bahasa UI**: Sepenuhnya Bahasa Indonesia, atau campuran dengan Inggris untuk label teknis?
