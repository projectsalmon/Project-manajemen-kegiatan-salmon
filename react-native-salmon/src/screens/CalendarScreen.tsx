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
import { ActivityCard } from '../components/ActivityCard';
import { Colors } from '../constants/theme';
import { useApp } from '../context/AppContext';

interface CalendarScreenProps {
  route?: any;
  navigation: any;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ route, navigation }) => {
  const { currentUser, activities, updateRsvpStatus } = useApp();
  const [selectedDay, setSelectedDay] = useState(18);

  const isTabScreen = route?.name === 'KalenderTab';
  const isAdmin = currentUser.role !== 'WARGA';
  const currentMonthName = 'Mei 2025';
  const totalDays = 31;
  const startOffset = 4; // May 1, 2025 starts on Thursday (index 4)

  const selectedDateIso = `2025-05-${selectedDay.toString().padStart(2, '0')}`;

  // Map of activity dates
  const daysWithActivities = new Set(
    activities.map((a) => {
      const parts = a.dateIso.split('-');
      return parseInt(parts[2], 10);
    })
  );

  const activitiesForSelectedDay = activities.filter(
    (a) =>
      a.dateIso === selectedDateIso &&
      (currentUser.role === 'WARGA' ? a.approvalStatus === 'PUBLISHED' : true)
  );

  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const rows = Math.ceil((totalDays + startOffset) / 7);

  const renderContent = () => (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
        {/* 2. CALENDAR CARD */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthTitle}>{currentMonthName}</Text>
            <View style={styles.chevronGroup}>
              <TouchableOpacity
                onPress={() => setSelectedDay(Math.max(1, selectedDay - 1))}
                style={styles.chevronBtn}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={24}
                  color={Colors.textNavyDark}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  setSelectedDay(Math.min(totalDays, selectedDay + 1))
                }
                style={styles.chevronBtn}
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
            {daysOfWeek.map((day, idx) => (
              <Text key={idx} style={styles.dayOfWeekText}>
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

                  if (!isValid) {
                    return <View key={c} style={styles.dayCellEmpty} />;
                  }

                  return (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                      ]}
                      onPress={() => setSelectedDay(dayNum)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayNumberText,
                          (isSelected || hasActivity) && styles.dayNumberBold,
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
              Agenda {selectedDay} Mei 2025
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
              Silakan pilih tanggal lain yang memiliki titik indikator.
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
              onRsvpClick={(newStatus) => updateRsvpStatus(act.id, newStatus)}
            />
          ))
        )}
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
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.skyBlueHeader,
  },
  chevronGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  chevronBtn: {
    padding: 4,
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
  dayCellSelected: {
    backgroundColor: Colors.yellowHighlight,
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
});
