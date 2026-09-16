import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  NativeModules,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MapPreviewCard } from '../components/MapPreviewCard';
import { VerificationModal } from '../components/VerificationModal';
import { WhatsAppApprovalModal } from '../components/WhatsAppApprovalModal';
import { CategoryMeta, Colors, UserRolesMeta } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { RsvpStatusType } from '../types';
import { buildActivityApprovalMessage } from '../utils/whatsappHelpers';

interface ActivityDetailScreenProps {
  route: any;
  navigation: any;
}

type MediaFilterType = 'ALL' | 'PHOTOS' | 'VIDEOS';

export const ActivityDetailScreen: React.FC<ActivityDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { activityId } = route.params || {};
  const insets = useSafeAreaInsets();
  const {
    currentUser,
    contacts,
    activities,
    updateRsvpStatus,
    deleteActivity,
    addDocumentationVideo,
    addDocumentationMediaToDrive,
    deleteDocumentationMediaFromDrive,
    linkDocumentationMediaFromDrive,
    showToast,
    markItemAsRead,
  } = useApp();

  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [isUploadPhotoPickerVisible, setIsUploadPhotoPickerVisible] = useState(false);
  const [isUploadVideoModalVisible, setIsUploadVideoModalVisible] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [drivePhotoUrlInput, setDrivePhotoUrlInput] = useState('');
  const [mediaFilter, setMediaFilter] = useState<MediaFilterType>('ALL');
  const [isWhatsAppModalVisible, setIsWhatsAppModalVisible] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');

  const markedReadRef = useRef<string | null>(null);

  useEffect(() => {
    setHeroImageError(false);
    if (activityId && markedReadRef.current !== activityId) {
      markedReadRef.current = activityId;
      markItemAsRead(activityId, 'ACTIVITY');
    }
  }, [activityId, markItemAsRead]);

  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);
  const [pendingRsvpStatus, setPendingRsvpStatus] = useState<RsvpStatusType | null>(null);

  const handleRsvpWithCheck = (newStatus: RsvpStatusType) => {
    if (currentUser.role === 'WARGA' && !currentUser.isVerifiedWarga && newStatus !== 'NONE') {
      setPendingRsvpStatus(newStatus);
      setIsVerificationModalVisible(true);
      return;
    }
    if (activity) {
      updateRsvpStatus(activity.id, newStatus);
    }
  };

  const handleVerificationSuccess = () => {
    if (activity && pendingRsvpStatus) {
      updateRsvpStatus(activity.id, pendingRsvpStatus);
      setPendingRsvpStatus(null);
    }
  };

  const activity = activities.find((a) => a.id === activityId);

  if (!activity) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Kegiatan tidak ditemukan.</Text>
        <TouchableOpacity
          style={styles.backButtonSimple}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonSimpleText}>Kembali</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleDeleteActivity = () => {
    if (!activity) return;
    Alert.alert(
      'Hapus Kegiatan',
      `Apakah Anda yakin ingin menghapus kegiatan "${activity.title}"? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await deleteActivity(activity.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const categoryInfo = CategoryMeta[activity.category] || CategoryMeta.KERJA_BAKTI;
  const organizerRoleInfo = UserRolesMeta[activity.organizerRole] || UserRolesMeta.WARGA;
  const isAdmin = currentUser.role !== 'WARGA';

  const waApprovalInfo = buildActivityApprovalMessage(activity, currentUser, contacts);

  // Hero Thumbnail (paling atas)
  const heroThumbnailUrl =
    activity.imageUrl ||
    (activity.photos && activity.photos.length > 0 ? activity.photos[0] : null);

  // Photos & Videos
  const photosList = activity.photos || [];
  const videosList = activity.videos || [];
  const totalMediaCount = photosList.length + videosList.length;

  const handleShare = async () => {
    try {
      const shareMessage =
        `📅 *${activity.title}*\n` +
        `🗓️ ${activity.formattedDate} • ${activity.timeSlot}\n` +
        `📍 Lokasi: ${activity.locationName}\n` +
        `📌 Sasaran: ${activity.targetRegion}\n\n` +
        `${activity.description}`;

      if (
        Platform.OS === 'android' &&
        activity.imageUrl &&
        NativeModules.WidgetUpdateModule?.shareToWhatsAppWithImage
      ) {
        await NativeModules.WidgetUpdateModule.shareToWhatsAppWithImage(
          activity.imageUrl,
          shareMessage
        );
        return;
      }

      await Share.share({
        title: activity.title,
        message: shareMessage,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  // Photo handlers (Google Drive Integrated)
  const handlePickFromGallery = async () => {
    setIsUploadPhotoPickerVisible(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast('Izin akses galeri diperlukan untuk memilih foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setIsUploadingMedia(true);
        setUploadStatusText('Mengunggah foto ke Google Drive...');
        try {
          await addDocumentationMediaToDrive(activity.id, {
            fileUri: asset.uri,
            base64Data: asset.base64,
            fileName: asset.fileName || `foto_${Date.now()}.jpg`,
            mimeType: asset.mimeType || 'image/jpeg',
            mediaType: 'PHOTO',
          });
        } finally {
          setIsUploadingMedia(false);
        }
      }
    } catch (e) {
      console.warn('Picker error:', e);
      setIsUploadingMedia(false);
      showToast('Gagal memproses foto dari galeri.');
    }
  };

  const handleTakePhoto = async () => {
    setIsUploadPhotoPickerVisible(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showToast('Izin akses kamera diperlukan untuk mengambil foto.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setIsUploadingMedia(true);
        setUploadStatusText('Mengunggah foto kamera ke Google Drive...');
        try {
          await addDocumentationMediaToDrive(activity.id, {
            fileUri: asset.uri,
            base64Data: asset.base64,
            fileName: `foto_${Date.now()}.jpg`,
            mimeType: asset.mimeType || 'image/jpeg',
            mediaType: 'PHOTO',
          });
        } finally {
          setIsUploadingMedia(false);
        }
      }
    } catch (e) {
      console.warn('Camera error:', e);
      setIsUploadingMedia(false);
      showToast('Gagal mengambil foto dari kamera.');
    }
  };

  const handleLinkPhotoFromDrive = async () => {
    if (!drivePhotoUrlInput.trim()) {
      showToast('Masukkan tautan atau ID foto Google Drive!');
      return;
    }
    setIsUploadingMedia(true);
    setUploadStatusText('Menautkan foto Google Drive ke arsip kegiatan...');
    try {
      const success = await linkDocumentationMediaFromDrive(
        activity.id,
        drivePhotoUrlInput.trim(),
        'PHOTO'
      );
      if (success) {
        setDrivePhotoUrlInput('');
        setIsUploadPhotoPickerVisible(false);
      }
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const confirmDeletePhoto = (photoUrl: string) => {
    Alert.alert(
      'Hapus Foto Dokumentasi',
      'Apakah Anda yakin ingin menghapus foto ini dari arsip kegiatan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            deleteDocumentationMediaFromDrive(activity.id, photoUrl);
            if (previewPhotoUrl === photoUrl) {
              setPreviewPhotoUrl(null);
            }
          },
        },
      ]
    );
  };

  // Video handlers (Google Drive Integrated)
  const handlePickVideoFromGallery = async () => {
    setIsUploadVideoModalVisible(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast('Izin akses galeri diperlukan untuk memilih video.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const asset = result.assets[0];
        setIsUploadingMedia(true);
        setUploadStatusText('Mengunggah & mengarsipkan video ke Google Drive...');
        try {
          await addDocumentationMediaToDrive(activity.id, {
            fileUri: asset.uri,
            fileName: asset.fileName || `video_${Date.now()}.mp4`,
            mimeType: asset.mimeType || 'video/mp4',
            mediaType: 'VIDEO',
          });
        } finally {
          setIsUploadingMedia(false);
        }
      }
    } catch (e) {
      console.warn('Video picker error:', e);
      setIsUploadingMedia(false);
      showToast('Gagal memproses video untuk Google Drive.');
    }
  };

  const handleSaveVideoUrl = async () => {
    if (!videoUrlInput.trim()) {
      showToast('Masukkan link URL video yang valid!');
      return;
    }
    const input = videoUrlInput.trim();
    if (
      input.includes('drive.google.com') ||
      input.includes('googleusercontent') ||
      /^[a-zA-Z0-9_-]{20,50}$/.test(input)
    ) {
      await linkDocumentationMediaFromDrive(activity.id, input, 'VIDEO');
    } else {
      addDocumentationVideo(activity.id, input);
    }
    setVideoUrlInput('');
    setIsUploadVideoModalVisible(false);
  };

  const confirmDeleteVideo = (videoUrl: string) => {
    Alert.alert(
      'Hapus Video Dokumentasi',
      'Apakah Anda yakin ingin menghapus video ini dari arsip kegiatan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            deleteDocumentationMediaFromDrive(activity.id, videoUrl);
            if (previewVideoUrl === videoUrl) {
              setPreviewVideoUrl(null);
            }
          },
        },
      ]
    );
  };

  const handlePlayVideo = (videoUrl: string) => {
    Linking.openURL(videoUrl).catch(() => {
      showToast('Tidak dapat memutar video langsung dari URL ini.');
    });
  };

  const currentRsvp = activity.userRsvpStatus;
  const progressRatio = activity.quota
    ? Math.min(1, activity.confirmedCount / activity.quota)
    : 0;

  return (
    <View style={styles.safeArea}>
      {/* 1. FLOATING TOP CONTROLS FOR FULL BLEED HERO */}
      {heroThumbnailUrl && !heroImageError ? (
        <>
          <TouchableOpacity
            style={[
              styles.floatingRoundBackButton,
              { top: (insets.top || 12) + 8 },
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color={Colors.white}
            />
          </TouchableOpacity>

          <View
            style={[
              styles.floatingRightButtonsRow,
              { top: (insets.top || 12) + 8 },
            ]}
          >
            <TouchableOpacity
              style={styles.floatingRoundActionButton}
              activeOpacity={0.8}
              onPress={handleShare}
            >
              <MaterialCommunityIcons
                name="share-variant"
                size={18}
                color={Colors.white}
              />
            </TouchableOpacity>

            {isAdmin && (
              <>
                <TouchableOpacity
                  style={styles.floatingRoundActionButton}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate('CreateEditActivityScreen', {
                      editId: activity.id,
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={18}
                    color={Colors.white}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.floatingRoundActionButton}
                  activeOpacity={0.8}
                  onPress={handleDeleteActivity}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={18}
                    color="#FF453A"
                  />
                </TouchableOpacity>
              </>
            )}
          </View>
        </>
      ) : (
        <View style={[styles.topAppBar, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.topIconButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={Colors.iosTextPrimary}
            />
          </TouchableOpacity>

          <Text style={styles.topAppBarTitle} numberOfLines={1}>
            Detail Kegiatan
          </Text>

          <View style={styles.topRightActions}>
            <TouchableOpacity style={styles.topIconButton} onPress={handleShare}>
              <MaterialCommunityIcons
                name="share-variant"
                size={20}
                color={Colors.iosBlue}
              />
            </TouchableOpacity>

            {isAdmin && (
              <>
                <TouchableOpacity
                  style={styles.topIconButton}
                  onPress={() =>
                    navigation.navigate('CreateEditActivityScreen', {
                      editId: activity.id,
                    })
                  }
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={20}
                    color={Colors.iosTextPrimary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.topIconButton}
                  onPress={handleDeleteActivity}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={20}
                    color={Colors.iosDanger}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* 2. SCROLLABLE DETAILS */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 130 + (insets.bottom || 0) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* FULL BLEED HERO POSTER AT TOP */}
        {heroThumbnailUrl && !heroImageError ? (
          <View style={styles.heroFullBleedContainer}>
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => setPreviewPhotoUrl(heroThumbnailUrl)}
            >
              <Image
                source={{ uri: heroThumbnailUrl }}
                style={styles.heroFullBleedImage}
                onError={() => setHeroImageError(true)}
              />
              <View style={styles.heroThumbnailGradientOverlay} />

              {/* Badges on hero bottom */}
              <View style={styles.heroThumbnailBottomRow}>
                <View
                  style={[
                    styles.categoryTagOnHero,
                    { backgroundColor: 'rgba(28, 28, 30, 0.75)' },
                  ]}
                >
                  <Text style={styles.categoryTagOnHeroText}>
                    {activity.customCategoryName || categoryInfo.displayName}
                  </Text>
                </View>

                <View style={styles.targetRegionTagOnHero}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={12}
                    color={Colors.white}
                  />
                  <Text style={styles.targetRegionTagOnHeroText}>
                    {activity.targetRegion}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.mainContentPadding}>
          {(!heroThumbnailUrl || heroImageError) && (
            <View style={styles.categoryRegionRow}>
              <View
                style={[
                  styles.categoryTag,
                  { backgroundColor: categoryInfo.containerColor },
                ]}
              >
                <Text
                  style={[styles.categoryTagText, { color: categoryInfo.badgeColor }]}
                >
                  {activity.customCategoryName || categoryInfo.displayName}
                </Text>
              </View>

              <View style={styles.targetRegionTag}>
                <Text style={styles.targetRegionTagText}>
                  Wilayah: {activity.targetRegion}
                </Text>
              </View>
            </View>
          )}

        {/* Title */}
        <Text style={styles.detailTitle}>{activity.title}</Text>

        {/* Read Tracking Metric */}
        <View style={styles.readTrackingRow}>
          <View style={styles.readTrackingBadge}>
            <MaterialCommunityIcons
              name="eye-outline"
              size={15}
              color={isAdmin ? Colors.skyBlueHeader : Colors.textNavySecondary}
            />
            <Text
              style={[
                styles.readTrackingText,
                isAdmin && styles.readTrackingTextAdmin,
              ]}
            >
              {activity.readCount || activity.readByUserIds?.length || 0} orang telah membaca
            </Text>
          </View>
          {isAdmin && (
            <View style={styles.adminTrackingPill}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={12}
                color={Colors.skyBlueHeader}
              />
              <Text style={styles.adminTrackingPillText}>Metrik Admin</Text>
            </View>
          )}
        </View>

        {/* Organizer Card */}
        <View style={styles.organizerCard}>
          <View
            style={[
              styles.organizerAvatar,
              { backgroundColor: `${organizerRoleInfo.badgeColor}20` },
            ]}
          >
            <Text
              style={[
                styles.organizerAvatarText,
                { color: organizerRoleInfo.badgeColor },
              ]}
            >
              {activity.organizerName.charAt(0)}
            </Text>
          </View>

          <View style={styles.organizerInfo}>
            <Text style={styles.organizerName}>{activity.organizerName}</Text>
            <View style={styles.organizerRoleRow}>
              <View
                style={[
                  styles.roleDot,
                  { backgroundColor: organizerRoleInfo.badgeColor },
                ]}
              />
              <Text style={styles.organizerRoleText}>
                Penyelenggara: {organizerRoleInfo.title}
              </Text>
            </View>
          </View>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {activity.approvalStatus === 'PUBLISHED'
                ? 'Terverifikasi'
                : 'Menunggu ACC'}
            </Text>
          </View>
        </View>

        {/* Status Persetujuan & Tombol WhatsApp ACC Banner */}
        {activity.approvalStatus !== 'PUBLISHED' && waApprovalInfo && (
          <View style={styles.approvalStatusBanner}>
            <View style={styles.approvalStatusHeaderRow}>
              <MaterialCommunityIcons
                name="clock-alert-outline"
                size={22}
                color={Colors.yellowAccent}
              />
              <View style={styles.approvalStatusTextGroup}>
                <Text style={styles.approvalStatusBannerTitle}>
                  {activity.approvalStatus === 'WAITING_RW_APPROVAL'
                    ? 'Menunggu Persetujuan Ketua RW 05'
                    : 'Menunggu Persetujuan Staf Kelurahan'}
                </Text>
                <Text style={styles.approvalStatusBannerSub}>
                  {activity.followUpNote ||
                    'Kegiatan belum dapat dilihat oleh warga umum sebelum disetujui resmi.'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.requestApprovalWaBtn}
              activeOpacity={0.85}
              onPress={() => setIsWhatsAppModalVisible(true)}
            >
              <MaterialCommunityIcons
                name="whatsapp"
                size={18}
                color={Colors.white}
              />
              <Text style={styles.requestApprovalWaBtnText}>
                Minta ACC via WhatsApp ({waApprovalInfo.targetRole})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Description */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Deskripsi Kegiatan</Text>
          <Text style={styles.descriptionText}>{activity.description}</Text>
        </View>

        {/* Date, Time & Location Cards */}
        <View style={styles.infoCardsGrid}>
          {/* Tanggal & Waktu */}
          <View style={styles.infoGridCard}>
            <View style={styles.infoIconCircle}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={20}
                color={Colors.skyBlueHeader}
              />
            </View>
            <View style={styles.infoGridContent}>
              <Text style={styles.infoGridLabel}>Jadwal & Waktu</Text>
              <Text style={styles.infoGridMain}>{activity.formattedDate}</Text>
              <Text style={styles.infoGridSub}>{activity.timeSlot}</Text>
            </View>
          </View>

          {/* Lokasi */}
          <View style={styles.infoGridCard}>
            <View style={styles.infoIconCircle}>
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color={Colors.skyBlueHeader}
              />
            </View>
            <View style={styles.infoGridContent}>
              <Text style={styles.infoGridLabel}>Lokasi Kegiatan</Text>
              <Text style={styles.infoGridMain}>{activity.locationName}</Text>
              <Text style={styles.infoGridSub}>{activity.locationAddress}</Text>
            </View>
          </View>
        </View>

        {/* Map Preview */}
        <MapPreviewCard
          locationName={activity.locationName}
          address={activity.locationAddress}
          latitude={activity.latitude}
          longitude={activity.longitude}
        />

        {/* Quota & Attendees Card */}
        <View style={styles.quotaCard}>
          <View style={styles.quotaHeader}>
            <Text style={styles.quotaTitle}>Kehadiran Warga Lingkungan</Text>
            {activity.quota && (
              <Text style={styles.quotaRatioText}>
                {activity.confirmedCount} / {activity.quota} Kuota Terisi
              </Text>
            )}
          </View>

          <View style={styles.rsvpStatsRow}>
            <View style={styles.rsvpStatItem}>
              <Text style={[styles.rsvpStatNum, { color: Colors.kesehatanGreen }]}>
                {activity.confirmedCount}
              </Text>
              <Text style={styles.rsvpStatLabel}>Pasti Hadir</Text>
            </View>

            <View style={styles.rsvpStatItem}>
              <Text style={[styles.rsvpStatNum, { color: Colors.yellowAccent }]}>
                {activity.maybeCount}
              </Text>
              <Text style={styles.rsvpStatLabel}>Ragu-ragu</Text>
            </View>

            <View style={styles.rsvpStatItem}>
              <Text style={[styles.rsvpStatNum, { color: Colors.textNavyDark }]}>
                {activity.quota ? activity.quota : 'Tanpa Batas'}
              </Text>
              <Text style={styles.rsvpStatLabel}>Kuota</Text>
            </View>
          </View>

          {activity.quota && (
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressRatio * 100}%` },
                ]}
              />
            </View>
          )}
        </View>

        {/* 3. ARSIP GALERI FOTO & VIDEO DOKUMENTASI KEGIATAN */}
        <View style={styles.archiveSectionCard}>
          {/* Header Section */}
          <View style={styles.archiveHeaderRow}>
            <View style={styles.archiveHeaderTitleGroup}>
              <MaterialCommunityIcons
                name="folder-play-outline"
                size={22}
                color={Colors.skyBlueHeader}
              />
              <View>
                <Text style={styles.archiveSectionTitle}>
                  Arsip Foto & Video Dokumentasi
                </Text>
                <Text style={styles.archiveSectionSubtitle}>
                  {photosList.length} Foto • {videosList.length} Video Terarsip
                </Text>
              </View>
            </View>

            {/* Media Upload Buttons */}
            <View style={styles.archiveActionBtnsGroup}>
              <TouchableOpacity
                style={styles.addMediaBtn}
                onPress={() => setIsUploadPhotoPickerVisible(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="camera-plus"
                  size={15}
                  color={Colors.skyBlueHeader}
                />
                <Text style={styles.addMediaBtnText}>+ Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addMediaBtnVideo}
                onPress={() => setIsUploadVideoModalVisible(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="video-plus"
                  size={15}
                  color={Colors.onYellowContainer}
                />
                <Text style={styles.addMediaBtnVideoText}>+ Video</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Media Filter Tabs */}
          <View style={styles.mediaTabsRow}>
            <TouchableOpacity
              style={[
                styles.mediaTab,
                mediaFilter === 'ALL' && styles.mediaTabActive,
              ]}
              onPress={() => setMediaFilter('ALL')}
            >
              <Text
                style={[
                  styles.mediaTabText,
                  mediaFilter === 'ALL' && styles.mediaTabTextActive,
                ]}
              >
                Semua ({totalMediaCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mediaTab,
                mediaFilter === 'PHOTOS' && styles.mediaTabActive,
              ]}
              onPress={() => setMediaFilter('PHOTOS')}
            >
              <Text
                style={[
                  styles.mediaTabText,
                  mediaFilter === 'PHOTOS' && styles.mediaTabTextActive,
                ]}
              >
                Foto ({photosList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mediaTab,
                mediaFilter === 'VIDEOS' && styles.mediaTabActive,
              ]}
              onPress={() => setMediaFilter('VIDEOS')}
            >
              <Text
                style={[
                  styles.mediaTabText,
                  mediaFilter === 'VIDEOS' && styles.mediaTabTextActive,
                ]}
              >
                Video ({videosList.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Gallery Media Grid */}
          {totalMediaCount === 0 ? (
            <View style={styles.emptyMediaBox}>
              <MaterialCommunityIcons
                name="image-multiple-outline"
                size={40}
                color={Colors.textNavyMuted}
              />
              <Text style={styles.emptyMediaTitle}>Belum Ada Arsip Dokumentasi</Text>
              <Text style={styles.emptyMediaSubtitle}>
                Foto dan video kegiatan yang diunggah akan tersimpan rapi di sini.
              </Text>
            </View>
          ) : (
            <>
              {isAdmin && (
                <Text style={styles.mediaAdminHintText}>
                  * Tekan dan tahan (long-press) foto atau video untuk opsi hapus arsip
                </Text>
              )}
              <View style={styles.applePhotosGrid}>
                {/* Photo Items */}
                {(mediaFilter === 'ALL' || mediaFilter === 'PHOTOS') &&
                  photosList.map((photo, index) => (
                    <TouchableOpacity
                      key={`photo-${index}`}
                      style={styles.applePhotoItem}
                      activeOpacity={0.88}
                      onPress={() => setPreviewPhotoUrl(photo)}
                      onLongPress={isAdmin ? () => confirmDeletePhoto(photo) : undefined}
                      delayLongPress={400}
                    >
                      <Image source={{ uri: photo }} style={styles.applePhotoImage} />
                    </TouchableOpacity>
                  ))}

                {/* Video Items */}
                {(mediaFilter === 'ALL' || mediaFilter === 'VIDEOS') &&
                  videosList.map((video, index) => (
                    <TouchableOpacity
                      key={`video-${index}`}
                      style={styles.applePhotoItem}
                      activeOpacity={0.88}
                      onPress={() => setPreviewVideoUrl(video)}
                      onLongPress={isAdmin ? () => confirmDeleteVideo(video) : undefined}
                      delayLongPress={400}
                    >
                      <View style={styles.videoGridThumbnail}>
                        <MaterialCommunityIcons
                          name="play-circle"
                          size={32}
                          color="#FFFFFF"
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            </>
          )}
        </View>
        </View>
      </ScrollView>

      {/* 4. FLOATING RSVP BOTTOM BAR (Apple iOS Floating Island) */}
      <View
        style={[
          styles.floatingBottomActionBar,
          { bottom: (insets.bottom || 0) + 14 },
        ]}
      >
        <Text style={styles.bottomBarTitle}>Konfirmasi Kehadiran Anda:</Text>

        <View style={styles.rsvpButtonsRow}>
          {/* 1. "Saya Hadir" */}
          <TouchableOpacity
            style={[
              styles.actionRsvpBtn,
              currentRsvp === 'ATTENDING'
                ? styles.actionRsvpBtnAttendingActive
                : styles.actionRsvpBtnOutline,
            ]}
            onPress={() =>
              handleRsvpWithCheck(
                currentRsvp === 'ATTENDING' ? 'NONE' : 'ATTENDING'
              )
            }
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={16}
              color={
                currentRsvp === 'ATTENDING'
                  ? Colors.white
                  : Colors.salmonPrimary
              }
            />
            <Text
              style={[
                styles.actionRsvpText,
                currentRsvp === 'ATTENDING' && { color: Colors.white },
              ]}
            >
              Hadir
            </Text>
          </TouchableOpacity>

          {/* 2. "Ragu" */}
          <TouchableOpacity
            style={[
              styles.actionRsvpBtn,
              currentRsvp === 'MAYBE'
                ? styles.actionRsvpBtnMaybeActive
                : styles.actionRsvpBtnOutline,
            ]}
            onPress={() =>
              handleRsvpWithCheck(
                currentRsvp === 'MAYBE' ? 'NONE' : 'MAYBE'
              )
            }
          >
            <MaterialCommunityIcons
              name="help-circle"
              size={16}
              color={
                currentRsvp === 'MAYBE' ? Colors.white : Colors.iosTextSecondary
              }
            />
            <Text
              style={[
                styles.actionRsvpText,
                {
                  color:
                    currentRsvp === 'MAYBE' ? Colors.white : Colors.iosTextSecondary,
                },
              ]}
            >
              Ragu
            </Text>
          </TouchableOpacity>

          {/* 3. "Tdk Hadir" */}
          <TouchableOpacity
            style={[
              styles.actionRsvpBtn,
              currentRsvp === 'NOT_ATTENDING'
                ? styles.actionRsvpBtnNotActive
                : styles.actionRsvpBtnOutline,
            ]}
            onPress={() =>
              handleRsvpWithCheck(
                currentRsvp === 'NOT_ATTENDING' ? 'NONE' : 'NOT_ATTENDING'
              )
            }
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={16}
              color={
                currentRsvp === 'NOT_ATTENDING' ? Colors.white : Colors.iosDanger
              }
            />
            <Text
              style={[
                styles.actionRsvpText,
                {
                  color:
                    currentRsvp === 'NOT_ATTENDING'
                      ? Colors.white
                      : Colors.iosDanger,
                },
              ]}
            >
              Tdk Hadir
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. UPLOAD PHOTO SOURCE SHEET (CAMERA / GALLERY) */}
      <Modal
        visible={isUploadPhotoPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsUploadPhotoPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalBackdrop}
          activeOpacity={1}
          onPress={() => setIsUploadPhotoPickerVisible(false)}
        >
          <View style={styles.pickerSheetContainer}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Tambah Foto Dokumentasi</Text>
            <Text style={styles.pickerSubtitle}>
              Pilih sumber foto dokumentasi kegiatan
            </Text>

            <TouchableOpacity
              style={styles.pickerOptionCard}
              activeOpacity={0.8}
              onPress={handleTakePhoto}
            >
              <View style={[styles.pickerIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <MaterialCommunityIcons
                  name="camera"
                  size={24}
                  color={Colors.skyBlueHeader}
                />
              </View>
              <View style={styles.pickerOptionInfo}>
                <Text style={styles.pickerOptionTitle}>Ambil dari Kamera</Text>
                <Text style={styles.pickerOptionDesc}>
                  Foto langsung dokumentasi kegiatan saat ini
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={Colors.textNavyMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerOptionCard}
              activeOpacity={0.8}
              onPress={handlePickFromGallery}
            >
              <View style={[styles.pickerIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons
                  name="image-multiple"
                  size={24}
                  color={Colors.onYellowContainer}
                />
              </View>
              <View style={styles.pickerOptionInfo}>
                <Text style={styles.pickerOptionTitle}>Pilih dari Galeri HP</Text>
                <Text style={styles.pickerOptionDesc}>
                  Pilih file foto dari galeri smartphone
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={Colors.textNavyMuted}
              />
            </TouchableOpacity>

            {/* Opsi 3: Tautkan Link Foto dari Google Drive */}
            <View style={styles.videoLinkInputContainer}>
              <Text style={styles.videoInputLabel}>Atau Tautkan Foto dari Google Drive:</Text>
              <TextInput
                style={styles.videoTextInput}
                placeholder="https://drive.google.com/... atau File ID"
                placeholderTextColor={Colors.textNavyMuted}
                value={drivePhotoUrlInput}
                onChangeText={setDrivePhotoUrlInput}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.saveVideoUrlBtn, { backgroundColor: Colors.skyBlueHeader }]}
                activeOpacity={0.85}
                onPress={handleLinkPhotoFromDrive}
              >
                <MaterialCommunityIcons
                  name="link-variant"
                  size={16}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.saveVideoUrlBtnText}>Tautkan Foto ke Arsip</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.pickerCancelButton}
              onPress={() => setIsUploadPhotoPickerVisible(false)}
            >
              <Text style={styles.pickerCancelText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 6. UPLOAD VIDEO SHEET / LINK MODAL */}
      <Modal
        visible={isUploadVideoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsUploadVideoModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalBackdrop}
          activeOpacity={1}
          onPress={() => setIsUploadVideoModalVisible(false)}
        >
          <View style={styles.pickerSheetContainer}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Tambah Video Dokumentasi</Text>
            <Text style={styles.pickerSubtitle}>
              Pilih file video atau masukkan tautan video kegiatan
            </Text>

            <TouchableOpacity
              style={styles.pickerOptionCard}
              activeOpacity={0.8}
              onPress={handlePickVideoFromGallery}
            >
              <View style={[styles.pickerIconCircle, { backgroundColor: '#EDE9FE' }]}>
                <MaterialCommunityIcons
                  name="video-plus"
                  size={24}
                  color="#7C3AED"
                />
              </View>
              <View style={styles.pickerOptionInfo}>
                <Text style={styles.pickerOptionTitle}>Pilih Video dari Galeri</Text>
                <Text style={styles.pickerOptionDesc}>
                  Upload rekaman video yang tersimpan di HP
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={Colors.textNavyMuted}
              />
            </TouchableOpacity>

            {/* Input Video Link */}
            <View style={styles.videoLinkInputContainer}>
              <Text style={styles.videoInputLabel}>Atau Masukkan Tautan Video:</Text>
              <TextInput
                style={styles.videoTextInput}
                placeholder="https://... (Link MP4, YouTube, Google Drive)"
                placeholderTextColor={Colors.textNavyMuted}
                value={videoUrlInput}
                onChangeText={setVideoUrlInput}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.saveVideoUrlBtn}
                activeOpacity={0.85}
                onPress={handleSaveVideoUrl}
              >
                <MaterialCommunityIcons
                  name="content-save"
                  size={16}
                  color={Colors.onYellowContainer}
                />
                <Text style={styles.saveVideoUrlBtnText}>Simpan Link Video</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.pickerCancelButton}
              onPress={() => setIsUploadVideoModalVisible(false)}
            >
              <Text style={styles.pickerCancelText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 7. FULLSCREEN PHOTO PREVIEW LIGHTBOX */}
      <Modal
        visible={previewPhotoUrl !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewPhotoUrl(null)}
      >
        <View style={styles.modalBackdrop}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pratinjau Foto Dokumentasi</Text>
              <TouchableOpacity onPress={() => setPreviewPhotoUrl(null)}>
                <MaterialCommunityIcons name="close" size={26} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {previewPhotoUrl && (
              <Image
                source={{ uri: previewPhotoUrl }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}

            <View style={styles.modalActionsRow}>
              {previewPhotoUrl && (
                <TouchableOpacity
                  style={styles.modalDeleteButton}
                  onPress={() => {
                    if (previewPhotoUrl) {
                      confirmDeletePhoto(previewPhotoUrl);
                    }
                  }}
                >
                  <MaterialCommunityIcons
                    name="trash-can"
                    size={18}
                    color={Colors.urgentRed}
                  />
                  <Text style={styles.modalDeleteButtonText}>Hapus</Text>
                </TouchableOpacity>
              )}

              {previewPhotoUrl && (
                <TouchableOpacity
                  style={styles.modalDriveButton}
                  onPress={() => {
                    if (previewPhotoUrl) {
                      Linking.openURL(previewPhotoUrl).catch(() => {
                        showToast('Tidak dapat membuka link Google Drive.');
                      });
                    }
                  }}
                >
                  <MaterialCommunityIcons
                    name="google-drive"
                    size={18}
                    color={Colors.skyBlueHeader}
                  />
                  <Text style={styles.modalDriveButtonText}>Buka di Drive</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.modalDownloadButton,
                  previewPhotoUrl && { flex: 1 },
                ]}
                onPress={() => {
                  showToast('Foto dokumentasi tersimpan!');
                  setPreviewPhotoUrl(null);
                }}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={20}
                  color={Colors.onYellowContainer}
                />
                <Text style={styles.modalDownloadButtonText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* 8. VIDEO PLAYER / PREVIEW MODAL */}
      <Modal
        visible={previewVideoUrl !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVideoUrl(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.videoPreviewModalCard}>
            <View style={styles.modalHeaderVideo}>
              <Text style={styles.videoModalTitle}>Video Dokumentasi Kegiatan</Text>
              <TouchableOpacity onPress={() => setPreviewVideoUrl(null)}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.textNavyDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.videoPlayerBox}>
              <MaterialCommunityIcons
                name="motion-play-outline"
                size={64}
                color={Colors.skyBlueHeader}
              />
              <Text style={styles.videoPlayHint}>
                Klik tombol di bawah untuk memutar rekaman video dokumentasi kegiatan ini:
              </Text>

              <TouchableOpacity
                style={styles.playExternalVideoBtn}
                activeOpacity={0.85}
                onPress={() => {
                  if (previewVideoUrl) handlePlayVideo(previewVideoUrl);
                }}
              >
                <MaterialCommunityIcons name="play" size={20} color={Colors.white} />
                <Text style={styles.playExternalVideoBtnText}>Putar Video Sekarang</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.videoModalFooterActions}>
              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={() => {
                  if (previewVideoUrl) {
                    confirmDeleteVideo(previewVideoUrl);
                  }
                }}
              >
                <MaterialCommunityIcons
                  name="trash-can"
                  size={18}
                  color={Colors.urgentRed}
                />
                <Text style={styles.modalDeleteButtonText}>Hapus Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeVideoModalBtn}
                onPress={() => setPreviewVideoUrl(null)}
              >
                <Text style={styles.closeVideoModalBtnText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 9. UPLOADING OVERLAY MODAL */}
      <Modal visible={isUploadingMedia} transparent animationType="fade">
        <View style={styles.uploadingBackdrop}>
          <View style={styles.uploadingCard}>
            <ActivityIndicator size="large" color={Colors.skyBlueHeader} />
            <Text style={styles.uploadingTitle}>Google Drive Cloud Storage</Text>
            <Text style={styles.uploadingSub}>{uploadStatusText}</Text>
          </View>
        </View>
      </Modal>

      {/* 9. VERIFICATION MODAL */}
      <VerificationModal
        visible={isVerificationModalVisible}
        onClose={() => setIsVerificationModalVisible(false)}
        onSuccess={handleVerificationSuccess}
      />

      {/* 10. WHATSAPP APPROVAL REQUEST MODAL */}
      {waApprovalInfo && (
        <WhatsAppApprovalModal
          visible={isWhatsAppModalVisible}
          onClose={() => setIsWhatsAppModalVisible(false)}
          title={activity.title}
          itemType="KEGIATAN"
          targetName={waApprovalInfo.targetName}
          targetRole={waApprovalInfo.targetRole}
          targetPhone={waApprovalInfo.targetPhone}
          messageText={waApprovalInfo.message}
          onSuccessSent={() => setIsWhatsAppModalVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.iosBackground,
  },
  floatingRoundBackButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  floatingRightButtonsRow: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 99,
  },
  floatingRoundActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFullBleedContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
    backgroundColor: Colors.iosBackground,
  },
  heroFullBleedImage: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  heroThumbnailBottomRow: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainContentPadding: {
    padding: 16,
    gap: 14,
  },
  topAppBar: {
    height: 56,
    backgroundColor: Colors.iosCard,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.iosBorder,
  },
  topIconButton: {
    padding: 8,
  },
  topAppBarTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.iosTextPrimary,
    marginLeft: 4,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 130,
  },
  heroThumbnailCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 200,
    backgroundColor: Colors.skyBlueHeader,
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    position: 'relative',
  },
  heroThumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroThumbnailGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  heroThumbnailTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTagOnHero: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    elevation: 2,
  },
  categoryTagOnHeroText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  targetRegionTagOnHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  targetRegionTagOnHeroText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  heroTapExpandBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  heroTapExpandText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  categoryRegionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  targetRegionTag: {
    backgroundColor: Colors.skyBlueSurfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  targetRegionTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.skyBlueHeader,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textNavyDark,
    lineHeight: 28,
  },
  organizerCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    gap: 12,
  },
  organizerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerAvatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  organizerRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  organizerRoleText: {
    fontSize: 11,
    color: Colors.textNavyMuted,
  },
  statusPill: {
    backgroundColor: Colors.kesehatanGreenContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.kesehatanGreen,
  },
  approvalStatusBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    gap: 10,
  },
  approvalStatusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  approvalStatusTextGroup: {
    flex: 1,
  },
  approvalStatusBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.onYellowContainer,
  },
  approvalStatusBannerSub: {
    fontSize: 11,
    color: Colors.onYellowContainer,
    marginTop: 2,
    lineHeight: 16,
  },
  requestApprovalWaBtn: {
    backgroundColor: Colors.whatsappGreen,
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
  },
  requestApprovalWaBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textNavyDark,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textNavySecondary,
  },
  infoCardsGrid: {
    gap: 10,
  },
  infoGridCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  infoIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.skyBlueBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGridContent: {
    flex: 1,
  },
  infoGridLabel: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    fontWeight: '600',
  },
  infoGridMain: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
    marginTop: 1,
  },
  infoGridSub: {
    fontSize: 11,
    color: Colors.textNavySecondary,
    marginTop: 1,
  },
  quotaCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
  },
  quotaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quotaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  quotaRatioText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  rsvpStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  rsvpStatItem: {
    alignItems: 'center',
  },
  rsvpStatNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  rsvpStatLabel: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.kesehatanGreen,
    borderRadius: 3,
  },
  archiveSectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  archiveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  archiveHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  archiveSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  archiveSectionSubtitle: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    marginTop: 1,
  },
  archiveActionBtnsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.salmonContainer,
    borderWidth: 1,
    borderColor: Colors.salmonBorder,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 3,
  },
  addMediaBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.salmonPrimary,
  },
  addMediaBtnVideo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.salmonContainer,
    borderWidth: 1,
    borderColor: Colors.salmonBorder,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 3,
  },
  addMediaBtnVideoText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.salmonPrimary,
  },
  mediaTabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.iosBackground,
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  mediaTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  mediaTabActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  mediaTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.iosTextSecondary,
  },
  mediaTabTextActive: {
    color: Colors.salmonPrimary,
    fontWeight: '700',
  },
  emptyMediaBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderRadius: 14,
    borderStyle: 'dashed',
  },
  emptyMediaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
    marginTop: 8,
    marginBottom: 3,
  },
  emptyMediaSubtitle: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'flex-start',
  },
  mediaItemContainer: {
    width: '32.5%',
    aspectRatio: 1,
    position: 'relative',
    marginBottom: 3,
  },
  photoItemCard: {
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E5EA',
    position: 'relative',
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoBadgePill: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  photoBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.white,
  },
  videoItemCard: {
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    backgroundColor: '#1C1C1E',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaAdminHintText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: Colors.iosTextMuted,
    marginTop: 4,
    marginBottom: 8,
  },
  applePhotosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginTop: 6,
  },
  applePhotoItem: {
    width: '32.6%',
    aspectRatio: 1,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: Colors.iosBackground,
  },
  applePhotoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoGridThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBottomActionBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: Colors.iosCard,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  bottomBarTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.iosTextPrimary,
    marginBottom: 8,
  },
  rsvpButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionRsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 5,
  },
  actionRsvpBtnOutline: {
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    backgroundColor: Colors.iosBackground,
  },
  actionRsvpBtnAttendingActive: {
    backgroundColor: Colors.salmonPrimary,
    borderWidth: 1,
    borderColor: Colors.salmonPrimary,
  },
  actionRsvpBtnMaybeActive: {
    backgroundColor: Colors.iosBlue,
  },
  actionRsvpBtnNotActive: {
    backgroundColor: Colors.iosDanger,
  },
  actionRsvpText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.iosTextPrimary,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.skyBlueBackground,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textNavyDark,
    marginBottom: 16,
  },
  backButtonSimple: {
    backgroundColor: Colors.skyBlueHeader,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backButtonSimpleText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  pickerModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerSheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textNavyDark,
    marginBottom: 4,
  },
  pickerSubtitle: {
    fontSize: 12,
    color: Colors.textNavyMuted,
    marginBottom: 16,
  },
  pickerOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 10,
    gap: 12,
  },
  pickerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerOptionInfo: {
    flex: 1,
  },
  pickerOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  pickerOptionDesc: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    marginTop: 2,
  },
  videoLinkInputContainer: {
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  videoInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
    marginBottom: 6,
  },
  videoTextInput: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: Colors.textNavyDark,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 8,
  },
  saveVideoUrlBtn: {
    backgroundColor: Colors.yellowContainer,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    borderRadius: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveVideoUrlBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  pickerCancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  pickerCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textNavyMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  modalImage: {
    flex: 1,
    width: '100%',
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
  },
  modalDeleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: Colors.urgentRed,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  modalDeleteButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.urgentRed,
  },
  modalDownloadButton: {
    backgroundColor: Colors.yellowHighlight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  modalDownloadButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  videoPreviewModalCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    width: '90%',
    maxWidth: 380,
    elevation: 8,
  },
  modalHeaderVideo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  videoModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textNavyDark,
  },
  videoPlayerBox: {
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    marginBottom: 16,
  },
  videoPlayHint: {
    fontSize: 12,
    color: Colors.textNavySecondary,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 8,
    marginBottom: 14,
  },
  playExternalVideoBtn: {
    backgroundColor: Colors.skyBlueHeader,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playExternalVideoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  videoModalFooterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeVideoModalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeVideoModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  readTrackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  readTrackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.skyBlueBackground,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  readTrackingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textNavySecondary,
  },
  readTrackingTextAdmin: {
    color: Colors.skyBlueHeader,
    fontWeight: '700',
  },
  adminTrackingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  adminTrackingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  modalDriveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 6,
  },
  modalDriveButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  uploadingBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  uploadingCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  uploadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textNavyDark,
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  uploadingSub: {
    fontSize: 13,
    color: Colors.textNavySecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
