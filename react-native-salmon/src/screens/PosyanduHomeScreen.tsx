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
import { CurvedHeroBanner } from '../components/CurvedHeroBanner';
import { Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

interface PosyanduHomeScreenProps {
  navigation: any;
}

export const PosyanduHomeScreen: React.FC<PosyanduHomeScreenProps> = ({ navigation }) => {
  const { currentUser, activities, updateRsvpStatus } = useApp();

  const posyanduActivities = activities.filter(
    (a) => a.category === 'POSYANDU' || a.category === 'KESEHATAN'
  );

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. MIDTRANS-INSPIRED CURVED HERO BANNER */}
      <CurvedHeroBanner>
        <View style={styles.largeTitleContainer}>
          <Text style={styles.largeTitleDate}>{todayFormatted.toUpperCase()}</Text>
          <Text style={styles.largeTitleText}>Dashboard Posyandu</Text>
        </View>

        <View style={styles.heroHeader}>
          <View style={styles.heroGreeting}>
            <View style={styles.badgeLabel}>
              <View style={styles.livePosyanduDot} />
              <Text style={styles.badgeLabelText}>KADER KESEHATAN</Text>
            </View>
            <Text style={styles.heroUserName} numberOfLines={1}>
              {currentUser.name}
            </Text>
          </View>

          <View style={styles.heroIconBox}>
            <MaterialCommunityIcons
              name="heart-pulse"
              size={24}
              color={Colors.salmonPrimary}
            />
          </View>
        </View>

        {/* Posyandu Metrics Grid with Glassmorphism */}
        <View style={styles.metricsRow}>
          <View style={styles.metricPill}>
            <Text style={[styles.metricNumber, { color: Colors.iosSuccess }]}>60</Text>
            <Text style={styles.metricLabel} numberOfLines={1}>
              Balita Terdata
            </Text>
          </View>

          <View style={styles.metricPill}>
            <Text style={[styles.metricNumber, { color: '#38BDF8' }]}>42</Text>
            <Text style={styles.metricLabel} numberOfLines={1}>
              Peserta Imunisasi
            </Text>
          </View>

          <View style={styles.metricPill}>
            <Text style={[styles.metricNumber, { color: Colors.salmonPrimary }]}>
              {posyanduActivities.length}
            </Text>
            <Text style={styles.metricLabel} numberOfLines={1}>
              Jadwal Aktif
            </Text>
          </View>
        </View>
      </CurvedHeroBanner>

      {/* 2. PROMINENT ACTION CTA BUTTON */}
      <TouchableOpacity
        style={styles.createButton}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('CreateEditActivityScreen', { initialCategory: 'POSYANDU' })
        }
      >
        <MaterialCommunityIcons
          name="plus-circle"
          size={20}
          color={Colors.white}
        />
        <Text style={styles.createButtonText}>
          Buat Jadwal Posyandu / Kesehatan
        </Text>
      </TouchableOpacity>

      {/* 3. HEALTH PROGRAMS QUICK CARDS */}
      <Text style={styles.sectionHeading}>Program Layanan Kesehatan Posyandu</Text>

      <View style={styles.programsRow}>
        <View style={[styles.programCard, { borderColor: Colors.posyanduPinkContainer }]}>
          <MaterialCommunityIcons
            name="baby-face-outline"
            size={24}
            color={Colors.posyanduPink}
          />
          <Text style={styles.programTitle}>Posyandu Balita</Text>
          <Text style={styles.programSubtitle}>Timbang & Vitamin A</Text>
        </View>

        <View style={[styles.programCard, { borderColor: Colors.kesehatanGreenContainer }]}>
          <MaterialCommunityIcons
            name="human-cane"
            size={24}
            color={Colors.kesehatanGreen}
          />
          <Text style={styles.programTitle}>Posyandu Lansia</Text>
          <Text style={styles.programSubtitle}>Cek Tensi & Gula</Text>
        </View>
      </View>

      {/* 4. SCHEDULED ACTIVITIES LIST */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeading}>Jadwal Kegiatan Posyandu & Kesehatan</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('KegiatanTab')}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>Lihat Semua</Text>
        </TouchableOpacity>
      </View>

      {posyanduActivities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          onCardClick={() =>
            navigation.navigate('ActivityDetailScreen', { activityId: activity.id })
          }
          onRsvpClick={(newStatus) => updateRsvpStatus(activity.id, newStatus)}
          onEditClick={() =>
            navigation.navigate('CreateEditActivityScreen', { editId: activity.id })
          }
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.iosBackground,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 110,
  },
  largeTitleContainer: {
    marginBottom: 14,
    paddingTop: 2,
  },
  largeTitleDate: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  largeTitleText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
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
  badgeLabel: {
    backgroundColor: 'rgba(255, 107, 107, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.35)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  livePosyanduDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.salmonPrimary,
  },
  badgeLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.salmonWarm,
    letterSpacing: 0.5,
  },
  heroUserName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    padding: 12,
  },
  metricNumber: {
    fontSize: 21,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  createButton: {
    backgroundColor: Colors.salmonPrimary,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
    shadowColor: Colors.salmonPrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.iosTextPrimary,
    marginBottom: 10,
  },
  programsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  programCard: {
    flex: 1,
    backgroundColor: Colors.iosCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
  },
  programTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
    marginTop: 6,
  },
  programSubtitle: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
});
