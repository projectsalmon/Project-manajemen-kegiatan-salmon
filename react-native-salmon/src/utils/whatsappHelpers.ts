import { Linking } from 'react-native';
import { defaultContacts } from '../constants/sampleData';
import { CategoryMeta } from '../constants/theme';
import {
  ActivityItem,
  AnnouncementItem,
  ContactItem,
  UserProfile,
} from '../types';

/**
 * Format local Indonesian phone number (e.g. 08123456789 -> 628123456789)
 */
export const formatPhoneNumberForWhatsApp = (rawPhone: string): string => {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return '62' + digits.slice(1);
  }
  if (digits.startsWith('62')) {
    return digits;
  }
  return digits;
};

/**
 * Opens WhatsApp with the specified message and optional phone number.
 */
export const openWhatsApp = async (
  message: string,
  phoneNumber?: string
): Promise<boolean> => {
  try {
    const encoded = encodeURIComponent(message);
    let url = '';

    if (phoneNumber && phoneNumber.trim()) {
      const cleanPhone = formatPhoneNumberForWhatsApp(phoneNumber);
      url = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`;
    } else {
      url = `whatsapp://send?text=${encoded}`;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    } else {
      // Fallback to web link
      const webUrl = phoneNumber
        ? `https://wa.me/${formatPhoneNumberForWhatsApp(phoneNumber)}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`;
      await Linking.openURL(webUrl);
      return true;
    }
  } catch (error) {
    console.warn('Error opening WhatsApp:', error);
    return false;
  }
};

/**
 * Build WhatsApp approval request message for an Activity.
 */
export const buildActivityApprovalMessage = (
  activity: ActivityItem,
  sender: UserProfile,
  contacts: ContactItem[] = defaultContacts
): {
  message: string;
  targetRole: string;
  targetName: string;
  targetPhone: string;
} => {
  const isTargetRW = activity.approvalStatus === 'WAITING_RW_APPROVAL' || sender.role === 'RT';
  
  let targetRole = isTargetRW ? 'Ketua RW 05' : 'Staf Kelurahan Sukamaju';
  let targetContact = contacts.find((c) =>
    isTargetRW ? c.nameTitle.toLowerCase().includes('rw') : c.category.toLowerCase().includes('kelurahan')
  );

  const targetName = targetContact ? targetContact.nameTitle : targetRole;
  const targetPhone = targetContact ? targetContact.phoneNumber : '0813-9876-5432';

  const categoryDisplayName =
    activity.customCategoryName ||
    (CategoryMeta[activity.category]?.displayName || activity.category);

  const quotaText = activity.quota ? `${activity.quota} Orang` : 'Tanpa Batas Kuota';

  const message =
    `*PERMOHONAN PERSETUJUAN (ACC) KEGIATAN LINGKUNGAN*\n` +
    `_Aplikasi Manajemen Lingkungan Konek_\n\n` +
    `Kepada Yth. *${targetName}*,\n\n` +
    `Saya *${sender.name}* (${sender.role === 'RT' ? `Ketua RT ${sender.rt}` : sender.role === 'POSYANDU' ? 'Kader Posyandu' : 'Pengurus Lingkungan'}), bermaksud mengajukan kegiatan baru untuk mendapatkan persetujuan (ACC):\n\n` +
    `📌 *Judul Kegiatan:* ${activity.title}\n` +
    `🏷️ *Kategori:* ${categoryDisplayName}\n` +
    `🗓️ *Hari & Tanggal:* ${activity.formattedDate}\n` +
    `⏰ *Waktu:* ${activity.timeSlot}\n` +
    `📍 *Lokasi / Titik Kumpul:* ${activity.locationName} (${activity.locationAddress})\n` +
    `🎯 *Sasaran Peserta:* ${activity.targetRegion}\n` +
    `👥 *Batas Partisipan:* ${quotaText}\n\n` +
    `📝 *Deskripsi / Rincian:*\n${activity.description}\n\n` +
    `Mohon kiranya Bapak/Ibu dapat memeriksa dan memberikan *Persetujuan (ACC)* melalui aplikasi Konek agar kegiatan ini dapat dipublikasikan untuk seluruh warga.\n\n` +
    `Terima kasih atas perhatian dan kerjasamanya! 🙏✨`;

  return {
    message,
    targetRole,
    targetName,
    targetPhone,
  };
};

/**
 * Build WhatsApp approval request message for an Announcement.
 */
export const buildAnnouncementApprovalMessage = (
  announcement: AnnouncementItem,
  sender: UserProfile,
  contacts: ContactItem[] = defaultContacts
): {
  message: string;
  targetRole: string;
  targetName: string;
  targetPhone: string;
} => {
  const isTargetRW = announcement.approvalStatus === 'WAITING_RW_APPROVAL' || sender.role === 'RT';

  let targetRole = isTargetRW ? 'Ketua RW 05' : 'Staf Kelurahan Sukamaju';
  let targetContact = contacts.find((c) =>
    isTargetRW ? c.nameTitle.toLowerCase().includes('rw') : c.category.toLowerCase().includes('kelurahan')
  );

  const targetName = targetContact ? targetContact.nameTitle : targetRole;
  const targetPhone = targetContact ? targetContact.phoneNumber : '0813-9876-5432';

  const message =
    `*PERMOHONAN PERSETUJUAN (ACC) PENGUMUMAN RESMI*\n` +
    `_Aplikasi Manajemen Lingkungan Konek_\n\n` +
    `Kepada Yth. *${targetName}*,\n\n` +
    `Saya *${sender.name}* (${sender.role === 'RT' ? `Ketua RT ${sender.rt}` : 'Pengurus RT'}), mengajukan penerbitan pengumuman resmi lingkungan:\n\n` +
    `📢 *Judul:* ${announcement.title}\n` +
    `🚨 *Tingkat Urgensi:* ${announcement.urgency}\n` +
    `🎯 *Sasaran Wilayah:* ${announcement.targetRegion}\n` +
    (announcement.formattedDate ? `🗓️ *Jadwal Terkait:* ${announcement.formattedDate}\n` : '') +
    `\n📄 *Isi Pengumuman:*\n${announcement.content}\n\n` +
    `Mohon kiranya Bapak/Ibu dapat memeriksa dan memberikan *Persetujuan (ACC)* melalui aplikasi Konek agar pengumuman ini segera tersampaikan ke warga.\n\n` +
    `Terima kasih banyak atas dukungannya! 🙏✨`;

  return {
    message,
    targetRole,
    targetName,
    targetPhone,
  };
};
