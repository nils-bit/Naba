import ExcelJS from 'exceljs';
import type { TimeEntryWithProject } from '@/types/database';
import { getDayName } from './time-utils';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF2563EB' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11,
};

const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
};

function getWeekDayIndex(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 6 : d - 1;
}

function formatHours(h: number): string {
  return h > 0 ? h.toFixed(1).replace(/\.0$/, '') : '';
}

function formatTimeShort(iso: string): string {
  return new Date(iso).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE');
}

function durationMinutes(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 60000;
}

function formatDurationString(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = BORDER;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  // Project column left-aligned
  const first = row.getCell(1);
  first.alignment = { vertical: 'middle', horizontal: 'left' };
}

function autoWidth(sheet: ExcelJS.Worksheet) {
  sheet.columns.forEach((col) => {
    let max = 10;
    col.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = cell.value ? String(cell.value).length + 2 : 0;
      if (len > max) max = len;
    });
    col.width = Math.min(max, 30);
  });
}

export async function generateWeeklyReport(
  entries: TimeEntryWithProject[],
  weekStart: Date
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Tidsrapportering';
  wb.created = new Date();

  // Only include completed entries
  const completed = entries.filter((e) => e.end_time !== null);

  // ============================================================
  // Sheet 1: Summering
  // ============================================================
  const sheet1 = wb.addWorksheet('Summering');
  const summaryHeaders = ['Projekt', ...Array.from({ length: 7 }, (_, i) => getDayName(i)), 'Total'];
  const headerRow1 = sheet1.addRow(summaryHeaders);
  styleHeaderRow(headerRow1);

  // Aggregate hours per project per day
  const projectMap = new Map<string, { name: string; days: number[] }>();
  for (const entry of completed) {
    const key = entry.project_id;
    if (!projectMap.has(key)) {
      projectMap.set(key, { name: entry.projects.name, days: [0, 0, 0, 0, 0, 0, 0] });
    }
    const row = projectMap.get(key)!;
    const hours = durationMinutes(entry.start_time, entry.end_time!) / 60;
    const dayIdx = getWeekDayIndex(new Date(entry.start_time));
    if (dayIdx >= 0 && dayIdx < 7) row.days[dayIdx] += hours;
  }

  const projects = Array.from(projectMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const dayTotals = [0, 0, 0, 0, 0, 0, 0];
  for (const proj of projects) {
    const total = proj.days.reduce((a, b) => a + b, 0);
    const rowData = [proj.name, ...proj.days.map(formatHours), formatHours(total)];
    const row = sheet1.addRow(rowData);
    row.eachCell((cell) => {
      cell.border = BORDER;
    });
    for (let i = 0; i < 7; i++) dayTotals[i] += proj.days[i];
  }

  const grandTotal = dayTotals.reduce((a, b) => a + b, 0);
  const totalRow = sheet1.addRow([
    'Totalt',
    ...dayTotals.map(formatHours),
    formatHours(grandTotal),
  ]);
  totalRow.font = { bold: true };
  totalRow.eachCell((cell) => {
    cell.border = BORDER;
  });

  autoWidth(sheet1);

  // ============================================================
  // Sheet 2: Detaljerad logg
  // ============================================================
  const sheet2 = wb.addWorksheet('Detaljerad logg');
  const detailHeaders = ['Datum', 'Projekt', 'Tagg', 'Start', 'Stopp', 'Varaktighet', 'Anteckning'];
  const headerRow2 = sheet2.addRow(detailHeaders);
  styleHeaderRow(headerRow2);

  // Sort chronologically
  const sorted = [...completed].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  let currentDay = '';
  let dayTotal = 0;

  for (const entry of sorted) {
    const date = formatDate(entry.start_time);
    if (date !== currentDay) {
      // Add day subtotal for previous day
      if (currentDay && dayTotal > 0) {
        const subRow = sheet2.addRow([
          '',
          '',
          '',
          '',
          '',
          formatDurationString(dayTotal),
          `Summa ${currentDay}`,
        ]);
        subRow.font = { bold: true, italic: true };
        subRow.eachCell((cell) => { cell.border = BORDER; });
      }
      currentDay = date;
      dayTotal = 0;
    }

    const mins = durationMinutes(entry.start_time, entry.end_time!);
    dayTotal += mins;

    const row = sheet2.addRow([
      date,
      entry.projects.name,
      entry.tag ?? '',
      formatTimeShort(entry.start_time),
      formatTimeShort(entry.end_time!),
      formatDurationString(mins),
      entry.note ?? '',
    ]);
    row.eachCell((cell) => {
      cell.border = BORDER;
    });
  }

  // Last day subtotal
  if (currentDay && dayTotal > 0) {
    const subRow = sheet2.addRow([
      '',
      '',
      '',
      '',
      '',
      formatDurationString(dayTotal),
      `Summa ${currentDay}`,
    ]);
    subRow.font = { bold: true, italic: true };
    subRow.eachCell((cell) => { cell.border = BORDER; });
  }

  autoWidth(sheet2);

  // ============================================================
  // Sheet 3: Per projekt
  // ============================================================
  const sheet3 = wb.addWorksheet('Per projekt');

  // Group by project
  const byProject = new Map<string, { name: string; entries: typeof completed }>();
  for (const entry of sorted) {
    const key = entry.project_id;
    if (!byProject.has(key)) {
      byProject.set(key, { name: entry.projects.name, entries: [] });
    }
    byProject.get(key)!.entries.push(entry);
  }

  const projectGroups = Array.from(byProject.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  for (const group of projectGroups) {
    // Project header
    const projHeaderRow = sheet3.addRow([group.name]);
    projHeaderRow.font = { bold: true, size: 12 };
    projHeaderRow.eachCell((cell) => {
      cell.fill = HEADER_FILL;
      cell.font = { ...HEADER_FONT, size: 12 };
      cell.border = BORDER;
    });

    // Column headers
    const colHeaders = ['Datum', 'Tagg', 'Start', 'Stopp', 'Varaktighet', 'Anteckning'];
    const colRow = sheet3.addRow(colHeaders);
    colRow.font = { bold: true };
    colRow.eachCell((cell) => { cell.border = BORDER; });

    let projTotal = 0;
    for (const entry of group.entries) {
      const mins = durationMinutes(entry.start_time, entry.end_time!);
      projTotal += mins;
      const row = sheet3.addRow([
        formatDate(entry.start_time),
        entry.tag ?? '',
        formatTimeShort(entry.start_time),
        formatTimeShort(entry.end_time!),
        formatDurationString(mins),
        entry.note ?? '',
      ]);
      row.eachCell((cell) => { cell.border = BORDER; });
    }

    const subtotalRow = sheet3.addRow([
      '',
      '',
      '',
      '',
      formatDurationString(projTotal),
      `Summa ${group.name}`,
    ]);
    subtotalRow.font = { bold: true };
    subtotalRow.eachCell((cell) => { cell.border = BORDER; });

    // Empty row between projects
    sheet3.addRow([]);
  }

  autoWidth(sheet3);

  // Write to buffer
  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
