import React, { useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts, UserRolesMeta } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { UserProfile, UserRoleType } from '../types';

interface AdminUserManagementScreenProps {
  navigation: any;
}

const AVAILABLE_ROLES: {
  role: UserRoleType;
  label: string;
  desc: string;
  badgeBg: string;
  badgeText: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  {
    role: 'WARGA',
    label: 'Warga Sukamaju',
    desc: 'Dapat melihat agenda, pengumuman, dan konfirmasi kehadiran (RSVP)',
    badgeBg: '#F1F5F9',
    badgeText: '#475569',
    icon: 'account',
  },
  {
    role: 'RT',
    label: 'Pengurus RT',
    desc: 'Dapat membuat usulan kegiatan tingkat RT untuk diajukan ke RW',
    badgeBg: '#EFF6FF',
    badgeText: '#1D4ED8',
    icon: 'account-group',
  },
  {
    role: 'RW',
    label: 'Pengurus RW',
    desc: 'Menyetujui agenda RT dan menerbitkan pengumuman tingkat RW',
    badgeBg: '#F5F3FF',
    badgeText: '#6D28D9',
    icon: 'account-multiple-check',
  },
  {
    role: 'POSYANDU',
    label: 'Kader Posyandu',
    desc: 'Mengelola jadwal imunisasi, penimbangan balita & lansia',
    badgeBg: '#FDF2F8',
    badgeText: '#BE185D',
    icon: 'heart-pulse',
  },
  {
    role: 'STAF_KELURAHAN',
    label: 'Staf Kelurahan / Admin',
    desc: 'Akses penuh administrasi seluruh kegiatan, warga, dan verifikasi',
    badgeBg: Colors.yellowContainer,
    badgeText: Colors.onYellowContainer,
    icon: 'shield-account',
  },
];

