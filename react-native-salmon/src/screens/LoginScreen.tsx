import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, UserRolesMeta } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { UserRoleType } from '../types';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { switchRole } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRoleType>('WARGA');

  const roles: UserRoleType[] = ['WARGA', 'RT', 'RW', 'POSYANDU', 'STAF_KELURAHAN'];

  const handleLogin = () => {
    switchRole(selectedRole);
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Logo */}
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons name="city-variant" size={44} color={Colors.white} />
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.appTitle}>Kegiatan Kelurahan</Text>
        <Text style={styles.appSubtitle}>
          Sistem Manajemen Kegiatan Lingkungan Sukamaju
        </Text>

        <View style={styles.roleSelectionHeader}>
          <Text style={styles.sectionTitle}>Pilih Peran Login Anda</Text>
        </View>

        {/* Role Cards */}
        {roles.map((roleKey) => {
          const role = UserRolesMeta[roleKey];
          const isSelected = roleKey === selectedRole;

          return (
            <TouchableOpacity
              key={roleKey}
              style={[
                styles.roleCard,
                isSelected && styles.roleCardSelected,
              ]}
              activeOpacity={0.85}
              onPress={() => setSelectedRole(roleKey)}
            >
              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && { borderColor: Colors.yellowHighlight },
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </View>

              <View style={styles.roleDetails}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={[styles.roleSubtitle, { color: role.badgeColor }]}>
                  {role.subtitle}
                </Text>
                <Text style={styles.roleDesc}>{role.description}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Login CTA */}
        <TouchableOpacity
          style={styles.loginButton}
          activeOpacity={0.85}
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>
            Masuk Sebagai {UserRolesMeta[selectedRole].title}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.onYellowContainer} />
        </TouchableOpacity>

        <Text style={styles.versionText}>
          Versi 1.0.0 • Aksesibilitas & Ramah Pengguna
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.skyBlueBackground,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.skyBlueHeader,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 16,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textNavyDark,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 14,
    color: Colors.textNavySecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  roleSelectionHeader: {
    width: '100%',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  roleCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    elevation: 1,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  roleCardSelected: {
    borderColor: Colors.yellowHighlight,
    borderWidth: 2,
    backgroundColor: Colors.white,
    elevation: 4,
    shadowOpacity: 0.1,
  },
  radioContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textNavyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.yellowHighlight,
  },
  roleDetails: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  roleSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  roleDesc: {
    fontSize: 12,
    color: Colors.textNavySecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  loginButton: {
    width: '100%',
    height: 54,
    backgroundColor: Colors.yellowHighlight,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
    gap: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textNavyMuted,
    marginTop: 4,
    marginBottom: 20,
  },
});
