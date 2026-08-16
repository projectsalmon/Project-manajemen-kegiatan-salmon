import React, { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const {
    currentUser,
    contacts,
    activities,
    updateRsvpStatus,
    addDocumentationPhoto,
    deleteDocumentationPhoto,
    addDocumentationVideo,
    deleteDocumentationVideo,
    showToast,
  } = useApp();

  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [isUploadPhotoPickerVisible, setIsUploadPhotoPickerVisible] = useState(false);
  const [isUploadVideoModalVisible, setIsUploadVideoModalVisible] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [mediaFilter, setMediaFilter] = useState<MediaFilterType>('ALL');
  const [isWhatsAppModalVisible, setIsWhatsAppModalVisible] = useState(false);

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

      await Share.share({
        title: activity.title,
        message: shareMessage,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  // Photo handlers
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
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        addDocumentationPhoto(activity.id, result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Picker error:', e);
      showToast('Gagal membuka galeri foto.');
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
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        addDocumentationPhoto(activity.id, result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Camera error:', e);
      showToast('Gagal membuka kamera HP.');
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
            deleteDocumentationPhoto(activity.id, photoUrl);
            if (previewPhotoUrl === photoUrl) {
              setPreviewPhotoUrl(null);
            }
          },
        },
      ]
    );
  };

  // Video handlers
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
        addDocumentationVideo(activity.id, result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Video picker error:', e);
      showToast('Gagal memilih video dari galeri.');
    }
  };

  const handleSaveVideoUrl = () => {
    if (!videoUrlInput.trim()) {
      showToast('Masukkan link URL video yang valid!');
      return;
    }
    addDocumentationVideo(activity.id, videoUrlInput.trim());
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
            deleteDocumentationVideo(activity.id, videoUrl);
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. TOP APP BAR */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          style={styles.topIconButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={Colors.textNavyDark}
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
              color={Colors.skyBlueHeader}
            />
          </TouchableOpacity>

          {isAdmin && (
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
                color={Colors.skyBlueHeader}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. SCROLLABLE DETAILS */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO THUMBNAIL POSTER DI PALING ATAS */}
        {heroThumbnailUrl ? (
          <TouchableOpacity
            style={styles.heroThumbnailCard}
            activeOpacity={0.9}
            onPress={() => setPreviewPhotoUrl(heroThumbnailUrl)}
          >
            <Image source={{ uri: heroThumbnailUrl }} style={styles.heroThumbnailImage} />
            <View style={styles.heroThumbnailGradientOverlay} />

            {/* Badges on top of thumbnail */}
            <View style={styles.heroThumbnailTopRow}>
              <View
                style={[
                  styles.categoryTagOnHero,
                  { backgroundColor: categoryInfo.badgeColor },
                ]}
              >
                <Text style={styles.categoryTagOnHeroText}>
                  {activity.customCategoryName || categoryInfo.displayName}
                </Text>
              </View>

              <View style={styles.targetRegionTagOnHero}>
                <MaterialCommunityIcons
                  name="map-marker-radius"
                  size={12}
                  color={Colors.white}
                />
                <Text style={styles.targetRegionTagOnHeroText}>
                  {activity.targetRegion}
                </Text>
              </View>
            </View>

            {/* Tap to expand banner */}
            <View style={styles.heroTapExpandBadge}>
              <MaterialCommunityIcons
                name="arrow-expand-all"
                size={14}
                color={Colors.white}
              />
              <Text style={styles.heroTapExpandText}>Lihat Poster Penuh</Text>
            </View>
          </TouchableOpacity>
        ) : (
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
            <View style={styles.mediaGrid}>
              {/* Photo Items */}
              {(mediaFilter === 'ALL' || mediaFilter === 'PHOTOS') &&
                photosList.map((photo, index) => (
                  <View key={`photo-${index}`} style={styles.mediaItemContainer}>
                    <TouchableOpacity
                      style={styles.photoItemCard}
                      activeOpacity={0.85}
                      onPress={() => setPreviewPhotoUrl(photo)}
                    >
                      <Image source={{ uri: photo }} style={styles.photoGridImage} />
                      <View style={styles.photoBadgePill}>
                        <MaterialCommunityIcons
                          name="image"
                          size={11}
                          color={Colors.white}
                        />
                        <Text style={styles.photoBadgeText}>Foto #{index + 1}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Delete Photo Button */}
                    <TouchableOpacity
                      style={styles.deleteMediaFloatingBtn}
                      activeOpacity={0.8}
                      onPress={() => confirmDeletePhoto(photo)}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={15}
                        color={Colors.urgentRed}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

              {/* Video Items */}
              {(mediaFilter === 'ALL' || mediaFilter === 'VIDEOS') &&
                videosList.map((video, index) => (
                  <View key={`video-${index}`} style={styles.mediaItemContainer}>
                    <TouchableOpacity
                      style={styles.videoItemCard}
                      activeOpacity={0.85}
                      onPress={() => setPreviewVideoUrl(video)}
                    >
                      <View style={styles.videoPlaceholderCover}>
                        <MaterialCommunityIcons
                          name="play-circle"
                          size={38}
                          color={Colors.white}
                        />
                      </View>
                      <View style={styles.videoBadgePill}>
                        <MaterialCommunityIcons
                          name="video"
                          size={11}
                          color={Colors.white}
                        />
                        <Text style={styles.videoBadgeText}>Video #{index + 1}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Delete Video Button */}
                    <TouchableOpacity
                      style={styles.deleteMediaFloatingBtn}
                      activeOpacity={0.8}
                      onPress={() => confirmDeleteVideo(video)}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={15}
                        color={Colors.urgentRed}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 4. INTERACTIVE RSVP BOTTOM BAR */}
      <View style={styles.bottomActionBar}>
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
                  ? Colors.onYellowContainer
                  : Colors.textNavyDark
              }
            />
            <Text
              style={[
                styles.actionRsvpText,
                currentRsvp === 'ATTENDING' && { color: Colors.onYellowContainer },
              ]}
            >
              Saya Hadir
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
                currentRsvp === 'MAYBE' ? Colors.white : Colors.skyBlueHeader
              }
            />
            <Text
              style={[
                styles.actionRsvpText,
                {
                  color:
                    currentRsvp === 'MAYBE' ? Colors.white : Colors.skyBlueHeader,
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
                currentRsvp === 'NOT_ATTENDING' ? Colors.white : Colors.urgentRed
              }
            />
            <Text
              style={[
                styles.actionRsvpText,
                {
                  color:
                    currentRsvp === 'NOT_ATTENDING'
                      ? Colors.white
                      : Colors.urgentRed,
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
                  <Text style={styles.modalDeleteButtonText}>Hapus Foto</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.skyBlueBackground,
  },
  topAppBar: {
    height: 56,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    elevation: 2,
  },
  topIconButton: {
    padding: 8,
  },
  topAppBarTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textNavyDark,
    marginLeft: 4,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 14,
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
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.skyBlueBorder,
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
    flex: 1,
  },
  archiveSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
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
    backgroundColor: Colors.skyBlueSurfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 3,
  },
  addMediaBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  addMediaBtnVideo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.yellowContainer,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 3,
  },
  addMediaBtnVideoText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  mediaTabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  mediaTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 9,
  },
  mediaTabActive: {
    backgroundColor: Colors.skyBlueHeader,
  },
  mediaTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textNavySecondary,
  },
  mediaTabTextActive: {
    color: Colors.white,
  },
  emptyMediaBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyMediaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
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
    gap: 10,
  },
  mediaItemContainer: {
    width: '48%',
    position: 'relative',
  },
  photoItemCard: {
    borderRadius: 14,
    overflow: 'hidden',
    height: 120,
    backgroundColor: Colors.skyBlueBackground,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    position: 'relative',
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoBadgePill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  photoBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.white,
  },
  videoItemCard: {
    borderRadius: 14,
    overflow: 'hidden',
    height: 120,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholderCover: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadgePill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.skyBlueHeader,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  videoBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.white,
  },
  deleteMediaFloatingBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.white,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    elevation: 8,
  },
  bottomBarTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textNavyDark,
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
    borderColor: Colors.borderLight,
    backgroundColor: Colors.skyBlueBackground,
  },
  actionRsvpBtnAttendingActive: {
    backgroundColor: Colors.yellowHighlight,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
  },
  actionRsvpBtnMaybeActive: {
    backgroundColor: Colors.skyBlueHeader,
  },
  actionRsvpBtnNotActive: {
    backgroundColor: Colors.urgentRed,
  },
  actionRsvpText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textNavyDark,
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
});
