import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';
import { MessageCircle, TrendingUp, ThumbsUp, User, Mic } from 'lucide-react-native';

const FeedVoixCard = memo(({ item, onPress, onVote, onCommentPress }) => {
  const goal = item.objectif_votes || 100;
  const progressPercent = item.votes_pour ? Math.min((item.votes_pour / goal) * 100, 100) : 0;

  const a11yLabel = `Tendance Voix du Peuple. ${item.titre}. Actuellement ${item.votes_pour || 0} soutiens sur ${goal}. Par ${item.auteur?.prenom || 'un citoyen'}.`;

  return (
    <Pressable 
      style={({pressed}) => [styles.card, pressed && styles.cardPressed]} 
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Ouvrir les détails de la proposition"
    >
      <View style={styles.header}>
        <View style={styles.badge}>
          <TrendingUp color={COLORS.accent} size={16} />
          <Text style={styles.badgeText}>Tendance : Voix du Peuple</Text>
        </View>
        <Text style={styles.dateText}>{item.date ? new Date(item.date).toLocaleDateString('fr-FR') : 'Récent'}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>{item.titre}</Text>
      {item.contenu && (
        <Text style={styles.summary} numberOfLines={3}>{item.contenu}</Text>
      )}

      {/* Pétition Progress */}
      <View style={styles.petitionContainer} accessible={true} accessibilityLabel={`${progressPercent.toFixed(0)}% de l'objectif atteint`}>
        <View style={styles.petitionHeader}>
          <Text style={styles.petitionGoalText}>Objectif : {goal} soutiens</Text>
          <Text style={styles.petitionCountText}>{item.votes_pour || 0} / {goal}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.authorContainer}>
          <User color={COLORS.textSecondary} size={14} style={{ marginRight: 4 }} />
          <Text style={styles.authorText}>Par {item.auteur?.prenom || 'Citoyen'}</Text>
          {item.audio && (
            <Mic color={COLORS.textLight} size={14} style={{ marginLeft: 8 }} />
          )}
        </View>
        <View style={styles.actions}>
          <Pressable 
            style={[styles.actionItem, item.user_vote === 'pour' && styles.actionItemActive]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Voter pour, actuellement ${item.votes_pour || 0} votes`}
            onPress={(e) => {
              e.stopPropagation();
              if (onVote) onVote(item.id, 'pour');
            }}
          >
            <ThumbsUp color={item.user_vote === 'pour' ? COLORS.primary : COLORS.textSecondary} size={18} />
            <Text style={[styles.actionText, item.user_vote === 'pour' && { color: COLORS.primary }]}>
              {item.votes_pour || 0}
            </Text>
          </Pressable>
          <Pressable 
            style={styles.actionItem} 
            accessible={true} 
            accessibilityRole="button"
            accessibilityLabel={`Commenter, ${item.commentaires_count || 0} commentaires`}
            onPress={(e) => {
              e.stopPropagation();
              if (onCommentPress) onCommentPress();
              else if (onPress) onPress();
            }}
          >
            <MessageCircle color={COLORS.textSecondary} size={18} />
            <Text style={styles.actionText}>{item.commentaires_count || 0}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});

export default FeedVoixCard;

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
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  badgeText: {
    ...FONTS.small,
    fontWeight: '700',
    color: COLORS.accentDark,
  },
  dateText: {
    ...FONTS.caption,
    color: COLORS.textLight,
  },
  title: {
    ...FONTS.h4,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  summary: {
    ...FONTS.regular,
    color: '#333333',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  petitionContainer: {
    marginBottom: SPACING.md,
  },
  petitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  petitionGoalText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  petitionCountText: {
    ...FONTS.caption,
    color: COLORS.accentDark,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  authorContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    ...FONTS.caption,
    color: COLORS.textLight,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Touch target A11y
    minWidth: 44,
    gap: 6,
    borderRadius: RADIUS.sm,
  },
  actionItemActive: {
    backgroundColor: COLORS.primaryLight + '20',
  },
  actionText: {
    ...FONTS.small,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});
