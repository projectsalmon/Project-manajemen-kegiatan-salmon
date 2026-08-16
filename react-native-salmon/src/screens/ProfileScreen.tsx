import React, { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, RsvpStatusMeta, UserRolesMeta } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { ContactItem, UserRoleType } from '../types';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const {
    currentUser,
    activities,
    contacts,
    updateProfile,
    addContact,
    updateContact,
    deleteContact,
    showToast,
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

  // Contact Modal State
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactCategory, setContactCategory] = useState('Kantor Kelurahan Sukamaju');

  const availableRoles: UserRoleType[] = ['WARGA', 'RT', 'RW', 'POSYANDU', 'STAF_KELURAHAN'];
  const isAdmin = currentUser.role !== 'WARGA';

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

  // Pick Photo for Avatar
  const handlePickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Izin Diperlukan',
          'Aplikasi membutuhkan izin galeri untuk memilih foto profil.'
        );
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets.length > 0) {
        setEditAvatarUrl(pickerResult.assets[0].uri);
      }
    } catch (error) {
      showToast('Gagal memilih foto dari galeri');
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
      role: editRole,
      kelurahan: editKelurahan.trim(),
      rw: editRw.trim(),
      rt: editRt.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      avatarUrl: editAvatarUrl.trim() || undefined,
    });

    setIsEditProfileModalVisible(false);
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
    navigation.reset({
      index: 0,
      routes: [{ name: 'LoginScreen' }],
    });
  };

  const currentRoleMeta = UserRolesMeta[currentUser.role] || UserRolesMeta.WARGA;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. PROFILE IDENTITY CARD */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarCircle}>
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
        </View>

        <Text style={styles.profileName}>{currentUser.name}</Text>
        <Text style={styles.profileNik}>NIK: {currentUser.nik || 'Belum diisi'}</Text>

        <View style={styles.roleBadgePill}>
          <View
            style={[
              styles.rolePillDot,
              { backgroundColor: currentRoleMeta.badgeColor },
            ]}
          />
          <Text style={styles.roleBadgePillText}>
            Peran: {currentRoleMeta.title}
          </Text>
        </View>

        {/* Tombol Edit Profil */}
        <TouchableOpacity
          style={styles.editProfileBtn}
          activeOpacity={0.85}
          onPress={handleOpenEditProfile}
        >
          <MaterialCommunityIcons
            name="account-edit-outline"
            size={18}
            color={Colors.skyBlueHeader}
          />
          <Text style={styles.editProfileBtnText}>Edit Profil & Peran</Text>
        </TouchableOpacity>
      </View>

      {/* 2. RESIDENT & PERSONAL DATA INFO CARD */}
      <View style={styles.infoCard}>
        <View style={styles.infoCardHeaderRow}>
          <Text style={styles.cardHeaderTitle}>Informasi Pribadi & Domisili</Text>
          <TouchableOpacity
            style={styles.headerEditLink}
            onPress={handleOpenEditProfile}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={16}
              color={Colors.skyBlueHeader}
            />
            <Text style={styles.headerEditLinkText}>Ubah</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nama Lengkap</Text>
          <Text style={styles.infoValue}>{currentUser.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>NIK</Text>
          <Text style={styles.infoValue}>{currentUser.nik || '-'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Usia / Umur</Text>
          <Text style={styles.infoValue}>
            {currentUser.age ? `${currentUser.age} Tahun` : 'Belum diisi'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Alamat Domisili</Text>
          <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]}>
            {currentUser.address || 'Belum diisi'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Peran Akun</Text>
          <Text style={[styles.infoValue, { color: currentRoleMeta.badgeColor }]}>
            {currentRoleMeta.title} ({currentUser.role})
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Kelurahan</Text>
          <Text style={styles.infoValue}>{currentUser.kelurahan}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>RW / RT</Text>
          <Text style={styles.infoValue}>
            RW {currentUser.rw} / RT {currentUser.rt}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>No. HP / WA</Text>
          <Text style={styles.infoValue}>{currentUser.phone}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{currentUser.email || '-'}</Text>
        </View>
      </View>

      {/* 3. RIWAYAT RSVP SAYA */}
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
            const rsvpInfo = RsvpStatusMeta[act.userRsvpStatus];
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

      {/* 4. KONTAK PENTING WILAYAH */}
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

      {/* 5. LOGOUT BUTTON */}
      <TouchableOpacity
        style={styles.logoutBtn}
        activeOpacity={0.85}
        onPress={handleLogout}
      >
        <MaterialCommunityIcons name="logout" size={20} color={Colors.white} />
        <Text style={styles.logoutBtnText}>Keluar dari Aplikasi</Text>
      </TouchableOpacity>

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
                  onPress={handlePickAvatar}
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
                <TouchableOpacity onPress={handlePickAvatar}>
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
                <Text style={styles.formLabel}>Pilih Peran / Jabatan Akun *</Text>
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
    backgroundColor: Colors.skyBlueBackground,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 110,
    gap: 14,
  },
  profileHeaderCard: {
    backgroundColor: Colors.skyBlueHeader,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatarLetter: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.skyBlueHeader,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  profileNik: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    marginBottom: 10,
  },
  roleBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  rolePillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roleBadgePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.yellowContainer,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  infoCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  headerEditLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerEditLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textNavyMuted,
    width: 110,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textNavyDark,
    textAlign: 'right',
  },
  rsvpCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.yellowBorderLis,
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
  },
  counterBadge: {
    backgroundColor: Colors.yellowContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  counterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  emptyRsvpText: {
    fontSize: 12,
    color: Colors.textNavyMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  rsvpHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 12,
    padding: 10,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  rsvpHistoryInfo: {
    flex: 1,
    marginRight: 8,
  },
  rsvpHistoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  rsvpHistoryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rsvpHistoryDate: {
    fontSize: 11,
    color: Colors.textNavyMuted,
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
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  contactCategoryGroup: {
    marginVertical: 4,
  },
  contactCategoryBadge: {
    backgroundColor: Colors.yellowContainer,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  contactCategoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onYellowContainer,
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
