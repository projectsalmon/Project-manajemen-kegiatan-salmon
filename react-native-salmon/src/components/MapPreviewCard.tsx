import React from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

interface MapPreviewCardProps {
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
}

export const MapPreviewCard: React.FC<MapPreviewCardProps> = ({
  locationName,
  address,
  latitude,
  longitude,
}) => {
  const handleOpenMaps = async () => {
    const encodedQuery = encodeURIComponent(`${locationName}, ${address}`);
    const scheme = Platform.select({
      ios: `maps:0,0?q=${encodedQuery}`,
      android: `geo:${latitude},${longitude}?q=${encodedQuery}`,
    });
    const webUrl = `https://maps.google.com/?q=${encodedQuery}`;

    try {
      if (scheme) {
        const supported = await Linking.canOpenURL(scheme);
        if (supported) {
          await Linking.openURL(scheme);
          return;
        }
      }
      await Linking.openURL(webUrl);
    } catch (e) {
      Linking.openURL(webUrl);
    }
  };

  return (
    <View style={styles.card}>
      {/* 1. MAP GRAPHIC BOX */}
      <View style={styles.mapGraphicBox}>
        {/* Decorative Grid Lines */}
        <View style={styles.gridLineHorizontal} />
        <View style={styles.gridLineVertical} />

        <View style={styles.pinCircle}>
          <MaterialCommunityIcons
            name="map-marker"
            size={28}
            color={Colors.onYellowContainer}
          />
        </View>

        <View style={styles.locationBubble}>
          <MaterialCommunityIcons
            name="map-marker-radius"
            size={14}
            color={Colors.skyBlueHeader}
          />
          <Text style={styles.locationBubbleText} numberOfLines={1}>
            {locationName}
          </Text>
        </View>
      </View>

      {/* 2. ADDRESS & DIRECTIONS BUTTON */}
      <View style={styles.bottomRow}>
        <View style={styles.addressInfo}>
          <Text style={styles.locationTitle} numberOfLines={1}>
            {locationName}
          </Text>
          <Text style={styles.addressSubtitle} numberOfLines={2}>
            {address}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.directionsButton}
          activeOpacity={0.8}
          onPress={handleOpenMaps}
        >
          <MaterialCommunityIcons name="navigation" size={16} color={Colors.white} />
          <Text style={styles.directionsButtonText}>Petunjuk Arah</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.skyBlueSurfaceVariant,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  mapGraphicBox: {
    height: 140,
    backgroundColor: '#D0E6FA',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    top: '48%',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    left: '48%',
  },
  pinCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.yellowHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  locationBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.yellowBorderLis,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
    maxWidth: '85%',
  },
  locationBubbleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 10,
  },
  addressInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textNavyDark,
  },
  addressSubtitle: {
    fontSize: 12,
    color: Colors.textNavySecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skyBlueHeader,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  directionsButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
});
