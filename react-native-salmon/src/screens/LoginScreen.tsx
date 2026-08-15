import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Colors, UserRolesMeta } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { UserRoleType } from '../types';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = '957812902323-sla7uv6hfrh0te1b3vre9jdu5nga452g.apps.googleusercontent.com';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { loginWithGoogleProfile, switchRole, showToast } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<UserRoleType>('WARGA');
  const [showDemoRoles, setShowDemoRoles] = useState(false);

  const roles: UserRoleType[] = ['WARGA', 'RT', 'RW', 'POSYANDU', 'STAF_KELURAHAN'];

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
      showToast('Gagal terhubung dengan Google. Silakan coba lagi.');
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
        loginWithGoogleProfile({
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split('@')[0],
          photoUrl: googleUser.picture,
        });

        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } else {
        throw new Error('Data profil email tidak ditemukan');
      }
    } catch (error: any) {
      Alert.alert(
        'Gagal Login',
        'Tidak dapat mengambil informasi akun Google. Pastikan koneksi internet stabil.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignInClick = async () => {
    setIsLoading(true);
    try {
      if (promptAsync) {
        await promptAsync();
      } else {
        throw new Error('Google Auth belum siap');
      }
    } catch (e: any) {
      setIsLoading(false);
      showToast('Tidak dapat membuka login Google.');
    }
  };

  const handleDemoLogin = (role: UserRoleType) => {
    switchRole(role);
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Logo */}
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons name="city-variant" size={44} color={Colors.white} />
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.appTitle}>Kegiatan Kelurahan</Text>
        <Text style={styles.appSubtitle}>
          Sistem Manajemen Kegiatan Lingkungan Sukamaju
        </Text>

        <View style={styles.cardContainer}>
          {/* Main Google Sign-In Button */}
          <TouchableOpacity
            style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
            activeOpacity={0.85}
            disabled={isLoading || !request}
            onPress={handleGoogleSignInClick}
          >
            {isLoading ? (
              <ActivityIndicator color="#0369A1" size="small" />
            ) : (
              <MaterialCommunityIcons name="google" size={24} color="#DB4437" />
            )}
            <Text style={styles.googleButtonText}>
              {isLoading ? 'Membuka Akun Google...' : 'Sign in with Google'}
            </Text>
          </TouchableOpacity>

          {/* Toggle Demo Options */}
          <TouchableOpacity
            style={styles.demoToggleBtn}
            onPress={() => setShowDemoRoles(!showDemoRoles)}
          >
            <MaterialCommunityIcons
              name={showDemoRoles ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Colors.textNavySecondary}
            />
            <Text style={styles.demoToggleText}>
              {showDemoRoles ? 'Sembunyikan Opsi Demo' : 'Opsi Demo Cepat (Tanpa Login)'}
            </Text>
          </TouchableOpacity>

          {/* Role Cards (Demo/Offline Mode) */}
          {showDemoRoles && (
            <View style={{ width: '100%', marginTop: 12 }}>
              <Text style={styles.demoSectionTitle}>Pilih Peran Uji Coba:</Text>
              {roles.map((roleKey) => {
                const role = UserRolesMeta[roleKey];
                const isSelected = roleKey === selectedDemoRole;

                return (
                  <TouchableOpacity
                    key={roleKey}
                    style={[
                      styles.roleCard,
                      isSelected && styles.roleCardSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedDemoRole(roleKey);
                      handleDemoLogin(roleKey);
                    }}
                  >
                    <View style={styles.radioContainer}>
                      <View
                        style={[
                          styles.radioOuter,
                          isSelected && { borderColor: Colors.yellowHighlight },
                        ]}
                      >
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </View>

                    <View style={styles.roleDetails}>
                      <Text style={styles.roleTitle}>{role.title}</Text>
                      <Text style={[styles.roleSubtitle, { color: role.badgeColor }]}>
                        {role.subtitle}
                      </Text>
                      <Text style={styles.roleDesc}>{role.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <Text style={styles.versionText}>
          Versi 1.0.0 • Google Identity & Firebase Auth
        </Text>
      </ScrollView>
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
    width: 84,
    height: 84,
    borderRadius: 42,
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
    color: Colors.textNavyDark,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 14,
    color: Colors.textNavySecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 32,
  },
  cardContainer: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    marginBottom: 20,
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
    color: '#1E293B',
  },
  demoToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
    marginTop: 8,
  },
  demoToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textNavySecondary,
  },
  demoSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
    marginBottom: 8,
    marginTop: 4,
  },
  roleCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  roleCardSelected: {
    borderColor: Colors.yellowHighlight,
    borderWidth: 2,
    backgroundColor: Colors.white,
  },
  radioContainer: {
    marginRight: 10,
    marginTop: 2,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.textNavyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.yellowHighlight,
  },
  roleDetails: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  roleSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  roleDesc: {
    fontSize: 11,
    color: Colors.textNavySecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textNavyMuted,
    marginTop: 8,
    marginBottom: 20,
  },
});
