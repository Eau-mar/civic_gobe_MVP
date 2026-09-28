import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  View,
} from 'react-native';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../theme';

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary', // primary | secondary | outline | ghost
  size = 'lg',         // sm | md | lg
  style,
  textStyle,
  icon,
  iconLeft,
  iconRight,
  children,
}) {
  const isDisabled = disabled || loading;
  const resolvedIconLeft = iconLeft || icon; // icon is a shorthand for iconLeft

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed, hovered }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        !isDisabled && variant === 'primary' && SHADOWS.md,
        !isDisabled && pressed && styles[`pressed_${variant}`],
        !isDisabled && hovered && styles[`hovered_${variant}`], // Web hover state
        style,
      ]}
    >
      {({ pressed }) => (
        <View style={styles.contentRow}>
          {loading ? (
            <ActivityIndicator
              color={variant === 'primary' || variant === 'secondary' ? COLORS.white : COLORS.primary}
              size="small"
            />
          ) : (
            <>
              {resolvedIconLeft && <View style={styles.iconLeft}>{resolvedIconLeft}</View>}
              
              {children || (
                <Text style={[
                  styles.label,
                  styles[`label_${variant}`],
                  styles[`labelSize_${size}`],
                  isDisabled && styles.labelDisabled,
                  textStyle,
                ]}>
                  {title}
                </Text>
              )}

              {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    // Web focus outline suppression pour custom focus (géré par Pressable nativement mieux)
    outlineStyle: 'none',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Variants
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.accent,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Interaction States (Pressed / Hover)
  pressed_primary: {
    backgroundColor: COLORS.primaryDark,
  },
  hovered_primary: {
    backgroundColor: COLORS.primaryLight,
  },
  pressed_secondary: {
    backgroundColor: '#CC6200', // Plus foncé
  },
  hovered_secondary: {
    backgroundColor: COLORS.accentLight,
  },
  pressed_outline: {
    backgroundColor: 'rgba(0, 127, 95, 0.1)',
  },
  hovered_outline: {
    backgroundColor: 'rgba(0, 127, 95, 0.05)',
  },
  pressed_ghost: {
    backgroundColor: 'rgba(31, 41, 55, 0.1)',
  },
  hovered_ghost: {
    backgroundColor: 'rgba(31, 41, 55, 0.05)',
  },

  // Sizes
  size_sm: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 36,
  },
  size_md: {
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
    minHeight: 44,
  },
  size_lg: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 54,
  },

  disabled: {
    opacity: 0.5,
  },

  // Labels
  label: {
    ...FONTS.button,
  },
  label_primary: {
    color: COLORS.white,
  },
  label_secondary: {
    color: COLORS.white,
  },
  label_outline: {
    color: COLORS.primary,
  },
  label_ghost: {
    color: COLORS.primary,
  },

  labelSize_sm: {
    fontSize: 14,
  },
  labelSize_md: {
    fontSize: 15,
  },
  labelSize_lg: {
    fontSize: 16,
  },

  labelDisabled: {
    opacity: 0.7,
  },

  // Icons
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },
});
