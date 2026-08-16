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
import { Colors, FontFamily } from '../constants/theme';
import { useApp } from '../context/AppContext';

interface AdminHomeScreenProps {
  navigation: any;
}

export const AdminHomeScreen: React.FC<AdminHomeScreenProps> = ({ navigation }) => {
  const {
    currentUser,
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
      {/* 1. ADMIN HEADER BANNER */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroGreeting}>
            <View style={styles.badgeLabel}>
              <Text style={styles.badgeLabelText}>
                DASHBOARD KELOLA {role}
              </Text>
            </View>
            <Text style={styles.heroUserName} numberOfLines={1}>
              {currentUser.name}
            </Text>
          </View>

          <MaterialCommunityIcons
            name="shield-account"
            size={36}
            color={Colors.white}
          />
        </View>

        {/* 3 Stat Cards Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{activeActivities.length}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              Terbit Warga
            </Text>
          </View>

          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{pendingCount}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              Butuh ACC
            </Text>
          </View>

          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{totalRsvp}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              Total RSVP
            </Text>
          </View>
        </View>
      </View>

      {/* 2. ACTION BUTTONS */}
      <View style={styles.actionButtonsCol}>
        <TouchableOpacity
          style={styles.primaryActionButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CreateEditActivityScreen')}
        >
          <MaterialCommunityIcons
            name="plus-circle"
            size={20}
            color={Colors.onYellowContainer}
          />
          <Text style={styles.primaryActionText}>Buat Kegiatan Baru</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('PengumumanTab')}
        >
          <MaterialCommunityIcons
            name="bullhorn"
            size={18}
            color={Colors.skyBlueHeader}
          />
          <Text style={styles.secondaryActionText}>
            Terbitkan Pengumuman Resmi
          </Text>
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
    backgroundColor: Colors.skyBlueBackground,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 110,
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
    marginBottom: 14,
  },
  heroGreeting: {
    flex: 1,
    marginRight: 8,
  },
  badgeLabel: {
    backgroundColor: Colors.yellowContainer,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  badgeLabelText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: Colors.onYellowContainer,
  },
  heroUserName: {
    fontSize: 20,
    fontFamily: FontFamily.headingExtraBold,
    color: Colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 10,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: FontFamily.headingExtraBold,
    color: Colors.white,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  actionButtonsCol: {
    gap: 8,
    marginBottom: 18,
  },
  primaryActionButton: {
    backgroundColor: Colors.yellowHighlight,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.onYellowContainer,
  },
  secondaryActionButton: {
    backgroundColor: Colors.white,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.skyBlueHeader,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.skyBlueHeader,
  },
  pipelineSection: {
    marginBottom: 18,
  },
  pipelineSectionTitle: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    color: Colors.textNavyDark,
    marginBottom: 8,
  },
  pipelineCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 14,
    marginVertical: 4,
    borderWidth: 1.5,
    borderColor: Colors.yellowBorderLis,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  pipelineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pipelineStatusBadge: {
    backgroundColor: Colors.yellowContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pipelineStatusBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: Colors.onYellowContainer,
  },
  pipelineDateText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: Colors.textNavyMuted,
  },
  pipelineTitle: {
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
    color: Colors.textNavyDark,
  },
  pipelineAuthor: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textNavySecondary,
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
    borderColor: Colors.urgentRed,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rejectButtonText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: Colors.urgentRed,
  },
  approveButton: {
    backgroundColor: Colors.yellowHighlight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  approveButtonText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: Colors.onYellowContainer,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    color: Colors.textNavyDark,
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: Colors.skyBlueHeader,
  },
});
