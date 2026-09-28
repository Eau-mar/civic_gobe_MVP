import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';
import { Shield } from 'lucide-react-native';

export default function AuthLayout({ children, title, subtitle, imageLeft }) {
  const { width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 768; // Point de rupture pour Desktop/Tablette

  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        {/* Colonne Gauche : Branding */}
        <View style={styles.desktopLeft}>
          <View style={styles.brandingContent}>
            <View style={styles.logoCircle}>
              <Shield color={COLORS.primaryLight} size={48} />
            </View>
            <Text style={styles.brandingTitle}>CivicTech Niger</Text>
            <Text style={styles.brandingSubtitle}>
              Le portail numérique des services de l'État et des citoyens.
            </Text>
          </View>
          {/* Cercles décoratifs */}
          <View style={styles.decoCircle1} />
          <View style={styles.decoCircle2} />
        </View>

        {/* Colonne Droite : Formulaire */}
        <View style={styles.desktopRight}>
          <ScrollView contentContainerStyle={styles.desktopRightScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.formContainer}>
              <View style={styles.header}>
                <Text style={styles.titleDark}>{title}</Text>
                {subtitle && <Text style={styles.subtitleDark}>{subtitle}</Text>}
              </View>
              {children}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // --- Version Mobile ---
  const content = (
    <ScrollView 
      contentContainerStyle={styles.mobileScroll} 
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header Mobile (Fond coloré) */}
      <View style={[styles.mobileHeader, { paddingTop: insets.top + SPACING.lg }]}>
        <View style={styles.logoCircleSmall}>
          <Shield color={COLORS.white} size={32} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Carte du Formulaire */}
      <View style={styles.mobileCard}>
        {children}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.mobileContainer}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} 
        style={styles.flex}
      >
        {content}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  
  // --- DESKTOP STYLES ---
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
  },
  desktopLeft: {
    flex: 1,
    backgroundColor: COLORS.sidebarBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    overflow: 'hidden', // Pour cacher les débords de cercles
  },
  desktopRight: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  desktopRightScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  formContainer: {
    width: '100%',
    maxWidth: 480, // Largeur max du formulaire pour une lecture confortable
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  brandingContent: {
    alignItems: 'center',
    zIndex: 10,
    maxWidth: 500,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 127, 95, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    marginBottom: SPACING.xl,
  },
  brandingTitle: {
    ...FONTS.h1,
    color: COLORS.white,
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontSize: 40,
  },
  brandingSubtitle: {
    ...FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 28,
  },
  decoCircle1: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  decoCircle2: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },

  // --- MOBILE STYLES ---
  mobileContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mobileScroll: {
    flexGrow: 1,
    paddingBottom: SPACING.xxl,
  },
  mobileHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: SPACING.xxl + SPACING.lg,
    paddingBottom: SPACING.xl + SPACING.xl, // Espace extra pour que la carte remonte
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  logoCircleSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    marginBottom: SPACING.lg,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.white,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  titleDark: {
    ...FONTS.h1,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  subtitleDark: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  mobileCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: -SPACING.xl, // Fait remonter la carte sur le header coloré
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
});
