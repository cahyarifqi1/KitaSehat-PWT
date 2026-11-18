import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpDown, Award, CheckCircle2, Info, MapPin } from 'lucide-react';
import { ISSUE_TYPE_META, KECAMATAN_LIST } from '../data/purwokerto';
import { KecamatanName, KelurahanScore } from '../types/env';

interface KelurahanScoresViewProps {
  scores: KelurahanScore[];
  onInspectKelurahanOnMap: (kelurahanId: string) => void;
}

export const KelurahanScoresView: React.FC<KelurahanScoresViewProps> = ({
  scores,
  onInspectKelurahanOnMap,
}) => {
  const [kecamatanFilter, setKecamatanFilter] = useState<'all' | KecamatanName>('all');
  const [sortBy, setSortBy] = useState<'lowest' | 'highest'>('lowest');

  const sortedAll = useMemo(() => {
    const filtered =
      kecamatanFilter === 'all'
        ? scores
        : scores.filter((s) => s.kelurahan.kecamatan === kecamatanFilter);

    return [...filtered].sort((a, b) => {
      if (sortBy === 'lowest') {
        if (a.score !== b.score) return a.score - b.score;
        return b.activeReports - a.activeReports;
      }
      if (b.score !== a.score) return b.score - a.score;
      return a.activeReports - b.activeReports;
    });
  }, [scores, kecamatanFilter, sortBy]);

  const cleanestTop3 = useMemo(
    () =>
      [...scores]
        .sort((a, b) => b.score - a.score || a.activeReports - b.activeReports)
        .slice(0, 3),
    [scores]
  );

  const dirtiestTop3 = useMemo(
    () =>
      [...scores]
        .sort((a, b) => a.score - b.score || b.activeReports - a.activeReports)
        .slice(0, 3),
    [scores]
  );

  const avgScore = useMemo(() => {
    if (scores.length === 0) return 100;
    return Math.round(scores.reduce((acc, s) => acc + s.score, 0) / scores.length);
  }, [scores]);

  return (
    <section className="space-y-6">
      {/* Summary & Peringkat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-green-800">
              Indeks Kesehatan Lingkungan Purwokerto
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-900 tabular-nums">{avgScore}</span>
              <span className="text-sm text-slate-500 font-medium">/ 100 rata-rata 27 kelurahan</span>
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Skor dihitung otomatis dari skor dasar 100 dikurangi beban laporan aktif (status Baru &amp; Diproses) serta tingkat keparahannya. Penanganan laporan yang selesai akan memulihkan skor kelurahan.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-600" aria-hidden="true" />
              80–100 Baik
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" aria-hidden="true" />
              60–79 Perhatian
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-600" aria-hidden="true" />
              &lt;60 Kritis
            </span>
          </div>
        </div>

        {/* Peringkat Terbersih vs Prioritas Penanganan */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-green-200 bg-green-50/40 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Award className="w-4 h-4 text-green-700" aria-hidden="true" />
              <span>Peringkat Terbersih (Top 3)</span>
            </div>
            <div className="mt-3 divide-y divide-green-200/70">
              {cleanestTop3.map((item, idx) => (
                <button
                  key={item.kelurahan.id}
                  type="button"
                  onClick={() => onInspectKelurahanOnMap(item.kelurahan.id)}
                  className="w-full py-2.5 flex items-center justify-between gap-2 text-left hover:bg-green-100/40 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      #{idx + 1} Kel. {item.kelurahan.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      Kec. {item.kelurahan.kecamatan} · {item.activeReports} laporan aktif
                    </div>
                  </div>
                  <span className="text-base font-bold text-green-700 tabular-nums shrink-0">
                    {item.score}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <AlertTriangle className="w-4 h-4 text-orange-600" aria-hidden="true" />
              <span>Prioritas Penanganan (Skor Terendah)</span>
            </div>
            <div className="mt-3 divide-y divide-orange-200/70">
              {dirtiestTop3.map((item, idx) => (
                <button
                  key={item.kelurahan.id}
                  type="button"
                  onClick={() => onInspectKelurahanOnMap(item.kelurahan.id)}
                  className="w-full py-2.5 flex items-center justify-between gap-2 text-left hover:bg-orange-100/50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      #{idx + 1} Kel. {item.kelurahan.name}
                    </div>
                    <div className="text-xs text-slate-600">
                      Kec. {item.kelurahan.kecamatan} · {item.activeReports} aktif ({item.reportsLast7Days}/7h)
                    </div>
                  </div>
                  <span
                    className={`text-base font-bold tabular-nums shrink-0 ${
                      item.score < 60 ? 'text-red-700' : 'text-orange-700'
                    }`}
                  >
                    {item.score}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setKecamatanFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              kecamatanFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua (27)
          </button>
          {KECAMATAN_LIST.map((kec) => (
            <button
              key={kec}
              type="button"
              onClick={() => setKecamatanFilter(kec)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                kecamatanFilter === kec
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {kec.replace('Purwokerto ', 'Pwt. ')}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSortBy(sortBy === 'lowest' ? 'highest' : 'lowest')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-green-700" aria-hidden="true" />
          <span>
            Urutan: {sortBy === 'lowest' ? 'Skor Terendah Dahulu' : 'Skor Tertinggi Dahulu'}
          </span>
        </button>
      </div>

      {/* Colored Kelurahan Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAll.map((item, idx) => {
          const isGood = item.score >= 80;
          const isWarn = item.score >= 60 && item.score < 80;

          const cardTheme = isGood
            ? 'border-green-200 bg-white'
            : isWarn
            ? 'border-orange-200 bg-orange-50/35'
            : 'border-red-200 bg-red-50/40';

          const barColor = isGood
            ? 'bg-green-600'
            : isWarn
            ? 'bg-orange-500'
            : 'bg-red-600';

          const scoreColor = isGood
            ? 'text-green-700'
            : isWarn
            ? 'text-orange-700'
            : 'text-red-700';

          return (
            <article
              key={item.kelurahan.id}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-colors ${cardTheme}`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500 tabular-nums">
                      Peringkat #{idx + 1} · Kec. {item.kelurahan.kecamatan}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5 truncate">
                      Kel. {item.kelurahan.name}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-2xl font-bold tabular-nums leading-none ${scoreColor}`}>
                      {item.score}
                    </div>
                    <div className={`text-[11px] font-semibold mt-1 inline-flex items-center gap-1 ${scoreColor}`}>
                      {isGood ? (
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                      )}
                      <span>{item.category}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>

                {/* Metrics */}
                <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <div className="text-slate-500">Aktif</div>
                    <div className="font-semibold text-slate-900 tabular-nums mt-0.5">
                      {item.activeReports} laporan
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Selesai</div>
                    <div className="font-semibold text-green-700 tabular-nums mt-0.5">
                      {item.resolvedReports} laporan
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">7 Hari</div>
                    <div
                      className={`font-semibold tabular-nums mt-0.5 ${
                        item.hasSurgeAlert ? 'text-orange-700' : 'text-slate-900'
                      }`}
                    >
                      {item.reportsLast7Days} masuk
                    </div>
                  </div>
                </div>

                {item.hasSurgeAlert && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-orange-800 bg-orange-100/80 border border-orange-200 rounded-lg px-2.5 py-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Peringatan: ≥5 laporan dalam 7 hari</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 truncate">
                  {item.dominantIssue
                    ? `Dominan: ${ISSUE_TYPE_META[item.dominantIssue].shortLabel}`
                    : 'Belum ada laporan'}
                </span>
                <button
                  type="button"
                  onClick={() => onInspectKelurahanOnMap(item.kelurahan.id)}
                  className="inline-flex items-center gap-1 font-semibold text-green-700 hover:text-green-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Lihat di Peta</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Formula Transparency Note */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-green-700 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong className="text-slate-900">Metode Perhitungan Skor:</strong> Setiap kelurahan memulai dari 100 poin. Laporan berstatus <em>Baru</em> mengurangi 5 (Ringan), 9 (Sedang), atau 15 (Berat) poin; status <em>Diproses</em> mengurangi 3, 6, atau 10 poin; laporan <em>Selesai</em> dalam 14 hari terakhir hanya menyisakan jejak 1 poin.
        </p>
      </div>
    </section>
  );
};
