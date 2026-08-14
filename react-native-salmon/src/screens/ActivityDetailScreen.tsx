import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MapPreviewCard } from '../components/MapPreviewCard';
import {
  CategoryMeta,
  Colors,
  UserRolesMeta,
} from '../constants/theme';
import { useApp } from '../context/AppContext';
import { RsvpStatusType } from '../types';

interface ActivityDetailScreenProps {
  route: any;
  navigation: any;
}

export const ActivityDetailScreen: React.FC<ActivityDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { activityId } = route.params || {};
  const {
    currentUser,
    activities,
    updateRsvpStatus,
    addDocumentationPhoto,
    deleteDocumentationPhoto,
    showToast,
  } = useApp();

  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [isUploadPickerVisible, setIsUploadPickerVisible] = useState(false);

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

  // Default gallery photos + user uploaded photos
  const defaultDocs = [
    'https://images.pexels.com/photos/8460159/pexels-photo-8460159.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/7088530/pexels-photo-7088530.jpeg?auto=compress&cs=tinysrgb&w=800',
  ];
  const allPhotos = Array.from(new Set([...(activity.photos || []), ...defaultDocs]));

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

  const handlePickFromGallery = async () => {
    setIsUploadPickerVisible(false);
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
    setIsUploadPickerVisible(false);
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
        {/* Category Tag & Target Region */}
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
              {categoryInfo.displayName}
            </Text>
          </View>

          <View style={styles.targetRegionTag}>
            <Text style={styles.targetRegionTagText}>
              Wilayah: {activity.targetRegion}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.detailTitle}>{activity.title}</Text>

        {/* Organizer Card */}
        <View style={styles.organizerCard}>
          <View
            style={[
              styles.organizerAvatar,
              { backgroundColor: organizerRoleInfo.badgeColor },
            ]}
          >
            <MaterialCommunityIcons name="account" size={22} color={Colors.white} />
          </View>
          <View style={styles.organizerInfo}>
            <Text style={styles.organizerName}>
              Penyelenggara: {activity.organizerName}
            </Text>
            <Text
              style={[
                styles.organizerRole,
                { color: organizerRoleInfo.badgeColor },
              ]}
            >
              {organizerRoleInfo.title}
            </Text>
          </View>
        </View>

        {/* Date & Time Card */}
        <View style={styles.dateTimeCard}>
          <View style={styles.dateTimeRow}>
            <MaterialCommunityIcons
              name="calendar-month"
              size={22}
              color={Colors.skyBlueHeader}
            />
            <View style={styles.dateTimeTextGroup}>
              <Text style={styles.dateTimeLabel}>Tanggal Kegiatan</Text>
              <Text style={styles.dateTimeValue}>{activity.formattedDate}</Text>
            </View>
          </View>

          <View style={styles.innerDivider} />

          <View style={styles.dateTimeRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={22}
              color={Colors.skyBlueHeader}
            />
            <View style={styles.dateTimeTextGroup}>
              <Text style={styles.dateTimeLabel}>Waktu Pelaksanaan</Text>
              <Text style={styles.dateTimeValue}>{activity.timeSlot}</Text>
            </View>
          </View>
        </View>

        {/* Location & Map Preview */}
        <Text style={styles.sectionHeaderTitle}>Lokasi Kegiatan & Peta</Text>
        <MapPreviewCard
          locationName={activity.locationName}
          address={activity.locationAddress}
          latitude={activity.latitude}
          longitude={activity.longitude}
        />

        {/* Full Description */}
        <Text style={[styles.sectionHeaderTitle, { marginTop: 18 }]}>
          Deskripsi Lengkap
        </Text>
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>{activity.description}</Text>
        </View>

        {/* Attendance Counter & Quota */}
        <Text style={[styles.sectionHeaderTitle, { marginTop: 18 }]}>
          Ringkasan Peserta (RSVP)
        </Text>
        <View style={styles.rsvpSummaryCard}>
          <View style={styles.rsvpStatsRow}>
            <View style={styles.rsvpStatItem}>
              <Text style={[styles.rsvpStatNum, { color: Colors.skyBlueHeader }]}>
                {activity.confirmedCount}
              </Text>
              <Text style={styles.rsvpStatLabel}>Hadir</Text>
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

        {/* 3. DOCUMENTATION GALLERY */}
        <View style={styles.docHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Foto & Dokumentasi Kegiatan</Text>
          <TouchableOpacity
            style={styles.uploadDocButton}
            onPress={() => setIsUploadPickerVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="camera-plus"
              size={15}
              color={Colors.skyBlueHeader}
            />
            <Text style={styles.uploadDocButtonText}>Upload Foto</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.galleryScrollView}
          contentContainerStyle={styles.galleryScroll}
        >
          {allPhotos.map((photo, index) => (
            <TouchableOpacity
              key={`${photo}-${index}`}
              style={styles.photoThumbContainer}
              activeOpacity={0.85}
              onPress={() => setPreviewPhotoUrl(photo)}
            >
              <Image source={{ uri: photo }} style={styles.photoThumb} />
              <View style={styles.zoomOverlay}>
                <MaterialCommunityIcons
                  name="magnify-plus"
                  size={14}
                  color={Colors.white}
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
              updateRsvpStatus(
                activity.id,
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
              updateRsvpStatus(
                activity.id,
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
              updateRsvpStatus(
                activity.id,
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

      {/* 5. UPLOAD SOURCE SELECTION MODAL (CAMERA / GALLERY) */}
      <Modal
        visible={isUploadPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsUploadPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalBackdrop}
          activeOpacity={1}
          onPress={() => setIsUploadPickerVisible(false)}
        >
          <View style={styles.pickerSheetContainer}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Unggah Foto Dokumentasi</Text>
            <Text style={styles.pickerSubtitle}>
              Pilih sumber foto dari smartphone Anda
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
              <View style={[styles.pickerIconCircle, { backgroundColor: Colors.yellowContainer }]}>
                <MaterialCommunityIcons
                  name="image-multiple"
                  size={24}
                  color={Colors.onYellowContainer}
                />
              </View>
              <View style={styles.pickerOptionInfo}>
                <Text style={styles.pickerOptionTitle}>Pilih dari Galeri HP</Text>
                <Text style={styles.pickerOptionDesc}>
                  Pilih file gambar yang tersimpan di memori HP
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
              onPress={() => setIsUploadPickerVisible(false)}
            >
              <Text style={styles.pickerCancelText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 6. FULLSCREEN PHOTO PREVIEW MODAL */}
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
              {previewPhotoUrl && activity.photos?.includes(previewPhotoUrl) && (
                <TouchableOpacity
                  style={styles.modalDeleteButton}
                  onPress={() => {
                    deleteDocumentationPhoto(activity.id, previewPhotoUrl);
                    setPreviewPhotoUrl(null);
                  }}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={20}
                    color={Colors.urgentRed}
                  />
                  <Text style={styles.modalDeleteButtonText}>Hapus Foto</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.modalDownloadButton,
                  previewPhotoUrl && activity.photos?.includes(previewPhotoUrl) && { flex: 1 },
                ]}
                onPress={() => {
                  showToast('Foto tersimpan!');
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
    elevation: 3,
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
    paddingBottom: 24,
  },
  categoryRegionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  targetRegionTag: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  targetRegionTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  detailTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: Colors.textNavyDark,
    lineHeight: 28,
    marginBottom: 12,
  },
  organizerCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    marginBottom: 14,
    gap: 12,
  },
  organizerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  organizerRole: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  dateTimeCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.yellowBorderLis,
    marginBottom: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateTimeTextGroup: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 11,
    color: Colors.textNavyMuted,
  },
  dateTimeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textNavyDark,
    marginTop: 1,
  },
  innerDivider: {
    height: 1,
    backgroundColor: Colors.skyBlueSurfaceVariant,
    marginVertical: 10,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textNavyDark,
    marginBottom: 8,
  },
  descriptionCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 13,
    color: Colors.textNavySecondary,
    lineHeight: 21,
  },
  rsvpSummaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    marginBottom: 16,
    elevation: 1,
  },
  rsvpStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  rsvpStatItem: {
    alignItems: 'center',
  },
  rsvpStatNum: {
    fontSize: 22,
    fontWeight: '800',
  },
  rsvpStatLabel: {
    fontSize: 12,
    color: Colors.textNavySecondary,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.skyBlueSurfaceVariant,
    borderRadius: 4,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.yellowHighlight,
    borderRadius: 4,
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  uploadDocButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.skyBlueHeader,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  uploadDocButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  galleryScroll: {
    gap: 10,
    paddingBottom: 10,
  },
  photoThumbContainer: {
    width: 130,
    height: 100,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  zoomOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomActionBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomBarTitle: {
    fontSize: 13,
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
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionRsvpBtnOutline: {
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    backgroundColor: Colors.white,
  },
  actionRsvpBtnAttendingActive: {
    backgroundColor: Colors.yellowHighlight,
    borderWidth: 1.5,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },
  modalContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  modalImage: {
    flex: 1,
    width: '100%',
    borderRadius: 16,
    marginVertical: 16,
  },
  galleryScrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalDeleteButton: {
    height: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: Colors.urgentRed,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 6,
  },
  modalDeleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.urgentRed,
  },
  modalDownloadButton: {
    height: 50,
    backgroundColor: Colors.yellowHighlight,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalDownloadButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  pickerModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  pickerSheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    alignSelf: 'center',
    marginBottom: 14,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textNavyDark,
    textAlign: 'center',
  },
  pickerSubtitle: {
    fontSize: 12,
    color: Colors.textNavyMuted,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  pickerOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 16,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  pickerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  pickerOptionInfo: {
    flex: 1,
  },
  pickerOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  pickerOptionDesc: {
    fontSize: 11,
    color: Colors.textNavySecondary,
    marginTop: 2,
  },
  pickerCancelButton: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: Colors.skyBlueSurfaceVariant,
  },
  pickerCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textNavySecondary,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.skyBlueBackground,
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.textNavyDark,
    marginBottom: 12,
  },
  backButtonSimple: {
    backgroundColor: Colors.skyBlueHeader,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  backButtonSimpleText: {
    color: Colors.white,
    fontWeight: '700',
  },
});
