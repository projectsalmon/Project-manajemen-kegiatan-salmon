import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const ONBOARDING_STORAGE_KEY = '@salmon_has_seen_onboarding';

interface OnboardingSlide {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconBg: string;
  iconColor: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'calendar-clock-outline',
    iconBg: '#FFEAE8',
    iconColor: '#FF6B6B',
    badge: 'REAL-TIME & TERPERCAYA',
    title: 'Agenda & Pengumuman',
    highlight: 'Kegiatan Warga Terkini',
    description:
      'Pantau jadwal kerja bakti, rapat warga RT/RW, kegiatan posyandu, dan pengumuman penting lingkungan secara langsung dan akurat.',
  },
  {
    id: '2',
    icon: 'image-multiple-outline',
    iconBg: '#EAF3FF',
    iconColor: '#007AFF',
    badge: 'ARSIP BERSAMA LINGKUNGAN',
    title: 'Galeri Dokumentasi',
    highlight: 'Foto & Video Terpadu',
    description:
      'Rekam jejak dan kenangan gotong royong warga tersimpan rapi dan aman di Google Drive, mudah dilihat kembali oleh seluruh warga.',
  },
  {
    id: '3',
    icon: 'widgets-outline',
    iconBg: '#E8F9ED',
    iconColor: '#34C759',
    badge: 'AKSES INSTAN DARI HP',
    title: 'Widget Layar Utama',
    highlight: 'Pantau Tanpa Buka Aplikasi',
    description:
      'Cek agenda kegiatan terdekat dan pengumuman penting langsung dari layar depan smartphone Anda dengan widget interaktif khas iOS.',
  },
];

interface OnboardingScreenProps {
  navigation: any;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleFinishOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch (e) {
      console.warn('Error saving onboarding flag:', e);
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'LoginScreen' }],
    });
  };

  const handleNextSlide = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleFinishOnboarding();
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index >= 0 && index < SLIDES.length && index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. TOP BAR: SKIP BUTTON */}
      <View style={styles.topBar}>
        <View style={styles.appBrandRow}>
          <View style={styles.appBrandDot} />
          <Text style={styles.appBrandText}>SI-KELURAHAN</Text>
        </View>

        {currentIndex < SLIDES.length - 1 ? (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleFinishOnboarding}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Lewati</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.iosTextMuted} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* 2. CAROUSEL SLIDES */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={styles.slideContainer}>
            {/* Illustration / Icon Box */}
            <View style={styles.illustrationCard}>
              <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
                <MaterialCommunityIcons name={item.icon} size={76} color={item.iconColor} />
              </View>
            </View>

            {/* Content Text Box */}
            <View style={styles.textContent}>
              <View style={[styles.badgePill, { backgroundColor: item.iconBg }]}>
                <Text style={[styles.badgePillText, { color: item.iconColor }]}>
                  {item.badge}
                </Text>
              </View>

              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideHighlight}>{item.highlight}</Text>
              <Text style={styles.slideDesc}>{item.description}</Text>
            </View>
          </View>
        )}
      />

      {/* 3. BOTTOM CONTROL BAR: DYNAMIC DOT INDICATOR & ACTION BUTTON */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* iOS Dynamic Dot Indicator */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <View
                key={`dot-${idx}`}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            currentIndex === SLIDES.length - 1
              ? styles.actionButtonFinal
              : styles.actionButtonNext,
          ]}
          activeOpacity={0.88}
          onPress={handleNextSlide}
        >
          <Text
            style={[
              styles.actionButtonText,
              currentIndex === SLIDES.length - 1
                ? styles.actionButtonTextFinal
                : styles.actionButtonTextNext,
            ]}
          >
            {currentIndex === SLIDES.length - 1 ? 'Mulai Sekarang' : 'Lanjutkan'}
          </Text>
          <MaterialCommunityIcons
            name={currentIndex === SLIDES.length - 1 ? 'arrow-right' : 'chevron-right'}
            size={20}
            color={currentIndex === SLIDES.length - 1 ? '#FFFFFF' : Colors.salmonPrimary}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.iosBackground,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  appBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appBrandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.salmonPrimary,
  },
  appBrandText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.iosTextMuted,
    letterSpacing: 1.2,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 142, 147, 0.12)',
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Fonts.bodyMedium,
    color: Colors.iosTextSecondary,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationCard: {
    width: SCREEN_WIDTH - 48,
    height: SCREEN_WIDTH * 0.7,
    backgroundColor: Colors.iosCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    letterSpacing: 0.8,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.iosTextPrimary,
    textAlign: 'center',
    lineHeight: 32,
  },
  slideHighlight: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.salmonPrimary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 14,
  },
  slideDesc: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.iosTextSecondary,
    fontFamily: Fonts.bodyRegular,
    textAlign: 'center',
    maxWidth: '92%',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
    backgroundColor: Colors.salmonPrimary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(60, 60, 67, 0.22)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    width: '100%',
  },
  actionButtonNext: {
    backgroundColor: Colors.iosCard,
    borderWidth: 1.5,
    borderColor: Colors.salmonPrimary,
  },
  actionButtonFinal: {
    backgroundColor: Colors.salmonPrimary,
    shadowColor: Colors.salmonPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
  },
  actionButtonTextNext: {
    color: Colors.salmonPrimary,
  },
  actionButtonTextFinal: {
    color: '#FFFFFF',
  },
});
