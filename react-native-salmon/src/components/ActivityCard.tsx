import React, { useState, useEffect } from 'react';
import {
  Image,
  Modal,
  NativeModules,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ApprovalStatusMeta,
  CategoryMeta,
  Colors,
  Fonts,
  RsvpStatusMeta,
} from '../constants/theme';
import { ActivityItem, RsvpStatusType, isItemPinned } from '../types';

interface ActivityCardProps {
  activity: ActivityItem;
  onCardClick: () => void;
  onRsvpClick: (status: RsvpStatusType) => void;
  onEditClick?: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onCardClick,
  onRsvpClick,
  onEditClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [activity?.imageUrl]);

  const categoryInfo = (activity?.category && CategoryMeta[activity.category]) || CategoryMeta.KERJA_BAKTI;
  const approvalInfo = (activity?.approvalStatus && ApprovalStatusMeta[activity.approvalStatus]) || ApprovalStatusMeta.PUBLISHED;
  const rsvpInfo = (activity?.userRsvpStatus && RsvpStatusMeta[activity.userRsvpStatus]) || RsvpStatusMeta.NONE;
  const isPinnedActive = isItemPinned(activity);

  const handleShare = async () => {
    setIsMenuVisible(false);
    try {
      const shareMessage = `📅 *${activity.title}*\n` +
        `🗓️ ${activity.formattedDate} • ${activity.timeSlot}\n` +
        `📍 Lokasi: ${activity.locationName}\n` +
        `📌 Sasaran: ${activity.targetRegion}\n\n` +
        `${activity.description}`;

      if (
        Platform.OS === 'android' &&
        activity.imageUrl &&
        NativeModules.WidgetUpdateModule?.shareToWhatsAppWithImage
      ) {
        await NativeModules.WidgetUpdateModule.shareToWhatsAppWithImage(
          activity.imageUrl,
          shareMessage
        );
        return;
      }

      await Share.share({
        title: activity.title,
        message: shareMessage,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.92}
        onPress={onCardClick}
      >
        {/* 1. COVER IMAGE WITH CLEAN 16:9 ASPECT RATIO */}
        <View style={styles.imageBannerContainer}>
          {activity.imageUrl && !imageError ? (
            <Image
              source={{ uri: activity.imageUrl }}
              style={styles.bannerImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.fallbackBanner}>
              <MaterialCommunityIcons
                name={categoryInfo.iconName as any || 'calendar-text'}
                size={38}
                color="rgba(255, 255, 255, 0.9)"
              />
              <Text style={styles.fallbackText}>{categoryInfo.displayName}</Text>
            </View>
          )}

          {/* Minimalist Pinned Badge */}
          {isPinnedActive && (
            <View style={styles.pinnedBannerBadge}>
              <MaterialCommunityIcons name="pin" size={12} color="#FFFFFF" />
              <Text style={styles.pinnedBannerBadgeText}>
                Disematkan ({activity.pinDurationLabel || 'Teratas'})
              </Text>
            </View>
          )}

          {/* Status Approval Badge (If not PUBLISHED) */}
          {activity.approvalStatus !== 'PUBLISHED' && approvalInfo && (
            <View
              style={[
                styles.approvalBadge,
                isPinnedActive && { top: 38 },
                { backgroundColor: approvalInfo.containerColor, borderColor: approvalInfo.badgeColor },
              ]}
            >
              <Text style={[styles.approvalBadgeText, { color: approvalInfo.badgeColor }]}>
                {approvalInfo.label}
              </Text>
            </View>
          )}

          {/* Three-dots Context Menu Button (Top Right) */}
          <TouchableOpacity
            style={styles.moreOptionsButton}
            activeOpacity={0.75}
            onPress={(e) => {
              e.stopPropagation();
              setIsMenuVisible(true);
            }}
          >
            <MaterialCommunityIcons name="dots-horizontal" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 2. CARD CONTENT DETAILS */}
        <View style={styles.contentPadding}>
          {/* Title */}
          <Text style={styles.titleText} numberOfLines={2}>
            {activity.title}
          </Text>

          {/* Secondary Label: Category & Region (Clean typography, no cluttered rainbow badges) */}
          <Text style={styles.secondaryLabel} numberOfLines={1}>
            {activity.customCategoryName || categoryInfo.displayName} • {activity.targetRegion}
          </Text>

          {/* Date & Time */}
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="calendar-blank-outline"
              size={15}
              color={Colors.iosTextSecondary}
            />
            <Text style={styles.dateText} numberOfLines={1}>
              {activity.formattedDate} • {activity.timeSlot}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={15}
              color={Colors.iosTextMuted}
            />
            <Text style={styles.locationText} numberOfLines={1}>
              {activity.locationName}
            </Text>
          </View>

          {/* Needs Follow-Up / Approval Alert */}
          {activity.needsFollowUp && activity.followUpNote && (
            <View style={styles.alertBox}>
              <MaterialCommunityIcons
                name="clock-alert-outline"
                size={14}
                color={Colors.urgentRed}
              />
              <Text style={styles.alertText} numberOfLines={1}>
                {activity.followUpNote}
              </Text>
            </View>
          )}

          {/* Subtle iOS Divider */}
          <View style={styles.divider} />

          {/* Footer: RSVP Counter & Quick RSVP Action */}
          <View style={styles.footerRow}>
            <View style={styles.counterGroup}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={16}
                color={Colors.iosTextSecondary}
              />
              <Text style={styles.counterText}>
                {activity.confirmedCount} Hadir
                {activity.quota ? (
                  <Text style={styles.quotaText}> / {activity.quota} Kuota</Text>
                ) : null}
              </Text>
              {Boolean(
                activity.readCount ||
                  (activity.readByUserIds && activity.readByUserIds.length > 0)
              ) && (
                <View style={styles.readCountBadge}>
                  <MaterialCommunityIcons
                    name="eye-outline"
                    size={12}
                    color={Colors.iosTextMuted}
                  />
                  <Text style={styles.readCountText}>
                    {activity.readCount || activity.readByUserIds?.length}
                  </Text>
                </View>
              )}
            </View>

            {/* Quick RSVP Button */}
            {(!activity.userRsvpStatus || activity.userRsvpStatus === 'NONE') ? (
              <TouchableOpacity
                style={styles.rsvpButton}
                activeOpacity={0.8}
                onPress={() => onRsvpClick('ATTENDING')}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={15}
                  color={Colors.white}
                />
                <Text style={styles.rsvpButtonText}>RSVP Hadir</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.rsvpStatusPill,
                  {
                    borderColor: rsvpInfo.color,
                    backgroundColor: `${rsvpInfo.color}14`,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => onRsvpClick('NONE')}
              >
                <MaterialCommunityIcons
                  name={rsvpInfo.icon as any}
                  size={14}
                  color={rsvpInfo.color}
                />
                <Text style={[styles.rsvpStatusPillText, { color: rsvpInfo.color }]}>
                  {rsvpInfo.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* 3. CONTEXT MENU / ACTION SHEET (iOS Style) */}
      <Modal
        visible={isMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={styles.menuSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {activity.title}
            </Text>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={handleShare}
            >
              <MaterialCommunityIcons
                name="share-variant-outline"
                size={22}
                color={Colors.iosBlue}
              />
              <Text style={styles.menuItemText}>Bagikan Kegiatan</Text>
            </TouchableOpacity>

            {onEditClick && (
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  setIsMenuVisible(false);
                  onEditClick();
                }}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={22}
                  color={Colors.iosTextPrimary}
                />
                <Text style={styles.menuItemText}>Edit Kegiatan</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.menuItem, styles.cancelItem]}
              activeOpacity={0.7}
              onPress={() => setIsMenuVisible(false)}
            >
              <Text style={styles.cancelItemText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.iosCard,
    borderRadius: 18,
    marginVertical: 7,
    borderWidth: 1,
    borderColor: Colors.iosBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  imageBannerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.iosBackground,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  fallbackBanner: {
    flex: 1,
    backgroundColor: Colors.salmonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    marginTop: 6,
  },
  pinnedBannerBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(28, 28, 30, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  pinnedBannerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
  },
  approvalBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  approvalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
  },
  moreOptionsButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentPadding: {
    padding: 16,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: Colors.iosTextPrimary,
    lineHeight: 23,
  },
  secondaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.iosTextMuted,
    marginTop: 4,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Fonts.bodyMedium,
    color: Colors.iosTextSecondary,
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    fontFamily: Fonts.bodyRegular,
    color: Colors.iosTextMuted,
    flex: 1,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.urgentRedContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  alertText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.urgentRed,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.iosBorder,
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: Colors.iosTextPrimary,
  },
  quotaText: {
    fontSize: 12,
    fontWeight: 'normal',
    fontFamily: Fonts.bodyRegular,
    color: Colors.iosTextMuted,
  },
  rsvpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.salmonPrimary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 5,
    shadowColor: Colors.salmonPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  rsvpButtonText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.white,
  },
  rsvpStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 5,
  },
  rsvpStatusPillText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
  },
  readCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.iosBackground,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
  },
  readCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.iosTextMuted,
    fontFamily: Fonts.bodyMedium,
  },

  // Modal / Action Sheet Styles
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: Colors.iosCard,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.iosBorder,
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    color: Colors.iosTextPrimary,
    marginBottom: 16,
    textAlign: 'center',
    width: '100%',
  },
  menuItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.iosBackground,
    marginVertical: 4,
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.iosTextPrimary,
  },
  cancelItem: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelItemText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.iosDanger,
    textAlign: 'center',
  },
});
