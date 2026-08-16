import React from 'react';
import {
  Image,
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
  FontFamily,
  RsvpStatusMeta,
} from '../constants/theme';
import { ActivityItem, RsvpStatusType } from '../types';

interface ActivityCardProps {
  activity: ActivityItem;
  onCardClick: () => void;
  onRsvpClick: (newStatus: RsvpStatusType) => void;
  onEditClick?: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onCardClick,
  onRsvpClick,
  onEditClick,
}) => {
  const categoryInfo = CategoryMeta[activity.category] || CategoryMeta.KERJA_BAKTI;
  const approvalInfo = ApprovalStatusMeta[activity.approvalStatus];
  const rsvpInfo = RsvpStatusMeta[activity.userRsvpStatus];

  const handleShare = async () => {
    try {
      const shareMessage = `📅 *${activity.title}*\n` +
        `🗓️ ${activity.formattedDate} • ${activity.timeSlot}\n` +
        `📍 Lokasi: ${activity.locationName}\n` +
        `📌 Sasaran: ${activity.targetRegion}\n\n` +
        `${activity.description}`;

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
      style={styles.card}
      activeOpacity={0.9}
      onPress={onCardClick}
    >
      {/* 1. TOP-ALIGNED IMAGE BANNER */}
      <View style={styles.imageBannerContainer}>
        {activity.imageUrl ? (
          <Image
            source={{ uri: activity.imageUrl }}
            style={styles.bannerImage}
            resizeMode="cover"
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

        {/* Status Approval Badge (if not PUBLISHED) */}
        {activity.approvalStatus !== 'PUBLISHED' && approvalInfo && (
          <View
            style={[
              styles.approvalBadge,
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
          {activity.userRsvpStatus === 'NONE' ? (
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
    fontFamily: FontFamily.bold,
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
    fontFamily: FontFamily.bold,
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
    fontSize: 11,
    fontFamily: FontFamily.bold,
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
    fontFamily: FontFamily.semiBold,
    color: Colors.skyBlueHeader,
    includeFontPadding: false,
  },
  titleText: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    color: Colors.textNavyDark,
    lineHeight: 21,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  dateText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.textNavySecondary,
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
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
    fontFamily: FontFamily.semiBold,
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
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: Colors.textNavyDark,
  },
  quotaText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
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
    fontFamily: FontFamily.bold,
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
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
});
