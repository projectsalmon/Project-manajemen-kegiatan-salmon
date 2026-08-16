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

interface TimePickerModalProps {
  visible: boolean;
  initialTime?: string; // e.g. "08:00 - 11:00 WIB" or "09:00 WIB"
  title?: string;
  onClose: () => void;
  onSelectTime: (formattedTime: string) => void;
}

const COMMON_PRESETS = [
  { label: '08:00 - 11:00 WIB', desc: 'Pagi Hari' },
  { label: '09:00 - 12:00 WIB', desc: 'Pagi - Siang' },
  { label: '13:30 - 15:30 WIB', desc: 'Siang Hari' },
  { label: '16:00 - 17:30 WIB', desc: 'Sore Hari' },
  { label: '19:30 - 21:30 WIB', desc: 'Malam Hari' },
  { label: '08:00 WIB (Tepat)', desc: 'Jam Mulai' },
  { label: '19:00 WIB (Tepat)', desc: 'Ba’da Isya' },
];

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  initialTime,
  title = 'Pilih Waktu & Jam',
  onClose,
  onSelectTime,
}) => {
  const [isRangeMode, setIsRangeMode] = useState(true);

  // Start Time
  const [startHour, setStartHour] = useState(8);
  const [startMinute, setStartMinute] = useState(0);

  // End Time
  const [endHour, setEndHour] = useState(11);
  const [endMinute, setEndMinute] = useState(0);

  // Parse initial time if possible
  useEffect(() => {
    if (visible && initialTime) {
      const match = initialTime.match(/(\d{1,2})[:.](\d{2})\s*-\s*(\d{1,2})[:.](\d{2})/);
      if (match) {
        setIsRangeMode(true);
        setStartHour(Number(match[1]));
        setStartMinute(Number(match[2]));
        setEndHour(Number(match[3]));
        setEndMinute(Number(match[4]));
      } else {
        const singleMatch = initialTime.match(/(\d{1,2})[:.](\d{2})/);
        if (singleMatch) {
          setIsRangeMode(false);
          setStartHour(Number(singleMatch[1]));
          setStartMinute(Number(singleMatch[2]));
        }
      }
    }
  }, [visible, initialTime]);

  const pad = (n: number) => String(n).padStart(2, '0');

  const getResultString = () => {
    if (isRangeMode) {
      return `${pad(startHour)}:${pad(startMinute)} - ${pad(endHour)}:${pad(endMinute)} WIB`;
    }
    return `${pad(startHour)}:${pad(startMinute)} WIB`;
  };

  const handleApplyPreset = (presetLabel: string) => {
    onSelectTime(presetLabel);
    onClose();
  };

  const handleConfirm = () => {
    onSelectTime(getResultString());
    onClose();
  };

  const adjustHour = (current: number, delta: number) => {
    let next = current + delta;
    if (next < 0) next = 23;
    if (next > 23) next = 0;
    return next;
  };

  const adjustMinute = (current: number, delta: number) => {
    let next = current + delta;
    if (next < 0) next = 45;
    if (next > 45) next = 0;
    return next;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <MaterialCommunityIcons
                name="clock-time-four-outline"
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

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Mode Switch (Rentang Jam vs Jam Tunggal) */}
            <View style={styles.modeSwitchRow}>
              <TouchableOpacity
                style={[
                  styles.modeTabBtn,
                  isRangeMode && styles.modeTabBtnActive,
                ]}
                onPress={() => setIsRangeMode(true)}
              >
                <Text
                  style={[
                    styles.modeTabBtnText,
                    isRangeMode && styles.modeTabBtnTextActive,
                  ]}
                >
                  Rentang Jam (Mulai - Selesai)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeTabBtn,
                  !isRangeMode && styles.modeTabBtnActive,
                ]}
                onPress={() => setIsRangeMode(false)}
              >
                <Text
                  style={[
                    styles.modeTabBtnText,
                    !isRangeMode && styles.modeTabBtnTextActive,
                  ]}
                >
                  Satu Waktu
                </Text>
              </TouchableOpacity>
            </View>

            {/* Time Adjusters */}
            <View style={styles.adjustersCard}>
              {/* Start Time Section */}
              <View style={styles.timeSection}>
                <Text style={styles.timeSectionLabel}>
                  {isRangeMode ? 'Jam Mulai' : 'Waktu Acara'}
                </Text>
                <View style={styles.timeDisplayBox}>
                  {/* Hours */}
                  <View style={styles.timeUnitCol}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setStartHour((h) => adjustHour(h, 1))}
                    >
                      <MaterialCommunityIcons name="chevron-up" size={24} color={Colors.skyBlueHeader} />
                    </TouchableOpacity>
                    <Text style={styles.timeValueText}>{pad(startHour)}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setStartHour((h) => adjustHour(h, -1))}
                    >
                      <MaterialCommunityIcons name="chevron-down" size={24} color={Colors.skyBlueHeader} />
                    </TouchableOpacity>
                    <Text style={styles.timeUnitSub}>Jam</Text>
                  </View>

                  <Text style={styles.timeColon}>:</Text>

                  {/* Minutes */}
                  <View style={styles.timeUnitCol}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setStartMinute((m) => adjustMinute(m, 15))}
                    >
                      <MaterialCommunityIcons name="chevron-up" size={24} color={Colors.skyBlueHeader} />
                    </TouchableOpacity>
                    <Text style={styles.timeValueText}>{pad(startMinute)}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setStartMinute((m) => adjustMinute(m, -15))}
                    >
                      <MaterialCommunityIcons name="chevron-down" size={24} color={Colors.skyBlueHeader} />
                    </TouchableOpacity>
                    <Text style={styles.timeUnitSub}>Menit</Text>
                  </View>
                </View>
              </View>

              {/* End Time Section (Only if Range Mode) */}
              {isRangeMode && (
                <>
                  <View style={styles.rangeDivider}>
                    <Text style={styles.rangeDividerText}>s/d</Text>
                  </View>

                  <View style={styles.timeSection}>
                    <Text style={styles.timeSectionLabel}>Jam Selesai</Text>
                    <View style={styles.timeDisplayBox}>
                      {/* Hours */}
                      <View style={styles.timeUnitCol}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => setEndHour((h) => adjustHour(h, 1))}
                        >
                          <MaterialCommunityIcons name="chevron-up" size={24} color={Colors.skyBlueHeader} />
                        </TouchableOpacity>
                        <Text style={styles.timeValueText}>{pad(endHour)}</Text>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => setEndHour((h) => adjustHour(h, -1))}
                        >
                          <MaterialCommunityIcons name="chevron-down" size={24} color={Colors.skyBlueHeader} />
                        </TouchableOpacity>
                        <Text style={styles.timeUnitSub}>Jam</Text>
                      </View>

                      <Text style={styles.timeColon}>:</Text>

                      {/* Minutes */}
                      <View style={styles.timeUnitCol}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => setEndMinute((m) => adjustMinute(m, 15))}
                        >
                          <MaterialCommunityIcons name="chevron-up" size={24} color={Colors.skyBlueHeader} />
                        </TouchableOpacity>
                        <Text style={styles.timeValueText}>{pad(endMinute)}</Text>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => setEndMinute((m) => adjustMinute(m, -15))}
                        >
                          <MaterialCommunityIcons name="chevron-down" size={24} color={Colors.skyBlueHeader} />
                        </TouchableOpacity>
                        <Text style={styles.timeUnitSub}>Menit</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Quick Presets List */}
            <Text style={styles.presetsHeaderTitle}>Pilihan Jam Populer:</Text>
            <View style={styles.presetsList}>
              {COMMON_PRESETS.map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.presetRowItem}
                  onPress={() => handleApplyPreset(p.label)}
                >
                  <View style={styles.presetInfo}>
                    <Text style={styles.presetLabelText}>{p.label}</Text>
                    <Text style={styles.presetDescText}>{p.desc}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name="arrow-right-circle-outline"
                    size={20}
                    color={Colors.skyBlueHeader}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Selected Time Banner */}
          <View style={styles.selectedPreviewBox}>
            <MaterialCommunityIcons
              name="clock-check"
              size={18}
              color={Colors.skyBlueHeader}
            />
            <Text style={styles.selectedPreviewText}>{getResultString()}</Text>
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
              <Text style={styles.confirmBtnText}>Pilih Waktu Ini</Text>
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
  pickerContainer: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 18,
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
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
    marginBottom: 10,
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
  modeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  modeTabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeTabBtnActive: {
    backgroundColor: Colors.skyBlueHeader,
  },
  modeTabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.textNavySecondary,
  },
  modeTabBtnTextActive: {
    color: Colors.white,
  },
  adjustersCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    marginBottom: 14,
  },
  timeSection: {
    flex: 1,
    alignItems: 'center',
  },
  timeSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.textNavyMuted,
    marginBottom: 6,
  },
  timeDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeUnitCol: {
    alignItems: 'center',
    width: 44,
  },
  stepBtn: {
    padding: 2,
  },
  timeValueText: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.textNavyDark,
    marginVertical: 2,
  },
  timeUnitSub: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.textNavyMuted,
  },
  timeColon: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.skyBlueHeader,
    marginHorizontal: 4,
    marginTop: -14,
  },
  rangeDivider: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  rangeDividerText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.skyBlueHeader,
  },
  presetsHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: Colors.textNavyDark,
    marginBottom: 8,
  },
  presetsList: {
    gap: 6,
  },
  presetRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.skyBlueBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
  },
  presetInfo: {
    flex: 1,
  },
  presetLabelText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.textNavyDark,
  },
  presetDescText: {
    fontSize: 10,
    fontFamily: Fonts.bodyRegular,
    color: Colors.textNavyMuted,
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
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
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
