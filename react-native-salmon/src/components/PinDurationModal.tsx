import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { PIN_DURATION_OPTIONS, PinDurationOption } from '../types';

interface PinDurationModalProps {
  visible: boolean;
  itemTitle?: string;
  onClose: () => void;
  onConfirm: (durationMs: number | null, durationLabel: string) => void;
}

export const PinDurationModal: React.FC<PinDurationModalProps> = ({
  visible,
  itemTitle,
  onClose,
  onConfirm,
}) => {
  const [selectedOption, setSelectedOption] = useState<PinDurationOption>(
    PIN_DURATION_OPTIONS[5] // Default: 1 Hari
  );

  const formatExpiryPreview = (ms: number | null): string => {
    if (!ms) return 'Sematan akan aktif terus sampai dilepas manual.';
    const expiryDate = new Date(Date.now() + ms);
    return `Berakhir pada: ${expiryDate.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })} WIB`;
  };

  const handleConfirm = () => {
    onConfirm(selectedOption.ms, selectedOption.label);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name="pin"
                    size={22}
                    color="#B45309"
                  />
                </View>
                <View style={styles.headerTextGroup}>
                  <Text style={styles.modalTitle}>Sematkan ke Posisi Teratas</Text>
                  <Text style={styles.modalSubtitle}>
                    Pilih batas durasi sematan sebelum otomatis terlepas
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <MaterialCommunityIcons
                    name="close"
                    size={20}
                    color={Colors.textNavyMuted}
                  />
                </TouchableOpacity>
              </View>

              {itemTitle && (
                <View style={styles.targetItemPreview}>
                  <Text style={styles.targetItemLabel}>Target:</Text>
                  <Text style={styles.targetItemText} numberOfLines={1}>
                    {itemTitle}
                  </Text>
                </View>
              )}

              {/* Duration Chips Grid */}
              <Text style={styles.sectionLabel}>PILIH DURASI WAKTU</Text>
              <View style={styles.chipGrid}>
                {PIN_DURATION_OPTIONS.map((opt) => {
                  const isSelected = selectedOption.label === opt.label;
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setSelectedOption(opt)}
                    >
                      <MaterialCommunityIcons
                        name={
                          opt.ms === null
                            ? 'infinity'
                            : opt.label.includes('Menit')
                            ? 'timer-outline'
                            : opt.label.includes('Jam')
                            ? 'clock-outline'
                            : 'calendar-clock'
                        }
                        size={14}
                        color={isSelected ? '#B45309' : Colors.skyBlueHeader}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Expiry Preview Banner */}
              <View style={styles.previewBanner}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={16}
                  color="#92400E"
                />
                <Text style={styles.previewBannerText}>
                  {formatExpiryPreview(selectedOption.ms)}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleConfirm}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="pin"
                    size={16}
                    color={Colors.onYellowContainer}
                  />
                  <Text style={styles.confirmBtnText}>
                    Sematkan ({selectedOption.label})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textNavyDark,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.textNavySecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  targetItemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skyBlueBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 14,
    gap: 6,
  },
  targetItemLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  targetItemText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textNavyDark,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textNavyMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  chipSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textNavyDark,
  },
  chipTextSelected: {
    color: '#92400E',
    fontWeight: '800',
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  previewBannerText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavySecondary,
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.yellowHighlight,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.onYellowContainer,
  },
});
