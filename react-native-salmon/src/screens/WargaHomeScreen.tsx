import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityCard } from '../components/ActivityCard';
import { AnnouncementCard } from '../components/AnnouncementCard';
import { VerificationModal } from '../components/VerificationModal';
import { CivicLogo } from '../components/CivicLogo';
import { CurvedHeroBanner } from '../components/CurvedHeroBanner';
import { Colors, Fonts } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { isItemPinned } from '../types';

interface WargaHomeScreenProps {
  navigation: any;
}

export const WargaHomeScreen: React.FC<WargaHomeScreenProps> = ({ navigation }) => {
  const { currentUser, activities, announcements, updateRsvpStatus } = useApp();
  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);

  // Warga only sees PUBLISHED activities and announcements
  const publishedActivities = activities.filter((a) => a.approvalStatus === 'PUBLISHED');
  const sortedActivities = [...publishedActivities].sort(
    (a, b) => (isItemPinned(b) ? 1 : 0) - (isItemPinned(a) ? 1 : 0)
  );
  const upcomingActivities = sortedActivities.slice(0, 4);

  const publishedAnnouncements = announcements.filter((a) => a.approvalStatus === 'PUBLISHED');
  const pinnedAnnouncements = publishedAnnouncements.filter((a) => isItemPinned(a));
  const displayAnnouncements =
    pinnedAnnouncements.length > 0
      ? pinnedAnnouncements
      : publishedAnnouncements.slice(0, 2);

  const attendingCount = publishedActivities.filter(
    (a) => a.userRsvpStatus === 'ATTENDING'
  ).length;

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. ULTRA MODERN CITIZEN HERO BANNER (MIDTRANS CURVED) */}
      <CurvedHeroBanner>
        <View style={styles.heroTopRow}>
          <View style={styles.avatarRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ProfilTab')}
              style={styles.avatarBorder}
            >
              {currentUser.avatarUrl ? (
                <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'W'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.greetingTextContainer}>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>{todayFormatted}</Text>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Warga Aktif</Text>
              </View>
              <Text style={styles.greetingName} numberOfLines={1}>
                {currentUser.name || 'Warga'}
              </Text>
              <Text style={styles.regionSubText}>
                {currentUser.isVerifiedWarga && (currentUser.rt || currentUser.rw)
                  ? `RT ${currentUser.rt || '-'} / RW ${currentUser.rw || '-'} • Kel. ${currentUser.kelurahan || 'Sukamaju'}`
                  : 'Belum Terverifikasi Wilayah'}
              </Text>
            </View>
          </View>

          {/* Minimalist Geometric Brand Logo */}
          <View style={styles.heroLogoWrapper}>
            <CivicLogo size={36} />
          </View>
        </View>

        {/* Dynamic Citizen Stats Pill Bar (Glassmorphic) */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <View style={styles.statIconBox}>
              <MaterialCommunityIcons name="calendar-check" size={18} color={Colors.salmonPrimary} />
            </View>
            <View>
              <Text style={styles.statValue}>{publishedActivities.length}</Text>
              <Text style={styles.statTitle}>Agenda Bulan Ini</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.18)' }]}>
              <MaterialCommunityIcons name="account-check" size={18} color={Colors.iosSuccess} />
            </View>
            <View>
              <Text style={[styles.statValue, { color: Colors.iosSuccess }]}>{attendingCount}</Text>
              <Text style={styles.statTitle}>Hadir (RSVP)</Text>
            </View>
          </View>
        </View>
      </CurvedHeroBanner>

      {/* UNVERIFIED RESIDENT ALERT BANNER (Soft Warm Warning) */}
      {!currentUser.isVerifiedWarga && (
        <TouchableOpacity
          style={styles.unverifiedBanner}
          activeOpacity={0.88}
          onPress={() => setIsVerificationModalVisible(true)}
        >
          <View style={styles.unverifiedBannerIcon}>
            <MaterialCommunityIcons name="shield-key-outline" size={22} color="#D97706" />
          </View>
          <View style={styles.unverifiedBannerContent}>
            <Text style={styles.unverifiedBannerTitle}>Belum Terverifikasi RT/RW</Text>
            <Text style={styles.unverifiedBannerText}>
              Ketik kode undangan wilayah Anda untuk membuka fitur konfirmasi kehadiran.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#D97706" />
        </TouchableOpacity>
      )}

      {/* 2. 4-GRID QUICK CIVIC ACTIONS (Sleek Modern Squircles) */}
      <View style={styles.quickGridContainer}>
        <TouchableOpacity
          style={styles.quickActionCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('KegiatanTab')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#FFEAE8' }]}>
            <MaterialCommunityIcons name="calendar-text-outline" size={22} color={Colors.salmonPrimary} />
          </View>
          <Text style={styles.quickActionLabel}>Daftar Kegiatan</Text>
          <Text style={styles.quickActionDesc}>Jadwal resmi RT/RW</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('PengumumanTab')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#FFF5E5' }]}>
            <MaterialCommunityIcons name="bullhorn-outline" size={22} color="#EA580C" />
          </View>
          <Text style={styles.quickActionLabel}>Warta Pengumuman</Text>
          <Text style={styles.quickActionDesc}>Info darurat & surat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('KalenderTab')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#EAF3FF' }]}>
            <MaterialCommunityIcons name="calendar-month-outline" size={22} color="#007AFF" />
          </View>
          <Text style={styles.quickActionLabel}>Kalender Agenda</Text>
          <Text style={styles.quickActionDesc}>Pantau hari & waktu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ProfilTab')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#E8F9ED' }]}>
            <MaterialCommunityIcons name="badge-account-outline" size={22} color="#16A34A" />
          </View>
          <Text style={styles.quickActionLabel}>KTP Digital Warga</Text>
          <Text style={styles.quickActionDesc}>Identitas & kontak</Text>
        </TouchableOpacity>
      </View>

      {/* 3. PINNED ANNOUNCEMENTS */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionBullet, { backgroundColor: '#EA580C' }]} />
          <Text style={styles.sectionTitle}>Warta Terkini</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('PengumumanTab')}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>Lihat Semua</Text>
        </TouchableOpacity>
      </View>

      {displayAnnouncements.map((ann) => (
        <AnnouncementCard
          key={ann.id}
          announcement={ann}
          onClick={() => navigation.navigate('PengumumanTab')}
        />
      ))}

      {/* 4. UPCOMING ACTIVITIES */}
      <View style={[styles.sectionHeader, { marginTop: 22 }]}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionBullet, { backgroundColor: Colors.salmonPrimary }]} />
          <View>
            <Text style={styles.sectionTitle}>Agenda Kegiatan Warga</Text>
            <Text style={styles.sectionSubtitle}>
              Khusus Lingkungan RT {currentUser.rt || '03'} & RW {currentUser.rw || '05'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('KegiatanTab')}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>Lihat Semua</Text>
        </TouchableOpacity>
      </View>

      {upcomingActivities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          onCardClick={() =>
            navigation.navigate('ActivityDetailScreen', { activityId: activity.id })
          }
          onRsvpClick={(newStatus) => updateRsvpStatus(activity.id, newStatus)}
        />
      ))}

      {/* Verification Modal */}
      <VerificationModal
        visible={isVerificationModalVisible}
        onClose={() => setIsVerificationModalVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 110,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECEEF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarBorder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFEAE8',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.salmonPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.salmonContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.salmonPrimary,
  },
  greetingTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.2,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.iosSuccess,
    marginHorizontal: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.iosSuccess,
  },
  greetingName: {
    fontSize: 19,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.white,
    letterSpacing: -0.3,
  },
  regionSubText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
    fontWeight: '500',
  },
  heroLogoWrapper: {
    paddingLeft: 4,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.salmonWarm,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 10,
  },
  unverifiedBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  unverifiedBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unverifiedBannerContent: {
    flex: 1,
  },
  unverifiedBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  unverifiedBannerText: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 15,
  },
  quickGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  quickActionCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: '#1C1C1E',
    marginBottom: 2,
  },
  quickActionDesc: {
    fontSize: 11,
    color: '#8E8E93',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionBullet: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.salmonPrimary,
  },
});
