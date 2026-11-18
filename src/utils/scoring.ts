import { KELURAHAN_LIST, ISSUE_TYPE_LIST } from '../data/purwokerto';
import { EnvReport, IssueType, KecamatanName, KelurahanScore } from '../types/env';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function isWithinLast7Days(isoDate: string, nowMs: number = Date.now()): boolean {
  const t = new Date(isoDate).getTime();
  return nowMs - t <= SEVEN_DAYS_MS && nowMs - t >= -60_000;
}

export function computeKelurahanScores(
  reports: EnvReport[],
  nowMs: number = Date.now()
): KelurahanScore[] {
  return KELURAHAN_LIST.map((kelurahan) => {
    const kelReports = reports.filter((r) => r.kelurahanId === kelurahan.id);

    let penalty = 0;
    let activeReports = 0;
    let resolvedReports = 0;
    let reportsLast7Days = 0;
    const issueCounter: Partial<Record<IssueType, number>> = {};

    for (const r of kelReports) {
      issueCounter[r.issueType] = (issueCounter[r.issueType] || 0) + 1;
      if (isWithinLast7Days(r.createdAt, nowMs)) {
        reportsLast7Days += 1;
      }

      if (r.status === 'Selesai') {
        resolvedReports += 1;
        // Resolved reports only carry tiny historical trace (1 pt) if within 14 days
        const ageDays = (nowMs - new Date(r.createdAt).getTime()) / (24 * 60 * 60 * 1000);
        if (ageDays <= 14) {
          penalty += 1;
        }
      } else if (r.status === 'Diproses') {
        activeReports += 1;
        if (r.severity === 'Ringan') penalty += 3;
        else if (r.severity === 'Sedang') penalty += 6;
        else penalty += 10;
      } else {
        // Baru
        activeReports += 1;
        if (r.severity === 'Ringan') penalty += 5;
        else if (r.severity === 'Sedang') penalty += 9;
        else penalty += 15;
      }
    }

    const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
    let category: KelurahanScore['category'] = 'Baik';
    if (score < 60) category = 'Kritis';
    else if (score < 80) category = 'Perlu Perhatian';

    let dominantIssue: IssueType | null = null;
    let maxIssueCount = 0;
    for (const meta of ISSUE_TYPE_LIST) {
      const count = issueCounter[meta.id] || 0;
      if (count > maxIssueCount) {
        maxIssueCount = count;
        dominantIssue = meta.id;
      }
    }

    return {
      kelurahan,
      score,
      category,
      totalReports: kelReports.length,
      activeReports,
      resolvedReports,
      reportsLast7Days,
      hasSurgeAlert: reportsLast7Days >= 5,
      dominantIssue,
    };
  });
}

export interface DailyTrendPoint {
  dateKey: string;
  label: string;
  incoming: number;
  resolved: number;
}

export function computeWeeklyTrend(reports: EnvReport[], nowMs: number = Date.now()): DailyTrendPoint[] {
  const days: DailyTrendPoint[] = [];
  const dayFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric' });

  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(nowMs - offset * 24 * 60 * 60 * 1000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateKey = `${yyyy}-${mm}-${dd}`;
    const label = dayFormatter.format(d);

    let incoming = 0;
    let resolved = 0;

    for (const r of reports) {
      const created = new Date(r.createdAt);
      const cKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}-${String(created.getDate()).padStart(2, '0')}`;
      if (cKey === dateKey) {
        incoming += 1;
      }
      if (r.status === 'Selesai') {
        const updated = new Date(r.updatedAt);
        const uKey = `${updated.getFullYear()}-${String(updated.getMonth() + 1).padStart(2, '0')}-${String(updated.getDate()).padStart(2, '0')}`;
        if (uKey === dateKey) {
          resolved += 1;
        }
      }
    }

    days.push({ dateKey, label, incoming, resolved });
  }

  return days;
}

export function formatDateId(isoDate: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate));
}

export function formatDateTimeId(isoDate: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

export function formatRelativeTimeId(isoDate: string, nowMs: number = Date.now()): string {
  const diffMs = nowMs - new Date(isoDate).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDateId(isoDate);
}

export function summarizeByKecamatan(
  reports: EnvReport[],
  kecamatan: KecamatanName
): { total: number; active: number; resolved: number } {
  const filtered = reports.filter((r) => r.kecamatan === kecamatan);
  const resolved = filtered.filter((r) => r.status === 'Selesai').length;
  return {
    total: filtered.length,
    active: filtered.length - resolved,
    resolved,
  };
}
