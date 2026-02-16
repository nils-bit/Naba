# Tidsrapportering PWA Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a time-tracking PWA with Next.js and Supabase that lets users track time per project, view weekly summaries, and auto-generate Excel reports every Friday.

**Architecture:** Next.js 14 App Router with Tailwind CSS for UI, Supabase for Postgres database with RLS, auth (magic link), and file storage. Excel reports generated server-side via exceljs in an API route, triggered by Vercel Cron or manually.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (postgres, auth, storage), exceljs, Vercel, next-pwa

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `.env.local.example`

**Step 1: Create Next.js project**

Run:
```bash
cd /Users/nilswirell/Tidsrapportering
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select defaults when prompted. This creates the full Next.js scaffolding.

**Step 2: Install dependencies**

Run:
```bash
npm install @supabase/supabase-js @supabase/ssr exceljs
npm install -D @types/node
```

**Step 3: Create environment variable template**

Create `.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-cron-secret
```

Add `.env.local` to `.gitignore` (should already be there from create-next-app).

**Step 4: Verify it runs**

Run:
```bash
npm run dev
```
Expected: Dev server starts on http://localhost:3000

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with dependencies"
```

---

## Task 2: Supabase Setup & Database Schema

**Files:**
- Create: `supabase/schema.sql`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/middleware.ts`
- Create: `src/types/database.ts`

**Step 1: Create SQL schema file**

Create `supabase/schema.sql`:
```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Projects table
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  color text not null default '#3B82F6',
  archived boolean not null default false,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

alter table public.projects enable row level security;

create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

-- Tags table
create table public.tags (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(name, user_id)
);

alter table public.tags enable row level security;

create policy "Users can view own tags"
  on public.tags for select
  using (auth.uid() = user_id);

create policy "Users can insert own tags"
  on public.tags for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own tags"
  on public.tags for delete
  using (auth.uid() = user_id);

-- Time entries table
create table public.time_entries (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  start_time timestamptz not null,
  end_time timestamptz,
  tag text,
  note text,
  created_at timestamptz default now() not null
);

alter table public.time_entries enable row level security;

create policy "Users can view own entries"
  on public.time_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on public.time_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on public.time_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own entries"
  on public.time_entries for delete
  using (auth.uid() = user_id);

-- Index for fast weekly queries
create index time_entries_user_date_idx
  on public.time_entries (user_id, start_time desc);

-- Storage bucket for reports
insert into storage.buckets (id, name, public)
values ('reports', 'reports', false);

create policy "Users can read own reports"
  on storage.objects for select
  using (auth.uid()::text = (storage.foldername(name))[1]);

create policy "Service role can insert reports"
  on storage.objects for insert
  with check (bucket_id = 'reports');
```

**Step 2: Create TypeScript types**

Create `src/types/database.ts`:
```typescript
export interface Project {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  user_id: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  project_id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  tag: string | null;
  note: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface TimeEntryWithProject extends TimeEntry {
  projects: Pick<Project, 'name' | 'color'>;
}
```

**Step 3: Create Supabase client utilities**

Create `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component — ignore
          }
        },
      },
    }
  );
}
```

Create `src/lib/supabase/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return supabaseResponse;
}
```

Create `src/middleware.ts`:
```typescript
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

**Step 4: Set up Supabase project**

Manual step: Go to https://supabase.com, create a new project, copy the URL and anon key into `.env.local`. Run the SQL from `supabase/schema.sql` in the Supabase SQL editor.

**Step 5: Verify Supabase connection**

Temporarily add to `src/app/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('projects').select('count');
  return <div>Supabase connected: {error ? 'NO - ' + error.message : 'YES'}</div>;
}
```

Run: `npm run dev` and check http://localhost:3000
Expected: "Supabase connected: YES"

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Supabase schema, types, and client utilities"
```

---

## Task 3: Auth (Magic Link Login)

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/auth/callback/route.ts`
- Modify: `src/app/layout.tsx`
- Create: `src/components/auth-guard.tsx`

**Step 1: Create auth callback route**

Create `src/app/auth/callback/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(origin);
}
```

**Step 2: Create login page**

Create `src/app/login/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setLoading(false);
    if (!error) setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Kolla din e-post</h2>
          <p className="text-gray-600">Vi har skickat en inloggningslänk till {email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Tidsrapportering</h1>
        <input
          type="email"
          placeholder="din@email.se"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Skickar...' : 'Skicka inloggningslänk'}
        </button>
      </form>
    </div>
  );
}
```

