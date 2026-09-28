import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, MapPin, BookOpen, MessageCircle, User } from 'lucide-react-native';
import { COLORS, FONTS, SHADOWS, SPACING } from '../theme';

// Citizen Screens
import HomeScreen from '../screens/citizen/HomeScreen';
import SignalementScreen from '../screens/citizen/SignalementScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Nested Stacks
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SavoirScreen from '../screens/citizen/SavoirScreen';
import SavoirDetailScreen from '../screens/citizen/SavoirDetailScreen';
import VoixFeedScreen from '../screens/citizen/VoixFeedScreen';
import VoixDetailScreen from '../screens/citizen/VoixDetailScreen';
import VoixCreateScreen from '../screens/citizen/VoixCreateScreen';
import LiveStreamingScreen from '../screens/citizen/LiveStreamingScreen';

import SignalementDetailScreen from '../screens/citizen/SignalementDetailScreen';
import LiveViewerScreen from '../screens/citizen/LiveViewerScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// --- Nested Stacks ---
function SavoirStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SavoirList" component={SavoirScreen} />
      <Stack.Screen name="SavoirDetail" component={SavoirDetailScreen} />
    </Stack.Navigator>
  );
}

function VoixStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VoixFeed" component={VoixFeedScreen} />
      <Stack.Screen name="VoixDetail" component={VoixDetailScreen} />
      <Stack.Screen name="VoixCreate" component={VoixCreateScreen} />
    </Stack.Navigator>
  );
}

function SignalementStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignalementForm" component={SignalementScreen} />
      <Stack.Screen name="SignalementDetail" component={SignalementDetailScreen} />
      <Stack.Screen name="LiveStreaming" component={LiveStreamingScreen} />
      <Stack.Screen name="LiveViewer" component={LiveViewerScreen} />
    </Stack.Navigator>
  );
}

// --- Main Tab Navigator ---
export default function CitizenTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Accueil') return <Home color={color} size={size} />;
          if (route.name === 'Savoir') return <BookOpen color={color} size={size} />;
          if (route.name === 'Voix') return <MessageCircle color={color} size={size} />;
          if (route.name === 'Profil') return <User color={color} size={size} />;
          
          if (route.name === 'Signaler') {
            return (
              <View style={[
                styles.actionButton,
                focused && styles.actionButtonActive
              ]}>
                <MapPin color={COLORS.white} size={28} />
              </View>
            );
          }
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: [
          styles.tabBar,
          { 
            height: 60 + insets.bottom, 
            paddingBottom: insets.bottom || 8
          }
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarShowLabel: route.name !== 'Signaler',
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen 
        name="Savoir" 
        component={SavoirStack} 
        options={{ unmountOnBlur: true }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.navigate('Savoir', { screen: 'SavoirList' });
          },
        })}
      />
      <Tab.Screen 
        name="Signaler" 
        component={SignalementStack} 
        options={{
          unmountOnBlur: true,
          tabBarIconStyle: {}
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.navigate('Signaler', { screen: 'SignalementForm' });
          },
        })}
      />
      <Tab.Screen 
        name="Voix" 
        component={VoixStack} 
        options={{ unmountOnBlur: true }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.navigate('Voix', { screen: 'VoixFeed' });
          },
        })}
      />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tabBarLabel: {
    ...FONTS.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  actionButton: {
    backgroundColor: COLORS.accent,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 32, // Remonter le bouton
    ...SHADOWS.glow,
  },
  actionButtonActive: {
    backgroundColor: COLORS.accentDark,
  },
});
