import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontFamily } from '../constants/theme';
import { UserRoleType } from '../types';

interface CivicTopBarProps {
  currentRole: UserRoleType;
  roleTitle: string;
  userName: string;
  onRoleClick: () => void;
  onProfileClick: () => void;
  titleOverride?: string;
}

export const CivicTopBar: React.FC<CivicTopBarProps> = ({
  roleTitle,
  userName,
  onRoleClick,
  onProfileClick,
  titleOverride,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, 10) + 4, paddingBottom: 10 },
      ]}
    >
      <View style={styles.titleSection}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="city" size={20} color={Colors.white} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.mainTitle} numberOfLines={1}>
            {titleOverride || 'Kegiatan Kelurahan'}
          </Text>
          <Text style={styles.subTitle}>Sukamaju • RW 05</Text>
        </View>
      </View>

      <View style={styles.actionSection}>
        {/* Role Pill Switcher */}
        <TouchableOpacity
          style={styles.rolePill}
          activeOpacity={0.8}
          onPress={onRoleClick}
        >
          <View style={styles.roleDot} />
          <Text style={styles.roleText} numberOfLines={1}>
            {roleTitle}
          </Text>
          <MaterialCommunityIcons
            name="swap-vertical"
            size={16}
            color={Colors.onYellowContainer}
          />
        </TouchableOpacity>

        {/* Profile Avatar Button */}
        <TouchableOpacity
          style={styles.avatarButton}
          activeOpacity={0.8}
          onPress={onProfileClick}
        >
          <Text style={styles.avatarLetter}>
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.skyBlueHeader,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 16,
    fontFamily: FontFamily.headingBold,
    color: Colors.textNavyDark,
  },
  subTitle: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: Colors.textNavyMuted,
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.yellowContainer,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.onYellowContainer,
  },
  roleText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: Colors.onYellowContainer,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.skyBlueSurfaceVariant,
    borderWidth: 1,
    borderColor: Colors.skyBlueBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: Colors.skyBlueHeader,
  },
});
