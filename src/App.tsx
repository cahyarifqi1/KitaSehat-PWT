import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Home,
  Info,
  Map as MapIcon,
  Plus,
  RotateCcw,
  Shield,
  Users,
} from 'lucide-react';
import { HomeHealthCheckView } from './components/HomeHealthCheckView';
import { KelurahanScoresView } from './components/KelurahanScoresView';
import { OfficerDashboardView } from './components/OfficerDashboardView';
import { PurwokertoMap } from './components/PurwokertoMap';
import { ReportDetailDrawer } from './components/ReportDetailDrawer';
import { ReportFormModal } from './components/ReportFormModal';
import { ReportListView } from './components/ReportListView';
import { SurgeAlertBanner } from './components/SurgeAlertBanner';
import { buildSimulatedReports, STORAGE_KEYS } from './data/seedReports';
import {
  EnvReport,
  HomeCheckSavedState,
  ReportStatus,
  UserRole,
} from './types/env';
import { computeKelurahanScores } from './utils/scoring';

type ActiveTab = 'peta' | 'skor' | 'rumah' | 'daftar' | 'dashboard';

function loadInitialReports(): EnvReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (raw) {
      const parsed = JSON.parse(raw) as EnvReport[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const freshSim = buildSimulatedReports();
        const freshSimMap = new Map(freshSim.map((item) => [item.id, item]));
        return parsed.map((r) => {
          const nextId = r.id.startsWith('BKP-') ? r.id.replace(/^BKP-/, 'PWK-') : r.id;
          if (r.isSimulated) {
            const matched = freshSimMap.get(nextId);
            if (matched) {
              return {
                ...r,
                id: nextId,
                photoUrl: matched.photoUrl,
              };
            }
          }
          return { ...r, id: nextId };
        });
      }
    }
  } catch {
    // Fallback to simulated data
  }
  return buildSimulatedReports();
}

function loadInitialRole(): UserRole {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    if (saved === 'warga' || saved === 'petugas') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'warga';
}

function loadInitialHomeCheck(): HomeCheckSavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOME_CHECK);
    if (raw) {
      return JSON.parse(raw) as HomeCheckSavedState;
    }
  } catch {
    // ignore
  }
  return null;
}

