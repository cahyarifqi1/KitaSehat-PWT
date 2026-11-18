import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Camera, CheckCircle2, MapPin, Trash2, Upload, X } from 'lucide-react';
import {
  ISSUE_TYPE_LIST,
  KECAMATAN_LIST,
  KELURAHAN_LIST,
} from '../data/purwokerto';
import {
  EnvReport,
  IssueType,
  KecamatanName,
  SeverityLevel,
} from '../types/env';
import { IssueTypeIcon } from './IssueIcons';

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (newReport: Omit<EnvReport, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'history' | 'isSimulated'>) => void;
}

function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file foto'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('File bukan gambar yang valid'));
      img.onload = () => {
        const maxWidth = 800;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const ReportFormModal: React.FC<ReportFormModalProps> = ({
  isOpen,
  onClose,
  onSubmitReport,
}) => {
  const [issueType, setIssueType] = useState<IssueType>('sampah_liar');
  const [kecamatan, setKecamatan] = useState<KecamatanName>('Purwokerto Utara');
  const [kelurahanId, setKelurahanId] = useState<string>('grendeng');
  const [addressNote, setAddressNote] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>('Sedang');
  const [reporterName, setReporterName] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);
  const [photoFileName, setPhotoFileName] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: -7.4055,
    lng: 109.248,
  });
  const [errorMsg, setErrorMsg] = useState('');

  const miniMapRef = useRef<HTMLDivElement | null>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);
  const pinMarkerRef = useRef<L.CircleMarker | null>(null);

  const kelurahanOptions = KELURAHAN_LIST.filter((k) => k.kecamatan === kecamatan);

  // Sync kelurahan when kecamatan changes
  const handleKecamatanChange = (nextKec: KecamatanName) => {
    setKecamatan(nextKec);
    const first = KELURAHAN_LIST.find((k) => k.kecamatan === nextKec);
    if (first) {
      setKelurahanId(first.id);
      setCoords({ lat: first.lat, lng: first.lng });
    }
  };

  const handleKelurahanChange = (nextKelId: string) => {
    setKelurahanId(nextKelId);
    const kel = KELURAHAN_LIST.find((k) => k.id === nextKelId);
    if (kel) {
      setCoords({ lat: kel.lat, lng: kel.lng });
    }
  };

  // Initialize interactive mini-map pin picker when modal opens
  useEffect(() => {
    if (!isOpen || !miniMapRef.current) return;

    const map = L.map(miniMapRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const marker = L.circleMarker([coords.lat, coords.lng], {
      radius: 9,
      fillColor: '#15803D',
      color: '#FFFFFF',
      weight: 2.5,
      fillOpacity: 1,
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = Number(e.latlng.lat.toFixed(5));
      const lng = Number(e.latlng.lng.toFixed(5));
      setCoords({ lat, lng });
      marker.setLatLng([lat, lng]);
    });

    miniMapInstanceRef.current = map;
    pinMarkerRef.current = marker;

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 120);

    return () => {
      window.clearTimeout(timer);
      map.remove();
      miniMapInstanceRef.current = null;
      pinMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Pan mini map when kelurahan coordinates change
  useEffect(() => {
    if (!miniMapInstanceRef.current || !pinMarkerRef.current) return;
    pinMarkerRef.current.setLatLng([coords.lat, coords.lng]);
    miniMapInstanceRef.current.panTo([coords.lat, coords.lng]);
  }, [coords]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setPhotoPreview(dataUrl);
      setPhotoFileName(file.name);
      setErrorMsg('');
    } catch {
      setErrorMsg('Gagal memproses foto. Pastikan format JPG, PNG, atau WebP.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressNote.trim()) {
      setErrorMsg('Mohon isi patokan lokasi atau nama jalan.');
      return;
    }
    if (description.trim().length < 10) {
      setErrorMsg('Mohon tuliskan deskripsi kondisi minimal 10 karakter.');
      return;
    }

    const kel = KELURAHAN_LIST.find((k) => k.id === kelurahanId)!;
    onSubmitReport({
      issueType,
      kelurahanId: kel.id,
      kelurahanName: kel.name,
      kecamatan: kel.kecamatan,
      addressNote: addressNote.trim(),
      description: description.trim(),
      severity,
      lat: coords.lat,
      lng: coords.lng,
      reporterName: reporterName.trim() || 'Warga Purwokerto',
      photoUrl: photoPreview,
    });

    // Reset form
    setAddressNote('');
    setDescription('');
    setSeverity('Sedang');
    setPhotoPreview(undefined);
    setPhotoFileName('');
    setErrorMsg('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-3 sm:p-5 backdrop-blur-[1px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-form-title"
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 id="report-form-title" className="text-lg font-bold text-slate-900">
              Buat Laporan Lingkungan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Laporan warga tersimpan langsung dan muncul di peta pemantauan kelurahan
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form laporan"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {errorMsg && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-3.5 py-2.5 text-xs font-medium text-orange-900">
              {errorMsg}
            </div>
          )}

          {/* 1. Jenis Masalah */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-2">
              1. Jenis Masalah Lingkungan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ISSUE_TYPE_LIST.map((item) => {
                const selected = issueType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIssueType(item.id)}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                      selected
                        ? 'border-green-700 bg-green-50/70'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: item.markerColor }}
                    >
                      <IssueTypeIcon type={item.id} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {selected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-700 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Kecamatan & Kelurahan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="form-kecamatan"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                2. Kecamatan
              </label>
              <select
                id="form-kecamatan"
                value={kecamatan}
                onChange={(e) => handleKecamatanChange(e.target.value as KecamatanName)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                {KECAMATAN_LIST.map((kec) => (
                  <option key={kec} value={kec}>
                    Kec. {kec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="form-kelurahan"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Kelurahan
              </label>
              <select
                id="form-kelurahan"
                value={kelurahanId}
                onChange={(e) => handleKelurahanChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                {kelurahanOptions.map((kel) => (
                  <option key={kel.id} value={kel.id}>
                    Kel. {kel.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Lokasi Patokan & Titik Peta */}
          <div className="space-y-2">
            <label
              htmlFor="form-address"
              className="block text-xs font-semibold text-slate-800"
            >
              3. Alamat / Patokan Lokasi
            </label>
            <input
              id="form-address"
              type="text"
              value={addressNote}
              onChange={(e) => setAddressNote(e.target.value)}
              placeholder="Contoh: Jl. Kampus Gg. 2 depan pos ronda RT 03"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-green-700" aria-hidden="true" />
                  Klik pada peta untuk menyesuaikan titik lokasi
                </span>
                <span className="font-mono text-[11px] tabular-nums text-slate-500">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </span>
              </div>
              <div ref={miniMapRef} className="h-36 w-full" />
            </div>
          </div>

          {/* 4. Tingkat Keparahan */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-2">
              4. Tingkat Keparahan
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(
                [
                  {
                    value: 'Ringan',
                    hint: 'Gangguan kecil, tidak mendesak',
                  },
                  {
                    value: 'Sedang',
                    hint: 'Mengganggu warga / drainase',
                  },
                  {
                    value: 'Berat',
                    hint: 'Darurat bau / risiko banjir / DBD',
                  },
                ] as const
              ).map((lvl) => {
                const active = severity === lvl.value;
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setSeverity(lvl.value)}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                      active
                        ? lvl.value === 'Berat'
                          ? 'border-orange-600 bg-orange-50 text-orange-950'
                          : 'border-green-700 bg-green-50 text-green-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-semibold">{lvl.value}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {lvl.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Deskripsi & Nama Pelapor */}
          <div className="space-y-3">
            <div>
              <label
                htmlFor="form-description"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                5. Deskripsi Masalah
              </label>
              <textarea
                id="form-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan kondisi di lapangan, perkiraan sejak kapan terjadi, dan dampaknya ke sekitar..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div>
              <label
                htmlFor="form-reporter"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Nama Pelapor (opsional)
              </label>
              <input
                id="form-reporter"
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Contoh: Adi Nugroho (kosongkan jika anonim)"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
          </div>

          {/* 6. Upload Foto (Preview Saja) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              6. Upload Foto Kondisi (Preview Lokal, Opsional)
            </label>
            {photoPreview ? (
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                <img
                  src={photoPreview}
                  alt="Preview foto laporan"
                  className="w-full h-48 object-cover"
                />
                <div className="flex items-center justify-between gap-3 px-3 py-2 bg-white border-t border-slate-200 text-xs">
                  <span className="text-slate-600 truncate">
                    {photoFileName || 'Foto terlampir'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(undefined);
                      setPhotoFileName('');
                    }}
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-medium cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Hapus Foto</span>
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center hover:bg-slate-100/70 transition-colors cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 mb-2">
                  <Camera className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold text-slate-800 inline-flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-green-700" aria-hidden="true" />
                  Pilih atau Ambil Foto Kondisi
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  JPG, PNG, atau WebP · Disimpan sebagai preview lokal di browser
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              Kirim Laporan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
