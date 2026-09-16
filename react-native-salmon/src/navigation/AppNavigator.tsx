import React, { useEffect } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CivicTopBar } from '../components/CivicTopBar';
import { Colors, Fonts, UserRolesMeta } from '../constants/theme';
import { useApp } from '../context/AppContext';
import {
  setNotificationResponseHandler,
  checkColdStartNotification,
} from '../services/notificationService';
import { ActivityDetailScreen } from '../screens/ActivityDetailScreen';
import { ActivityListScreen } from '../screens/ActivityListScreen';
import { AdminHomeScreen } from '../screens/AdminHomeScreen';
import { AdminUserManagementScreen } from '../screens/AdminUserManagementScreen';
import { AnnouncementListScreen } from '../screens/AnnouncementListScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { CreateEditActivityScreen } from '../screens/CreateEditActivityScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { PosyanduHomeScreen } from '../screens/PosyanduHomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { WargaHomeScreen } from '../screens/WargaHomeScreen';
import { OnboardingScreen, ONBOARDING_STORAGE_KEY } from '../screens/OnboardingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Adaptive Home Screen based on Role
const HomeScreenRouter: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { currentUser } = useApp();

  if (currentUser.role === 'WARGA') {
    return <WargaHomeScreen navigation={navigation} />;
  }
  if (currentUser.role === 'POSYANDU') {
    return <PosyanduHomeScreen navigation={navigation} />;
  }
  return <AdminHomeScreen navigation={navigation} />;
};

const MainTabNavigator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { currentUser } = useApp();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 10;

  const roleMeta = UserRolesMeta[currentUser.role] || UserRolesMeta.WARGA;

  return (
    <View style={styles.mainTabContainer}>
      <CivicTopBar
        currentRole={currentUser.role}
        roleTitle={roleMeta.title}
        userName={currentUser.name}
        onRoleClick={() => navigation.navigate('ProfilTab')}
        onProfileClick={() => navigation.navigate('ProfilTab')}
      />

      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.salmonPrimary,
          tabBarInactiveTintColor: Colors.iosTextMuted,
          tabBarStyle: {
            backgroundColor: Colors.iosCard,
            borderTopWidth: 1,
            borderTopColor: Colors.iosBorder,
            height: 56 + bottomInset,
            paddingBottom: bottomInset,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            fontFamily: Fonts.bodyBold,
            includeFontPadding: false,
          },
        }}
      >
        <Tab.Screen
          name="BerandaTab"
          component={HomeScreenRouter}
          options={{
            tabBarLabel: 'Beranda',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'home' : 'home-outline'}
                size={size}
                color={focused ? Colors.salmonPrimary : color}
              />
            ),
          }}
        />

        <Tab.Screen
          name="KegiatanTab"
          component={ActivityListScreen}
          options={{
            tabBarLabel: 'Kegiatan',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'format-list-checks' : 'format-list-bulleted'}
                size={size}
                color={focused ? Colors.salmonPrimary : color}
              />
            ),
          }}
        />

        <Tab.Screen
          name="PengumumanTab"
          component={AnnouncementListScreen}
          options={{
            tabBarLabel: 'Warta',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'bullhorn' : 'bullhorn-outline'}
                size={size}
                color={focused ? Colors.salmonPrimary : color}
              />
            ),
          }}
        />

        <Tab.Screen
          name="KalenderTab"
          component={CalendarScreen}
          options={{
            tabBarLabel: 'Kalender',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'calendar-month' : 'calendar-month-outline'}
                size={size}
                color={focused ? Colors.salmonPrimary : color}
              />
            ),
          }}
        />

        <Tab.Screen
          name="ProfilTab"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Profil',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'account' : 'account-outline'}
                size={size}
                color={focused ? Colors.salmonPrimary : color}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

export const navigationRef = createNavigationContainerRef<any>();

