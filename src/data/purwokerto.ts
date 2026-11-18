import { HomeCheckQuestion, IssueType, KecamatanName, KelurahanInfo, SeverityLevel, ReportStatus } from '../types/env';

export const PURWOKERTO_CENTER: [number, number] = [-7.4244, 109.2302];

export const KECAMATAN_LIST: KecamatanName[] = [
  'Purwokerto Barat',
  'Purwokerto Timur',
  'Purwokerto Utara',
  'Purwokerto Selatan',
];

export const KELURAHAN_LIST: KelurahanInfo[] = [
  // Purwokerto Barat (7)
  { id: 'bantarsoka', name: 'Bantarsoka', kecamatan: 'Purwokerto Barat', lat: -7.4255, lng: 109.2165 },
  { id: 'karanglewas-lor', name: 'Karanglewas Lor', kecamatan: 'Purwokerto Barat', lat: -7.4165, lng: 109.2085 },
  { id: 'kedungwuluh', name: 'Kedungwuluh', kecamatan: 'Purwokerto Barat', lat: -7.4220, lng: 109.2225 },
  { id: 'kober', name: 'Kober', kecamatan: 'Purwokerto Barat', lat: -7.4135, lng: 109.2160 },
  { id: 'pasir-kidul', name: 'Pasir Kidul', kecamatan: 'Purwokerto Barat', lat: -7.4345, lng: 109.2090 },
  { id: 'pasirmuncang', name: 'Pasirmuncang', kecamatan: 'Purwokerto Barat', lat: -7.4295, lng: 109.2055 },
  { id: 'rejasari', name: 'Rejasari', kecamatan: 'Purwokerto Barat', lat: -7.4190, lng: 109.2130 },

  // Purwokerto Timur (6)
  { id: 'arcawinangun', name: 'Arcawinangun', kecamatan: 'Purwokerto Timur', lat: -7.4215, lng: 109.2545 },
  { id: 'kranji', name: 'Kranji', kecamatan: 'Purwokerto Timur', lat: -7.4245, lng: 109.2375 },
  { id: 'mersi', name: 'Mersi', kecamatan: 'Purwokerto Timur', lat: -7.4335, lng: 109.2560 },
  { id: 'purwokerto-lor', name: 'Purwokerto Lor', kecamatan: 'Purwokerto Timur', lat: -7.4185, lng: 109.2385 },
  { id: 'purwokerto-wetan', name: 'Purwokerto Wetan', kecamatan: 'Purwokerto Timur', lat: -7.4285, lng: 109.2455 },
  { id: 'sokanegara', name: 'Sokanegara', kecamatan: 'Purwokerto Timur', lat: -7.4210, lng: 109.2315 },

  // Purwokerto Utara (7)
  { id: 'bancarkembar', name: 'Bancarkembar', kecamatan: 'Purwokerto Utara', lat: -7.4105, lng: 109.2410 },
  { id: 'bobosan', name: 'Bobosan', kecamatan: 'Purwokerto Utara', lat: -7.4015, lng: 109.2235 },
  { id: 'grendeng', name: 'Grendeng', kecamatan: 'Purwokerto Utara', lat: -7.4055, lng: 109.2480 },
  { id: 'karangwangkal', name: 'Karangwangkal', kecamatan: 'Purwokerto Utara', lat: -7.4085, lng: 109.2535 },
  { id: 'pabuaran', name: 'Pabuaran', kecamatan: 'Purwokerto Utara', lat: -7.3975, lng: 109.2465 },
  { id: 'purwanegara', name: 'Purwanegara', kecamatan: 'Purwokerto Utara', lat: -7.4125, lng: 109.2280 },
  { id: 'sumampir', name: 'Sumampir', kecamatan: 'Purwokerto Utara', lat: -7.4045, lng: 109.2360 },

  // Purwokerto Selatan (7)
  { id: 'berkoh', name: 'Berkoh', kecamatan: 'Purwokerto Selatan', lat: -7.4425, lng: 109.2495 },
  { id: 'karangklesem', name: 'Karangklesem', kecamatan: 'Purwokerto Selatan', lat: -7.4465, lng: 109.2345 },
  { id: 'karangpucung', name: 'Karangpucung', kecamatan: 'Purwokerto Selatan', lat: -7.4385, lng: 109.2260 },
  { id: 'purwokerto-kidul', name: 'Purwokerto Kidul', kecamatan: 'Purwokerto Selatan', lat: -7.4365, lng: 109.2385 },
  { id: 'purwokerto-kulon', name: 'Purwokerto Kulon', kecamatan: 'Purwokerto Selatan', lat: -7.4335, lng: 109.2285 },
  { id: 'tanjung', name: 'Tanjung', kecamatan: 'Purwokerto Selatan', lat: -7.4415, lng: 109.2175 },
  { id: 'teluk', name: 'Teluk', kecamatan: 'Purwokerto Selatan', lat: -7.4485, lng: 109.2455 },
];

