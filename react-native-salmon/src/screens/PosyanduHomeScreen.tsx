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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. HERO POSYANDU BANNER */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroGreeting}>
            <View style={styles.badgeLabel}>
              <Text style={styles.badgeLabelText}>DASHBOARD KADER POSYANDU</Text>
            </View>
            <Text style={styles.heroUserName} numberOfLines={1}>
              {currentUser.name}
            </Text>
          </View>

          <MaterialCommunityIcons
            name="heart-pulse"
            size={36}
            color={Colors.white}
          />
        </View>

        {/* Posyandu Metrics Grid */}
        <View style={styles.metricsRow}>
          <View style={styles.metricPill}>
            <Text style={styles.metricNumber}>60</Text>
            <Text style={styles.metricLabel} numberOfLines={1}>
              Balita Terdata
            </Text>
          </View>

          <View style={styles.metricPill}>
            <Text style={styles.metricNumber}>42</Text>
            <Text style={styles.metricLabel} numberOfLines={1}>
              Peserta Imunisasi
            </Text>
          </View>

          <View style={styles.metricPill}>
            <Text style={styles.metricNumber}>{posyanduActivities.length}</Text>
            <Text style={styles.metricLabel} numberOfLines={1}>
              Jadwal Posyandu
            </Text>
          </View>
        </View>
      </View>

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
          color={Colors.onYellowContainer}
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
    backgroundColor: Colors.skyBlueBackground,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 110,
  },
  heroCard: {
    backgroundColor: Colors.posyanduPink,
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
  badgeLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  badgeLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  heroUserName: {
    fontSize: 21,
    fontWeight: '800',
    color: Colors.white,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 12,
    padding: 10,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  metricLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  createButton: {
    backgroundColor: Colors.yellowHighlight,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    gap: 8,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textNavyDark,
    marginBottom: 10,
  },
  programsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  programCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
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
