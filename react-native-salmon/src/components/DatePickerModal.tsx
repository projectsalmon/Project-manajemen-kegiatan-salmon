import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/theme';

interface DatePickerModalProps {
  visible: boolean;
  initialDateIso?: string; // YYYY-MM-DD
  title?: string;
  onClose: () => void;
  onSelectDate: (dateIso: string, formattedDate: string) => void;
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

const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAYS_OF_WEEK_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  initialDateIso,
  title = 'Pilih Tanggal',
  onClose,
  onSelectDate,
}) => {
  const getInitialYearMonthDay = () => {
    if (initialDateIso && /^\d{4}-\d{2}-\d{2}$/.test(initialDateIso)) {
      const parts = initialDateIso.split('-').map(Number);
      return { year: parts[0], month: parts[1] - 1, day: parts[2] };
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
  };

  const init = getInitialYearMonthDay();
  const [currentYear, setCurrentYear] = useState(init.year);
  const [currentMonth, setCurrentMonth] = useState(init.month);
  const [selectedDay, setSelectedDay] = useState(init.day);

  useEffect(() => {
    if (visible) {
      const fresh = getInitialYearMonthDay();
      setCurrentYear(fresh.year);
      setCurrentMonth(fresh.month);
      setSelectedDay(fresh.day);
    }
  }, [visible, initialDateIso]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const formatResult = (year: number, month: number, day: number) => {
    const d = new Date(year, month, day);
    const dayName = DAY_NAMES_ID[d.getDay()];
    const monthName = MONTH_NAMES_ID[month];
    const monthFormatted = String(month + 1).padStart(2, '0');
    const dayFormatted = String(day).padStart(2, '0');

    const iso = `${year}-${monthFormatted}-${dayFormatted}`;
    const formatted = `${dayName}, ${day} ${monthName} ${year}`;
    return { iso, formatted };
  };

  const handleConfirm = () => {
    const { iso, formatted } = formatResult(currentYear, currentMonth, selectedDay);
    onSelectDate(iso, formatted);
    onClose();
  };

  // Quick preset shortcuts
  const handleQuickPreset = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    setCurrentYear(target.getFullYear());
    setCurrentMonth(target.getMonth());
    setSelectedDay(target.getDate());
  };

  const handleThisWeekend = () => {
    const target = new Date();
    const currentDay = target.getDay();
    const daysUntilSaturday = (6 - currentDay + 7) % 7 || 7;
    target.setDate(target.getDate() + daysUntilSaturday);
    setCurrentYear(target.getFullYear());
    setCurrentMonth(target.getMonth());
    setSelectedDay(target.getDate());
  };

  const totalCells = Math.ceil((daysInMonth + firstDayOfWeek) / 7) * 7;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.calendarContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={22}
                color={Colors.skyBlueHeader}
              />
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={Colors.textNavyDark}
              />
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <View style={styles.presetsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleQuickPreset(0)}
              >
                <Text style={styles.presetChipText}>Hari Ini</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleQuickPreset(1)}
              >
                <Text style={styles.presetChipText}>Besok</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={handleThisWeekend}
              >
                <Text style={styles.presetChipText}>Sabtu Ini</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleQuickPreset(7)}
              >
                <Text style={styles.presetChipText}>Minggu Depan</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Month & Year Navigation */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrowBtn}>
              <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color={Colors.skyBlueHeader}
              />
            </TouchableOpacity>

            <Text style={styles.monthYearText}>
              {MONTH_NAMES_ID[currentMonth]} {currentYear}
            </Text>

            <TouchableOpacity onPress={handleNextMonth} style={styles.navArrowBtn}>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={Colors.skyBlueHeader}
              />
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View style={styles.weekHeaderRow}>
            {DAYS_OF_WEEK_SHORT.map((day, idx) => (
              <Text
                key={idx}
                style={[
                  styles.weekDayText,
                  idx === 0 && { color: Colors.urgentRed }, // Sunday
                ]}
              >
                {day}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {Array.from({ length: totalCells }).map((_, index) => {
              const dayNum = index - firstDayOfWeek + 1;
              const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
              const isSelected = isCurrentMonth && dayNum === selectedDay;
              const dayOfWeek = index % 7;
              const isSunday = dayOfWeek === 0;

              if (!isCurrentMonth) {
                return <View key={index} style={styles.dayCellEmpty} />;
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedDay(dayNum)}
                >
                  <Text
                    style={[
                      styles.dayCellText,
                      isSunday && { color: Colors.urgentRed },
                      isSelected && styles.dayCellTextSelected,
                    ]}
                  >
                    {dayNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Preview Banner */}
          <View style={styles.selectedPreviewBox}>
            <MaterialCommunityIcons
              name="calendar-check"
              size={18}
              color={Colors.skyBlueHeader}
            />
            <Text style={styles.selectedPreviewText} numberOfLines={1}>
              {formatResult(currentYear, currentMonth, selectedDay).formatted}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              activeOpacity={0.85}
              onPress={handleConfirm}
            >
              <MaterialCommunityIcons
                name="check"
                size={18}
                color={Colors.onYellowContainer}
              />
              <Text style={styles.confirmBtnText}>Pilih Tanggal Ini</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  calendarContainer: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 18,
    width: '100%',
    maxWidth: 380,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.textNavyDark,
  },
  closeBtn: {
    padding: 4,
  },
  presetsWrapper: {
    marginVertical: 10,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    backgroundColor: Colors.skyBlueSurfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.skyBlueHeader,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.skyBlueSurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearText: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.textNavyDark,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.textNavyMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 19,
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  dayCellSelected: {
    backgroundColor: Colors.skyBlueHeader,
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.textNavyDark,
  },
  dayCellTextSelected: {
    color: Colors.white,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
  },
  selectedPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skyBlueBackground,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginTop: 12,
  },
  selectedPreviewText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.skyBlueHeader,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.textNavySecondary,
  },
  confirmBtn: {
    backgroundColor: Colors.yellowContainer,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: Colors.onYellowContainer,
  },
});
