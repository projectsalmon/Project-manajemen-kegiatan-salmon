import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AnnouncementCard } from '../components/AnnouncementCard';
import { DatePickerModal } from '../components/DatePickerModal';
import { TimePickerModal } from '../components/TimePickerModal';
import { WhatsAppApprovalModal } from '../components/WhatsAppApprovalModal';
import { Colors, FontFamily, UrgencyMeta } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { AnnouncementItem, AnnouncementUrgencyType } from '../types';
import { buildAnnouncementApprovalMessage } from '../utils/whatsappHelpers';

export const AnnouncementListScreen: React.FC = () => {
  const {
    currentUser,
    contacts,
    announcements,
    addAnnouncement,
    updateAnnouncement,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUrgency, setSelectedUrgency] =
    useState<AnnouncementUrgencyType | null>(null);

  // Dialog & Modal State
  const [selectedForDetail, setSelectedForDetail] =
    useState<AnnouncementItem | null>(null);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<AnnouncementItem | null>(null);

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

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formUrgency, setFormUrgency] = useState<AnnouncementUrgencyType>('INFO');
  const [formTargetRegion, setFormTargetRegion] = useState('RW 05 Sukamaju');
  const [formRequirements, setFormRequirements] = useState('');
  const [formAdditionalInfo, setFormAdditionalInfo] = useState('');

  // Date & Time Picker states for Announcement
  const [formDate, setFormDate] = useState('Minggu, 18 Mei 2025');
  const [formDateIso, setFormDateIso] = useState('2025-05-18');
  const [formTime, setFormTime] = useState('08:00 - 11:00 WIB');
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  const isAdmin = currentUser.role !== 'WARGA';
  const urgencies: AnnouncementUrgencyType[] = [
    'PENTING',
    'INFO',
    'IMBAUAN',
    'DARURAT',
  ];

  const filteredAnnouncements = announcements.filter((ann) => {
    const matchesApproval =
      currentUser.role === 'WARGA' ? ann.approvalStatus === 'PUBLISHED' : true;

    const matchesQuery =
      searchQuery.trim() === '' ||
      ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUrgency =
      selectedUrgency === null || ann.urgency === selectedUrgency;

    return matchesApproval && matchesQuery && matchesUrgency;
  });

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setFormTitle('');
    setFormContent('');
    setFormUrgency('INFO');
    setFormTargetRegion('RW 05 Sukamaju');
    setFormRequirements('');
    setFormAdditionalInfo('');
    setFormDate('Minggu, 18 Mei 2025');
    setFormDateIso('2025-05-18');
    setFormTime('08:00 - 11:00 WIB');
    setIsFormModalVisible(true);
  };

  const handleOpenEdit = (ann: AnnouncementItem) => {
    setEditingAnnouncement(ann);
    setFormTitle(ann.title);
    setFormContent(ann.content);
    setFormUrgency(ann.urgency);
    setFormTargetRegion(ann.targetRegion);
    setFormRequirements(ann.requirements ? ann.requirements.join(', ') : '');
    setFormAdditionalInfo(ann.additionalInfo || '');
    setFormDate(ann.formattedDate || 'Minggu, 18 Mei 2025');
    setFormDateIso('2025-05-18');
    setFormTime('08:00 - 11:00 WIB');
    setSelectedForDetail(null);
    setIsFormModalVisible(true);
  };

  const handleSaveForm = () => {
    if (!formTitle.trim() || !formContent.trim()) {
      showToast('Mohon lengkapi judul dan isi pengumuman!');
      return;
    }

    const reqList = formRequirements
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const finalFormattedDate = `${formDate}${formTime ? ` • ${formTime}` : ''}`;

    const isWaitingApproval = currentUser.role === 'RT' || currentUser.role === 'RW';

    const tempAnnouncement: AnnouncementItem = {
      id: editingAnnouncement?.id || `ANN-${Date.now() % 1000}`,
      title: formTitle.trim(),
      content: formContent.trim(),
      urgency: formUrgency,
      targetRegion: formTargetRegion.trim(),
      formattedDate: finalFormattedDate,
      authorRole: currentUser.role,
      authorName: currentUser.name,
      requirements: reqList,
      additionalInfo: formAdditionalInfo ? formAdditionalInfo.trim() : null,
      approvalStatus:
        currentUser.role === 'RT'
          ? 'WAITING_RW_APPROVAL'
          : currentUser.role === 'RW'
          ? 'WAITING_ADMIN_APPROVAL'
          : 'PUBLISHED',
      isPinned: false,
    };

    if (editingAnnouncement) {
      updateAnnouncement(editingAnnouncement.id, {
        title: formTitle.trim(),
        content: formContent.trim(),
        urgency: formUrgency,
        targetRegion: formTargetRegion.trim(),
        requirements: reqList,
        additionalInfo: formAdditionalInfo ? formAdditionalInfo.trim() : null,
        formattedDate: finalFormattedDate,
      });
    } else {
      addAnnouncement({
        title: formTitle.trim(),
        content: formContent.trim(),
        urgency: formUrgency,
        targetRegion: formTargetRegion.trim(),
        requirements: reqList,
        additionalInfo: formAdditionalInfo ? formAdditionalInfo.trim() : null,
        formattedDate: finalFormattedDate,
      });
    }

    setIsFormModalVisible(false);

    if (isWaitingApproval) {
      const waInfo = buildAnnouncementApprovalMessage(
        tempAnnouncement,
        currentUser,
        contacts
      );
      setWaModalData({
        visible: true,
        targetName: waInfo.targetName,
        targetRole: waInfo.targetRole,
        targetPhone: waInfo.targetPhone,
        messageText: waInfo.message,
      });
    }
  };

  const handleShareDetail = async (ann: AnnouncementItem) => {
    try {
      const reqText =
        ann.requirements && ann.requirements.length > 0
          ? `\n📋 Persyaratan: ${ann.requirements.join(', ')}`
          : '';
      const shareMessage =
        `📢 *${ann.title}*\n` +
        `🗓️ ${ann.formattedDate} • ${ann.targetRegion}\n\n` +
        `${ann.content}${reqText}\n\n` +
        `Diterbitkan oleh: ${ann.authorName} (${ann.authorRole})`;

      await Share.share({
        title: ann.title,
        message: shareMessage,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. SEARCH INPUT */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={Colors.skyBlueHeader}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari judul atau isi pengumuman..."
            placeholderTextColor={Colors.textNavyMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={Colors.textNavyMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. URGENCY FILTER CHIPS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterChipRow}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            selectedUrgency === null && styles.chipActive,
          ]}
          onPress={() => setSelectedUrgency(null)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.chipText,
              selectedUrgency === null && styles.chipTextActive,
            ]}
          >
            Semua
          </Text>
        </TouchableOpacity>

        {urgencies.map((uKey) => {
          const meta = UrgencyMeta[uKey];
          const isSelected = selectedUrgency === uKey;

          return (
            <TouchableOpacity
              key={uKey}
              style={[
                styles.chip,
                { backgroundColor: isSelected ? meta.containerColor : Colors.white },
                isSelected && { borderColor: meta.badgeColor, borderWidth: 1.5 },
              ]}
              onPress={() => setSelectedUrgency(isSelected ? null : uKey)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? meta.badgeColor : Colors.textNavyDark },
                ]}
              >
                {meta.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.divider} />

      {/* 3. ANNOUNCEMENTS LIST */}
      <FlatList
        data={filteredAnnouncements}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <AnnouncementCard
            announcement={item}
            onClick={() => setSelectedForDetail(item)}
            onEditClick={isAdmin ? () => handleOpenEdit(item) : undefined}
          />
        )}
      />

      {/* 4. FAB FOR ADMIN */}
      {isAdmin && (
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.85}
          onPress={handleOpenCreate}
        >
          <MaterialCommunityIcons
            name="bullhorn"
            size={20}
            color={Colors.onYellowContainer}
          />
          <Text style={styles.fabText}>Buat Pengumuman</Text>
        </TouchableOpacity>
      )}

      {/* 5. ANNOUNCEMENT DETAIL MODAL */}
      {selectedForDetail && (
        <Modal
          visible={selectedForDetail !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedForDetail(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.detailModalContainer}>
              <View style={styles.detailModalHeader}>
                <View
                  style={[
                    styles.detailUrgencyBadge,
                    {
                      backgroundColor:
                        UrgencyMeta[selectedForDetail.urgency].containerColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailUrgencyText,
                      {
                        color: UrgencyMeta[selectedForDetail.urgency].badgeColor,
                      },
                    ]}
                  >
                    {UrgencyMeta[selectedForDetail.urgency].label}
                  </Text>
                </View>
                <Text style={styles.detailDateText}>
                  {selectedForDetail.formattedDate}
                </Text>
              </View>

              <ScrollView style={styles.detailModalScroll}>
                <Text style={styles.detailModalTitle}>
                  {selectedForDetail.title}
                </Text>
                <Text style={styles.detailModalContent}>
                  {selectedForDetail.content}
                </Text>

                {selectedForDetail.requirements &&
                  selectedForDetail.requirements.length > 0 && (
                    <View style={styles.detailRequirementsSection}>
                      <Text style={styles.detailReqSectionTitle}>
                        Persyaratan & Dokumen Wajib:
                      </Text>
                      {selectedForDetail.requirements.map((req, idx) => (
                        <View key={idx} style={styles.detailReqItem}>
                          <MaterialCommunityIcons
                            name="checkbox-marked-circle"
                            size={16}
                            color={Colors.yellowAccent}
                          />
                          <Text style={styles.detailReqText}>{req}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                {selectedForDetail.additionalInfo && (
                  <Text style={styles.detailAdditionalText}>
                    Catatan Tambahan: {selectedForDetail.additionalInfo}
                  </Text>
                )}

                <Text style={styles.detailAuthorText}>
                  Diterbitkan oleh: {selectedForDetail.authorName} (
                  {selectedForDetail.authorRole})
                </Text>

                {/* WhatsApp Approval Banner for unapproved announcement */}
                {selectedForDetail.approvalStatus !== 'PUBLISHED' && (
                  <View style={styles.detailApprovalWaBanner}>
                    <View style={styles.detailApprovalWaHeader}>
                      <MaterialCommunityIcons
                        name="clock-alert-outline"
                        size={18}
                        color={Colors.yellowAccent}
                      />
                      <Text style={styles.detailApprovalWaTitle}>
                        {selectedForDetail.approvalStatus === 'WAITING_RW_APPROVAL'
                          ? 'Menunggu Persetujuan Ketua RW'
                          : 'Menunggu Persetujuan Kelurahan'}
                      </Text>
                    </View>
                    <Text style={styles.detailApprovalWaSub}>
                      Pengumuman ini belum tampil di beranda warga sebelum disetujui.
                    </Text>
                    <TouchableOpacity
                      style={styles.detailRequestWaBtn}
                      activeOpacity={0.85}
                      onPress={() => {
                        const waInfo = buildAnnouncementApprovalMessage(
                          selectedForDetail,
                          currentUser,
                          contacts
                        );
                        setWaModalData({
                          visible: true,
                          targetName: waInfo.targetName,
                          targetRole: waInfo.targetRole,
                          targetPhone: waInfo.targetPhone,
                          messageText: waInfo.message,
                        });
                      }}
                    >
                      <MaterialCommunityIcons
                        name="whatsapp"
                        size={18}
                        color={Colors.white}
                      />
                      <Text style={styles.detailRequestWaBtnText}>
                        Minta ACC via WhatsApp
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>

              <View style={styles.detailModalFooter}>
                <TouchableOpacity
                  style={styles.detailShareBtn}
                  onPress={() => handleShareDetail(selectedForDetail)}
                >
                  <MaterialCommunityIcons
                    name="share-variant"
                    size={20}
                    color={Colors.skyBlueHeader}
                  />
                </TouchableOpacity>

                {isAdmin && (
                  <TouchableOpacity
                    style={styles.detailEditBtn}
                    onPress={() => handleOpenEdit(selectedForDetail)}
                  >
                    <MaterialCommunityIcons
                      name="pencil"
                      size={18}
                      color={Colors.skyBlueHeader}
                    />
                    <Text style={styles.detailEditBtnText}>Edit</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.detailCloseBtn}
                  onPress={() => setSelectedForDetail(null)}
                >
                  <Text style={styles.detailCloseBtnText}>Tutup</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 6. CREATE / EDIT ANNOUNCEMENT MODAL */}
      <Modal
        visible={isFormModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFormModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.formModalContainer}>
            <Text style={styles.formModalTitle}>
              {editingAnnouncement
                ? 'Edit Pengumuman'
                : 'Terbitkan Pengumuman Baru'}
            </Text>

            <ScrollView
              style={styles.formScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Judul Pengumuman *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Contoh: Pengambilan Kartu Identitas Anak"
                  placeholderTextColor={Colors.textNavyMuted}
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Isi Pengumuman *</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Tuliskan isi pengumuman lengkap..."
                  placeholderTextColor={Colors.textNavyMuted}
                  value={formContent}
                  onChangeText={setFormContent}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>
                  Persyaratan Warga (pisahkan dengan koma)
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Contoh: Membawa KTP Asli, Fotokopi KK"
                  placeholderTextColor={Colors.textNavyMuted}
                  value={formRequirements}
                  onChangeText={setFormRequirements}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Catatan Tambahan (Opsional)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Contoh: Gratis tanpa pungutan biaya"
                  placeholderTextColor={Colors.textNavyMuted}
                  value={formAdditionalInfo}
                  onChangeText={setFormAdditionalInfo}
                />
              </View>

              {/* Date & Time Selectors for Announcement */}
              <View style={styles.formRow}>
                {/* Tanggal Picker */}
                <View style={[styles.formField, { flex: 1, marginRight: 6 }]}>
                  <Text style={styles.formLabel}>Tanggal Informasi *</Text>
                  <TouchableOpacity
                    style={styles.pickerSelectorBox}
                    activeOpacity={0.8}
                    onPress={() => setIsDatePickerVisible(true)}
                  >
                    <MaterialCommunityIcons
                      name="calendar"
                      size={18}
                      color={Colors.skyBlueHeader}
                    />
                    <View style={styles.pickerSelectorInfo}>
                      <Text style={styles.pickerSelectorPrimaryText} numberOfLines={1}>
                        {formDate}
                      </Text>
                      <Text style={styles.pickerSelectorSubText}>{formDateIso}</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Waktu Jam Picker */}
                <View style={[styles.formField, { flex: 1, marginLeft: 6 }]}>
                  <Text style={styles.formLabel}>Waktu / Jam</Text>
                  <TouchableOpacity
                    style={styles.pickerSelectorBox}
                    activeOpacity={0.8}
                    onPress={() => setIsTimePickerVisible(true)}
                  >
                    <MaterialCommunityIcons
                      name="clock-time-four-outline"
                      size={18}
                      color={Colors.skyBlueHeader}
                    />
                    <View style={styles.pickerSelectorInfo}>
                      <Text style={styles.pickerSelectorPrimaryText} numberOfLines={1}>
                        {formTime}
                      </Text>
                      <Text style={styles.pickerSelectorSubText}>Ketuk ganti</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Tingkat Urgensi:</Text>
                <View style={styles.urgencySelectRow}>
                  {urgencies.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.urgencySelectChip,
                        formUrgency === u && styles.urgencySelectChipActive,
                      ]}
                      onPress={() => setFormUrgency(u)}
                    >
                      <Text
                        style={[
                          styles.urgencySelectText,
                          formUrgency === u && styles.urgencySelectTextActive,
                        ]}
                      >
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.formModalActions}>
              <TouchableOpacity
                style={styles.formCancelBtn}
                onPress={() => setIsFormModalVisible(false)}
              >
                <Text style={styles.formCancelBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.formSaveBtn}
                onPress={handleSaveForm}
              >
                <Text style={styles.formSaveBtnText}>
                  {editingAnnouncement ? 'Simpan' : 'Terbitkan'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* POPUP DATE PICKER MODAL */}
      <DatePickerModal
        visible={isDatePickerVisible}
        initialDateIso={formDateIso}
        title="Pilih Tanggal Pengumuman"
        onClose={() => setIsDatePickerVisible(false)}
        onSelectDate={(newIso, newFormatted) => {
          setFormDateIso(newIso);
          setFormDate(newFormatted);
        }}
      />

      {/* POPUP TIME PICKER MODAL */}
      <TimePickerModal
        visible={isTimePickerVisible}
        initialTime={formTime}
        title="Pilih Jam Pengumuman"
        onClose={() => setIsTimePickerVisible(false)}
        onSelectTime={(newTime) => setFormTime(newTime)}
      />

      {/* WHATSAPP APPROVAL REQUEST MODAL */}
      <WhatsAppApprovalModal
        visible={waModalData.visible}
        title={formTitle || 'Pengumuman Lingkungan'}
        itemType="PENGUMUMAN"
        targetName={waModalData.targetName}
        targetRole={waModalData.targetRole}
        targetPhone={waModalData.targetPhone}
        messageText={waModalData.messageText}
        onClose={() => setWaModalData((prev) => ({ ...prev, visible: false }))}
        onSuccessSent={() => setWaModalData((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.skyBlueBackground,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Colors.textNavyDark,
    includeFontPadding: false,
  },
  filterScrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterChipRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chipActive: {
    backgroundColor: Colors.yellowContainer,
    borderColor: Colors.yellowBorderLis,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FontFamily.semiBold,
    color: Colors.textNavyDark,
    includeFontPadding: false,
  },
  chipTextActive: {
    color: Colors.onYellowContainer,
    fontFamily: FontFamily.bold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.skyBlueSurfaceVariant,
    marginVertical: 4,
  },
  listPadding: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.yellowHighlight,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 6,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.onYellowContainer,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  detailModalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 18,
    maxHeight: '80%',
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailUrgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  detailUrgencyText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  detailDateText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: Colors.textNavyMuted,
  },
  detailModalScroll: {
    marginVertical: 6,
  },
  detailModalTitle: {
    fontSize: 16,
    fontFamily: FontFamily.headingExtraBold,
    color: Colors.textNavyDark,
    lineHeight: 22,
    marginBottom: 8,
  },
  detailModalContent: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Colors.textNavySecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  detailRequirementsSection: {
    backgroundColor: Colors.yellowContainer,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
  },
  detailReqSectionTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: Colors.onYellowContainer,
    marginBottom: 6,
  },
  detailReqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  detailReqText: {
    fontSize: 12,
    color: Colors.onYellowContainer,
    fontFamily: FontFamily.semiBold,
    flex: 1,
  },
  detailAdditionalText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textNavySecondary,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  detailAuthorText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: Colors.textNavyMuted,
    marginTop: 4,
  },
  detailApprovalWaBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    gap: 6,
  },
  detailApprovalWaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailApprovalWaTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: Colors.onYellowContainer,
  },
  detailApprovalWaSub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: Colors.onYellowContainer,
    lineHeight: 16,
  },
  detailRequestWaBtn: {
    backgroundColor: Colors.whatsappGreen,
    borderRadius: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  detailRequestWaBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: Colors.white,
  },
  detailModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 14,
    gap: 8,
  },
  detailShareBtn: {
    padding: 8,
  },
  detailEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  detailEditBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  detailCloseBtn: {
    backgroundColor: Colors.yellowHighlight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  detailCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  formModalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 18,
    maxHeight: '85%',
  },
  formModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textNavyDark,
    marginBottom: 12,
  },
  formScroll: {
    maxHeight: 380,
  },
  formField: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.textNavyDark,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  formTextArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerSelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
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
  urgencySelectRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  urgencySelectChip: {
    backgroundColor: Colors.skyBlueBackground,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  urgencySelectChipActive: {
    backgroundColor: Colors.yellowContainer,
    borderColor: Colors.yellowBorderLis,
  },
  urgencySelectText: {
    fontSize: 11,
    color: Colors.textNavyDark,
    fontWeight: '600',
  },
  urgencySelectTextActive: {
    color: Colors.onYellowContainer,
    fontWeight: '700',
  },
  formModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  formCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  formCancelBtnText: {
    fontSize: 13,
    color: Colors.textNavySecondary,
    fontWeight: '600',
  },
  formSaveBtn: {
    backgroundColor: Colors.yellowHighlight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  formSaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
});
