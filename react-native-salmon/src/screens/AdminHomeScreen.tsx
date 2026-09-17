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
import { Colors, Fonts } from '../constants/theme';
import { useApp } from '../context/AppContext';

interface AdminHomeScreenProps {
  navigation: any;
}

export const AdminHomeScreen: React.FC<AdminHomeScreenProps> = ({ navigation }) => {
  const {
    currentUser,
    allUsers = [],
    isSuperAdmin,
    activities,
    updateRsvpStatus,
    rwApproveActivity,
    rwRejectActivity,
    adminApproveActivity,
    adminRejectActivity,
  } = useApp();

  const role = currentUser.role;

  const pendingRwApproval = activities.filter(
    (a) => a.approvalStatus === 'WAITING_RW_APPROVAL'
  );
  const pendingAdminApproval = activities.filter(
    (a) => a.approvalStatus === 'WAITING_ADMIN_APPROVAL'
  );
  const activeActivities = activities.filter(
    (a) => a.approvalStatus === 'PUBLISHED'
  );

  const pendingCount =
    role === 'RW' ? pendingRwApproval.length : pendingAdminApproval.length;
  const totalRsvp = activeActivities.reduce(
    (sum, a) => sum + (a.confirmedCount || 0),
    0
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. MIDTRANS-INSPIRED CURVED HERO BANNER */}
      <CurvedHeroBanner>
        <View style={styles.largeTitleContainer}>
          <Text style={styles.largeTitleDate}>
            {new Date()
              .toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })
              .toUpperCase()}
          </Text>
          <Text style={styles.largeTitleText}>
            Dashboard {role === 'RW' ? 'Rukun Warga' : role === 'RT' ? 'Rukun Tetangga' : 'Kelurahan'}
          </Text>
        </View>

        <View style={styles.heroHeader}>
          <View style={styles.heroGreeting}>
            <View style={styles.badgeLabel}>
              <View style={styles.liveAdminDot} />
              <Text style={styles.badgeLabelText}>
                PENGURUS {role}
              </Text>
            </View>
            <Text style={styles.heroUserName} numberOfLines={1}>
              {currentUser.name}
            </Text>
          </View>

          <View style={styles.heroIconBox}>
            <MaterialCommunityIcons
              name="shield-account"
              size={24}
              color={Colors.white}
            />
          </View>
        </View>

        {/* 3 Stat Cards Grid with Glassmorphism */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={[styles.statNumber, { color: Colors.iosSuccess }]}>
              {activeActivities.length}
            </Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              Terbit Warga
            </Text>
          </View>

          <View style={styles.statPill}>
            <Text style={[styles.statNumber, { color: Colors.iosWarning }]}>
              {pendingCount}
            </Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              Butuh ACC
            </Text>
          </View>

          <View style={styles.statPill}>
            <Text style={[styles.statNumber, { color: Colors.salmonPrimary }]}>
              {totalRsvp}
            </Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              Total RSVP
            </Text>
          </View>
        </View>
      </CurvedHeroBanner>

      {/* 2. 4-GRID QUICK ADMIN ACTIONS (Sleek Modern Squircles 2x2) */}
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
          <Text style={styles.quickActionDesc}>Kelola & agenda wilayah</Text>
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
          <Text style={styles.quickActionDesc}>Terbit & pantau warta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AdminUserManagementScreen')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#E8F1FF' }]}>
            <MaterialCommunityIcons name="account-cog-outline" size={22} color="#0066F6" />
          </View>
          <Text style={styles.quickActionLabel}>Kelola Akun Warga</Text>
          <Text style={styles.quickActionDesc}>
            {allUsers?.length || 0} Akun • Atur akses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('KalenderTab')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#E8F9ED' }]}>
            <MaterialCommunityIcons name="calendar-month-outline" size={22} color="#16A34A" />
          </View>
          <Text style={styles.quickActionLabel}>Kalender Agenda</Text>
          <Text style={styles.quickActionDesc}>Pantau jadwal bulanan</Text>
        </TouchableOpacity>
      </View>

      {/* 3. MULTI-TIER APPROVAL PIPELINE FOR RW */}
      {role === 'RW' && pendingRwApproval.length > 0 && (
        <View style={styles.pipelineSection}>
          <Text style={styles.pipelineSectionTitle}>
            Pengajuan Kegiatan RT Menunggu ACC RW ({pendingRwApproval.length})
          </Text>

          {pendingRwApproval.map((act) => (
            <View key={act.id} style={styles.pipelineCard}>
              <View style={styles.pipelineCardHeader}>
                <View style={styles.pipelineStatusBadge}>
                  <Text style={styles.pipelineStatusBadgeText}>
                    Menunggu Persetujuan RW
                  </Text>
                </View>
                <Text style={styles.pipelineDateText}>{act.formattedDate}</Text>
              </View>

              <Text style={styles.pipelineTitle}>{act.title}</Text>
              <Text style={styles.pipelineAuthor}>
                Pengaju: {act.organizerName} ({act.organizerRole})
              </Text>

              <View style={styles.pipelineActionButtons}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => rwRejectActivity(act.id)}
                >
                  <Text style={styles.rejectButtonText}>Tolak</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => rwApproveActivity(act.id)}
                >
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color={Colors.onYellowContainer}
                  />
                  <Text style={styles.approveButtonText}>ACC ke Kelurahan</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 4. MULTI-TIER APPROVAL PIPELINE FOR STAF KELURAHAN */}
      {role === 'STAF_KELURAHAN' && pendingAdminApproval.length > 0 && (
        <View style={styles.pipelineSection}>
          <Text style={styles.pipelineSectionTitle}>
            Pengajuan Disetujui RW Menunggu ACC Kelurahan (
            {pendingAdminApproval.length})
          </Text>

          {pendingAdminApproval.map((act) => (
            <View
              key={act.id}
              style={[styles.pipelineCard, { borderColor: Colors.skyBlueHeader }]}
            >
              <View style={styles.pipelineCardHeader}>
                <View
                  style={[
                    styles.pipelineStatusBadge,
                    { backgroundColor: Colors.skyBlueSurfaceVariant },
                  ]}
                >
                  <Text
                    style={[
                      styles.pipelineStatusBadgeText,
                      { color: Colors.skyBlueHeader },
                    ]}
                  >
                    Menunggu Persetujuan Kelurahan
                  </Text>
                </View>
                <Text style={styles.pipelineDateText}>{act.formattedDate}</Text>
              </View>

              <Text style={styles.pipelineTitle}>{act.title}</Text>
              <Text style={styles.pipelineAuthor}>
                Pengaju: {act.organizerName} ({act.organizerRole})
              </Text>

              <View style={styles.pipelineActionButtons}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => adminRejectActivity(act.id)}
                >
                  <Text style={styles.rejectButtonText}>Tolak</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => adminApproveActivity(act.id)}
                >
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color={Colors.onYellowContainer}
                  />
                  <Text style={styles.approveButtonText}>
                    Setujui & Terbitkan
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 5. PUBLISHED ACTIVITIES OVERVIEW */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeading}>Seluruh Agenda Terbit</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('KegiatanTab')}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>Kelola Semua</Text>
        </TouchableOpacity>
      </View>

      {activeActivities.slice(0, 4).map((activity) => (
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
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 102, 246, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 246, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
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
  liveAdminDot: {
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
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    padding: 12,
  },
  statNumber: {
    fontSize: 21,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
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
  pipelineSection: {
    marginBottom: 18,
  },
  pipelineSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.iosTextPrimary,
    marginBottom: 8,
  },
  pipelineCard: {
    backgroundColor: Colors.iosCard,
    borderRadius: 16,
    padding: 14,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  pipelineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pipelineStatusBadge: {
    backgroundColor: Colors.salmonContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pipelineStatusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.salmonPrimary,
  },
  pipelineDateText: {
    fontSize: 11,
    color: Colors.iosTextMuted,
  },
  pipelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.iosTextPrimary,
  },
  pipelineAuthor: {
    fontSize: 12,
    color: Colors.iosTextSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  pipelineActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rejectButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  approveButton: {
    backgroundColor: Colors.salmonPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  approveButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.iosTextPrimary,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.salmonPrimary,
  },
});
