import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/theme';
import { UserRoleType } from '../types';
import { CivicLogo } from './CivicLogo';
import { useApp } from '../context/AppContext';

interface CivicTopBarProps {
  currentRole?: UserRoleType;
  roleTitle?: string;
  userName?: string;
  onRoleClick?: () => void;
  onProfileClick?: () => void;
  titleOverride?: string;
}

export const CivicTopBar: React.FC<CivicTopBarProps> = ({
  titleOverride,
}) => {
  const insets = useSafeAreaInsets();
  const { isOffline, syncOfflineData } = useApp();

  return (
    <View style={styles.rootWrapper}>
      <View
        style={[
          styles.container,
          { paddingTop: Math.max(insets.top, 12) + 4, paddingBottom: 12 },
        ]}
      >
        <View style={styles.titleSection}>
          <View style={styles.logoWrapper}>
            <CivicLogo size={36} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.mainTitle} numberOfLines={1}>
              {titleOverride || 'Komuniva'}
            </Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.subTitle}>Sukamaju • RW 05</Text>
              <View
                style={[
                  styles.activeDot,
                  isOffline && styles.offlineDot,
                ]}
              />
              <Text
                style={[
                  styles.activeStatusText,
                  isOffline && styles.offlineStatusText,
                ]}
              >
                {isOffline ? 'Tersimpan di HP' : 'Aktif'}
              </Text>
            </View>
          </View>
        </View>

        {/* Badge Status Kelurahan / Offline Sync */}
        <TouchableOpacity
          style={[
            styles.officialBadge,
            isOffline && styles.offlineBadge,
          ]}
          onPress={() => syncOfflineData(false)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isOffline ? 'cloud-sync-outline' : 'shield-check'}
            size={14}
            color={isOffline ? '#F59E0B' : Colors.salmonPrimary}
          />
          <Text
            style={[
              styles.officialBadgeText,
              isOffline && styles.offlineBadgeText,
            ]}
          >
            {isOffline ? 'Mode Offline' : 'Resmi'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ramping, Jelas & Elegan: Banner Pengingat Offline Cache */}
      {isOffline && (
        <View style={styles.offlineNoticeBar}>
          <MaterialCommunityIcons
            name="cloud-check-outline"
            size={14}
            color="#FEF3C7"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.offlineNoticeText} numberOfLines={1}>
            Mode Offline • Data kegiatan & warta tetap tersimpan di HP
          </Text>
          <TouchableOpacity
            style={styles.syncBtnPill}
            onPress={() => syncOfflineData(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.syncBtnPillText}>Perbarui</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootWrapper: {
    backgroundColor: Colors.navyDeep,
  },
  container: {
    backgroundColor: Colors.navyDeep,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: Colors.navyDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  logoWrapper: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.white,
    letterSpacing: -0.2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  subTitle: {
    fontSize: 12,
    fontFamily: Fonts.bodyRegular,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.iosSuccess,
    marginHorizontal: 6,
  },
  offlineDot: {
    backgroundColor: '#F59E0B',
  },
  activeStatusText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Fonts.bodyMedium,
    color: Colors.iosSuccess,
  },
  offlineStatusText: {
    color: '#F59E0B',
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  offlineBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  officialBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: Colors.salmonPrimary,
  },
  offlineBadgeText: {
    color: '#F59E0B',
  },
  offlineNoticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#78350F',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#92400E',
  },
  offlineNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#FEF3C7',
    fontFamily: Fonts.bodyMedium,
  },
  syncBtnPill: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  syncBtnPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: Fonts.headingBold,
  },
});
