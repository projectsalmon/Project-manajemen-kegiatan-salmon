import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CivicTopBar } from '../components/CivicTopBar';
import { Colors, FontFamily, UserRolesMeta } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { ActivityDetailScreen } from '../screens/ActivityDetailScreen';
import { ActivityListScreen } from '../screens/ActivityListScreen';
import { AdminHomeScreen } from '../screens/AdminHomeScreen';
import { AnnouncementListScreen } from '../screens/AnnouncementListScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { CreateEditActivityScreen } from '../screens/CreateEditActivityScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { PosyanduHomeScreen } from '../screens/PosyanduHomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { WargaHomeScreen } from '../screens/WargaHomeScreen';

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
          tabBarActiveTintColor: Colors.onYellowContainer,
          tabBarInactiveTintColor: Colors.textNavyMuted,
          tabBarStyle: {
            backgroundColor: Colors.white,
            borderTopWidth: 1,
            borderTopColor: Colors.borderLight,
            height: 56 + bottomInset,
            paddingBottom: bottomInset,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontFamily: FontFamily.bold,
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
                color={focused ? Colors.yellowAccent : color}
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
                color={focused ? Colors.yellowAccent : color}
              />
            ),
          }}
        />

        <Tab.Screen
          name="PengumumanTab"
          component={AnnouncementListScreen}
          options={{
            tabBarLabel: 'Pengumuman',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'bullhorn' : 'bullhorn-outline'}
                size={size}
                color={focused ? Colors.yellowAccent : color}
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
                color={focused ? Colors.yellowAccent : color}
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
                color={focused ? Colors.yellowAccent : color}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LoginScreen"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen
          name="ActivityDetailScreen"
          component={ActivityDetailScreen}
        />
        <Stack.Screen
          name="CreateEditActivityScreen"
          component={CreateEditActivityScreen}
        />
        <Stack.Screen name="CalendarScreen" component={CalendarScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  mainTabContainer: {
    flex: 1,
    backgroundColor: Colors.skyBlueBackground,
  },
});
