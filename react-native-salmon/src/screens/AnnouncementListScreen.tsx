import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  FlatList,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AnnouncementCard } from '../components/AnnouncementCard';
import { DatePickerModal } from '../components/DatePickerModal';
import { TimePickerModal } from '../components/TimePickerModal';
import { WhatsAppApprovalModal } from '../components/WhatsAppApprovalModal';
import { PinDurationModal } from '../components/PinDurationModal';
import { Colors, UrgencyMeta } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { uploadMediaToDrive } from '../services/driveMediaService';
import {
  AnnouncementItem,
  AnnouncementUrgencyType,
  PIN_DURATION_OPTIONS,
  isItemPinned,
} from '../types';
import { buildAnnouncementApprovalMessage } from '../utils/whatsappHelpers';

export const AnnouncementListScreen: React.FC<{ route?: any }> = ({ route }) => {
  const {
    currentUser,
    contacts,
    announcements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    togglePinAnnouncement,
    showToast,
    markItemAsRead,
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
  const [isPinDurationModalVisible, setIsPinDurationModalVisible] = useState(false);

  // Auto open announcement detail if opened from a notification tap or deep link
  useEffect(() => {
    const targetId = route?.params?.selectedAnnouncementId;
    if (targetId && announcements.length > 0) {
      const found = announcements.find((a) => a.id === targetId);
      if (found) {
        setSelectedForDetail(found);
      }
    }
  }, [route?.params?.selectedAnnouncementId, announcements]);

  const markedAnnRef = useRef<string | null>(null);

  // Mark announcement as read when opened in detail modal
  useEffect(() => {
    if (selectedForDetail?.id && markedAnnRef.current !== selectedForDetail.id) {
      markedAnnRef.current = selectedForDetail.id;
      markItemAsRead(selectedForDetail.id, 'ANNOUNCEMENT');
    }
  }, [selectedForDetail?.id, markItemAsRead]);

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
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formPinnedAt, setFormPinnedAt] = useState<string | null>(null);
  const [formPinDurationMs, setFormPinDurationMs] = useState<number | null>(null);
  const [formPinDurationLabel, setFormPinDurationLabel] = useState<string>('Selamanya');

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
    setFormImageUrl(null);
    setFormIsPinned(false);
    setFormPinnedAt(null);
    setFormPinDurationMs(null);
    setFormPinDurationLabel('Selamanya');
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
    setFormImageUrl(ann.imageUrl || null);
    setFormIsPinned(!!ann.isPinned);
    setFormPinnedAt(ann.pinnedAt || null);
    setFormPinDurationMs(
      ann.pinExpiresAt ? Math.max(0, new Date(ann.pinExpiresAt).getTime() - Date.now()) : null
    );
    setFormPinDurationLabel(ann.pinDurationLabel || 'Selamanya');
    setFormDate(ann.formattedDate || 'Minggu, 18 Mei 2025');
    setFormDateIso('2025-05-18');
    setFormTime('08:00 - 11:00 WIB');
    setSelectedForDetail(null);
    setIsFormModalVisible(true);
  };

  const promptPhotoPicker = () => {
    Alert.alert(
      'Pilih Foto Thumbnail Pengumuman',
      'Pilih sumber foto pengumuman:',
      [
        {
          text: 'Kamera HP',
          onPress: async () => {
            try {
              const perm = await ImagePicker.requestCameraPermissionsAsync();
              if (!perm.granted) {
                Alert.alert(
                  'Izin Kamera Diperlukan',
                  'Aplikasi membutuhkan izin kamera untuk mengambil foto thumbnail pengumuman.'
                );
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.7,
                base64: true,
              });
              if (!result.canceled && result.assets.length > 0) {
                const asset = result.assets[0];
                showToast('Mengunggah thumbnail ke Google Drive...');
                try {
                  const driveRes = await uploadMediaToDrive({
                    fileUri: asset.uri,
                    base64Data: asset.base64,
                    fileName: `pengumuman_${Date.now()}.jpg`,
                    mimeType: asset.mimeType || 'image/jpeg',
                    activityId: 'PENGUMUMAN',
                    activityTitle: formTitle.trim() || 'Pengumuman Warga',
                    mediaType: 'PHOTO',
                    uploadedBy: currentUser.name || currentUser.email || 'Pengurus',
                  });
                  if (driveRes.success && driveRes.thumbnailUrl) {
                    setFormImageUrl(driveRes.thumbnailUrl);
                    showToast('Thumbnail pengumuman tersimpan di Google Drive!');
                  } else {
                    setFormImageUrl(asset.uri);
                  }
                } catch {
                  setFormImageUrl(asset.uri);
                }
              }
            } catch (err) {
              console.warn('Gagal buka kamera:', err);
            }
          },
        },
        {
          text: 'Galeri Foto',
          onPress: async () => {
            try {
              const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!perm.granted) {
                Alert.alert(
                  'Izin Galeri Diperlukan',
                  'Aplikasi membutuhkan izin galeri untuk memilih foto thumbnail pengumuman.'
                );
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.5,
                base64: true,
              });
              if (!result.canceled && result.assets.length > 0) {
                const asset = result.assets[0];
                showToast('Mengunggah thumbnail ke Google Drive...');
                try {
                  const driveRes = await uploadMediaToDrive({
                    fileUri: asset.uri,
                    base64Data: asset.base64,
                    fileName: `pengumuman_${Date.now()}.jpg`,
                    mimeType: asset.mimeType || 'image/jpeg',
                    activityId: 'PENGUMUMAN',
                    activityTitle: formTitle.trim() || 'Pengumuman Warga',
                    mediaType: 'PHOTO',
                    uploadedBy: currentUser.name || currentUser.email || 'Pengurus',
                  });
                  if (driveRes.success && driveRes.thumbnailUrl) {
                    setFormImageUrl(driveRes.thumbnailUrl);
                    showToast('Thumbnail pengumuman tersimpan di Google Drive!');
                  } else {
                    setFormImageUrl(asset.uri);
                  }
                } catch {
                  setFormImageUrl(asset.uri);
                }
              }
            } catch (err) {
              console.warn('Gagal buka galeri:', err);
            }
          },
        },
        { text: 'Batal', style: 'cancel' },
      ]
    );
  };

  const handleTogglePinForm = () => {
    if (!formIsPinned) {
      const nowFormatted = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      setFormIsPinned(true);
      setFormPinnedAt(nowFormatted);
      showToast('Pengumuman disetel untuk disematkan di posisi teratas.');
    } else {
      setFormIsPinned(false);
      setFormPinnedAt(null);
      setFormPinDurationMs(null);
      setFormPinDurationLabel('Selamanya');
      showToast('Sematan pengumuman dilepas.');
    }
  };

  const handleDeleteAnnouncement = (annId: string, annTitle: string) => {
    Alert.alert(
      'Hapus Pengumuman',
      `Apakah Anda yakin ingin menghapus pengumuman "${annTitle}" ini secara permanen?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Hapus Pengumuman',
          style: 'destructive',
          onPress: async () => {
            await deleteAnnouncement(annId);
            setIsFormModalVisible(false);
            setSelectedForDetail(null);
          },
        },
      ]
    );
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

    const calculatedPinExpiresAt =
      formIsPinned && formPinDurationMs && formPinDurationMs > 0
        ? new Date(Date.now() + formPinDurationMs).toISOString()
        : null;
    const calculatedPinDurationLabel = formIsPinned ? formPinDurationLabel : null;

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
      imageUrl: formImageUrl || null,
      approvalStatus:
        currentUser.role === 'RT'
          ? 'WAITING_RW_APPROVAL'
          : currentUser.role === 'RW'
          ? 'WAITING_ADMIN_APPROVAL'
          : 'PUBLISHED',
      isPinned: formIsPinned,
      pinnedAt: formPinnedAt,
      pinExpiresAt: calculatedPinExpiresAt,
      pinDurationLabel: calculatedPinDurationLabel,
    };

    if (editingAnnouncement) {
      updateAnnouncement(editingAnnouncement.id, {
        title: formTitle.trim(),
        content: formContent.trim(),
        urgency: formUrgency,
        targetRegion: formTargetRegion.trim(),
        requirements: reqList,
        additionalInfo: formAdditionalInfo ? formAdditionalInfo.trim() : null,
        imageUrl: formImageUrl || null,
        formattedDate: finalFormattedDate,
        isPinned: formIsPinned,
        pinnedAt: formPinnedAt,
        pinExpiresAt: calculatedPinExpiresAt,
        pinDurationLabel: calculatedPinDurationLabel,
      });
    } else {
      addAnnouncement({
        title: formTitle.trim(),
        content: formContent.trim(),
        urgency: formUrgency,
        targetRegion: formTargetRegion.trim(),
        requirements: reqList,
        additionalInfo: formAdditionalInfo ? formAdditionalInfo.trim() : null,
        imageUrl: formImageUrl || null,
        formattedDate: finalFormattedDate,
        isPinned: formIsPinned,
        pinnedAt: formPinnedAt,
        pinExpiresAt: calculatedPinExpiresAt,
        pinDurationLabel: calculatedPinDurationLabel,
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
      {/* 0. APPLE IOS LARGE TITLE HEADER */}
      <View style={styles.largeTitleContainer}>
        <Text style={styles.largeTitleText}>Pengumuman</Text>
      </View>

      {/* 1. SEARCH INPUT */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={Colors.salmonPrimary}
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

      {/* 4. FAB FOR ADMIN - Apple iOS Circular (+) */}
      {isAdmin && (
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.85}
          onPress={handleOpenCreate}
        >
          <MaterialCommunityIcons
            name="plus"
            size={28}
            color={Colors.white}
          />
        </TouchableOpacity>
      )}

      {/* 5. ANNOUNCEMENT DETAIL BOTTOM SHEET (Apple iOS Style) */}
      {selectedForDetail && (
        <Modal
          visible={selectedForDetail !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedForDetail(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.detailModalContainer}>
              <View style={styles.sheetHandle} />
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
                {selectedForDetail.imageUrl ? (
                  <View style={styles.detailImageContainer}>
                    <Image
                      source={{ uri: selectedForDetail.imageUrl }}
                      style={styles.detailBannerImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : null}
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

                {/* Reader Metric for Announcement */}
                <View style={styles.readTrackingModalRow}>
                  <View style={styles.readTrackingModalBadge}>
                    <MaterialCommunityIcons
                      name="eye-outline"
                      size={15}
                      color={
                        currentUser.role !== 'WARGA'
                          ? Colors.skyBlueHeader
                          : Colors.textNavySecondary
                      }
                    />
                    <Text
                      style={[
                        styles.readTrackingModalText,
                        currentUser.role !== 'WARGA' && styles.readTrackingModalTextAdmin,
                      ]}
                    >
                      {selectedForDetail.readCount ||
                        selectedForDetail.readByUserIds?.length ||
                        0}{' '}
                      orang telah membaca
                    </Text>
                  </View>
                  {currentUser.role !== 'WARGA' && (
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
                  style={styles.detailShareWideBtn}
                  activeOpacity={0.8}
                  onPress={() => handleShareDetail(selectedForDetail)}
                >
                  <MaterialCommunityIcons
                    name="share-variant"
                    size={18}
                    color={Colors.white}
                  />
                  <Text style={styles.detailShareWideBtnText}>
                    Bagikan Pengumuman
                  </Text>
                </TouchableOpacity>

                {isAdmin && (
                  <View style={styles.detailAdminActionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.detailAdminBtn,
                        isItemPinned(selectedForDetail) && styles.detailPinBtnActive,
                      ]}
                      activeOpacity={0.8}
                      onPress={async () => {
                        if (isItemPinned(selectedForDetail)) {
                          await togglePinAnnouncement(selectedForDetail.id);
                          setSelectedForDetail((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  isPinned: false,
                                  pinnedAt: null,
                                  pinExpiresAt: null,
                                  pinDurationLabel: null,
                                }
                              : null
                          );
                        } else {
                          setIsPinDurationModalVisible(true);
                        }
                      }}
                    >
                      <MaterialCommunityIcons
                        name={isItemPinned(selectedForDetail) ? 'pin-off' : 'pin'}
                        size={16}
                        color={isItemPinned(selectedForDetail) ? '#B45309' : Colors.iosTextPrimary}
                      />
                      <Text
                        style={[
                          styles.detailAdminBtnText,
                          isItemPinned(selectedForDetail) && { color: '#B45309' },
                        ]}
                      >
                        {isItemPinned(selectedForDetail) ? 'Lepas' : 'Sematkan'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailAdminBtn}
                      activeOpacity={0.8}
                      onPress={() => handleOpenEdit(selectedForDetail)}
                    >
                      <MaterialCommunityIcons
                        name="pencil"
                        size={16}
                        color={Colors.iosTextPrimary}
                      />
                      <Text style={styles.detailAdminBtnText}>
                        Edit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.detailAdminBtn, styles.detailDeleteBtn]}
                      activeOpacity={0.8}
                      onPress={() =>
                        handleDeleteAnnouncement(
                          selectedForDetail.id,
                          selectedForDetail.title
                        )
                      }
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={16}
                        color={Colors.iosDanger}
                      />
                      <Text style={[styles.detailAdminBtnText, { color: Colors.iosDanger }]}>
                        Hapus
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.detailCloseBtn}
                  activeOpacity={0.8}
                  onPress={() => setSelectedForDetail(null)}
                >
                  <Text style={styles.detailCloseBtnText}>Tutup</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* MODAL PILIH DURASI SEMATAN */}
      {selectedForDetail && (
        <PinDurationModal
          visible={isPinDurationModalVisible}
          itemTitle={selectedForDetail.title}
          onClose={() => setIsPinDurationModalVisible(false)}
          onConfirm={async (durationMs, durationLabel) => {
            if (!selectedForDetail) return;
            await togglePinAnnouncement(
              selectedForDetail.id,
              durationMs,
              durationLabel
            );
            setSelectedForDetail((prev) =>
              prev
                ? {
                    ...prev,
                    isPinned: true,
                    pinnedAt: new Date().toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    pinExpiresAt: durationMs
                      ? new Date(Date.now() + durationMs).toISOString()
                      : null,
                    pinDurationLabel: durationLabel,
                  }
                : null
            );
          }}
        />
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
              {/* Photo Thumbnail Picker */}
              <View style={styles.formPhotoSection}>
                <Text style={styles.formLabel}>Foto / Thumbnail Pengumuman (Opsional)</Text>
                {formImageUrl ? (
                  <View style={styles.formPhotoPreviewWrapper}>
                    <Image
                      source={{ uri: formImageUrl }}
                      style={styles.formPhotoPreviewImage}
                      resizeMode="cover"
                    />
                    <View style={styles.formPhotoActionsRow}>
                      <TouchableOpacity
                        style={styles.formPhotoChangeBtn}
                        activeOpacity={0.8}
                        onPress={promptPhotoPicker}
                      >
                        <MaterialCommunityIcons
                          name="camera-retake-outline"
                          size={16}
                          color={Colors.white}
                        />
                        <Text style={styles.formPhotoChangeBtnText}>Ganti Foto</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.formPhotoDeleteBtn}
                        activeOpacity={0.8}
                        onPress={() => setFormImageUrl(null)}
                      >
                        <MaterialCommunityIcons
                          name="trash-can-outline"
                          size={16}
                          color="#DC2626"
                        />
                        <Text style={styles.formPhotoDeleteBtnText}>Hapus Foto</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.formPhotoPickerBox}
                    activeOpacity={0.8}
                    onPress={promptPhotoPicker}
                  >
                    <View style={styles.formPhotoPickerIconCircle}>
                      <MaterialCommunityIcons
                        name="camera-plus-outline"
                        size={24}
                        color={Colors.skyBlueHeader}
                      />
                    </View>
                    <Text style={styles.formPhotoPickerTitle}>
                      Unggah Foto / Thumbnail Pengumuman
                    </Text>
                    <Text style={styles.formPhotoPickerSub}>
                      Pilih Kamera atau Galeri HP • Otomatis dikompres
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

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

              {/* Fitur Sematkan Pengumuman */}
              <View
                style={[
                  styles.formPinBox,
                  formIsPinned && styles.formPinBoxActive,
                ]}
              >
                <View style={styles.formPinTopRow}>
                  <View style={styles.formPinLeft}>
                    <View
                      style={[
                        styles.formPinIconCircle,
                        formIsPinned && styles.formPinIconCircleActive,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={formIsPinned ? 'pin' : 'pin-outline'}
                        size={18}
                        color={formIsPinned ? '#B45309' : Colors.skyBlueHeader}
                      />
                    </View>
                    <View style={styles.formPinTextWrapper}>
                      <View style={styles.formPinTitleRow}>
                        <Text style={styles.formPinTitle} numberOfLines={1}>
                          Sematkan di Atas
                        </Text>
                        {formIsPinned && (
                          <View style={styles.formPinnedBadge}>
                            <Text style={styles.formPinnedBadgeText}>📌 Tersemat</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.formPinSub} numberOfLines={1}>
                        {formIsPinned
                          ? `Durasi: ${formPinDurationLabel}`
                          : 'Tampil di posisi paling atas'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.formPinToggle,
                      formIsPinned ? styles.formPinToggleActive : styles.formPinToggleInactive,
                    ]}
                    activeOpacity={0.8}
                    onPress={handleTogglePinForm}
                  >
                    <MaterialCommunityIcons
                      name={formIsPinned ? 'pin-off' : 'pin'}
                      size={15}
                      color={formIsPinned ? '#DC2626' : Colors.skyBlueHeader}
                    />
                    <Text
                      style={[
                        styles.formPinToggleText,
                        formIsPinned && { color: '#DC2626' },
                      ]}
                    >
                      {formIsPinned ? 'Lepas' : 'Sematkan'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Duration Chips for Pinning */}
                {formIsPinned && (
                  <View style={styles.formPinDurationBox}>
                    <Text style={styles.formPinDurationTitle}>
                      BATAS DURASI SEMATAN:
                    </Text>
                    <View style={styles.formPinDurationChips}>
                      {PIN_DURATION_OPTIONS.map((opt) => {
                        const isSel = formPinDurationLabel === opt.label;
                        return (
                          <TouchableOpacity
                            key={opt.label}
                            style={[
                              styles.durationChip,
                              isSel && styles.durationChipActive,
                            ]}
                            activeOpacity={0.8}
                            onPress={() => {
                              setFormPinDurationMs(opt.ms);
                              setFormPinDurationLabel(opt.label);
                            }}
                          >
                            <Text
                              style={[
                                styles.durationChipText,
                                isSel && styles.durationChipTextActive,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              {/* Tombol Hapus Pengumuman (Khusus Saat Edit) */}
              {editingAnnouncement && (
                <TouchableOpacity
                  style={styles.formDeleteBtn}
                  onPress={() =>
                    handleDeleteAnnouncement(
                      editingAnnouncement.id,
                      editingAnnouncement.title
                    )
                  }
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={18}
                    color="#DC2626"
                  />
                  <Text style={styles.formDeleteBtnText}>
                    Hapus Pengumuman Ini
                  </Text>
                </TouchableOpacity>
              )}
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
    backgroundColor: Colors.iosBackground,
  },
  largeTitleContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  largeTitleText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.iosTextPrimary,
    letterSpacing: -0.5,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.iosTextPrimary,
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
    fontWeight: '600',
    color: Colors.textNavyDark,
    includeFontPadding: false,
  },
  chipTextActive: {
    color: Colors.onYellowContainer,
    fontWeight: '700',
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
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: Colors.salmonPrimary,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: Colors.salmonPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  detailModalContainer: {
    backgroundColor: Colors.iosCard,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.iosBorder,
    alignSelf: 'center',
    marginBottom: 14,
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
    fontWeight: '700',
  },
  detailDateText: {
    fontSize: 12,
    color: Colors.iosTextMuted,
  },
  detailModalScroll: {
    marginVertical: 6,
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.iosTextPrimary,
    lineHeight: 24,
    marginBottom: 8,
  },
  detailModalContent: {
    fontSize: 14,
    color: Colors.iosTextSecondary,
    lineHeight: 21,
    marginBottom: 12,
  },
  detailRequirementsSection: {
    backgroundColor: Colors.salmonContainer,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.salmonBorder,
  },
  detailReqSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.salmonPrimary,
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
    color: Colors.iosTextPrimary,
    fontWeight: '600',
    flex: 1,
  },
  detailAdditionalText: {
    fontSize: 12,
    color: Colors.iosTextMuted,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  detailAuthorText: {
    fontSize: 11,
    color: Colors.iosTextMuted,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  detailApprovalWaSub: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 15,
  },
  detailRequestWaBtn: {
    backgroundColor: Colors.whatsappGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginTop: 4,
  },
  detailRequestWaBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
  },
  detailModalFooter: {
    marginTop: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.iosBorder,
    paddingTop: 14,
  },
  detailAdminActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  detailAdminBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    backgroundColor: Colors.iosBackground,
  },
  detailAdminBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.iosTextPrimary,
  },
  detailPinBtn: {
    backgroundColor: Colors.skyBlueSurface,
    borderColor: Colors.skyBlueHeader,
  },
  detailPinBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  detailEditBtn: {
    backgroundColor: Colors.skyBlueBackground,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  detailDeleteBtn: {
    backgroundColor: Colors.iosDangerBg,
    borderColor: Colors.iosBorder,
  },
  detailShareWideBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.salmonPrimary,
    shadowColor: Colors.salmonPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  detailShareWideBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  detailCloseBtn: {
    width: '100%',
    backgroundColor: Colors.iosBackground,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  detailCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.iosTextPrimary,
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
  formPinBox: {
    flexDirection: 'column',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    marginBottom: 4,
    gap: 8,
  },
  formPinTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
  },
  formPinDurationBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 4,
  },
  formPinDurationTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  formPinDurationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  durationChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  durationChipActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
  },
  durationChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  durationChipTextActive: {
    color: Colors.white,
  },
  formPinBoxActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  formPinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  formPinIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.skyBlueSurface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  formPinIconCircleActive: {
    backgroundColor: '#FEF3C7',
  },
  formPinTextWrapper: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  formPinTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  formPinTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
    flexShrink: 1,
  },
  formPinnedBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 1,
    flexShrink: 0,
  },
  formPinnedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  formPinSub: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    marginTop: 1,
  },
  formPinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    flexShrink: 0,
  },
  formPinToggleInactive: {
    backgroundColor: Colors.skyBlueSurface,
    borderWidth: 1,
    borderColor: Colors.skyBlueHeader,
  },
  formPinToggleActive: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  formPinToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  formDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  formDeleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  detailImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: Colors.skyBlueSurface,
  },
  detailBannerImage: {
    width: '100%',
    height: '100%',
  },
  formPhotoSection: {
    marginBottom: 14,
  },
  formPhotoPickerBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.skyBlueHeader,
    borderRadius: 14,
    backgroundColor: '#F0F9FF',
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  formPhotoPickerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  formPhotoPickerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  formPhotoPickerSub: {
    fontSize: 11,
    color: Colors.textNavyMuted,
  },
  formPhotoPreviewWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.skyBlueBorder,
    backgroundColor: '#000',
  },
  formPhotoPreviewImage: {
    width: '100%',
    height: 160,
  },
  formPhotoActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    gap: 8,
  },
  formPhotoChangeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.skyBlueHeader,
    paddingVertical: 8,
    borderRadius: 8,
  },
  formPhotoChangeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  formPhotoDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2F2',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  formPhotoDeleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  readTrackingModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  readTrackingModalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.skyBlueBackground,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  readTrackingModalText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textNavySecondary,
  },
  readTrackingModalTextAdmin: {
    color: Colors.skyBlueHeader,
    fontWeight: '700',
  },
  adminTrackingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  adminTrackingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
});
