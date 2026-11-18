import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  FileWarning,
  Search,
  TrendingUp,
} from 'lucide-react';
import {
  ISSUE_TYPE_LIST,
  ISSUE_TYPE_META,
  KECAMATAN_LIST,
  STATUS_META,
} from '../data/purwokerto';
import {
  EnvReport,
  IssueType,
  KecamatanName,
  KelurahanScore,
  ReportStatus,
} from '../types/env';
import { computeWeeklyTrend, formatRelativeTimeId } from '../utils/scoring';
import { IssueTypeIcon, SeverityText } from './IssueIcons';

interface OfficerDashboardViewProps {
  reports: EnvReport[];
  kelurahanScores: KelurahanScore[];
  onQuickStatusChange: (reportId: string, nextStatus: ReportStatus) => void;
  onSelectReport: (report: EnvReport) => void;
  initialKelurahanFilter?: string;
}

export const OfficerDashboardView: React.FC<OfficerDashboardViewProps> = ({
  reports,
  kelurahanScores,
  onQuickStatusChange,
  onSelectReport,
  initialKelurahanFilter = 'all',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');
  const [issueFilter, setIssueFilter] = useState<'all' | IssueType>('all');
  const [kecamatanFilter, setKecamatanFilter] = useState<'all' | KecamatanName>('all');
  const [kelurahanFilter, setKelurahanFilter] = useState<string>(initialKelurahanFilter);

  // Sync external kelurahan filter click (e.g., from Surge Alert Banner)
  React.useEffect(() => {
    setKelurahanFilter(initialKelurahanFilter);
  }, [initialKelurahanFilter]);

  const summary = useMemo(() => {
    const total = reports.length;
    const baru = reports.filter((r) => r.status === 'Baru').length;
    const diproses = reports.filter((r) => r.status === 'Diproses').length;
    const selesai = reports.filter((r) => r.status === 'Selesai').length;
    const resolutionRate = total > 0 ? Math.round((selesai / total) * 100) : 0;

    const issueCounts = ISSUE_TYPE_LIST.map((meta) => ({
      meta,
      count: reports.filter((r) => r.issueType === meta.id).length,
    })).sort((a, b) => b.count - a.count);

    const dirtiestKelurahan = [...kelurahanScores].sort(
      (a, b) => a.score - b.score || b.activeReports - a.activeReports
    )[0];

    return {
      total,
      baru,
      diproses,
      selesai,
      active: baru + diproses,
      resolutionRate,
      topIssue: issueCounts[0],
      issueCounts,
      dirtiestKelurahan,
    };
  }, [reports, kelurahanScores]);

  const weeklyTrend = useMemo(() => computeWeeklyTrend(reports), [reports]);
  const maxTrendVal = Math.max(
    4,
    ...weeklyTrend.map((d) => Math.max(d.incoming, d.resolved))
  );

  const dirtiestTop5 = useMemo(
    () =>
      [...kelurahanScores]
        .sort((a, b) => a.score - b.score || b.activeReports - a.activeReports)
        .slice(0, 5),
    [kelurahanScores]
  );

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reports.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (issueFilter !== 'all' && r.issueType !== issueFilter) return false;
      if (kecamatanFilter !== 'all' && r.kecamatan !== kecamatanFilter) return false;
      if (kelurahanFilter !== 'all' && r.kelurahanId !== kelurahanFilter) return false;
      if (q) {
        const hay = `${r.id} ${r.kelurahanName} ${r.kecamatan} ${r.addressNote} ${r.description} ${r.reporterName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reports, searchQuery, statusFilter, issueFilter, kecamatanFilter, kelurahanFilter]);

  return (
    <section className="space-y-6">
      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Laporan Masuk</span>
            <FileWarning className="w-4 h-4 text-green-700" aria-hidden="true" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {summary.total}
          </div>
          <div className="mt-1 text-xs text-slate-600 tabular-nums">
            {summary.active} aktif · {summary.selesai} selesai ({summary.resolutionRate}%)
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Antrean Baru &amp; Diproses</span>
            <Clock className="w-4 h-4 text-orange-600" aria-hidden="true" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {summary.active}
          </div>
          <div className="mt-1 text-xs text-slate-600 tabular-nums">
            <span className="text-orange-700 font-semibold">{summary.baru} Baru</span> ·{' '}
            <span className="text-sky-700 font-semibold">{summary.diproses} Diproses</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Jenis Masalah Terbanyak</span>
            <BarChart3 className="w-4 h-4 text-green-700" aria-hidden="true" />
          </div>
          <div className="mt-2 text-lg font-bold text-slate-900 truncate">
            {summary.topIssue ? summary.topIssue.meta.label : '-'}
          </div>
          <div className="mt-1 text-xs text-slate-600 tabular-nums">
            {summary.topIssue ? `${summary.topIssue.count} dari ${summary.total} laporan` : ''}
          </div>
        </div>

        <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4">
          <div className="flex items-center justify-between text-xs text-orange-900 font-medium">
            <span>Kelurahan Terkotor / Prioritas</span>
            <AlertTriangle className="w-4 h-4 text-orange-600" aria-hidden="true" />
          </div>
          <div className="mt-2 text-lg font-bold text-slate-900 truncate">
            {summary.dirtiestKelurahan ? `Kel. ${summary.dirtiestKelurahan.kelurahan.name}` : '-'}
          </div>
          <div className="mt-1 text-xs text-orange-900 tabular-nums">
            {summary.dirtiestKelurahan
              ? `Skor ${summary.dirtiestKelurahan.score}/100 · ${summary.dirtiestKelurahan.activeReports} laporan aktif`
              : ''}
          </div>
        </div>
      </div>

      {/* Charts Row: Weekly Trend + Top Issue Types + Dirtiest Kelurahan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Grafik Tren Mingguan */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-green-700" aria-hidden="true" />
                  <span>Grafik Tren 7 Hari Terakhir</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbandingan laporan masuk dan laporan selesai harian
                </p>
              </div>
            </div>

            <div className="mt-5 h-44 flex items-end justify-between gap-2 pt-4 border-b border-slate-100">
              {weeklyTrend.map((point) => {
                const inPct = Math.round((point.incoming / maxTrendVal) * 100);
                const resPct = Math.round((point.resolved / maxTrendVal) * 100);
                return (
                  <div
                    key={point.dateKey}
                    className="flex-1 flex flex-col items-center h-full justify-end group"
                  >
                    <div className="w-full flex items-end justify-center gap-1 h-32">
                      <div
                        title={`Masuk: ${point.incoming}`}
                        className="w-3 sm:w-3.5 rounded-t bg-orange-500 transition-all duration-300"
                        style={{ height: `${Math.max(point.incoming > 0 ? 10 : 3, inPct)}%` }}
                      />
                      <div
                        title={`Selesai: ${point.resolved}`}
                        className="w-3 sm:w-3.5 rounded-t bg-green-600 transition-all duration-300"
                        style={{ height: `${Math.max(point.resolved > 0 ? 10 : 3, resPct)}%` }}
                      />
                    </div>
                    <div className="mt-2 text-[10px] sm:text-[11px] font-medium text-slate-600 tabular-nums text-center whitespace-nowrap">
                      {point.label.split(',')[0]}
                    </div>
                    <div className="text-[10px] text-slate-400 tabular-nums">
                      {point.incoming}/{point.resolved}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" aria-hidden="true" />
                Laporan Masuk
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-green-600" aria-hidden="true" />
                Diselesaikan
              </span>
            </div>
            <span className="text-slate-400 tabular-nums">Maks {maxTrendVal}/hari</span>
          </div>
        </div>

        {/* Jenis Masalah Terbanyak */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Jenis Masalah Terbanyak</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribusi seluruh laporan</p>

            <div className="mt-4 space-y-3.5">
              {summary.issueCounts.map(({ meta, count }) => {
                const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
                return (
                  <div key={meta.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 inline-flex items-center gap-1.5 truncate">
                        <IssueTypeIcon type={meta.id} className="w-3.5 h-3.5 text-slate-600" />
                        <span>{meta.shortLabel}</span>
                      </span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: meta.markerColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Total 4 kategori sanitasi utama Purwokerto
          </div>
        </div>

        {/* 5 Kelurahan Terkotor */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Kelurahan Prioritas Penanganan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Klik untuk filter daftar laporan</p>
            </div>
            {kelurahanFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setKelurahanFilter('all')}
                className="text-xs font-semibold text-green-700 hover:text-green-800 cursor-pointer"
              >
                Semua Kel.
              </button>
            )}
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {dirtiestTop5.map((item) => {
              const selected = kelurahanFilter === item.kelurahan.id;
              return (
                <button
                  key={item.kelurahan.id}
                  type="button"
                  onClick={() =>
                    setKelurahanFilter(selected ? 'all' : item.kelurahan.id)
                  }
                  className={`w-full py-2.5 px-2 -mx-2 rounded-lg flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                    selected ? 'bg-green-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1.5">
                      <span>Kel. {item.kelurahan.name}</span>
                      {item.hasSurgeAlert && (
                        <AlertTriangle
                          className="w-3.5 h-3.5 text-orange-600 shrink-0"
                          aria-label="Lonjakan >=5 laporan 7 hari"
                        />
                      )}
                    </div>
                    <div className="text-xs text-slate-500 tabular-nums">
                      {item.activeReports} aktif · {item.reportsLast7Days} dlm 7 hari
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        item.score < 60
                          ? 'text-red-700'
                          : item.score < 80
                          ? 'text-orange-700'
                          : 'text-green-700'
                      }`}
                    >
                      Skor {item.score}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Officer Queue / Report Management Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Kelola Status Laporan Kelurahan
              </h3>
              <p className="text-xs text-slate-500">
                Ubah status laporan secara langsung atau buka detail untuk menambah catatan tindak lanjut
              </p>
            </div>
            <div className="text-xs text-slate-600 tabular-nums">
              Menampilkan <strong className="text-slate-900">{filteredReports.length}</strong> laporan
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode laporan, kelurahan, alamat, atau pelapor..."
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter Status Petugas"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | ReportStatus)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="all">Semua Status</option>
                <option value="Baru">Baru</option>
                <option value="Diproses">Diproses</option>
                <option value="Selesai">Selesai</option>
              </select>

              <select
                aria-label="Filter Jenis Masalah Petugas"
                value={issueFilter}
                onChange={(e) => setIssueFilter(e.target.value as 'all' | IssueType)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="all">Semua Masalah</option>
                {ISSUE_TYPE_LIST.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter Kecamatan Petugas"
                value={kecamatanFilter}
                onChange={(e) => setKecamatanFilter(e.target.value as 'all' | KecamatanName)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="all">Semua Kecamatan</option>
                {KECAMATAN_LIST.map((kec) => (
                  <option key={kec} value={kec}>
                    {kec}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Responsive Table / Mobile List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                <th className="py-3 px-4">Laporan &amp; Lokasi</th>
                <th className="py-3 px-3">Keparahan</th>
                <th className="py-3 px-3">Waktu</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Ubah Status / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-slate-500">
                    Tidak ada laporan yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const meta = ISSUE_TYPE_META[report.issueType];
                  const stMeta = STATUS_META[report.status];
                  return (
                    <tr key={report.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 max-w-md">
                        <div className="flex items-start gap-2.5">
                          <span
                            className="mt-1.5 w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: meta.markerColor }}
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                              <span className="font-mono tabular-nums font-medium text-slate-700">
                                {report.id}
                              </span>
                              <span>·</span>
                              <span className="font-semibold text-slate-800">
                                Kel. {report.kelurahanName}
                              </span>
                              <span>·</span>
                              <span>{report.kecamatan}</span>
                              {report.isSimulated && (
                                <>
                                  <span>·</span>
                                  <span className="text-slate-600 font-medium">Simulasi</span>
                                </>
                              )}
                            </div>
                            <div className="font-semibold text-slate-900 mt-0.5">
                              {meta.label}
                            </div>
                            <div className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                              {report.addressNote}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-xs">
                        <SeverityText severity={report.severity} />
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-xs text-slate-500 tabular-nums">
                        {formatRelativeTimeId(report.createdAt)}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-xs">
                        <span className={stMeta.textClass}>{report.status}</span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {report.status === 'Baru' && (
                            <button
                              type="button"
                              onClick={() => onQuickStatusChange(report.id, 'Diproses')}
                              className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100 transition-colors cursor-pointer"
                            >
                              Proses
                            </button>
                          )}
                          {report.status !== 'Selesai' && (
                            <button
                              type="button"
                              onClick={() => onQuickStatusChange(report.id, 'Selesai')}
                              className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-100 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Selesaikan</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectReport(report)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
