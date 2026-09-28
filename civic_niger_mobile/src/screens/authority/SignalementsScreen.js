import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, TextInput } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';
import { FileWarning, Search, Filter, ClipboardList, MapPin, Video, Eye, ChevronLeft, ChevronRight } from 'lucide-react-native';
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

const STATUS_LABELS = {
  'non_traite': { label: 'Non traité', color: COLORS.error },
  'en_cours': { label: 'En cours', color: COLORS.warning },
  'traite': { label: 'Traité', color: COLORS.success },
};

export default function SignalementsScreen({ navigation }) {
  const [signalements, setSignalements] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    loadSignalements();
  }, []);

  useEffect(() => {
    // Basic frontend filtering
    let result = signalements;
    if (searchQuery) {
      result = result.filter(s => 
        (s.titre && s.titre.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.localisation && s.localisation.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    setFilteredData(result);
    setPage(1); // Reset to first page on search
  }, [searchQuery, signalements]);

  const loadSignalements = async () => {
    setLoading(true);
    try {
      const data = await api.getSignalements();
      setSignalements(Array.isArray(data) ? data : (data?.results || []));
    } catch (e) {
      console.error('Erreur chargement signalements:', e);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Signalements</Text>
          <Text style={styles.pageSubtitle}>Gérez et traitez les requêtes des citoyens</Text>
        </View>
      </View>

      <View style={styles.tableCard}>
        {/* Toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.searchContainer}>
            <Search color={COLORS.textLight} size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par titre ou lieu..."
              placeholderTextColor={COLORS.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <Pressable style={({hovered}) => [styles.filterBtn, hovered && styles.filterBtnHover]}>
            <Filter color={COLORS.textSecondary} size={20} />
            <Text style={styles.filterText}>Filtrer</Text>
          </Pressable>
        </View>

        {/* Table Content */}
        {loading && signalements.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Chargement des données...</Text>
          </View>
        ) : (
          <View style={{flex: 1}}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{minWidth: 1000}}>
              <View style={styles.tableWrapper}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { width: 60 }]}>#</Text>
                  <Text style={[styles.th, { flex: 2 }]}>Titre & Localisation</Text>
                  <Text style={[styles.th, { flex: 1 }]}>Catégorie</Text>
                  <Text style={[styles.th, { flex: 1 }]}>Statut</Text>
                  <Text style={[styles.th, { flex: 1 }]}>Date</Text>
                  <Text style={[styles.th, { flex: 1 }]}>Auteur</Text>
                  <Text style={[styles.th, { width: 120, textAlign: 'center' }]}>Actions</Text>
                </View>

                <ScrollView style={{flex: 1}}>
                  {paginatedData.map((s, idx) => {
                    const statusInfo = STATUS_LABELS[s.statut] || STATUS_LABELS.non_traite;
                    const CatIcon = CATEGORY_ICONS[s.categorie] || ClipboardList;
                    const globalIdx = (page - 1) * itemsPerPage + idx + 1;
                    
                    return (
                      <Pressable key={s.id || idx} style={({hovered}) => [styles.tableRow, hovered && styles.tableRowHover]}>
                        <Text style={[styles.td, { width: 60 }]}>{globalIdx}</Text>
                        
                        <View style={{ flex: 2 }}>
                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                            {s.is_live && <View style={styles.liveIndicator} />}
                            <Text style={[styles.td, {fontWeight: '600'}]} numberOfLines={1}>{s.titre || 'Sans titre'}</Text>
                          </View>
                          {s.localisation ? (
                            <Text style={styles.tdSub} numberOfLines={1}>{s.localisation}</Text>
                          ) : null}
                        </View>
                        
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <CatIcon color={COLORS.textSecondary} size={16} />
                          <Text style={styles.td}>{s.categorie}</Text>
                        </View>
                        
                        <View style={{ flex: 1 }}>
                          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15', borderColor: statusInfo.color }]}>
                            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                          </View>
                        </View>
                        
                        <Text style={[styles.td, { flex: 1 }]}>
                          {s.date ? new Date(s.date).toLocaleDateString('fr-FR') : '—'}
                        </Text>
                        
                        <View style={{ flex: 1 }}>
                          <Text style={styles.td} numberOfLines={1}>{s.utilisateur?.prenom} {s.utilisateur?.nom || 'Citoyen'}</Text>
                          {s.utilisateur?.telephone ? <Text style={styles.tdSub}>{s.utilisateur?.telephone}</Text> : null}
                        </View>

                        <View style={{ width: 120, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                          {s.is_live && (
                            <Pressable style={styles.actionBtnLive}>
                              <Video color={COLORS.white} size={14} />
                              <Text style={styles.actionBtnLiveText}>Live</Text>
                            </Pressable>
                          )}
                          <Pressable 
                            style={styles.actionBtn}
                            onPress={() => navigation.navigate('SignalementDetailAuthority', { id: s.id })}
                          >
                            <Eye color={COLORS.primary} size={18} />
                          </Pressable>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </ScrollView>

            {/* Pagination */}
            {totalPages > 1 && (
              <View style={styles.pagination}>
                <Text style={styles.pageInfo}>
                  Affichage {((page - 1) * itemsPerPage) + 1} à {Math.min(page * itemsPerPage, filteredData.length)} sur {filteredData.length}
                </Text>
                <View style={styles.pageControls}>
                  <Pressable 
                    disabled={page === 1}
                    onPress={() => setPage(p => p - 1)}
                    style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                  >
                    <ChevronLeft color={page === 1 ? COLORS.textLight : COLORS.dark} size={20} />
                  </Pressable>
                  <Text style={styles.pageCurrent}>{page} / {totalPages}</Text>
                  <Pressable 
                    disabled={page === totalPages}
                    onPress={() => setPage(p => p + 1)}
                    style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
                  >
                    <ChevronRight color={page === totalPages ? COLORS.textLight : COLORS.dark} size={20} />
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: SPACING.xl,
  },
  header: {
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
  tableCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    flex: 1,
    maxWidth: 400,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    ...FONTS.regular,
    outlineStyle: 'none',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    cursor: 'pointer',
  },
  filterBtnHover: {
    backgroundColor: COLORS.background,
  },
  filterText: {
    ...FONTS.button,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  tableWrapper: {
    flex: 1,
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
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  pageInfo: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  pageBtn: {
    padding: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageCurrent: {
    ...FONTS.small,
    fontWeight: '600',
    color: COLORS.dark,
  },
});
