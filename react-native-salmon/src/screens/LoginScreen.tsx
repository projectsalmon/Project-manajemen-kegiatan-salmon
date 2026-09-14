import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { signInWithGoogleIdToken, ensureAuth } from '../services/firebase';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

const WEB_CLIENT_ID = '957812902323-sla7uv6hfrh0te1b3vre9jdu5nga452g.apps.googleusercontent.com';

try {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    offlineAccess: false,
  });
} catch (e) {
  console.warn('GoogleSignin configure error:', e);
}

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { currentUser, isLoggedIn, loginWithGoogleProfile, showToast } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const hasNavigatedRef = useRef(false);

  const navigateToMainTabs = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    try {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch {
      navigation.navigate('MainTabs');
    }
  }, [navigation]);

  const completeGoogleLogin = async (email: string, name: string, photoUrl?: string) => {
    try {
      await ensureAuth().catch((e) => console.warn('ensureAuth error:', e));
      await loginWithGoogleProfile({
        email: email.trim(),
        name: name.trim() || email.split('@')[0],
        photoUrl:
          photoUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=0369A1&color=fff`,
      });

      navigateToMainTabs();
    } catch (err: any) {
      setAuthError(err?.message || 'Gagal menyelesaikan otentikasi profil.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-login if session already active or via silent sign-in
  useEffect(() => {
    let isMounted = true;

    const checkExistingSession = async () => {
      // 1. If AppContext already restored a valid logged-in user
      if (isLoggedIn && currentUser && currentUser.email) {
        navigateToMainTabs();
        return;
      }

      // 2. Try silent sign in if Google account is still cached
      try {
        const hasPlay = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false });
        if (hasPlay) {
          const silentResult = await GoogleSignin.signInSilently();
          const user = silentResult.data?.user || (silentResult as any).user;
          if (user && user.email && isMounted) {
            await completeGoogleLogin(
              user.email,
              user.name || user.email.split('@')[0],
              user.photo || undefined
            );
            return;
          }
        }
      } catch (err) {
        // Silent sign-in not available or user logged out
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    checkExistingSession();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, currentUser?.email, navigateToMainTabs]);

  const handleGoogleButtonClick = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();

      if (signInResult.type === 'cancelled') {
        setIsLoading(false);
        showToast('Proses masuk dibatalkan.');
        return;
      }

      const idToken = signInResult.data?.idToken || (signInResult as any).idToken;
      const user = signInResult.data?.user || (signInResult as any).user;

      if (idToken) {
        await signInWithGoogleIdToken(idToken).catch((err: any) =>
          console.warn('Firebase signInWithGoogleIdToken:', err)
        );
      } else {
        await ensureAuth().catch((e) => console.warn('ensureAuth fallback:', e));
      }

      if (user && user.email) {
        await completeGoogleLogin(
          user.email,
          user.name || user.email.split('@')[0],
          user.photo || undefined
        );
      } else {
        throw new Error('Data profil akun Google tidak ditemukan.');
      }
    } catch (error: any) {
      setIsLoading(false);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        showToast('Proses masuk dibatalkan.');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        showToast('Sedang memproses masuk...');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setAuthError('Google Play Services tidak tersedia di perangkat Anda.');
      } else {
        setAuthError(
          `Gagal menghubungkan ke layanan Google (${error?.message || error?.code || 'Error'}). Pastikan perangkat terhubung ke internet.`
        );
      }
    }
  };

  if (isCheckingSession) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoImage}
          resizeMode="cover"
        />
        <Text style={[styles.appTitle, { marginTop: 14 }]}>Kegiatan Kelurahan</Text>
        <ActivityIndicator size="large" color={Colors.skyBlueHeader} style={{ marginTop: 24 }} />
        <Text style={[styles.appSubtitle, { marginTop: 12 }]}>Memeriksa status akun...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Official Logo */}
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoImage}
          resizeMode="cover"
        />

        {/* Title & Subtitle */}
        <Text style={styles.appTitle}>Kegiatan Kelurahan</Text>
        <Text style={styles.appSubtitle}>
          Sistem Manajemen Kegiatan Lingkungan Sukamaju
        </Text>

        <View style={styles.cardContainer}>
          <Text style={styles.cardInstruction}>
            Silakan masuk dengan akun Google Anda untuk mengakses seluruh kegiatan dan pengumuman lingkungan.
          </Text>

          {/* Error Banner if login fails */}
          {authError && (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.errorBannerText}>{authError}</Text>
            </View>
          )}

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
          Versi 1.0.0 • Google Identity Services & Cloud Firestore
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 22,
    marginBottom: 16,
    elevation: 4,
    shadowColor: Colors.skyBlueHeader,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    marginBottom: 28,
  },
  cardContainer: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 22,
    elevation: 3,
    shadowColor: '#000',
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
    color: '#991B1B',
    lineHeight: 17,
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
});
