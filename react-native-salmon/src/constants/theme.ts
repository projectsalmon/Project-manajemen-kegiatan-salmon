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
  // Apple Clean iOS Palette
  iosBackground: '#F2F2F7',
  iosCard: '#FFFFFF',
  iosCardSecondary: '#F9F9FB',
  iosBorder: '#E5E5EA',
  iosSeparator: 'rgba(60, 60, 67, 0.12)',

  // Warm Salmon & Coral Accent
  salmonPrimary: '#FF6B6B',
  salmonWarm: '#FA8072',
  salmonDark: '#E05656',
  salmonContainer: '#FFEAE8',
  salmonBorder: '#E5E5EA',
  onSalmonContainer: '#8B1E1E',

  // Apple System Text & Labels (High Contrast, Senior-friendly)
  iosTextPrimary: '#1C1C1E',
  iosTextSecondary: '#3A3A3C',
  iosTextMuted: '#8E8E93',

  // Apple Semantic Colors
  iosSuccess: '#34C759',
  iosSuccessBg: '#E8F9ED',
  iosWarning: '#FF9500',
  iosWarningBg: '#FFF5E5',
  iosDanger: '#FF3B30',
  iosDangerBg: '#FEECEB',
  iosBlue: '#007AFF',
  iosBlueBg: '#EAF3FF',

  // Backwards-Compatible Mappings (Updated to Apple Clean Theme)
  skyBlueBackground: '#F2F2F7',
  skyBlueSurface: '#FFFFFF',
  skyBlueSurfaceVariant: '#F2F2F7',
  skyBlueHeader: '#FF6B6B',
  skyBlueBorder: '#E5E5EA',

  // Accent & Containers
  yellowAccent: '#FF6B6B',
  yellowHighlight: '#FA8072',
  yellowBorderLis: '#E5E5EA',
  yellowContainer: '#FFEAE8',
  onYellowContainer: '#8B1E1E',

  // Text & Content Contrast
  textNavyDark: '#1C1C1E',
  textNavySecondary: '#3A3A3C',
  textNavyMuted: '#8E8E93',

  // Category Badge & Container Colors (Soft Pastel iOS Style)
  posyanduPink: '#E11D48',
  posyanduPinkContainer: '#FFE4E6',

  kerjaBaktiOrange: '#EA580C',
  kerjaBaktiOrangeContainer: '#FFEDD5',

  rapatBlue: '#007AFF',
  rapatBlueContainer: '#EAF3FF',

  kesehatanGreen: '#16A34A',
  kesehatanGreenContainer: '#DCFCE7',

  urgentRed: '#FF3B30',
  urgentRedContainer: '#FEECEB',

  // System
  white: '#FFFFFF',
  black: '#000000',
  borderLight: '#E5E5EA',
  whatsappGreen: '#25D366',
  whatsappGreenBg: '#E6F9EE',
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
  LAINNYA: {
    displayName: 'Lain-lain (Kustom)',
    iconName: 'dots-horizontal-circle-outline',
    badgeColor: '#6366F1',
    containerColor: '#EEF2FF',
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

export const Fonts = {
  // Heading & Brand Accent: Plus Jakarta Sans (Modern Geometric, Civic & Government Tech Standard)
  headingRegular: 'PlusJakartaSans_500Medium',
  headingSemiBold: 'PlusJakartaSans_600SemiBold',
  headingBold: 'PlusJakartaSans_700Bold',
  headingExtraBold: 'PlusJakartaSans_800ExtraBold',

  // Body & UI Content: Open Sans (Humanist Sans-Serif, Supreme Readability)
  bodyRegular: 'OpenSans_400Regular',
  bodyMedium: 'OpenSans_500Medium',
  bodySemiBold: 'OpenSans_600SemiBold',
  bodyBold: 'OpenSans_700Bold',
  bodyExtraBold: 'OpenSans_800ExtraBold',
  bodyItalic: 'OpenSans_400Regular_Italic',
};

export const AppleElevation = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const formatUserRole = (role?: string): string => {
  if (!role) return 'Warga';
  if (UserRolesMeta[role as UserRoleType]) {
    return UserRolesMeta[role as UserRoleType].title;
  }
  switch (role.toUpperCase()) {
    case 'STAF_KELURAHAN':
    case 'KELURAHAN':
      return 'Staf Kelurahan';
    case 'RT':
      return 'Pengurus RT';
    case 'RW':
      return 'Pengurus RW';
    case 'POSYANDU':
      return 'Kader Posyandu';
    case 'WARGA':
    default:
      return 'Warga';
  }
};

