import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityCategoryType,
  ActivityItem,
  AnnouncementItem,
  AnnouncementUrgencyType,
  ApprovalStatusType,
  ContactItem,
  RsvpStatusType,
  UserProfile,
  UserRoleType,
} from '../types';
import {
  defaultContacts,
  defaultUserProfile,
  sampleActivities,
  sampleAnnouncements,
} from '../constants/sampleData';

const STORAGE_KEYS = {
  ACTIVITIES: '@salmon_activities_v2',
  ANNOUNCEMENTS: '@salmon_announcements_v2',
  CONTACTS: '@salmon_contacts_v2',
  USER_PROFILE: '@salmon_profile_v2',
};

interface AppContextType {
  currentUser: UserProfile;
  activities: ActivityItem[];
  announcements: AnnouncementItem[];
  contacts: ContactItem[];
  selectedCategoryFilter: ActivityCategoryType | null;
  setSelectedCategoryFilter: (cat: ActivityCategoryType | null) => void;
  selectedRegionFilter: string;
  setSelectedRegionFilter: (reg: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  snackbarMessage: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;
  switchRole: (newRole: UserRoleType) => void;
  loginWithGoogleProfile: (profile: { email: string; name: string; photoUrl?: string }) => void;
  updateRsvpStatus: (activityId: string, newStatus: RsvpStatusType) => void;
  addActivity: (params: {
    title: string;
    description: string;
    category: ActivityCategoryType;
    dateIso: string;
    formattedDate: string;
    timeSlot: string;
    locationName: string;
    locationAddress: string;
    targetRegion: string;
    quota?: number | null;
    imageUrl?: string | null;
  }) => void;
  updateActivity: (
    id: string,
    params: {
      title: string;
      description: string;
      category: ActivityCategoryType;
      dateIso: string;
      formattedDate: string;
      timeSlot: string;
      locationName: string;
      locationAddress: string;
      targetRegion: string;
      quota?: number | null;
      imageUrl?: string | null;
    }
  ) => void;
  rwApproveActivity: (activityId: string) => void;
  rwRejectActivity: (activityId: string) => void;
  adminApproveActivity: (activityId: string) => void;
  adminRejectActivity: (activityId: string) => void;
  addAnnouncement: (params: {
    title: string;
    content: string;
    urgency: AnnouncementUrgencyType;
    targetRegion: string;
    requirements?: string[];
    additionalInfo?: string | null;
  }) => void;
  updateAnnouncement: (
    id: string,
    params: {
      title: string;
      content: string;
      urgency: AnnouncementUrgencyType;
      targetRegion: string;
      requirements?: string[];
      additionalInfo?: string | null;
    }
  ) => void;
  rwApproveAnnouncement: (announcementId: string) => void;
  adminApproveAnnouncement: (announcementId: string) => void;
  rejectAnnouncement: (announcementId: string) => void;
  addContact: (nameTitle: string, phoneNumber: string, category: string) => void;
  updateContact: (id: string, nameTitle: string, phoneNumber: string, category: string) => void;
  deleteContact: (contactId: string) => void;
  addDocumentationPhoto: (activityId: string, photoUrl: string) => void;
  deleteDocumentationPhoto: (activityId: string, photoUrl: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(defaultUserProfile);
  const [activities, setActivities] = useState<ActivityItem[]>(sampleActivities);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(sampleAnnouncements);
  const [contacts, setContacts] = useState<ContactItem[]>(defaultContacts);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<ActivityCategoryType | null>(
    null
  );
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('Semua Wilayah');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        if (storedProfile) setCurrentUser(JSON.parse(storedProfile));

        const storedActivities = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITIES);
        if (storedActivities) setActivities(JSON.parse(storedActivities));

        const storedAnnouncements = await AsyncStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
        if (storedAnnouncements) setAnnouncements(JSON.parse(storedAnnouncements));

        const storedContacts = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
        if (storedContacts) setContacts(JSON.parse(storedContacts));
      } catch (e) {
        console.warn('Gagal memuat data dari AsyncStorage:', e);
      }
    };
    loadStoredData();
  }, []);

  const showToast = (msg: string) => {
    setSnackbarMessage(msg);
  };

  const clearToast = () => {
    setSnackbarMessage(null);
  };

  const persistProfile = async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('Gagal menyimpan profil:', e);
    }
  };

  const persistActivities = async (items: ActivityItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(items));
    } catch (e) {
      console.warn('Gagal menyimpan kegiatan:', e);
    }
  };

  const persistAnnouncements = async (items: AnnouncementItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(items));
    } catch (e) {
      console.warn('Gagal menyimpan pengumuman:', e);
    }
  };

  const persistContacts = async (items: ContactItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(items));
    } catch (e) {
      console.warn('Gagal menyimpan kontak:', e);
    }
  };

  const switchRole = (newRole: UserRoleType) => {
    const roleNames: Record<UserRoleType, string> = {
      WARGA: 'Budi Santoso',
      RT: 'Bambang Wijaya (Ketua RT 03)',
      RW: 'Sutrisno (Ketua RW 05)',
      POSYANDU: 'Ibu Ningsih (Kader Posyandu)',
      STAF_KELURAHAN: 'Hendra Pratama (Staf Kesra)',
    };

    const updatedProfile: UserProfile = {
      ...currentUser,
      role: newRole,
      name: roleNames[newRole],
    };

    setCurrentUser(updatedProfile);
    persistProfile(updatedProfile);
    showToast(`Beralih ke peran: ${newRole}`);
  };

  const loginWithGoogleProfile = (profile: { email: string; name: string; photoUrl?: string }) => {
    const isAdmin = profile.email.toLowerCase().trim() === 'salmanakhdanhidayat@gmail.com';
    const assignedRole: UserRoleType = isAdmin ? 'STAF_KELURAHAN' : 'WARGA';

    const updatedProfile: UserProfile = {
      id: profile.email,
      name: profile.name || (isAdmin ? 'Salman Akhdan (Admin)' : 'Warga Sukamaju'),
      nik: isAdmin ? '3201012345670001' : '3201019876540002',
      email: profile.email,
      phone: '081234567890',
      role: assignedRole,
      rt: '002',
      rw: '005',
      kelurahan: 'Sukamaju',
      avatarUrl: profile.photoUrl || undefined,
    };

    setCurrentUser(updatedProfile);
    persistProfile(updatedProfile);
    showToast(`Selamat datang, ${updatedProfile.name}!`);
  };

  const updateRsvpStatus = (activityId: string, newStatus: RsvpStatusType) => {
    setActivities((prevActivities) => {
      const updated = prevActivities.map((item) => {
        if (item.id !== activityId) return item;

        let diffConfirmed = 0;
        let diffMaybe = 0;

        if (item.userRsvpStatus === 'ATTENDING') diffConfirmed--;
        if (item.userRsvpStatus === 'MAYBE') diffMaybe--;

        if (newStatus === 'ATTENDING') diffConfirmed++;
        if (newStatus === 'MAYBE') diffMaybe++;

        return {
          ...item,
          userRsvpStatus: newStatus,
          confirmedCount: Math.max(0, item.confirmedCount + diffConfirmed),
          maybeCount: Math.max(0, item.maybeCount + diffMaybe),
        };
      });

      persistActivities(updated);
      return updated;
    });

    const msg =
      newStatus === 'ATTENDING'
        ? 'Status RSVP disetujui: Anda memilih HADIR!'
        : newStatus === 'MAYBE'
        ? 'Status RSVP: Ragu-ragu dicatat.'
        : newStatus === 'NOT_ATTENDING'
        ? 'Status RSVP: Anda memilih Tidak Hadir.'
        : 'Status RSVP dihapus.';
    showToast(msg);
  };

  const addActivity = (params: {
    title: string;
    description: string;
    category: ActivityCategoryType;
    dateIso: string;
    formattedDate: string;
    timeSlot: string;
    locationName: string;
    locationAddress: string;
    targetRegion: string;
    quota?: number | null;
    imageUrl?: string | null;
  }) => {
    let initialApproval: ApprovalStatusType = 'PUBLISHED';
    let followUpNote: string | null = null;
    let needsFollowUp = false;

    if (currentUser.role === 'RT') {
      initialApproval = 'WAITING_RW_APPROVAL';
      needsFollowUp = true;
      followUpNote = 'Menunggu ACC Ketua RW 05';
    } else if (currentUser.role === 'RW') {
      initialApproval = 'WAITING_ADMIN_APPROVAL';
      needsFollowUp = true;
      followUpNote = 'Menunggu ACC Staf Kelurahan';
    }

    const newItem: ActivityItem = {
      id: `ACT-${Date.now() % 10000}`,
      title: params.title,
      description: params.description,
      category: params.category,
      dateIso: params.dateIso,
      formattedDate: params.formattedDate,
      timeSlot: params.timeSlot,
      locationName: params.locationName,
      locationAddress: params.locationAddress,
      latitude: -6.215,
      longitude: 106.845,
      targetRegion: params.targetRegion,
      organizerRole: currentUser.role,
      organizerName: currentUser.name,
      confirmedCount: 1,
      maybeCount: 0,
      quota: params.quota || null,
      userRsvpStatus: 'ATTENDING',
      photos: params.imageUrl ? [params.imageUrl] : [],
      imageUrl: params.imageUrl || null,
      approvalStatus: initialApproval,
      needsFollowUp,
      followUpNote,
      isFeatured: false,
    };

    setActivities((prev) => {
      const updated = [newItem, ...prev];
      persistActivities(updated);
      return updated;
    });

    const toastMsg =
      initialApproval === 'WAITING_RW_APPROVAL'
        ? 'Pengajuan kegiatan dikirim. Menunggu persetujuan RW!'
        : initialApproval === 'WAITING_ADMIN_APPROVAL'
        ? 'Pengajuan kegiatan dikirim. Menunggu persetujuan Kelurahan!'
        : 'Kegiatan resmi berhasil diterbitkan!';
    showToast(toastMsg);
  };

  const updateActivity = (
    id: string,
    params: {
      title: string;
      description: string;
      category: ActivityCategoryType;
      dateIso: string;
      formattedDate: string;
      timeSlot: string;
      locationName: string;
      locationAddress: string;
      targetRegion: string;
      quota?: number | null;
      imageUrl?: string | null;
    }
  ) => {
    setActivities((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          ...params,
          imageUrl: params.imageUrl !== undefined ? params.imageUrl : item.imageUrl,
        };
      });
      persistActivities(updated);
      return updated;
    });
    showToast(`Perubahan kegiatan '${params.title}' berhasil diperbarui!`);
  };

  const rwApproveActivity = (activityId: string) => {
    setActivities((prev) => {
      const updated = prev.map((item) =>
        item.id === activityId
          ? {
              ...item,
              approvalStatus: 'WAITING_ADMIN_APPROVAL' as ApprovalStatusType,
              needsFollowUp: true,
              followUpNote: 'Telah disetujui RW 05 • Menunggu ACC Kelurahan',
            }
          : item
      );
      persistActivities(updated);
      return updated;
    });
    showToast('Kegiatan disetujui RW & diteruskan ke Staf Kelurahan!');
  };

  const rwRejectActivity = (activityId: string) => {
    setActivities((prev) => {
      const updated = prev.map((item) =>
        item.id === activityId
          ? {
              ...item,
              approvalStatus: 'REJECTED' as ApprovalStatusType,
              needsFollowUp: false,
              followUpNote: 'Ditolak oleh Ketua RW 05',
            }
          : item
      );
      persistActivities(updated);
      return updated;
    });
    showToast('Pengajuan kegiatan telah ditolak oleh RW.');
  };

  const adminApproveActivity = (activityId: string) => {
    setActivities((prev) => {
      const updated = prev.map((item) =>
        item.id === activityId
          ? {
              ...item,
              approvalStatus: 'PUBLISHED' as ApprovalStatusType,
              needsFollowUp: false,
              followUpNote: null,
            }
          : item
      );
      persistActivities(updated);
      return updated;
    });
    showToast('Kegiatan disetujui resmi & diterbitkan untuk Warga!');
  };

  const adminRejectActivity = (activityId: string) => {
    setActivities((prev) => {
      const updated = prev.map((item) =>
        item.id === activityId
          ? {
              ...item,
              approvalStatus: 'REJECTED' as ApprovalStatusType,
              needsFollowUp: false,
              followUpNote: 'Ditolak oleh Staf Kelurahan',
            }
          : item
      );
      persistActivities(updated);
      return updated;
    });
    showToast('Pengajuan kegiatan ditolak oleh Staf Kelurahan.');
  };

  const addDocumentationPhoto = (activityId: string, photoUrl: string) => {
    setActivities((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== activityId) return item;
        return {
          ...item,
          photos: [photoUrl, ...(item.photos || [])],
        };
      });
      persistActivities(updated);
      return updated;
    });
    showToast('Foto dokumentasi baru berhasil ditambahkan!');
  };

  const deleteDocumentationPhoto = (activityId: string, photoUrl: string) => {
    setActivities((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== activityId) return item;
        return {
          ...item,
          photos: (item.photos || []).filter((p) => p !== photoUrl),
        };
      });
      persistActivities(updated);
      return updated;
    });
    showToast('Foto dokumentasi dihapus.');
  };

  const addAnnouncement = (params: {
    title: string;
    content: string;
    urgency: AnnouncementUrgencyType;
    targetRegion: string;
    requirements?: string[];
    additionalInfo?: string | null;
  }) => {
    let initialApproval: ApprovalStatusType = 'PUBLISHED';
    if (currentUser.role === 'RT') {
      initialApproval = 'WAITING_RW_APPROVAL';
    } else if (currentUser.role === 'RW') {
      initialApproval = 'WAITING_ADMIN_APPROVAL';
    }

    const newAnn: AnnouncementItem = {
      id: `ANN-${Date.now() % 1000}`,
      title: params.title,
      content: params.content,
      formattedDate: 'Hari Ini',
      authorName: currentUser.name,
      authorRole: currentUser.role,
      targetRegion: params.targetRegion,
      urgency: params.urgency,
      requirements: params.requirements || [],
      additionalInfo: params.additionalInfo || null,
      approvalStatus: initialApproval,
      isPinned: params.urgency === 'PENTING' || params.urgency === 'DARURAT',
    };

    setAnnouncements((prev) => {
      const updated = [newAnn, ...prev];
      persistAnnouncements(updated);
      return updated;
    });

    const toastMsg =
      initialApproval === 'WAITING_RW_APPROVAL'
        ? 'Pengumuman dikirim. Menunggu persetujuan RW!'
        : initialApproval === 'WAITING_ADMIN_APPROVAL'
        ? 'Pengumuman dikirim. Menunggu persetujuan Kelurahan!'
        : 'Pengumuman resmi berhasil diterbitkan!';
    showToast(toastMsg);
  };

  const updateAnnouncement = (
    id: string,
    params: {
      title: string;
      content: string;
      urgency: AnnouncementUrgencyType;
      targetRegion: string;
      requirements?: string[];
      additionalInfo?: string | null;
    }
  ) => {
    setAnnouncements((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          ...params,
          requirements: params.requirements || [],
          isPinned: params.urgency === 'PENTING' || params.urgency === 'DARURAT',
        };
      });
      persistAnnouncements(updated);
      return updated;
    });
    showToast('Pengumuman diperbarui!');
  };

  const rwApproveAnnouncement = (announcementId: string) => {
    setAnnouncements((prev) => {
      const updated = prev.map((item) =>
        item.id === announcementId
          ? { ...item, approvalStatus: 'WAITING_ADMIN_APPROVAL' as ApprovalStatusType }
          : item
      );
      persistAnnouncements(updated);
      return updated;
    });
    showToast('Pengumuman disetujui RW & diteruskan ke Staf Kelurahan!');
  };

  const adminApproveAnnouncement = (announcementId: string) => {
    setAnnouncements((prev) => {
      const updated = prev.map((item) =>
        item.id === announcementId
          ? { ...item, approvalStatus: 'PUBLISHED' as ApprovalStatusType }
          : item
      );
      persistAnnouncements(updated);
      return updated;
    });
    showToast('Pengumuman disetujui resmi & diterbitkan untuk Warga!');
  };

  const rejectAnnouncement = (announcementId: string) => {
    setAnnouncements((prev) => {
      const updated = prev.map((item) =>
        item.id === announcementId
          ? { ...item, approvalStatus: 'REJECTED' as ApprovalStatusType }
          : item
      );
      persistAnnouncements(updated);
      return updated;
    });
    showToast('Pengumuman ditolak.');
  };

  const addContact = (nameTitle: string, phoneNumber: string, category: string) => {
    const newContact: ContactItem = {
      id: `CNT-${Date.now() % 1000}`,
      nameTitle,
      phoneNumber,
      category,
    };
    setContacts((prev) => {
      const updated = [...prev, newContact];
      persistContacts(updated);
      return updated;
    });
    showToast('Kontak penting berhasil ditambahkan!');
  };

  const updateContact = (id: string, nameTitle: string, phoneNumber: string, category: string) => {
    setContacts((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, nameTitle, phoneNumber, category } : item
      );
      persistContacts(updated);
      return updated;
    });
    showToast('Kontak penting berhasil diperbarui!');
  };

  const deleteContact = (contactId: string) => {
    setContacts((prev) => {
      const updated = prev.filter((item) => item.id !== contactId);
      persistContacts(updated);
      return updated;
    });
    showToast('Kontak telah dihapus.');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activities,
        announcements,
        contacts,
        selectedCategoryFilter,
        setSelectedCategoryFilter,
        selectedRegionFilter,
        setSelectedRegionFilter,
        searchQuery,
        setSearchQuery,
        snackbarMessage,
        showToast,
        clearToast,
        switchRole,
        loginWithGoogleProfile,
        updateRsvpStatus,
        addActivity,
        updateActivity,
        rwApproveActivity,
        rwRejectActivity,
        adminApproveActivity,
        adminRejectActivity,
        addAnnouncement,
        updateAnnouncement,
        rwApproveAnnouncement,
        adminApproveAnnouncement,
        rejectAnnouncement,
        addContact,
        updateContact,
        deleteContact,
        addDocumentationPhoto,
        deleteDocumentationPhoto,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
