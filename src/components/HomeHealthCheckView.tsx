import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Home,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { HOME_HEALTH_QUESTIONS, KELURAHAN_LIST } from '../data/purwokerto';
import { HomeAnswerValue, HomeCheckSavedState } from '../types/env';
import { formatDateTimeId } from '../utils/scoring';

interface HomeHealthCheckViewProps {
  savedState: HomeCheckSavedState | null;
  onSaveResult: (result: HomeCheckSavedState) => void;
  onResetResult: () => void;
}

export const HomeHealthCheckView: React.FC<HomeHealthCheckViewProps> = ({
  savedState,
  onSaveResult,
  onResetResult,
}) => {
  const [answers, setAnswers] = useState<Record<string, HomeAnswerValue>>(
    savedState?.answers ?? {}
  );
  const [kelurahanId, setKelurahanId] = useState<string>(
    savedState?.kelurahanId ?? 'grendeng'
  );
  const [showResult, setShowResult] = useState<boolean>(Boolean(savedState));

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = HOME_HEALTH_QUESTIONS.length;
  const isComplete = answeredCount === totalQuestions;

  const computedScore = useMemo(() => {
    let total = 0;
    for (const q of HOME_HEALTH_QUESTIONS) {
      const val = answers[q.id];
      if (val === 'ya') total += 10;
      else if (val === 'sebagian') total += 5;
    }
    return total;
  }, [answers]);

  const recommendations = useMemo(() => {
    const items: Array<{
      id: string;
      category: string;
      priority: 'Tinggi' | 'Sedang';
      status: 'Sebagian' | 'Belum';
      advice: string;
    }> = [];

    for (const q of HOME_HEALTH_QUESTIONS) {
      const val = answers[q.id];
      if (val === 'tidak') {
        items.push({
          id: q.id,
          category: q.category,
          priority: q.priority,
          status: 'Belum',
          advice: q.recommendationIfNo,
        });
      } else if (val === 'sebagian') {
        items.push({
          id: q.id,
          category: q.category,
          priority: q.priority,
          status: 'Sebagian',
          advice: q.recommendationIfPartial,
        });
      }
    }

    return items.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === 'Tinggi' ? -1 : 1;
      if (a.status !== b.status) return a.status === 'Belum' ? -1 : 1;
      return 0;
    });
  }, [answers]);

  const handleSelectAnswer = (qId: string, val: HomeAnswerValue) => {
    const next = { ...answers, [qId]: val };
    setAnswers(next);
    if (showResult && Object.keys(next).length === totalQuestions) {
      let total = 0;
      for (const q of HOME_HEALTH_QUESTIONS) {
        if (next[q.id] === 'ya') total += 10;
        else if (next[q.id] === 'sebagian') total += 5;
      }
      onSaveResult({
        answers: next,
        kelurahanId,
        completedAt: new Date().toISOString(),
        score: total,
      });
    }
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;
    setShowResult(true);
    onSaveResult({
      answers,
      kelurahanId,
      completedAt: new Date().toISOString(),
      score: computedScore,
    });
  };

  const handleReset = () => {
    setAnswers({});
    setShowResult(false);
    onResetResult();
  };

  const scoreClassification =
    computedScore >= 85
      ? {
          title: 'Rumah Sehat Mandiri',
          desc: 'Sanitasi rumah Anda sudah memenuhi standar kesehatan lingkungan. Pertahankan kebiasaan 3M Plus dan pemilahan sampah.',
          colorClass: 'text-green-700',
          borderClass: 'border-green-200 bg-green-50/60',
        }
      : computedScore >= 60
      ? {
          title: 'Cukup Sehat — Perlu Pembenahan',
          desc: 'Sebagian aspek sanitasi sudah baik, namun beberapa titik berisiko memicu genangan, vektor penyakit, atau pencemaran air.',
          colorClass: 'text-orange-700',
          borderClass: 'border-orange-200 bg-orange-50/60',
        }
      : {
          title: 'Perlu Perbaikan Sanitasi Segera',
          desc: 'Kondisi sanitasi rumah memiliki beberapa risiko kesehatan lingkungan tinggi. Prioritaskan saran perbaikan bertanda Prioritas Tinggi di bawah.',
          colorClass: 'text-red-700',
          borderClass: 'border-red-200 bg-red-50/60',
        };

  return (
    <section className="space-y-6">
      {/* Intro & Progress Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 border border-green-200 text-green-700">
            <Home className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Cek Rumah Sehat (10 Indikator Sanitasi)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Evaluasi mandiri kondisi air, limbah, sampah, ventilasi, dan pencegahan nyamuk di rumah Anda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-xs text-slate-500">Terisi</div>
            <div className="text-sm font-bold text-slate-900 tabular-nums">
              {answeredCount} / {totalQuestions} pertanyaan
            </div>
          </div>
          {answeredCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Ulangi</span>
            </button>
          )}
        </div>
      </div>

      {/* Result Banner (Shown when completed) */}
      {showResult && isComplete && (
        <div className={`rounded-xl border p-5 space-y-5 ${scoreClassification.borderClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {computedScore >= 85 ? (
                  <ShieldCheck className="w-7 h-7 text-green-700" aria-hidden="true" />
                ) : (
                  <AlertTriangle
                    className={`w-7 h-7 ${
                      computedScore >= 60 ? 'text-orange-600' : 'text-red-600'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div>
                <div className="text-xs text-slate-600">
                  Hasil Evaluasi Rumah · Kel.{' '}
                  {KELURAHAN_LIST.find((k) => k.id === kelurahanId)?.name ?? 'Purwokerto'}
                  {savedState?.completedAt && ` · ${formatDateTimeId(savedState.completedAt)}`}
                </div>
                <h3 className={`text-xl font-bold mt-0.5 ${scoreClassification.colorClass}`}>
                  {scoreClassification.title}
                </h3>
                <p className="text-sm text-slate-700 mt-1 max-w-2xl">
                  {scoreClassification.desc}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 px-5 py-3 text-center shrink-0">
              <div className="text-xs text-slate-500 font-medium">Skor Rumah</div>
              <div className={`text-3xl font-bold tabular-nums ${scoreClassification.colorClass}`}>
                {computedScore}
                <span className="text-sm font-medium text-slate-400">/100</span>
              </div>
            </div>
          </div>

          {/* Saran Perbaikan Otomatis */}
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                Saran Perbaikan Otomatis ({recommendations.length} poin)
              </h4>
              <span className="text-xs text-slate-500">Diurutkan berdasarkan prioritas</span>
            </div>

            {recommendations.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-800 py-2">
                <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" aria-hidden="true" />
                <span>
                  Luar biasa! Seluruh 10 indikator sanitasi rumah Anda telah terpenuhi dengan baik.
                </span>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recommendations.map((rec) => (
                  <li key={rec.id} className="py-3 first:pt-1 last:pb-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                      <span className="font-semibold text-slate-900">{rec.category}</span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span
                        className={
                          rec.priority === 'Tinggi'
                            ? 'font-semibold text-orange-700'
                            : 'text-slate-600'
                        }
                      >
                        Prioritas {rec.priority}
                      </span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-slate-500">Kondisi: {rec.status}</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{rec.advice}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Checklist Form */}
      <form onSubmit={handleCalculate} className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label htmlFor="home-kelurahan" className="text-sm font-semibold text-slate-800">
            Lokasi Kelurahan Rumah Anda
          </label>
          <select
            id="home-kelurahan"
            value={kelurahanId}
            onChange={(e) => setKelurahanId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-600 sm:w-72"
          >
            {KELURAHAN_LIST.map((kel) => (
              <option key={kel.id} value={kel.id}>
                Kel. {kel.name} ({kel.kecamatan})
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {HOME_HEALTH_QUESTIONS.map((q, index) => {
            const current = answers[q.id];
            return (
              <div key={q.id} className="p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">
                      <span className="font-mono tabular-nums text-green-700 font-semibold">
                        {String(index + 1).padStart(2, '0')}.
                      </span>{' '}
                      {q.category} · Prioritas {q.priority}
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 mt-1">
                      {q.question}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{q.guidance}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {(
                    [
                      { value: 'ya', label: 'Ya, Memenuhi', pts: '+10' },
                      { value: 'sebagian', label: 'Sebagian', pts: '+5' },
                      { value: 'tidak', label: 'Belum', pts: '0' },
                    ] as const
                  ).map((opt) => {
                    const selected = current === opt.value;
                    const activeClass =
                      opt.value === 'ya'
                        ? 'border-green-700 bg-green-50 text-green-900'
                        : opt.value === 'sebagian'
                        ? 'border-orange-500 bg-orange-50 text-orange-900'
                        : 'border-red-600 bg-red-50 text-red-900';
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelectAnswer(q.id, opt.value)}
                        className={`rounded-lg border px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                          selected
                            ? activeClass
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs sm:text-sm text-slate-600">
            {isComplete ? (
              <span className="text-green-700 font-semibold">
                Semua 10 pertanyaan sudah dijawab. Klik hitung untuk melihat hasil &amp; saran.
              </span>
            ) : (
              <span>
                Lengkapi{' '}
                <strong className="text-slate-900 tabular-nums">
                  {totalQuestions - answeredCount} pertanyaan lagi
                </strong>{' '}
                untuk menghitung skor kesehatan rumah Anda.
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!isComplete}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
            <span>Hitung Skor &amp; Saran</span>
          </button>
        </div>
      </form>
    </section>
  );
};
