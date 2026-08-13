import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityCard } from '../components/ActivityCard';
import { AnnouncementCard } from '../components/AnnouncementCard';
import { Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

interface WargaHomeScreenProps {
  navigation: any;
}

export const WargaHomeScreen: React.FC<WargaHomeScreenProps> = ({ navigation }) => {
  const { currentUser, activities, announcements, updateRsvpStatus } = useApp();

  // Warga only sees PUBLISHED activities and announcements
  const publishedActivities = activities.filter((a) => a.approvalStatus === 'PUBLISHED');
  const upcomingActivities = publishedActivities.slice(0, 4);

  const publishedAnnouncements = announcements.filter((a) => a.approvalStatus === 'PUBLISHED');
  const pinnedAnnouncements = publishedAnnouncements.filter((a) => a.isPinned);
  const displayAnnouncements =
    pinnedAnnouncements.length > 0
      ? pinnedAnnouncements
      : publishedAnnouncements.slice(0, 2);

  const attendingCount = publishedActivities.filter(
    (a) => a.userRsvpStatus === 'ATTENDING'
  ).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. HERO WELCOME CARD */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroGreeting}>
            <Text style={styles.heroSubText}>Selamat Datang, Bapak/Ibu</Text>
            <Text style={styles.heroUserName} numberOfLines={1}>
              {currentUser.name}
            </Text>
          </View>

          <View style={styles.rtRwBadge}>
            <Text style={styles.rtRwBadgeText}>
              RT {currentUser.rt} / RW {currentUser.rw}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{publishedActivities.length}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              Kegiatan Bulan Ini
            </Text>
          </View>

          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{attendingCount}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              Status RSVP Hadir
            </Text>
          </View>
        </View>
      </View>

      {/* 2. QUICK SHORTCUTS ROW */}
      <View style={styles.shortcutsRow}>
        <TouchableOpacity
          style={styles.shortcutButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('KegiatanTab')}
        >
          <MaterialCommunityIcons
            name="calendar-text"
            size={20}
            color={Colors.skyBlueHeader}
          />
          <Text style={styles.shortcutText} numberOfLines={1}>
            Semua Kegiatan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CalendarScreen')}
        >
          <MaterialCommunityIcons
            name="calendar-month"
            size={20}
            color={Colors.skyBlueHeader}
          />
          <Text style={styles.shortcutText} numberOfLines={1}>
            Kalender Agenda
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. PINNED ANNOUNCEMENTS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Pengumuman Penting</Text>
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
      <View style={[styles.sectionHeader, { marginTop: 16 }]}>
        <View>
          <Text style={styles.sectionTitle}>Kegiatan Mendatang</Text>
          <Text style={styles.sectionSubtitle}>Wilayah RT 03 & RW 05</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.skyBlueBackground,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: Colors.skyBlueHeader,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroGreeting: {
    flex: 1,
    marginRight: 8,
  },
  heroSubText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  heroUserName: {
    fontSize: 21,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 2,
  },
  rtRwBadge: {
    backgroundColor: Colors.yellowContainer,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  rtRwBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  shortcutButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  shortcutText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
    flexShrink: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    marginTop: 1,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
});
