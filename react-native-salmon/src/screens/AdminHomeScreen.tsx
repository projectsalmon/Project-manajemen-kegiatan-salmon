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
      {/* 0. APPLE IOS LARGE TITLE HEADER */}
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

      {/* 1. ADMIN HEADER BANNER (Apple Inset Card) */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroGreeting}>
            <View style={styles.badgeLabel}>
              <Text style={styles.badgeLabelText}>
                KELOLA {role}
              </Text>
            </View>
            <Text style={styles.heroUserName} numberOfLines={1}>
              {currentUser.name}
            </Text>
          </View>

          <View style={styles.heroIconBox}>
            <MaterialCommunityIcons
              name="shield-account"
              size={28}
              color={Colors.salmonPrimary}
            />
          </View>
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
            color={Colors.white}
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
            color={Colors.salmonPrimary}
          />
          <Text style={styles.secondaryActionText}>
            Terbitkan Pengumuman Resmi
          </Text>
        </TouchableOpacity>

        {/* Tombol Khusus Admin: Kelola Akun & Hak Akses Pengguna */}
        {(role === 'STAF_KELURAHAN' || isSuperAdmin(currentUser.email)) && (
          <TouchableOpacity
            style={styles.userManagementButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AdminUserManagementScreen')}
          >
            <View style={styles.userManagementIconBox}>
              <MaterialCommunityIcons
                name="account-cog"
                size={22}
                color={Colors.salmonPrimary}
              />
            </View>
            <View style={styles.userManagementTextCol}>
              <Text style={styles.userManagementTitle}>
                Kelola Akun & Hak Akses Warga
              </Text>
              <Text style={styles.userManagementSubtitle}>
                {allUsers?.length || 0} Akun Masuk • Atur Peran & Profil
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={Colors.onYellowContainer}
            />
          </TouchableOpacity>
        )}
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
    marginBottom: 16,
    paddingTop: 4,
  },
  largeTitleDate: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.iosTextMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  largeTitleText: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.iosTextPrimary,
    letterSpacing: -0.5,
  },
  heroCard: {
    backgroundColor: Colors.iosCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
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
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.salmonContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    backgroundColor: Colors.salmonContainer,
    borderWidth: 1,
    borderColor: Colors.salmonBorder,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  badgeLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.salmonPrimary,
  },
  heroUserName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.iosTextPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    backgroundColor: Colors.iosBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    padding: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.salmonPrimary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.iosTextSecondary,
    marginTop: 2,
  },
  actionButtonsCol: {
    gap: 10,
    marginBottom: 20,
  },
  primaryActionButton: {
    backgroundColor: Colors.salmonPrimary,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.salmonPrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  secondaryActionButton: {
    backgroundColor: Colors.iosCard,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.iosTextPrimary,
  },
  userManagementButton: {
    backgroundColor: Colors.iosCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userManagementIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.salmonContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userManagementTextCol: {
    flex: 1,
  },
  userManagementTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.iosTextPrimary,
  },
  userManagementSubtitle: {
    fontSize: 11,
    color: Colors.iosTextMuted,
    marginTop: 2,
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
