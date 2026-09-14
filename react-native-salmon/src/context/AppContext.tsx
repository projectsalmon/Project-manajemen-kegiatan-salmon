import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { NativeModules, Platform } from 'react-native';
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
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth, db, ensureAuth } from '../services/firebase';
import { initializeNotifications, triggerNotification } from '../services/notificationService';
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
  isItemPinned,
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
  INITIAL_SEEDED: '@salmon_seeded_online_v3',
  NOTIFIED_ITEMS: '@salmon_notified_items_v2',
  DELETED_ITEMS: '@salmon_deleted_items_v2',
  IS_LOGGED_IN: '@salmon_is_logged_in_v2',
};

export const defaultGuestProfile: UserProfile = {
  id: 'GUEST',
  name: 'Warga Kelurahan',
  nik: '',
  role: 'WARGA',
  age: '',
  address: '',
  rt: '03',
  rw: '05',
  kelurahan: 'Sukamaju',
  phone: '',
  email: '',
  avatarUrl: '',
  isVerifiedWarga: false,
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

// Helper to update Android Home Screen Widget (Scrollable ListView like WhatsApp)
const syncHomeScreenWidget = (
  activitiesList: ActivityItem[],
  announcementsList: AnnouncementItem[]
) => {
  try {
    if (Platform.OS !== 'android' || !NativeModules.WidgetUpdateModule) return;
    const { WidgetUpdateModule } = NativeModules;

    const widgetItems: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: 'KEGIATAN' | 'PENGUMUMAN';
      isPinned: boolean;
      timestamp: number;
    }> = [];

    // 1. Gather published activities
    (activitiesList || [])
      .filter((a) => a && a.approvalStatus === 'PUBLISHED')
      .forEach((act) => {
        widgetItems.push({
          id: act.id,
          title: act.title,
          subtitle: `${act.formattedDate || 'Segera'} • ${act.locationName || 'Lingkungan'}`,
          type: 'KEGIATAN',
          isPinned: !!isItemPinned(act),
          timestamp: new Date(act.dateIso || Date.now()).getTime(),
        });
      });

    // 2. Gather published announcements
    (announcementsList || [])
      .filter((a) => a && a.approvalStatus === 'PUBLISHED')
      .forEach((ann) => {
        widgetItems.push({
          id: ann.id,
          title: ann.title,
          subtitle: `${ann.formattedDate || 'Pengumuman'} • ${ann.authorName || 'Pengurus'}`,
          type: 'PENGUMUMAN',
          isPinned: !!isItemPinned(ann),
          timestamp: Date.now(),
        });
      });

    // 3. Sort: Pinned items on top, then newer items
    widgetItems.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return b.timestamp - a.timestamp;
    });

    const topItems = widgetItems.slice(0, 15);

    // Send full JSON list for scrollable widget
    if (WidgetUpdateModule.updateWidgetList) {
      WidgetUpdateModule.updateWidgetList(JSON.stringify(topItems));
    }

    // Also update legacy single-item widget if needed
    if (topItems.length > 0 && WidgetUpdateModule.updateWidget) {
      const first = topItems[0];
      WidgetUpdateModule.updateWidget(first.title, first.subtitle, first.type);
    }
  } catch (e) {
    // Graceful fallback
  }
};

