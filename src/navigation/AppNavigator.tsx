import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../theme/colors';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ServersScreen from '../screens/servers/ServersScreen';
import ServerDetailScreen from '../screens/servers/ServerDetailScreen';
import MonitoringScreen from '../screens/monitoring/MonitoringScreen';
import LogsScreen from '../screens/logs/LogsScreen';
import DomainsScreen from '../screens/domains/DomainsScreen';
import CredentialsScreen from '../screens/credentials/CredentialsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcon: Record<string, string> = {
  Dashboard: '⌂', Servers: '⬡', Monitoring: '◈', Logs: '≡', Settings: '⚙',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: Colors.card, borderTopColor: Colors.cardBorder, height: 60 },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabel: route.name,
        tabBarIcon: ({ color }) => {
          return null; // icons via tabBarLabel
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Servers" component={ServersScreen} />
      <Tab.Screen name="Monitoring" component={MonitoringScreen} />
      <Tab.Screen name="Logs" component={LogsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="ServerDetail" component={ServerDetailScreen} />
      <Stack.Screen name="Domains" component={DomainsScreen} />
      <Stack.Screen name="Credentials" component={CredentialsScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => { initialize(); }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
