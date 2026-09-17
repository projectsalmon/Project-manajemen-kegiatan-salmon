import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface CivicLogoProps {
  size?: number;
  rotation?: string;
}

/**
 * Komuniva Official Brand Logo (Civic Network Nodes forming 'K').
 * Renders the crisp high-resolution brand asset seamlessly inside the app.
 */
export const CivicLogo: React.FC<CivicLogoProps> = ({
  size = 36,
  rotation,
}) => {
  const borderRadius = Math.round(size * 0.24);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          transform: rotation ? [{ rotate: rotation }] : undefined,
        },
      ]}
    >
      <Image
        source={require('../../assets/icon.png')}
        style={[
          styles.logoImage,
          { width: size, height: size, borderRadius },
        ]}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    shadowColor: '#081B38',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
});
