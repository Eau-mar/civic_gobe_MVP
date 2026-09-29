import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { LayoutDashboard, ClipboardList, Map, BookOpen, Shield, LogOut, FileText } from 'lucide-react-native';

// Screens
import OverviewScreen from '../screens/authority/OverviewScreen';
import SignalementsScreen from '../screens/authority/SignalementsScreen';
import CarteLiveScreen from '../screens/authority/CarteLiveScreen';
import PublicationsScreen from '../screens/authority/PublicationsScreen';
import SavoirScreen from '../screens/citizen/SavoirScreen';

const Stack = createNativeStackNavigator();

// Future screens:
function ComingSoonScreen({ route }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={FONTS.h2}>{route.name} en construction</Text>
    </View>
  );
}

// --- Sidebar Item Component ---
function SidebarItem({ icon: Icon, label, isActive, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [
        styles.navItem,
        isActive && styles.navItemActive,
        !isActive && hovered && styles.navItemHover,
      ]}
    >
      <View style={[styles.activeIndicator, isActive && styles.activeIndicatorVisible]} />
      <Icon 
        color={isActive ? COLORS.primaryLight : COLORS.sidebarText} 
        size={22} 
        style={styles.navIcon} 
      />
      <Text style={[styles.navText, isActive && styles.navTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// --- Main Layout ---
export default function AuthoritySidebarNavigator({ navigation }) {
  const { user, logout } = useAuth();
  
  // We'll use a local state to manage active tab for now until we fully split screens
  const [activeTab, setActiveTab] = React.useState('Overview');

  const renderContent = () => {
    switch(activeTab) {
      case 'Overview':
        return <OverviewScreen navigation={navigation} onSeeAll={() => setActiveTab('Signalements')} />;
      case 'Signalements':
        return <SignalementsScreen navigation={navigation} />;
      case 'Carte':
        return <CarteLiveScreen navigation={navigation} />;
      case 'Publications':
        return <PublicationsScreen navigation={navigation} />;
      case 'Savoir':
        return <SavoirScreen navigation={navigation} />;
      default:
        return <OverviewScreen navigation={navigation} onSeeAll={() => setActiveTab('Signalements')} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        {/* Branding */}
        <View style={styles.branding}>
          <Shield color={COLORS.primaryLight} size={32} />
          <Text style={styles.brandTitle}>CivicNiger</Text>
        </View>

        <View style={styles.divider} />

        {/* Navigation */}
        <ScrollView style={styles.navMenu}>
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Vue d'ensemble" 
            isActive={activeTab === 'Overview'}
            onPress={() => setActiveTab('Overview')} 
          />
          <SidebarItem 
            icon={ClipboardList} 
            label="Signalements" 
            isActive={activeTab === 'Signalements'}
            onPress={() => setActiveTab('Signalements')} 
          />
          <SidebarItem 
            icon={Map} 
            label="Carte Live" 
            isActive={activeTab === 'Carte'}
            onPress={() => setActiveTab('Carte')} 
          />
          <SidebarItem 
            icon={FileText} 
            label="Publications" 
            isActive={activeTab === 'Publications'}
            onPress={() => setActiveTab('Publications')} 
          />
          <SidebarItem 
            icon={BookOpen} 
            label="Savoir Citoyen" 
            isActive={activeTab === 'Savoir'}
            onPress={() => setActiveTab('Savoir')} 
          />
        </ScrollView>

        {/* User Profile & Logout */}
        <View style={styles.footer}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.prenom?.[0] || 'A'}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName} numberOfLines={1}>{user?.prenom} {user?.nom}</Text>
              <Text style={styles.userRole} numberOfLines={1}>{user?.ministere?.nom || user?.role}</Text>
            </View>
          </View>
          <Pressable 
            style={({ hovered }) => [styles.logoutBtn, hovered && styles.logoutBtnHover]}
            onPress={logout}
          >
            <LogOut color={COLORS.error} size={20} />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </Pressable>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
  },
  // --- Sidebar Styles ---
  sidebar: {
    width: 260,
    backgroundColor: COLORS.sidebarBg,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  brandTitle: {
    ...FONTS.h2,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  navMenu: {
    flex: 1,
    paddingVertical: SPACING.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    position: 'relative',
    cursor: 'pointer',
  },
  navItemHover: {
    backgroundColor: COLORS.sidebarHover,
  },
  navItemActive: {
    backgroundColor: COLORS.sidebarActive,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '15%',
    bottom: '15%',
    width: 3,
    backgroundColor: 'transparent',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  activeIndicatorVisible: {
    backgroundColor: COLORS.primaryLight,
  },
  navIcon: {
    marginRight: SPACING.md,
  },
  navText: {
    ...FONTS.regular,
    color: COLORS.sidebarText,
    fontWeight: '500',
  },
  navTextActive: {
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...FONTS.small,
    color: COLORS.white,
    fontWeight: '600',
  },
  userRole: {
    ...FONTS.caption,
    color: COLORS.sidebarText,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    gap: SPACING.sm,
    cursor: 'pointer',
  },
  logoutBtnHover: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
  },
  logoutText: {
    ...FONTS.small,
    color: COLORS.error,
    fontWeight: '600',
  },
  // --- Main Content Styles ---
  mainContent: {
    flex: 1,
    overflow: 'hidden',
  }
});
