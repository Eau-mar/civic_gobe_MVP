import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { COLORS, FONTS, SPACING } from '../theme';
import Button from './Button';

export default function EmptyState({ 
  icon = <Inbox color={COLORS.textLight} size={48} />, 
  title, 
  description, 
  actionTitle, 
  onAction 
}) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      
      {actionTitle && onAction && (
        <Button 
          title={actionTitle} 
          variant="outline" 
          onPress={onAction} 
          style={styles.actionButton} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginVertical: SPACING.lg,
  },
  iconContainer: {
    marginBottom: SPACING.md,
    opacity: 0.8,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  description: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  actionButton: {
    minWidth: 200,
  },
});
