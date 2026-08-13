import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, UserRolesMeta } from '../constants/theme';
import { UserRoleType } from '../types';

interface RoleSwitchSheetProps {
  visible: boolean;
  currentRole: UserRoleType;
  onRoleSelected: (role: UserRoleType) => void;
  onDismiss: () => void;
}

export const RoleSwitchSheet: React.FC<RoleSwitchSheetProps> = ({
  visible,
  currentRole,
  onRoleSelected,
  onDismiss,
}) => {
  const roles: UserRoleType[] = ['WARGA', 'RT', 'RW', 'POSYANDU', 'STAF_KELURAHAN'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetTitle}>Pilih Peran Pengguna</Text>
                  <Text style={styles.sheetSubtitle}>
                    Ubah sudut pandang aplikasi sesuai peran Anda
                  </Text>
                </View>
                <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={24} color={Colors.textNavyDark} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.roleList} showsVerticalScrollIndicator={false}>
                {roles.map((roleKey) => {
                  const role = UserRolesMeta[roleKey];
                  const isSelected = roleKey === currentRole;

                  return (
                    <TouchableOpacity
                      key={roleKey}
                      style={[
                        styles.roleCard,
                        isSelected && {
                          borderColor: role.badgeColor,
                          borderWidth: 1.5,
                          backgroundColor: `${role.badgeColor}12`,
                        },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        onRoleSelected(roleKey);
                        onDismiss();
                      }}
                    >
                      <View style={styles.roleCardContent}>
                        <View
                          style={[styles.roleDot, { backgroundColor: role.badgeColor }]}
                        />
                        <View style={styles.roleInfo}>
                          <Text style={styles.roleTitle}>{role.title}</Text>
                          <Text style={[styles.roleSubtitle, { color: role.badgeColor }]}>
                            {role.subtitle}
                          </Text>
                          <Text style={styles.roleDescription}>{role.description}</Text>
                        </View>
                        {isSelected && (
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={20}
                            color={role.badgeColor}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: Colors.textNavyMuted,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  roleList: {
    marginTop: 12,
  },
  roleCard: {
    backgroundColor: Colors.skyBlueSurfaceVariant,
    borderRadius: 16,
    padding: 14,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  roleDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  roleSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  roleDescription: {
    fontSize: 12,
    color: Colors.textNavySecondary,
    marginTop: 4,
    lineHeight: 17,
  },
});
