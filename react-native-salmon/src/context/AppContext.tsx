import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, ensureAuth } from '../services/firebase';
import {
  ActivityCategoryType,
  ActivityItem,
  AnnouncementItem,
  AnnouncementUrgencyType,
  ApprovalStatusType,
  ContactItem,
  LocationPresetItem,
  RegionInvitationCode,
  RsvpStatusType,
  UserProfile,
  UserRoleType,
} from '../types';
import {
  defaultContacts,
  defaultLocationPresets,
  defaultRegionCodes,
  defaultUserProfile,
  sampleActivities,
  sampleAnnouncements,
} from '../constants/sampleData';

const STORAGE_KEYS = {
  ACTIVITIES: '@salmon_activities_v2',
  ANNOUNCEMENTS: '@salmon_announcements_v2',
  CONTACTS: '@salmon_contacts_v2',
  REGION_CODES: '@salmon_region_codes_v2',
  USER_PROFILE: '@salmon_profile_v2',
  LOCATION_PRESETS: '@salmon_locations_v2',
};

// Helper to remove undefined fields before writing to Firestore
const sanitizeForFirestore = (data: Record<string, any>): Record<string, any> => {
  const clean: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    const val = data[key];
    if (val !== undefined) {
      clean[key] = val;
    }
  });
  return clean;
};

