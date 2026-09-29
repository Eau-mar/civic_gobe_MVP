import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { ChevronLeft, FileText, Calendar, User } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';

export default function PublicationDetailScreen({ route, navigation }) {
  const { publication } = route.params;
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Détail de la Publication" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {publication.image ? (
          <Image source={{ uri: publication.image }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={styles.coverPlaceholder}>
            <FileText color={COLORS.primaryLight} size={64} />
          </View>
        )}

        <View style={styles.articleContainer}>
          <Text style={styles.title}>{publication.titre}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Calendar color={COLORS.textLight} size={16} style={{ marginRight: 4 }} />
              <Text style={styles.metaText}>
                {publication.date ? new Date(publication.date).toLocaleDateString('fr-FR') : 'Date inconnue'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <User color={COLORS.textLight} size={16} style={{ marginRight: 4 }} />
              <Text style={styles.metaText}>
                Par {publication.auteur?.nom || 'Ministère'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.bodyText}>
            {publication.contenu}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: SPACING.xxl,
  },
  coverImage: {
    width: '100%',
    height: 400,
    backgroundColor: COLORS.surface,
  },
  coverPlaceholder: {
    width: '100%',
    height: 400,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    marginTop: -40,
    minHeight: 500,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    ...SHADOWS.md,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.dark,
    marginBottom: SPACING.md,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  metaText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginBottom: SPACING.lg,
  },
  bodyText: {
    ...FONTS.regular,
    color: COLORS.text,
    lineHeight: 26,
  }
});
