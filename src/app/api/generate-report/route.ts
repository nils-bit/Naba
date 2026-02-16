import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { generateWeeklyReport } from '@/lib/excel';
import { getWeekRange, getWeekNumber } from '@/lib/time-utils';
import type { TimeEntryWithProject } from '@/types/database';

async function createAuthClient() {
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

/**
 * POST: Generate an Excel report for a specific week.
 * Body: { weekOffset: number } where 0 = current week, -1 = last week, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const weekOffset = typeof body.weekOffset === 'number' ? body.weekOffset : 0;

    const now = new Date();
    now.setDate(now.getDate() + weekOffset * 7);
    const { start, end } = getWeekRange(now);
    const weekNum = getWeekNumber(start);
    const year = start.getFullYear();

    const { data: entries } = await supabase
      .from('time_entries')
      .select('*, projects(name, color)')
      .eq('user_id', user.id)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .not('end_time', 'is', null)
      .order('start_time', { ascending: true });

    const buffer = await generateWeeklyReport(
      (entries ?? []) as TimeEntryWithProject[],
      start
    );

    const filename = `tidsrapport-${year}-v${String(weekNum).padStart(2, '0')}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Report generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

/**
 * GET: CRON endpoint that generates reports for all users with entries this week.
 * Requires Authorization: Bearer <CRON_SECRET> header.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();
    const { start, end } = getWeekRange(now);
    const weekNum = getWeekNumber(start);
    const year = start.getFullYear();

    // Get all entries for this week
    const { data: allEntries } = await supabaseAdmin
      .from('time_entries')
      .select('*, projects(name, color)')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .not('end_time', 'is', null)
      .order('start_time', { ascending: true });

    if (!allEntries || allEntries.length === 0) {
      return NextResponse.json({ message: 'No entries found', generated: 0 });
    }

    // Group by user
    const byUser = new Map<string, TimeEntryWithProject[]>();
    for (const entry of allEntries as TimeEntryWithProject[]) {
      const uid = entry.user_id;
      if (!byUser.has(uid)) byUser.set(uid, []);
      byUser.get(uid)!.push(entry);
    }

    let generated = 0;
    const filename = `tidsrapport-${year}-v${String(weekNum).padStart(2, '0')}.xlsx`;

    for (const [userId, userEntries] of byUser) {
      const buffer = await generateWeeklyReport(userEntries, start);
      const path = `${userId}/${filename}`;

      await supabaseAdmin.storage
        .from('reports')
        .upload(path, buffer, {
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          upsert: true,
        });

      generated++;
    }

    return NextResponse.json({ message: 'Reports generated', generated });
  } catch (err) {
    console.error('CRON report error:', err);
    return NextResponse.json(
      { error: 'Failed to generate reports' },
      { status: 500 }
    );
  }
}
