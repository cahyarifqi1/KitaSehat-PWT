import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { KelurahanScore } from '../types/env';

interface SurgeAlertBannerProps {
  alertKelurahan: KelurahanScore[];
  onInspectKelurahan?: (kelurahanId: string) => void;
}

export const SurgeAlertBanner: React.FC<SurgeAlertBannerProps> = ({
  alertKelurahan,
  onInspectKelurahan,
}) => {
  if (alertKelurahan.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-xl border border-orange-200 bg-orange-50/90 px-4 py-3.5 text-slate-900"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700 border border-orange-200">
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-orange-950">
              Peringatan Dini Lonjakan Laporan (≥5 laporan dalam 7 hari)
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-orange-900/90 leading-relaxed">
              Wilayah berikut membutuhkan penanganan prioritas:{' '}
              {alertKelurahan.map((item, idx) => (
                <span key={item.kelurahan.id} className="font-semibold">
                  {idx > 0 ? ', ' : ''}
                  {item.kelurahan.name} ({item.reportsLast7Days} laporan · Skor{' '}
                  <span className="tabular-nums">{item.score}</span>)
                </span>
              ))}
              .
            </p>
          </div>
        </div>

        {onInspectKelurahan && (
          <div className="flex flex-wrap items-center gap-2 shrink-0 pl-11 sm:pl-0">
            {alertKelurahan.slice(0, 2).map((item) => (
              <button
                key={item.kelurahan.id}
                type="button"
                onClick={() => onInspectKelurahan(item.kelurahan.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300 bg-white px-3 py-2 text-xs font-semibold text-orange-800 hover:bg-orange-100/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Pantau {item.kelurahan.name}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
