import React, { useState } from 'react';
import { CheckCircle2, Clock, MapPin, User, X } from 'lucide-react';
import { ISSUE_TYPE_META, STATUS_META } from '../data/purwokerto';
import { EnvReport, ReportStatus, UserRole } from '../types/env';
import { formatDateTimeId } from '../utils/scoring';
import { IssueTypeIcon, ReportPhoto, SeverityText, StatusIcon } from './IssueIcons';

interface ReportDetailDrawerProps {
  report: EnvReport | null;
  role: UserRole;
  onClose: () => void;
  onUpdateStatus: (reportId: string, nextStatus: ReportStatus, note: string) => void;
}

export const ReportDetailDrawer: React.FC<ReportDetailDrawerProps> = ({
  report,
  role,
  onClose,
  onUpdateStatus,
}) => {
  const [officerNote, setOfficerNote] = useState('');
  const [selectedNextStatus, setSelectedNextStatus] = useState<ReportStatus | null>(null);

  if (!report) return null;

  const meta = ISSUE_TYPE_META[report.issueType];
  const statusMeta = STATUS_META[report.status];
  const targetStatus = selectedNextStatus ?? report.status;

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;
    onUpdateStatus(
      report.id,
      targetStatus,
      officerNote.trim() ||
        (targetStatus === 'Diproses'
          ? 'Petugas kelurahan menindaklanjuti laporan ke lokasi.'
          : targetStatus === 'Selesai'
          ? 'Penanganan selesai dilakukan di lapangan.'
          : 'Status dikembalikan ke antrean laporan baru.')
    );
    setOfficerNote('');
    setSelectedNextStatus(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-detail-title"
    >
      <div
        className="w-full max-w-lg bg-white h-full overflow-y-auto border-l border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
              <span>{report.id}</span>
              <span aria-hidden="true">·</span>
              <span>{report.isSimulated ? 'Data Simulasi' : 'Laporan Warga'}</span>
            </div>
            <h2
              id="report-detail-title"
              className="text-base font-bold text-slate-900 truncate mt-0.5"
            >
              {meta.label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail laporan"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 space-y-6">
          {/* Photo preview */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <ReportPhoto
              src={report.photoUrl}
              alt={`Foto ${meta.label} di ${report.kelurahanName}`}
              issueType={report.issueType}
              className="w-full h-56 object-cover"
            />
          </div>

          {/* Clean unboxed summary metadata */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="inline-flex items-center gap-2 text-sm">
                <IssueTypeIcon type={report.issueType} className="w-4 h-4 text-slate-700" />
                <span className="font-semibold text-slate-900">{meta.label}</span>
              </div>
              <div className={`inline-flex items-center gap-1.5 text-sm ${statusMeta.textClass}`}>
                <StatusIcon status={report.status} className="w-4 h-4" />
                <span>Status: {report.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <div className="font-semibold text-slate-900">
                    Kel. {report.kelurahanName}, Kec. {report.kecamatan}
                  </div>
                  <div className="text-slate-600 mt-0.5">{report.addressNote}</div>
                  <div className="font-mono text-[11px] text-slate-400 mt-1 tabular-nums">
                    {report.lat.toFixed(5)}, {report.lng.toFixed(5)}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <div className="font-semibold text-slate-900">Pelapor: {report.reporterName}</div>
                  <div className="mt-0.5">
                    <SeverityText severity={report.severity} />
                  </div>
                  <div className="text-slate-500 mt-0.5 tabular-nums">
                    Dilaporkan {formatDateTimeId(report.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-xs font-semibold text-slate-500 mb-1.5">Deskripsi Kondisi</h3>
              <p className="text-sm text-slate-800 leading-relaxed">{report.description}</p>
            </div>
          </div>

          {/* Officer Action Panel */}
          {role === 'petugas' && (
            <form
              onSubmit={handleSaveStatus}
              className="rounded-xl border border-green-200 bg-green-50/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Perbarui Status Penanganan
                </h3>
                <span className="text-xs text-green-800 font-medium">Akses Petugas</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['Baru', 'Diproses', 'Selesai'] as ReportStatus[]).map((st) => {
                  const active = (selectedNextStatus ?? report.status) === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedNextStatus(st)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? st === 'Selesai'
                            ? 'bg-green-700 text-white border-green-700'
                            : st === 'Diproses'
                            ? 'bg-sky-700 text-white border-sky-700'
                            : 'bg-orange-600 text-white border-orange-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>

              <div>
                <label
                  htmlFor="officer-note-input"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Catatan Tindak Lanjut (opsional)
                </label>
                <textarea
                  id="officer-note-input"
                  rows={2}
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  placeholder="Contoh: Tim PPSU menuju lokasi untuk pembersihan got..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              <button
                type="submit"
                disabled={(selectedNextStatus ?? report.status) === report.status && !officerNote.trim()}
                className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Simpan Perubahan Status
              </button>
            </form>
          )}

          {/* Status History Timeline */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Riwayat Perubahan Status ({report.history.length})
            </h3>
            <ol className="space-y-4">
              {report.history.map((item, index) => {
                const stMeta = STATUS_META[item.status];
                const isLast = index === report.history.length - 1;
                return (
                  <li key={`${item.status}-${item.timestamp}-${index}`} className="relative pl-6">
                    {!isLast && (
                      <span
                        className="absolute left-[7px] top-5 bottom-[-16px] w-px bg-slate-200"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className="absolute left-0 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2"
                      style={{ borderColor: stMeta.dotColor }}
                      aria-hidden="true"
                    >
                      {item.status === 'Selesai' ? (
                        <CheckCircle2 className="w-2.5 h-2.5 text-green-700" />
                      ) : (
                        <Clock className="w-2.5 h-2.5 text-slate-500" />
                      )}
                    </span>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className={stMeta.textClass}>{item.status}</span>
                      <span className="text-slate-500 tabular-nums">
                        {formatDateTimeId(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 mt-1">{item.note}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Oleh: {item.actor}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
