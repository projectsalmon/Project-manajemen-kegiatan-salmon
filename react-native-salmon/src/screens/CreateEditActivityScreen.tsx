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
import { CategoryMeta, Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { ActivityCategoryType } from '../types';

interface CreateEditActivityScreenProps {
  route: any;
  navigation: any;
}

export const CreateEditActivityScreen: React.FC<CreateEditActivityScreenProps> = ({
  route,
  navigation,
}) => {
  const { editId, initialCategory } = route.params || {};
  const { activities, addActivity, updateActivity, showToast } = useApp();

  const existing = activities.find((a) => a.id === editId);

  const [title, setTitle] = useState(existing?.title || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategoryType>(
    existing?.category || initialCategory || 'KERJA_BAKTI'
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
    existing?.locationAddress || 'Jl. Mawar No. 10'
  );
  const [targetRegion, setTargetRegion] = useState(
    existing?.targetRegion || 'RT 03 / RW 05'
  );
  const [quotaInput, setQuotaInput] = useState(
    existing?.quota?.toString() || '50'
  );

  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
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
  ];

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

    const quota = quotaInput ? parseInt(quotaInput, 10) : null;

    if (editId && existing) {
      updateActivity(editId, {
        title,
        description,
        category: selectedCategory,
        dateIso,
        formattedDate,
        timeSlot,
        locationName,
        locationAddress,
        targetRegion,
        quota,
        imageUrl: photoUri,
      });
    } else {
      addActivity({
        title,
        description,
        category: selectedCategory,
        dateIso,
        formattedDate,
        timeSlot,
        locationName,
        locationAddress,
        targetRegion,
        quota,
        imageUrl: photoUri,
      });
    }

    navigation.goBack();
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
        {/* Title */}
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

        {/* Category Dropdown Selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Kategori Kegiatan *</Text>
          <TouchableOpacity
            style={styles.dropdownSelector}
            activeOpacity={0.8}
            onPress={() => setIsCategoryModalVisible(true)}
          >
            <Text style={styles.dropdownSelectorText}>
              {CategoryMeta[selectedCategory].displayName}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={22}
              color={Colors.skyBlueHeader}
            />
          </TouchableOpacity>
        </View>

        {/* Description */}
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

        {/* Date & Time Row */}
        <View style={styles.formRow}>
          <View style={[styles.fieldContainer, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Tanggal *</Text>
            <TextInput
              style={styles.textInput}
              value={formattedDate}
              onChangeText={setFormattedDate}
            />
          </View>

          <View style={[styles.fieldContainer, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Waktu Jam *</Text>
            <TextInput
              style={styles.textInput}
              value={timeSlot}
              onChangeText={setTimeSlot}
            />
          </View>
        </View>

        {/* Location Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Nama Tempat / Lokasi *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Contoh: Lapangan Bulutangkis RT 03"
            placeholderTextColor={Colors.textNavyMuted}
            value={locationName}
            onChangeText={setLocationName}
          />
        </View>

        {/* Address */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Alamat / Patokan Detail</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Jl. Mawar No. 12 (Depan Pos Ronda)"
            placeholderTextColor={Colors.textNavyMuted}
            value={locationAddress}
            onChangeText={setLocationAddress}
          />
        </View>

        {/* Target Region & Quota Row */}
        <View style={styles.formRow}>
          <View style={[styles.fieldContainer, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Sasaran Wilayah</Text>
            <TextInput
              style={styles.textInput}
              value={targetRegion}
              onChangeText={setTargetRegion}
            />
          </View>

          <View style={[styles.fieldContainer, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Batas Kuota</Text>
            <TextInput
              style={styles.textInput}
              value={quotaInput}
              onChangeText={setQuotaInput}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Upload Poster Box / Preview */}
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

        {/* Save Button */}
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

      {/* 3. CATEGORY SELECTION MODAL */}
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
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 4. PHOTO PICKER SHEET MODAL (CAMERA / GALLERY) */}
      <Modal
        visible={isPhotoPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPhotoPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalBackdrop}
          activeOpacity={1}
          onPress={() => setIsPhotoPickerVisible(false)}
        >
          <View style={styles.pickerSheetContainer}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Pilih Foto Poster Kegiatan</Text>
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
                  Foto langsung poster atau objek kegiatan
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
                  Pilih file gambar poster dari galeri smartphone
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
              onPress={() => setIsPhotoPickerVisible(false)}
            >
              <Text style={styles.pickerCancelText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  fieldContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
    marginBottom: 4,
  },
  textInput: {
    fontSize: 14,
    color: Colors.textNavyDark,
    paddingVertical: 4,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dropdownSelectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textNavyDark,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadPosterBox: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.yellowBorderLis,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    marginTop: 4,
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
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  categoryPickerModal: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    elevation: 6,
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textNavyDark,
    marginBottom: 12,
  },
  categoryPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 2,
  },
  categoryPickerText: {
    fontSize: 14,
    color: Colors.textNavyDark,
    fontWeight: '500',
  },
  photoPreviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.yellowBorderLis,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  photoPreviewThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.skyBlueSurfaceVariant,
  },
  photoPreviewInfo: {
    flex: 1,
  },
  photoSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  photoSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.kesehatanGreen,
  },
  photoPreviewNote: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    marginBottom: 8,
  },
  photoActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoChangeButton: {
    backgroundColor: Colors.yellowContainer,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  photoChangeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  photoRemoveButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: Colors.urgentRed,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  photoRemoveButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.urgentRed,
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
});
