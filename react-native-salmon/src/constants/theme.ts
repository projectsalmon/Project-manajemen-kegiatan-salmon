import {
  ActivityCategoryType,
  AnnouncementUrgencyType,
  ApprovalStatusType,
  CategoryInfo,
  RsvpStatusType,
  UserRoleInfo,
  UserRoleType,
} from '../types';

export const Colors = {
  // Light Blue Dominant Palette
  skyBlueBackground: '#EBF5FF',
  skyBlueSurface: '#FFFFFF',
  skyBlueSurfaceVariant: '#DCEEFE',
  skyBlueHeader: '#0369A1',
  skyBlueBorder: '#BAE6FD',

  // Yellow Accent & Border Lis
  yellowAccent: '#CA8A04',
  yellowHighlight: '#EAB308',
  yellowBorderLis: '#EAB308',
  yellowContainer: '#FEF08A',
  onYellowContainer: '#713F12',

  // Text & Content Contrast
  textNavyDark: '#0F172A',
  textNavySecondary: '#334155',
  textNavyMuted: '#64748B',

  // Category Badge & Container Colors
  posyanduPink: '#DB2777',
  posyanduPinkContainer: '#FCE7F3',

  kerjaBaktiOrange: '#EA580C',
  kerjaBaktiOrangeContainer: '#FFEDD5',

  rapatBlue: '#0284C7',
  rapatBlueContainer: '#E0F2FE',

  kesehatanGreen: '#16A34A',
  kesehatanGreenContainer: '#DCFCE7',

  urgentRed: '#DC2626',
  urgentRedContainer: '#FEE2E2',

  // System
  white: '#FFFFFF',
  black: '#000000',
  borderLight: '#E2E8F0',
  whatsappGreen: '#25D366',
  whatsappGreenBg: '#DCF8C6',
};

export const UserRolesMeta: Record<UserRoleType, UserRoleInfo> = {
  WARGA: {
    code: 'WARGA',
    title: 'Warga',
    subtitle: 'Warga RT 03 / RW 05',
    description: 'Lihat kegiatan resmi, lakukan konfirmasi RSVP, dan pantau pengumuman wilayah.',
    badgeColor: Colors.skyBlueHeader,
  },
  RT: {
    code: 'RT',
    title: 'Pengurus RT',
    subtitle: 'Ketua RT 03 Sukamaju',
    description: 'Ajukan kegiatan/pengumuman baru RT (Status awal: Menunggu ACC RW).',
    badgeColor: Colors.yellowAccent,
  },
  RW: {
    code: 'RW',
    title: 'Pengurus RW',
    subtitle: 'Ketua RW 05 Sukamaju',
    description: 'Setujui (ACC) pengajuan kegiatan RT & terjemahkan usulan ke Staf Kelurahan.',
    badgeColor: Colors.kerjaBaktiOrange,
  },
  POSYANDU: {
    code: 'POSYANDU',
    title: 'Kader Posyandu',
    subtitle: 'Posyandu Melati 03',
    description: 'Jadwalkan penimbangan balita, cek kesehatan lansia, dan terbitkan jadwal posyandu.',
    badgeColor: Colors.posyanduPink,
  },
  STAF_KELURAHAN: {
    code: 'STAF_KELURAHAN',
    title: 'Staf Kelurahan',
    subtitle: 'Seksi Kesejahteraan Kelurahan',
    description: 'Pemeriksaan akhir pengajuan yang disetujui RW dan publikasi resmi untuk warga.',
    badgeColor: Colors.rapatBlue,
  },
};

