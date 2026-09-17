import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { ActivityItem, ActivityReport } from '../types';

interface PostActivityReportModalProps {
  visible: boolean;
  onClose: () => void;
  activity: ActivityItem;
  onSubmit: (reportData: {
    notes: string;
    actualAttendeesCount: number;
    budgetIncome?: number | null;
    budgetSpent?: number | null;
    budgetNotes?: string | null;
    photoUrls: string[];
  }) => Promise<void>;
}

export const PostActivityReportModal: React.FC<PostActivityReportModalProps> = ({
  visible,
  onClose,
  activity,
  onSubmit,
}) => {
  const existingReport = activity.report;

  const [notes, setNotes] = useState('');
  const [actualAttendees, setActualAttendees] = useState('');
  const [budgetIncome, setBudgetIncome] = useState('');
  const [budgetSpent, setBudgetSpent] = useState('');
  const [budgetNotes, setBudgetNotes] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [customPhotoInput, setCustomPhotoInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (existingReport) {
        setNotes(existingReport.notes || '');
        setActualAttendees(String(existingReport.actualAttendeesCount || activity.confirmedCount || 0));
        setBudgetIncome(existingReport.budgetIncome ? String(existingReport.budgetIncome) : '');
        setBudgetSpent(existingReport.budgetSpent ? String(existingReport.budgetSpent) : '');
        setBudgetNotes(existingReport.budgetNotes || '');
        setSelectedPhotos(existingReport.photoUrls || []);
      } else {
        setNotes('');
        setActualAttendees(String(activity.confirmedCount || 0));
        setBudgetIncome('');
        setBudgetSpent('');
        setBudgetNotes('');
        setSelectedPhotos(activity.photos ? activity.photos.slice(0, 4) : []);
      }
    }
  }, [visible, existingReport, activity]);

  const toggleSelectExistingPhoto = (url: string) => {
    if (selectedPhotos.includes(url)) {
      setSelectedPhotos(selectedPhotos.filter((p) => p !== url));
    } else {
      if (selectedPhotos.length >= 6) {
        Alert.alert('Batas Foto', 'Maksimal 6 foto dokumentasi untuk laporan.');
        return;
      }
      setSelectedPhotos([...selectedPhotos, url]);
    }
  };

  const handleAddCustomPhoto = () => {
    if (!customPhotoInput.trim()) return;
    if (selectedPhotos.length >= 6) {
      Alert.alert('Batas Foto', 'Maksimal 6 foto dokumentasi untuk laporan.');
      return;
    }
    setSelectedPhotos([...selectedPhotos, customPhotoInput.trim()]);
    setCustomPhotoInput('');
  };

  const handleSubmit = async () => {
    if (!notes.trim()) {
      Alert.alert('Perhatian', 'Mohon isi notulensi / catatan hasil kegiatan.');
      return;
    }

    const attendeesNum = parseInt(actualAttendees, 10);
    if (isNaN(attendeesNum) || attendeesNum < 0) {
      Alert.alert('Perhatian', 'Jumlah kehadiran riil warga harus berupa angka yang valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        notes: notes.trim(),
        actualAttendeesCount: attendeesNum,
        budgetIncome: budgetIncome ? parseInt(budgetIncome, 10) || null : null,
        budgetSpent: budgetSpent ? parseInt(budgetSpent, 10) || null : null,
        budgetNotes: budgetNotes.trim() || null,
        photoUrls: selectedPhotos,
      });
      onClose();
    } catch (e) {
      console.warn('Gagal submit report:', e);
      Alert.alert('Kesalahan', 'Gagal menyimpan laporan berita acara. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availablePhotos = Array.from(new Set([...(activity.photos || []), ...selectedPhotos]));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="file-document-edit" size={22} color="#FF6B6B" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Berita Acara & LPJ Kegiatan</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {activity.title}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Info Box */}
            <View style={styles.infoBanner}>
              <MaterialCommunityIcons name="information" size={18} color="#0066F6" />
              <Text style={styles.infoBannerText}>
                Laporan ini berfungsi sebagai arsip resmi pertanggungjawaban (LPJ) dari RT/RW ke Kelurahan dan Kecamatan.
              </Text>
            </View>

            {/* Field: Notulensi & Poin Keputusan / Hasil */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>
                Notulensi / Hasil Keputusan & Capaian <Text style={styles.requiredMark}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Contoh: Terlaksana pembersihan selokan sepanjang 200m di RT 03. Disepakati iuran ronda malam sebesar Rp 20.000/bulan per KK..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
                textAlignVertical="top"
              />
            </View>

            {/* Field: Kehadiran Riil */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>
                Kehadiran Riil Warga (Orang) <Text style={styles.requiredMark}>*</Text>
              </Text>
              <View style={styles.attendeesRow}>
                <TextInput
                  style={[styles.textInput, styles.numberInput]}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={actualAttendees}
                  onChangeText={setActualAttendees}
                />
                <Text style={styles.attendeesHint}>
                  Target Awal RSVP: <Text style={styles.boldText}>{activity.confirmedCount} Warga</Text>
                </Text>
              </View>
            </View>

            {/* Section: Anggaran / Kas (Opsional) */}
            <View style={styles.sectionDividerRow}>
              <Text style={styles.sectionDividerTitle}>Akuntabilitas Anggaran / Kas (Opsional)</Text>
            </View>

            <View style={styles.budgetRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.inputSubLabel}>Total Pemasukan (Rp)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={budgetIncome}
                  onChangeText={setBudgetIncome}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.inputSubLabel}>Total Pengeluaran (Rp)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={budgetSpent}
                  onChangeText={setBudgetSpent}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputSubLabel}>Catatan Anggaran / Sumber Dana</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Kas RT 03 + Iuran sukarela konsumsi warga"
                placeholderTextColor="#94A3B8"
                value={budgetNotes}
                onChangeText={setBudgetNotes}
              />
            </View>

            {/* Section: Foto Dokumentasi */}
            <View style={styles.sectionDividerRow}>
              <Text style={styles.sectionDividerTitle}>
                Lampiran Foto Dokumentasi ({selectedPhotos.length}/6)
              </Text>
            </View>
            <Text style={styles.photoHintText}>
              Pilih foto yang telah diunggah di galeri kegiatan atau tambahkan URL foto baru untuk dilampirkan pada lembar berita acara.
            </Text>

            {availablePhotos.length > 0 && (
              <View style={styles.photoGrid}>
                {availablePhotos.map((url, idx) => {
                  const isSelected = selectedPhotos.includes(url);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.photoCard, isSelected && styles.photoCardSelected]}
                      activeOpacity={0.8}
                      onPress={() => toggleSelectExistingPhoto(url)}
                    >
                      <Image source={{ uri: url }} style={styles.thumbnailImg} />
                      <View style={[styles.checkboxBadge, isSelected && styles.checkboxBadgeActive]}>
                        <MaterialCommunityIcons
                          name={isSelected ? 'check' : 'plus'}
                          size={14}
                          color={Colors.white}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Input URL foto manual jika ada */}
            <View style={styles.customPhotoRow}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Tempel URL foto (https://...)"
                placeholderTextColor="#94A3B8"
                value={customPhotoInput}
                onChangeText={setCustomPhotoInput}
              />
              <TouchableOpacity style={styles.addPhotoBtn} onPress={handleAddCustomPhoto}>
                <MaterialCommunityIcons name="plus" size={18} color={Colors.white} />
                <Text style={styles.addPhotoBtnText}>Tambah</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <MaterialCommunityIcons name="check-decagram" size={18} color={Colors.white} />
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan & Sahkan Berita Acara'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 27, 56, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    display: 'flex',
  },
  modalHeader: {
    backgroundColor: '#081B38',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    maxWidth: 240,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12.5,
    color: '#1E40AF',
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  inputSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  requiredMark: {
    color: '#EF4444',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 90,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  numberInput: {
    width: 100,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  attendeesHint: {
    fontSize: 13,
    color: '#64748B',
  },
  boldText: {
    fontWeight: '700',
    color: '#081B38',
  },
  sectionDividerRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
    marginTop: 6,
    marginBottom: 10,
  },
  sectionDividerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#081B38',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  budgetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoHintText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  photoCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  photoCardSelected: {
    borderColor: '#FF6B6B',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  checkboxBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBadgeActive: {
    backgroundColor: '#FF6B6B',
  },
  customPhotoRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addPhotoBtn: {
    backgroundColor: '#081B38',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addPhotoBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FAFCFF',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  submitBtn: {
    flex: 2,
    backgroundColor: '#081B38',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});