export default function App() {
  const [role, setRole] = useState<UserRole>(loadInitialRole);
  const [activeTab, setActiveTab] = useState<ActiveTab>(() =>
    loadInitialRole() === 'petugas' ? 'dashboard' : 'peta'
  );
  const [reports, setReports] = useState<EnvReport[]>(loadInitialReports);
  const [homeCheckState, setHomeCheckState] = useState<HomeCheckSavedState | null>(
    loadInitialHomeCheck
  );

  const [selectedMapKelurahan, setSelectedMapKelurahan] = useState<string>('all');
  const [officerKelurahanFilter, setOfficerKelurahanFilter] = useState<string>('all');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    } catch {
      // ignore storage quota errors
    }
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ROLE, role);
    } catch {
      // ignore
    }
  }, [role]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const kelurahanScores = useMemo(() => computeKelurahanScores(reports), [reports]);

  const surgeAlertKelurahan = useMemo(
    () =>
      kelurahanScores
        .filter((s) => s.hasSurgeAlert)
        .sort((a, b) => b.reportsLast7Days - a.reportsLast7Days || a.score - b.score),
    [kelurahanScores]
  );

  const selectedReport = useMemo(
    () => reports.find((r) => r.id === selectedReportId) ?? null,
    [reports, selectedReportId]
  );

  const simulatedCount = useMemo(
    () => reports.filter((r) => r.isSimulated).length,
    [reports]
  );

  const handleRoleSwitch = (nextRole: UserRole) => {
    setRole(nextRole);
    if (nextRole === 'petugas' && activeTab === 'rumah') {
      setActiveTab('dashboard');
    } else if (nextRole === 'petugas') {
      setActiveTab('dashboard');
    } else if (nextRole === 'warga' && activeTab === 'dashboard') {
      setActiveTab('peta');
    }
  };

  const handleSubmitNewReport = (
    payload: Omit<
      EnvReport,
      'id' | 'createdAt' | 'updatedAt' | 'status' | 'history' | 'isSimulated'
    >
  ) => {
    const nowIso = new Date().toISOString();
    const nextNum = reports.length + 1;
    const newId = `PWK-${String(nextNum).padStart(3, '0')}`;

    const created: EnvReport = {
      ...payload,
      id: newId,
      status: 'Baru',
      createdAt: nowIso,
      updatedAt: nowIso,
      isSimulated: false,
      history: [
        {
          status: 'Baru',
          timestamp: nowIso,
          actor: payload.reporterName,
          note: 'Laporan baru dikirim oleh warga melalui BersihKita Purwokerto.',
        },
      ],
    };

    setReports((prev) => [created, ...prev]);
    setIsReportFormOpen(false);
    setSelectedMapKelurahan(created.kelurahanId);
    setActiveTab('peta');
    setToastMessage(`Laporan ${newId} di Kel. ${created.kelurahanName} berhasil dikirim.`);
  };

  const handleUpdateReportStatus = (
    reportId: string,
    nextStatus: ReportStatus,
    note: string
  ) => {
    const nowIso = new Date().toISOString();
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== reportId) return r;
        return {
          ...r,
          status: nextStatus,
          updatedAt: nowIso,
          history: [
            ...r.history,
            {
              status: nextStatus,
              timestamp: nowIso,
              actor: `Petugas Kel. ${r.kelurahanName}`,
              note,
            },
          ],
        };
      })
    );
    setToastMessage(`Status laporan ${reportId} diperbarui menjadi ${nextStatus}.`);
  };

  const handleQuickStatusChange = (reportId: string, nextStatus: ReportStatus) => {
    const defaultNote =
      nextStatus === 'Diproses'
        ? 'Petugas kelurahan menindaklanjuti laporan di lokasi.'
        : nextStatus === 'Selesai'
        ? 'Penanganan lapangan selesai dilakukan.'
        : 'Status diperbarui oleh petugas.';
    handleUpdateReportStatus(reportId, nextStatus, defaultNote);
  };

  const handleInspectKelurahan = (kelurahanId: string) => {
    if (role === 'petugas') {
      setOfficerKelurahanFilter(kelurahanId);
      setActiveTab('dashboard');
    } else {
      setSelectedMapKelurahan(kelurahanId);
      setActiveTab('peta');
    }
  };

  const handleInspectKelurahanOnMap = (kelurahanId: string) => {
    setSelectedMapKelurahan(kelurahanId);
    setActiveTab('peta');
  };

  const handleResetSimulationData = () => {
    const fresh = buildSimulatedReports();
    setReports(fresh);
    setSelectedMapKelurahan('all');
    setOfficerKelurahanFilter('all');
    setSelectedReportId(null);
    setToastMessage('32 laporan data simulasi Purwokerto berhasil diatur ulang.');
  };

  const handleSaveHomeCheck = (result: HomeCheckSavedState) => {
    setHomeCheckState(result);
    try {
      localStorage.setItem(STORAGE_KEYS.HOME_CHECK, JSON.stringify(result));
    } catch {
      // ignore
    }
    setToastMessage(`Skor Rumah Sehat Anda: ${result.score}/100 tersimpan.`);
  };

  const handleResetHomeCheck = () => {
    setHomeCheckState(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.HOME_CHECK);
    } catch {
      // ignore
    }
  };

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> =
    role === 'petugas'
      ? [
          { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'peta', label: 'Peta Laporan', icon: <MapIcon className="w-4 h-4" /> },
          { id: 'skor', label: 'Skor Kelurahan', icon: <Award className="w-4 h-4" /> },
          { id: 'daftar', label: 'Daftar Laporan', icon: <ClipboardList className="w-4 h-4" /> },
        ]
      : [
          { id: 'peta', label: 'Peta Laporan', icon: <MapIcon className="w-4 h-4" /> },
          { id: 'skor', label: 'Skor Kelurahan', icon: <Award className="w-4 h-4" /> },
          { id: 'rumah', label: 'Cek Rumah', icon: <Home className="w-4 h-4" /> },
          { id: 'daftar', label: 'Daftar Laporan', icon: <ClipboardList className="w-4 h-4" /> },
        ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF8] text-slate-900 pb-20 md:pb-0">
      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (4 Nav Links) — Zone 3 (1 Primary Action) */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActiveTab(role === 'petugas' ? 'dashboard' : 'peta')}
            className="text-lg font-bold tracking-tight text-green-800 whitespace-nowrap shrink-0 cursor-pointer text-left"
          >
            BersihKita Purwokerto
          </button>

          <nav
            aria-label="Navigasi utama"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-green-700 text-green-800 font-semibold'
                      : 'border-transparent hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsReportFormOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-green-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Lapor Masalah</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-5 sm:py-6 space-y-5">
        {/* Contextual Intro + Role Switcher + Simulation Notice */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="text-xs font-medium text-slate-500">
                Kabupaten Banyumas · Kec. Purwokerto Barat, Timur, Utara &amp; Selatan
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight text-balance">
                {role === 'petugas'
                  ? 'Dashboard Pemantauan & Tindak Lanjut Petugas Kelurahan'
                  : 'Pantau & Laporkan Masalah Kesehatan Lingkungan Purwokerto'}
              </h1>
            </div>

            {/* Role Switcher */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="text-xs font-medium text-slate-500 mr-1">Peran Aktif:</span>
              <div
                role="group"
                aria-label="Pilih Peran Pengguna"
                className="inline-flex items-center p-1 rounded-lg bg-slate-100 border border-slate-200"
              >
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('warga')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    role === 'warga'
                      ? 'bg-white text-green-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Warga</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('petugas')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    role === 'petugas'
                      ? 'bg-white text-green-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Petugas</span>
                </button>
              </div>
            </div>
          </div>

          {/* Clear Simulation Data Notice & Local Storage Status */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-start sm:items-center gap-2">
              <Info className="w-4 h-4 text-green-700 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
              <span>
                <strong className="text-slate-800">Data Simulasi:</strong> {simulatedCount} laporan awal merupakan data simulasi realistis di 27 kelurahan Purwokerto dan tersimpan lokal di browser Anda (offline-ready).
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetSimulationData}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-green-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset Data Simulasi</span>
            </button>
          </div>
        </section>

        {/* Automatic Surge Alert (>=5 reports within 7 days) */}
        <SurgeAlertBanner
          alertKelurahan={surgeAlertKelurahan}
          onInspectKelurahan={handleInspectKelurahan}
        />

        {/* Active View */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${role}-${activeTab}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'dashboard' && role === 'petugas' && (
              <OfficerDashboardView
                reports={reports}
                kelurahanScores={kelurahanScores}
                onQuickStatusChange={handleQuickStatusChange}
                onSelectReport={(rep) => setSelectedReportId(rep.id)}
                initialKelurahanFilter={officerKelurahanFilter}
              />
            )}

            {activeTab === 'peta' && (
              <PurwokertoMap
                reports={reports}
                kelurahanScores={kelurahanScores}
                selectedKelurahanFilter={selectedMapKelurahan}
                onSelectKelurahanFilter={setSelectedMapKelurahan}
                onSelectReport={(rep) => setSelectedReportId(rep.id)}
                onOpenReportForm={() => setIsReportFormOpen(true)}
              />
            )}

            {activeTab === 'skor' && (
              <KelurahanScoresView
                scores={kelurahanScores}
                onInspectKelurahanOnMap={handleInspectKelurahanOnMap}
              />
            )}

            {activeTab === 'rumah' && (
              <HomeHealthCheckView
                savedState={homeCheckState}
                onSaveResult={handleSaveHomeCheck}
                onResetResult={handleResetHomeCheck}
              />
            )}

            {activeTab === 'daftar' && (
              <ReportListView
                reports={reports}
                onSelectReport={(rep) => setSelectedReportId(rep.id)}
                onOpenReportForm={() => setIsReportFormOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Quiet Footer */}
      <footer className="hidden md:block border-t border-slate-200 bg-white mt-8">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between text-xs text-slate-500">
          <span>BersihKita Purwokerto · Pemantauan Kesehatan Lingkungan Berbasis Warga</span>
          <span>Purwokerto Barat · Purwokerto Timur · Purwokerto Utara · Purwokerto Selatan</span>
        </div>
      </footer>

      {/* Mobile Bottom Navigation (Compact <= 60px, <15% viewport height) */}
      <nav
        aria-label="Navigasi seluler"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-sm grid grid-cols-4 h-15"
      >
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors cursor-pointer min-h-[44px] ${
                active ? 'text-green-700 font-semibold' : 'text-slate-500'
              }`}
            >
              {item.icon}
              <span className="truncate max-w-[78px]">{item.label.replace(' Laporan', '')}</span>
            </button>
          );
        })}
      </nav>

      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-20 md:bottom-6 right-4 z-50 flex items-center gap-2 rounded-xl border border-green-200 bg-green-900 px-4 py-3 text-xs sm:text-sm font-medium text-white shadow-lg"
            role="status"
          >
            <CheckCircle2 className="w-4 h-4 text-green-300 shrink-0" aria-hidden="true" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals & Drawers */}
      <ReportFormModal
        isOpen={isReportFormOpen}
        onClose={() => setIsReportFormOpen(false)}
        onSubmitReport={handleSubmitNewReport}
      />

      <ReportDetailDrawer
        report={selectedReport}
        role={role}
        onClose={() => setSelectedReportId(null)}
        onUpdateStatus={handleUpdateReportStatus}
      />
    </div>
  );
}
