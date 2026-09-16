import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/theme';
import { UserRoleType } from '../types';
import { CivicLogo } from './CivicLogo';

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
        <View style={styles.logoWrapper}>
          <CivicLogo size={34} rotation="-10deg" />
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
          size={14}
          color={Colors.salmonPrimary}
        />
        <Text style={styles.officialBadgeText}>Resmi</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.iosCard,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.iosBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
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
    color: Colors.iosTextPrimary,
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
    color: Colors.iosTextMuted,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.iosSuccess,
    marginHorizontal: 6,
  },
  activeStatusText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Fonts.bodyMedium,
    color: Colors.iosSuccess,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.salmonContainer,
    borderWidth: 1,
    borderColor: '#FFD5D2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  officialBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: Colors.salmonPrimary,
  },
});
