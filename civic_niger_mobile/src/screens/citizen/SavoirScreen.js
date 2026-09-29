import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, Text, StyleSheet, FlatList, Pressable, 
  ActivityIndicator, RefreshControl, Image, TextInput, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Search, Plus } from 'lucide-react-native';
import api, { API_BASE_URL } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, FONTS, RADIUS } from '../../theme';
import Input from '../../components/Input';
import EmptyState from '../../components/EmptyState';

export default function SavoirScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [savoirs, setSavoirs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (!savoirs.length) setLoading(true);

    try {
      // 1. Fetch categories
      const cats = await api.getSavoirCategories();
      setCategories(cats);

      // 2. Fetch savoirs
      const data = await api.getSavoirs();
      setSavoirs(data);
      
      // Save for offline access
      await AsyncStorage.setItem('@savoirs_cache', JSON.stringify(data));
      await AsyncStorage.setItem('@savoir_cats_cache', JSON.stringify(cats));
      setIsOffline(false);
    } catch (e) {
      console.log('Erreur chargement savoirs, passage en mode hors-ligne', e);
      setIsOffline(true);
      // Load from cache
      const cachedSavoirs = await AsyncStorage.getItem('@savoirs_cache');
      const cachedCats = await AsyncStorage.getItem('@savoir_cats_cache');
      if (cachedSavoirs) setSavoirs(JSON.parse(cachedSavoirs));
      if (cachedCats) setCategories(JSON.parse(cachedCats));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filtrage combiné (catégorie + recherche)
  const filteredSavoirs = savoirs.filter(s => {
    const matchesCategory = activeCategory ? s.categorie === activeCategory : true;
    const matchesSearch = searchQuery 
      ? s.titre.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.contenu && s.contenu.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesCategory && matchesSearch;
  });

  const renderCategory = ({ item }) => (
    <Pressable 
      style={[
        styles.categoryPill, 
        activeCategory === item.id && styles.categoryPillActive
      ]}
      onPress={() => setActiveCategory(activeCategory === item.id ? null : item.id)}
    >
      <Text style={[
        styles.categoryText,
        activeCategory === item.id && styles.categoryTextActive
      ]}>
        {item.nom}
      </Text>
    </Pressable>
  );

  const renderSavoir = ({ item }) => {
    const imageUrl = item.image 
      ? (item.image.startsWith('http') ? item.image : `${API_BASE_URL.replace('/api/v1', '')}${item.image}`) 
      : null;

    return (
      <Pressable 
        style={styles.card}
        onPress={() => navigation.navigate('SavoirDetail', { savoir: item })}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Ionicons name="book-outline" size={40} color={COLORS.primary} />
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.cardCategory}>{item.categorie_nom || 'Général'}</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.titre}</Text>
          <Text style={styles.cardDate}>
            {new Date(item.date).toLocaleDateString('fr-FR')} • Par {item.auteur?.nom || 'Ministère'}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: SPACING.sm }}>Chargement des guides...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header and Search */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>Savoir Citoyen</Text>
            <Text style={styles.headerSubtitle}>Guides, lois et informations officielles</Text>
          </View>
          {user?.role === 'MINISTERE' && (
            <Pressable 
              style={styles.addBtn}
              onPress={() => navigation.navigate('CreateSavoirAuthority')}
            >
              <Plus color={COLORS.white} size={20} />
              <Text style={styles.addBtnText}>Ajouter</Text>
            </Pressable>
          )}
        </View>
        
        <Input
          placeholder="Rechercher un article..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={<Search color={COLORS.textLight} size={20} />}
          returnKeyType="search"
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color={COLORS.white} />
          <Text style={styles.offlineText}>Mode Hors-Ligne : Articles sauvegardés</Text>
        </View>
      )}

      {/* Categories Horizontal List */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={item => item.id.toString()}
          renderItem={renderCategory}
          contentContainerStyle={{ paddingHorizontal: SPACING.md }}
        />
      </View>

      {/* Savoirs List */}
      <ScrollView 
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
        }
      >
        {filteredSavoirs.length === 0 ? (
          <EmptyState 
            title="Aucun article disponible" 
            description="Revenez plus tard pour de nouveaux guides et informations." 
          />
        ) : (
          <View style={styles.gridContainer}>
            {filteredSavoirs.map((item, idx) => (
              <View key={item.id || idx} style={styles.gridItem}>
                {renderSavoir({ item })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  addBtnText: {
    ...FONTS.button,
    color: COLORS.white,
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    ...FONTS.regular,
    color: COLORS.text,
    height: '100%',
  },
  offlineBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.error,
    padding: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineText: {
    color: COLORS.white,
    marginLeft: SPACING.sm,
    ...FONTS.small,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.background,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    ...FONTS.small,
    color: COLORS.text,
  },
  categoryTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  listContent: {
    padding: SPACING.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
  },
  gridItem: {
    width: 320,
    flexGrow: 1,
    maxWidth: 400,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    height: '100%',
  },
  cardImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#eee',
  },
  cardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  cardContent: {
    padding: SPACING.md,
  },
  cardCategory: {
    ...FONTS.small,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardTitle: {
    ...FONTS.regular,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  cardDate: {
    ...FONTS.caption,
    color: COLORS.textLight,
  },
  emptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
