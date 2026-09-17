import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../constants/theme';

interface CurvedHeroBannerProps {
  children: React.ReactNode;
  accentColor?: string;
  showGlow?: boolean;
}

/**
 * Modern Midtrans-inspired Curved Hero Banner.
 * Features:
 * - Deep Oceanic Navy background (#0A2240)
 * - Soft sapphire/azure glow halo in the background
 * - Organic soft-cut curved bottom boundary transitioning to light body
 * - 100% lightweight native styling (zero extra native library dependencies)
 */
export const CurvedHeroBanner: React.FC<CurvedHeroBannerProps> = ({
  children,
  accentColor = Colors.sapphireBlue,
  showGlow = true,
}) => {
  return (
    <View style={styles.outerWrapper}>
      {/* 1. Main Navy Hero Body */}
      <View style={styles.mainHeroContainer}>
        {/* Soft Ambient Glow Halo (Inspired by Midtrans graphic) */}
        {showGlow && (
          <>
            <View
              style={[
                styles.ambientGlowPrimary,
                { backgroundColor: 'rgba(0, 102, 246, 0.18)' },
              ]}
            />
            <View
              style={[
                styles.ambientGlowSecondary,
                { backgroundColor: 'rgba(255, 107, 107, 0.10)' },
              ]}
            />
          </>
        )}

        {/* Subtle Diagonal Accent Streak Line (Halus & Tidak Lebay) */}
        <View style={styles.accentStreakLine} />

        {/* Dynamic Role Content */}
        <View style={styles.contentLayer}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    backgroundColor: Colors.iosBackground,
    marginBottom: 14,
  },
  mainHeroContainer: {
    backgroundColor: Colors.navyHeader,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 22,
    shadowColor: Colors.navyDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  contentLayer: {
    zIndex: 2,
  },
  ambientGlowPrimary: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    zIndex: 1,
  },
  ambientGlowSecondary: {
    position: 'absolute',
    bottom: -50,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    zIndex: 1,
  },
  accentStreakLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 2,
  },
});
