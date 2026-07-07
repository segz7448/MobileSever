import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ActivityIndicator, View, Text} from 'react-native';

// Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import DashboardScreen from './screens/dashboard/DashboardScreen';
import ServersScreen from './screens/servers/ServersScreen';
import ServerDetailScreen from './screens/servers/ServerDetailScreen';
import MonitoringScreen from './screens/monitoring/MonitoringScreen';
import LogsScreen from './screens/logs/LogsScreen';
import DomainsScreen from './screens/domains/DomainsScreen';
import CredentialsScreen from './screens/credentials/CredentialsScreen';
import SettingsScreen from './screens/settings/SettingsScreen';

import {useAuthStore} from './store/authStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {backgroundColor: '#111827', borderTopColor: '#1F2937'},
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
      }}>
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
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="ServerDetail" component={ServerDetailScreen} />
      <Stack.Screen name="Domains" component={DomainsScreen} />
      <Stack.Screen name="Credentials" component={CredentialsScreen} />
    </Stack.Navigator>
  );
}

function RootNav() {
  const {user, loading, initialize} = useAuthStore();

  React.useEffect(() => {
    initialize();
  }, []);

  if (loading) {
    return (
      <View style={{flex: 1, backgroundColor: '#080C14', justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{color: '#6B7280', marginTop: 12}}>MobileCloud</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <RootNav />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
