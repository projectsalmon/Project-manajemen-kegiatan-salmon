import React from 'react';
import {
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ApprovalStatusMeta,
  Colors,
  FontFamily,
  UrgencyMeta,
} from '../constants/theme';
import { AnnouncementItem } from '../types';

interface AnnouncementCardProps {
  announcement: AnnouncementItem;
  onClick: () => void;
  onEditClick?: () => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  onClick,
  onEditClick,
}) => {
  const urgencyInfo = UrgencyMeta[announcement.urgency] || UrgencyMeta.INFO;
  const approvalInfo = ApprovalStatusMeta[announcement.approvalStatus];

  const handleShare = async () => {
    try {
      const reqText =
        announcement.requirements && announcement.requirements.length > 0
          ? `\n📋 Persyaratan: ${announcement.requirements.join(', ')}`
          : '';
      const shareMessage =
        `📢 *${announcement.title}*\n` +
        `🗓️ ${announcement.formattedDate} • ${announcement.targetRegion}\n\n` +
        `${announcement.content}${reqText}\n\n` +
        `Diterbitkan oleh: ${announcement.authorName} (${announcement.authorRole})`;

      await Share.share({
        title: announcement.title,
        message: shareMessage,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        announcement.isPinned && { borderColor: Colors.yellowBorderLis, borderWidth: 1.5 },
      ]}
      activeOpacity={0.9}
      onPress={onClick}
    >
      {/* 1. TOP-ALIGNED IMAGE BANNER */}
      <View style={styles.imageBannerContainer}>
        {announcement.imageUrl ? (
          <Image
            source={{ uri: announcement.imageUrl }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.fallbackBanner}>
            <MaterialCommunityIcons
              name="bullhorn-variant"
              size={36}
              color="rgba(255, 255, 255, 0.9)"
            />
            <Text style={styles.fallbackText}>PENGUMUMAN RESMI</Text>
          </View>
        )}

        {/* Approval Badge (If not published) */}
        {announcement.approvalStatus !== 'PUBLISHED' && approvalInfo && (
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

        {/* Share Button on Top Banner */}
        <TouchableOpacity
          style={styles.shareOverlayButton}
          activeOpacity={0.8}
          onPress={handleShare}
        >
          <MaterialCommunityIcons name="share-variant" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* 2. CONTENT DETAILS */}
      <View style={styles.contentPadding}>
        <View style={styles.headerRow}>
          <View style={styles.leftTags}>
            <View
              style={[
                styles.urgencyTag,
                { backgroundColor: urgencyInfo.containerColor },
              ]}
            >
              <Text
                style={[styles.urgencyTagText, { color: urgencyInfo.badgeColor }]}
              >
                {urgencyInfo.label}
              </Text>
            </View>

            {announcement.isPinned && (
              <View style={styles.pinnedTag}>
                <MaterialCommunityIcons
                  name="pin"
                  size={14}
                  color={Colors.yellowAccent}
                />
                <Text style={styles.pinnedTagText}>Disematkan</Text>
              </View>
            )}
          </View>

          <View style={styles.rightGroup}>
            {onEditClick && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={onEditClick}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="pencil" size={16} color={Colors.skyBlueHeader} />
              </TouchableOpacity>
            )}
            <Text style={styles.dateText}>{announcement.formattedDate}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.titleText} numberOfLines={2}>
          {announcement.title}
        </Text>

        {/* Content */}
        <Text style={styles.contentText} numberOfLines={3}>
          {announcement.content}
        </Text>

        {/* Requirements Chips */}
        {announcement.requirements && announcement.requirements.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.requirementsScrollView}
            contentContainerStyle={styles.requirementsContainer}
          >
            {announcement.requirements.map((req, idx) => (
              <View key={idx} style={styles.reqChip}>
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={12}
                  color={Colors.onYellowContainer}
                />
                <Text style={styles.reqChipText} numberOfLines={1}>
                  {req}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.footerRow}>
          <Text style={styles.authorText} numberOfLines={1}>
            Oleh: {announcement.authorName} ({announcement.authorRole})
          </Text>
          <Text style={styles.readMoreText}>Lihat Selengkapnya →</Text>
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
    borderWidth: 1,
    borderColor: Colors.skyBlueSurfaceVariant,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  imageBannerContainer: {
    height: 120,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leftTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  urgencyTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgencyTagText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    includeFontPadding: false,
  },
  pinnedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pinnedTagText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: Colors.yellowAccent,
    includeFontPadding: false,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButton: {
    padding: 2,
  },
  dateText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: Colors.textNavyMuted,
    includeFontPadding: false,
  },
  titleText: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    color: Colors.textNavyDark,
    lineHeight: 21,
    marginBottom: 6,
  },
  contentText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Colors.textNavySecondary,
    lineHeight: 19,
    marginBottom: 8,
  },
  requirementsScrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  requirementsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    alignItems: 'center',
  },
  reqChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.yellowContainer,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  reqChipText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: Colors.onYellowContainer,
    includeFontPadding: false,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  authorText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: Colors.textNavyMuted,
    flexShrink: 1,
    includeFontPadding: false,
  },
  readMoreText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: Colors.skyBlueHeader,
    includeFontPadding: false,
  },
});