interface AppContextType {
  currentUser: UserProfile;
  isLoggedIn: boolean;
  allUsers: UserProfile[];
  isSuperAdmin: (email?: string) => boolean;
  updateUserRoleByAdmin: (targetEmailOrId: string, newRole: UserRoleType) => Promise<boolean>;
  fetchAllUsers: () => Promise<UserProfile[]>;
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
  logout: () => Promise<void>;
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
    isPinned?: boolean;
    pinnedAt?: string | null;
    pinExpiresAt?: string | null;
    pinDurationLabel?: string | null;
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
      isPinned?: boolean;
      pinnedAt?: string | null;
      pinExpiresAt?: string | null;
      pinDurationLabel?: string | null;
    }
  ) => void;
  deleteActivity: (activityId: string) => Promise<void>;
  togglePinActivity: (
    activityId: string,
    durationMs?: number | null,
    durationLabel?: string | null
  ) => Promise<void>;
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
    imageUrl?: string | null;
    formattedDate?: string;
    isPinned?: boolean;
    pinnedAt?: string | null;
    pinExpiresAt?: string | null;
    pinDurationLabel?: string | null;
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
      imageUrl?: string | null;
      formattedDate?: string;
      isPinned?: boolean;
      pinnedAt?: string | null;
      pinExpiresAt?: string | null;
      pinDurationLabel?: string | null;
    }
  ) => void;
  deleteAnnouncement: (announcementId: string) => Promise<void>;
  togglePinAnnouncement: (
    announcementId: string,
    durationMs?: number | null,
    durationLabel?: string | null
  ) => Promise<void>;
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
  const [currentUser, setCurrentUser] = useState<UserProfile>(defaultGuestProfile);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const isLoggedInRef = useRef(false);
  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  const [activities, setActivities] = useState<ActivityItem[]>(sampleActivities);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(sampleAnnouncements);
  const [contacts, setContacts] = useState<ContactItem[]>(defaultContacts);
  const [regionCodes, setRegionCodes] = useState<RegionInvitationCode[]>(defaultRegionCodes);
  const [locationPresets, setLocationPresets] = useState<LocationPresetItem[]>(defaultLocationPresets);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

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
        const storedLoginStatus = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
        const storedProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        if (storedLoginStatus === 'true' && storedProfile) {
          try {
            const parsed = JSON.parse(storedProfile);
            if (parsed && parsed.email) {
              setCurrentUser(parsed);
              currentUserRef.current = parsed;
              setIsLoggedIn(true);
              isLoggedInRef.current = true;
            }
          } catch {}
        }

        const storedActivities = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITIES);
        if (storedActivities) {
          const parsed = JSON.parse(storedActivities);
          if (Array.isArray(parsed)) {
            parsed.sort((a: ActivityItem, b: ActivityItem) => (isItemPinned(b) ? 1 : 0) - (isItemPinned(a) ? 1 : 0));
            setActivities(parsed);
          }
        }

        const storedAnnouncements = await AsyncStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
        if (storedAnnouncements) {
          const parsed = JSON.parse(storedAnnouncements);
          if (Array.isArray(parsed)) {
            parsed.sort((a: AnnouncementItem, b: AnnouncementItem) => (isItemPinned(b) ? 1 : 0) - (isItemPinned(a) ? 1 : 0));
            setAnnouncements(parsed);
          }
        }

        const storedNotified = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFIED_ITEMS);
        if (storedNotified) {
          try {
            notifiedKeysRef.current = new Set(JSON.parse(storedNotified));
          } catch {}
        }

        const storedDeleted = await AsyncStorage.getItem(STORAGE_KEYS.DELETED_ITEMS);
        if (storedDeleted) {
          try {
            deletedIdsRef.current = new Set(JSON.parse(storedDeleted));
          } catch {}
        }

        const storedContacts = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
        if (storedContacts) setContacts(JSON.parse(storedContacts));

        const storedRegionCodes = await AsyncStorage.getItem(STORAGE_KEYS.REGION_CODES);
        if (storedRegionCodes) setRegionCodes(JSON.parse(storedRegionCodes));

        const storedLocations = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_PRESETS);
        if (storedLocations) setLocationPresets(JSON.parse(storedLocations));

        // Ensure online sample data is seeded to Firestore ONCE if collections are empty
        const isSeeded = await AsyncStorage.getItem(STORAGE_KEYS.INITIAL_SEEDED);
        if (!isSeeded) {
          try {
            const annSnap = await getDocs(collection(db, 'announcements'));
            if (annSnap.empty) {
              for (const item of sampleAnnouncements) {
                await setDoc(doc(db, 'announcements', item.id), sanitizeForFirestore(item));
              }
            }
            const actSnap = await getDocs(collection(db, 'activities'));
            if (actSnap.empty) {
              for (const item of sampleActivities) {
                await setDoc(doc(db, 'activities', item.id), sanitizeForFirestore(item));
              }
            }
            await AsyncStorage.setItem(STORAGE_KEYS.INITIAL_SEEDED, 'true');
          } catch (seedErr) {
            console.warn('Initial seeding error:', seedErr);
          }
        }
      } catch (e) {
        console.warn('Gagal memuat cache lokal:', e);
      }
    };
    loadStoredData();
    ensureAuth();
  }, []);

  // Initialize System Notifications
  useEffect(() => {
    initializeNotifications();
  }, []);

  // Ref to always track latest currentUser in async callbacks
  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const isFirstActivitiesSnapshot = useRef(true);
  const prevActivitiesMap = useRef<Map<string, ActivityItem>>(new Map());
  const isFirstAnnouncementsSnapshot = useRef(true);
  const prevAnnouncementsMap = useRef<Map<string, AnnouncementItem>>(new Map());

  // Deduplication sets to prevent notification spam across restarts/updates
  const notifiedKeysRef = useRef<Set<string>>(new Set());
  const deletedIdsRef = useRef<Set<string>>(new Set());

  // Helper to send deduplicated realtime notifications with payload
  const sendRealtimeNotification = async (
    notificationKey: string,
    title: string,
    body: string,
    target: { type: 'ACTIVITY' | 'ANNOUNCEMENT'; id: string }
  ) => {
    // DO NOT notify if user is not logged in!
    if (!isLoggedInRef.current || !currentUserRef.current.email) {
      return;
    }
    // If already notified or item was deleted, skip
    if (notifiedKeysRef.current.has(notificationKey) || deletedIdsRef.current.has(target.id)) {
      return;
    }
    notifiedKeysRef.current.add(notificationKey);
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.NOTIFIED_ITEMS,
        JSON.stringify(Array.from(notifiedKeysRef.current))
      );
    } catch {}

    triggerNotification({
      title,
      body,
      data: target,
    });
  };

  // 2. Realtime Firestore Sync for Activities with Push Notifications & Widget Sync
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'activities'),
      (snapshot) => {
        const items: ActivityItem[] = [];
        snapshot.forEach((docSnap) => {
          const actData = docSnap.data() as Partial<ActivityItem>;
          items.push({
            id: docSnap.id,
            title: actData.title || '',
            description: actData.description || '',
            category: actData.category || 'KERJA_BAKTI',
            customCategoryName: actData.customCategoryName,
            dateIso: actData.dateIso || '',
            formattedDate: actData.formattedDate || '',
            timeSlot: actData.timeSlot || '',
            locationName: actData.locationName || '',
            locationAddress: actData.locationAddress || '',
            latitude: actData.latitude || -6.215,
            longitude: actData.longitude || 106.845,
            targetRegion: actData.targetRegion || 'Semua Wilayah',
            organizerRole: actData.organizerRole || 'WARGA',
            organizerName: actData.organizerName || 'Warga',
            confirmedCount: actData.confirmedCount ?? 0,
            maybeCount: actData.maybeCount ?? 0,
            quota: actData.quota ?? null,
            userRsvpStatus: actData.userRsvpStatus || 'NONE',
            photos: Array.isArray(actData.photos)
              ? actData.photos
              : actData.imageUrl
              ? [actData.imageUrl]
              : [],
            imageUrl: actData.imageUrl || null,
            videos: actData.videos || [],
            approvalStatus: actData.approvalStatus || 'PUBLISHED',
            needsFollowUp: actData.needsFollowUp ?? false,
            followUpNote: actData.followUpNote ?? null,
            isFeatured: actData.isFeatured ?? false,
            isPinned: actData.isPinned ?? false,
            pinnedAt: actData.pinnedAt ?? null,
            pinExpiresAt: actData.pinExpiresAt ?? null,
            pinDurationLabel: actData.pinDurationLabel ?? null,
          });
        });
        items.sort((a, b) => (isItemPinned(b) ? 1 : 0) - (isItemPinned(a) ? 1 : 0));
        setActivities(items);
        persistActivities(items);
        syncHomeScreenWidget(items, announcements);

        // Realtime notification evaluation
        if (isFirstActivitiesSnapshot.current) {
          isFirstActivitiesSnapshot.current = false;
          prevActivitiesMap.current = new Map(items.map((it) => [it.id, it]));
          // Mark all pre-existing items as notified so app boot never triggers alerts
          items.forEach((it) => notifiedKeysRef.current.add(it.id + '_CREATED'));
        } else {
          items.forEach((item) => {
            if (deletedIdsRef.current.has(item.id)) return;
            const oldItem = prevActivitiesMap.current.get(item.id);

            // ONLY NOTIFY ON NEW PUBLISHED ACTIVITIES
            if (!oldItem && item.approvalStatus === 'PUBLISHED') {
              sendRealtimeNotification(
                item.id + '_PUBLISHED',
                'Kegiatan Baru!',
                `"${item.title}" - ${item.formattedDate || 'Segera'} di ${item.locationName || 'Lokasi Kegiatan'}`,
                { type: 'ACTIVITY', id: item.id }
              );
            }
          });
          prevActivitiesMap.current = new Map(items.map((it) => [it.id, it]));
        }
      },
      (error) => {
        console.warn('Firestore activities listener error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Realtime Firestore Sync for Announcements with Push Notifications & Widget Sync
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'announcements'),
      (snapshot) => {
        const items: AnnouncementItem[] = [];
        snapshot.forEach((docSnap) => {
          const annData = docSnap.data() as Partial<AnnouncementItem>;
          items.push({
            id: docSnap.id,
            title: annData.title || '',
            content: annData.content || '',
            urgency: annData.urgency || 'INFO',
            targetRegion: annData.targetRegion || 'Semua Wilayah',
            authorRole: annData.authorRole || 'WARGA',
            authorName: annData.authorName || 'Pengurus',
            formattedDate: annData.formattedDate || '',
            isPinned: annData.isPinned ?? false,
            pinnedAt: annData.pinnedAt ?? null,
            pinExpiresAt: annData.pinExpiresAt ?? null,
            pinDurationLabel: annData.pinDurationLabel ?? null,
            approvalStatus: annData.approvalStatus || 'PUBLISHED',
            requirements: annData.requirements || [],
            additionalInfo: annData.additionalInfo ?? null,
            imageUrl: annData.imageUrl ?? null,
          });
        });
        items.sort((a, b) => (isItemPinned(b) ? 1 : 0) - (isItemPinned(a) ? 1 : 0));
        setAnnouncements(items);
        persistAnnouncements(items);
        syncHomeScreenWidget(activities, items);

        // Realtime notification evaluation for announcements
        if (isFirstAnnouncementsSnapshot.current) {
          isFirstAnnouncementsSnapshot.current = false;
          prevAnnouncementsMap.current = new Map(items.map((it) => [it.id, it]));
          // Mark all pre-existing items as notified so app boot never triggers alerts
          items.forEach((it) => notifiedKeysRef.current.add(it.id + '_CREATED'));
        } else {
          items.forEach((item) => {
            if (deletedIdsRef.current.has(item.id)) return;
            const oldItem = prevAnnouncementsMap.current.get(item.id);

            // ONLY NOTIFY ON NEW PUBLISHED ANNOUNCEMENTS
            if (!oldItem && item.approvalStatus === 'PUBLISHED') {
              const shortContent =
                item.content.length > 80 ? item.content.slice(0, 80) + '...' : item.content;
              sendRealtimeNotification(
                item.id + '_ANN_PUBLISHED',
                'Pengumuman Baru!',
                `[${item.urgency}] ${item.title}: ${shortContent}`,
                { type: 'ANNOUNCEMENT', id: item.id }
              );
            }
          });
          prevAnnouncementsMap.current = new Map(items.map((it) => [it.id, it]));
        }
      },
      (error) => {
        console.warn('Firestore announcements listener error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // 4. Continuously Sync to Android Home Screen Widget
  useEffect(() => {
    syncHomeScreenWidget(activities, announcements);
  }, [activities, announcements]);

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
    const userIdentifier = currentUser.email || currentUser.id;
    if (!userIdentifier || userIdentifier === 'USR-001') return;

    const userDocId = userIdentifier.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
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
              email: prev.email || remoteData.email || '',
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
  }, [currentUser.email, currentUser.id]);

  // 6. Realtime Firestore Sync for All Registered Users (So Admin sees new users immediately)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          const uData = docSnap.data() as Record<string, any>;
          const cleanEmail =
            typeof uData.email === 'string' && uData.email.trim()
              ? uData.email.trim()
              : docSnap.id.includes('@')
              ? docSnap.id
              : '';
          list.push({
            id: docSnap.id,
            name:
              typeof uData.name === 'string' && uData.name.trim()
                ? uData.name
                : cleanEmail
                ? cleanEmail.split('@')[0]
                : 'Pengguna Sukamaju',
            nik: typeof uData.nik === 'string' ? uData.nik : '',
            role: (uData.role as UserRoleType) || (uData.userRole as UserRoleType) || 'WARGA',
            age: uData.age,
            address: typeof uData.address === 'string' ? uData.address : '',
            rt: typeof uData.rt === 'string' ? uData.rt : '01',
            rw: typeof uData.rw === 'string' ? uData.rw : '05',
            kelurahan: typeof uData.kelurahan === 'string' ? uData.kelurahan : 'Sukamaju',
            phone: typeof uData.phone === 'string' ? uData.phone : '',
            email: cleanEmail,
            avatarUrl: typeof uData.avatarUrl === 'string' ? uData.avatarUrl : undefined,
            isVerifiedWarga: !!uData.isVerifiedWarga,
            verifiedCode: typeof uData.verifiedCode === 'string' ? uData.verifiedCode : undefined,
            verifiedAt: typeof uData.verifiedAt === 'string' ? uData.verifiedAt : undefined,
            lastLoginAt: typeof uData.lastLoginAt === 'string' ? uData.lastLoginAt : undefined,
            createdAt: typeof uData.createdAt === 'string' ? uData.createdAt : undefined,
          });
        });
        list.sort((a, b) => {
          const timeA = String(a.lastLoginAt || a.createdAt || '');
          const timeB = String(b.lastLoginAt || b.createdAt || '');
          return timeB.localeCompare(timeA);
        });
        setAllUsers(list);
      },
      (error) => {
        console.warn('Firestore users listener error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch All Users on Demand
  const fetchAllUsers = async (): Promise<UserProfile[]> => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        const list: UserProfile[] = [];
        snap.forEach((docSnap) => {
          const uData = docSnap.data() as Record<string, any>;
          const cleanEmail =
            typeof uData.email === 'string' && uData.email.trim()
              ? uData.email.trim()
              : docSnap.id.includes('@')
              ? docSnap.id
              : '';
          list.push({
            id: docSnap.id,
            name:
              typeof uData.name === 'string' && uData.name.trim()
                ? uData.name
                : cleanEmail
                ? cleanEmail.split('@')[0]
                : 'Pengguna Sukamaju',
            nik: typeof uData.nik === 'string' ? uData.nik : '',
            role: (uData.role as UserRoleType) || (uData.userRole as UserRoleType) || 'WARGA',
            age: uData.age,
            address: typeof uData.address === 'string' ? uData.address : '',
            rt: typeof uData.rt === 'string' ? uData.rt : '01',
            rw: typeof uData.rw === 'string' ? uData.rw : '05',
            kelurahan: typeof uData.kelurahan === 'string' ? uData.kelurahan : 'Sukamaju',
            phone: typeof uData.phone === 'string' ? uData.phone : '',
            email: cleanEmail,
            avatarUrl: typeof uData.avatarUrl === 'string' ? uData.avatarUrl : undefined,
            isVerifiedWarga: !!uData.isVerifiedWarga,
            verifiedCode: typeof uData.verifiedCode === 'string' ? uData.verifiedCode : undefined,
            verifiedAt: typeof uData.verifiedAt === 'string' ? uData.verifiedAt : undefined,
            lastLoginAt: typeof uData.lastLoginAt === 'string' ? uData.lastLoginAt : undefined,
            createdAt: typeof uData.createdAt === 'string' ? uData.createdAt : undefined,
          });
        });
        list.sort((a, b) => {
          const timeA = String(a.lastLoginAt || a.createdAt || '');
          const timeB = String(b.lastLoginAt || b.createdAt || '');
          return timeB.localeCompare(timeA);
        });
        setAllUsers(list);
        return list;
      }
      return [];
    } catch (err) {
      console.warn('Gagal fetch all users:', err);
      return [];
    }
  };

  // Helper: check if email is Super Admin
  const isSuperAdmin = (email?: string): boolean => {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    return clean === 'salmanakhdanhidayat@gmail.com' || clean === 'ytsalmon37@gmail.com';
  };

  // Admin function: update any user's role in Firestore
  const updateUserRoleByAdmin = async (
    targetEmailOrId: string,
    newRole: UserRoleType
  ): Promise<boolean> => {
    try {
      const userDocId = targetEmailOrId.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      await setDoc(
        doc(db, 'users', userDocId),
        {
          role: newRole,
          userRole: newRole,
          roleUpdatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      showToast(`Peran pengguna berhasil diubah ke: ${newRole}`);
      return true;
    } catch (error) {
      console.warn('Gagal update role oleh admin:', error);
      showToast('Gagal mengubah peran. Silakan periksa koneksi internet.');
      return false;
    }
  };

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
    await persistProfile(updated);

    // Sync to Firestore
    const userIdentifier = updated.email || updated.id;
    if (userIdentifier && userIdentifier !== 'USR-001') {
      const userDocId = userIdentifier.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      try {
        await setDoc(doc(db, 'users', userDocId), sanitizeForFirestore(updated), { merge: true });
        showToast('Profil & foto berhasil tersimpan secara online di Cloud!');
      } catch (err: any) {
        console.warn('Gagal sync profil ke Firestore:', err);
        showToast('Tersimpan di perangkat lokal. Gagal sinkronisasi online (ukuran foto terlalu besar atau koneksi offline).');
      }
    } else {
      showToast('Profil berhasil disimpan di perangkat lokal.');
    }
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
    const nowIso = new Date().toISOString();

    let finalRole: UserRoleType = isAdmin ? 'STAF_KELURAHAN' : 'WARGA';
    let finalProfile: UserProfile = {
      id: userDocId,
      name: profile.name || (isAdmin ? 'Salman Akhdan (Admin)' : 'Warga Sukamaju'),
      nik: isAdmin ? '3201012345670001' : '',
      email: cleanEmail,
      phone: '',
      role: finalRole,
      rt: isAdmin ? '002' : '03',
      rw: '005',
      kelurahan: 'Sukamaju',
      avatarUrl: profile.photoUrl || undefined,
      isVerifiedWarga: isAdmin,
      lastLoginAt: nowIso,
      createdAt: nowIso,
    };

    // Check if user already exists in Firestore and persist
    try {
      const existingUserSnap = await getDoc(doc(db, 'users', userDocId));
      if (existingUserSnap.exists()) {
        const remoteData = existingUserSnap.data() as UserProfile;
        finalProfile = {
          ...finalProfile,
          ...remoteData,
          id: userDocId,
          email: cleanEmail,
          name: profile.name || remoteData.name || finalProfile.name,
          avatarUrl: profile.photoUrl || remoteData.avatarUrl || finalProfile.avatarUrl,
          lastLoginAt: nowIso,
        };
        // Update last login & profile in Firestore
        await setDoc(
          doc(db, 'users', userDocId),
          sanitizeForFirestore({
            ...finalProfile,
            id: userDocId,
            email: cleanEmail,
            role: finalProfile.role || finalRole,
            userRole: finalProfile.role || finalRole,
            lastLoginAt: nowIso,
            name: finalProfile.name,
            avatarUrl: finalProfile.avatarUrl || null,
          }),
          { merge: true }
        );
      } else {
        // Save initial user to Firestore with createdAt & lastLoginAt
        await setDoc(
          doc(db, 'users', userDocId),
          sanitizeForFirestore({
            ...finalProfile,
            id: userDocId,
            email: cleanEmail,
            role: finalRole,
            userRole: finalRole,
          }),
          { merge: true }
        );
      }
    } catch (e) {
      console.warn('Gagal baca/tulis profil user di Firestore:', e);
    }

    // Immediately update local allUsers list so Admin sees the new account instantly
    setAllUsers((prev) => {
      const filtered = prev.filter(
        (u) => u.email?.toLowerCase() !== cleanEmail && u.id !== userDocId
      );
      return [finalProfile, ...filtered];
    });

    setIsLoggedIn(true);
    isLoggedInRef.current = true;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
    } catch {}

    setCurrentUser(finalProfile);
    currentUserRef.current = finalProfile;
    persistProfile(finalProfile);
    showToast(`Selamat datang, ${finalProfile.name}!`);
  };

  const logout = async () => {
    try {
      await GoogleSignin.signOut().catch(() => {});
      await GoogleSignin.revokeAccess().catch(() => {});
      await auth.signOut().catch(() => {});
    } catch (e) {
      console.warn('Logout error:', e);
    }
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      await AsyncStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
    } catch {}

    setIsLoggedIn(false);
    isLoggedInRef.current = false;
    setCurrentUser(defaultGuestProfile);
    currentUserRef.current = defaultGuestProfile;
    showToast('Berhasil keluar dari akun Google.');
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
    isPinned?: boolean;
    pinnedAt?: string | null;
    pinExpiresAt?: string | null;
    pinDurationLabel?: string | null;
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
    const isPinnedVal = !!params.isPinned;
    const pinnedAtVal = isPinnedVal
      ? params.pinnedAt ||
        new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

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
      isPinned: isPinnedVal,
      pinnedAt: pinnedAtVal,
      pinExpiresAt: params.pinExpiresAt || null,
      pinDurationLabel: params.pinDurationLabel || (isPinnedVal ? 'Selamanya' : null),
    };

    setActivities((prev) => {
      const updated = [newItem, ...prev];
      updated.sort((a, b) => (isItemPinned(b) ? 1 : 0) - (isItemPinned(a) ? 1 : 0));
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
      isPinned?: boolean;
      pinnedAt?: string | null;
      pinExpiresAt?: string | null;
      pinDurationLabel?: string | null;
    }
  ) => {
    let finalPinned = false;
    let finalPinnedAt: string | null = null;
    let finalPinExpiresAt: string | null = null;
    let finalPinDurationLabel: string | null = null;

    setActivities((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== id) return item;
        const newImageUrl = params.imageUrl !== undefined ? params.imageUrl : item.imageUrl;
        let newPhotos = item.photos || [];
        if (params.imageUrl !== undefined) {
          newPhotos = params.imageUrl
            ? [params.imageUrl, ...newPhotos.filter((p) => p !== item.imageUrl)]
            : newPhotos.filter((p) => p !== item.imageUrl);
        }

        const isPinnedResolved =
          params.isPinned !== undefined ? params.isPinned : !!item.isPinned;

        let pinnedAtResolved = item.pinnedAt || null;
        let pinExpiresAtResolved = params.pinExpiresAt !== undefined ? params.pinExpiresAt : (item.pinExpiresAt || null);
        let pinDurationLabelResolved = params.pinDurationLabel !== undefined ? params.pinDurationLabel : (item.pinDurationLabel || null);

        if (params.isPinned !== undefined) {
          if (params.isPinned && !item.isPinned) {
            pinnedAtResolved =
              params.pinnedAt ||
              new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
            pinDurationLabelResolved = params.pinDurationLabel || 'Selamanya';
          } else if (!params.isPinned) {
            pinnedAtResolved = null;
            pinExpiresAtResolved = null;
            pinDurationLabelResolved = null;
          }
        } else if (params.pinnedAt !== undefined) {
          pinnedAtResolved = params.pinnedAt;
        }

        finalPinned = isPinnedResolved;
        finalPinnedAt = pinnedAtResolved;
        finalPinExpiresAt = pinExpiresAtResolved;
        finalPinDurationLabel = pinDurationLabelResolved;

        return {
          ...item,
          ...params,
          imageUrl: newImageUrl,
          photos: newPhotos,
          isPinned: isPinnedResolved,
          pinnedAt: pinnedAtResolved,
          pinExpiresAt: pinExpiresAtResolved,
          pinDurationLabel: pinDurationLabelResolved,
        };
      });
      updated.sort((a, b) => (isItemPinned(b) ? 1 : 0) - (isItemPinned(a) ? 1 : 0));
      persistActivities(updated);
      return updated;
    });

    try {
      const firestoreUpdates = {
        ...params,
        isPinned: finalPinned,
        pinnedAt: finalPinnedAt,
        pinExpiresAt: finalPinExpiresAt,
        pinDurationLabel: finalPinDurationLabel,
        ...(params.imageUrl !== undefined
          ? {
              photos: params.imageUrl ? [params.imageUrl] : [],
            }
          : {}),
      };
      await updateDoc(doc(db, 'activities', id), sanitizeForFirestore(firestoreUpdates));
    } catch (e) {
      console.warn('Gagal update kegiatan di Firestore:', e);
    }

    showToast(`Perubahan kegiatan '${params.title}' berhasil diperbarui!`);
  };

  const deleteActivity = async (activityId: string) => {
    deletedIdsRef.current.add(activityId);
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.DELETED_ITEMS,
        JSON.stringify(Array.from(deletedIdsRef.current))
      );
    } catch {}

    setActivities((prev) => {
      const updated = prev.filter((item) => item.id !== activityId);
      persistActivities(updated);
      syncHomeScreenWidget(updated, announcements);
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'activities', activityId));
    } catch (e) {
      console.warn('Gagal menghapus kegiatan dari Firestore:', e);
    }
    showToast('Kegiatan telah berhasil dihapus.');
  };

  const togglePinActivity = async (
    activityId: string,
    durationMs?: number | null,
    durationLabel?: string | null
  ) => {
    let newPinned = false;
    let newPinnedAt: string | null = null;
    let newPinExpiresAt: string | null = null;
    let newPinDurationLabel: string | null = null;

    setActivities((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== activityId) return item;
        newPinned = !item.isPinned;
        if (newPinned) {
          newPinnedAt = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          newPinExpiresAt = durationMs && durationMs > 0
            ? new Date(Date.now() + durationMs).toISOString()
            : null;
          newPinDurationLabel = durationLabel || (durationMs ? 'Sementara' : 'Selamanya');
        } else {
          newPinnedAt = null;
          newPinExpiresAt = null;
          newPinDurationLabel = null;
        }

        return {
          ...item,
          isPinned: newPinned,
          pinnedAt: newPinnedAt,
          pinExpiresAt: newPinExpiresAt,
          pinDurationLabel: newPinDurationLabel,
        };
      });
      updated.sort((a, b) => (isItemPinned(b) ? 1 : 0) - (isItemPinned(a) ? 1 : 0));
      persistActivities(updated);
      return updated;
    });

    try {
      await updateDoc(doc(db, 'activities', activityId), {
        isPinned: newPinned,
        pinnedAt: newPinnedAt,
        pinExpiresAt: newPinExpiresAt,
        pinDurationLabel: newPinDurationLabel,
      });
    } catch (e) {
      console.warn('Gagal update sematan kegiatan di Firestore:', e);
    }

    showToast(
      newPinned
        ? `Kegiatan disematkan di posisi teratas (${newPinDurationLabel || 'Selamanya'})!`
        : 'Sematan kegiatan telah dilepas.'
    );
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
    imageUrl?: string | null;
    formattedDate?: string;
    isPinned?: boolean;
    pinnedAt?: string | null;
    pinExpiresAt?: string | null;
    pinDurationLabel?: string | null;
  }) => {
    let initialApproval: ApprovalStatusType = 'PUBLISHED';
    if (currentUser.role === 'RT') {
      initialApproval = 'WAITING_RW_APPROVAL';
    } else if (currentUser.role === 'RW') {
      initialApproval = 'WAITING_ADMIN_APPROVAL';
    }

    const annId = `ANN-${Date.now() % 1000}`;
    const isPinnedVal =
      params.isPinned !== undefined
        ? params.isPinned
        : params.urgency === 'PENTING' || params.urgency === 'DARURAT';

    const pinnedAtVal = isPinnedVal
      ? params.pinnedAt ||
        new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

    const pinExpiresAtVal = isPinnedVal ? params.pinExpiresAt || null : null;
    const pinDurationLabelVal = isPinnedVal
      ? params.pinDurationLabel || (pinExpiresAtVal ? 'Sementara' : 'Selamanya')
      : null;

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
      imageUrl: params.imageUrl || null,
      approvalStatus: initialApproval,
      isPinned: isPinnedVal,
      pinnedAt: pinnedAtVal,
      pinExpiresAt: pinExpiresAtVal,
      pinDurationLabel: pinDurationLabelVal,
    };

    setAnnouncements((prev) => {
      const updated = [newAnn, ...prev];
      updated.sort((a, b) => (isItemPinned(b) ? 1 : 0) - (isItemPinned(a) ? 1 : 0));
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
      imageUrl?: string | null;
      formattedDate?: string;
      isPinned?: boolean;
      pinnedAt?: string | null;
      pinExpiresAt?: string | null;
      pinDurationLabel?: string | null;
    }
  ) => {
    let finalPinned = false;
    let finalPinnedAt: string | null = null;
    let finalPinExpiresAt: string | null = null;
    let finalPinDurationLabel: string | null = null;

    setAnnouncements((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== id) return item;

        const isPinnedResolved =
          params.isPinned !== undefined
            ? params.isPinned
            : item.isPinned ?? (params.urgency === 'PENTING' || params.urgency === 'DARURAT');

        let pinnedAtResolved = item.pinnedAt || null;
        let pinExpiresAtResolved = item.pinExpiresAt || null;
        let pinDurationLabelResolved = item.pinDurationLabel || null;

        if (params.isPinned !== undefined) {
          if (params.isPinned && !item.isPinned) {
            pinnedAtResolved =
              params.pinnedAt ||
              new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
            pinExpiresAtResolved = params.pinExpiresAt || null;
            pinDurationLabelResolved =
              params.pinDurationLabel || (params.pinExpiresAt ? 'Sementara' : 'Selamanya');
          } else if (!params.isPinned) {
            pinnedAtResolved = null;
            pinExpiresAtResolved = null;
            pinDurationLabelResolved = null;
          } else if (params.isPinned) {
            if (params.pinExpiresAt !== undefined) pinExpiresAtResolved = params.pinExpiresAt;
            if (params.pinDurationLabel !== undefined) pinDurationLabelResolved = params.pinDurationLabel;
          }
        } else {
          if (params.pinnedAt !== undefined) pinnedAtResolved = params.pinnedAt;
          if (params.pinExpiresAt !== undefined) pinExpiresAtResolved = params.pinExpiresAt;
          if (params.pinDurationLabel !== undefined) pinDurationLabelResolved = params.pinDurationLabel;
        }

        finalPinned = isPinnedResolved;
        finalPinnedAt = pinnedAtResolved;
        finalPinExpiresAt = pinExpiresAtResolved;
        finalPinDurationLabel = pinDurationLabelResolved;

        return {
          ...item,
          ...params,
          imageUrl: params.imageUrl !== undefined ? params.imageUrl : item.imageUrl,
          formattedDate: params.formattedDate || item.formattedDate || 'Hari Ini',
          isPinned: isPinnedResolved,
          pinnedAt: pinnedAtResolved,
          pinExpiresAt: pinExpiresAtResolved,
          pinDurationLabel: pinDurationLabelResolved,
        };
      });
      updated.sort((a, b) => (isItemPinned(b) ? 1 : 0) - (isItemPinned(a) ? 1 : 0));
      persistAnnouncements(updated);
      return updated;
    });

    const updates: Record<string, any> = {
      title: params.title,
      content: params.content,
      urgency: params.urgency,
      targetRegion: params.targetRegion,
      requirements: params.requirements || [],
      additionalInfo: params.additionalInfo || null,
      formattedDate: params.formattedDate || 'Hari Ini',
      isPinned: finalPinned,
      pinnedAt: finalPinnedAt,
      pinExpiresAt: finalPinExpiresAt,
      pinDurationLabel: finalPinDurationLabel,
    };

    if (params.imageUrl !== undefined) {
      updates.imageUrl = params.imageUrl;
    }

    try {
      await updateDoc(doc(db, 'announcements', id), sanitizeForFirestore(updates));
    } catch (e) {
      console.warn('Gagal update pengumuman di Firestore:', e);
    }
    showToast('Pengumuman berhasil diperbarui!');
  };

  const deleteAnnouncement = async (announcementId: string) => {
    deletedIdsRef.current.add(announcementId);
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.DELETED_ITEMS,
        JSON.stringify(Array.from(deletedIdsRef.current))
      );
    } catch {}

    setAnnouncements((prev) => {
      const updated = prev.filter((item) => item.id !== announcementId);
      persistAnnouncements(updated);
      syncHomeScreenWidget(activities, updated);
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'announcements', announcementId));
    } catch (e) {
      console.warn('Gagal menghapus pengumuman dari Firestore:', e);
    }
    showToast('Pengumuman telah berhasil dihapus.');
  };

  const togglePinAnnouncement = async (
    announcementId: string,
    durationMs?: number | null,
    durationLabel?: string | null
  ) => {
    let newPinned = false;
    let newPinnedAt: string | null = null;
    let newPinExpiresAt: string | null = null;
    let newPinDurationLabel: string | null = null;

    setAnnouncements((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== announcementId) return item;
        newPinned = !item.isPinned;
        if (newPinned) {
          newPinnedAt = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          newPinExpiresAt =
            durationMs && durationMs > 0
              ? new Date(Date.now() + durationMs).toISOString()
              : null;
          newPinDurationLabel = durationLabel || (durationMs ? 'Sementara' : 'Selamanya');
        } else {
          newPinnedAt = null;
          newPinExpiresAt = null;
          newPinDurationLabel = null;
        }
        return {
          ...item,
          isPinned: newPinned,
          pinnedAt: newPinnedAt,
          pinExpiresAt: newPinExpiresAt,
          pinDurationLabel: newPinDurationLabel,
        };
      });
      updated.sort((a, b) => (isItemPinned(b) ? 1 : 0) - (isItemPinned(a) ? 1 : 0));
      persistAnnouncements(updated);
      return updated;
    });

    try {
      await updateDoc(doc(db, 'announcements', announcementId), {
        isPinned: newPinned,
        pinnedAt: newPinnedAt,
        pinExpiresAt: newPinExpiresAt,
        pinDurationLabel: newPinDurationLabel,
      });
    } catch (e) {
      console.warn('Gagal update sematan pengumuman di Firestore:', e);
    }

    showToast(
      newPinned
        ? `Pengumuman disematkan di posisi teratas (${newPinDurationLabel || 'Selamanya'})!`
        : 'Sematan pengumuman telah dilepas.'
    );
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
        isLoggedIn,
        allUsers,
        isSuperAdmin,
        updateUserRoleByAdmin,
        fetchAllUsers,
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
        logout,
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
        deleteActivity,
        togglePinActivity,
        rwApproveActivity,
        rwRejectActivity,
        adminApproveActivity,
        adminRejectActivity,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        togglePinAnnouncement,
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