export const parseDeepLinkUrl = (
  url: string | null
): { type: 'ACTIVITY' | 'ANNOUNCEMENT'; id: string } | null => {
  if (!url) return null;
  try {
    // 1. Format query params: com.salmon.app://detail?type=...&id=...
    if (url.includes('id=')) {
      const typeMatch = url.match(/[?&]type=([^&]+)/i);
      const idMatch = url.match(/[?&]id=([^&]+)/i);
      if (idMatch) {
        const rawType = typeMatch ? decodeURIComponent(typeMatch[1]).toUpperCase() : 'ACTIVITY';
        const id = decodeURIComponent(idMatch[1]);
        const type: 'ACTIVITY' | 'ANNOUNCEMENT' =
          rawType === 'PENGUMUMAN' || rawType === 'ANNOUNCEMENT' ? 'ANNOUNCEMENT' : 'ACTIVITY';
        return { type, id };
      }
    }
    // 2. Format path: com.salmon.app://activity/:id or com.salmon.app://announcement/:id
    if (url.includes('/activity/')) {
      const id = url.split('/activity/')[1]?.split('?')[0]?.replace(/\/$/, '');
      if (id) return { type: 'ACTIVITY', id };
    }
    if (url.includes('/announcement/')) {
      const id = url.split('/announcement/')[1]?.split('?')[0]?.replace(/\/$/, '');
      if (id) return { type: 'ANNOUNCEMENT', id };
    }
  } catch (e) {
    console.warn('Error parsing deep link URL:', e);
  }
  return null;
};

export const handleNotificationNavigation = (data: any) => {
  if (!data) return;
  const rawType = String(data.type || '').toUpperCase();
  const id = data.id;
  if (!id) return;

  const type: 'ACTIVITY' | 'ANNOUNCEMENT' =
    rawType === 'PENGUMUMAN' || rawType === 'ANNOUNCEMENT' ? 'ANNOUNCEMENT' : 'ACTIVITY';

  const performNav = () => {
    if (!navigationRef.isReady()) {
      setTimeout(performNav, 300);
      return;
    }
    try {
      if (type === 'ACTIVITY') {
        navigationRef.navigate('ActivityDetailScreen', { activityId: id });
      } else if (type === 'ANNOUNCEMENT') {
        navigationRef.navigate('MainTabs', {
          screen: 'PengumumanTab',
          params: { selectedAnnouncementId: id },
        });
      }
    } catch (e) {
      console.warn('Error navigating to target from deep link/notification:', e);
    }
  };

  performNav();
};

export const AppNavigator: React.FC = () => {
  useEffect(() => {
    // 1. Handle notification tray response (when user taps tray notification)
    const cleanup = setNotificationResponseHandler((data) => {
      handleNotificationNavigation(data);
    });

    // 2. Handle cold-start notification click
    const timer = setTimeout(() => {
      checkColdStartNotification();
    }, 1200);

    // 3. Handle cold-start deep link from Home Screen Widget
    Linking.getInitialURL()
      .then((initialUrl) => {
        if (initialUrl) {
          const parsed = parseDeepLinkUrl(initialUrl);
          if (parsed) {
            handleNotificationNavigation(parsed);
          }
        }
      })
      .catch((err) => console.warn('Error reading initial deep link URL:', err));

    // 4. Handle warm-start deep link from Home Screen Widget (app in background)
    const urlSubscription = Linking.addEventListener('url', (event) => {
      if (event && event.url) {
        const parsed = parseDeepLinkUrl(event.url);
        if (parsed) {
          handleNotificationNavigation(parsed);
        }
      }
    });

    return () => {
      cleanup();
      clearTimeout(timer);
      urlSubscription.remove();
    };
  }, []);

  const [initialRoute, setInitialRoute] = React.useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)
      .then((val) => {
        if (val === 'true') {
          setInitialRoute('LoginScreen');
        } else {
          setInitialRoute('OnboardingScreen');
        }
      })
      .catch(() => {
        setInitialRoute('LoginScreen');
      });
  }, []);

  if (!initialRoute) {
    return <View style={{ flex: 1, backgroundColor: Colors.iosBackground }} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen
          name="MainTabs"
          component={MainTabNavigator}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="ActivityDetailScreen"
          component={ActivityDetailScreen}
        />
        <Stack.Screen
          name="CreateEditActivityScreen"
          component={CreateEditActivityScreen}
        />
        <Stack.Screen name="CalendarScreen" component={CalendarScreen} />
        <Stack.Screen
          name="AdminUserManagementScreen"
          component={AdminUserManagementScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  mainTabContainer: {
    flex: 1,
    backgroundColor: Colors.iosBackground,
  },
});
