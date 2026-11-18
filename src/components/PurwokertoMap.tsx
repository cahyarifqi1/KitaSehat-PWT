import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Filter, Layers, MapPin, RotateCcw } from 'lucide-react';
import {
  ISSUE_TYPE_LIST,
  ISSUE_TYPE_META,
  KECAMATAN_LIST,
  KELURAHAN_LIST,
  PURWOKERTO_CENTER,
  STATUS_META,
} from '../data/purwokerto';
import {
  EnvReport,
  IssueType,
  KecamatanName,
  KelurahanScore,
  ReportStatus,
} from '../types/env';
import { formatRelativeTimeId } from '../utils/scoring';

interface PurwokertoMapProps {
  reports: EnvReport[];
  kelurahanScores: KelurahanScore[];
  selectedKelurahanFilter: string;
  onSelectKelurahanFilter: (kelurahanId: string) => void;
  onSelectReport: (report: EnvReport) => void;
  onOpenReportForm: () => void;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getMarkerSvg(issueType: IssueType, status: ReportStatus): string {
  const meta = ISSUE_TYPE_META[issueType];
  const color = meta.markerColor;
  const isResolved = status === 'Selesai';
  const opacity = isResolved ? '0.68' : '1';

  let innerIcon = '';
  if (issueType === 'sampah_liar') {
    innerIcon = `<path d="M9 6h6m-7 3h8l-.7 7.5a1 1 0 0 1-1 .9H9.7a1 1 0 0 1-1-.9L8 9z" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  } else if (issueType === 'saluran_tersumbat') {
    innerIcon = `<path d="M8 10h8M8 14h8M10 7v10M14 7v10" stroke="white" stroke-width="1.6" stroke-linecap="round"/>`;
  } else if (issueType === 'genangan_air') {
    innerIcon = `<path d="M7.5 11.5c1.2-1 2.4-1 3.5 0s2.3 1 3.5 0M7.5 14.5c1.2-1 2.4-1 3.5 0s2.3 1 3.5 0" stroke="white" stroke-width="1.7" stroke-linecap="round" fill="none"/>`;
  } else {
    innerIcon = `<path d="M12 7.5s4 4.2 4 6.7a4 4 0 1 1-8 0c0-2.5 4-6.7 4-6.7z" stroke="white" stroke-width="1.6" fill="none"/>`;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="38" viewBox="0 0 24 30" style="opacity:${opacity}; filter: drop-shadow(0 2px 4px rgba(15,23,42,0.28));">
      <path d="M12 1C6.5 1 2 5.4 2 10.9c0 6.8 8.3 15.8 9.4 17a.8.8 0 0 0 1.2 0C13.7 26.7 22 17.7 22 10.9 22 5.4 17.5 1 12 1z" fill="${color}" stroke="#FFFFFF" stroke-width="1.6"/>
      <circle cx="12" cy="11" r="6.8" fill="rgba(255,255,255,0.14)"/>
      ${innerIcon}
      ${
        isResolved
          ? `<circle cx="18.5" cy="5.5" r="4.2" fill="#15803D" stroke="#FFFFFF" stroke-width="1.2"/>
             <path d="M16.7 5.5l1.2 1.2 2.4-2.4" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
          : status === 'Baru'
          ? `<circle cx="18.5" cy="5.5" r="3.4" fill="#EA580C" stroke="#FFFFFF" stroke-width="1.2"/>`
          : ''
      }
    </svg>
  `;
}

export const PurwokertoMap: React.FC<PurwokertoMapProps> = ({
  reports,
  kelurahanScores,
  selectedKelurahanFilter,
  onSelectKelurahanFilter,
  onSelectReport,
  onOpenReportForm,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  const [issueFilter, setIssueFilter] = useState<'all' | IssueType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');
  const [kecamatanFilter, setKecamatanFilter] = useState<'all' | KecamatanName>('all');

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (issueFilter !== 'all' && r.issueType !== issueFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (kecamatanFilter !== 'all' && r.kecamatan !== kecamatanFilter) return false;
      if (selectedKelurahanFilter !== 'all' && r.kelurahanId !== selectedKelurahanFilter) {
        return false;
      }
      return true;
    });
  }, [reports, issueFilter, statusFilter, kecamatanFilter, selectedKelurahanFilter]);

  // Keep latest onSelectReport accessible inside popup click handler
  const onSelectReportRef = useRef(onSelectReport);
  onSelectReportRef.current = onSelectReport;

  const filteredReportsRef = useRef(filteredReports);
  filteredReportsRef.current = filteredReports;

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: PURWOKERTO_CENTER,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markerLayerRef.current = layerGroup;

    // Handle popup button clicks via event delegation on map container
    const handleContainerClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest('[data-report-detail-id]') as HTMLElement | null;
      if (btn) {
        const id = btn.getAttribute('data-report-detail-id');
        const found = filteredReportsRef.current.find((r) => r.id === id);
        if (found) {
          onSelectReportRef.current(found);
        }
      }
    };

    const containerEl = mapContainerRef.current;
    containerEl.addEventListener('click', handleContainerClick);

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(containerEl);

    return () => {
      observer.disconnect();
      containerEl.removeEventListener('click', handleContainerClick);
      map.remove();
      mapInstanceRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  // Fly to selected kelurahan when filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedKelurahanFilter !== 'all') {
      const kel = KELURAHAN_LIST.find((k) => k.id === selectedKelurahanFilter);
      if (kel) {
        map.flyTo([kel.lat, kel.lng], 15, { duration: 0.6 });
      }
    } else if (kecamatanFilter !== 'all') {
      const kels = KELURAHAN_LIST.filter((k) => k.kecamatan === kecamatanFilter);
      if (kels.length > 0) {
        const avgLat = kels.reduce((acc, k) => acc + k.lat, 0) / kels.length;
        const avgLng = kels.reduce((acc, k) => acc + k.lng, 0) / kels.length;
        map.flyTo([avgLat, avgLng], 14, { duration: 0.6 });
      }
    }
  }, [selectedKelurahanFilter, kecamatanFilter]);

  // Update markers whenever filtered reports change
  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    for (const report of filteredReports) {
      const meta = ISSUE_TYPE_META[report.issueType];
      const statusMeta = STATUS_META[report.status];

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: getMarkerSvg(report.issueType, report.status),
        iconSize: [32, 38],
        iconAnchor: [16, 36],
        popupAnchor: [0, -34],
      });

      const marker = L.marker([report.lat, report.lng], { icon });

      const photoHtml = report.photoUrl
        ? `<img src="${escapeHtml(report.photoUrl)}" alt="${escapeHtml(meta.label)}" referrerpolicy="no-referrer" style="width:100%;height:112px;object-fit:cover;display:block;background:#f1f5f9;" />`
        : `<div style="height:56px;display:flex;align-items:center;gap:10px;padding:0 12px;background:#f8fafc;border-bottom:1px solid #f1f5f9;">
             <span style="width:28px;height:28px;border-radius:8px;background:${meta.markerColor};display:inline-flex;align-items:center;justify-content:center;color:#ffffff;font-size:12px;font-weight:700;">!</span>
             <span style="font-size:12px;font-weight:600;color:#334155;">${escapeHtml(meta.label)}</span>
           </div>`;

      const simLabel = report.isSimulated ? ' · Simulasi' : ' · Warga';

      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; color:#0f172a;">
          ${photoHtml}
          <div style="padding:12px;">
            <div style="font-size:11px; color:#64748b; margin-bottom:4px;">
              ${escapeHtml(report.id)} · Kel. ${escapeHtml(report.kelurahanName)}${simLabel}
            </div>
            <div style="font-size:13px; font-weight:700; color:#0f172a; margin-bottom:4px;">
              ${escapeHtml(meta.label)}
            </div>
            <div style="font-size:12px; color:#475569; line-height:1.45; margin-bottom:8px;">
              ${escapeHtml(
                report.description.length > 96
                  ? report.description.slice(0, 93) + '...'
                  : report.description
              )}
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; font-size:11px; padding-top:8px; border-top:1px solid #f1f5f9;">
              <span style="font-weight:600; color:${statusMeta.dotColor};">
                Status: ${escapeHtml(report.status)}
              </span>
              <span style="color:#64748b;">
                ${escapeHtml(formatRelativeTimeId(report.createdAt))}
              </span>
            </div>
            <button
              type="button"
              data-report-detail-id="${escapeHtml(report.id)}"
              style="margin-top:10px; width:100%; padding:8px 10px; border-radius:8px; background:#15803D; color:#FFFFFF; font-size:12px; font-weight:600; border:none; cursor:pointer;"
            >
              Lihat Detail &amp; Riwayat
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.addTo(layer);
    }
  }, [filteredReports]);

  const handleResetView = () => {
    setIssueFilter('all');
    setStatusFilter('all');
    setKecamatanFilter('all');
    onSelectKelurahanFilter('all');
    mapInstanceRef.current?.flyTo(PURWOKERTO_CENTER, 13, { duration: 0.6 });
  };

  const kelurahanInSelectedKecamatan = useMemo(() => {
    if (kecamatanFilter === 'all') return KELURAHAN_LIST;
    return KELURAHAN_LIST.filter((k) => k.kecamatan === kecamatanFilter);
  }, [kecamatanFilter]);

  const selectedKelScore = useMemo(() => {
    if (selectedKelurahanFilter === 'all') return null;
    return kelurahanScores.find((k) => k.kelurahan.id === selectedKelurahanFilter) ?? null;
  }, [selectedKelurahanFilter, kelurahanScores]);

  return (
    <section className="space-y-4">
      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 mr-1">
              <Filter className="w-3.5 h-3.5 text-green-700" aria-hidden="true" />
              Jenis Masalah
            </span>
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setIssueFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  issueFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({reports.length})
              </button>
              {ISSUE_TYPE_LIST.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIssueFilter(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    issueFilter === item.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: item.markerColor }}
                    aria-hidden="true"
                  />
                  <span>{item.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 mr-1">
              <Layers className="w-3.5 h-3.5 text-green-700" aria-hidden="true" />
              Status
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {(['all', 'Baru', 'Diproses', 'Selesai'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'all' ? 'Semua' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Filter Kecamatan"
              value={kecamatanFilter}
              onChange={(e) => {
                setKecamatanFilter(e.target.value as 'all' | KecamatanName);
                onSelectKelurahanFilter('all');
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="all">Semua Kecamatan (4)</option>
              {KECAMATAN_LIST.map((kec) => (
                <option key={kec} value={kec}>
                  Kec. {kec}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter Kelurahan"
              value={selectedKelurahanFilter}
              onChange={(e) => onSelectKelurahanFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="all">Semua Kelurahan ({kelurahanInSelectedKecamatan.length})</option>
              {kelurahanInSelectedKecamatan.map((kel) => (
                <option key={kel.id} value={kel.id}>
                  Kel. {kel.name}
                </option>
              ))}
            </select>

            {(issueFilter !== 'all' ||
              statusFilter !== 'all' ||
              kecamatanFilter !== 'all' ||
              selectedKelurahanFilter !== 'all') && (
              <button
                type="button"
                onClick={handleResetView}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset Peta</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-600 tabular-nums">
            Menampilkan <span className="font-semibold text-slate-900">{filteredReports.length}</span> dari{' '}
            <span className="font-semibold text-slate-900">{reports.length}</span> laporan
            {selectedKelScore && (
              <span>
                {' '}
                · Skor {selectedKelScore.kelurahan.name}:{' '}
                <strong
                  className={
                    selectedKelScore.score >= 80
                      ? 'text-green-700'
                      : selectedKelScore.score >= 60
                      ? 'text-orange-600'
                      : 'text-red-700'
                  }
                >
                  {selectedKelScore.score}/100
                </strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Map + Side Feed Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
          <div className="relative h-[420px] sm:h-[520px] w-full">
            <div ref={mapContainerRef} className="h-full w-full" />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/70 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-4">
              {ISSUE_TYPE_LIST.map((item) => (
                <div key={item.id} className="inline-flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-sm inline-block shrink-0"
                    style={{ backgroundColor: item.markerColor }}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="text-slate-500">
              Pusat peta: Kota Purwokerto · OpenStreetMap
            </div>
          </div>
        </div>

        {/* Recent Filtered Reports Sidebar */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white flex flex-col overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Laporan di Peta
              </h3>
              <p className="text-xs text-slate-500">
                Klik item untuk memusatkan peta atau melihat riwayat
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenReportForm}
              className="inline-flex items-center gap-1 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Lapor</span>
            </button>
          </div>

          <div className="flex-1 max-h-[460px] overflow-y-auto divide-y divide-slate-100">
            {filteredReports.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-slate-700">
                  Tidak ada laporan yang sesuai filter
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Coba ubah filter jenis masalah, status, atau pilih kelurahan lain.
                </p>
                <button
                  type="button"
                  onClick={handleResetView}
                  className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Tampilkan Semua
                </button>
              </div>
            ) : (
              filteredReports.map((report) => {
                const meta = ISSUE_TYPE_META[report.issueType];
                const statusMeta = STATUS_META[report.status];
                return (
                  <div
                    key={report.id}
                    className="p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500 font-mono tabular-nums">
                        {report.id} · Kel. {report.kelurahanName}
                        {report.isSimulated ? ' · Simulasi' : ''}
                      </span>
                      <span className={statusMeta.textClass}>{report.status}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span
                        className="mt-1.5 w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: meta.markerColor }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {meta.label}
                        </p>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                          {report.addressNote} — {report.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-slate-500">
                        {report.severity} · {formatRelativeTimeId(report.createdAt)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            mapInstanceRef.current?.flyTo([report.lat, report.lng], 16, {
                              duration: 0.5,
                            });
                          }}
                          className="text-slate-600 hover:text-green-700 font-medium cursor-pointer"
                        >
                          Fokus
                        </button>
                        <span className="text-slate-300" aria-hidden="true">
                          |
                        </span>
                        <button
                          type="button"
                          onClick={() => onSelectReport(report)}
                          className="text-green-700 hover:text-green-800 font-semibold cursor-pointer"
                        >
                          Detail
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