interface AppContextType {
  currentUser: UserProfile;
  activities: ActivityItem[];
  announcements: AnnouncementItem[];
  contacts: ContactItem[];
  regionCodes: RegionInvitationCode[];
  locationPresets: LocationPresetItem[];
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
  updateProfile: (updatedData: Partial<UserProfile>) => void;
  loginWithGoogleProfile: (profile: { email: string; name: string; photoUrl?: string }) => void;
  createOrUpdateRegionCode: (params: {
    code: string;
    description: string;
    rt?: string;
    rw?: string;
  }) => { success: boolean; message: string };
  toggleRegionCodeStatus: (codeId: string) => void;
  deleteRegionCode: (codeId: string) => void;
  verifyUserWithCode: (inputCode: string) => { success: boolean; message: string };
  removeVerification: () => void;
  updateRsvpStatus: (activityId: string, newStatus: RsvpStatusType) => void;
  addLocationPreset: (name: string, address: string) => void;
  updateLocationPreset: (id: string, name: string, address: string) => void;
  deleteLocationPreset: (id: string) => void;
  addActivity: (params: {
    title: string;
    description: string;
    category: ActivityCategoryType;
    customCategoryName?: string;
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
      customCategoryName?: string;
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
    formattedDate?: string;
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
      formattedDate?: string;
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
  addDocumentationVideo: (activityId: string, videoUrl: string) => void;
  deleteDocumentationVideo: (activityId: string, videoUrl: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(defaultUserProfile);
  const [activities, setActivities] = useState<ActivityItem[]>(sampleActivities);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(sampleAnnouncements);
  const [contacts, setContacts] = useState<ContactItem[]>(defaultContacts);
  const [regionCodes, setRegionCodes] = useState<RegionInvitationCode[]>(defaultRegionCodes);
  const [locationPresets, setLocationPresets] = useState<LocationPresetItem[]>(defaultLocationPresets);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<ActivityCategoryType | null>(
    null
  );
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('Semua Wilayah');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  // 1. Initial load from AsyncStorage for instant offline rendering
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

        const storedRegionCodes = await AsyncStorage.getItem(STORAGE_KEYS.REGION_CODES);
        if (storedRegionCodes) setRegionCodes(JSON.parse(storedRegionCodes));

        const storedLocations = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_PRESETS);
        if (storedLocations) setLocationPresets(JSON.parse(storedLocations));
      } catch (e) {
        console.warn('Gagal memuat cache lokal:', e);
      }
    };
    loadStoredData();
    ensureAuth();
  }, []);

  // 2. Realtime Firestore Sync for Activities
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'activities'),
      (snapshot) => {
        if (!snapshot.empty) {
          const items: ActivityItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            items.push({
              userRsvpStatus: 'NONE',
              approvalStatus: 'PUBLISHED',
              category: 'KERJA_BAKTI',
              confirmedCount: 0,
              maybeCount: 0,
              targetRegion: 'Semua Wilayah',
              ...(data as ActivityItem),
              id: docSnap.id,
            });
          });
          setActivities(items);
          persistActivities(items);
        }
      },
      (error) => {
        console.warn('Firestore activities listener error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Realtime Firestore Sync for Announcements
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'announcements'),
      (snapshot) => {
        if (!snapshot.empty) {
          const items: AnnouncementItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            items.push({
              urgency: 'INFO',
              approvalStatus: 'PUBLISHED',
              targetRegion: 'Semua Wilayah',
              ...(data as AnnouncementItem),
              id: docSnap.id,
            });
          });
          setAnnouncements(items);
          persistAnnouncements(items);
        }
      },
      (error) => {
        console.warn('Firestore announcements listener error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // 4. Realtime Firestore Sync for Region Codes & Location Presets
  useEffect(() => {
    const unsubCodes = onSnapshot(
      collection(db, 'regionCodes'),
      (snapshot) => {
        if (!snapshot.empty) {
          const items: RegionInvitationCode[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ ...(docSnap.data() as RegionInvitationCode), id: docSnap.id });
          });
          setRegionCodes(items);
          persistRegionCodes(items);
        }
      },
      (err) => console.warn('Firestore regionCodes listener:', err)
    );

    const unsubLocations = onSnapshot(
      collection(db, 'locationPresets'),
      (snapshot) => {
        if (!snapshot.empty) {
          const items: LocationPresetItem[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ ...(docSnap.data() as LocationPresetItem), id: docSnap.id });
          });
          setLocationPresets(items);
          persistLocationPresets(items);
        }
      },
      (err) => console.warn('Firestore locationPresets listener:', err)
    );

    return () => {
      unsubCodes();
      unsubLocations();
    };
  }, []);

  // 5. Realtime Sync for Current User Profile in Firestore
  useEffect(() => {
    if (!currentUser.id || currentUser.id === 'user-salman-admin') return;

    const userDocId = currentUser.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    const unsubscribe = onSnapshot(
      doc(db, 'users', userDocId),
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data() as Partial<UserProfile>;
          setCurrentUser((prev) => {
            const merged: UserProfile = {
              ...prev,
              ...remoteData,
              id: prev.id,
              email: prev.email,
            };
            persistProfile(merged);
            return merged;
          });
        }
      },
      (error) => {
        console.warn('Firestore user listener error:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser.email]);

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

  const persistRegionCodes = async (items: RegionInvitationCode[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REGION_CODES, JSON.stringify(items));
    } catch (e) {
      console.warn('Gagal menyimpan kode wilayah:', e);
    }
  };

  const persistLocationPresets = async (items: LocationPresetItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_PRESETS, JSON.stringify(items));
    } catch (e) {
      console.warn('Gagal menyimpan rekomendasi lokasi:', e);
    }
  };

  const updateProfile = async (updatedData: Partial<UserProfile>) => {
    const updated: UserProfile = {
      ...currentUser,
      ...updatedData,
    };
    setCurrentUser(updated);
    persistProfile(updated);

    // Sync to Firestore
    if (updated.email) {
      const userDocId = updated.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      try {
        await setDoc(doc(db, 'users', userDocId), sanitizeForFirestore(updated), { merge: true });
      } catch (err) {
        console.warn('Gagal sync profil ke Firestore:', err);
      }
    }
    showToast('Profil berhasil disimpan & disinkronkan ke Cloud!');
  };

  const createOrUpdateRegionCode = (params: {
    code: string;
    description: string;
    rt?: string;
    rw?: string;
  }): { success: boolean; message: string } => {
    const cleanCode = params.code.trim().toUpperCase().replace(/\s+/g, '-');
    if (cleanCode.length < 4) {
      showToast('Kode wilayah minimal 4 karakter!');
      return { success: false, message: 'Kode wilayah minimal 4 karakter!' };
    }

    const isRoleRw = currentUser.role === 'RW';
    const roleType: 'RT' | 'RW' = isRoleRw ? 'RW' : 'RT';
    const rtValue = isRoleRw ? 'Semua RT' : params.rt || currentUser.rt || '03';
    const rwValue = params.rw || currentUser.rw || '05';

    const existing = regionCodes.find((rc) => rc.code.toUpperCase() === cleanCode);
    const codeId = existing ? existing.id : `RC-${Date.now() % 10000}`;

    const newRegionCode: RegionInvitationCode = {
      id: codeId,
      code: cleanCode,
      role: roleType,
      creatorName: currentUser.name,
      rt: rtValue,
      rw: rwValue,
      kelurahan: currentUser.kelurahan || 'Sukamaju',
      description:
        params.description ||
        (existing?.description ?? `Kode Resmi Warga Lingkungan RT ${rtValue} / RW ${rwValue}`),
      createdAt: existing?.createdAt || 'Hari Ini',
      isActive: true,
      membersCount: existing?.membersCount || 0,
    };

    const updatedCodes = existing
      ? regionCodes.map((rc) => (rc.id === codeId ? newRegionCode : rc))
      : [newRegionCode, ...regionCodes];

    setRegionCodes(updatedCodes);
    persistRegionCodes(updatedCodes);

    // Sync to Firestore in background
    setDoc(doc(db, 'regionCodes', codeId), sanitizeForFirestore(newRegionCode)).catch((e) => {
      console.warn('Gagal simpan kode wilayah ke Firestore:', e);
    });

    showToast(`Kode wilayah ${cleanCode} berhasil dibuat & diaktifkan!`);
    return { success: true, message: `Kode ${cleanCode} siap dibagikan ke warga!` };
  };

  const toggleRegionCodeStatus = async (codeId: string) => {
    const target = regionCodes.find((rc) => rc.id === codeId);
    if (!target) return;

    const newActiveState = !target.isActive;
    setRegionCodes((prev) => {
      const updated = prev.map((rc) =>
        rc.id === codeId ? { ...rc, isActive: newActiveState } : rc
      );
      persistRegionCodes(updated);
      return updated;
    });

    try {
      await updateDoc(doc(db, 'regionCodes', codeId), { isActive: newActiveState });
    } catch (e) {
      console.warn('Gagal update status kode wilayah:', e);
    }
    showToast('Status keaktifan kode berhasil diubah.');
  };

  const deleteRegionCode = async (codeId: string) => {
    setRegionCodes((prev) => {
      const updated = prev.filter((rc) => rc.id !== codeId);
      persistRegionCodes(updated);
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'regionCodes', codeId));
    } catch (e) {
      console.warn('Gagal menghapus kode wilayah dari Firestore:', e);
    }
    showToast('Kode wilayah telah dihapus.');
  };

  const verifyUserWithCode = (inputCode: string): { success: boolean; message: string } => {
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) {
      showToast('Silakan masukkan kode wilayah!');
      return { success: false, message: 'Silakan masukkan kode wilayah!' };
    }

    const match = regionCodes.find(
      (rc) => rc.code.trim().toUpperCase() === cleanCode && rc.isActive
    );

    if (!match) {
      showToast('Kode wilayah tidak ditemukan atau tidak aktif.');
      return {
        success: false,
        message: 'Kode undangan tidak ditemukan atau sudah tidak aktif. Silakan tanyakan ke Ketua RT/RW Anda.',
      };
    }

    // Update current user to verified
    const updatedUser: UserProfile = {
      ...currentUser,
      isVerifiedWarga: true,
      verifiedCode: match.code,
      verifiedAt: 'Hari Ini',
      rt: match.rt !== 'Semua RT' ? match.rt : currentUser.rt,
      rw: match.rw,
      kelurahan: match.kelurahan,
    };

    setCurrentUser(updatedUser);
    persistProfile(updatedUser);

    // Increment members count
    const newCount = (match.membersCount || 0) + 1;
    const updatedRegionCodes = regionCodes.map((rc) =>
      rc.id === match.id ? { ...rc, membersCount: newCount } : rc
    );
    setRegionCodes(updatedRegionCodes);
    persistRegionCodes(updatedRegionCodes);

    // Sync to Firestore in background
    if (updatedUser.email) {
      const userDocId = updatedUser.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      setDoc(doc(db, 'users', userDocId), sanitizeForFirestore(updatedUser), { merge: true }).catch(
        (e) => console.warn('Gagal sinkron verifikasi user ke Firestore:', e)
      );
    }
    updateDoc(doc(db, 'regionCodes', match.id), { membersCount: newCount }).catch((e) =>
      console.warn('Gagal update membersCount di Firestore:', e)
    );

    showToast(`Selamat! Terverifikasi sebagai warga RT ${updatedUser.rt} / RW ${updatedUser.rw}`);
    return {
      success: true,
      message: `Berhasil terverifikasi di wilayah ${match.description}!`,
    };
  };

  const removeVerification = async () => {
    const updatedUser: UserProfile = {
      ...currentUser,
      isVerifiedWarga: false,
      verifiedCode: undefined,
      verifiedAt: undefined,
    };
    setCurrentUser(updatedUser);
    persistProfile(updatedUser);

    if (updatedUser.email) {
      const userDocId = updatedUser.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      try {
        await updateDoc(doc(db, 'users', userDocId), {
          isVerifiedWarga: false,
          verifiedCode: null,
          verifiedAt: null,
        });
      } catch (e) {
        console.warn('Gagal reset verifikasi di Firestore:', e);
      }
    }
    showToast('Status verifikasi wilayah direset (belum terverifikasi).');
  };

  const switchRole = async (newRole: UserRoleType) => {
    const updatedProfile: UserProfile = {
      ...currentUser,
      role: newRole,
    };

    setCurrentUser(updatedProfile);
    persistProfile(updatedProfile);

    if (updatedProfile.email) {
      const userDocId = updatedProfile.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      try {
        await setDoc(doc(db, 'users', userDocId), { role: newRole, userRole: newRole }, { merge: true });
      } catch (e) {
        console.warn('Gagal update role di Firestore:', e);
      }
    }
    showToast(`Peran diubah: ${newRole}`);
  };

  const loginWithGoogleProfile = async (profile: { email: string; name: string; photoUrl?: string }) => {
    const cleanEmail = profile.email.toLowerCase().trim();
    const isAdmin = cleanEmail === 'salmanakhdanhidayat@gmail.com' || cleanEmail === 'ytsalmon37@gmail.com';
    const userDocId = cleanEmail.replace(/[^a-z0-9]/g, '_');

    let finalRole: UserRoleType = isAdmin ? 'STAF_KELURAHAN' : 'WARGA';
    let finalProfile: UserProfile = {
      id: profile.email,
      name: profile.name || (isAdmin ? 'Salman Akhdan (Admin)' : 'Warga Baru Sukamaju'),
      nik: isAdmin ? '3201012345670001' : '',
      email: profile.email,
      phone: '',
      role: finalRole,
      rt: isAdmin ? '002' : '03',
      rw: '005',
      kelurahan: 'Sukamaju',
      avatarUrl: profile.photoUrl || undefined,
      isVerifiedWarga: isAdmin,
    };

    // Check if user already exists in Firestore
    try {
      const existingUserSnap = await getDoc(doc(db, 'users', userDocId));
      if (existingUserSnap.exists()) {
        const remoteData = existingUserSnap.data() as UserProfile;
        finalProfile = {
          ...finalProfile,
          ...remoteData,
          name: profile.name || remoteData.name,
          avatarUrl: profile.photoUrl || remoteData.avatarUrl,
        };
      } else {
        // Save initial user to Firestore
        await setDoc(doc(db, 'users', userDocId), sanitizeForFirestore(finalProfile));
      }
    } catch (e) {
      console.warn('Gagal baca/tulis profil user di Firestore:', e);
    }

    setCurrentUser(finalProfile);
    persistProfile(finalProfile);
    showToast(`Selamat datang, ${finalProfile.name}!`);
  };

  const updateRsvpStatus = async (activityId: string, newStatus: RsvpStatusType) => {
    if (currentUser.role === 'WARGA' && !currentUser.isVerifiedWarga && newStatus !== 'NONE') {
      showToast('⚠️ Reservasi terkunci! Masukkan kode undangan RT Anda di Profil terlebih dahulu.');
      return;
    }

    let diffConfirmed = 0;
    let diffMaybe = 0;
    let targetItem = activities.find((item) => item.id === activityId);

    if (targetItem) {
      if (targetItem.userRsvpStatus === 'ATTENDING') diffConfirmed--;
      if (targetItem.userRsvpStatus === 'MAYBE') diffMaybe--;

      if (newStatus === 'ATTENDING') diffConfirmed++;
      if (newStatus === 'MAYBE') diffMaybe++;

      const newConfirmed = Math.max(0, targetItem.confirmedCount + diffConfirmed);
      const newMaybe = Math.max(0, targetItem.maybeCount + diffMaybe);

      setActivities((prevActivities) => {
        const updated = prevActivities.map((item) =>
          item.id === activityId
            ? {
                ...item,
                userRsvpStatus: newStatus,
                confirmedCount: newConfirmed,
                maybeCount: newMaybe,
              }
            : item
        );
        persistActivities(updated);
        return updated;
      });

      // Sync to Firestore
      try {
        await updateDoc(doc(db, 'activities', activityId), {
          userRsvpStatus: newStatus,
          confirmedCount: newConfirmed,
          maybeCount: newMaybe,
        });
      } catch (e) {
        console.warn('Gagal update status RSVP ke Firestore:', e);
      }
    }

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

  const addLocationPreset = async (name: string, address: string) => {
    const newLoc: LocationPresetItem = {
      id: `LOC-${Date.now() % 10000}`,
      name: name.trim(),
      address: address.trim(),
    };
    setLocationPresets((prev) => {
      const updated = [newLoc, ...prev];
      persistLocationPresets(updated);
      return updated;
    });

    try {
      await setDoc(doc(db, 'locationPresets', newLoc.id), newLoc);
    } catch (e) {
      console.warn('Gagal simpan lokasi ke Firestore:', e);
    }
    showToast(`Rekomendasi tempat '${name}' berhasil ditambahkan!`);
  };

  const updateLocationPreset = async (id: string, name: string, address: string) => {
    setLocationPresets((prev) => {
      const updated = prev.map((loc) =>
        loc.id === id ? { ...loc, name: name.trim(), address: address.trim() } : loc
      );
      persistLocationPresets(updated);
      return updated;
    });

    try {
      await updateDoc(doc(db, 'locationPresets', id), { name: name.trim(), address: address.trim() });
    } catch (e) {
      console.warn('Gagal update lokasi di Firestore:', e);
    }
    showToast('Rekomendasi tempat berhasil diperbarui.');
  };

  const deleteLocationPreset = async (id: string) => {
    setLocationPresets((prev) => {
      const updated = prev.filter((loc) => loc.id !== id);
      persistLocationPresets(updated);
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'locationPresets', id));
    } catch (e) {
      console.warn('Gagal menghapus lokasi dari Firestore:', e);
    }
    showToast('Rekomendasi tempat dihapus.');
  };

  const addActivity = async (params: {
    title: string;
    description: string;
    category: ActivityCategoryType;
    customCategoryName?: string;
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

    const actId = `ACT-${Date.now() % 10000}`;
    const newItem: ActivityItem = {
      id: actId,
      title: params.title,
      description: params.description,
      category: params.category,
      customCategoryName: params.customCategoryName || undefined,
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

    // Sync directly to Cloud Firestore
    try {
      await setDoc(doc(db, 'activities', actId), sanitizeForFirestore(newItem));
    } catch (e) {
      console.warn('Gagal menyimpan kegiatan baru ke Firestore:', e);
    }

    const toastMsg =
      initialApproval === 'WAITING_RW_APPROVAL'
        ? 'Pengajuan kegiatan dikirim. Menunggu persetujuan RW!'
        : initialApproval === 'WAITING_ADMIN_APPROVAL'
        ? 'Pengajuan kegiatan dikirim. Menunggu persetujuan Kelurahan!'
        : 'Kegiatan resmi berhasil diterbitkan secara online!';
    showToast(toastMsg);
  };

  const updateActivity = async (
    id: string,
    params: {
      title: string;
      description: string;
      category: ActivityCategoryType;
      customCategoryName?: string;
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

    try {
      await updateDoc(doc(db, 'activities', id), sanitizeForFirestore(params));
    } catch (e) {
      console.warn('Gagal update kegiatan di Firestore:', e);
    }

    showToast(`Perubahan kegiatan '${params.title}' berhasil diperbarui!`);
  };

  const rwApproveActivity = async (activityId: string) => {
    const updates = {
      approvalStatus: 'WAITING_ADMIN_APPROVAL' as ApprovalStatusType,
      needsFollowUp: true,
      followUpNote: 'Telah disetujui RW 05 • Menunggu ACC Kelurahan',
    };

    setActivities((prev) => {
      const updated = prev.map((item) => (item.id === activityId ? { ...item, ...updates } : item));
      persistActivities(updated);
      return updated;
    });

    try {
      await updateDoc(doc(db, 'activities', activityId), updates);
    } catch (e) {
      console.warn('Gagal rwApproveActivity di Firestore:', e);
    }
    showToast('Kegiatan disetujui RW & diteruskan ke Staf Kelurahan!');
  };

  const rwRejectActivity = async (activityId: string) => {
    const updates = {
      approvalStatus: 'REJECTED' as ApprovalStatusType,
      needsFollowUp: false,
      followUpNote: 'Ditolak oleh Ketua RW 05',
    };

    setActivities((prev) => {
      const updated = prev.map((item) => (item.id === activityId ? { ...item, ...updates } : item));
      persistActivities(updated);
      return updated;
    });

    try {
      await updateDoc(doc(db, 'activities', activityId), updates);
    } catch (e) {
      console.warn('Gagal rwRejectActivity di Firestore:', e);
    }
    showToast('Pengajuan kegiatan telah ditolak oleh RW.');
  };

  const adminApproveActivity = async (activityId: string) => {
    const updates = {
      approvalStatus: 'PUBLISHED' as ApprovalStatusType,
      needsFollowUp: false,
      followUpNote: null,
    };

    setActivities((prev) => {
      const updated = prev.map((item) => (item.id === activityId ? { ...item, ...updates } : item));
      persistActivities(updated);
      return updated;
    });

    try {
      await updateDoc(doc(db, 'activities', activityId), updates);
    } catch (e) {
      console.warn('Gagal adminApproveActivity di Firestore:', e);
    }
    showToast('Kegiatan disetujui resmi & diterbitkan untuk Warga!');
  };

  const adminRejectActivity = async (activityId: string) => {
    const updates = {
      approvalStatus: 'REJECTED' as ApprovalStatusType,
      needsFollowUp: false,
      followUpNote: 'Ditolak oleh Staf Kelurahan',
    };

    setActivities((prev) => {
      const updated = prev.map((item) => (item.id === activityId ? { ...item, ...updates } : item));
      persistActivities(updated);
      return updated;
    });

    try {
      await updateDoc(doc(db, 'activities', activityId), updates);
    } catch (e) {
      console.warn('Gagal adminRejectActivity di Firestore:', e);
    }
    showToast('Pengajuan kegiatan ditolak oleh Staf Kelurahan.');
  };

  const addDocumentationPhoto = async (activityId: string, photoUrl: string) => {
    const target = activities.find((item) => item.id === activityId);
    const newPhotos = [photoUrl, ...(target?.photos || [])];

    setActivities((prev) => {
      const updated = prev.map((item) =>
        item.id === activityId ? { ...item, photos: newPhotos } : item
      );
      persistActivities(updated);
      return updated;
    });

    try {
      await updateDoc(doc(db, 'activities', activityId), { photos: newPhotos });
    } catch (e) {
      console.warn('Gagal simpan foto dokumentasi ke Firestore:', e);
    }
    showToast('Foto dokumentasi baru berhasil ditambahkan!');
  };

  const deleteDocumentationPhoto = async (activityId: string, photoUrl: string) => {
    const target = activities.find((item) => item.id === activityId);
    const newPhotos = (target?.photos || []).filter((p) => p !== photoUrl);

    setActivities((prev) => {
      const updated = prev.map((item) =>
        item.id === activityId ? { ...item, photos: newPhotos } : item
      );
      persistActivities(updated);
      return updated;
    });

    try {
      await updateDoc(doc(db, 'activities', activityId), { photos: newPhotos });
    } catch (e) {
      console.warn('Gagal hapus foto dokumentasi di Firestore:', e);
    }
    showToast('Foto dokumentasi dihapus.');
  };

  const addDocumentationVideo = async (activityId: string, videoUrl: string) => {
    const target = activities.find((item) => item.id === activityId);
    const newVideos = [videoUrl, ...(target?.videos || [])];

    setActivities((prev) => {
      const updated = prev.map((item) =>
        item.id === activityId ? { ...item, videos: newVideos } : item
      );
      persistActivities(updated);
      return updated;
    });

    try {
      await updateDoc(doc(db, 'activities', activityId), { videos: newVideos });
    } catch (e) {
      console.warn('Gagal simpan video dokumentasi ke Firestore:', e);
    }
    showToast('Video dokumentasi kegiatan berhasil ditambahkan!');
  };

  const deleteDocumentationVideo = async (activityId: string, videoUrl: string) => {
    const target = activities.find((item) => item.id === activityId);
    const newVideos = (target?.videos || []).filter((v) => v !== videoUrl);

    setActivities((prev) => {
      const updated = prev.map((item) =>
        item.id === activityId ? { ...item, videos: newVideos } : item
      );
      persistActivities(updated);
      return updated;
    });

    try {
      await updateDoc(doc(db, 'activities', activityId), { videos: newVideos });
    } catch (e) {
      console.warn('Gagal hapus video dokumentasi di Firestore:', e);
    }
    showToast('Video dokumentasi dihapus.');
  };

  const addAnnouncement = async (params: {
    title: string;
    content: string;
    urgency: AnnouncementUrgencyType;
    targetRegion: string;
    requirements?: string[];
    additionalInfo?: string | null;
    formattedDate?: string;
  }) => {
    let initialApproval: ApprovalStatusType = 'PUBLISHED';
    if (currentUser.role === 'RT') {
      initialApproval = 'WAITING_RW_APPROVAL';
    } else if (currentUser.role === 'RW') {
      initialApproval = 'WAITING_ADMIN_APPROVAL';
    }

    const annId = `ANN-${Date.now() % 1000}`;
    const newAnn: AnnouncementItem = {
      id: annId,
      title: params.title,
      content: params.content,
      formattedDate: params.formattedDate || 'Hari Ini',
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

    try {
      await setDoc(doc(db, 'announcements', annId), sanitizeForFirestore(newAnn));
    } catch (e) {
      console.warn('Gagal simpan pengumuman ke Firestore:', e);
    }

    const toastMsg =
      initialApproval === 'WAITING_RW_APPROVAL'
        ? 'Pengumuman dikirim. Menunggu persetujuan RW!'
        : initialApproval === 'WAITING_ADMIN_APPROVAL'
        ? 'Pengumuman dikirim. Menunggu persetujuan Kelurahan!'
        : 'Pengumuman resmi berhasil diterbitkan secara online!';
    showToast(toastMsg);
  };

  const updateAnnouncement = async (
    id: string,
    params: {
      title: string;
      content: string;
      urgency: AnnouncementUrgencyType;
      targetRegion: string;
      requirements?: string[];
      additionalInfo?: string | null;
      formattedDate?: string;
    }
  ) => {
    const updates = {
      title: params.title,
      content: params.content,
      urgency: params.urgency,
      targetRegion: params.targetRegion,
      requirements: params.requirements || [],
      additionalInfo: params.additionalInfo || null,
      formattedDate: params.formattedDate || 'Hari Ini',
      isPinned: params.urgency === 'PENTING' || params.urgency === 'DARURAT',
    };

    setAnnouncements((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      persistAnnouncements(updated);
      return updated;
    });

    try {
      await updateDoc(doc(db, 'announcements', id), sanitizeForFirestore(updates));
    } catch (e) {
      console.warn('Gagal update pengumuman di Firestore:', e);
    }
    showToast('Pengumuman berhasil diperbarui!');
  };

  const rwApproveAnnouncement = async (announcementId: string) => {
    setAnnouncements((prev) => {
      const updated = prev.map((item) =>
        item.id === announcementId
          ? { ...item, approvalStatus: 'WAITING_ADMIN_APPROVAL' as ApprovalStatusType }
          : item
      );
      persistAnnouncements(updated);
      return updated;
    });

    try {
      await updateDoc(doc(db, 'announcements', announcementId), {
        approvalStatus: 'WAITING_ADMIN_APPROVAL',
      });
    } catch (e) {
      console.warn('Gagal rwApproveAnnouncement di Firestore:', e);
    }
    showToast('Pengumuman disetujui RW & diteruskan ke Staf Kelurahan!');
  };

  const adminApproveAnnouncement = async (announcementId: string) => {
    setAnnouncements((prev) => {
      const updated = prev.map((item) =>
        item.id === announcementId
          ? { ...item, approvalStatus: 'PUBLISHED' as ApprovalStatusType }
          : item
      );
      persistAnnouncements(updated);
      return updated;
    });

    try {
      await updateDoc(doc(db, 'announcements', announcementId), {
        approvalStatus: 'PUBLISHED',
      });
    } catch (e) {
      console.warn('Gagal adminApproveAnnouncement di Firestore:', e);
    }
    showToast('Pengumuman disetujui resmi & diterbitkan untuk Warga!');
  };

  const rejectAnnouncement = async (announcementId: string) => {
    setAnnouncements((prev) => {
      const updated = prev.map((item) =>
        item.id === announcementId
          ? { ...item, approvalStatus: 'REJECTED' as ApprovalStatusType }
          : item
      );
      persistAnnouncements(updated);
      return updated;
    });

    try {
      await updateDoc(doc(db, 'announcements', announcementId), {
        approvalStatus: 'REJECTED',
      });
    } catch (e) {
      console.warn('Gagal rejectAnnouncement di Firestore:', e);
    }
    showToast('Pengumuman ditolak.');
  };

  const addContact = async (nameTitle: string, phoneNumber: string, category: string) => {
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

    try {
      await setDoc(doc(db, 'contacts', newContact.id), newContact);
    } catch (e) {
      console.warn('Gagal simpan kontak ke Firestore:', e);
    }
    showToast('Kontak penting berhasil ditambahkan!');
  };

  const updateContact = async (id: string, nameTitle: string, phoneNumber: string, category: string) => {
    setContacts((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, nameTitle, phoneNumber, category } : item
      );
      persistContacts(updated);
      return updated;
    });

    try {
      await updateDoc(doc(db, 'contacts', id), { nameTitle, phoneNumber, category });
    } catch (e) {
      console.warn('Gagal update kontak di Firestore:', e);
    }
    showToast('Kontak penting berhasil diperbarui!');
  };

  const deleteContact = async (contactId: string) => {
    setContacts((prev) => {
      const updated = prev.filter((item) => item.id !== contactId);
      persistContacts(updated);
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'contacts', contactId));
    } catch (e) {
      console.warn('Gagal hapus kontak di Firestore:', e);
    }
    showToast('Kontak telah dihapus.');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activities,
        announcements,
        contacts,
        regionCodes,
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
        updateProfile,
        loginWithGoogleProfile,
        createOrUpdateRegionCode,
        toggleRegionCodeStatus,
        deleteRegionCode,
        verifyUserWithCode,
        removeVerification,
        updateRsvpStatus,
        locationPresets,
        addLocationPreset,
        updateLocationPreset,
        deleteLocationPreset,
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
        addDocumentationVideo,
        deleteDocumentationVideo,
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
