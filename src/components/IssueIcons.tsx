import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Droplets,
  Trash2,
  Waves,
  Wrench,
} from 'lucide-react';
import { ISSUE_TYPE_META } from '../data/purwokerto';
import { IssueType, ReportStatus, SeverityLevel } from '../types/env';

export function IssueTypeIcon({
  type,
  className = 'w-4 h-4',
}: {
  type: IssueType;
  className?: string;
}) {
  switch (type) {
    case 'sampah_liar':
      return <Trash2 className={className} aria-hidden="true" />;
    case 'saluran_tersumbat':
      return <Wrench className={className} aria-hidden="true" />;
    case 'genangan_air':
      return <Waves className={className} aria-hidden="true" />;
    case 'air_bersih':
      return <Droplets className={className} aria-hidden="true" />;
  }
}

export function StatusIcon({
  status,
  className = 'w-3.5 h-3.5',
}: {
  status: ReportStatus;
  className?: string;
}) {
  switch (status) {
    case 'Baru':
      return <AlertTriangle className={className} aria-hidden="true" />;
    case 'Diproses':
      return <Clock className={className} aria-hidden="true" />;
    case 'Selesai':
      return <CheckCircle2 className={className} aria-hidden="true" />;
  }
}

export function SeverityText({ severity }: { severity: SeverityLevel }) {
  const colorClass =
    severity === 'Berat'
      ? 'text-red-700 font-semibold'
      : severity === 'Sedang'
      ? 'text-orange-700 font-medium'
      : 'text-slate-600 font-medium';

  return <span className={colorClass}>Keparahan {severity}</span>;
}

export function ReportPhoto({
  src,
  alt,
  issueType,
  className = 'w-full h-48 object-cover',
}: {
  src?: string;
  alt: string;
  issueType: IssueType;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const meta = ISSUE_TYPE_META[issueType];

  if (!src || failed) {
    const surfaceByType: Record<IssueType, string> = {
      sampah_liar: 'from-orange-50 via-amber-50/60 to-slate-50 text-orange-700',
      saluran_tersumbat: 'from-sky-50 via-cyan-50/60 to-slate-50 text-sky-700',
      genangan_air: 'from-red-50 via-orange-50/50 to-slate-50 text-red-700',
      air_bersih: 'from-teal-50 via-emerald-50/60 to-slate-50 text-teal-700',
    };

    return (
      <div
        className={`${className} flex flex-col items-center justify-center bg-gradient-to-br ${surfaceByType[issueType]} p-4 text-center`}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-xs mb-2"
          style={{ backgroundColor: meta.markerColor }}
        >
          <IssueTypeIcon type={issueType} className="w-6 h-6" />
        </div>
        <span className="text-xs font-semibold text-slate-800">{meta.label}</span>
        <span className="text-[11px] text-slate-500 mt-0.5">Ilustrasi Ikon Kategori</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
