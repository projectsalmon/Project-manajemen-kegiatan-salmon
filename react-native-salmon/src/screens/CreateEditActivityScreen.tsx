import React, { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { DatePickerModal } from '../components/DatePickerModal';
import { LocationSettingsModal } from '../components/LocationSettingsModal';
import { TimePickerModal } from '../components/TimePickerModal';
import { WhatsAppApprovalModal } from '../components/WhatsAppApprovalModal';
import { CategoryMeta, Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { ActivityCategoryType, ActivityItem, LocationPresetItem } from '../types';
import { buildActivityApprovalMessage } from '../utils/whatsappHelpers';

interface CreateEditActivityScreenProps {
  route: any;
  navigation: any;
}

export const CreateEditActivityScreen: React.FC<
  CreateEditActivityScreenProps
> = ({ route, navigation }) => {
  const { editId, initialCategory } = route.params || {};
  const {
    currentUser,
    contacts,
    activities,
    locationPresets,
    addActivity,
    updateActivity,
    showToast,
  } = useApp();

  const existing = activities.find((a) => a.id === editId);

  const [title, setTitle] = useState(existing?.title || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategoryType>(
    existing?.category || initialCategory || 'KERJA_BAKTI'
  );
  const [customCategoryName, setCustomCategoryName] = useState(
    existing?.customCategoryName || ''
  );

  const [formattedDate, setFormattedDate] = useState(
    existing?.formattedDate || 'Minggu, 25 Mei 2025'
  );
  const [dateIso, setDateIso] = useState(existing?.dateIso || '2025-05-25');
  const [timeSlot, setTimeSlot] = useState(
    existing?.timeSlot || '08:00 - 11:00 WIB'
  );

  const [locationName, setLocationName] = useState(
    existing?.locationName || 'Balai Warga RT 03'
  );
  const [locationAddress, setLocationAddress] = useState(
    existing?.locationAddress || 'Jl. Mawar No. 12, RT 03 / RW 05'
  );

  const [targetRegion, setTargetRegion] = useState(
    existing?.targetRegion || 'RT 03 / RW 05'
  );

  // Quota mode: hasQuota boolean + numeric string
  const [hasQuotaLimit, setHasQuotaLimit] = useState<boolean>(
    existing?.quota ? true : false
  );
  const [quotaCount, setQuotaCount] = useState<number>(
    existing?.quota ? existing.quota : 50
  );

  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [isLocationSettingsVisible, setIsLocationSettingsVisible] = useState(false);

  const [waModalData, setWaModalData] = useState<{
    visible: boolean;
    targetName: string;
    targetRole: string;
    targetPhone: string;
    messageText: string;
  }>({
    visible: false,
    targetName: '',
    targetRole: '',
    targetPhone: '',
    messageText: '',
  });

  const [photoUri, setPhotoUri] = useState<string | null>(
    existing?.imageUrl || null
  );
  const [isPhotoPickerVisible, setIsPhotoPickerVisible] = useState(false);

  const categories: ActivityCategoryType[] = [
    'POSYANDU',
    'KERJA_BAKTI',
    'RAPAT',
    'KESEHATAN',
    'SOSIAL',
    'OLAH_RAGA',
    'LAINNYA',
  ];

  // Target Region Presets
  const regionPresets = [
    'RT 01 / RW 05',
    'RT 02 / RW 05',
    'RT 03 / RW 05',
    'RT 04 / RW 05',
    'RT 05 / RW 05',
    'Seluruh RT di RW 05',
    'Ibu & Balita (Posyandu)',
    'Warga Lansia (Kesehatan)',
    'Pemuda & Karang Taruna',
    'Seluruh Warga Sukamaju',
  ];

  // Quota quick presets
  const quotaPresets = [20, 30, 50, 75, 100, 150, 200];

  const handleSelectLocationPreset = (loc: LocationPresetItem) => {
    setLocationName(loc.name);
    setLocationAddress(loc.address);
    showToast(`Lokasi '${loc.name}' dipilih.`);
  };

  const handleAdjustQuota = (delta: number) => {
    setQuotaCount((prev) => Math.max(5, prev + delta));
  };

  const handlePickFromGallery = async () => {
    setIsPhotoPickerVisible(false);
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
        setPhotoUri(result.assets[0].uri);
        showToast('Foto poster kegiatan dipilih!');
      }
    } catch (e) {
      console.warn('Gallery error:', e);
      showToast('Gagal memilih foto dari galeri.');
    }
  };

  const handleTakePhoto = async () => {
    setIsPhotoPickerVisible(false);
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
        setPhotoUri(result.assets[0].uri);
        showToast('Foto poster kegiatan diambil!');
      }
    } catch (e) {
      console.warn('Camera error:', e);
      showToast('Gagal mengambil foto dari kamera.');
    }
  };

  const handleSave = () => {
    if (!title.trim() || !description.trim()) {
      showToast('Mohon lengkapi judul dan deskripsi kegiatan!');
      return;
    }

    if (selectedCategory === 'LAINNYA' && !customCategoryName.trim()) {
      showToast('Mohon tuliskan nama kategori kustom Anda!');
      return;
    }

    const finalQuota = hasQuotaLimit ? quotaCount : null;
    const isWaitingApproval = currentUser.role === 'RT' || currentUser.role === 'RW';

    const tempActivity: ActivityItem = {
      id: editId || `ACT-${Date.now() % 10000}`,
      title: title.trim(),
      description: description.trim(),
      category: selectedCategory,
      customCategoryName:
        selectedCategory === 'LAINNYA' ? customCategoryName.trim() : undefined,
      dateIso,
      formattedDate,
      timeSlot,
      locationName: locationName.trim(),
      locationAddress: locationAddress.trim(),
      latitude: -6.215,
      longitude: 106.845,
      targetRegion: targetRegion.trim(),
      organizerRole: currentUser.role,
      organizerName: currentUser.name,
      confirmedCount: 1,
      maybeCount: 0,
      quota: finalQuota,
      userRsvpStatus: 'ATTENDING',
      photos: photoUri ? [photoUri] : [],
      imageUrl: photoUri,
      approvalStatus: currentUser.role === 'RT' ? 'WAITING_RW_APPROVAL' : currentUser.role === 'RW' ? 'WAITING_ADMIN_APPROVAL' : 'PUBLISHED',
    };

    if (editId && existing) {
      updateActivity(editId, {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        customCategoryName:
          selectedCategory === 'LAINNYA' ? customCategoryName.trim() : undefined,
        dateIso,
        formattedDate,
        timeSlot,
        locationName: locationName.trim(),
        locationAddress: locationAddress.trim(),
        targetRegion: targetRegion.trim(),
        quota: finalQuota,
        imageUrl: photoUri,
      });
    } else {
      addActivity({
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        customCategoryName:
          selectedCategory === 'LAINNYA' ? customCategoryName.trim() : undefined,
        dateIso,
        formattedDate,
        timeSlot,
        locationName: locationName.trim(),
        locationAddress: locationAddress.trim(),
        targetRegion: targetRegion.trim(),
        quota: finalQuota,
        imageUrl: photoUri,
      });
    }

    if (isWaitingApproval) {
      const waInfo = buildActivityApprovalMessage(tempActivity, currentUser, contacts);
      setWaModalData({
        visible: true,
        targetName: waInfo.targetName,
        targetRole: waInfo.targetRole,
        targetPhone: waInfo.targetPhone,
        messageText: waInfo.message,
      });
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. TOP APP BAR */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          style={styles.topIconButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="close"
            size={24}
            color={Colors.textNavyDark}
          />
        </TouchableOpacity>

        <Text style={styles.topAppBarTitle}>
          {editId ? 'Edit Kegiatan' : 'Buat Kegiatan Baru'}
        </Text>
      </View>

      {/* 2. FORM FIELDS */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Judul Kegiatan */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Judul Kegiatan *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Contoh: Kerja Bakti Massal RT 03"
            placeholderTextColor={Colors.textNavyMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Kategori Kegiatan & Custom Category */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Kategori Kegiatan *</Text>
          <TouchableOpacity
            style={styles.dropdownSelector}
            activeOpacity={0.8}
            onPress={() => setIsCategoryModalVisible(true)}
          >
            <View style={styles.categoryDisplayLeft}>
              <MaterialCommunityIcons
                name={CategoryMeta[selectedCategory].iconName as any}
                size={20}
                color={CategoryMeta[selectedCategory].badgeColor}
              />
              <Text style={styles.dropdownSelectorText}>
                {selectedCategory === 'LAINNYA' && customCategoryName
                  ? `${customCategoryName} (Kustom)`
                  : CategoryMeta[selectedCategory].displayName}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-down"
              size={22}
              color={Colors.skyBlueHeader}
            />
          </TouchableOpacity>

          {/* Special Input for "LAINNYA" (Kustom) */}
          {selectedCategory === 'LAINNYA' && (
            <View style={styles.customCategoryCard}>
              <View style={styles.customCategoryHeader}>
                <MaterialCommunityIcons
                  name="pencil-box-outline"
                  size={16}
                  color={CategoryMeta.LAINNYA.badgeColor}
                />
                <Text style={styles.customCategoryLabel}>
                  Nama Kategori Kustom Anda *
                </Text>
              </View>
              <TextInput
                style={styles.customCategoryInput}
                placeholder="Contoh: Pengajian Rutin, Bazar UMKM, Futsal Warga"
                placeholderTextColor={Colors.textNavyMuted}
                value={customCategoryName}
                onChangeText={setCustomCategoryName}
                autoFocus
              />
            </View>
          )}
        </View>

        {/* Deskripsi Lengkap */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Deskripsi Lengkap Kegiatan *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Tuliskan detail perlengkapan yang harus dibawa, rundown, dan informasi penting lainnya..."
            placeholderTextColor={Colors.textNavyMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Tanggal & Waktu (Popup Calendar & Time Stepper) */}
        <View style={styles.formRow}>
          {/* Tanggal Picker */}
          <View style={[styles.fieldContainer, { flex: 1, marginRight: 6 }]}>
            <Text style={styles.fieldLabel}>Tanggal Kegiatan *</Text>
            <TouchableOpacity
              style={styles.pickerSelectorBox}
              activeOpacity={0.8}
              onPress={() => setIsDatePickerVisible(true)}
            >
              <MaterialCommunityIcons
                name="calendar"
                size={20}
                color={Colors.skyBlueHeader}
              />
              <View style={styles.pickerSelectorInfo}>
                <Text style={styles.pickerSelectorPrimaryText} numberOfLines={1}>
                  {formattedDate}
                </Text>
                <Text style={styles.pickerSelectorSubText}>{dateIso}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Waktu Jam Picker */}
          <View style={[styles.fieldContainer, { flex: 1, marginLeft: 6 }]}>
            <Text style={styles.fieldLabel}>Waktu & Jam *</Text>
            <TouchableOpacity
              style={styles.pickerSelectorBox}
              activeOpacity={0.8}
              onPress={() => setIsTimePickerVisible(true)}
            >
              <MaterialCommunityIcons
                name="clock-time-four-outline"
                size={20}
                color={Colors.skyBlueHeader}
              />
              <View style={styles.pickerSelectorInfo}>
                <Text style={styles.pickerSelectorPrimaryText} numberOfLines={1}>
                  {timeSlot}
                </Text>
                <Text style={styles.pickerSelectorSubText}>Ketuk ganti jam</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. TITIK KUMPUL & REKOMENDASI TEMPAT */}
        <View style={styles.fieldContainer}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.fieldLabel}>Titik Kumpul / Lokasi Kegiatan *</Text>
          </View>

          {/* Horizontal Location Recommendations */}
          <Text style={styles.fieldSubLabel}>
            Pilih Rekomendasi Titik Kumpul (atau ketik langsung):
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.locationPresetsRow}
          >
            {locationPresets.map((loc) => {
              const isSelected =
                locationName.toLowerCase() === loc.name.toLowerCase();
              return (
                <TouchableOpacity
                  key={loc.id}
                  style={[
                    styles.locationPresetChip,
                    isSelected && styles.locationPresetChipActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleSelectLocationPreset(loc)}
                >
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={14}
                    color={
                      isSelected ? Colors.white : Colors.skyBlueHeader
                    }
                  />
                  <Text
                    style={[
                      styles.locationPresetChipText,
                      isSelected && styles.locationPresetChipTextActive,
                    ]}
                  >
                    {loc.name}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Manage / Edit Locations Button */}
            <TouchableOpacity
              style={styles.manageLocationChip}
              activeOpacity={0.85}
              onPress={() => setIsLocationSettingsVisible(true)}
            >
              <MaterialCommunityIcons
                name="cog-outline"
                size={14}
                color={Colors.onYellowContainer}
              />
              <Text style={styles.manageLocationChipText}>
                ⚙️ Kelola / Edit Pilihan
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Location Name Input */}
          <TextInput
            style={[styles.textInput, { marginTop: 8 }]}
            placeholder="Nama Tempat / Bangunan"
            placeholderTextColor={Colors.textNavyMuted}
            value={locationName}
            onChangeText={setLocationName}
          />

          {/* Location Address Input */}
          <TextInput
            style={[styles.textInput, { marginTop: 8 }]}
            placeholder="Alamat / Patokan Detail (Contoh: Jl. Mawar No. 12)"
            placeholderTextColor={Colors.textNavyMuted}
            value={locationAddress}
            onChangeText={setLocationAddress}
          />
        </View>

        {/* 4. SASARAN WILAYAH & PESERTA (REVISI BAGUS) */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Sasaran Wilayah & Peserta Kegiatan *</Text>
          <Text style={styles.fieldSubLabel}>
            Pilih sasaran cepat atau sesuaikan teks di bawah:
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.regionChipsRow}
          >
            {regionPresets.map((reg) => {
              const isSelected = targetRegion === reg;
              return (
                <TouchableOpacity
                  key={reg}
                  style={[
                    styles.regionChip,
                    isSelected && styles.regionChipActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setTargetRegion(reg)}
                >
                  <Text
                    style={[
                      styles.regionChipText,
                      isSelected && styles.regionChipTextActive,
                    ]}
                  >
                    {reg}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TextInput
            style={[styles.textInput, { marginTop: 8 }]}
            placeholder="Contoh: RT 03 / RW 05 (Khusus Kepala Keluarga)"
            placeholderTextColor={Colors.textNavyMuted}
            value={targetRegion}
            onChangeText={setTargetRegion}
          />
        </View>

        {/* 5. BATAS PARTISIPAN & KUOTA (REVISI BAGUS) */}
        <View style={styles.quotaSectionCard}>
          <View style={styles.quotaSectionHeader}>
            <View style={styles.quotaHeaderLeft}>
              <MaterialCommunityIcons
                name="account-group"
                size={22}
                color={Colors.skyBlueHeader}
              />
              <View>
                <Text style={styles.quotaSectionTitle}>Batas Partisipan / Kuota</Text>
                <Text style={styles.quotaSectionSub}>
                  Atur kapasitas maksimal warga yang dapat mendaftar
                </Text>
              </View>
            </View>

            {/* Toggle Tanpa Kuota vs Batas Kuota */}
            <TouchableOpacity
              style={[
                styles.quotaToggleBtn,
                hasQuotaLimit ? styles.quotaToggleBtnActive : styles.quotaToggleBtnUnlimited,
              ]}
              activeOpacity={0.8}
              onPress={() => setHasQuotaLimit(!hasQuotaLimit)}
            >
              <MaterialCommunityIcons
                name={hasQuotaLimit ? 'ticket-confirmation' : 'account-multiple-check'}
                size={16}
                color={hasQuotaLimit ? Colors.onYellowContainer : Colors.kesehatanGreen}
              />
              <Text
                style={[
                  styles.quotaToggleBtnText,
                  hasQuotaLimit
                    ? { color: Colors.onYellowContainer }
                    : { color: Colors.kesehatanGreen },
                ]}
              >
                {hasQuotaLimit ? 'Ada Kuota' : 'Tanpa Batas'}
              </Text>
            </TouchableOpacity>
          </View>

          {hasQuotaLimit && (
            <View style={styles.quotaConfigBox}>
              {/* Stepper + Direct input */}
              <View style={styles.quotaStepperRow}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => handleAdjustQuota(-10)}
                >
                  <Text style={styles.stepperButtonText}>-10</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => handleAdjustQuota(-5)}
                >
                  <Text style={styles.stepperButtonText}>-5</Text>
                </TouchableOpacity>

                <View style={styles.quotaValueDisplay}>
                  <Text style={styles.quotaValueNumber}>{quotaCount}</Text>
                  <Text style={styles.quotaValueLabel}>Orang / KK</Text>
                </View>

                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => handleAdjustQuota(5)}
                >
                  <Text style={styles.stepperButtonText}>+5</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => handleAdjustQuota(10)}
                >
                  <Text style={styles.stepperButtonText}>+10</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Quota Presets */}
              <View style={styles.quotaPresetsRow}>
                {quotaPresets.map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[
                      styles.quotaPresetChip,
                      quotaCount === q && styles.quotaPresetChipActive,
                    ]}
                    onPress={() => setQuotaCount(q)}
                  >
                    <Text
                      style={[
                        styles.quotaPresetChipText,
                        quotaCount === q && styles.quotaPresetChipTextActive,
                      ]}
                    >
                      {q} Org
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.quotaSummaryHint}>
                💡 Maksimal {quotaCount} warga dapat melakukan RSVP "Saya Hadir".
              </Text>
            </View>
          )}
        </View>

        {/* 6. UPLOAD POSTER BOX / PREVIEW */}
        {photoUri ? (
          <View style={styles.photoPreviewCard}>
            <Image source={{ uri: photoUri }} style={styles.photoPreviewThumbnail} />
            <View style={styles.photoPreviewInfo}>
              <View style={styles.photoSuccessBadge}>
                <MaterialCommunityIcons name="check-circle" size={14} color={Colors.kesehatanGreen} />
                <Text style={styles.photoSuccessText}>Poster Terpasang</Text>
              </View>
              <Text style={styles.photoPreviewNote}>Foto siap dipublikasikan</Text>
              <View style={styles.photoActionButtons}>
                <TouchableOpacity
                  style={styles.photoChangeButton}
                  onPress={() => setIsPhotoPickerVisible(true)}
                >
                  <Text style={styles.photoChangeButtonText}>Ganti Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.photoRemoveButton}
                  onPress={() => {
                    setPhotoUri(null);
                    showToast('Foto poster dihapus.');
                  }}
                >
                  <Text style={styles.photoRemoveButtonText}>Hapus</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadPosterBox}
            activeOpacity={0.8}
            onPress={() => setIsPhotoPickerVisible(true)}
          >
            <MaterialCommunityIcons
              name="camera-plus"
              size={28}
              color={Colors.skyBlueHeader}
            />
            <View style={styles.uploadPosterTextGroup}>
              <Text style={styles.uploadPosterTitle}>
                Unggah Foto / Poster Kegiatan
              </Text>
              <Text style={styles.uploadPosterSub}>
                Ambil dari kamera HP atau galeri foto
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={Colors.textNavyMuted}
            />
          </TouchableOpacity>
        )}

        {/* 7. SAVE BUTTON */}
        <TouchableOpacity
          style={styles.saveButton}
          activeOpacity={0.85}
          onPress={handleSave}
        >
          <MaterialCommunityIcons
            name="check"
            size={20}
            color={Colors.onYellowContainer}
          />
          <Text style={styles.saveButtonText}>
            {editId ? 'Simpan Perubahan Kegiatan' : 'Publikasikan Kegiatan'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 8. CATEGORY SELECTION MODAL */}
      <Modal
        visible={isCategoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCategoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsCategoryModalVisible(false)}
        >
          <View style={styles.categoryPickerModal}>
            <Text style={styles.pickerModalTitle}>Pilih Kategori Kegiatan</Text>
            {categories.map((catKey) => {
              const meta = CategoryMeta[catKey];
              const isSelected = selectedCategory === catKey;

              return (
                <TouchableOpacity
                  key={catKey}
                  style={[
                    styles.categoryPickerItem,
                    isSelected && { backgroundColor: meta.containerColor },
                  ]}
                  onPress={() => {
                    setSelectedCategory(catKey);
                    setIsCategoryModalVisible(false);
                  }}
                >
                  <View style={styles.categoryItemLeft}>
                    <MaterialCommunityIcons
                      name={meta.iconName as any}
                      size={20}
                      color={meta.badgeColor}
                    />
                    <Text
                      style={[
                        styles.categoryPickerText,
                        isSelected && {
                          color: meta.badgeColor,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {meta.displayName}
                    </Text>
                  </View>
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color={meta.badgeColor}
                    />
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setIsCategoryModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 9. DATE PICKER MODAL */}
      <DatePickerModal
        visible={isDatePickerVisible}
        initialDateIso={dateIso}
        onClose={() => setIsDatePickerVisible(false)}
        onSelectDate={(iso, formatted) => {
          setDateIso(iso);
          setFormattedDate(formatted);
        }}
      />

      {/* 10. TIME PICKER MODAL */}
      <TimePickerModal
        visible={isTimePickerVisible}
        initialTime={timeSlot}
        onClose={() => setIsTimePickerVisible(false)}
        onSelectTime={(selectedTime) => {
          setTimeSlot(selectedTime);
        }}
      />

      {/* 11. LOCATION PRESETS SETTINGS MODAL */}
      <LocationSettingsModal
        visible={isLocationSettingsVisible}
        onClose={() => setIsLocationSettingsVisible(false)}
        onSelectLocation={handleSelectLocationPreset}
      />

      {/* 12. PHOTO SOURCE PICKER MODAL */}
      <Modal
        visible={isPhotoPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPhotoPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.photoModalBackdrop}
          activeOpacity={1}
          onPress={() => setIsPhotoPickerVisible(false)}
        >
          <View style={styles.photoPickerSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.photoSheetTitle}>Pilih Sumber Foto Poster</Text>

            <TouchableOpacity
              style={styles.photoSourceOption}
              activeOpacity={0.8}
              onPress={handleTakePhoto}
            >
              <View style={[styles.sourceIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <MaterialCommunityIcons
                  name="camera"
                  size={24}
                  color={Colors.skyBlueHeader}
                />
              </View>
              <View style={styles.sourceOptionInfo}>
                <Text style={styles.sourceOptionTitle}>Ambil dari Kamera</Text>
                <Text style={styles.sourceOptionDesc}>Foto langsung poster fisik atau lokasi</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textNavyMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoSourceOption}
              activeOpacity={0.8}
              onPress={handlePickFromGallery}
            >
              <View style={[styles.sourceIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons
                  name="image-multiple"
                  size={24}
                  color={Colors.onYellowContainer}
                />
              </View>
              <View style={styles.sourceOptionInfo}>
                <Text style={styles.sourceOptionTitle}>Pilih dari Galeri HP</Text>
                <Text style={styles.sourceOptionDesc}>Pilih gambar dari album smartphone</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textNavyMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoCancelBtn}
              onPress={() => setIsPhotoPickerVisible(false)}
            >
              <Text style={styles.photoCancelBtnText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 13. WHATSAPP APPROVAL REQUEST MODAL */}
      <WhatsAppApprovalModal
        visible={waModalData.visible}
        title={title}
        itemType="KEGIATAN"
        targetName={waModalData.targetName}
        targetRole={waModalData.targetRole}
        targetPhone={waModalData.targetPhone}
        messageText={waModalData.messageText}
        onClose={() => {
          setWaModalData((prev) => ({ ...prev, visible: false }));
          navigation.goBack();
        }}
        onSuccessSent={() => {
          setWaModalData((prev) => ({ ...prev, visible: false }));
          navigation.goBack();
        }}
      />
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
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    elevation: 2,
  },
  topIconButton: {
    padding: 6,
    marginRight: 8,
  },
  topAppBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  fieldContainer: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  fieldSubLabel: {
    fontSize: 11,
    color: Colors.textNavyMuted,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: Colors.textNavyDark,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  dropdownSelector: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  categoryDisplayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textNavyDark,
  },
  customCategoryCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  customCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  customCategoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  customCategoryInput: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.textNavyDark,
    borderWidth: 1,
    borderColor: '#A5B4FC',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerSelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pickerSelectorInfo: {
    flex: 1,
  },
  pickerSelectorPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  pickerSelectorSubText: {
    fontSize: 10,
    color: Colors.textNavyMuted,
    marginTop: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationPresetsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  locationPresetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 5,
  },
  locationPresetChipActive: {
    backgroundColor: Colors.skyBlueHeader,
    borderColor: Colors.skyBlueHeader,
  },
  locationPresetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textNavyDark,
  },
  locationPresetChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  manageLocationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.yellowContainer,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  manageLocationChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  regionChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  regionChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  regionChipActive: {
    backgroundColor: Colors.skyBlueHeader,
    borderColor: Colors.skyBlueHeader,
  },
  regionChipText: {
    fontSize: 11,
    color: Colors.textNavyDark,
    fontWeight: '600',
  },
  regionChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  quotaSectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  quotaSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quotaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  quotaSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  quotaSectionSub: {
    fontSize: 10,
    color: Colors.textNavyMuted,
    marginTop: 1,
  },
  quotaToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  quotaToggleBtnActive: {
    backgroundColor: Colors.yellowContainer,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
  },
  quotaToggleBtnUnlimited: {
    backgroundColor: Colors.kesehatanGreenContainer,
  },
  quotaToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  quotaConfigBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  quotaStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  stepperButton: {
    backgroundColor: Colors.skyBlueSurfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  stepperButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  quotaValueDisplay: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  quotaValueNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textNavyDark,
  },
  quotaValueLabel: {
    fontSize: 10,
    color: Colors.textNavyMuted,
  },
  quotaPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 8,
  },
  quotaPresetChip: {
    backgroundColor: Colors.skyBlueBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  quotaPresetChipActive: {
    backgroundColor: Colors.yellowContainer,
    borderColor: Colors.yellowBorderLis,
  },
  quotaPresetChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textNavyDark,
  },
  quotaPresetChipTextActive: {
    color: Colors.onYellowContainer,
    fontWeight: '700',
  },
  quotaSummaryHint: {
    fontSize: 11,
    color: Colors.textNavySecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  photoPreviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  photoPreviewThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  photoPreviewInfo: {
    flex: 1,
  },
  photoSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.kesehatanGreen,
  },
  photoPreviewNote: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  photoActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  photoChangeButton: {
    backgroundColor: Colors.skyBlueSurfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  photoChangeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  photoRemoveButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  photoRemoveButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.urgentRed,
  },
  uploadPosterBox: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.skyBlueBorder,
    borderStyle: 'dashed',
    gap: 12,
  },
  uploadPosterTextGroup: {
    flex: 1,
  },
  uploadPosterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  uploadPosterSub: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: Colors.yellowHighlight,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    elevation: 2,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onYellowContainer,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  categoryPickerModal: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 360,
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textNavyDark,
    marginBottom: 12,
  },
  categoryPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryPickerText: {
    fontSize: 13,
    color: Colors.textNavyDark,
  },
  closeModalButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 8,
  },
  closeModalButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  photoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  photoPickerSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  photoSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textNavyDark,
    marginBottom: 14,
  },
  photoSourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 10,
    gap: 12,
  },
  sourceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceOptionInfo: {
    flex: 1,
  },
  sourceOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  sourceOptionDesc: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    marginTop: 2,
  },
  photoCancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  photoCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textNavyMuted,
  },
});
