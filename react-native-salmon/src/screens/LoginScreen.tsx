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
import { Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = '957812902323-sla7uv6hfrh0te1b3vre9jdu5nga452g.apps.googleusercontent.com';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { loginWithGoogleProfile, showToast } = useApp();
  const [isLoading, setIsLoading] = useState(false);

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

  const handleDirectEnter = () => {
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
          <MaterialCommunityIcons name="city-variant" size={46} color={Colors.white} />
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

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Direct Entry Button */}
          <TouchableOpacity
            style={styles.directEnterButton}
            activeOpacity={0.85}
            onPress={handleDirectEnter}
          >
            <MaterialCommunityIcons name="arrow-right-circle-outline" size={22} color={Colors.onYellowContainer} />
            <Text style={styles.directEnterButtonText}>Masuk Langsung ke Beranda</Text>
          </TouchableOpacity>
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
    padding: 22,
    alignItems: 'center',
    elevation: 3,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.skyBlueSurfaceVariant,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: Colors.textNavyMuted,
    fontWeight: '600',
  },
  directEnterButton: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.yellowContainer,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.yellowBorderLis,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  directEnterButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textNavyMuted,
    marginTop: 8,
    marginBottom: 20,
  },
});
