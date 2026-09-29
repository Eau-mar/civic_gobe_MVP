import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Platform } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';
import { FileWarning, Clock, CheckCircle, Radio, ClipboardList, MapPin, Video, Eye, RefreshCw } from 'lucide-react-native';
import api from '../../api/client';

// Category Icons Mapping
const CATEGORY_ICONS = {
  'eau': MapPin,
  'route': MapPin,
  'electricite': MapPin,
  'sante': MapPin,
  'securite': FileWarning,
  'autre': ClipboardList,
};

// Status Labels Mapping
const STATUS_LABELS = {
  'non_traite': { label: 'Non traité', color: COLORS.error },
  'en_cours': { label: 'En cours', color: COLORS.warning },
  'traite': { label: 'Traité', color: COLORS.success },
};

export default function OverviewScreen({ navigation, onSeeAll }) {
  const [signalements, setSignalements] = useState([]);
  const [stats, setStats] = useState({ total: 0, nonTraite: 0, enCours: 0, traite: 0, live: 0 });
  const [loading, setLoading] = useState(true);
  
  const dashboardIntervalRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
      dashboardIntervalRef.current = setInterval(loadDashboardData, 30000);
      return () => {
        if (dashboardIntervalRef.current) clearInterval(dashboardIntervalRef.current);
      };
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      const [statsData, signalementsData] = await Promise.all([
        api.getDashboardStats(),
        api.getSignalements({ limit: 10 })
      ]);
      setStats(statsData);
      setSignalements(Array.isArray(signalementsData) ? signalementsData : (signalementsData?.results || []));
    } catch (e) {
      console.error('Erreur chargement dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Vue d'ensemble</Text>
            <Text style={styles.pageSubtitle}>Résumé de l'activité sur la plateforme</Text>
          </View>
          <Pressable 
            style={({ hovered }) => [styles.refreshBtn, hovered && styles.refreshBtnHover]}
            onPress={() => { setLoading(true); loadDashboardData(); }}
          >
            <RefreshCw color={COLORS.primary} size={18} />
            <Text style={styles.refreshText}>Actualiser</Text>
          </Pressable>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard 
            label="Total" 
            value={stats.total} 
            color={COLORS.primary} 
            icon={ClipboardList} 
          />
          <StatCard 
            label="Non traités" 
            value={stats.nonTraite} 
            color={COLORS.error} 
            icon={FileWarning} 
          />
          <StatCard 
            label="En cours" 
            value={stats.enCours} 
            color={COLORS.warning} 
            icon={Clock} 
          />
          <StatCard 
            label="Traités" 
            value={stats.traite} 
            color={COLORS.success} 
            icon={CheckCircle} 
          />
          {stats.live > 0 && (
            <StatCard 
              label="En Direct" 
              value={stats.live} 
              color={COLORS.error} 
              icon={Radio}
              isLive={true}
            />
          )}
        </View>

        {/* Derniers Signalements Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderSection}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <ClipboardList color={COLORS.dark} size={20} />
              <Text style={styles.tableTitle}>Derniers Signalements</Text>
            </View>
            <Pressable onPress={onSeeAll}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </Pressable>
          </View>

          {loading && signalements.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Chargement des données...</Text>
            </View>
          ) : (
            <View style={styles.tableWrapper}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 0.5 }]}>#</Text>
                <Text style={[styles.th, { flex: 2.5 }]}>Titre & Localisation</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Catégorie</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Statut</Text>
                <Text style={[styles.th, { flex: 1 }]}>Date</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Actions</Text>
              </View>

              {signalements.slice(0, 10).map((s, idx) => {
                const statusInfo = STATUS_LABELS[s.statut] || STATUS_LABELS.non_traite;
                const CatIcon = CATEGORY_ICONS[s.categorie] || ClipboardList;
                
                return (
                  <Pressable key={s.id || idx} style={({hovered}) => [styles.tableRow, hovered && styles.tableRowHover]}>
                    <Text style={[styles.td, { flex: 0.5 }]}>{idx + 1}</Text>
                    
                    <View style={{ flex: 2.5 }}>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                        {s.is_live && <View style={styles.liveIndicator} />}
                        <Text style={[styles.td, {fontWeight: '600'}]} numberOfLines={1}>{s.titre || 'Sans titre'}</Text>
                      </View>
                      {s.localisation ? (
                        <Text style={styles.tdSub} numberOfLines={1}>{s.localisation}</Text>
                      ) : null}
                    </View>
                    
                    <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <CatIcon color={COLORS.textSecondary} size={16} />
                      <Text style={styles.td}>{s.categorie}</Text>
                    </View>
                    
                    <View style={{ flex: 1.5 }}>
                      <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15', borderColor: statusInfo.color }]}>
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                      </View>
                    </View>
                    
                    <Text style={[styles.td, { flex: 1 }]}>
                      {s.date ? new Date(s.date).toLocaleDateString('fr-FR') : '—'}
                    </Text>

                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                      {s.is_live ? (
                        <Pressable style={styles.actionBtnLive}>
                          <Video color={COLORS.white} size={14} />
                          <Text style={styles.actionBtnLiveText}>Rejoindre</Text>
                        </Pressable>
                      ) : (
                        <Pressable 
                          style={styles.actionBtn}
                          onPress={() => navigation.navigate('SignalementDetailAuthority', { id: s.id })}
                        >
                          <Eye color={COLORS.primary} size={18} />
                        </Pressable>
                      )}
                    </View>
                  </Pressable>
                );
              })}

              {signalements.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Aucun signalement pour le moment.</Text>
                </View>
              )}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

// Stat Card Component
function StatCard({ label, value, color, icon: Icon, isLive }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statContent}>
        <View>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
        <View style={[styles.iconWrapper, { backgroundColor: color + '15' }]}>
          {isLive && <View style={[styles.livePulse, { backgroundColor: color }]} />}
          <Icon color={color} size={28} />
        </View>
      </View>
      <View style={[styles.statBorder, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Lighter background for the main content area
  },
  scrollContent: {
    padding: SPACING.xl,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.xl,
  },
  pageTitle: {
    ...FONTS.h1,
    color: COLORS.dark,
    marginBottom: 4,
  },
  pageSubtitle: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    cursor: 'pointer',
  },
  refreshBtnHover: {
    backgroundColor: COLORS.background,
  },
  refreshText: {
    ...FONTS.button,
    color: COLORS.primary,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.xl * 1.5,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  statBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.dark,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  livePulse: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    top: 4,
    right: 4,
  },
  tableCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tableHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  tableTitle: {
    ...FONTS.h3,
    color: COLORS.dark,
  },
  seeAllText: {
    ...FONTS.small,
    color: COLORS.primary,
    fontWeight: '600',
    cursor: 'pointer',
  },
  tableWrapper: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  th: {
    ...FONTS.caption,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
    cursor: 'pointer',
  },
  tableRowHover: {
    backgroundColor: '#F9FAFB',
  },
  td: {
    ...FONTS.small,
    color: COLORS.text,
  },
  tdSub: {
    ...FONTS.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
  },
  actionBtnLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.error,
  },
  actionBtnLiveText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyState: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
  },
});
