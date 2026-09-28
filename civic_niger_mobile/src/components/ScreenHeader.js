import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

/**
 * ScreenHeader — En-tête réutilisable pour tous les écrans de l'application.
 *
 * Props :
 * - title       : Titre affiché (string)
 * - subtitle    : Sous-titre optionnel (string)
 * - onBack      : Callback pour le bouton retour. Si absent, pas de bouton retour.
 * - rightAction : Composant React rendu à droite (ex: un bouton Settings).
 * - transparent : Si true, fond transparent (utile pour les écrans avec image/fond custom).
 * - style       : Style externe pour le wrapper.
 */
export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightAction,
  transparent = false,
  style,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, SPACING.sm) + SPACING.sm },
        !transparent && styles.solidBg,
        style,
      ]}
    >
      <View style={styles.row}>
        {/* Bouton Retour */}
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ChevronLeft color={COLORS.dark} size={22} />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        {/* Titre + Sous-titre */}
        <View style={styles.titleContainer}>
          {title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Action droite */}
        {rightAction ? (
          <View style={styles.rightSlot}>{rightAction}</View>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  solidBg: {
    backgroundColor: COLORS.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  backPlaceholder: {
    width: 38,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.dark,
    textAlign: 'center',
  },
  subtitle: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  rightSlot: {
    width: 38,
    alignItems: 'flex-end',
  },
});
