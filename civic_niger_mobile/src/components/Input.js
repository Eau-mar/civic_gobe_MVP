import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { COLORS, RADIUS, SPACING, FONTS } from '../theme';
import { Eye, EyeOff } from 'lucide-react-native';

export default function Input({
  label,
  hint,
  error,
  icon,
  containerStyle,
  inputStyle,
  secureTextEntry,
  value,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label} accessibilityRole="header">
          {label}
        </Text>
      )}
      
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputFocused,
        error && styles.inputError,
        props.editable === false && styles.inputDisabled,
      ]}>
        {icon && <View style={styles.icon}>{icon}</View>}
        
        <TextInput
          style={[styles.input, icon && styles.inputWithIcon, inputStyle]}
          placeholderTextColor={COLORS.textLight}
          autoCapitalize="none"
          value={value}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus && props.onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur && props.onBlur(e);
          }}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          accessibilityLabel={label || props.placeholder}
          accessibilityInvalid={!!error}
          {...props}
        />

        {secureTextEntry && (
          <Pressable 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIcon}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {isPasswordVisible ? (
               <EyeOff color={COLORS.textSecondary} size={20} />
            ) : (
               <Eye color={COLORS.textSecondary} size={20} />
            )}
          </Pressable>
        )}
      </View>

      {hint && !error && (
        <Text style={styles.hintText}>{hint}</Text>
      )}
      
      {error && (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    ...FONTS.small,
    fontWeight: '600', // Stronger label for professional form hierarchy
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm, // Sharper corners for professional look
    borderWidth: 1, // Standard 1px border instead of 1.5
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    minHeight: 48, // Slightly more compact than 52
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: COLORS.background,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  eyeIcon: {
    padding: SPACING.sm,
    marginRight: -SPACING.sm,
  },
  input: {
    flex: 1,
    ...FONTS.regular,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
    height: '100%',
    outlineStyle: 'none', // Supprime la bordure bleue native du navigateur Web
    backgroundColor: 'transparent',
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  errorText: {
    ...FONTS.caption,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  hintText: {
    ...FONTS.caption,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
});
