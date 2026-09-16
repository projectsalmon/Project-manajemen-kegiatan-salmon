import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../constants/theme';

interface CivicLogoProps {
  size?: number;
  color?: string;
  innerColor?: string;
  rotation?: string;
}

/**
 * Minimalist geometric logo inspired by modern luxury tech brands (e.g. tilted Roblox square cube).
 * Rendered using lightweight vector native views with perfect crispness on all screen densities.
 */
export const CivicLogo: React.FC<CivicLogoProps> = ({
  size = 36,
  color = Colors.salmonPrimary,
  innerColor = Colors.white,
  rotation = '-12deg',
}) => {
  const outerBorderRadius = Math.round(size * 0.22);
  const innerSize = Math.round(size * 0.38);
  const innerBorderRadius = Math.round(size * 0.08);

  return (
    <View
      style={[
        styles.outerCube,
        {
          width: size,
          height: size,
          borderRadius: outerBorderRadius,
          backgroundColor: color,
          transform: [{ rotate: rotation }],
        },
      ]}
    >
      <View
        style={[
          styles.innerHole,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerBorderRadius,
            backgroundColor: innerColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outerCube: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.salmonPrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 4,
  },
  innerHole: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
});
