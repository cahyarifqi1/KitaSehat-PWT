export type IssueType =
  | 'sampah_liar'
  | 'saluran_tersumbat'
  | 'genangan_air'
  | 'air_bersih';

export type SeverityLevel = 'Ringan' | 'Sedang' | 'Berat';

export type ReportStatus = 'Baru' | 'Diproses' | 'Selesai';

export type UserRole = 'warga' | 'petugas';

export type KecamatanName =
  | 'Purwokerto Barat'
  | 'Purwokerto Timur'
  | 'Purwokerto Utara'
  | 'Purwokerto Selatan';

export interface KelurahanInfo {
  id: string;
  name: string;
  kecamatan: KecamatanName;
  lat: number;
  lng: number;
}

export interface StatusHistoryItem {
  status: ReportStatus;
  timestamp: string;
  actor: string;
  note: string;
}

export interface EnvReport {
  id: string;
  issueType: IssueType;
  kelurahanId: string;
  kelurahanName: string;
  kecamatan: KecamatanName;
  addressNote: string;
  description: string;
  severity: SeverityLevel;
  status: ReportStatus;
  lat: number;
  lng: number;
  reporterName: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  isSimulated: boolean;
  history: StatusHistoryItem[];
}

export interface KelurahanScore {
  kelurahan: KelurahanInfo;
  score: number;
  category: 'Baik' | 'Perlu Perhatian' | 'Kritis';
  totalReports: number;
  activeReports: number;
  resolvedReports: number;
  reportsLast7Days: number;
  hasSurgeAlert: boolean;
  dominantIssue: IssueType | null;
}

export type HomeAnswerValue = 'ya' | 'sebagian' | 'tidak';

export interface HomeCheckQuestion {
  id: string;
  category: string;
  question: string;
  guidance: string;
  recommendationIfPartial: string;
  recommendationIfNo: string;
  priority: 'Tinggi' | 'Sedang';
}

export interface HomeCheckSavedState {
  answers: Record<string, HomeAnswerValue>;
  kelurahanId: string;
  completedAt: string;
  score: number;
}