export interface IssueTypeMeta {
  id: IssueType;
  label: string;
  shortLabel: string;
  description: string;
  markerColor: string;
  markerRing: string;
  textColor: string;
  surfaceClass: string;
  samplePhoto: string;
}

export const ISSUE_TYPE_META: Record<IssueType, IssueTypeMeta> = {
  sampah_liar: {
    id: 'sampah_liar',
    label: 'Sampah Liar',
    shortLabel: 'Sampah',
    description: 'Tumpukan sampah rumah tangga atau liar di bahu jalan, lahan kosong, dan bantaran sungai.',
    markerColor: '#EA580C',
    markerRing: '#FED7AA',
    textColor: 'text-orange-700',
    surfaceClass: 'bg-orange-50 border-orange-200',
    samplePhoto: '/src/assets/images/sampah_liar_1794995652542.jpg',
  },
  saluran_tersumbat: {
    id: 'saluran_tersumbat',
    label: 'Saluran Air Tersumbat',
    shortLabel: 'Saluran',
    description: 'Got atau drainase tersumbat lumpur, plastik, atau dedaunan yang memicu luapan saat hujan.',
    markerColor: '#0284C7',
    markerRing: '#BAE6FD',
    textColor: 'text-sky-700',
    surfaceClass: 'bg-sky-50 border-sky-200',
    samplePhoto: '/src/assets/images/saluran_tersumbat_1794995653402.jpg',
  },
  genangan_air: {
    id: 'genangan_air',
    label: 'Genangan Air (Sarang Nyamuk)',
    shortLabel: 'Genangan',
    description: 'Genangan air mengendap di jalan, pekarangan, atau wadah terbuka yang berisiko menjadi sarang nyamuk Aedes.',
    markerColor: '#DC2626',
    markerRing: '#FECACA',
    textColor: 'text-red-700',
    surfaceClass: 'bg-red-50 border-red-200',
    samplePhoto: '/src/assets/images/genangan_air_1794995652944.jpg',
  },
  air_bersih: {
    id: 'air_bersih',
    label: 'Air Bersih Bermasalah',
    shortLabel: 'Air Bersih',
    description: 'Air sumur atau PDAM keruh, berbau, berubah warna, atau terindikasi tercemar limbah sekitar.',
    markerColor: '#0D9488',
    markerRing: '#99F6E4',
    textColor: 'text-teal-700',
    surfaceClass: 'bg-teal-50 border-teal-200',
    samplePhoto: '/src/assets/images/air_bersih_1794995653729.jpg',
  },
};

export const ISSUE_TYPE_LIST: IssueTypeMeta[] = [
  ISSUE_TYPE_META.sampah_liar,
  ISSUE_TYPE_META.saluran_tersumbat,
  ISSUE_TYPE_META.genangan_air,
  ISSUE_TYPE_META.air_bersih,
];

