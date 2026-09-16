import React, { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { VerificationModal } from '../components/VerificationModal';
import { Colors, Fonts, RsvpStatusMeta, UserRolesMeta } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { ContactItem, RegionInvitationCode, UserRoleType } from '../types';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const {
    currentUser,
    isSuperAdmin,
    activities,
    contacts,
    regionCodes,
    updateProfile,
    createOrUpdateRegionCode,
    toggleRegionCodeStatus,
    deleteRegionCode,
    removeVerification,
    addContact,
    updateContact,
    deleteContact,
    showToast,
    logout,
  } = useApp();

  // Edit Profile Modal State
  const [isEditProfileModalVisible, setIsEditProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNik, setEditNik] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editRole, setEditRole] = useState<UserRoleType>('WARGA');
  const [editKelurahan, setEditKelurahan] = useState('');
  const [editRw, setEditRw] = useState('');
  const [editRt, setEditRt] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');

  // Verification Modal State (Warga)
  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);

  // Create / Edit Region Code Modal State (RT / RW)
  const [isCreateCodeModalVisible, setIsCreateCodeModalVisible] = useState(false);
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeDesc, setNewCodeDesc] = useState('');
  const [newCodeRt, setNewCodeRt] = useState('');
  const [newCodeRw, setNewCodeRw] = useState('');

  // Contact Modal State
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactCategory, setContactCategory] = useState('Kantor Kelurahan Sukamaju');

  const availableRoles: UserRoleType[] = ['WARGA', 'RT', 'RW', 'POSYANDU', 'STAF_KELURAHAN'];
  const isAdmin = currentUser.role !== 'WARGA';
  const isRtOrRw = currentUser.role === 'RT' || currentUser.role === 'RW' || currentUser.role === 'STAF_KELURAHAN';

  // Filter activities with RSVP response
  const rsvpHistory = activities.filter((a) => a.userRsvpStatus !== 'NONE');

  // Group contacts by category
  const groupedContacts = contacts.reduce((acc, contact) => {
    if (!acc[contact.category]) acc[contact.category] = [];
    acc[contact.category].push(contact);
    return acc;
  }, {} as Record<string, ContactItem[]>);

  // Open Edit Profile
  const handleOpenEditProfile = () => {
    setEditName(currentUser.name || '');
    setEditNik(currentUser.nik || '');
    setEditAge(currentUser.age ? String(currentUser.age) : '');
    setEditAddress(currentUser.address || '');
    setEditRole(currentUser.role || 'WARGA');
    setEditKelurahan(currentUser.kelurahan || 'Sukamaju');
    setEditRw(currentUser.rw || '05');
    setEditRt(currentUser.rt || '03');
    setEditPhone(currentUser.phone || '');
    setEditEmail(currentUser.email || '');
    setEditAvatarUrl(currentUser.avatarUrl || '');
    setIsEditProfileModalVisible(true);
  };

  // Pick Photo for Avatar (Camera & Gallery with lightweight compression for Firestore)
  const promptAvatarPicker = (isDirectUpdate = false) => {
    Alert.alert(
      'Ganti Foto Profil',
      'Pilih sumber foto profil Anda:',
      [
        {
          text: 'Ambil Foto (Kamera)',
          onPress: () => performPickAvatar('camera', isDirectUpdate),
        },
        {
          text: 'Pilih dari Galeri',
          onPress: () => performPickAvatar('gallery', isDirectUpdate),
        },
        ...(currentUser.avatarUrl
          ? [
              {
                text: 'Hapus Foto Profil',
                style: 'destructive' as const,
                onPress: () => {
                  if (isDirectUpdate) {
                    updateProfile({ avatarUrl: undefined });
                  } else {
                    setEditAvatarUrl('');
                  }
                },
              },
            ]
          : []),
        { text: 'Batal', style: 'cancel' as const },
      ]
    );
  };

  const performPickAvatar = async (
    source: 'camera' | 'gallery',
    isDirectUpdate: boolean
  ) => {
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            'Izin Kamera Diperlukan',
            'Aplikasi membutuhkan izin kamera untuk mengambil foto profil.'
          );
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.25,
          base64: true,
        });
        if (!result.canceled && result.assets.length > 0) {
          const asset = result.assets[0];
          const onlineUri = asset.base64
            ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
            : asset.uri;
          if (isDirectUpdate) {
            await updateProfile({ avatarUrl: onlineUri });
          } else {
            setEditAvatarUrl(onlineUri);
          }
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            'Izin Galeri Diperlukan',
            'Aplikasi membutuhkan izin galeri untuk memilih foto profil.'
          );
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.25,
          base64: true,
        });
        if (!result.canceled && result.assets.length > 0) {
          const asset = result.assets[0];
          const onlineUri = asset.base64
            ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
            : asset.uri;
          if (isDirectUpdate) {
            await updateProfile({ avatarUrl: onlineUri });
          } else {
            setEditAvatarUrl(onlineUri);
          }
        }
      }
    } catch (err) {
      console.warn('Pick avatar error:', err);
      showToast('Gagal memproses foto profil.');
    }
  };

  // Save Profile Changes
  const handleSaveProfile = () => {
    if (!editName.trim()) {
      showToast('Nama lengkap tidak boleh kosong!');
      return;
    }

    updateProfile({
      name: editName.trim(),
      nik: editNik.trim(),
      age: editAge.trim() ? editAge.trim() : undefined,
      address: editAddress.trim() ? editAddress.trim() : undefined,
      role: isSuperAdmin(currentUser.email) ? editRole : currentUser.role,
      kelurahan: editKelurahan.trim(),
      rw: editRw.trim(),
      rt: editRt.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      avatarUrl: editAvatarUrl.trim() || undefined,
    });

    setIsEditProfileModalVisible(false);
  };

  // Region Code Handlers (RT / RW)
  const handleOpenCreateCode = () => {
    const isRw = currentUser.role === 'RW';
    const defaultSuffix = isRw ? '05' : (currentUser.rt || '03');
    const prefix = isRw ? 'RW' : 'RT';
    setNewCodeName(`${prefix}${defaultSuffix}-MAJU`);
    setNewCodeDesc(`Kode Resmi Warga Lingkungan ${prefix} ${defaultSuffix} Sukamaju`);
    setNewCodeRt(isRw ? 'Semua RT' : (currentUser.rt || '03'));
    setNewCodeRw(currentUser.rw || '05');
    setIsCreateCodeModalVisible(true);
  };

  const handleSaveNewCode = () => {
    if (!newCodeName.trim()) {
      showToast('Kode wilayah tidak boleh kosong!');
      return;
    }

    const res = createOrUpdateRegionCode({
      code: newCodeName.trim(),
      description: newCodeDesc.trim(),
      rt: newCodeRt.trim(),
      rw: newCodeRw.trim(),
    });

    if (res.success) {
      setIsCreateCodeModalVisible(false);
    }
  };

  const handleShareCodeWhatsApp = (item: RegionInvitationCode) => {
    const msg =
      `📢 *KODE UNDANGAN WARGA RESMI*\n` +
      `Kepada warga lingkungan ${item.description}:\n\n` +
      `Silakan masukkan kode berikut di aplikasi *Konek* untuk verifikasi domisili & akses reservasi kegiatan:\n\n` +
      `🔑 *KODE: ${item.code}*\n\n` +
      `Buka aplikasi Konek ➡️ Tab Profil ➡️ Masukkan Kode Undangan.`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() =>
      Share.share({ message: msg, title: 'Kode Undangan Wilayah' })
    );
  };

  // Contact modal handlers
  const handleOpenAddContact = () => {
    setEditingContact(null);
    setContactName('');
    setContactPhone('');
    setContactCategory('Kantor Kelurahan Sukamaju');
    setIsContactModalVisible(true);
  };

  const handleOpenEditContact = (contact: ContactItem) => {
    setEditingContact(contact);
    setContactName(contact.nameTitle);
    setContactPhone(contact.phoneNumber);
    setContactCategory(contact.category);
    setIsContactModalVisible(true);
  };

  const handleSaveContact = () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      showToast('Mohon lengkapi nama dan nomor telepon!');
      return;
    }

    if (editingContact) {
      updateContact(
        editingContact.id,
        contactName,
        contactPhone,
        contactCategory
      );
    } else {
      addContact(contactName, contactPhone, contactCategory);
    }

    setIsContactModalVisible(false);
  };

  const handleCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() =>
      showToast('Tidak dapat membuka panggilan telepon')
    );
  };

  const handleWhatsApp = (phoneNumber: string) => {
    let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '62' + cleanNumber.substring(1);
    }
    Linking.openURL(`https://api.whatsapp.com/send?phone=${cleanNumber}`).catch(
      () => showToast('Tidak dapat membuka WhatsApp')
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Keluar dari Aplikasi?',
      `Apakah Anda yakin ingin keluar dari akun Google (${currentUser.email || currentUser.name})?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'LoginScreen' }],
            });
          },
        },
      ]
    );
  };

  const currentRoleMeta = UserRolesMeta[currentUser.role] || UserRolesMeta.WARGA;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. PROFILE IDENTITY CARD (Pure White Apple iOS Card) */}
      <View style={styles.profileHeaderCard}>
        <TouchableOpacity
          style={styles.avatarCircle}
          activeOpacity={0.85}
          onPress={() => promptAvatarPicker(true)}
        >
          {currentUser.avatarUrl ? (
            <Image
              source={{ uri: currentUser.avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarLetter}>
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          )}
          <View style={styles.avatarCameraBadgeTop}>
            <MaterialCommunityIcons
              name="camera"
              size={13}
              color={Colors.white}
            />
          </View>
        </TouchableOpacity>

        <Text style={styles.profileName}>{currentUser.name}</Text>
        <Text style={styles.profileNik}>NIK: {currentUser.nik || 'Belum diisi'}</Text>

        <View
          style={[
            styles.roleBadgePill,
            { backgroundColor: `${currentRoleMeta.badgeColor}15` },
          ]}
        >
          <View
            style={[
              styles.rolePillDot,
              { backgroundColor: currentRoleMeta.badgeColor },
            ]}
          />
          <Text
            style={[
              styles.roleBadgePillText,
              { color: currentRoleMeta.badgeColor },
            ]}
          >
            {currentRoleMeta.title}
          </Text>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.headerActionsRow}>
          <TouchableOpacity
            style={styles.editProfileBtn}
            activeOpacity={0.85}
            onPress={handleOpenEditProfile}
          >
            <MaterialCommunityIcons
              name="account-edit-outline"
              size={16}
              color={Colors.iosTextPrimary}
            />
            <Text style={styles.editProfileBtnText}>Edit Profil</Text>
          </TouchableOpacity>

          {/* Tombol Khusus Super Admin: Kelola Akun & Role Pengguna */}
          {isSuperAdmin(currentUser.email) && (
            <TouchableOpacity
              style={styles.adminUserManagementBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AdminUserManagementScreen')}
            >
              <MaterialCommunityIcons
                name="account-cog"
                size={16}
                color={Colors.salmonPrimary}
              />
              <Text style={styles.adminUserManagementBtnText}>
                Kelola Akun
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. WARGA VERIFICATION STATUS CARD (Khusus Role Warga) */}
      {currentUser.role === 'WARGA' && (
        <View
          style={[
            styles.verificationCard,
            currentUser.isVerifiedWarga
              ? styles.verificationCardVerified
              : styles.verificationCardUnverified,
          ]}
        >
          <View style={styles.verificationHeader}>
            <View style={styles.verificationIconBox}>
              <MaterialCommunityIcons
                name={currentUser.isVerifiedWarga ? 'shield-check' : 'shield-alert'}
                size={28}
                color={currentUser.isVerifiedWarga ? Colors.kesehatanGreen : Colors.yellowAccent}
              />
            </View>
            <View style={styles.verificationTextGroup}>
              <Text style={styles.verificationTitle}>
                {currentUser.isVerifiedWarga
                  ? 'Warga Sah Terverifikasi RT & RW'
                  : 'Belum Terverifikasi Wilayah'}
              </Text>
              <Text style={styles.verificationSubtitle}>
                {currentUser.isVerifiedWarga
                  ? `Terverifikasi di RT ${currentUser.rt} / RW ${currentUser.rw} • Kode: ${currentUser.verifiedCode || 'RT03MAJU'}`
                  : 'Masukkan kode undangan RT/RW untuk membuka akses reservasi kegiatan lingkungan.'}
              </Text>
            </View>
          </View>

          {currentUser.isVerifiedWarga ? (
            <View style={styles.verifiedActionsRow}>
              <TouchableOpacity
                style={styles.reverifyButton}
                activeOpacity={0.8}
                onPress={() => setIsVerificationModalVisible(true)}
              >
                <MaterialCommunityIcons name="key-change" size={16} color={Colors.skyBlueHeader} />
                <Text style={styles.reverifyButtonText}>Ganti / Input Kode Lain</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetVerificationBtn}
                activeOpacity={0.8}
                onPress={removeVerification}
              >
                <Text style={styles.resetVerificationBtnText}>Reset Uji Coba</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.verifyNowButton}
              activeOpacity={0.85}
              onPress={() => setIsVerificationModalVisible(true)}
            >
              <MaterialCommunityIcons
                name="key-variant"
                size={18}
                color={Colors.onYellowContainer}
              />
              <Text style={styles.verifyNowButtonText}>
                Masukkan Kode Undangan RT / RW
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 3. MANAJEMEN KODE UNDANGAN WILAYAH (Khusus Role RT & RW & Kelurahan) */}
      {isRtOrRw && (
        <View style={styles.regionCodeManagementCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.headerLeftWithIcon}>
              <MaterialCommunityIcons
                name="key-star"
                size={22}
                color={Colors.skyBlueHeader}
              />
              <View style={styles.headerTextGroup}>
                <Text style={styles.cardHeaderTitle}>
                  Kode Wilayah RT / RW
                </Text>
                <Text
                  style={styles.cardHeaderSubtitle}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Bagikan ke warga agar otomatis terdaftar
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.addCodeHeaderBtn}
              activeOpacity={0.8}
              onPress={handleOpenCreateCode}
            >
              <MaterialCommunityIcons
                name="plus"
                size={16}
                color={Colors.skyBlueHeader}
              />
              <Text style={styles.addCodeHeaderBtnText}>Buat Kode</Text>
            </TouchableOpacity>
          </View>

          {/* List of Region Codes */}
          {regionCodes.map((codeItem) => (
            <View key={codeItem.id} style={styles.codeItemCard}>
              <View style={styles.codeItemTopRow}>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeBadgeText}>{codeItem.code}</Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: codeItem.isActive
                        ? Colors.kesehatanGreenContainer
                        : Colors.urgentRedContainer,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color: codeItem.isActive
                          ? Colors.kesehatanGreen
                          : Colors.urgentRed,
                      },
                    ]}
                  >
                    {codeItem.isActive ? 'Aktif' : 'Non-Aktif'}
                  </Text>
                </View>
              </View>

              <Text style={styles.codeItemDesc}>{codeItem.description}</Text>

              <View style={styles.codeItemMetaRow}>
                <View style={styles.codeItemMeta}>
                  <MaterialCommunityIcons
                    name="account-group"
                    size={14}
                    color={Colors.skyBlueHeader}
                  />
                  <Text style={styles.codeItemMetaText}>
                    {codeItem.membersCount || 0} Warga Bergabung
                  </Text>
                </View>

                <View style={styles.codeItemMeta}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={14}
                    color={Colors.textNavyMuted}
                  />
                  <Text style={styles.codeItemMetaText}>
                    RT {codeItem.rt} / RW {codeItem.rw}
                  </Text>
                </View>
              </View>

              {/* Action Buttons for Code */}
              <View style={styles.codeItemActionsRow}>
                <TouchableOpacity
                  style={styles.shareWaCodeBtn}
                  activeOpacity={0.8}
                  onPress={() => handleShareCodeWhatsApp(codeItem)}
                >
                  <MaterialCommunityIcons
                    name="whatsapp"
                    size={16}
                    color={Colors.white}
                  />
                  <Text style={styles.shareWaCodeBtnText}>
                    Bagikan ke WhatsApp Warga
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.toggleActiveCodeBtn}
                  onPress={() => toggleRegionCodeStatus(codeItem.id)}
                >
                  <MaterialCommunityIcons
                    name={codeItem.isActive ? 'power' : 'power-standby'}
                    size={18}
                    color={codeItem.isActive ? Colors.urgentRed : Colors.kesehatanGreen}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteCodeBtn}
                  onPress={() => deleteRegionCode(codeItem.id)}
                >
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={18}
                    color={Colors.textNavyMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 4. RESIDENT & PERSONAL DATA (iOS Inset Grouped List) */}
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionGroupTitle}>DATA DIRI & DOMISILI</Text>
        <TouchableOpacity
          style={styles.headerEditLink}
          onPress={handleOpenEditProfile}
          activeOpacity={0.7}
        >
          <Text style={styles.headerEditLinkText}>Ubah</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.insetGroupedCard}>
        <View style={styles.groupedRow}>
          <Text style={styles.groupedLabel}>Nama Lengkap</Text>
          <Text style={styles.groupedValue}>{currentUser.name}</Text>
        </View>
        <View style={styles.groupedDivider} />

        <View style={styles.groupedRow}>
          <Text style={styles.groupedLabel}>NIK</Text>
          <Text style={styles.groupedValue}>{currentUser.nik || '-'}</Text>
        </View>
        <View style={styles.groupedDivider} />

        <View style={styles.groupedRow}>
          <Text style={styles.groupedLabel}>Usia</Text>
          <Text style={styles.groupedValue}>
            {currentUser.age ? `${currentUser.age} Tahun` : 'Belum diisi'}
          </Text>
        </View>
        <View style={styles.groupedDivider} />

        <View style={styles.groupedRow}>
          <Text style={styles.groupedLabel}>Alamat Domisili</Text>
          <Text style={[styles.groupedValue, { flex: 1, textAlign: 'right' }]}>
            {currentUser.address || 'Belum diisi'}
          </Text>
        </View>
        <View style={styles.groupedDivider} />

        <View style={styles.groupedRow}>
          <Text style={styles.groupedLabel}>Peran Akun</Text>
          <Text style={[styles.groupedValue, { color: currentRoleMeta.badgeColor, fontWeight: '700' }]}>
            {currentRoleMeta.title}
          </Text>
        </View>
        <View style={styles.groupedDivider} />

        <View style={styles.groupedRow}>
          <Text style={styles.groupedLabel}>Kelurahan</Text>
          <Text style={styles.groupedValue}>
            {currentUser.isVerifiedWarga && currentUser.kelurahan
              ? currentUser.kelurahan
              : 'Belum Terdaftar'}
          </Text>
        </View>
        <View style={styles.groupedDivider} />

        <View style={styles.groupedRow}>
          <Text style={styles.groupedLabel}>RW / RT</Text>
          <Text style={styles.groupedValue}>
            {currentUser.isVerifiedWarga && (currentUser.rw || currentUser.rt)
              ? `RW ${currentUser.rw || '-'} / RT ${currentUser.rt || '-'}`
              : 'Belum Diisi (Verifikasi Kode)'}
          </Text>
        </View>
        <View style={styles.groupedDivider} />

        <View style={styles.groupedRow}>
          <Text style={styles.groupedLabel}>No. HP / WhatsApp</Text>
          <Text style={styles.groupedValue}>{currentUser.phone}</Text>
        </View>
        <View style={styles.groupedDivider} />

        <View style={styles.groupedRow}>
          <Text style={styles.groupedLabel}>Email</Text>
          <Text style={styles.groupedValue}>{currentUser.email || '-'}</Text>
        </View>
      </View>

      {/* 5. RIWAYAT RSVP SAYA */}
      <View style={styles.rsvpCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.headerLeftWithIcon}>
            <MaterialCommunityIcons
              name="history"
              size={20}
              color={Colors.skyBlueHeader}
            />
            <Text style={styles.cardHeaderTitle}>Riwayat RSVP Saya</Text>
          </View>
          <View style={styles.counterBadge}>
            <Text style={styles.counterBadgeText}>
              {rsvpHistory.length} Kegiatan
            </Text>
          </View>
        </View>

        {rsvpHistory.length === 0 ? (
          <Text style={styles.emptyRsvpText}>
            Belum ada riwayat RSVP. Silakan pilih status kehadiran pada daftar
            kegiatan.
          </Text>
        ) : (
          rsvpHistory.map((act) => {
            const rsvpInfo = (act?.userRsvpStatus && RsvpStatusMeta[act.userRsvpStatus]) || RsvpStatusMeta.NONE;
            return (
              <TouchableOpacity
                key={act.id}
                style={styles.rsvpHistoryItem}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('ActivityDetailScreen', {
                    activityId: act.id,
                  })
                }
              >
                <View style={styles.rsvpHistoryInfo}>
                  <Text style={styles.rsvpHistoryTitle} numberOfLines={1}>
                    {act.title}
                  </Text>
                  <View style={styles.rsvpHistoryDateRow}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={12}
                      color={Colors.skyBlueHeader}
                    />
                    <Text style={styles.rsvpHistoryDate}>
                      {act.formattedDate}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.rsvpStatusBadge,
                    {
                      borderColor: rsvpInfo.color,
                      backgroundColor: `${rsvpInfo.color}15`,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={rsvpInfo.icon as any}
                    size={14}
                    color={rsvpInfo.color}
                  />
                  <Text
                    style={[styles.rsvpStatusBadgeText, { color: rsvpInfo.color }]}
                  >
                    {rsvpInfo.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* 6. KONTAK PENTING WILAYAH */}
      <View style={styles.contactsCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.headerLeftWithIcon}>
            <MaterialCommunityIcons
              name="phone-in-talk"
              size={20}
              color={Colors.skyBlueHeader}
            />
            <Text style={styles.cardHeaderTitle}>Kontak Penting Wilayah</Text>
          </View>

          {isAdmin && (
            <TouchableOpacity onPress={handleOpenAddContact}>
              <MaterialCommunityIcons
                name="plus-circle"
                size={22}
                color={Colors.skyBlueHeader}
              />
            </TouchableOpacity>
          )}
        </View>

        {Object.entries(groupedContacts).map(([category, items]) => (
          <View key={category} style={styles.contactCategoryGroup}>
            <View style={styles.contactCategoryBadge}>
              <Text style={styles.contactCategoryBadgeText}>{category}</Text>
            </View>

            {items.map((contact) => (
              <View key={contact.id} style={styles.contactRow}>
                <View style={styles.contactInfoCol}>
                  <Text style={styles.contactName}>{contact.nameTitle}</Text>
                  <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                </View>

                <View style={styles.contactActionRow}>
                  {/* WhatsApp */}
                  <TouchableOpacity
                    style={styles.waBtn}
                    onPress={() => handleWhatsApp(contact.phoneNumber)}
                  >
                    <MaterialCommunityIcons
                      name="whatsapp"
                      size={18}
                      color="#128C7E"
                    />
                  </TouchableOpacity>

                  {/* Phone Call */}
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleCall(contact.phoneNumber)}
                  >
                    <MaterialCommunityIcons
                      name="phone"
                      size={18}
                      color={Colors.skyBlueHeader}
                    />
                  </TouchableOpacity>

                  {/* Edit (Admin only) */}
                  {isAdmin && (
                    <TouchableOpacity
                      style={styles.editContactBtn}
                      onPress={() => handleOpenEditContact(contact)}
                    >
                      <MaterialCommunityIcons
                        name="pencil"
                        size={16}
                        color={Colors.skyBlueHeader}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* 7. LOGOUT BUTTON */}
      <TouchableOpacity
        style={styles.logoutBtn}
        activeOpacity={0.85}
        onPress={handleLogout}
      >
        <MaterialCommunityIcons name="logout" size={20} color={Colors.white} />
        <Text style={styles.logoutBtnText}>Keluar dari Aplikasi</Text>
      </TouchableOpacity>

      {/* MODAL: VERIFIKASI WARGA DENGAN KODE RT */}
      <VerificationModal
        visible={isVerificationModalVisible}
        onClose={() => setIsVerificationModalVisible(false)}
      />

      {/* MODAL: BUAT / EDIT KODE WILAYAH RT/RW */}
      <Modal
        visible={isCreateCodeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCreateCodeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.createCodeModalContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Buat Kode Undangan Wilayah</Text>
              <TouchableOpacity
                onPress={() => setIsCreateCodeModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={Colors.textNavyDark}
                />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalHelperText}>
                Kode ini akan Anda bagikan ke warga di grup WhatsApp RT/RW. Warga yang
                memasukkan kode ini akan otomatis terverifikasi.
              </Text>

              {/* Form: Kode Unik */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Kode Unik Wilayah *</Text>
                <TextInput
                  style={[styles.formInput, styles.codeUniqueInput]}
                  placeholder="Contoh: RT03MAJU"
                  placeholderTextColor={Colors.textNavyMuted}
                  value={newCodeName}
                  onChangeText={(txt) => setNewCodeName(txt.toUpperCase().replace(/\s+/g, '-'))}
                  autoCapitalize="characters"
                />
              </View>

              {/* Form: Keterangan */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Keterangan / Nama Wilayah *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Contoh: Kode Resmi Warga RT 03 Sukamaju"
                  placeholderTextColor={Colors.textNavyMuted}
                  value={newCodeDesc}
                  onChangeText={setNewCodeDesc}
                />
              </View>

              {/* Form: Target RT & RW */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Target RT</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="03 / Semua RT"
                    placeholderTextColor={Colors.textNavyMuted}
                    value={newCodeRt}
                    onChangeText={setNewCodeRt}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.formLabel}>Target RW</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="05"
                    placeholderTextColor={Colors.textNavyMuted}
                    value={newCodeRw}
                    onChangeText={setNewCodeRw}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooterActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setIsCreateCodeModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveModalBtn}
                onPress={handleSaveNewCode}
              >
                <MaterialCommunityIcons
                  name="check-bold"
                  size={18}
                  color={Colors.onYellowContainer}
                />
                <Text style={styles.saveModalBtnText}>Simpan & Aktifkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: EDIT PROFIL LENGKAP */}
      <Modal
        visible={isEditProfileModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditProfileModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.editProfileModalContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Edit Profil Pengguna</Text>
              <TouchableOpacity
                onPress={() => setIsEditProfileModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={Colors.textNavyDark}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollArea}
              showsVerticalScrollIndicator={false}
            >
              {/* Avatar Selector */}
              <View style={styles.avatarEditContainer}>
                <TouchableOpacity
                  style={styles.avatarEditCircle}
                  activeOpacity={0.8}
                  onPress={() => promptAvatarPicker(false)}
                >
                  {editAvatarUrl ? (
                    <Image
                      source={{ uri: editAvatarUrl }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarLetter}>
                      {editName ? editName.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  )}
                  <View style={styles.avatarCameraBadge}>
                    <MaterialCommunityIcons
                      name="camera"
                      size={14}
                      color={Colors.white}
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => promptAvatarPicker(false)}>
                  <Text style={styles.avatarChangeText}>Ubah Foto Profil</Text>
                </TouchableOpacity>
              </View>

              {/* Form: Nama Lengkap */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nama Lengkap *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Masukkan nama lengkap"
                  placeholderTextColor={Colors.textNavyMuted}
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>

              {/* Form: NIK */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nomor Induk Kependudukan (NIK)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Contoh: 3271041208850003"
                  placeholderTextColor={Colors.textNavyMuted}
                  value={editNik}
                  onChangeText={setEditNik}
                  keyboardType="number-pad"
                />
              </View>

              {/* Form: Usia / Umur */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Usia / Umur (Tahun)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Contoh: 35"
                  placeholderTextColor={Colors.textNavyMuted}
                  value={editAge}
                  onChangeText={setEditAge}
                  keyboardType="number-pad"
                />
              </View>

              {/* Form: Alamat Domisili */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Alamat Domisili Lengkap</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Contoh: Jl. Merpati No. 12, Blok B"
                  placeholderTextColor={Colors.textNavyMuted}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Form: Peran Pengguna / Jabatan */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Peran & Hak Akses Akun</Text>
                {isSuperAdmin(currentUser.email) ? (
                  <View style={styles.roleSelectionContainer}>
                    {availableRoles.map((roleKey) => {
                      const meta = UserRolesMeta[roleKey];
                      const isSelected = editRole === roleKey;

                      return (
                        <TouchableOpacity
                          key={roleKey}
                          style={[
                            styles.roleOptionCard,
                            isSelected && {
                              borderColor: meta.badgeColor,
                              backgroundColor: `${meta.badgeColor}15`,
                              borderWidth: 2,
                            },
                          ]}
                          activeOpacity={0.85}
                          onPress={() => setEditRole(roleKey)}
                        >
                          <View
                            style={[
                              styles.roleOptionDot,
                              { backgroundColor: meta.badgeColor },
                            ]}
                          />
                          <View style={styles.roleOptionInfo}>
                            <Text style={styles.roleOptionTitle}>{meta.title}</Text>
                            <Text style={styles.roleOptionSubtitle}>
                              {meta.subtitle}
                            </Text>
                          </View>
                          {isSelected && (
                            <MaterialCommunityIcons
                              name="check-circle"
                              size={20}
                              color={meta.badgeColor}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.lockedRoleContainer}>
                    <View style={styles.lockedRoleRow}>
                      <MaterialCommunityIcons
                        name="shield-lock"
                        size={20}
                        color={Colors.skyBlueHeader}
                      />
                      <Text style={styles.lockedRoleText}>
                        {UserRolesMeta[currentUser.role]?.title || currentUser.role}
                      </Text>
                    </View>
                    <Text style={styles.lockedRoleHint}>
                      Peran dan wewenang akun Anda diatur langsung oleh Admin Kelurahan.
                    </Text>
                  </View>
                )}
              </View>

              {/* Form: Wilayah RT & RW */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>RT</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="03"
                    placeholderTextColor={Colors.textNavyMuted}
                    value={editRt}
                    onChangeText={setEditRt}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.formLabel}>RW</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="05"
                    placeholderTextColor={Colors.textNavyMuted}
                    value={editRw}
                    onChangeText={setEditRw}
                  />
                </View>
              </View>

              {/* Form: Kelurahan */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Kelurahan</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Sukamaju"
                  placeholderTextColor={Colors.textNavyMuted}
                  value={editKelurahan}
                  onChangeText={setEditKelurahan}
                />
              </View>

              {/* Form: No. HP / WhatsApp */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nomor HP / WhatsApp *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0812-3456-7890"
                  placeholderTextColor={Colors.textNavyMuted}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Form: Email */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Alamat Email</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="nama@email.com"
                  placeholderTextColor={Colors.textNavyMuted}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooterActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setIsEditProfileModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveModalBtn}
                onPress={handleSaveProfile}
              >
                <MaterialCommunityIcons
                  name="content-save-check"
                  size={18}
                  color={Colors.onYellowContainer}
                />
                <Text style={styles.saveModalBtnText}>Simpan Perubahan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: ADD / EDIT KONTAK */}
      <Modal
        visible={isContactModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsContactModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.contactModalContainer}>
            <Text style={styles.contactModalTitle}>
              {editingContact ? 'Edit Kontak Penting' : 'Tambah Kontak Penting'}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nama Kontak & Jabatan *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Contoh: Bpk. Sutrisno (Ketua RW 05)"
                placeholderTextColor={Colors.textNavyMuted}
                value={contactName}
                onChangeText={setContactName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nomor Telepon / WhatsApp *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="0812-3456-7890"
                placeholderTextColor={Colors.textNavyMuted}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Kategori Wilayah / Jabatan</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Pengurus RT / RW, Kader Posyandu, dll"
                placeholderTextColor={Colors.textNavyMuted}
                value={contactCategory}
                onChangeText={setContactCategory}
              />
            </View>

            <View style={styles.contactModalActions}>
              {editingContact && (
                <TouchableOpacity
                  style={styles.deleteContactBtn}
                  onPress={() => {
                    deleteContact(editingContact.id);
                    setIsContactModalVisible(false);
                  }}
                >
                  <MaterialCommunityIcons
                    name="delete"
                    size={20}
                    color={Colors.urgentRed}
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setIsContactModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveModalBtn}
                onPress={handleSaveContact}
              >
                <Text style={styles.saveModalBtnText}>
                  {editingContact ? 'Simpan' : 'Tambah'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 14,
  },
  profileHeaderCard: {
    backgroundColor: Colors.iosCard,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.iosBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarLetter: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.salmonPrimary,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.iosTextPrimary,
    letterSpacing: -0.3,
  },
  profileNik: {
    fontSize: 13,
    color: Colors.iosTextMuted,
    marginTop: 2,
    marginBottom: 10,
  },
  roleBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: 14,
  },
  rolePillDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  roleBadgePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    width: '100%',
    justifyContent: 'center',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.iosBackground,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.iosTextPrimary,
  },
  adminUserManagementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.salmonContainer,
    borderWidth: 1,
    borderColor: Colors.salmonBorder,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  adminUserManagementBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.salmonPrimary,
  },
  verificationCard: {
    backgroundColor: Colors.iosCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  verificationCardVerified: {
    borderColor: Colors.iosBorder,
    backgroundColor: '#F6FCF8',
  },
  verificationCardUnverified: {
    borderColor: Colors.iosBorder,
    backgroundColor: Colors.iosCard,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  verificationIconBox: {
    marginTop: 2,
  },
  verificationTextGroup: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.iosTextPrimary,
  },
  verificationSubtitle: {
    fontSize: 12,
    color: Colors.iosTextSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  verifyNowButton: {
    marginTop: 12,
    backgroundColor: Colors.salmonPrimary,
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  verifyNowButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  verifiedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  reverifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reverifyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  resetVerificationBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resetVerificationBtnText: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    textDecorationLine: 'underline',
  },
  regionCodeManagementCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.skyBlueBorder,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeftWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  headerTextGroup: {
    flex: 1,
  },
  avatarCameraBadgeTop: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: Colors.skyBlueHeader,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  cardHeaderSubtitle: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    marginTop: 1,
  },
  addCodeHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skyBlueSurfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
    flexShrink: 0,
  },
  addCodeHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  codeItemCard: {
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  codeItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  codeBadge: {
    backgroundColor: Colors.skyBlueHeader,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 1.5,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  codeItemDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textNavyDark,
    marginBottom: 6,
  },
  codeItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  codeItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  codeItemMetaText: {
    fontSize: 11,
    color: Colors.textNavySecondary,
    fontWeight: '500',
  },
  codeItemActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareWaCodeBtn: {
    flex: 1,
    backgroundColor: '#128C7E',
    borderRadius: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  shareWaCodeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  toggleActiveCodeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  deleteCodeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 6,
    marginBottom: -4,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.iosTextPrimary,
  },
  sectionGroupTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: Colors.iosTextMuted,
  },
  headerEditLink: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerEditLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.salmonPrimary,
  },
  insetGroupedCard: {
    backgroundColor: Colors.iosCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    overflow: 'hidden',
  },
  groupedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  groupedLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.iosTextPrimary,
    flexShrink: 0,
    marginRight: 10,
  },
  groupedValue: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.iosTextSecondary,
    textAlign: 'right',
    flexShrink: 1,
  },
  groupedDivider: {
    height: 0.5,
    backgroundColor: Colors.iosBorder,
    marginLeft: 16,
  },
  rsvpCard: {
    backgroundColor: Colors.iosCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  counterBadge: {
    backgroundColor: Colors.salmonContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  counterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.salmonPrimary,
  },
  emptyRsvpText: {
    fontSize: 12,
    color: Colors.iosTextMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  rsvpHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.iosBackground,
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
  },
  rsvpHistoryInfo: {
    flex: 1,
    marginRight: 8,
  },
  rsvpHistoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.iosTextPrimary,
  },
  rsvpHistoryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rsvpHistoryDate: {
    fontSize: 11,
    color: Colors.iosTextMuted,
  },
  rsvpStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },
  rsvpStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  contactsCard: {
    backgroundColor: Colors.iosCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  contactCategoryGroup: {
    marginVertical: 4,
  },
  contactCategoryBadge: {
    backgroundColor: Colors.iosBackground,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
  },
  contactCategoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.iosTextSecondary,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  contactInfoCol: {
    flex: 1,
  },
  contactName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textNavyDark,
  },
  contactPhone: {
    fontSize: 11,
    color: Colors.textNavyMuted,
    marginTop: 1,
  },
  contactActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.skyBlueSurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editContactBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.urgentRed,
    borderRadius: 14,
    height: 48,
    gap: 8,
    marginBottom: 20,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  createCodeModalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    elevation: 5,
  },
  modalHelperText: {
    fontSize: 12,
    color: Colors.textNavySecondary,
    lineHeight: 17,
    marginBottom: 14,
  },
  codeUniqueInput: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.skyBlueHeader,
  },
  editProfileModalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    maxHeight: '90%',
    padding: 20,
    elevation: 5,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textNavyDark,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollArea: {
    maxHeight: 450,
  },
  avatarEditContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  avatarEditCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.skyBlueSurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.skyBlueHeader,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarChangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
    marginTop: 6,
  },
  formGroup: {
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
    marginBottom: 5,
  },
  formInput: {
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: Colors.textNavyDark,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  formTextArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  roleSelectionContainer: {
    gap: 6,
    marginTop: 4,
  },
  lockedRoleContainer: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  lockedRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  lockedRoleText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.skyBlueHeader,
  },
  lockedRoleHint: {
    fontSize: 11,
    color: '#0369A1',
    fontFamily: Fonts.bodyRegular,
    lineHeight: 16,
  },
  roleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 10,
  },
  roleOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  roleOptionInfo: {
    flex: 1,
  },
  roleOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  roleOptionSubtitle: {
    fontSize: 11,
    color: Colors.textNavySecondary,
  },
  modalFooterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: 8,
  },
  cancelModalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelModalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textNavySecondary,
  },
  saveModalBtn: {
    backgroundColor: Colors.yellowContainer,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  contactModalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 18,
  },
  contactModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textNavyDark,
    marginBottom: 14,
  },
  contactModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  deleteContactBtn: {
    marginRight: 'auto',
    padding: 6,
  },
});
