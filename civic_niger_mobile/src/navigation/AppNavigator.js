import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Navigators
import CitizenTabNavigator from './CitizenTabNavigator';
import AuthoritySidebarNavigator from './AuthoritySidebarNavigator';

// Additional Authority Screens
import SignalementDetailScreen from '../screens/authority/SignalementDetailScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isWeb = Platform.OS === 'web';

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      {!isAuthenticated ? (
        // Flux d'authentification
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Group>
      ) : (
        // Flux principal (Connecté) - Routage par Rôle & Plateforme
        <Stack.Group>
          {isWeb && (user?.role === 'MINISTERE' || user?.role === 'ADMIN') ? (
            <>
              <Stack.Screen name="AuthorityLayout" component={AuthoritySidebarNavigator} />
              <Stack.Screen name="SignalementDetailAuthority" component={SignalementDetailScreen} />
            </>
          ) : (
            <Stack.Screen name="CitizenLayout" component={CitizenTabNavigator} />
          )}
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
