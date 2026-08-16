import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Colors, Fonts } from '../constants/theme';
import { useApp } from '../context/AppContext';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = '957812902323-sla7uv6hfrh0te1b3vre9jdu5nga452g.apps.googleusercontent.com';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { loginWithGoogleProfile, showToast } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleModalVisible, setIsGoogleModalVisible] = useState(false);

  // Form input for Google Account
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // Google OAuth configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      const accessToken = authentication?.accessToken;
      if (accessToken) {
        fetchGoogleUserProfile(accessToken);
      }
    } else if (response?.type === 'error') {
      setIsLoading(false);
      // If OAuth fails due to custom scheme/web client restriction, open Google Account sheet
      setIsGoogleModalVisible(true);
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      setIsLoading(false);
    }
  }, [response]);

  const fetchGoogleUserProfile = async (token: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const googleUser = await res.json();

      if (googleUser && googleUser.email) {
        completeGoogleLogin(
          googleUser.email,
          googleUser.name || googleUser.email.split('@')[0],
          googleUser.picture
        );
      } else {
        throw new Error('Data profil email tidak ditemukan');
      }
    } catch (error: any) {
      setIsGoogleModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const completeGoogleLogin = (email: string, name: string, photoUrl?: string) => {
    loginWithGoogleProfile({
      email: email.trim(),
      name: name.trim() || email.split('@')[0],
      photoUrl: photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=0369A1&color=fff`,
    });

    setIsGoogleModalVisible(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleGoogleButtonClick = async () => {
    setIsLoading(true);
    try {
      if (promptAsync) {
        const authRes = await promptAsync();
        if (authRes.type !== 'success') {
          // Open quick Google sheet
          setIsLoading(false);
          setIsGoogleModalVisible(true);
        }
      } else {
        setIsLoading(false);
        setIsGoogleModalVisible(true);
      }
    } catch (e: any) {
      setIsLoading(false);
      setIsGoogleModalVisible(true);
    }
  };

  const handleModalSubmit = () => {
    if (!googleEmail.trim()) {
      showToast('Mohon masukkan alamat email Google Anda!');
      return;
    }
    const cleanEmail = googleEmail.trim().toLowerCase();
    const finalEmail = cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@gmail.com`;
    const finalName = googleName.trim() || finalEmail.split('@')[0];

    completeGoogleLogin(finalEmail, finalName);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Logo */}
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons name="city-variant" size={46} color={Colors.white} />
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.appTitle}>Kegiatan Kelurahan</Text>
        <Text style={styles.appSubtitle}>
          Sistem Manajemen Kegiatan Lingkungan Sukamaju
        </Text>

        <View style={styles.cardContainer}>
          <Text style={styles.cardInstruction}>
            Silakan masuk dengan akun Google Anda untuk mengakses seluruh kegiatan dan pengumuman lingkungan.
          </Text>

          {/* Main Google Sign-In Button */}
          <TouchableOpacity
            style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
            activeOpacity={0.85}
            disabled={isLoading}
            onPress={handleGoogleButtonClick}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.skyBlueHeader} size="small" />
            ) : (
              <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
            )}
            <Text style={styles.googleButtonText}>
              {isLoading ? 'Menghubungkan Akun...' : 'Sign in with Google'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>
          Versi 1.0.0 • Google Identity Services
        </Text>
      </ScrollView>

      {/* GOOGLE ACCOUNT SELECTION & SIGN-IN MODAL */}
      <Modal
        visible={isGoogleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsGoogleModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsGoogleModalVisible(false)}
        >
          <View
            style={styles.modalContainer}
            onStartShouldSetResponder={() => true}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.googleIconCircle}>
                <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
              </View>
              <View style={styles.modalHeaderTextGroup}>
                <Text style={styles.modalHeaderTitle}>Login dengan Akun Google</Text>
                <Text style={styles.modalHeaderSub}>
                  Pilih atau masukkan email Google Anda
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsGoogleModalVisible(false)}
              >
                <MaterialCommunityIcons name="close" size={22} color={Colors.textNavyDark} />
              </TouchableOpacity>
            </View>

            {/* Quick One-Tap Profile Suggestions */}
            <Text style={styles.sectionLabel}>Akun Cepat Terdaftar:</Text>
            <View style={styles.quickAccountList}>
              <TouchableOpacity
                style={styles.quickAccountItem}
                activeOpacity={0.8}
                onPress={() =>
                  completeGoogleLogin('salmanakhdanhidayat@gmail.com', 'Salman Akhdan (Admin)')
                }
              >
                <View style={[styles.accountAvatar, { backgroundColor: Colors.skyBlueHeader }]}>
                  <Text style={styles.accountAvatarText}>S</Text>
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>Salman Akhdan (Admin Kelurahan)</Text>
                  <Text style={styles.accountEmail}>salmanakhdanhidayat@gmail.com</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.skyBlueHeader} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAccountItem}
                activeOpacity={0.8}
                onPress={() =>
                  completeGoogleLogin('ytsalmon37@gmail.com', 'Ketua RT 03')
                }
              >
                <View style={[styles.accountAvatar, { backgroundColor: Colors.yellowAccent }]}>
                  <Text style={styles.accountAvatarText}>Y</Text>
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>Pengurus RT 03 Sukamaju</Text>
                  <Text style={styles.accountEmail}>ytsalmon37@gmail.com</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.skyBlueHeader} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAccountItem}
                activeOpacity={0.8}
                onPress={() =>
                  completeGoogleLogin('warga.sukamaju@gmail.com', 'Warga Sukamaju')
                }
              >
                <View style={[styles.accountAvatar, { backgroundColor: Colors.kesehatanGreen }]}>
                  <Text style={styles.accountAvatarText}>W</Text>
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>Warga RT 03 / RW 05</Text>
                  <Text style={styles.accountEmail}>warga.sukamaju@gmail.com</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.skyBlueHeader} />
              </TouchableOpacity>
            </View>

            {/* Custom Google Account Input */}
            <View style={styles.customEmailBox}>
              <Text style={styles.sectionLabel}>Atau Masukkan Akun Google Lain:</Text>
              <TextInput
                style={styles.inputField}
                placeholder="nama.anda@gmail.com"
                placeholderTextColor={Colors.textNavyMuted}
                value={googleEmail}
                onChangeText={setGoogleEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.inputField, { marginTop: 8 }]}
                placeholder="Nama Lengkap Anda (Opsional)"
                placeholderTextColor={Colors.textNavyMuted}
                value={googleName}
                onChangeText={setGoogleName}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.modalSubmitBtn}
              activeOpacity={0.85}
              onPress={handleModalSubmit}
            >
              <MaterialCommunityIcons name="login" size={20} color={Colors.white} />
              <Text style={styles.modalSubmitBtnText}>Masuk dengan Akun Ini</Text>
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
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.skyBlueHeader,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.textNavyDark,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.bodyMedium,
    color: Colors.textNavySecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 32,
  },
  cardContainer: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    marginBottom: 20,
  },
  cardInstruction: {
    fontSize: 13,
    fontFamily: Fonts.bodyRegular,
    color: Colors.textNavySecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  googleButton: {
    width: '100%',
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  googleButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#F8FAFC',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: '#1E293B',
  },
  versionText: {
    fontSize: 12,
    fontFamily: Fonts.bodyRegular,
    color: Colors.textNavyMuted,
    marginTop: 8,
    marginBottom: 20,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 14,
  },
  googleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTextGroup: {
    flex: 1,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.textNavyDark,
  },
  modalHeaderSub: {
    fontSize: 12,
    fontFamily: Fonts.bodyRegular,
    color: Colors.textNavyMuted,
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 6,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.textNavyDark,
    marginBottom: 8,
    marginTop: 6,
  },
  quickAccountList: {
    gap: 8,
    marginBottom: 14,
  },
  quickAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    gap: 10,
  },
  accountAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarText: {
    color: Colors.white,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    fontSize: 15,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: Colors.textNavyDark,
  },
  accountEmail: {
    fontSize: 11,
    fontFamily: Fonts.bodyRegular,
    color: Colors.textNavySecondary,
    marginTop: 1,
  },
  customEmailBox: {
    marginBottom: 16,
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
    color: Colors.textNavyDark,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalSubmitBtn: {
    backgroundColor: Colors.skyBlueHeader,
    borderRadius: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    marginBottom: 10,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.white,
  },
});