export const AdminUserManagementScreen: React.FC<AdminUserManagementScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const {
    allUsers = [],
    currentUser,
    updateUserRoleByAdmin,
    verifyUserByAdmin,
    isSuperAdmin,
    fetchAllUsers,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<
    UserRoleType | 'ALL' | 'UNREGISTERED'
  >('ALL');
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserProfile | null>(null);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserProfile | null>(null);
  const [pendingRole, setPendingRole] = useState<UserRoleType>('WARGA');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchAllUsers();
    } catch (e) {
      console.warn('Error refreshing users list:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAllUsers]);

  // Load and refresh users whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchAllUsers().catch((e) => console.warn('Error fetching all users on focus:', e));
    }, [fetchAllUsers])
  );

  const safeUsers = Array.isArray(allUsers) ? allUsers : [];

  // Filtered users
  const filteredUsers = useMemo(() => {
    return safeUsers.filter((user) => {
      if (!user) return false;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (user.name && user.name.toLowerCase().includes(q)) ||
        (user.email && user.email.toLowerCase().includes(q)) ||
        (user.phone && user.phone.includes(q)) ||
        (user.nik && user.nik.includes(q));

      let matchRole = true;
      if (selectedRoleFilter === 'ALL') {
        matchRole = true;
      } else if (selectedRoleFilter === 'UNREGISTERED') {
        matchRole = !user.isVerifiedWarga && user.role === 'WARGA';
      } else if (selectedRoleFilter === 'WARGA') {
        matchRole = !!user.isVerifiedWarga && user.role === 'WARGA';
      } else {
        matchRole = user.role === selectedRoleFilter;
      }

      return matchSearch && matchRole;
    });
  }, [safeUsers, searchQuery, selectedRoleFilter]);

  // Role summary counts
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: safeUsers.length,
      UNREGISTERED: 0,
      WARGA: 0,
      RT: 0,
      RW: 0,
      POSYANDU: 0,
      STAF_KELURAHAN: 0,
    };
    safeUsers.forEach((u) => {
      if (!u) return;
      if (!u.isVerifiedWarga && u.role === 'WARGA') {
        counts.UNREGISTERED++;
      } else if (counts[u.role] !== undefined) {
        counts[u.role]++;
      } else {
        counts.WARGA++;
      }
    });
    return counts;
  }, [safeUsers]);

  // Quick verify user as official warga
  const handleVerifyWarga = (user: UserProfile) => {
    Alert.alert(
      'Verifikasi Akun Warga',
      `Verifikasi "${user.name || user.email}" sebagai Warga resmi Sukamaju? Pengguna akan langsung mendapatkan status terverifikasi tanpa perlu kode undangan RT.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Verifikasi',
          onPress: async () => {
            setIsUpdating(true);
            const targetKey = user.email || user.id;
            await verifyUserByAdmin(targetKey);
            setIsUpdating(false);
          },
        },
      ]
    );
  };

  // Open modal change role
  const handleOpenRoleModal = (user: UserProfile) => {
    setSelectedUserForRole(user);
    setPendingRole(user.role || 'WARGA');
  };

  // Submit role update
  const handleConfirmRoleChange = async () => {
    if (!selectedUserForRole) return;

    // Proteksi: jangan izinkan mengubah akun super admin utama ke selain STAF_KELURAHAN
    if (isSuperAdmin(selectedUserForRole.email) && pendingRole !== 'STAF_KELURAHAN') {
      Alert.alert(
        'Perhatian',
        'Akun Administrator Utama tidak dapat diubah menjadi peran warga biasa.'
      );
      return;
    }

    setIsUpdating(true);
    const targetKey = selectedUserForRole.email || selectedUserForRole.id;
    const success = await updateUserRoleByAdmin(targetKey, pendingRole);
    setIsUpdating(false);

    if (success) {
      setSelectedUserForRole(null);
    }
  };

  // Direct WhatsApp contact
  const handleContactWhatsApp = (phone?: string) => {
    if (!phone) {
      Alert.alert('Kontak', 'Nomor telepon pengguna belum dilengkapi.');
      return;
    }
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    let waNumber = cleanNumber;
    if (waNumber.startsWith('0')) {
      waNumber = '62' + waNumber.substring(1);
    }
    const url = `https://wa.me/${waNumber}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Tidak dapat membuka WhatsApp.');
    });
  };

  // Format date helper
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Belum tercatat';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* 1. TOP APP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textNavyDark} />
        </TouchableOpacity>

        <View style={styles.topBarTitles}>
          <Text style={styles.topBarTitle}>Kelola Akun & Hak Akses</Text>
          <Text style={styles.topBarSubtitle}>
            {allUsers.length} akun terdaftar di sistem
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshTopBtn}
          onPress={handleRefresh}
          disabled={isRefreshing}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={20}
            color={Colors.skyBlueHeader}
            style={isRefreshing ? { transform: [{ rotate: '45deg' }] } : undefined}
          />
        </TouchableOpacity>

        <View style={styles.adminBadgeSmall}>
          <MaterialCommunityIcons name="shield-crown" size={16} color={Colors.onYellowContainer} />
          <Text style={styles.adminBadgeSmallText}>Admin</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.skyBlueHeader]}
            tintColor={Colors.skyBlueHeader}
          />
        }
      >
        {/* 2. SEARCH BAR */}
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textNavyMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama, Gmail, NIK, atau no HP..."
            placeholderTextColor={Colors.textNavyMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textNavyMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* 3. FILTER ROLE CHIPS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedRoleFilter === 'ALL' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedRoleFilter('ALL')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedRoleFilter === 'ALL' && styles.filterChipTextActive,
              ]}
            >
              Semua ({roleCounts.ALL})
            </Text>
          </TouchableOpacity>

          {/* Chip: Belum Terdaftar */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedRoleFilter === 'UNREGISTERED'
                ? { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }
                : { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
            ]}
            onPress={() => setSelectedRoleFilter('UNREGISTERED')}
          >
            <MaterialCommunityIcons
              name="account-clock"
              size={14}
              color={selectedRoleFilter === 'UNREGISTERED' ? '#B45309' : '#D97706'}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.filterChipText,
                { color: selectedRoleFilter === 'UNREGISTERED' ? '#B45309' : '#D97706' },
                selectedRoleFilter === 'UNREGISTERED' && { fontWeight: '700' },
              ]}
            >
              Belum Terdaftar ({roleCounts.UNREGISTERED || 0})
            </Text>
          </TouchableOpacity>

          {AVAILABLE_ROLES.map((r) => {
            const isActive = selectedRoleFilter === r.role;
            return (
              <TouchableOpacity
                key={r.role}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
                onPress={() => setSelectedRoleFilter(r.role)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {r.label.split(' ')[0]} ({roleCounts[r.role] || 0})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 4. LIST USERS */}
        <View style={styles.userListSection}>
          <Text style={styles.sectionHeaderTitle}>
            Daftar Pengguna ({filteredUsers.length})
          </Text>

          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="account-search-outline"
                size={54}
                color={Colors.skyBlueBorder}
              />
              <Text style={styles.emptyStateTitle}>Tidak ada akun yang cocok</Text>
              <Text style={styles.emptyStateSubtitle}>
                Coba sesuaikan kata kunci pencarian atau filter peran di atas.
              </Text>
            </View>
          ) : (
            filteredUsers.map((user) => {
              const roleMeta = UserRolesMeta[user.role] || UserRolesMeta.WARGA;
              const isUserSuperAdmin = isSuperAdmin(user.email);
              const isSelf = user.email?.toLowerCase() === currentUser.email?.toLowerCase();

              return (
                <View key={user.id || user.email} style={styles.userCard}>
                  {/* Card Header: Avatar, Name, Email */}
                  <View style={styles.userCardTopRow}>
                    {user.avatarUrl ? (
                      <Image source={{ uri: user.avatarUrl }} style={styles.userAvatarImage} />
                    ) : (
                      <View style={styles.userAvatarPlaceholder}>
                        <Text style={styles.userAvatarLetter}>
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </Text>
                      </View>
                    )}

                    <View style={styles.userInfoCol}>
                      <View style={styles.userNameRow}>
                        <Text style={styles.userNameText} numberOfLines={1}>
                          {user.name || 'Pengguna Tanpa Nama'}
                        </Text>
                        {isSelf && (
                          <View style={styles.selfBadge}>
                            <Text style={styles.selfBadgeText}>Anda</Text>
                          </View>
                        )}
                        {isUserSuperAdmin && (
                          <View style={[styles.selfBadge, { backgroundColor: '#FEF3C7' }]}>
                            <Text style={[styles.selfBadgeText, { color: '#B45309' }]}>Super Admin</Text>
                          </View>
                        )}
                      </View>

                      {/* Gmail Display */}
                      <View style={styles.userEmailRow}>
                        <MaterialCommunityIcons
                          name="gmail"
                          size={14}
                          color="#EA4335"
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.userEmailText} numberOfLines={1}>
                          {user.email || 'Email belum tercatat'}
                        </Text>
                      </View>

                      {/* Region & Last Login */}
                      <Text style={styles.userRegionText}>
                        RT {user.rt || '01'} / RW {user.rw || '05'} • {user.kelurahan || 'Sukamaju'}
                      </Text>
                    </View>
                  </View>

                  {/* Role & Login Info Pill */}
                  <View style={styles.userMetaRow}>
                    <View
                      style={[
                        styles.roleBadge,
                        {
                          backgroundColor:
                            user.role === 'STAF_KELURAHAN'
                              ? Colors.yellowContainer
                              : !user.isVerifiedWarga && user.role === 'WARGA'
                              ? '#FEF3C7'
                              : '#E0F2FE',
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={
                          user.role === 'STAF_KELURAHAN'
                            ? 'shield-check'
                            : !user.isVerifiedWarga && user.role === 'WARGA'
                            ? 'account-clock-outline'
                            : 'account-circle'
                        }
                        size={14}
                        color={
                          user.role === 'STAF_KELURAHAN'
                            ? Colors.onYellowContainer
                            : !user.isVerifiedWarga && user.role === 'WARGA'
                            ? '#B45309'
                            : Colors.skyBlueHeader
                        }
                      />
                      <Text
                        style={[
                          styles.roleBadgeText,
                          {
                            color:
                              user.role === 'STAF_KELURAHAN'
                                ? Colors.onYellowContainer
                                : !user.isVerifiedWarga && user.role === 'WARGA'
                                ? '#B45309'
                                : Colors.skyBlueHeader,
                            fontWeight:
                              !user.isVerifiedWarga && user.role === 'WARGA'
                                ? '700'
                                : '600',
                          },
                        ]}
                      >
                        {!user.isVerifiedWarga && user.role === 'WARGA'
                          ? 'Belum Terdaftar'
                          : roleMeta.title}
                      </Text>
                    </View>

                    <Text style={styles.lastLoginText}>
                      Login: {formatDateTime(user.lastLoginAt)}
                    </Text>
                  </View>

                  {/* Warning Notice if user is not registered / verified yet */}
                  {!user.isVerifiedWarga && user.role === 'WARGA' && (
                    <View style={styles.unregisteredNoticeBanner}>
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={13}
                        color="#B45309"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.unregisteredNoticeText}>
                        Akun baru • Belum memasukkan kode verifikasi RT/RW
                      </Text>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.userActionRow}>
                    {/* View Profile Button */}
                    <TouchableOpacity
                      style={styles.btnSecondary}
                      onPress={() => setSelectedUserForDetail(user)}
                    >
                      <MaterialCommunityIcons
                        name="card-account-details-outline"
                        size={16}
                        color={Colors.skyBlueHeader}
                      />
                      <Text style={styles.btnSecondaryText}>Profil</Text>
                    </TouchableOpacity>

                    {/* Quick Verify Button for Unregistered */}
                    {!user.isVerifiedWarga && user.role === 'WARGA' && (
                      <TouchableOpacity
                        style={styles.btnVerifyQuick}
                        onPress={() => handleVerifyWarga(user)}
                        disabled={isUpdating}
                      >
                        <MaterialCommunityIcons
                          name="check-decagram"
                          size={15}
                          color="#065F46"
                        />
                        <Text style={styles.btnVerifyQuickText}>Verifikasi</Text>
                      </TouchableOpacity>
                    )}

                    {/* Change Role Button */}
                    <TouchableOpacity
                      style={styles.btnPrimary}
                      onPress={() => handleOpenRoleModal(user)}
                    >
                      <MaterialCommunityIcons
                        name="shield-edit-outline"
                        size={16}
                        color={Colors.onYellowContainer}
                      />
                      <Text style={styles.btnPrimaryText}>Atur Peran</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 5. MODAL ATUR PERAN PENGGUNA */}
      <Modal
        visible={!!selectedUserForRole}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUserForRole(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <MaterialCommunityIcons
                  name="shield-account"
                  size={24}
                  color={Colors.onYellowContainer}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Tentukan Hak Akses / Peran</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  Untuk: {selectedUserForRole?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedUserForRole(null)}>
                <MaterialCommunityIcons name="close" size={22} color={Colors.textNavyMuted} />
              </TouchableOpacity>
            </View>

            {/* Target User Info Header */}
            <View style={styles.targetUserBanner}>
              <MaterialCommunityIcons name="gmail" size={16} color="#EA4335" />
              <Text style={styles.targetUserBannerEmail} numberOfLines={1}>
                {selectedUserForRole?.email}
              </Text>
            </View>

            {/* Role List Options */}
            <ScrollView style={styles.roleOptionsList}>
              {AVAILABLE_ROLES.map((item) => {
                const isSelected = pendingRole === item.role;
                return (
                  <TouchableOpacity
                    key={item.role}
                    style={[
                      styles.roleOptionCard,
                      isSelected && styles.roleOptionCardSelected,
                    ]}
                    onPress={() => setPendingRole(item.role)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.roleOptionIconBox,
                        { backgroundColor: item.badgeBg },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={22}
                        color={item.badgeText}
                      />
                    </View>

                    <View style={styles.roleOptionTextCol}>
                      <Text
                        style={[
                          styles.roleOptionTitle,
                          isSelected && styles.roleOptionTitleSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={styles.roleOptionDesc}>{item.desc}</Text>
                    </View>

                    <MaterialCommunityIcons
                      name={
                        isSelected
                          ? 'radiobox-marked'
                          : 'radiobox-blank'
                      }
                      size={22}
                      color={
                        isSelected ? Colors.yellowAccent : Colors.textNavyMuted
                      }
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSelectedUserForRole(null)}
                disabled={isUpdating}
              >
                <Text style={styles.modalCancelBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmRoleChange}
                disabled={isUpdating}
              >
                <Text style={styles.modalConfirmBtnText}>
                  {isUpdating ? 'Menyimpan...' : 'Terapkan Peran'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 6. MODAL DETAIL PROFIL PENGGUNA */}
      <Modal
        visible={!!selectedUserForDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedUserForDetail(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Lengkap Akun</Text>
              <TouchableOpacity onPress={() => setSelectedUserForDetail(null)}>
                <MaterialCommunityIcons name="close" size={22} color={Colors.textNavyMuted} />
              </TouchableOpacity>
            </View>

            {selectedUserForDetail && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Hero */}
                <View style={styles.detailHero}>
                  {selectedUserForDetail.avatarUrl ? (
                    <Image
                      source={{ uri: selectedUserForDetail.avatarUrl }}
                      style={styles.detailAvatarImage}
                    />
                  ) : (
                    <View style={styles.detailAvatarPlaceholder}>
                      <Text style={styles.detailAvatarLetter}>
                        {selectedUserForDetail.name
                          ? selectedUserForDetail.name.charAt(0).toUpperCase()
                          : 'U'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.detailNameText}>{selectedUserForDetail.name}</Text>
                  <View
                    style={[
                      styles.detailRolePill,
                      !selectedUserForDetail.isVerifiedWarga &&
                        selectedUserForDetail.role === 'WARGA' && {
                          backgroundColor: '#FEF3C7',
                        },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailRolePillText,
                        !selectedUserForDetail.isVerifiedWarga &&
                          selectedUserForDetail.role === 'WARGA' && {
                            color: '#B45309',
                          },
                      ]}
                    >
                      {!selectedUserForDetail.isVerifiedWarga &&
                      selectedUserForDetail.role === 'WARGA'
                        ? 'Belum Terdaftar'
                        : UserRolesMeta[selectedUserForDetail.role]?.title ||
                          selectedUserForDetail.role}
                    </Text>
                  </View>
                </View>

                {/* Details List */}
                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="gmail" size={18} color="#EA4335" />
                    <View style={styles.detailRowTextCol}>
                      <Text style={styles.detailRowLabel}>Akun Google / Gmail</Text>
                      <Text style={styles.detailRowValue}>
                        {selectedUserForDetail.email || '-'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="card-account-details"
                      size={18}
                      color={Colors.skyBlueHeader}
                    />
                    <View style={styles.detailRowTextCol}>
                      <Text style={styles.detailRowLabel}>Nomor Induk Kependudukan (NIK)</Text>
                      <Text style={styles.detailRowValue}>
                        {selectedUserForDetail.nik || 'Belum diisi oleh warga'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="phone"
                      size={18}
                      color={Colors.skyBlueHeader}
                    />
                    <View style={styles.detailRowTextCol}>
                      <Text style={styles.detailRowLabel}>Nomor WhatsApp / Telepon</Text>
                      <Text style={styles.detailRowValue}>
                        {selectedUserForDetail.phone || 'Belum dicantumkan'}
                      </Text>
                    </View>
                    {!!selectedUserForDetail.phone && (
                      <TouchableOpacity
                        style={styles.waButtonSmall}
                        onPress={() => handleContactWhatsApp(selectedUserForDetail.phone)}
                      >
                        <MaterialCommunityIcons name="whatsapp" size={16} color="#FFFFFF" />
                        <Text style={styles.waButtonSmallText}>Chat</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="home-city"
                      size={18}
                      color={Colors.skyBlueHeader}
                    />
                    <View style={styles.detailRowTextCol}>
                      <Text style={styles.detailRowLabel}>Alamat Domisili Wilayah</Text>
                      <Text style={styles.detailRowValue}>
                        {selectedUserForDetail.address
                          ? `${selectedUserForDetail.address}, RT ${selectedUserForDetail.rt || '01'} / RW ${selectedUserForDetail.rw || '05'}, Kelurahan ${selectedUserForDetail.kelurahan || 'Sukamaju'}`
                          : `RT ${selectedUserForDetail.rt || '01'} / RW ${selectedUserForDetail.rw || '05'}, Kelurahan ${selectedUserForDetail.kelurahan || 'Sukamaju'}`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="clock-check"
                      size={18}
                      color={Colors.skyBlueHeader}
                    />
                    <View style={styles.detailRowTextCol}>
                      <Text style={styles.detailRowLabel}>Waktu Terakhir Masuk (Login)</Text>
                      <Text style={styles.detailRowValue}>
                        {formatDateTime(selectedUserForDetail.lastLoginAt)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="calendar-account"
                      size={18}
                      color={Colors.skyBlueHeader}
                    />
                    <View style={styles.detailRowTextCol}>
                      <Text style={styles.detailRowLabel}>Terdaftar Pertama Kali</Text>
                      <Text style={styles.detailRowValue}>
                        {formatDateTime(selectedUserForDetail.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Direct Action */}
                {!selectedUserForDetail.isVerifiedWarga &&
                  selectedUserForDetail.role === 'WARGA' && (
                    <TouchableOpacity
                      style={[
                        styles.btnSetRoleFromDetail,
                        {
                          backgroundColor: '#D1FAE5',
                          borderColor: '#34D399',
                          marginBottom: 8,
                        },
                      ]}
                      onPress={() => {
                        const target = selectedUserForDetail;
                        setSelectedUserForDetail(null);
                        handleVerifyWarga(target);
                      }}
                    >
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={18}
                        color="#065F46"
                      />
                      <Text
                        style={[
                          styles.btnSetRoleFromDetailText,
                          { color: '#065F46' },
                        ]}
                      >
                        Verifikasi Jadi Warga Sukamaju
                      </Text>
                    </TouchableOpacity>
                  )}

                <TouchableOpacity
                  style={styles.btnSetRoleFromDetail}
                  onPress={() => {
                    const target = selectedUserForDetail;
                    setSelectedUserForDetail(null);
                    handleOpenRoleModal(target);
                  }}
                >
                  <MaterialCommunityIcons
                    name="shield-edit"
                    size={18}
                    color={Colors.onYellowContainer}
                  />
                  <Text style={styles.btnSetRoleFromDetailText}>
                    Ubah Peran / Wewenang Pengguna Ini
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.skyBlueBackground,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  topBarTitles: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.textNavyDark,
  },
  topBarSubtitle: {
    fontSize: 12,
    color: Colors.textNavyMuted,
    fontFamily: Fonts.bodyMedium,
    marginTop: 1,
  },
  refreshTopBtn: {
    padding: 6,
    marginRight: 6,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
  },
  adminBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.yellowContainer,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminBadgeSmallText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: Colors.onYellowContainer,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textNavyDark,
    fontFamily: Fonts.bodyRegular,
    padding: 0,
  },
  filterChipContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: Colors.yellowAccent,
    borderColor: Colors.yellowBorderLis,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Fonts.bodyBold,
    color: Colors.textNavyDark,
  },
  filterChipTextActive: {
    color: Colors.onYellowContainer,
    fontWeight: '800',
  },
  userListSection: {
    marginTop: 4,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.textNavyDark,
    marginBottom: 10,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: Colors.textNavyDark,
    marginTop: 12,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: Colors.textNavyMuted,
    fontFamily: Fonts.bodyRegular,
    textAlign: 'center',
    marginTop: 4,
  },
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  userCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: Colors.skyBlueBorder,
  },
  userAvatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.skyBlueSurfaceVariant,
    borderWidth: 1.5,
    borderColor: Colors.skyBlueBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarLetter: {
    fontSize: 19,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.skyBlueHeader,
  },
  userInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.textNavyDark,
    flex: 1,
  },
  selfBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  selfBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  userEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  userEmailText: {
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
    color: '#334155',
  },
  userRegionText: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    fontFamily: Fonts.bodyRegular,
    marginTop: 2,
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
  },
  lastLoginText: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    fontFamily: Fonts.bodyRegular,
  },
  userActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  btnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: Colors.skyBlueHeader,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.yellowAccent,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  btnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: Colors.onYellowContainer,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  modalHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.yellowContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.textNavyDark,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textNavyMuted,
    fontFamily: Fonts.bodyMedium,
  },
  targetUserBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 6,
  },
  targetUserBannerEmail: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
  roleOptionsList: {
    maxHeight: 280,
  },
  roleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 10,
  },
  roleOptionCardSelected: {
    borderColor: Colors.yellowAccent,
    backgroundColor: '#FEFCE8',
  },
  roleOptionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptionTextCol: {
    flex: 1,
  },
  roleOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: Colors.textNavyDark,
  },
  roleOptionTitleSelected: {
    color: Colors.onYellowContainer,
  },
  roleOptionDesc: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    fontFamily: Fonts.bodyRegular,
    marginTop: 2,
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalConfirmBtn: {
    flex: 2,
    backgroundColor: Colors.yellowAccent,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.onYellowContainer,
  },
  detailHero: {
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  detailAvatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: Colors.skyBlueHeader,
  },
  detailAvatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.skyBlueSurfaceVariant,
    borderWidth: 2,
    borderColor: Colors.skyBlueHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAvatarLetter: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.skyBlueHeader,
  },
  detailNameText: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.textNavyDark,
    marginTop: 10,
  },
  detailRolePill: {
    backgroundColor: Colors.yellowContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 6,
  },
  detailRolePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  detailSection: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailRowTextCol: {
    flex: 1,
  },
  detailRowLabel: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    fontFamily: Fonts.bodyMedium,
  },
  detailRowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
    fontFamily: Fonts.bodyBold,
    marginTop: 2,
  },
  waButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  waButtonSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnSetRoleFromDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.yellowAccent,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  btnSetRoleFromDetailText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.onYellowContainer,
  },
  unregisteredNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  unregisteredNoticeText: {
    fontSize: 11,
    color: '#B45309',
    fontFamily: Fonts.bodyMedium,
    flex: 1,
  },
  btnVerifyQuick: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#34D399',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  btnVerifyQuickText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
    fontFamily: Fonts.headingBold,
  },
});
