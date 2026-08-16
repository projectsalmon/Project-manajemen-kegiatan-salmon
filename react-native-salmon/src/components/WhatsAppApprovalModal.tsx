import React, { useState } from 'react';
import {
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
import { openWhatsApp } from '../utils/whatsappHelpers';

interface WhatsAppApprovalModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  itemType: 'KEGIATAN' | 'PENGUMUMAN';
  targetName: string;
  targetRole: string;
  targetPhone: string;
  messageText: string;
  onSuccessSent?: () => void;
}

export const WhatsAppApprovalModal: React.FC<WhatsAppApprovalModalProps> = ({
  visible,
  onClose,
  title,
  itemType,
  targetName,
  targetRole,
  targetPhone: initialPhone,
  messageText,
  onSuccessSent,
}) => {
  const { contacts, showToast } = useApp();
  const [customPhone, setCustomPhone] = useState(initialPhone);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const handleSendWhatsApp = async () => {
    const success = await openWhatsApp(messageText, customPhone || initialPhone);
    if (success) {
      showToast('Membuka WhatsApp untuk mengirim pesan...');
      if (onSuccessSent) onSuccessSent();
      onClose();
    } else {
      showToast('Gagal membuka aplikasi WhatsApp di perangkat ini.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => {}}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeftGroup}>
              <View style={styles.whatsappIconCircle}>
                <MaterialCommunityIcons
                  name="whatsapp"
                  size={26}
                  color={Colors.white}
                />
              </View>
              <View style={styles.headerTitleGroup}>
                <Text style={styles.modalTitle}>Minta Persetujuan (ACC)</Text>
                <Text style={styles.modalSubtitle}>
                  Kirim rincian {itemType.toLowerCase()} via WhatsApp
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeIconButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={Colors.textNavyDark} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Notification Callout */}
            <View style={styles.calloutCard}>
              <MaterialCommunityIcons
                name="clock-alert-outline"
                size={20}
                color={Colors.yellowAccent}
              />
              <Text style={styles.calloutText}>
                {itemType === 'KEGIATAN' ? 'Kegiatan' : 'Pengumuman'} baru memerlukan persetujuan dari <Text style={styles.boldText}>{targetRole}</Text> agar resmi diterbitkan untuk warga.
              </Text>
            </View>

            {/* Recipient Target Card */}
            <View style={styles.recipientCard}>
              <View style={styles.recipientHeader}>
                <Text style={styles.recipientLabel}>Penerima Pesan (Pejabat Berwenang):</Text>
                <TouchableOpacity
                  onPress={() => setIsEditingPhone(!isEditingPhone)}
                >
                  <Text style={styles.editPhoneTriggerText}>
                    {isEditingPhone ? 'Selesai' : 'Ganti Kontak'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.recipientInfoRow}>
                <View style={styles.recipientAvatar}>
                  <Text style={styles.recipientAvatarText}>
                    {targetName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.recipientDetails}>
                  <Text style={styles.recipientName}>{targetName}</Text>
                  <Text style={styles.recipientRole}>{targetRole}</Text>
                </View>
              </View>

              {isEditingPhone ? (
                <View style={styles.phoneInputBox}>
                  <Text style={styles.phoneInputLabel}>Nomor WhatsApp Tujuan:</Text>
                  <TextInput
                    style={styles.phoneTextInput}
                    placeholder="Contoh: 081234567890"
                    placeholderTextColor={Colors.textNavyMuted}
                    value={customPhone}
                    onChangeText={setCustomPhone}
                    keyboardType="phone-pad"
                  />
                  {/* Quick Select from Contacts */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickContactsRow}
                  >
                    {contacts.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={styles.contactChip}
                        onPress={() => setCustomPhone(c.phoneNumber)}
                      >
                        <Text style={styles.contactChipText}>{c.nameTitle}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.phoneBadgeRow}>
                  <MaterialCommunityIcons
                    name="phone"
                    size={14}
                    color={Colors.skyBlueHeader}
                  />
                  <Text style={styles.phoneNumberText}>{customPhone || initialPhone}</Text>
                </View>
              )}
            </View>

            {/* Message Preview Box */}
            <View style={styles.previewBoxContainer}>
              <View style={styles.previewBoxHeader}>
                <MaterialCommunityIcons
                  name="text-box-search-outline"
                  size={16}
                  color={Colors.textNavyMuted}
                />
                <Text style={styles.previewBoxLabel}>Pratinjau Teks Template Pesan:</Text>
              </View>
              <View style={styles.messageBubble}>
                <Text style={styles.messageBubbleText}>{messageText}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.sendWhatsAppButton}
              activeOpacity={0.85}
              onPress={handleSendWhatsApp}
            >
              <MaterialCommunityIcons
                name="whatsapp"
                size={22}
                color={Colors.white}
              />
              <Text style={styles.sendWhatsAppButtonText}>
                Kirim via WhatsApp Sekarang
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={onClose}
            >
              <Text style={styles.laterButtonText}>Nanti Saja (Batal Kirim)</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  whatsappIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.whatsappGreen,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  headerTitleGroup: {
    flex: 1,
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
  modalScroll: {
    maxHeight: 380,
  },
  modalScrollContent: {
    gap: 12,
    paddingBottom: 8,
  },
  calloutCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.yellowContainer,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
  },
  calloutText: {
    fontSize: 12,
    color: Colors.onYellowContainer,
    flex: 1,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '800',
  },
  recipientCard: {
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.skyBlueBorder,
  },
  recipientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  recipientLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editPhoneTriggerText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  recipientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recipientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.skyBlueBorder,
  },
  recipientAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.skyBlueHeader,
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  recipientRole: {
    fontSize: 11,
    color: Colors.textNavySecondary,
    marginTop: 1,
  },
  phoneBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  phoneNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  phoneInputBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.skyBlueSurfaceVariant,
  },
  phoneInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textNavySecondary,
    marginBottom: 4,
  },
  phoneTextInput: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: Colors.textNavyDark,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 6,
  },
  quickContactsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  contactChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  contactChipText: {
    fontSize: 10,
    color: Colors.textNavyDark,
    fontWeight: '600',
  },
  previewBoxContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  previewBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  previewBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textNavySecondary,
  },
  messageBubble: {
    backgroundColor: Colors.whatsappGreenBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#B9F6CA',
  },
  messageBubbleText: {
    fontSize: 11,
    lineHeight: 17,
    color: '#064E3B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalActions: {
    marginTop: 12,
    gap: 8,
  },
  sendWhatsAppButton: {
    backgroundColor: Colors.whatsappGreen,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
  },
  sendWhatsAppButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
  },
  laterButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textNavyMuted,
  },
});
