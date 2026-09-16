import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityCard } from '../components/ActivityCard';
import { VerificationModal } from '../components/VerificationModal';
import { Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { RsvpStatusType } from '../types';

interface CalendarScreenProps {
  route?: any;
  navigation: any;
}

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAYS_OF_WEEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Rentang tahun dari 2020 sampai 2034 agar pengguna dapat menavigasi tahun lalu & tahun depan
const AVAILABLE_YEARS = Array.from({ length: 15 }, (_, i) => 2020 + i);

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ route, navigation }) => {
  const { currentUser, activities, updateRsvpStatus } = useApp();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);
  const [pendingActivityRsvp, setPendingActivityRsvp] = useState<{ id: string; status: RsvpStatusType } | null>(null);

  // Modal Pemilih Bulan & Tahun
  const [isMonthYearModalVisible, setIsMonthYearModalVisible] = useState(false);
  const [modalYear, setModalYear] = useState(today.getFullYear());
  const [isYearPickerView, setIsYearPickerView] = useState(false);

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

  // Navigasi Bulan (Panah Kiri & Kanan)
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // Penyesuaian tanggal terpilih saat berganti bulan
  useEffect(() => {
    const daysInNewMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    if (selectedDay > daysInNewMonth) {
      setSelectedDay(daysInNewMonth);
    }
  }, [currentYear, currentMonth]);

  // Handler Modal Bulan & Tahun
  const handleOpenMonthYearModal = () => {
    setModalYear(currentYear);
    setIsYearPickerView(false);
    setIsMonthYearModalVisible(true);
  };

  const handleSelectMonth = (monthIndex: number) => {
    setCurrentMonth(monthIndex);
    setCurrentYear(modalYear);
    const daysInNewMonth = new Date(modalYear, monthIndex + 1, 0).getDate();
    if (selectedDay > daysInNewMonth) {
      setSelectedDay(daysInNewMonth);
    }
    setIsMonthYearModalVisible(false);
  };

  const handleSelectYear = (year: number) => {
    setModalYear(year);
    setIsYearPickerView(false);
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDay(now.getDate());
    setIsMonthYearModalVisible(false);
  };

  const isTabScreen = route?.name === 'KalenderTab';
  const isAdmin = currentUser.role !== 'WARGA';

  // Perhitungan Kalender Dinamis
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startOffset = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Minggu, 1 = Senin, dst.
  const rows = Math.ceil((totalDays + startOffset) / 7);

  const selectedMonthStr = String(currentMonth + 1).padStart(2, '0');
  const selectedDayStr = String(selectedDay).padStart(2, '0');
  const selectedDateIso = `${currentYear}-${selectedMonthStr}-${selectedDayStr}`;

  // Filter titik kegiatan untuk bulan dan tahun yang sedang dilihat
  const currentYearMonthPrefix = `${currentYear}-${selectedMonthStr}`;
  const daysWithActivities = new Set(
    activities
      .filter((a) => a.dateIso && a.dateIso.startsWith(currentYearMonthPrefix))
      .map((a) => {
        const parts = a.dateIso.split('-');
        return parseInt(parts[2], 10);
      })
  );

  const activitiesForSelectedDay = activities.filter(
    (a) =>
      a.dateIso === selectedDateIso &&
      (currentUser.role === 'WARGA' ? a.approvalStatus === 'PUBLISHED' : true)
  );

  const renderContent = () => (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 2. CALENDAR CARD */}
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          {/* Tombol Pemilih Bulan & Tahun */}
          <TouchableOpacity
            style={styles.monthYearPickerBtn}
            activeOpacity={0.75}
            onPress={handleOpenMonthYearModal}
          >
            <Text style={styles.monthTitle}>
              {MONTH_NAMES_ID[currentMonth]} {currentYear}
            </Text>
            <View style={styles.dropdownPill}>
              <MaterialCommunityIcons
                name="chevron-down"
                size={18}
                color={Colors.skyBlueHeader}
              />
            </View>
          </TouchableOpacity>

          {/* Tombol Geser Bulan (Kiri & Kanan) */}
          <View style={styles.chevronGroup}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={styles.chevronBtn}
              activeOpacity={0.7}
              accessibilityLabel="Bulan Sebelumnya"
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color={Colors.textNavyDark}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.chevronBtn}
              activeOpacity={0.7}
              accessibilityLabel="Bulan Berikutnya"
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={Colors.textNavyDark}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Days of week */}
        <View style={styles.daysOfWeekRow}>
          {DAYS_OF_WEEK.map((day, idx) => (
            <Text
              key={idx}
              style={[
                styles.dayOfWeekText,
                idx === 0 && { color: Colors.urgentRed }, // Hari Minggu
              ]}
            >
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.gridContainer}>
          {Array.from({ length: rows }).map((_, r) => (
            <View key={r} style={styles.gridRow}>
              {Array.from({ length: 7 }).map((_, c) => {
                const dayNum = r * 7 + c - startOffset + 1;
                const isValid = dayNum >= 1 && dayNum <= totalDays;
                const isSelected = isValid && dayNum === selectedDay;
                const hasActivity = isValid && daysWithActivities.has(dayNum);
                const isSunday = c === 0;
                const isTodayCell =
                  isValid &&
                  dayNum === today.getDate() &&
                  currentMonth === today.getMonth() &&
                  currentYear === today.getFullYear();

                if (!isValid) {
                  return <View key={c} style={styles.dayCellEmpty} />;
                }

                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.dayCell,
                      isTodayCell && !isSelected && styles.dayCellToday,
                      isSelected && styles.dayCellSelected,
                    ]}
                    onPress={() => setSelectedDay(dayNum)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        isSunday && !isSelected && { color: Colors.urgentRed },
                        (isSelected || hasActivity || isTodayCell) && styles.dayNumberBold,
                        isSelected && styles.dayNumberSelected,
                      ]}
                    >
                      {dayNum}
                    </Text>
                    {hasActivity && (
                      <View
                        style={[
                          styles.activityDot,
                          isSelected && { backgroundColor: Colors.onYellowContainer },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* 3. AGENDA LIST FOR SELECTED DAY */}
      <View style={styles.agendaHeader}>
        <View>
          <Text style={styles.agendaTitle}>
            Agenda {selectedDay} {MONTH_NAMES_ID[currentMonth]} {currentYear}
          </Text>
          <Text style={styles.agendaSubtitle}>
            {activitiesForSelectedDay.length} Kegiatan Terjadwal
          </Text>
        </View>

        {isAdmin && (
          <TouchableOpacity
            style={styles.addAgendaBtn}
            onPress={() =>
              navigation.navigate('CreateEditActivityScreen', {
                initialDate: selectedDateIso,
              })
            }
          >
            <MaterialCommunityIcons
              name="plus-circle"
              size={22}
              color={Colors.yellowAccent}
            />
          </TouchableOpacity>
        )}
      </View>

      {activitiesForSelectedDay.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons
            name="calendar-check-outline"
            size={36}
            color={Colors.skyBlueHeader}
          />
          <Text style={styles.emptyCardTitle}>
            Tidak Ada Kegiatan Pada Tanggal Ini
          </Text>
          <Text style={styles.emptyCardSub}>
            Silakan pilih tanggal lain yang memiliki titik indikator, atau geser bulan untuk melihat agenda lainnya.
          </Text>
        </View>
      ) : (
        activitiesForSelectedDay.map((act) => (
          <ActivityCard
            key={act.id}
            activity={act}
            onCardClick={() =>
              navigation.navigate('ActivityDetailScreen', {
                activityId: act.id,
              })
            }
            onRsvpClick={(newStatus) => handleRsvpWithVerification(act.id, newStatus)}
          />
        ))
      )}

      {/* Modal Pemilih Bulan & Tahun */}
      <Modal
        visible={isMonthYearModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMonthYearModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitleGroup}>
                <MaterialCommunityIcons
                  name="calendar-month"
                  size={22}
                  color={Colors.skyBlueHeader}
                />
                <Text style={styles.pickerModalTitle}>Pilih Bulan & Tahun</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsMonthYearModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialCommunityIcons name="close" size={22} color={Colors.textNavyDark} />
              </TouchableOpacity>
            </View>

            {/* Year Control Bar */}
            <View style={styles.yearControlBar}>
              <TouchableOpacity
                style={styles.yearArrowBtn}
                onPress={() => setModalYear((y) => y - 1)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.skyBlueHeader} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.yearDisplayBtn}
                onPress={() => setIsYearPickerView(!isYearPickerView)}
                activeOpacity={0.7}
              >
                <Text style={styles.yearDisplayText}>{modalYear}</Text>
                <MaterialCommunityIcons
                  name={isYearPickerView ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.skyBlueHeader}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.yearArrowBtn}
                onPress={() => setModalYear((y) => y + 1)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.skyBlueHeader} />
              </TouchableOpacity>
            </View>

            {isYearPickerView ? (
              // Tampilan Pilih Tahun (Grid Tahun)
              <View>
                <Text style={styles.pickerSubHint}>Pilih tahun yang diinginkan:</Text>
                <ScrollView style={styles.yearScrollList} contentContainerStyle={styles.yearGrid}>
                  {AVAILABLE_YEARS.map((yr) => (
                    <TouchableOpacity
                      key={yr}
                      style={[
                        styles.yearChip,
                        yr === modalYear && styles.yearChipSelected,
                        yr === today.getFullYear() && yr !== modalYear && styles.yearChipToday,
                      ]}
                      onPress={() => handleSelectYear(yr)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.yearChipText,
                          yr === modalYear && styles.yearChipTextSelected,
                        ]}
                      >
                        {yr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : (
              // Tampilan Pilih Bulan (Grid 12 Bulan)
              <View>
                <Text style={styles.pickerSubHint}>Pilih bulan untuk tahun {modalYear}:</Text>
                <View style={styles.monthGrid}>
                  {MONTH_NAMES_ID.map((mName, idx) => {
                    const isCurrentSelected = idx === currentMonth && modalYear === currentYear;
                    const isRealThisMonth = idx === today.getMonth() && modalYear === today.getFullYear();
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.monthCell,
                          isCurrentSelected && styles.monthCellSelected,
                          isRealThisMonth && !isCurrentSelected && styles.monthCellThisMonth,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleSelectMonth(idx)}
                      >
                        <Text
                          style={[
                            styles.monthCellText,
                            isCurrentSelected && styles.monthCellTextSelected,
                            isRealThisMonth && !isCurrentSelected && styles.monthCellTextThisMonth,
                          ]}
                        >
                          {mName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Bottom Quick Action */}
            <View style={styles.modalBottomRow}>
              <TouchableOpacity
                style={styles.goToTodayBtn}
                activeOpacity={0.8}
                onPress={handleGoToToday}
              >
                <MaterialCommunityIcons name="calendar-today" size={16} color={Colors.skyBlueHeader} />
                <Text style={styles.goToTodayBtnText}>Bulan Ini</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsMonthYearModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Verification Modal */}
      <VerificationModal
        visible={isVerificationModalVisible}
        onClose={() => setIsVerificationModalVisible(false)}
        onSuccess={handleVerificationSuccess}
      />
    </ScrollView>
  );

  if (isTabScreen) {
    return <View style={styles.tabContainer}>{renderContent()}</View>;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. APP BAR (Only in stack mode) */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          style={styles.topIconButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={Colors.textNavyDark}
          />
        </TouchableOpacity>
        <Text style={styles.topAppBarTitle}>Kalender Kegiatan</Text>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.skyBlueBackground,
  },
  tabContainer: {
    flex: 1,
    backgroundColor: Colors.skyBlueBackground,
  },
  topAppBar: {
    height: 56,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    elevation: 3,
  },
  topIconButton: {
    padding: 8,
  },
  topAppBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textNavyDark,
    marginLeft: 4,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 110,
  },
  calendarCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.yellowBorderLis,
    marginBottom: 16,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthYearPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skyBlueSurfaceVariant,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 6,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.skyBlueHeader,
  },
  dropdownPill: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderRadius: 10,
    padding: 2,
  },
  chevronGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  chevronBtn: {
    padding: 6,
    backgroundColor: Colors.skyBlueSurfaceVariant,
    borderRadius: 12,
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayOfWeekText: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textNavyMuted,
  },
  gridContainer: {
    gap: 6,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.skyBlueHeader,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  },
  dayCellSelected: {
    backgroundColor: Colors.yellowHighlight,
    borderWidth: 0,
  },
  dayCellEmpty: {
    width: 38,
    height: 38,
  },
  dayNumberText: {
    fontSize: 13,
    color: Colors.textNavyDark,
  },
  dayNumberBold: {
    fontWeight: '700',
  },
  dayNumberSelected: {
    color: Colors.onYellowContainer,
  },
  activityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.skyBlueHeader,
    marginTop: 1,
  },
  agendaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  agendaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  agendaSubtitle: {
    fontSize: 12,
    color: Colors.textNavyMuted,
    marginTop: 1,
  },
  addAgendaBtn: {
    padding: 4,
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textNavyDark,
    marginTop: 8,
  },
  emptyCardSub: {
    fontSize: 12,
    color: Colors.textNavySecondary,
    textAlign: 'center',
    marginTop: 2,
  },

  // Modal Month & Year Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 18,
    width: '100%',
    maxWidth: 360,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 14,
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textNavyDark,
  },
  modalCloseBtn: {
    padding: 4,
  },
  yearControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.skyBlueSurfaceVariant,
    borderRadius: 16,
    padding: 4,
    marginBottom: 14,
  },
  yearArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  yearDisplayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  yearDisplayText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textNavyDark,
  },
  pickerSubHint: {
    fontSize: 12,
    color: Colors.textNavyMuted,
    fontWeight: '600',
    marginBottom: 10,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  monthCell: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.skyBlueBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    marginBottom: 4,
  },
  monthCellSelected: {
    backgroundColor: Colors.skyBlueHeader,
    borderColor: Colors.skyBlueHeader,
  },
  monthCellThisMonth: {
    borderWidth: 1.5,
    borderColor: Colors.yellowAccent,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
  },
  monthCellText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  monthCellTextSelected: {
    color: Colors.white,
  },
  monthCellTextThisMonth: {
    color: Colors.skyBlueHeader,
    fontWeight: '800',
  },
  yearScrollList: {
    maxHeight: 210,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 8,
  },
  yearChip: {
    width: '31%',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.skyBlueBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    marginBottom: 4,
  },
  yearChipSelected: {
    backgroundColor: Colors.skyBlueHeader,
    borderColor: Colors.skyBlueHeader,
  },
  yearChipToday: {
    borderWidth: 1.5,
    borderColor: Colors.yellowAccent,
  },
  yearChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  yearChipTextSelected: {
    color: Colors.white,
    fontWeight: '800',
  },
  modalBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  goToTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.skyBlueSurfaceVariant,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  goToTodayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.skyBlueHeader,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textNavySecondary,
  },
});

