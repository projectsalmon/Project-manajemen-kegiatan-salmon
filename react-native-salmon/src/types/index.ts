export type UserRoleType = 'WARGA' | 'RT' | 'RW' | 'POSYANDU' | 'STAF_KELURAHAN';

export interface UserRoleInfo {
  code: UserRoleType;
  title: string;
  subtitle: string;
  description: string;
  badgeColor: string;
}

export interface RegionInvitationCode {
  id: string;
  code: string;
  role: 'RT' | 'RW';
  creatorName: string;
  rt: string;
  rw: string;
  kelurahan: string;
  description: string;
  createdAt: string;
  isActive: boolean;
  membersCount: number;
}

export interface UserProfile {
  id: string;
  name: string;
  nik: string;
  role: UserRoleType;
  age?: string | number;
  address?: string;
  rt: string;
  rw: string;
  kelurahan: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  isVerifiedWarga?: boolean;
  verifiedCode?: string;
  verifiedAt?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export type ActivityCategoryType =
  | 'POSYANDU'
  | 'KERJA_BAKTI'
  | 'RAPAT'
  | 'KESEHATAN'
  | 'SOSIAL'
  | 'OLAH_RAGA'
  | 'LAINNYA';

export interface CategoryInfo {
  displayName: string;
  iconName: string;
  badgeColor: string;
  containerColor: string;
}

export interface LocationPresetItem {
  id: string;
  name: string;
  address: string;
}

export type RsvpStatusType = 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE' | 'NONE';

export type ApprovalStatusType =
  | 'WAITING_RW_APPROVAL'
  | 'WAITING_ADMIN_APPROVAL'
  | 'PUBLISHED'
  | 'REJECTED';

export interface ApprovalStatusInfo {
  label: string;
  description: string;
  badgeColor: string;
  containerColor: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  category: ActivityCategoryType;
  customCategoryName?: string;
  dateIso: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "Minggu, 18 Mei 2025"
  timeSlot: string; // e.g. "08:00 - 11:30 WIB"
  locationName: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
  targetRegion: string; // e.g. "RT 03 / RW 05"
  organizerRole: UserRoleType;
  organizerName: string;
  confirmedCount: number;
  maybeCount: number;
  quota?: number | null;
  userRsvpStatus: RsvpStatusType;
  photos: string[];
  videos?: string[];
  imageUrl?: string | null;
  approvalStatus: ApprovalStatusType;
  needsFollowUp?: boolean;
  followUpNote?: string | null;
  isFeatured?: boolean;
  isPinned?: boolean;
  pinnedAt?: string | null;
  pinExpiresAt?: string | null;
  pinDurationLabel?: string | null;
}

export type AnnouncementUrgencyType = 'PENTING' | 'INFO' | 'IMBAUAN' | 'DARURAT';

export interface AnnouncementUrgencyInfo {
  label: string;
  badgeColor: string;
  containerColor: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  formattedDate: string;
  authorName: string;
  authorRole: string;
  targetRegion: string;
  urgency: AnnouncementUrgencyType;
  requirements: string[];
  additionalInfo?: string | null;
  imageUrl?: string | null;
  approvalStatus: ApprovalStatusType;
  isPinned: boolean;
  pinnedAt?: string | null;
  pinExpiresAt?: string | null;
  pinDurationLabel?: string | null;
}

export interface ContactItem {
  id: string;
  nameTitle: string;
  phoneNumber: string;
  category: string;
}

// Helper: check if item is currently active-pinned (accounting for expiration)
export const isItemPinned = (item?: {
  isPinned?: boolean;
  pinExpiresAt?: string | null;
}): boolean => {
  if (!item || !item.isPinned) return false;
  if (!item.pinExpiresAt) return true; // Pinned forever until manually unpinned
  try {
    return new Date(item.pinExpiresAt).getTime() > Date.now();
  } catch {
    return true;
  }
};

export interface PinDurationOption {
  label: string;
  ms: number | null; // null = Selamanya
}

export const PIN_DURATION_OPTIONS: PinDurationOption[] = [
  { label: '30 Menit', ms: 30 * 60 * 1000 },
  { label: '1 Jam', ms: 60 * 60 * 1000 },
  { label: '3 Jam', ms: 3 * 60 * 60 * 1000 },
  { label: '6 Jam', ms: 6 * 60 * 60 * 1000 },
  { label: '12 Jam', ms: 12 * 60 * 60 * 1000 },
  { label: '1 Hari', ms: 24 * 60 * 60 * 1000 },
  { label: '3 Hari', ms: 3 * 24 * 60 * 60 * 1000 },
  { label: '7 Hari', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: 'Selamanya', ms: null },
];
