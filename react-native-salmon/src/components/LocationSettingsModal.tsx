import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { LocationPresetItem } from '../types';

interface LocationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation?: (location: LocationPresetItem) => void;
}

export const LocationSettingsModal: React.FC<LocationSettingsModalProps> = ({
  visible,
  onClose,
  onSelectLocation,
}) => {
  const {
    locationPresets,
    addLocationPreset,
    updateLocationPreset,
    deleteLocationPreset,
    showToast,
  } = useApp();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setFormName('');
    setFormAddress('');
    setIsAddingNew(false);
  };

  const handleStartAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormAddress('');
    setIsAddingNew(true);
  };

  const handleStartEdit = (loc: LocationPresetItem) => {
    setEditingId(loc.id);
    setFormName(loc.name);
    setFormAddress(loc.address);
    setIsAddingNew(true);
  };

  const handleSaveForm = () => {
    if (!formName.trim() || !formAddress.trim()) {
      showToast('Mohon isi nama tempat dan alamat detail!');
      return;
    }

    if (editingId) {
      updateLocationPreset(editingId, formName, formAddress);
    } else {
      addLocationPreset(formName, formAddress);
    }
    resetForm();
  };

  const handleDelete = (loc: LocationPresetItem) => {
    Alert.alert(
      'Hapus Rekomendasi Lokasi',
      `Apakah Anda yakin ingin menghapus '${loc.name}' dari daftar rekomendasi tempat?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            deleteLocationPreset(loc.id);
            if (editingId === loc.id) resetForm();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        resetForm();
        onClose();
      }}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => {
          resetForm();
          onClose();
        }}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => {}}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleGroup}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons
                  name="map-marker-radius"
                  size={22}
                  color={Colors.skyBlueHeader}
                />
              </View>
              <View>
                <Text style={styles.modalTitle}>Kelola Rekomendasi Tempat</Text>
                <Text style={styles.modalSubtitle}>
                  Atur daftar titik kumpul & lokasi kegiatan RT / RW
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeIconButton}
              onPress={() => {
                resetForm();
                onClose();
              }}
            >
              <MaterialCommunityIcons name="close" size={22} color={Colors.textNavyDark} />
            </TouchableOpacity>
          </View>

          {/* Form Add / Edit */}
          {isAddingNew ? (
            <View style={styles.formCard}>
              <View style={styles.formHeaderRow}>
                <Text style={styles.formTitle}>
                  {editingId ? 'Edit Lokasi Titik Kumpul' : 'Tambah Rekomendasi Tempat Baru'}
                </Text>
                <TouchableOpacity onPress={resetForm}>
                  <Text style={styles.formCancelText}>Batal</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Nama Tempat / Titik Kumpul *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Contoh: Balai RT 03, Masjid Al-Ikhlas"
                placeholderTextColor={Colors.textNavyMuted}
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.inputLabel}>Alamat / Patokan Detail *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Contoh: Jl. Mawar No. 12, samping pos ronda"
                placeholderTextColor={Colors.textNavyMuted}
                value={formAddress}
                onChangeText={setFormAddress}
              />

              <TouchableOpacity
                style={styles.saveFormBtn}
                activeOpacity={0.85}
                onPress={handleSaveForm}
              >
                <MaterialCommunityIcons
                  name="content-save"
                  size={18}
                  color={Colors.onYellowContainer}
                />
                <Text style={styles.saveFormBtnText}>
                  {editingId ? 'Simpan Perubahan Lokasi' : 'Tambahkan ke Daftar'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addNewTriggerBtn}
              activeOpacity={0.8}
              onPress={handleStartAdd}
            >
              <MaterialCommunityIcons
                name="plus-circle"
                size={20}
                color={Colors.skyBlueHeader}
              />
              <Text style={styles.addNewTriggerText}>
                + Tambah Lokasi Rekomendasi Baru
              </Text>
            </TouchableOpacity>
          )}

          {/* Location List */}
          <Text style={styles.listSectionTitle}>
            Daftar Tempat Tersimpan ({locationPresets.length})
          </Text>

          <ScrollView
            style={styles.locationScroll}
            contentContainerStyle={styles.locationScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {locationPresets.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="map-marker-off"
                  size={36}
                  color={Colors.textNavyMuted}
                />
                <Text style={styles.emptyText}>Belum ada rekomendasi tempat.</Text>
              </View>
            ) : (
              locationPresets.map((loc) => (
                <View key={loc.id} style={styles.locationItemCard}>
                  <TouchableOpacity
                    style={styles.locationItemMain}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (onSelectLocation) {
                        onSelectLocation(loc);
                        onClose();
                      }
                    }}
                  >
                    <View style={styles.locationPinCircle}>
                      <MaterialCommunityIcons
                        name="map-marker"
                        size={18}
                        color={Colors.skyBlueHeader}
                      />
                    </View>
                    <View style={styles.locationItemInfo}>
                      <Text style={styles.locationItemName}>{loc.name}</Text>
                      <Text style={styles.locationItemAddress} numberOfLines={2}>
                        {loc.address}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.locationActionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtnEdit}
                      onPress={() => handleStartEdit(loc)}
                    >
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={18}
                        color={Colors.skyBlueHeader}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnDelete}
                      onPress={() => handleDelete(loc)}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={18}
                        color={Colors.urgentRed}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer Close Button */}
          <TouchableOpacity
            style={styles.closeFooterBtn}
            onPress={() => {
              resetForm();
              onClose();
            }}
          >
            <Text style={styles.closeFooterBtnText}>Selesai & Tutup</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.skyBlueSurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textNavyDark,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    marginTop: 1,
  },
  closeIconButton: {
    padding: 6,
  },
  addNewTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.skyBlueSurfaceVariant,
    borderRadius: 14,
    paddingVertical: 11,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.skyBlueBorder,
    marginBottom: 12,
  },
  addNewTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  formCard: {
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.skyBlueBorder,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.skyBlueHeader,
  },
  formCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.urgentRed,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textNavyDark,
    marginBottom: 4,
    marginTop: 6,
  },
  inputField: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: Colors.textNavyDark,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  saveFormBtn: {
    backgroundColor: Colors.yellowHighlight,
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  saveFormBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  listSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textNavyDark,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationScroll: {
    maxHeight: 250,
  },
  locationScrollContent: {
    gap: 8,
    paddingBottom: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textNavyMuted,
  },
  locationItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  locationItemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationPinCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationItemInfo: {
    flex: 1,
  },
  locationItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  locationItemAddress: {
    fontSize: 11,
    color: Colors.textNavySecondary,
    marginTop: 1,
  },
  locationActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 6,
  },
  actionBtnEdit: {
    padding: 6,
    backgroundColor: Colors.white,
    borderRadius: 8,
  },
  actionBtnDelete: {
    padding: 6,
    backgroundColor: Colors.white,
    borderRadius: 8,
  },
  closeFooterBtn: {
    backgroundColor: Colors.skyBlueHeader,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  closeFooterBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});
