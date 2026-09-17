import React, { useState } from 'react';
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { ContactItem } from '../types';

interface VerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { verifyUserWithCode, contacts, showToast } = useApp();
  const [inputCode, setInputCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  // Ambil semua kontak pengurus RT / RW dari kontak penting wilayah
  const leaderContacts = contacts.filter((c) => {
    const cat = (c.category || '').toLowerCase();
    const title = (c.nameTitle || '').toLowerCase();
    return (
      cat.includes('rt') ||
      cat.includes('rw') ||
      cat.includes('pengurus') ||
      title.includes('rt') ||
      title.includes('rw') ||
      title.includes('ketua')
    );
  });

  const handleVerify = () => {
    setErrorMessage(null);
    if (!inputCode.trim()) {
      setErrorMessage('Mohon masukkan kode undangan wilayah!');
      return;
    }

    const result = verifyUserWithCode(inputCode);
    if (result.success) {
      setInputCode('');
      setErrorMessage(null);
      setIsPickerVisible(false);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleOpenWhatsAppToLeader = (contact: ContactItem) => {
    let cleanNumber = contact.phoneNumber.replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '62' + cleanNumber.substring(1);
    }
    const message = encodeURIComponent(
      `Halo ${contact.nameTitle}, saya warga baru ingin meminta Kode Undangan Wilayah untuk verifikasi akun di aplikasi Komuniva. Terima kasih!`
    );
    Linking.openURL(`https://api.whatsapp.com/send?phone=${cleanNumber}&text=${message}`).catch(
      () => showToast('Tidak dapat membuka WhatsApp')
    );
    setIsPickerVisible(false);
  };

  const handleOpenContactPicker = () => {
    if (leaderContacts.length === 0) {
      showToast('Kontak Pengurus RT/RW belum tersedia di buku kontak.');
      return;
    }
    if (leaderContacts.length === 1) {
      handleOpenWhatsAppToLeader(leaderContacts[0]);
    } else {
      setIsPickerVisible(true);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Top Icon Badge */}
          <View style={styles.shieldIconCircle}>
            <MaterialCommunityIcons
              name="shield-key"
              size={36}
              color={Colors.salmonPrimary}
            />
          </View>

          {/* Title & Info */}
          <Text style={styles.title}>Verifikasi Wilayah Warga</Text>
          <Text style={styles.description}>
            Untuk menjaga ketertiban data dan memastikan kegiatan tepat sasaran,
            silakan masukkan kode resmi dari pengurus RT/RW Anda.
          </Text>

          {/* Input Field */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="key-variant"
              size={20}
              color={Colors.salmonPrimary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Contoh: RT03MAJU"
              placeholderTextColor="#8E8E93"
              value={inputCode}
              onChangeText={(txt) => {
                setInputCode(txt.toUpperCase());
                if (errorMessage) setErrorMessage(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={16}
                color={Colors.urgentRed}
              />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* WhatsApp Hint Button: Terintegrasi dengan Kontak RT/RW */}
          <TouchableOpacity
            style={styles.askRtButton}
            activeOpacity={0.85}
            onPress={handleOpenContactPicker}
          >
            <MaterialCommunityIcons
              name="whatsapp"
              size={18}
              color="#16A34A"
            />
            <Text style={styles.askRtButtonText}>
              Belum punya kode? Minta Kode ke Pengurus RT / RW
            </Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setErrorMessage(null);
                setInputCode('');
                setIsPickerVisible(false);
                onClose();
              }}
            >
              <Text style={styles.cancelBtnText}>Nanti Saja</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.verifyBtn}
              activeOpacity={0.85}
              onPress={handleVerify}
            >
              <MaterialCommunityIcons
                name="check"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.verifyBtnText}>Verifikasi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SUB-MODAL: PILIHAN KONTAK RT / RW UNTUK WHATSAPP */}
        <Modal
          visible={isPickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsPickerVisible(false)}
        >
          <View style={styles.pickerBackdrop}>
            <View style={styles.pickerCard}>
              <View style={styles.pickerHeader}>
                <View>
                  <Text style={styles.pickerTitle}>Pilih Pengurus RT / RW</Text>
                  <Text style={styles.pickerSubtitle}>
                    Kirim pesan WhatsApp otomatis untuk meminta kode wilayah
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsPickerVisible(false)}
                  style={styles.closePickerBtn}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.pickerScrollView}
                showsVerticalScrollIndicator={false}
              >
                {leaderContacts.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.contactItem}
                    activeOpacity={0.8}
                    onPress={() => handleOpenWhatsAppToLeader(c)}
                  >
                    <View style={styles.contactAvatar}>
                      <MaterialCommunityIcons
                        name="account-tie"
                        size={22}
                        color={Colors.salmonPrimary}
                      />
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName} numberOfLines={1}>
                        {c.nameTitle}
                      </Text>
                      <Text style={styles.contactNumber}>
                        {c.phoneNumber} • {c.category}
                      </Text>
                    </View>
                    <View style={styles.waIconPill}>
                      <MaterialCommunityIcons name="whatsapp" size={16} color="#16A34A" />
                      <Text style={styles.waPillText}>Chat WA</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  shieldIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.salmonContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    fontFamily: Fonts.bodyRegular,
    color: '#636366',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#ECEEF2',
    width: '100%',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: '#1C1C1E',
    letterSpacing: 1.5,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEECEB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    width: '100%',
    marginBottom: 10,
  },
  errorText: {
    color: Colors.urgentRed,
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
    flex: 1,
  },
  askRtButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F9ED',
    borderWidth: 1,
    borderColor: '#C6F0D3',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 6,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  askRtButtonText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: '#16A34A',
    flexShrink: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636366',
  },
  verifyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.salmonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    shadowColor: Colors.salmonPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  verifyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: '#FFFFFF',
  },

  // Picker Modal Styles
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: '#1C1C1E',
  },
  pickerSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  closePickerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerScrollView: {
    maxHeight: 350,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECEEF2',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    gap: 12,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.salmonContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: '#1C1C1E',
  },
  contactNumber: {
    fontSize: 11,
    color: '#636366',
    marginTop: 2,
  },
  waIconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F9ED',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 4,
  },
  waPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
});
