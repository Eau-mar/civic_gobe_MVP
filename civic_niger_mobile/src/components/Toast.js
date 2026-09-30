import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CircleCheckBig, AlertCircle, Info } from 'lucide-react-native';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme';

let toastTimeout;

// Composant Toast Simple sans dépendance complexe
export default function Toast({ message, type = 'info', visible, onHide }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-20));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      toastTimeout = setTimeout(() => {
        hideToast();
      }, 4000);
    } else {
      hideToast();
    }

    return () => clearTimeout(toastTimeout);
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CircleCheckBig color={COLORS.success} size={24} />;
      case 'error':
        return <AlertCircle color={COLORS.error} size={24} />;
      default:
        return <Info color={COLORS.primary} size={24} />;
    }
  };

  const getBackground = () => {
    switch (type) {
      case 'success':
        return COLORS.successLight;
      case 'error':
        return COLORS.errorLight;
      default:
        return COLORS.surface;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackground(),
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      accessibilityRole="alert"
    >
      <View style={styles.content}>
        {getIcon()}
        <Text style={[styles.text, { color: type === 'error' ? COLORS.error : type === 'success' ? COLORS.success : COLORS.dark }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: SPACING.xl, // En haut de l'écran
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 9999,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...SHADOWS.md,
    maxWidth: 600, // Pour le web
    alignSelf: 'center',
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    ...FONTS.regular,
    fontWeight: '500',
    marginLeft: SPACING.sm,
    flex: 1,
  },
});
