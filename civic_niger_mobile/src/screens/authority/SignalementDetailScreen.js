import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Image, Platform } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';
import { MapPin, Calendar, User, Phone, CheckCircle, Clock, FileWarning, ClipboardList } from 'lucide-react-native';
import api, { API_BASE_URL } from '../../api/client';
import ScreenHeader from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';

const STATUS_CONFIG = {
  'non_traite': { label: 'Non traité', color: COLORS.error, icon: FileWarning },
  'en_cours': { label: 'En cours', color: COLORS.warning, icon: Clock },
  'traite': { label: 'Traité', color: COLORS.success, icon: CheckCircle },
};

const CATEGORY_ICONS = {
  'eau': MapPin,
  'route': MapPin,
  'electricite': MapPin,
  'sante': MapPin,
  'securite': FileWarning,
  'autre': ClipboardList,
};

export default function SignalementDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [signalement, setSignalement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadSignalement();
  }, [id]);

  const loadSignalement = async () => {
    try {
      const data = await api.getSignalement(id);
      setSignalement(data);
    } catch (e) {
      console.error('Erreur chargement signalement detail:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    if (signalement?.statut === newStatus) return;
    setUpdating(true);
    try {
      const updated = await api.patchSignalement(id, { statut: newStatus });
      setSignalement(updated);
    } catch (e) {
      console.error('Erreur MAJ statut:', e);
      alert('Impossible de mettre à jour le statut.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ScreenHeader onBack={() => navigation.goBack()} title="Détail du Signalement" />
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (!signalement) {
    return (
      <View style={styles.container}>
        <ScreenHeader onBack={() => navigation.goBack()} title="Erreur" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Signalement introuvable.</Text>
        </View>
      </View>
    );
  }

  const CatIcon = CATEGORY_ICONS[signalement.categorie] || ClipboardList;
  const CurrentStatus = STATUS_CONFIG[signalement.statut] || STATUS_CONFIG['non_traite'];

  return (
    <View style={styles.container}>
      <ScreenHeader 
        onBack={() => navigation.goBack()} 
        title={`Signalement #${signalement.id}`} 
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Main Card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.categoryBadge}>
              <CatIcon color={COLORS.primary} size={16} />
              <Text style={styles.categoryText}>{signalement.categorie}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: CurrentStatus.color + '15' }]}>
              <Text style={[styles.statusText, { color: CurrentStatus.color }]}>
                {CurrentStatus.label}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{signalement.titre}</Text>
          <Text style={styles.description}>{signalement.description || "Aucune description fournie."}</Text>

          <View style={styles.metaInfoRow}>
            <View style={styles.metaItem}>
              <MapPin color={COLORS.textSecondary} size={16} />
              <Text style={styles.metaText}>{signalement.localisation || "Lieu non spécifié"}</Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar color={COLORS.textSecondary} size={16} />
              <Text style={styles.metaText}>
                {new Date(signalement.date).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Panel for Authority */}
        {user?.role === 'MINISTERE' || user?.role === 'ADMIN' ? (
          <View style={styles.actionCard}>
            <Text style={styles.sectionTitle}>Mettre à jour le statut</Text>
            {updating && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginBottom: 10 }} />}
            <View style={styles.statusButtonsRow}>
              {Object.keys(STATUS_CONFIG).map((key) => {
                const config = STATUS_CONFIG[key];
                const isActive = signalement.statut === key;
                return (
                  <Pressable 
                    key={key}
                    disabled={updating}
                    style={[
                      styles.statusBtn, 
                      isActive && { backgroundColor: config.color, borderColor: config.color }
                    ]}
                    onPress={() => updateStatus(key)}
                  >
                    <Text style={[styles.statusBtnText, isActive && { color: COLORS.white }]}>
                      {config.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Media Section */}
        {signalement.image && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Image jointe</Text>
            <Image 
              source={{ uri: signalement.image.startsWith('http') ? signalement.image : `${API_BASE_URL.replace('/api/v1', '')}${signalement.image}` }} 
              style={styles.image} 
              resizeMode="cover" 
            />
          </View>
        )}

        {/* Author Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informations Citoyen</Text>
          <View style={styles.authorInfo}>
            <View style={styles.metaItem}>
              <User color={COLORS.textSecondary} size={16} />
              <Text style={styles.metaText}>
                {signalement.utilisateur?.prenom} {signalement.utilisateur?.nom || 'Citoyen Anonyme'}
              </Text>
            </View>
            {signalement.utilisateur?.telephone && (
              <View style={styles.metaItem}>
                <Phone color={COLORS.textSecondary} size={16} />
                <Text style={styles.metaText}>{signalement.utilisateur.telephone}</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: SPACING.xxl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  actionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
    borderWidth: 2,
    borderColor: COLORS.primaryLight + '40',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  categoryText: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusText: {
    ...FONTS.caption,
    fontWeight: '700',
  },
  title: {
    ...FONTS.h2,
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  description: {
    ...FONTS.regular,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  metaInfoRow: {
    flexDirection: 'column',
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  authorInfo: {
    flexDirection: 'column',
    gap: SPACING.sm,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  statusBtn: {
    flex: 1,
    minWidth: 100,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  statusBtnText: {
    ...FONTS.button,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...FONTS.regular,
    color: COLORS.error,
  }
});
