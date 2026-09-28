import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';
import { MapPin, Shield, Droplet, Navigation, Lightbulb, FileText, HeartPulse, User, Camera, Mic } from 'lucide-react-native';

const CATEGORY_ICONS = {
  'eau': Droplet,
  'route': Navigation,
  'eclairage': Lightbulb,
  'sante': HeartPulse,
  'securite': Shield,
  'autre': FileText,
};

const STATUS_CONFIG = {
  'non_traite': { label: 'Non traité', color: COLORS.error },
  'en_cours': { label: 'En cours', color: COLORS.warning },
  'traite': { label: 'Traité', color: COLORS.success },
};

const FeedReportCard = memo(({ item, onPress }) => {
  const CatIcon = CATEGORY_ICONS[item.categorie] || FileText;
  const statusInfo = STATUS_CONFIG[item.statut] || STATUS_CONFIG['non_traite'];

  const a11yLabel = `Signalement. Catégorie ${item.categorie}. Statut: ${statusInfo.label}. Titre: ${item.titre}. Signalé par ${item.auteur?.prenom || 'un citoyen'}.`;

  return (
    <Pressable 
      style={({pressed}) => [styles.card, pressed && styles.cardPressed]} 
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Double-tapez pour ouvrir les détails de ce signalement"
    >
      <View style={styles.header}>
        <View style={styles.categorySection}>
          <View style={[styles.catIconWrapper, { backgroundColor: COLORS.primaryLight + '20' }]}>
            <CatIcon color={COLORS.primary} size={18} />
          </View>
          <View>
            <Text style={styles.catTextTitle}>{item.categorie}</Text>
            <Text style={styles.dateText}>{item.date ? new Date(item.date).toLocaleDateString('fr-FR') : 'Date inconnue'}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{item.titre}</Text>
        {item.description ? (
          <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
        ) : null}
        
        {item.image && (
          <Image 
            source={{ uri: item.image }} 
            style={styles.cardImage} 
            resizeMode="cover" 
          />
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <User color={COLORS.textSecondary} size={14} />
          <Text style={styles.footerText} numberOfLines={1}>
            {item.auteur?.prenom} {item.auteur?.nom || 'Citoyen'}
          </Text>
        </View>
        {item.localisation && (
          <View style={styles.footerItem}>
            <MapPin color={COLORS.textSecondary} size={14} />
            <Text style={styles.footerText} numberOfLines={1}>{item.localisation}</Text>
          </View>
        )}
        {item.audio && (
          <View style={styles.mediaFooterIndicators}>
            <Mic color={COLORS.textLight} size={14} />
          </View>
        )}
      </View>
    </Pressable>
  );
});

export default FeedReportCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  cardPressed: {
    opacity: 0.9,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  authorSection: {
    display: 'none',
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  catIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catTextTitle: {
    ...FONTS.small,
    fontWeight: '700',
    color: COLORS.primaryDark,
    textTransform: 'capitalize',
  },
  dateText: {
    ...FONTS.caption,
    color: COLORS.textLight,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusText: {
    ...FONTS.caption,
    fontWeight: '700',
  },
  content: {
    marginBottom: SPACING.md,
  },
  title: {
    ...FONTS.h4,
    color: COLORS.dark,
    marginBottom: 6,
  },
  description: {
    ...FONTS.regular,
    color: '#333333',
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '50%',
  },
  footerText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  mediaFooterIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
});
