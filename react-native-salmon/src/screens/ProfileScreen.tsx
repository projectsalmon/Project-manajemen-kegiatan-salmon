import React, { useState } from 'react';
import {
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
import { RoleSwitchSheet } from '../components/RoleSwitchSheet';
import { Colors, RsvpStatusMeta } from '../constants/theme';
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
    switchRole,
    addContact,
    updateContact,
    deleteContact,
    showToast,
  } = useApp();

  const [isRoleSheetVisible, setIsRoleSheetVisible] = useState(false);
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactCategory, setContactCategory] = useState('Kantor Kelurahan Sukamaju');

  const isAdmin = currentUser.role !== 'WARGA';

  // Filter activities with RSVP response
  const rsvpHistory = activities.filter((a) => a.userRsvpStatus !== 'NONE');

  // Group contacts by category
  const groupedContacts = contacts.reduce((acc, contact) => {
    if (!acc[contact.category]) acc[contact.category] = [];
    acc[contact.category].push(contact);
    return acc;
  }, {} as Record<string, ContactItem[]>);

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
        <Text style={styles.profileNik}>NIK: {currentUser.nik}</Text>

        <TouchableOpacity
          style={styles.roleBadgePill}
          activeOpacity={0.8}
          onPress={() => setIsRoleSheetVisible(true)}
        >
          <View style={styles.rolePillDot} />
          <Text style={styles.roleBadgePillText}>
            Peran: {currentUser.role}
          </Text>
          <MaterialCommunityIcons
            name="swap-horizontal"
            size={18}
            color={Colors.onYellowContainer}
          />
        </TouchableOpacity>
      </View>

      {/* 2. RESIDENT / DOMICILE INFO */}
      <View style={styles.infoCard}>
        <Text style={styles.cardHeaderTitle}>Informasi Domisili & Warga</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Kelurahan</Text>
          <Text style={styles.infoValue}>{currentUser.kelurahan}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>RW</Text>
          <Text style={styles.infoValue}>{currentUser.rw}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>RT</Text>
          <Text style={styles.infoValue}>{currentUser.rt}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>No. HP / WhatsApp</Text>
          <Text style={styles.infoValue}>{currentUser.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{currentUser.email}</Text>
        </View>
      </View>

      {/* 3. SECTION: RIWAYAT RSVP SAYA */}
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

      {/* 4. SECTION: KONTAK PENTING WILAYAH */}
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

      {/* 5. GANTI PERAN & LOGOUT */}
      <TouchableOpacity
        style={styles.switchRoleOutlineBtn}
        activeOpacity={0.85}
        onPress={() => setIsRoleSheetVisible(true)}
      >
        <MaterialCommunityIcons
          name="swap-vertical"
          size={20}
          color={Colors.skyBlueHeader}
        />
        <Text style={styles.switchRoleOutlineBtnText}>
          Ganti Peran Pengguna (Demo Role Switch)
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutBtn}
        activeOpacity={0.85}
        onPress={handleLogout}
      >
        <MaterialCommunityIcons name="logout" size={20} color={Colors.white} />
        <Text style={styles.logoutBtnText}>Keluar dari Aplikasi</Text>
      </TouchableOpacity>

      {/* Role Switch Bottom Sheet */}
      <RoleSwitchSheet
        visible={isRoleSheetVisible}
        currentRole={currentUser.role}
        onRoleSelected={(newRole) => switchRole(newRole)}
        onDismiss={() => setIsRoleSheetVisible(false)}
      />

      {/* Add / Edit Contact Modal */}
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

            <View style={styles.contactField}>
              <Text style={styles.contactLabel}>Nama Kontak & Jabatan *</Text>
              <TextInput
                style={styles.contactInput}
                placeholder="Contoh: Bpk. Sutrisno (Ketua RW 05)"
                placeholderTextColor={Colors.textNavyMuted}
                value={contactName}
                onChangeText={setContactName}
              />
            </View>

            <View style={styles.contactField}>
              <Text style={styles.contactLabel}>Nomor Telepon / WhatsApp *</Text>
              <TextInput
                style={styles.contactInput}
                placeholder="0812-3456-7890"
                placeholderTextColor={Colors.textNavyMuted}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.contactField}>
              <Text style={styles.contactLabel}>Kategori Wilayah / Jabatan</Text>
              <TextInput
                style={styles.contactInput}
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
                style={styles.cancelContactBtn}
                onPress={() => setIsContactModalVisible(false)}
              >
                <Text style={styles.cancelContactBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveContactBtn}
                onPress={handleSaveContact}
              >
                <Text style={styles.saveContactBtnText}>
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
    elevation: 2,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarLetter: {
    fontSize: 28,
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
    marginBottom: 12,
  },
  roleBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.yellowContainer,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  rolePillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.onYellowContainer,
  },
  roleBadgePillText: {
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
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textNavyMuted,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textNavyDark,
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
  switchRoleOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.skyBlueHeader,
    borderRadius: 14,
    height: 48,
    gap: 8,
  },
  switchRoleOutlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
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
  contactField: {
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
    marginBottom: 4,
  },
  contactInput: {
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.textNavyDark,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
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
  cancelContactBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelContactBtnText: {
    fontSize: 13,
    color: Colors.textNavySecondary,
    fontWeight: '600',
  },
  saveContactBtn: {
    backgroundColor: Colors.yellowHighlight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveContactBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
});
