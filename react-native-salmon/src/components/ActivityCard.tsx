import React, { useState, useEffect } from 'react';
import {
  Image,
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

  useEffect(() => {
    setImageError(false);
  }, [activity?.imageUrl]);

  const categoryInfo = (activity?.category && CategoryMeta[activity.category]) || CategoryMeta.KERJA_BAKTI;
  const approvalInfo = (activity?.approvalStatus && ApprovalStatusMeta[activity.approvalStatus]) || ApprovalStatusMeta.PUBLISHED;
  const rsvpInfo = (activity?.userRsvpStatus && RsvpStatusMeta[activity.userRsvpStatus]) || RsvpStatusMeta.NONE;
  const isPinnedActive = isItemPinned(activity);

  const handleShare = async () => {
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
    <TouchableOpacity
      style={[styles.card, isPinnedActive && styles.cardPinned]}
      activeOpacity={0.9}
      onPress={onCardClick}
    >
      {/* 1. TOP-ALIGNED IMAGE BANNER */}
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
              name="calendar-multiselect"
              size={36}
              color="rgba(255, 255, 255, 0.85)"
            />
            <Text style={styles.fallbackText}>{categoryInfo.displayName}</Text>
          </View>
        )}

        {/* Pinned Badge */}
        {isPinnedActive && (
          <View style={styles.pinnedBannerBadge}>
            <MaterialCommunityIcons name="pin" size={13} color="#FFFFFF" />
            <Text style={styles.pinnedBannerBadgeText}>
              Disematkan ({activity.pinDurationLabel || 'Teratas'})
            </Text>
          </View>
        )}

        {/* Status Approval Badge (if not PUBLISHED) */}
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

        {/* Share Button on Top Right */}
        <TouchableOpacity
          style={styles.shareOverlayButton}
          activeOpacity={0.8}
          onPress={handleShare}
        >
          <MaterialCommunityIcons name="share-variant" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* 2. CARD CONTENT DETAILS */}
      <View style={styles.contentPadding}>
        {/* Category Tag & Region */}
        <View style={styles.tagRow}>
          <View
            style={[
              styles.categoryTag,
              { backgroundColor: categoryInfo.containerColor },
            ]}
          >
            <Text
              style={[styles.categoryTagText, { color: categoryInfo.badgeColor }]}
              numberOfLines={1}
            >
              {activity.customCategoryName || categoryInfo.displayName}
            </Text>
          </View>

          <View style={styles.rightTagGroup}>
            {onEditClick && (
              <TouchableOpacity
                style={styles.editIconButton}
                onPress={onEditClick}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="pencil" size={16} color={Colors.skyBlueHeader} />
              </TouchableOpacity>
            )}

            <View style={styles.regionTag}>
              <MaterialCommunityIcons name="map-marker" size={12} color={Colors.skyBlueHeader} />
              <Text style={styles.regionTagText} numberOfLines={1}>
                {activity.targetRegion}
              </Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.titleText} numberOfLines={2}>
          {activity.title}
        </Text>

        {/* Date & Time */}
        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="calendar-clock"
            size={16}
            color={Colors.skyBlueHeader}
          />
          <Text style={styles.dateText} numberOfLines={1}>
            {activity.formattedDate} • {activity.timeSlot}
          </Text>
        </View>

        {/* Location */}
        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={16}
            color={Colors.textNavyMuted}
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
              size={15}
              color={Colors.urgentRed}
            />
            <Text style={styles.alertText} numberOfLines={1}>
              {activity.followUpNote}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* Footer: RSVP Counter & Action Button */}
        <View style={styles.footerRow}>
          <View style={styles.counterGroup}>
            <MaterialCommunityIcons
              name="account-group"
              size={18}
              color={Colors.skyBlueHeader}
            />
            <Text style={styles.counterText}>
              {activity.confirmedCount} Hadir
              {activity.quota ? (
                <Text style={styles.quotaText}> / {activity.quota} Kuota</Text>
              ) : null}
            </Text>
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
                size={16}
                color={Colors.onYellowContainer}
              />
              <Text style={styles.rsvpButtonText}>RSVP Hadir</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.rsvpStatusPill,
                {
                  borderColor: rsvpInfo.color,
                  backgroundColor: `${rsvpInfo.color}18`,
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
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginVertical: 6,
    borderWidth: 1.5,
    borderColor: Colors.yellowBorderLis,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  cardPinned: {
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  pinnedBannerBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  pinnedBannerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  imageBannerContainer: {
    height: 130,
    width: '100%',
    backgroundColor: Colors.skyBlueSurfaceVariant,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  fallbackBanner: {
    flex: 1,
    backgroundColor: Colors.skyBlueHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.headingBold,
    marginTop: 4,
  },
  approvalBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  approvalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
  },
  shareOverlayButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentPadding: {
    padding: 14,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 6,
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    includeFontPadding: false,
  },
  rightTagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  editIconButton: {
    padding: 4,
  },
  regionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skyBlueSurfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
    flexShrink: 1,
  },
  regionTagText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Fonts.bodySemiBold,
    color: Colors.skyBlueHeader,
    includeFontPadding: false,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.headingBold,
    color: Colors.textNavyDark,
    lineHeight: 22,
    marginBottom: 6,
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
    color: Colors.textNavySecondary,
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    fontFamily: Fonts.bodyRegular,
    color: Colors.textNavyMuted,
    flex: 1,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.urgentRedContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    gap: 4,
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
    backgroundColor: Colors.skyBlueSurfaceVariant,
    marginVertical: 10,
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
    color: Colors.textNavyDark,
  },
  quotaText: {
    fontSize: 12,
    fontWeight: 'normal',
    fontFamily: Fonts.bodyRegular,
    color: Colors.textNavyMuted,
  },
  rsvpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.yellowHighlight,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  rsvpButtonText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
    color: Colors.onYellowContainer,
  },
  rsvpStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  rsvpStatusPillText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.bodyBold,
  },
});