export const SEVERITY_META: Record<SeverityLevel, { label: string; colorClass: string; weight: number }> = {
  Ringan: { label: 'Ringan', colorClass: 'text-slate-700', weight: 1 },
  Sedang: { label: 'Sedang', colorClass: 'text-orange-700 font-medium', weight: 2 },
  Berat: { label: 'Berat', colorClass: 'text-red-700 font-semibold', weight: 3 },
};

export const STATUS_META: Record<ReportStatus, { label: string; textClass: string; dotColor: string }> = {
  Baru: { label: 'Baru', textClass: 'text-orange-700 font-semibold', dotColor: '#EA580C' },
  Diproses: { label: 'Diproses', textClass: 'text-sky-700 font-semibold', dotColor: '#0284C7' },
  Selesai: { label: 'Selesai', textClass: 'text-green-700 font-semibold', dotColor: '#15803D' },
};

export const HOME_HEALTH_QUESTIONS: HomeCheckQuestion[] = [
  {
    id: 'q1_air_bersih',
    category: 'Air Bersih',
    question: 'Apakah sumber air minum dan cuci di rumah jernih, tidak berbau, dan tidak berasa?',
    guidance: 'Periksa kejernihan air PDAM/sumur gali dan jarak minimal 10 meter dari tangki septik.',
    recommendationIfPartial: 'Pasang saringan kain/karbon sederhana pada keran dan rebus air hingga mendidih sebelum diminum.',
    recommendationIfNo: 'Segera gunakan filter air bertingkat atau hubungi PDAM/Puskesmas terdekat untuk uji kualitas air, serta laporkan melalui menu Buat Laporan.',
    priority: 'Tinggi',
  },
  {
    id: 'q2_jamban_sehat',
    category: 'Sanitasi Tinja',
    question: 'Apakah rumah memiliki jamban leher angsa yang terhubung ke tangki septik kedap air?',
    guidance: 'Jamban sehat mencegah pencemaran air tanah oleh bakteri E. coli.',
    recommendationIfPartial: 'Periksa penutup dan ventilasi tangki septik agar tidak ada kebocoran atau bau menyengat.',
    recommendationIfNo: 'Jadwalkan penyedotan/perbaikan tangki septik kedap air atau konsultasikan program sanitasi kelurahan.',
    priority: 'Tinggi',
  },
  {
    id: 'q3_spal',
    category: 'Air Limbah',
    question: 'Apakah saluran pembuangan air limbah dapur dan kamar mandi (SPAL) tertutup dan mengalir lancar?',
    guidance: 'Air limbah rumah tangga tidak boleh menggenang terbuka di halaman atau selokan rumah.',
    recommendationIfPartial: 'Bersihkan saringan lemak dan endapan pada bak kontrol saluran air limbah setiap pekan.',
    recommendationIfNo: 'Pasang penutup beton/PVC pada saluran air limbah rumah dan buat sumur resapan sederhana agar tidak menimbulkan bau dan jentik.',
    priority: 'Tinggi',
  },
  {
    id: 'q4_tempat_sampah',
    category: 'Pengelolaan Sampah',
    question: 'Apakah tersedia tempat sampah yang tertutup rapat di dalam dan di depan rumah?',
    guidance: 'Wadah tertutup mencegah lalat, kecoa, dan hewan liar mengais sampah.',
    recommendationIfPartial: 'Lengkapi tempat sampah dengan tutup yang pas dan lapisi kantong agar mudah diangkut petugas kebersihan.',
    recommendationIfNo: 'Sediakan minimal dua tempat sampah bertutup (di dapur dan halaman) serta patuhi jadwal pengangkutan RT/kelurahan.',
    priority: 'Sedang',
  },
  {
    id: 'q5_pilah_sampah',
    category: 'Pengelolaan Sampah',
    question: 'Apakah sampah organik (sisa makanan/daun) dipisahkan dari sampah plastik atau anorganik?',
    guidance: 'Pemilahan dari rumah mengurangi timbulan sampah liar di TPS wilayah Purwokerto.',
    recommendationIfPartial: 'Sediakan satu wadah khusus untuk sampah dapur/daun agar bisa dikomposkan atau disetor ke Bank Sampah.',
    recommendationIfNo: 'Mulai pisahkan sampah basah dan kering, lalu manfaatkan Bank Sampah kelurahan atau lubang biopori di halaman.',
    priority: 'Sedang',
  },
  {
    id: 'q6_bebas_jentik',
    category: 'Pencegahan DBD (3M Plus)',
    question: 'Apakah bak mandi, dispenser, pot bunga, dan talang air bebas dari jentik nyamuk dan rutin dikuras tiap minggu?',
    guidance: 'Curah hujan Banyumas yang tinggi membuat nyamuk Aedes aegypti cepat berkembang biak.',
    recommendationIfPartial: 'Tambahkan pengurasan tatakan dispenser, pot tanaman, dan tempat minum hewan peliharaan setiap 7 hari.',
    recommendationIfNo: 'Lakukan gerakan 3M Plus hari ini (Menguras, Menutup, Mendaur ulang) dan taburkan larvasida pada penampungan air yang sulit dikuras.',
    priority: 'Tinggi',
  },
  {
    id: 'q7_drainase_halaman',
    category: 'Drainase Lingkungan',
    question: 'Apakah selokan dan halaman depan rumah bebas dari genangan air saat maupun setelah hujan?',
    guidance: 'Saluran depan rumah yang bersih mencegah genangan dan banjir lokal.',
    recommendationIfPartial: 'Keruk endapan pasir dan dedaunan di selokan depan rumah sebelum puncak musim hujan.',
    recommendationIfNo: 'Bersihkan sumbatan selokan depan rumah bersama warga RT, atau laporkan saluran umum yang rusak ke petugas kelurahan.',
    priority: 'Tinggi',
  },
  {
    id: 'q8_ventilasi',
    category: 'Sirkulasi Udara',
    question: 'Apakah setiap kamar tidur dan dapur memiliki jendela atau ventilasi udara yang dibuka setiap hari?',
    guidance: 'Sirkulasi udara yang baik menurunkan kelembapan, mencegah jamur, dan mengurangi risiko ISPA.',
    recommendationIfPartial: 'Biasakan membuka jendela kamar dan ruang keluarga minimal 2 jam pada pagi hari.',
    recommendationIfNo: 'Tambahkan lubang angin (roster/exhaust fan) terutama di area dapur dan kamar tidur agar udara tidak pengap.',
    priority: 'Sedang',
  },
  {
    id: 'q9_pencahayaan',
    category: 'Pencahayaan Alami',
    question: 'Apakah sinar matahari pagi dapat masuk ke ruang tamu dan kamar tidur secara cukup?',
    guidance: 'Pencahayaan alami membantu membunuh kuman dan menjaga kelembapan ruang tetap ideal.',
    recommendationIfPartial: 'Buka tirai jendela sejak pagi dan pangkas dahan pohon di depan jendela yang terlalu rimbun.',
    recommendationIfNo: 'Pertimbangkan penggunaan genteng kaca transparan pada ruang yang gelap dan tata ulang perabot yang menghalangi jendela.',
    priority: 'Sedang',
  },
  {
    id: 'q10_bebas_vektor',
    category: 'Kebersihan Vektor',
    question: 'Apakah area dapur dan gudang bersih dari tanda keberadaan tikus, kecoa, dan lalat?',
    guidance: 'Sisa makanan terbuka mengundang vektor penyakit seperti leptospirosis dan diare.',
    recommendationIfPartial: 'Simpan bahan makanan dalam wadah tertutup rapat dan bersihkan kolong kompor secara berkala.',
    recommendationIfNo: 'Tutup celah lubang masuk tikus dengan kawat kasa, bersihkan tumpukan barang bekas di gudang, dan pastikan makanan selalu tertutup.',
    priority: 'Tinggi',
  },
];
