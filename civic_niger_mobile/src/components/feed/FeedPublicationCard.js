import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';
import { FileText, Building2, ChevronRight } from 'lucide-react-native';

const FeedPublicationCard = memo(({ item, onPress }) => {
  // If no image, we show a nice fallback
  const hasImage = !!item.image;
  
  const a11yLabel = `Annonce gouvernementale. Titre: ${item.titre}. Double-tapez pour lire la suite.`;

  return (
    <Pressable 
      style={({pressed}) => [styles.card, pressed && styles.cardPressed]} 
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
    >
      {hasImage && (
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Building2 color={COLORS.primary} size={14} />
            <Text style={styles.badgeText}>Annonce Gouvernementale</Text>
          </View>
          <Text style={styles.dateText}>{item.date ? new Date(item.date).toLocaleDateString('fr-FR') : 'Récent'}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>{item.titre}</Text>
        
        {item.contenu && (
          <Text style={styles.summary} numberOfLines={3}>{item.contenu}</Text>
        )}

        <View style={styles.footer}>
          <Text style={styles.readMore}>Lire la suite</Text>
          <ChevronRight color={COLORS.primary} size={16} />
        </View>
      </View>
    </Pressable>
  );
});

export default FeedPublicationCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  cardPressed: {
    opacity: 0.9,
    backgroundColor: '#FAFAFA',
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  badgeText: {
    ...FONTS.small,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  dateText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  summary: {
    ...FONTS.regular,
    color: '#333333',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  readMore: {
    ...FONTS.small,
    fontWeight: '600',
    color: COLORS.primary,
  }
});