export const CategoryMeta: Record<ActivityCategoryType, CategoryInfo> = {
  POSYANDU: {
    displayName: 'Posyandu & Ibu Anak',
    iconName: 'heart',
    badgeColor: Colors.posyanduPink,
    containerColor: Colors.posyanduPinkContainer,
  },
  KERJA_BAKTI: {
    displayName: 'Kerja Bakti & Kebersihan',
    iconName: 'broom',
    badgeColor: Colors.kerjaBaktiOrange,
    containerColor: Colors.kerjaBaktiOrangeContainer,
  },
  RAPAT: {
    displayName: 'Rapat Warga & Musyawarah',
    iconName: 'account-group',
    badgeColor: Colors.rapatBlue,
    containerColor: Colors.rapatBlueContainer,
  },
  KESEHATAN: {
    displayName: 'Cek Kesehatan & Lansia',
    iconName: 'medical-bag',
    badgeColor: Colors.kesehatanGreen,
    containerColor: Colors.kesehatanGreenContainer,
  },
  SOSIAL: {
    displayName: 'Bantuan Sosial & Keagamaan',
    iconName: 'hand-heart',
    badgeColor: Colors.rapatBlue,
    containerColor: Colors.skyBlueSurfaceVariant,
  },
  OLAH_RAGA: {
    displayName: 'Olahraga & Pemuda',
    iconName: 'soccer',
    badgeColor: Colors.yellowAccent,
    containerColor: Colors.yellowContainer,
  },
};

export const ApprovalStatusMeta: Record<
  ApprovalStatusType,
  { label: string; description: string; badgeColor: string; containerColor: string }
> = {
  WAITING_RW_APPROVAL: {
    label: 'Menunggu Persetujuan RW',
    description: 'Pengajuan dibuat oleh RT dan sedang menantikan persetujuan Ketua RW.',
    badgeColor: Colors.yellowAccent,
    containerColor: Colors.yellowContainer,
  },
  WAITING_ADMIN_APPROVAL: {
    label: 'Menunggu Persetujuan Kelurahan',
    description: 'Pengajuan telah disetujui RW dan menantikan persetujuan Staf Kelurahan.',
    badgeColor: Colors.skyBlueHeader,
    containerColor: Colors.skyBlueSurfaceVariant,
  },
  PUBLISHED: {
    label: 'Disetujui & Diterbitkan',
    description: 'Telah disetujui resmi dan dipublikasikan untuk seluruh warga.',
    badgeColor: Colors.kesehatanGreen,
    containerColor: Colors.kesehatanGreenContainer,
  },
  REJECTED: {
    label: 'Ditolak',
    description: 'Pengajuan belum dapat disetujui oleh pengurus RW/Kelurahan.',
    badgeColor: Colors.urgentRed,
    containerColor: Colors.urgentRedContainer,
  },
};

export const RsvpStatusMeta: Record<
  RsvpStatusType,
  { label: string; color: string; icon: string }
> = {
  ATTENDING: {
    label: 'Hadir',
    color: Colors.skyBlueHeader,
    icon: 'check-circle',
  },
  NOT_ATTENDING: {
    label: 'Tidak Hadir',
    color: Colors.urgentRed,
    icon: 'close-circle',
  },
  MAYBE: {
    label: 'Ragu-ragu',
    color: Colors.yellowAccent,
    icon: 'help-circle',
  },
  NONE: {
    label: 'Belum Respon',
    color: Colors.textNavyMuted,
    icon: 'information-outline',
  },
};

export const UrgencyMeta: Record<
  AnnouncementUrgencyType,
  { label: string; badgeColor: string; containerColor: string }
> = {
  PENTING: {
    label: 'PENTING',
    badgeColor: Colors.urgentRed,
    containerColor: Colors.urgentRedContainer,
  },
  INFO: {
    label: 'INFORMASI',
    badgeColor: Colors.rapatBlue,
    containerColor: Colors.rapatBlueContainer,
  },
  IMBAUAN: {
    label: 'IMBAUAN',
    badgeColor: Colors.yellowAccent,
    containerColor: Colors.yellowContainer,
  },
  DARURAT: {
    label: 'DARURAT',
    badgeColor: Colors.urgentRed,
    containerColor: Colors.urgentRedContainer,
  },
};
