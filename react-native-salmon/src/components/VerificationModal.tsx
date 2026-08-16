import React, { useState } from 'react';
import {
  Linking,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

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
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleContactRt = () => {
    const rtContact = contacts.find(
      (c) =>
        c.category.toLowerCase().includes('rt') ||
        c.nameTitle.toLowerCase().includes('rt')
    );
    if (rtContact) {
      let cleanNumber = rtContact.phoneNumber.replace(/[^0-9]/g, '');
      if (cleanNumber.startsWith('0')) {
        cleanNumber = '62' + cleanNumber.substring(1);
      }
      const message = encodeURIComponent(
        'Halo Pak RT, saya warga baru ingin meminta Kode Undangan Wilayah untuk aplikasi Konek. Terima kasih!'
      );
      Linking.openURL(`https://api.whatsapp.com/send?phone=${cleanNumber}&text=${message}`).catch(
        () => showToast('Tidak dapat membuka WhatsApp')
      );
    } else {
      showToast('Kontak RT belum tersedia di buku alamat.');
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
              name="shield-check"
              size={36}
              color={Colors.skyBlueHeader}
            />
          </View>

          {/* Title & Info */}
          <Text style={styles.title}>Verifikasi Warga RT / RW</Text>
          <Text style={styles.description}>
            Untuk menjaga ketertiban kuota dan memastikan kegiatan tepat sasaran,
            silakan masukkan kode undangan yang dibagikan pengurus di grup WhatsApp RT Anda.
          </Text>

          {/* Input Field */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="key-variant"
              size={20}
              color={Colors.skyBlueHeader}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Contoh: RT03MAJU"
              placeholderTextColor={Colors.textNavyMuted}
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

          {/* WhatsApp Hint Button */}
          <TouchableOpacity
            style={styles.askRtButton}
            activeOpacity={0.8}
            onPress={handleContactRt}
          >
            <MaterialCommunityIcons
              name="whatsapp"
              size={18}
              color="#128C7E"
            />
            <Text style={styles.askRtButtonText}>
              Belum tahu kodenya? Hubungi Ketua RT di WA
            </Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setErrorMessage(null);
                setInputCode('');
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
                color={Colors.onYellowContainer}
              />
              <Text style={styles.verifyBtnText}>Verifikasi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    elevation: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  shieldIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.skyBlueSurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textNavyDark,
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: Colors.textNavySecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.skyBlueBorder,
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
    color: Colors.textNavyDark,
    letterSpacing: 1.5,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.urgentRedContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    width: '100%',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    color: Colors.urgentRed,
    flex: 1,
    fontWeight: '600',
  },
  askRtButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 14,
  },
  askRtButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#128C7E',
    textDecorationLine: 'underline',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textNavyMuted,
  },
  verifyBtn: {
    backgroundColor: Colors.yellowContainer,
    borderWidth: 1.5,
    borderColor: Colors.yellowBorderLis,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
});
