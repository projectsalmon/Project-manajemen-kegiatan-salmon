import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  const [hasUploadedPhoto, setHasUploadedPhoto] = useState(
    Boolean(existing?.imageUrl)
  );

  const categories: ActivityCategoryType[] = [
    'POSYANDU',
    'KERJA_BAKTI',
    'RAPAT',
    'KESEHATAN',
    'SOSIAL',
    'OLAH_RAGA',
  ];

  const handleSave = () => {
    if (!title.trim() || !description.trim()) {
      showToast('Mohon lengkapi judul dan deskripsi kegiatan!');
      return;
    }

    const quota = quotaInput ? parseInt(quotaInput, 10) : null;
    const sampleImageUrl = hasUploadedPhoto
      ? 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=800'
      : null;

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
        imageUrl: sampleImageUrl,
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
        imageUrl: sampleImageUrl,
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

        {/* Upload Poster Box */}
        <TouchableOpacity
          style={[
            styles.uploadPosterBox,
            hasUploadedPhoto && { borderColor: Colors.kesehatanGreen },
          ]}
          activeOpacity={0.8}
          onPress={() => {
            setHasUploadedPhoto(!hasUploadedPhoto);
            showToast(
              hasUploadedPhoto
                ? 'Foto poster dihapus.'
                : 'Foto poster kegiatan terpasang!'
            );
          }}
        >
          <MaterialCommunityIcons
            name={hasUploadedPhoto ? 'check-circle' : 'image-plus'}
            size={28}
            color={
              hasUploadedPhoto ? Colors.kesehatanGreen : Colors.skyBlueHeader
            }
          />
          <View style={styles.uploadPosterTextGroup}>
            <Text style={styles.uploadPosterTitle}>
              {hasUploadedPhoto
                ? 'Foto Poster Terpasang (Klik untuk ubah)'
                : 'Unggah Foto / Poster Kegiatan'}
            </Text>
            <Text style={styles.uploadPosterSub}>Format JPG, PNG (Maks 5MB)</Text>
          </View>
        </TouchableOpacity>

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
                      isSelected && { color: meta.badgeColor, fontWeight: '700' },
                    ]}
                  >
                    {meta.displayName}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check"
                      size={18}
                      color={meta.badgeColor}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
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
});
