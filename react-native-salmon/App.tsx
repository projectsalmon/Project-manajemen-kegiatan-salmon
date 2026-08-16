import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  OpenSans_400Regular,
  OpenSans_500Medium,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
  OpenSans_800ExtraBold,
  OpenSans_400Regular_Italic,
} from '@expo-google-fonts/open-sans';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Colors } from './src/constants/theme';
import { AppProvider, useApp } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';

const ToastOverlay: React.FC = () => {
  const { snackbarMessage, clearToast } = useApp();

  useEffect(() => {
    if (snackbarMessage) {
      const timer = setTimeout(() => {
        clearToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [snackbarMessage]);

  if (!snackbarMessage) return null;

  return (
    <View style={styles.toastContainer}>
      <Text style={styles.toastText}>{snackbarMessage}</Text>
    </View>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
    OpenSans_500Medium,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
    OpenSans_800ExtraBold,
    OpenSans_400Regular_Italic,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.skyBlueHeader} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" backgroundColor={Colors.white} />
        <AppNavigator />
        <ToastOverlay />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.skyBlueBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 75,
    left: 20,
    right: 20,
    backgroundColor: Colors.textNavyDark,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    zIndex: 9999,
  },
  toastText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    textAlign: 'center',
  },
});
