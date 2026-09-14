import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/theme';
import { UserRoleType } from '../types';

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

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, 12) + 4, paddingBottom: 12 },
      ]}
    >
      <View style={styles.titleSection}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="office-building" size={22} color={Colors.white} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.mainTitle} numberOfLines={1}>
            {titleOverride || 'Kegiatan Kelurahan'}
          </Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subTitle}>Sukamaju • RW 05</Text>
            <View style={styles.activeDot} />
            <Text style={styles.activeStatusText}>Aktif</Text>
          </View>
        </View>
      </View>

      {/* Badge Resmi Kelurahan - Elegan, Bersih, dan Berwibawa */}
      <View style={styles.officialBadge}>
        <MaterialCommunityIcons
          name="shield-check"
          size={15}
          color={Colors.skyBlueHeader}
        />
        <Text style={styles.officialBadgeText}>Portal Resmi</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.skyBlueHeader,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: Colors.skyBlueHeader,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.textNavyDark,
    letterSpacing: -0.3,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  subTitle: {
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
    color: Colors.textNavyMuted,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981', // green online dot
    marginHorizontal: 6,
  },
  activeStatusText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Fonts.bodyBold,
    color: '#059669',
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  officialBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: Colors.skyBlueHeader,
  },
});
