import React, { useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityCard } from '../components/ActivityCard';
import { VerificationModal } from '../components/VerificationModal';
import { CategoryMeta, Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { ActivityCategoryType, ActivityItem, RsvpStatusType } from '../types';

interface ActivityListScreenProps {
  navigation: any;
}

export const ActivityListScreen: React.FC<ActivityListScreenProps> = ({ navigation }) => {
  const {
    currentUser,
    activities,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    selectedRegionFilter,
    setSelectedRegionFilter,
    updateRsvpStatus,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);
  const [pendingActivityRsvp, setPendingActivityRsvp] = useState<{ id: string; status: RsvpStatusType } | null>(null);

  const handleRsvpWithVerification = (activityId: string, newStatus: RsvpStatusType) => {
    if (currentUser.role === 'WARGA' && !currentUser.isVerifiedWarga && newStatus !== 'NONE') {
      setPendingActivityRsvp({ id: activityId, status: newStatus });
      setIsVerificationModalVisible(true);
      return;
    }
    updateRsvpStatus(activityId, newStatus);
  };

  const handleVerificationSuccess = () => {
    if (pendingActivityRsvp) {
      updateRsvpStatus(pendingActivityRsvp.id, pendingActivityRsvp.status);
      setPendingActivityRsvp(null);
    }
  };

  const isAdmin = currentUser.role !== 'WARGA';
  const categories: ActivityCategoryType[] = [
    'POSYANDU',
    'KERJA_BAKTI',
    'RAPAT',
    'KESEHATAN',
    'SOSIAL',
    'OLAH_RAGA',
  ];
  const regions = [
    'Semua Wilayah',
    'RT 01',
    'RT 02',
    'RT 03',
    'RT 04',
    'RW 05',
    'Kelurahan Sukamaju',
  ];

  const filteredActivities = activities.filter((item) => {
    // Warga only sees PUBLISHED
    const matchesApproval =
      currentUser.role === 'WARGA' ? item.approvalStatus === 'PUBLISHED' : true;

    const matchesQuery =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategoryFilter === null || item.category === selectedCategoryFilter;

    const matchesRegion =
      selectedRegionFilter === 'Semua Wilayah' ||
      item.targetRegion.toLowerCase().includes(selectedRegionFilter.toLowerCase());

    return matchesApproval && matchesQuery && matchesCategory && matchesRegion;
  });

  return (
    <View style={styles.container}>
      {/* 1. SEARCH BAR */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={Colors.skyBlueHeader}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kegiatan (judul, tempat, deskripsi)..."
            placeholderTextColor={Colors.textNavyMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={Colors.textNavyMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. CATEGORY FILTER CHIPS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterChipRow}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            selectedCategoryFilter === null && styles.chipActive,
          ]}
          onPress={() => setSelectedCategoryFilter(null)}
          activeOpacity={0.8}
        >
          {selectedCategoryFilter === null && (
            <MaterialCommunityIcons
              name="check"
              size={15}
              color={Colors.onYellowContainer}
            />
          )}
          <Text
            style={[
              styles.chipText,
              selectedCategoryFilter === null && styles.chipTextActive,
            ]}
          >
            Semua Kategori
          </Text>
        </TouchableOpacity>

        {categories.map((catKey) => {
          const meta = CategoryMeta[catKey];
          const isSelected = selectedCategoryFilter === catKey;

          return (
            <TouchableOpacity
              key={catKey}
              style={[
                styles.chip,
                { backgroundColor: isSelected ? meta.containerColor : Colors.white },
                isSelected && { borderColor: meta.badgeColor, borderWidth: 1.5 },
              ]}
              onPress={() =>
                setSelectedCategoryFilter(isSelected ? null : catKey)
              }
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? meta.badgeColor : Colors.textNavyDark },
                ]}
              >
                {meta.displayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 3. REGION FILTER CHIPS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.regionFilterScrollView}
        contentContainerStyle={styles.regionFilterRow}
      >
        {regions.map((reg) => {
          const isSelected = selectedRegionFilter === reg;

          return (
            <TouchableOpacity
              key={reg}
              style={[
                styles.regionChip,
                isSelected && styles.regionChipActive,
              ]}
              onPress={() => setSelectedRegionFilter(reg)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.regionChipText,
                  isSelected && styles.regionChipTextActive,
                ]}
              >
                {reg}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.divider} />

      {/* 4. ACTIVITY LIST CONTENT */}
      {filteredActivities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="calendar-blank-outline"
            size={64}
            color={Colors.textNavyMuted}
          />
          <Text style={styles.emptyTitle}>Tidak Ada Kegiatan Ditemukan</Text>
          <Text style={styles.emptySubtitle}>
            Coba ubah kata kunci pencarian atau filter wilayah.
          </Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setSearchQuery('');
              setSelectedCategoryFilter(null);
              setSelectedRegionFilter('Semua Wilayah');
            }}
          >
            <Text style={styles.resetButtonText}>Reset Filter</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredActivities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ActivityCard
              activity={item}
              onCardClick={() =>
                navigation.navigate('ActivityDetailScreen', {
                  activityId: item.id,
                })
              }
              onRsvpClick={(newStatus) => handleRsvpWithVerification(item.id, newStatus)}
              onEditClick={
                isAdmin
                  ? () =>
                      navigation.navigate('CreateEditActivityScreen', {
                        editId: item.id,
                      })
                  : undefined
              }
            />
          )}
        />
      )}

      {/* 5. FLOATING ACTION BUTTON (ADMIN ONLY) */}
      {isAdmin && (
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CreateEditActivityScreen')}
        >
          <MaterialCommunityIcons
            name="plus"
            size={22}
            color={Colors.onYellowContainer}
          />
          <Text style={styles.fabText}>Buat Kegiatan</Text>
        </TouchableOpacity>
      )}

      {/* 6. VERIFICATION MODAL */}
      <VerificationModal
        visible={isVerificationModalVisible}
        onClose={() => setIsVerificationModalVisible(false)}
        onSuccess={handleVerificationSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.skyBlueBackground,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textNavyDark,
    includeFontPadding: false,
  },
  filterScrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterChipRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 5,
  },
  chipActive: {
    backgroundColor: Colors.yellowContainer,
    borderColor: Colors.yellowBorderLis,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: Colors.textNavyDark,
    includeFontPadding: false,
  },
  chipTextActive: {
    color: Colors.onYellowContainer,
    fontWeight: '700',
  },
  regionFilterScrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  regionFilterRow: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 6,
    gap: 6,
    alignItems: 'center',
  },
  regionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 30,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  regionChipActive: {
    backgroundColor: Colors.yellowContainer,
    borderColor: Colors.yellowBorderLis,
  },
  regionChipText: {
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textNavyDark,
    fontWeight: '600',
    includeFontPadding: false,
  },
  regionChipTextActive: {
    color: Colors.onYellowContainer,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.skyBlueSurfaceVariant,
    marginVertical: 4,
  },
  listPadding: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textNavyDark,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textNavySecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: Colors.yellowHighlight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.yellowHighlight,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 6,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onYellowContainer,
  },
});
