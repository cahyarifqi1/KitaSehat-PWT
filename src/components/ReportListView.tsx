import React, { useMemo, useState } from 'react';
import { Clock, MapPin, Search } from 'lucide-react';
import { ISSUE_TYPE_LIST, ISSUE_TYPE_META, STATUS_META } from '../data/purwokerto';
import { EnvReport, IssueType, ReportStatus } from '../types/env';
import { formatRelativeTimeId } from '../utils/scoring';
import { ReportPhoto, SeverityText, StatusIcon } from './IssueIcons';

interface ReportListViewProps {
  reports: EnvReport[];
  onSelectReport: (report: EnvReport) => void;
  onOpenReportForm: () => void;
}

export const ReportListView: React.FC<ReportListViewProps> = ({
  reports,
  onSelectReport,
  onOpenReportForm,
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');
  const [issueFilter, setIssueFilter] = useState<'all' | IssueType>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (issueFilter !== 'all' && r.issueType !== issueFilter) return false;
      if (q) {
        const hay = `${r.id} ${r.kelurahanName} ${r.kecamatan} ${r.addressNote} ${r.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reports, query, statusFilter, issueFilter]);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari laporan berdasarkan kelurahan, jalan, atau deskripsi..."
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter Jenis"
            value={issueFilter}
            onChange={(e) => setIssueFilter(e.target.value as 'all' | IssueType)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="all">Semua Jenis</option>
            {ISSUE_TYPE_LIST.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ReportStatus)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="all">Semua Status</option>
            <option value="Baru">Baru</option>
            <option value="Diproses">Diproses</option>
            <option value="Selesai">Selesai</option>
          </select>

          <button
            type="button"
            onClick={onOpenReportForm}
            className="rounded-lg bg-green-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-green-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            + Lapor Baru
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-slate-800">
            Tidak ada laporan ditemukan
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Ubah kata kunci atau filter untuk melihat laporan warga lainnya.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((report) => {
            const meta = ISSUE_TYPE_META[report.issueType];
            const stMeta = STATUS_META[report.status];
            return (
              <article
                key={report.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between hover:border-green-300 transition-colors"
              >
                <div>
                  <div className="relative h-40 bg-slate-100 overflow-hidden">
                    <ReportPhoto
                      src={report.photoUrl}
                      alt={`${meta.label} di ${report.kelurahanName}`}
                      issueType={report.issueType}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono tabular-nums text-slate-500">
                        {report.id} · {report.isSimulated ? 'Simulasi' : 'Warga'}
                      </span>
                      <span className={`inline-flex items-center gap-1 ${stMeta.textClass}`}>
                        <StatusIcon status={report.status} className="w-3.5 h-3.5" />
                        <span>{report.status}</span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {meta.label}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-green-700 shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        Kel. {report.kelurahanName}, Kec. {report.kecamatan}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {report.addressNote} — {report.description}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <SeverityText severity={report.severity} />
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {formatRelativeTimeId(report.createdAt)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectReport(report)}
                    className="font-semibold text-green-700 hover:text-green-800 cursor-pointer whitespace-nowrap"
                  >
                    Riwayat →
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
