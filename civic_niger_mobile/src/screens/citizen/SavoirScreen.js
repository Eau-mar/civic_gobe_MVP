import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, Text, StyleSheet, FlatList, Pressable, 
  ActivityIndicator, RefreshControl, Image, TextInput, ScrollView, Alert, DeviceEventEmitter, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Search, Plus, Edit2, Trash2, Calendar, User, BookOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api, { API_BASE_URL } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../theme';
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

  useEffect(() => {
    loadData();

    const sub = DeviceEventEmitter.addListener('savoirUpdated', (event) => {
      if (event.action === 'create' && event.item) {
        setSavoirs(prev => [event.item, ...prev]);
      } else if (event.action === 'update' && event.item) {
        setSavoirs(prev => prev.map(s => s.id === event.item.id ? event.item : s));
      } else if (event.action === 'delete') {
        setSavoirs(prev => prev.filter(s => s.id !== event.id));
      }
    });

    return () => sub.remove();
  }, []);

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

  const executeDelete = async (id) => {
    try {
      setSavoirs(prev => prev.filter(s => s.id !== id));
      DeviceEventEmitter.emit('savoirUpdated', { action: 'delete', id });
      await api.deleteSavoir(id);
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'web') {
        window.alert("Impossible de supprimer le document.");
      } else {
        Alert.alert("Erreur", "Impossible de supprimer le document.");
      }
      loadData();
    }
  };

  const handleDelete = (id) => {
    if (Platform.OS === 'web') {
      if (window.confirm("Êtes-vous sûr de vouloir supprimer ce Savoir Citoyen ?")) {
        executeDelete(id);
      }
    } else {
      Alert.alert(
        "Supprimer",
        "Êtes-vous sûr de vouloir supprimer ce Savoir Citoyen ?",
        [
          { text: "Annuler", style: "cancel" },
          { 
            text: "Supprimer", 
            style: "destructive",
            onPress: () => executeDelete(id)
          }
        ]
      );
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
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.cardImage} />
          ) : (
            <LinearGradient colors={[COLORS.primaryLight, COLORS.primary]} style={[styles.cardImage, styles.cardImagePlaceholder]}>
              <BookOpen size={48} color={COLORS.white} opacity={0.8} />
            </LinearGradient>
          )}
          {/* Floating Badge */}
          <View style={styles.floatingBadge}>
            <Text style={styles.floatingBadgeText}>{item.categorie_nom || 'Général'}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.titre}</Text>
          
          <View style={styles.cardMetaRow}>
            <View style={styles.metaItem}>
              <Calendar color={COLORS.textLight} size={14} />
              <Text style={styles.cardDate}>
                {new Date(item.date).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <User color={COLORS.textLight} size={14} />
              <Text style={styles.cardAuthor} numberOfLines={1}>
                {item.auteur?.nom || 'Ministère'}
              </Text>
            </View>
          </View>

          {user?.role === 'MINISTERE' && (
            <View style={styles.actionRow}>
              <Pressable 
                style={[styles.actionBtn, { backgroundColor: COLORS.primaryLight + '20', borderColor: COLORS.primaryLight }]} 
                onPress={() => navigation.navigate('CreateSavoirAuthority', { savoir: item })}
              >
                <Edit2 color={COLORS.primary} size={16} />
                <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Modifier</Text>
              </Pressable>
              <Pressable 
                style={[styles.actionBtn, { backgroundColor: COLORS.error + '10', borderColor: COLORS.error + '40' }]} 
                onPress={() => handleDelete(item.id)}
              >
                <Trash2 color={COLORS.error} size={16} />
              </Pressable>
            </View>
          )}
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
          containerStyle={{ marginBottom: 0, ...SHADOWS.md, borderRadius: RADIUS.full, borderWidth: 0, backgroundColor: COLORS.surface }}
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
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
    zIndex: 10,
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
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    ...SHADOWS.md,
    gap: 6,
  },
  addBtnText: {
    ...FONTS.button,
    color: COLORS.white,
    fontSize: 14,
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
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  categoryPill: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.md,
    ...SHADOWS.sm,
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xl,
  },
  gridItem: {
    flex: 1,
    minWidth: 280,
    maxWidth: Platform.OS === 'web' ? 400 : '100%',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
    height: '100%',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16/9,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  floatingBadgeText: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: SPACING.lg,
    flex: 1,
  },
  cardTitle: {
    ...FONTS.h3,
    color: COLORS.dark,
    marginBottom: SPACING.md,
    lineHeight: 24,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardDate: {
    ...FONTS.caption,
    color: COLORS.textLight,
  },
  cardAuthor: {
    ...FONTS.caption,
    color: COLORS.textLight,
    flexShrink: 1,
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  actionBtnText: {
    ...FONTS.small,
    fontWeight: 'bold',
  },
});
