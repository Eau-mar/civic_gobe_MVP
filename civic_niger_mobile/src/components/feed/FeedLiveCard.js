import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';
import { Video, MapPin } from 'lucide-react-native';

const FeedLiveCard = memo(({ item, onPress }) => {
  const a11yLabel = `Alerte en direct. Titre: ${item.titre}. Signalé par ${item.auteur?.prenom || 'un citoyen'}. Localisation: ${item.localisation || 'inconnue'}. Double-tapez pour rejoindre le flux vidéo.`;

  return (
    <Pressable 
      style={({pressed}) => [styles.card, pressed && styles.cardPressed]} 
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
    >
      <View style={styles.liveIndicator}>
        <View style={styles.pulseDot} />
        <Text style={styles.liveText}>EN DIRECT</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Video color={COLORS.error} size={28} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>{item.titre}</Text>
          <Text style={styles.authorName}>
            Signalé par {item.auteur?.prenom} {item.auteur?.nom || ''}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <MapPin color={COLORS.textSecondary} size={16} />
          <Text style={styles.footerText} numberOfLines={1}>{item.localisation || 'Lieu inconnu'}</Text>
        </View>
        <Pressable 
          style={styles.joinBtn} 
          onPress={onPress}
          accessible={false} // Parrent handles the a11y focus
          importantForAccessibility="no"
        >
          <Text style={styles.joinBtnText}>Regarder le direct</Text>
        </Pressable>
      </View>
    </Pressable>
  );
});

export default FeedLiveCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FEF2F2', // Very light red background for urgency
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: '#FECACA',
    ...SHADOWS.md,
    shadowColor: COLORS.error,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
    // Note: pulse animation handled best via Reanimated or standard Animated, static for now
  },
  liveText: {
    ...FONTS.small,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.error,
    marginBottom: 4,
  },
  authorName: {
    ...FONTS.small,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    paddingRight: SPACING.sm,
  },
  footerText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  joinBtn: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44, // Touch target A11y
    borderRadius: RADIUS.full,
  },
  joinBtnText: {
    ...FONTS.button,
    fontSize: 12,
    color: COLORS.white,
  }
});
