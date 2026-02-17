# Fas 1: Timtaxa + Dashboard — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add hourly rates to projects and a new dashboard page with charts showing time distribution and billable amounts.

**Architecture:** Extend the existing `projects` table with `hourly_rate` column. Propagate rate data through existing components (timer, week, today-entries, excel). Add new `/dashboard` route with Recharts for pie/bar charts. New bottom-nav tab.

**Tech Stack:** Next.js 16, React 19, Supabase, Tailwind CSS 4, Recharts 2.x, ExcelJS

---

### Task 1: Database migration — add hourly_rate to projects

**Files:**
- Modify: `src/types/database.ts`

**Step 1: Add hourly_rate to Project interface**

In `src/types/database.ts`, add `hourly_rate` to the `Project` interface:

```typescript
export interface Project {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  user_id: string;
  created_at: string;
  hourly_rate: number | null;
}
```

Also update `TimeEntryWithProject` to include `hourly_rate`:

```typescript
export interface TimeEntryWithProject extends TimeEntry {
  projects: Pick<Project, 'name' | 'color' | 'hourly_rate'>;
}
```

**Step 2: Add column in Supabase**

Run this SQL in the Supabase dashboard SQL editor:

```sql
ALTER TABLE projects ADD COLUMN hourly_rate numeric DEFAULT NULL;
```

**Step 3: Verify build passes**

