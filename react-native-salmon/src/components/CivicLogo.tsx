import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

interface CivicLogoProps {
  size?: number;
  rotation?: string;
  animated?: boolean;
  onPress?: () => void;
}

/**
 * Komuniva Official Brand Logo (Civic Network Nodes forming 'K').
 * Features smooth organic ambient floating/breathing animation and touch feedback.
 */
export const CivicLogo: React.FC<CivicLogoProps> = ({
  size = 36,
  rotation,
  animated = true,
  onPress,
}) => {
  const borderRadius = Math.round(size * 0.24);
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const touchScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) return;

    const ambientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    ambientLoop.start();
    return () => ambientLoop.stop();
  }, [animated, breatheAnim]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(touchScaleAnim, {
        toValue: 0.85,
        useNativeDriver: true,
        speed: 40,
        bounciness: 4,
      }),
      Animated.spring(touchScaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPress) {
      onPress();
    }
  };

  const translateY = animated
    ? breatheAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -2.5],
      })
    : 0;

  const ambientScale = animated
    ? breatheAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.04],
      })
    : 1;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      disabled={!onPress && !animated}
      style={{ overflow: 'visible' }}
    >
      <Animated.View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius,
            transform: [
              ...(rotation ? [{ rotate: rotation }] : []),
              { translateY },
              { scale: Animated.multiply(touchScaleAnim, ambientScale) },
            ],
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
      </Animated.View>
    </TouchableOpacity>
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