**Step 3: Create auth guard component**

Create `src/components/auth-guard.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function AuthGuard({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <>{children}</>;
}
```

**Step 4: Update layout with auth guard**

Modify `src/app/layout.tsx` to wrap children in AuthGuard for all routes except /login.

**Step 5: Test login flow manually**

Run: `npm run dev`
1. Go to http://localhost:3000 — should redirect to /login
2. Enter email, click send — should show "Kolla din e-post"
3. Click link in email — should redirect to main page

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add magic link auth with login page and auth guard"
```

---

## Task 4: App Shell & Navigation

**Files:**
- Create: `src/components/bottom-nav.tsx`
- Create: `src/components/header.tsx`
- Modify: `src/app/layout.tsx`
- Create: `src/app/projects/page.tsx` (placeholder)
- Create: `src/app/week/page.tsx` (placeholder)
- Create: `src/app/reports/page.tsx` (placeholder)

**Step 1: Create bottom navigation component**

Create `src/components/bottom-nav.tsx`:
```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Timer', icon: '⏱' },
  { href: '/week', label: 'Vecka', icon: '📅' },
  { href: '/projects', label: 'Projekt', icon: '📁' },
  { href: '/reports', label: 'Rapporter', icon: '📊' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs ${
                active ? 'text-blue-600 font-semibold' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

**Step 2: Create header component**

Create `src/components/header.tsx`:
```typescript
'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function Header() {
  const supabase = createClient();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
      <h1 className="text-lg font-bold">Tidsrapportering</h1>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Logga ut
      </button>
    </header>
  );
}
```

**Step 3: Update layout to include nav and header**

**Step 4: Create placeholder pages for all routes**

Each placeholder: simple `<div>` with page name.

**Step 5: Verify navigation works**

Run: `npm run dev`, click through all four tabs.
Expected: Pages switch, active tab highlights.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add app shell with bottom navigation and header"
```

---

## Task 5: Project Management (CRUD)

**Files:**
- Modify: `src/app/projects/page.tsx`
- Create: `src/components/project-form.tsx`
- Create: `src/components/project-list.tsx`

**Step 1: Create project form component**

A form with: name input, color picker (preset colors), submit button.

**Step 2: Create project list component**

List of projects with name, color dot, archive button. Archived projects collapsed at bottom.

**Step 3: Wire up projects page**

Fetch projects from Supabase, display list, add/edit/archive functionality.

**Step 4: Test project CRUD manually**

1. Add a project → appears in list
2. Edit name → updates
3. Archive → moves to archived section

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add project management with create, edit, and archive"
```

---

## Task 6: Timer (Core Feature)

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/timer-display.tsx`
- Create: `src/components/project-picker.tsx`
- Create: `src/components/tag-input.tsx`
- Create: `src/components/today-entries.tsx`

**Step 1: Create project picker component**

A modal/sheet that shows active projects sorted by last used. Click to select.

**Step 2: Create tag input component**

A text input with autocomplete from existing tags. Creates new tags on-the-fly.

**Step 3: Create timer display component**

Shows: current project name + color, elapsed time (updating every second), tag, stop button.

**Step 4: Create today's entries list**

Shows today's completed time entries with project, duration, tag. Click to edit.

**Step 5: Wire up the timer page**

Flow:
1. No active timer → show "Start" button
2. Click Start → open project picker
3. Select project → timer starts, optionally add tag/note
4. Click Stop → `end_time` is set, entry appears in today's list

Supabase queries:
- Start: `INSERT INTO time_entries (project_id, user_id, start_time)`
- Stop: `UPDATE time_entries SET end_time = now() WHERE id = ?`
- Today: `SELECT * FROM time_entries WHERE start_time >= today ORDER BY start_time DESC`

**Step 6: Test timer flow manually**

1. Click Start → select project → timer runs
2. Click Stop → entry appears in today list with correct duration
3. Start new timer → previous one is in list

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add timer with project picker, tag input, and today's entries"
```

---

## Task 7: Week View

**Files:**
- Modify: `src/app/week/page.tsx`
- Create: `src/components/week-table.tsx`
- Create: `src/lib/time-utils.ts`

**Step 1: Create time utility functions**

Create `src/lib/time-utils.ts`:
```typescript
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
```

**Step 2: Create week table component**

Table: projects as rows, Mon-Fri as columns. Cells show hours. Totals row and column.
Navigation: prev/next week arrows, week number display.

**Step 3: Wire up week page**

Fetch time_entries for current week, join with projects, aggregate by day.

**Step 4: Test week view manually**

Add some time entries, check that hours show correctly in the right cells.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add week view with project-by-day table"
```

---

## Task 8: Excel Report Generation

**Files:**
- Create: `src/lib/excel.ts`
- Create: `src/app/api/generate-report/route.ts`

**Step 1: Create Excel generation utility**

Create `src/lib/excel.ts` using `exceljs`:
- Function `generateWeeklyReport(entries: TimeEntryWithProject[], weekStart: Date): Buffer`
- Sheet 1 "Summering": project × weekday matrix with totals
- Sheet 2 "Detaljerad logg": all entries chronologically with day subtotals
- Sheet 3 "Per projekt": grouped by project with per-project totals
- Professional formatting: colored headers, borders, bold totals, auto column widths

**Step 2: Create API route for report generation**

Create `src/app/api/generate-report/route.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import { generateWeeklyReport } from '@/lib/excel';
import { NextResponse } from 'next/server';
import { getWeekRange, getWeekNumber } from '@/lib/time-utils';

// POST: manual generation (authenticated user)
export async function POST(request: Request) {
  // Get user from session
  // Fetch their time_entries for the requested week
  // Generate Excel
  // Return as download
}

// GET: cron job (service role key)
export async function GET(request: Request) {
  // Verify cron secret
  // Fetch ALL users who have entries this week
  // For each user: generate report, upload to Supabase Storage
  // Return success
}
```

**Step 3: Test report generation manually**

Run: `npm run dev`, create some time entries, then:
```bash
curl -X POST http://localhost:3000/api/generate-report \
  -H "Content-Type: application/json" \
  -d '{"weekOffset": 0}'
```
Expected: Excel file downloads with correct data.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Excel report generation with summary, log, and per-project sheets"
```

---

## Task 9: Reports Page

**Files:**
- Modify: `src/app/reports/page.tsx`
- Create: `src/components/report-list.tsx`
- Create: `src/components/generate-report-button.tsx`

**Step 1: Create generate report button**

Button with date range picker (default: current week). Calls POST `/api/generate-report`, downloads the resulting file.

**Step 2: Create report list component**

Lists files from Supabase Storage `reports/` bucket. Shows filename, date, download link.

**Step 3: Wire up reports page**

Combine button and list.

**Step 4: Test full flow**

1. Generate a report → downloads Excel
2. Open Excel → verify all three sheets have correct data
3. Report appears in list for future download

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add reports page with manual generation and report history"
```

---

## Task 10: Vercel Cron for Friday Reports

**Files:**
- Create: `vercel.json`
- Modify: `src/app/api/generate-report/route.ts` (add cron verification)

**Step 1: Create vercel.json with cron config**

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/generate-report",
      "schedule": "0 17 * * 5"
    }
  ]
}
```

(Every Friday at 17:00 UTC)

**Step 2: Add cron secret verification to GET handler**

```typescript
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... generate reports for all users
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Vercel Cron for automatic Friday report generation"
```

---

## Task 11: PWA Configuration

**Files:**
- Create: `public/manifest.json`
- Modify: `next.config.ts`
- Create: `public/icons/` (app icons)

**Step 1: Install next-pwa**

Run:
```bash
npm install next-pwa
```

**Step 2: Create web app manifest**

Create `public/manifest.json`:
```json
{
  "name": "Tidsrapportering",
  "short_name": "Tid",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563EB",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Step 3: Configure next-pwa in next.config.ts**

**Step 4: Generate app icons**

Create simple blue clock icons at 192x192 and 512x512.

**Step 5: Test PWA installation**

Run `npm run build && npm run start`, open in Chrome, verify "Install app" option appears.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add PWA manifest and service worker configuration"
```

---

## Task 12: Deploy to Vercel

**Files:**
- No new files (uses existing vercel.json)

**Step 1: Deploy**

Run:
```bash
npx vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

**Step 2: Update Supabase redirect URLs**

In Supabase dashboard → Authentication → URL Configuration:
- Add production URL to redirect URLs

**Step 3: Test production app**

1. Open deployed URL
2. Login with magic link
3. Create project, start/stop timer
4. Generate report
5. Install as PWA on phone

**Step 4: Commit any final tweaks**

```bash
git add -A
git commit -m "chore: final deployment configuration"
```