Run: `npx tsc --noEmit`
Expected: No errors (hourly_rate is nullable so existing code won't break)

**Step 4: Commit**

```bash
git add src/types/database.ts
git commit -m "feat: add hourly_rate to Project type"
```

---

### Task 2: Project form — add hourly rate input

**Files:**
- Modify: `src/components/project-form.tsx`
- Modify: `src/app/(app)/projects/page.tsx`
- Modify: `src/components/project-list.tsx`

**Step 1: Update ProjectForm to accept and emit hourly_rate**

In `src/components/project-form.tsx`:

1. Add `initialHourlyRate?: number | null` to `ProjectFormProps`
2. Change `onSubmit` signature to `(name: string, color: string, hourlyRate: number | null) => void`
3. Add state: `const [hourlyRate, setHourlyRate] = useState<string>(initialHourlyRate ? String(initialHourlyRate) : '')`
4. Add input field after the color picker section:

```tsx
<div>
  <span className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">
    Timtaxa (kr/h)
  </span>
  <input
    type="number"
    value={hourlyRate}
    onChange={(e) => setHourlyRate(e.target.value)}
    placeholder="Valfritt"
    min="0"
    step="any"
    className="form-input text-sm"
  />
</div>
```

5. In `handleSubmit`, pass `hourlyRate ? Number(hourlyRate) : null` as third argument
6. In reset logic (when `!initialName`), add `setHourlyRate('')`

**Step 2: Update projects/page.tsx**

Update `handleCreate` and `handleUpdate` to accept and pass `hourlyRate`:

```typescript
async function handleCreate(name: string, color: string, hourlyRate: number | null) {
  // ...existing code...
  const { data } = await supabase
    .from('projects')
    .insert({ name, color, user_id: user.id, archived: false, hourly_rate: hourlyRate })
    .select()
    .single();
  // ...rest same...
}

async function handleUpdate(id: string, name: string, color: string, hourlyRate: number | null) {
  const { data } = await supabase
    .from('projects')
    .update({ name, color, hourly_rate: hourlyRate })
    .eq('id', id)
    .select()
    .single();
  // ...rest same...
}
```

**Step 3: Update ProjectList to pass hourlyRate through**

In `src/components/project-list.tsx`:

1. Update `onUpdate` prop type to `(id: string, name: string, color: string, hourlyRate: number | null) => void`
2. Pass `initialHourlyRate={project.hourly_rate}` to `ProjectForm` in edit mode
3. Update the `onSubmit` callback to forward all 3 values + id

Also display the rate next to the project name when set:

```tsx
<span className="text-sm font-medium text-[var(--text-primary)] truncate">
  {project.name}
</span>
{project.hourly_rate && (
  <span className="text-xs text-[var(--text-tertiary)] ml-2 shrink-0">
    {project.hourly_rate} kr/h
  </span>
)}
```

**Step 4: Build and verify**

Run: `npx tsc --noEmit && npm run build`
Expected: Clean build

**Step 5: Commit**

```bash
git add src/components/project-form.tsx src/app/\(app\)/projects/page.tsx src/components/project-list.tsx
git commit -m "feat: add hourly rate input to project form"
```

---

### Task 3: Timer display — show live cost estimate

**Files:**
- Modify: `src/components/timer-display.tsx`

**Step 1: Add hourlyRate prop and live cost display**

1. Add `hourlyRate?: number | null` to `TimerDisplayProps`
2. Compute cost from elapsed:

```typescript
const estimatedCost = hourlyRate ? (elapsed / 3600) * hourlyRate : null;
```

3. Add below the elapsed time display (after the `<div>` with `{hm}<span>{s}</span>`):

```tsx
{estimatedCost !== null && (
  <div className="relative text-lg text-[var(--text-secondary)] font-light tracking-wide">
    ~{Math.round(estimatedCost).toLocaleString('sv-SE')} kr
  </div>
)}
```

**Step 2: Pass hourlyRate from timer/page.tsx**

In `src/app/(app)/timer/page.tsx`, add `hourlyRate={activeProject?.hourly_rate}` to `<TimerDisplay>`:

```tsx
<TimerDisplay
  projectName={activeProject.name}
  projectColor={activeProject.color}
  startTime={new Date(activeEntry.start_time)}
  tag={tag || undefined}
  onStop={handleStopRequest}
  hourlyRate={activeProject.hourly_rate}
/>
```

**Step 3: Build and verify**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 4: Commit**

```bash
git add src/components/timer-display.tsx src/app/\(app\)/timer/page.tsx
git commit -m "feat: show live cost estimate in timer display"
```

---

### Task 4: Today entries — show amount per entry

**Files:**
- Modify: `src/components/today-entries.tsx`

**Step 1: Update to show cost**

The `TimeEntryWithProject` now includes `projects.hourly_rate`. Compute and display:

After the duration display (`formatDurationShort`), add cost when rate exists:

```tsx
{entry.end_time && (
  <div className="text-base font-bold text-[var(--text-primary)] tabular-nums">
    {formatDurationShort(entry.start_time, entry.end_time)}
    {entry.projects.hourly_rate && (
      <span className="text-xs font-normal text-[var(--text-tertiary)] ml-1.5">
        {Math.round(
          ((new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / 3600000) *
          entry.projects.hourly_rate
        ).toLocaleString('sv-SE')} kr
      </span>
    )}
  </div>
)}
```

**Step 2: Build and verify**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/components/today-entries.tsx
git commit -m "feat: show billable amount per entry in today list"
```

---

### Task 5: Week table — add amount column

**Files:**
- Modify: `src/components/week-table.tsx`
- Modify: `src/app/(app)/week/page.tsx`

**Step 1: Extend WeekTable with rate data**

In `src/components/week-table.tsx`:

1. Add `hourlyRate: number | null` to `ProjectRow` interface
2. In `computeRows`, capture hourly_rate from entries:

```typescript
if (!projectMap.has(key)) {
  projectMap.set(key, {
    name: entry.projects.name,
    color: entry.projects.color,
    hourlyRate: entry.projects.hourly_rate ?? null,
    days: [0, 0, 0, 0, 0, 0, 0],
  });
}
```

3. Map it through to `ProjectRow`:

```typescript
hourlyRate: row.hourlyRate,
```

4. Add "Belopp" column header after "Total":

```tsx
<th className="text-right px-4 py-3 text-xs font-medium text-[var(--text-secondary)] w-20">
  Belopp
</th>
```

5. Add amount cell per row:

```tsx
<td className="text-right px-4 py-3 text-[var(--text-secondary)] tabular-nums">
  {row.hourlyRate ? `${Math.round(row.total * row.hourlyRate).toLocaleString('sv-SE')} kr` : '–'}
</td>
```

6. Add grand total amount in tfoot:

```typescript
const grandAmount = rows.reduce((sum, row) => sum + (row.hourlyRate ? row.total * row.hourlyRate : 0), 0);
```

```tsx
<td className="text-right px-4 py-3 font-bold text-[var(--primary)] tabular-nums">
  {grandAmount > 0 ? `${Math.round(grandAmount).toLocaleString('sv-SE')} kr` : '–'}
</td>
```

**Step 2: Update week/page.tsx query to include hourly_rate**

The existing query `select('*, projects(name, color)')` needs to become:
`select('*, projects(name, color, hourly_rate)')`

**Step 3: Build and verify**

Run: `npx tsc --noEmit && npm run build`

**Step 4: Commit**

```bash
git add src/components/week-table.tsx src/app/\(app\)/week/page.tsx
git commit -m "feat: add billable amount column to week table"
```

---

### Task 6: Excel report — add amount columns

**Files:**
- Modify: `src/lib/excel.ts`
- Modify: `src/app/api/generate-report/route.ts`

**Step 1: Update the query in route.ts to include hourly_rate**

Change `select('*, projects(name, color)')` to `select('*, projects(name, color, hourly_rate)')` in both POST and GET handlers.

**Step 2: Update generateWeeklyReport in excel.ts**

Access `entry.projects.hourly_rate` (available via updated `TimeEntryWithProject`).

**Sheet 1 (Summering):** Add "Belopp" column after "Total":

```typescript
const summaryHeaders = ['Projekt', ...Array.from({ length: 7 }, (_, i) => getDayName(i)), 'Total', 'Belopp'];
```

For each project row, compute:
```typescript
const rate = /* need to track rate per project */ ;
const amount = rate ? total * rate : null;
const rowData = [proj.name, ...proj.days.map(formatHours), formatHours(total), amount ? `${Math.round(amount)} kr` : '–'];
```

Track `hourlyRate` in the projectMap alongside name and days.

Add grand total amount in footer row.

**Sheet 2 (Detaljerad logg):** Add "Belopp" column:

```typescript
const detailHeaders = ['Datum', 'Projekt', 'Tagg', 'Start', 'Stopp', 'Varaktighet', 'Belopp', 'Anteckning'];
```

Per entry:
```typescript
const hours = mins / 60;
const rate = entry.projects.hourly_rate;
const amount = rate ? Math.round(hours * rate) : null;
// Add to row: amount ? `${amount} kr` : '–'
```

**Sheet 3 (Per projekt):** Add "Belopp" column with subtotals.

**Step 3: Build and verify**

Run: `npx tsc --noEmit && npm run build`

**Step 4: Commit**

```bash
git add src/lib/excel.ts src/app/api/generate-report/route.ts
git commit -m "feat: add billable amounts to Excel reports"
```

---

### Task 7: Install Recharts

**Step 1: Install dependency**

```bash
npm install recharts
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add recharts dependency"
```

---

### Task 8: Dashboard page — summary cards + charts

**Files:**
- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/components/dashboard-charts.tsx`
- Create: `src/lib/dashboard-utils.ts`

**Step 1: Create dashboard-utils.ts**

Helper functions for dashboard data processing:

```typescript
// src/lib/dashboard-utils.ts
import type { TimeEntryWithProject } from '@/types/database';

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  projectColor: string;
  hourlyRate: number | null;
  totalHours: number;
  totalAmount: number;
}

export interface DaySummary {
  date: string;       // "2026-02-17"
  dayLabel: string;    // "Mån 17/2"
  projects: { name: string; color: string; hours: number }[];
  totalHours: number;
}

export function computeProjectSummaries(entries: TimeEntryWithProject[]): ProjectSummary[] {
  const map = new Map<string, ProjectSummary>();
  for (const e of entries) {
    if (!e.end_time) continue;
    const key = e.project_id;
    if (!map.has(key)) {
      map.set(key, {
        projectId: key,
        projectName: e.projects.name,
        projectColor: e.projects.color,
        hourlyRate: e.projects.hourly_rate ?? null,
        totalHours: 0,
        totalAmount: 0,
      });
    }
    const s = map.get(key)!;
    const hours = (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 3600000;
    s.totalHours += hours;
    if (s.hourlyRate) s.totalAmount += hours * s.hourlyRate;
  }
  return Array.from(map.values()).sort((a, b) => b.totalHours - a.totalHours);
}

export function computeDaySummaries(entries: TimeEntryWithProject[]): DaySummary[] {
  const map = new Map<string, DaySummary>();
  for (const e of entries) {
    if (!e.end_time) continue;
    const d = new Date(e.start_time);
    const dateKey = d.toISOString().slice(0, 10);
    if (!map.has(dateKey)) {
      const dayLabel = d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'numeric' });
      map.set(dateKey, { date: dateKey, dayLabel, projects: [], totalHours: 0 });
    }
    const day = map.get(dateKey)!;
    const hours = (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 3600000;
    day.totalHours += hours;

    const existing = day.projects.find(p => p.name === e.projects.name);
    if (existing) {
      existing.hours += hours;
    } else {
      day.projects.push({ name: e.projects.name, color: e.projects.color, hours });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
```

**Step 2: Create dashboard-charts.tsx**

```tsx
// src/components/dashboard-charts.tsx
'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { ProjectSummary, DaySummary } from '@/lib/dashboard-utils';

interface ChartsProps {
  projectSummaries: ProjectSummary[];
  daySummaries: DaySummary[];
}

export function DashboardCharts({ projectSummaries, daySummaries }: ChartsProps) {
  // Pie chart data
  const pieData = projectSummaries.map(p => ({
    name: p.projectName,
    value: Math.round(p.totalHours * 10) / 10,
    color: p.projectColor,
  }));

  // Bar chart data — stacked by project
  const projectNames = [...new Set(projectSummaries.map(p => p.projectName))];
  const barData = daySummaries.map(day => {
    const row: Record<string, string | number> = { dayLabel: day.dayLabel };
    for (const pName of projectNames) {
      const match = day.projects.find(p => p.name === pName);
      row[pName] = match ? Math.round(match.hours * 10) / 10 : 0;
    }
    return row;
  });

  const projectColors = Object.fromEntries(projectSummaries.map(p => [p.projectName, p.projectColor]));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Pie chart — time distribution */}
      <div className="glass-card p-5">
        <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-4">Tidsfordelning</h4>
        {pieData.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-8">Ingen data</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}h`, '']} />
            </PieChart>
          </ResponsiveContainer>
        )}
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3">
          {pieData.map(p => (
            <div key={p.name} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              {p.name}
            </div>
          ))}
        </div>
      </div>

      {/* Bar chart — hours per day */}
      <div className="glass-card p-5">
        <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-4">Timmar per dag</h4>
        {barData.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-8">Ingen data</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="dayLabel" tick={{ fontSize: 11, fill: '#6E6E73' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6E6E73' }} unit="h" />
              <Tooltip />
              {projectNames.map(name => (
                <Bar key={name} dataKey={name} stackId="a" fill={projectColors[name]} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Create dashboard/page.tsx**

```tsx
// src/app/(app)/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TimeEntryWithProject } from '@/types/database';
import { getWeekRange, getWeekNumber } from '@/lib/time-utils';
import { computeProjectSummaries, computeDaySummaries } from '@/lib/dashboard-utils';
import { DashboardCharts } from '@/components/dashboard-charts';

type Period = 'week' | 'month';

function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('week');
  const [offset, setOffset] = useState(0);
  const [entries, setEntries] = useState<TimeEntryWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + (period === 'week' ? offset * 7 : 0));
  if (period === 'month') currentDate.setMonth(currentDate.getMonth() + offset);

  const range = period === 'week' ? getWeekRange(currentDate) : getMonthRange(currentDate);

  const periodLabel = period === 'week'
    ? `Vecka ${getWeekNumber(range.start)}, ${range.start.getFullYear()}`
    : currentDate.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const d = new Date();
    if (period === 'week') d.setDate(d.getDate() + offset * 7);
    else d.setMonth(d.getMonth() + offset);
    const r = period === 'week' ? getWeekRange(d) : getMonthRange(d);

    const { data } = await supabase
      .from('time_entries')
      .select('*, projects(name, color, hourly_rate)')
      .gte('start_time', r.start.toISOString())
      .lte('start_time', r.end.toISOString())
      .not('end_time', 'is', null)
      .order('start_time', { ascending: true });

    if (data) setEntries(data as TimeEntryWithProject[]);
    setLoading(false);
  }, [offset, period]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Reset offset when switching period
  useEffect(() => { setOffset(0); }, [period]);

  const projectSummaries = computeProjectSummaries(entries);
  const daySummaries = computeDaySummaries(entries);

  const totalHours = projectSummaries.reduce((s, p) => s + p.totalHours, 0);
  const totalAmount = projectSummaries.reduce((s, p) => s + p.totalAmount, 0);
  const activeProjects = projectSummaries.length;

  return (
    <div className="max-w-[640px] mx-auto px-4 py-6 animate-fade-in">
      {/* Period selector */}
      <div className="flex items-center gap-2 mb-6">
        {(['week', 'month'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              period === p
                ? 'bg-[var(--primary)] text-white shadow-sm shadow-[#007AFF]/20'
                : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:bg-black/[0.06]'
            }`}
          >
            {p === 'week' ? 'Vecka' : 'Manad'}
          </button>
        ))}
      </div>

      {/* Period navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setOffset(o => o - 1)} className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] hover-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight capitalize">{periodLabel}</h2>
          {offset === 0 && <span className="text-xs text-[var(--primary)] font-medium">{period === 'week' ? 'Denna vecka' : 'Denna manad'}</span>}
        </div>
        <button onClick={() => setOffset(o => o + 1)} className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] hover-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
            {loading ? '–' : `${Math.round(totalHours * 10) / 10}h`}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">Arbetad tid</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-[var(--primary)] tabular-nums">
            {loading ? '–' : totalAmount > 0 ? `${Math.round(totalAmount).toLocaleString('sv-SE')}` : '–'}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">{totalAmount > 0 ? 'Fakturerbart (kr)' : 'Fakturerbart'}</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
            {loading ? '–' : activeProjects}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">Projekt</div>
        </div>
      </div>

      {/* Charts */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-5"><div className="skeleton w-full h-[260px] rounded-xl" /></div>
          <div className="glass-card p-5"><div className="skeleton w-full h-[260px] rounded-xl" /></div>
        </div>
      ) : (
        <DashboardCharts projectSummaries={projectSummaries} daySummaries={daySummaries} />
      )}

      {/* Project breakdown list */}
      {!loading && projectSummaries.length > 0 && (
        <div className="mt-6">
          <h3 className="text-[13px] font-semibold text-[var(--text-secondary)] mb-3 px-1">Per projekt</h3>
          <div className="space-y-2">
            {projectSummaries.map(p => (
              <div key={p.projectId} className="flex items-center bg-white/72 backdrop-blur-xl rounded-2xl border border-black/[0.06] shadow-sm px-4 py-3">
                <span className="w-3 h-3 rounded-full shrink-0 mr-3" style={{ backgroundColor: p.projectColor }} />
                <span className="text-sm font-medium text-[var(--text-primary)] truncate flex-1">{p.projectName}</span>
                <div className="text-right shrink-0 ml-3">
                  <div className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                    {Math.round(p.totalHours * 10) / 10}h
                  </div>
                  {p.totalAmount > 0 && (
                    <div className="text-xs text-[var(--text-tertiary)] tabular-nums">
                      {Math.round(p.totalAmount).toLocaleString('sv-SE')} kr
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Build and verify**

Run: `npx tsc --noEmit && npm run build`

**Step 5: Commit**

```bash
git add src/app/\(app\)/dashboard/page.tsx src/components/dashboard-charts.tsx src/lib/dashboard-utils.ts
git commit -m "feat: add dashboard page with charts and summary cards"
```

---

### Task 9: Bottom nav — add Dashboard tab

**Files:**
- Modify: `src/components/bottom-nav.tsx`

**Step 1: Add dashboard nav item**

Insert a new item at position 2 (after Timer, before Vecka) in the `navItems` array:

```typescript
{
  href: '/dashboard',
  label: 'Dashboard',
  icon: (active: boolean) =>
    active ? (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#007AFF" className="w-6 h-6">
        <rect x="3" y="13" width="4" height="8" rx="1" opacity="0.15" />
        <rect x="3" y="13" width="4" height="8" rx="1" fill="none" stroke="#007AFF" strokeWidth={2} />
        <rect x="10" y="8" width="4" height="13" rx="1" opacity="0.15" />
        <rect x="10" y="8" width="4" height="13" rx="1" fill="none" stroke="#007AFF" strokeWidth={2} />
        <rect x="17" y="3" width="4" height="18" rx="1" opacity="0.15" />
        <rect x="17" y="3" width="4" height="18" rx="1" fill="none" stroke="#007AFF" strokeWidth={2} />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="13" width="4" height="8" rx="1" />
        <rect x="10" y="8" width="4" height="13" rx="1" />
        <rect x="17" y="3" width="4" height="18" rx="1" />
      </svg>
    ),
},
```

New order: Timer | Dashboard | Vecka | Projekt | Rapporter

Since we now have 5 items, reduce the min-width of nav items:

Change `min-w-[64px]` to `min-w-0` and `px-3` to `px-2` in the Link className.

**Step 2: Build and verify**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/bottom-nav.tsx
git commit -m "feat: add Dashboard tab to bottom navigation"
```

---

### Task 10: Update all queries to include hourly_rate

**Files:**
- Modify: `src/app/(app)/timer/page.tsx` (fetchTodayEntries query)

**Step 1: Update fetchTodayEntries query**

Change:
```typescript
.select('*, projects(name, color)')
```
To:
```typescript
.select('*, projects(name, color, hourly_rate)')
```

This ensures today-entries have access to the rate for cost display.

**Step 2: Build and verify**

Run: `npx tsc --noEmit && npm run build`

**Step 3: Commit**

```bash
git add src/app/\(app\)/timer/page.tsx
git commit -m "feat: include hourly_rate in all project queries"
```

---

### Task 11: Final build, deploy, verify

**Step 1: Full build**

```bash
npx tsc --noEmit && npm run build
```

**Step 2: Deploy**

```bash
vercel --prod --yes
```

**Step 3: Commit all remaining changes**

```bash
git add -A && git status
```

Only commit if there are remaining changes.

**Step 4: Verify on production**

Open https://tidsrapportering-sigma.vercel.app and test:
1. Create/edit a project with hourly rate
2. Start/stop timer — verify live cost shows
3. Check today entries for cost
4. Navigate to week view — verify amount column
5. Navigate to dashboard — verify charts load
6. Generate Excel report — verify amount columns
