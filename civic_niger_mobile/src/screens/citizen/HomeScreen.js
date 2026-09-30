import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Pressable, 
  RefreshControl, ActivityIndicator, TextInput, ScrollView, DeviceEventEmitter
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Bell, AlertTriangle, ArrowRight, Search, 
  MapPin, CircleCheckBig, Video, FileText 
} from 'lucide-react-native';

import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

// Feed Cards
import FeedLiveCard from '../../components/feed/FeedLiveCard';
import FeedReportCard from '../../components/feed/FeedReportCard';
import FeedPublicationCard from '../../components/feed/FeedPublicationCard';
import FeedVoixCard from '../../components/feed/FeedVoixCard';

const FILTERS = [
  { id: 'tout', label: 'Tout l\'actu' },
  { id: 'live', label: 'En direct' },
  { id: 'signalement', label: 'Signalements' },
  { id: 'voix', label: 'Voix du Peuple' },
  { id: 'publication', label: 'Publications' },
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Savoirs for Horizontal Scroll
  const [savoirsList, setSavoirsList] = useState([]);
  
  const [activeFilter, setActiveFilter] = useState('tout');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load feed when filter or search changes
  useEffect(() => {
    loadFeed(1, false);
  }, [activeFilter, debouncedSearch]);

  // Listen for optimistic UI updates from other screens
  useEffect(() => {
    const handleUpdate = (feedType) => (event) => {
      if (!event.item && event.action !== 'delete') return;
      
      const itemToUpdate = event.item ? { ...event.item, feedType } : null;

      if (event.action === 'create' && itemToUpdate) {
        setFeedData(prev => [itemToUpdate, ...prev]);
        if (feedType === 'publication') {
          setSavoirsList(prev => [itemToUpdate, ...prev].slice(0, 5));
        }
      } else if (event.action === 'update' && itemToUpdate) {
        setFeedData(prev => prev.map(p => p.id === itemToUpdate.id && p.feedType === feedType ? itemToUpdate : p));
        if (feedType === 'publication') {
          setSavoirsList(prev => prev.map(p => p.id === itemToUpdate.id ? itemToUpdate : p));
        }
      } else if (event.action === 'delete') {
        setFeedData(prev => prev.filter(p => !(p.id === event.id && p.feedType === feedType)));
        if (feedType === 'publication') {
          setSavoirsList(prev => prev.filter(p => p.id !== event.id));
        }
      }
    };

    const subPub = DeviceEventEmitter.addListener('publicationUpdated', handleUpdate('publication'));
    const subSav = DeviceEventEmitter.addListener('savoirUpdated', handleUpdate('publication'));
    const subVoix = DeviceEventEmitter.addListener('voixUpdated', handleUpdate('voix'));

    return () => {
      subPub.remove();
      subSav.remove();
      subVoix.remove();
    };
  }, []);

  const loadFeed = async (pageNumber = 1, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (pageNumber === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const response = await api.getFeedPaginated(pageNumber, activeFilter, debouncedSearch);
      
      const newItems = response.results || [];
      const nextPageUrl = response.next;

      if (pageNumber === 1) {
        setFeedData(newItems);
        // Extract publications for the horizontal carousel
        const savs = newItems.filter(i => i.feedType === 'publication').slice(0, 5);
        setSavoirsList(savs);
      } else {
        setFeedData(prev => [...prev, ...newItems]);
      }

      setHasMore(!!nextPageUrl);
      setPage(pageNumber);
    } catch (e) {
      console.log('Erreur chargement feed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && !loading && hasMore) {
      loadFeed(page + 1, false);
    }
  };

  const handleVote = async (voixId, choix) => {
    try {
      const response = await api.voteVoix(voixId, choix);
      // Optimistic update in feedData
      setFeedData(prevList => prevList.map(v => {
        if (v.id === voixId && v.feedType === 'voix') {
          let newPour = v.votes_pour;
          let newContre = v.votes_contre;
          
          if (v.user_vote === 'pour') newPour--;
          if (v.user_vote === 'contre') newContre--;
          
          if (choix === 'pour') newPour++;
          if (choix === 'contre') newContre++;
          
          return { ...v, user_vote: choix, votes_pour: newPour, votes_contre: newContre };
        }
        return v;
      }));
    } catch (e) {
      console.log('Erreur vote depuis home', e);
    }
  };

  // We no longer filter locally, the backend handles it.
  const filteredFeed = feedData;

  const renderFeedItem = ({ item }) => {
    if (item.feedType === 'live') {
      return (
        <View style={styles.feedCardWrapper}>
          <FeedLiveCard 
            item={item} 
            onPress={() => {
              if (item.utilisateur === user?.id || item.auteur?.id === user?.id) {
                navigation.navigate('Signaler', { 
                  screen: 'LiveStreaming', 
                  params: { signalementId: item.id, roomId: item.live_room_id } 
                });
              } else {
                navigation.navigate('Signaler', { 
                  screen: 'LiveViewer', 
                  params: { signalementId: item.id, roomId: item.live_room_id } 
                });
              }
            }} 
          />
        </View>
      );
    }
    if (item.feedType === 'signalement') {
      return (
        <View style={styles.feedCardWrapper}>
          <FeedReportCard 
            item={item} 
            onPress={() => navigation.navigate('Signaler', {
              screen: 'SignalementDetail',
              params: { signalement: item }
            })} 
          />
        </View>
      );
    }
    if (item.feedType === 'publication') {
      return (
        <View style={styles.feedCardWrapper}>
          <FeedPublicationCard 
            item={item} 
            onPress={() => navigation.navigate('Savoir', {
              screen: 'SavoirDetail',
              params: { savoir: item }
            })} 
          />
        </View>
      );
    }
    if (item.feedType === 'voix') {
      return (
        <View style={styles.feedCardWrapper}>
          <FeedVoixCard 
            item={item} 
            onPress={() => navigation.navigate('Voix', {
              screen: 'VoixDetail',
              params: { voix: item }
            })} 
            onVote={handleVote}
            onCommentPress={() => navigation.navigate('Voix', {
              screen: 'VoixDetail',
              params: { voix: item, focusComment: true }
            })}
          />
        </View>
      );
    }
    return null;
  };

  const ListHeader = () => (
    <View style={styles.listHeaderContainer}>
      <View style={styles.mainContent}>
        {/* Savoirs Citoyen Horizontal Scroll */}
        {savoirsList.length > 0 && (
          <View style={styles.savoirsContainer}>
            <Text style={styles.sectionTitle}>Savoir Citoyen</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={savoirsList}
              keyExtractor={item => 'sav_' + item.id}
              contentContainerStyle={styles.savoirsScroll}
              renderItem={({ item }) => (
                <Pressable style={styles.savoirHorizontalCard} onPress={() => navigation.navigate('Savoir', { screen: 'SavoirDetail', params: { savoir: item } })}>
                  <View style={styles.savoirIconBg}>
                    <FileText color={COLORS.primary} size={24} />
                  </View>
                  <Text style={styles.savoirHorizontalTitle} numberOfLines={2}>{item.titre}</Text>
                </Pressable>
              )}
            />
          </View>
        )}
      </View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyText}>Chargement du flux d'actualité...</Text>
        </>
      ) : (
        <>
          <FileText color={COLORS.textLight} size={48} />
          <Text style={[styles.emptyText, { marginTop: SPACING.md }]}>
            {searchQuery 
              ? 'Aucun résultat trouvé pour votre recherche.' 
              : 'Aucune actualité ne correspond à vos critères.'}
          </Text>
        </>
      )}
    </View>
  );

  const ListFooter = () => {
    if (!loadingMore) return <View style={{ height: 40 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* STICKY HEADER GROUP */}
      <View style={styles.stickyHeaderWrapper}>
        <LinearGradient
          colors={[COLORS.primaryGradientStart, COLORS.primaryGradientEnd]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.safeAreaHeader, { paddingTop: Math.max(insets.top, SPACING.lg) }]}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>Bonjour, {user?.prenom || 'Citoyen'}</Text>
                <Text style={styles.subtitle}>Fil d'actualité civique</Text>
              </View>
              <Pressable style={styles.notificationBtn}>
                <Bell color={COLORS.white} size={24} />
                <View style={styles.notificationBadge} />
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.floatingHeaderContent}>
          <View style={styles.searchContainer}>
            <Search color={COLORS.textLight} size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un signalement, article..."
              placeholderTextColor={COLORS.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
            style={styles.filtersScrollView}
          >
            {FILTERS.map((item) => {
              const isActive = activeFilter === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setActiveFilter(item.id)}
                >
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={filteredFeed}
        keyExtractor={(item, index) => item.id?.toString() + '_' + item.feedType + index}
        renderItem={renderFeedItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={[
          styles.flatlistContent,
          { paddingBottom: insets.bottom + SPACING.xxl + 80 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => loadFeed(1, true)} 
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
            progressViewOffset={150}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flatlistContent: {
    // base padding, dynamic padding is added inline
  },
  feedCardWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  listHeaderContainer: {
    marginBottom: SPACING.xl,
  },
  stickyHeaderWrapper: {
    zIndex: 10,
    backgroundColor: COLORS.background,
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  headerGradient: {
    paddingBottom: SPACING.xl * 1.5, // Extra padding for overlap
  },
  safeAreaHeader: {
    paddingHorizontal: SPACING.lg,
    // paddingTop is dynamic via insets
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  greeting: {
    ...FONTS.h2,
    color: COLORS.white,
    marginBottom: 4,
  },
  subtitle: {
    ...FONTS.small,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
  },
  floatingHeaderContent: {
    marginTop: -SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    height: 54,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  filtersScrollView: {
    paddingVertical: SPACING.xs,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    ...FONTS.regular,
    color: COLORS.dark,
    outlineStyle: 'none',
  },
  heroCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.xl,
    marginBottom: SPACING.lg,
  },
  heroIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  heroTextContainer: {
    marginBottom: SPACING.lg,
  },
  heroTitle: {
    ...FONTS.h2,
    color: COLORS.white,
    marginBottom: 8,
  },
  heroSubtitle: {
    ...FONTS.small,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  heroAction: {
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  heroActionText: {
    ...FONTS.button,
    color: COLORS.accentDark,
    fontSize: 14,
  },
  savoirsContainer: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.dark,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  savoirsScroll: {
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  savoirHorizontalCard: {
    width: 160,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  savoirIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  savoirHorizontalTitle: {
    ...FONTS.small,
    color: COLORS.dark,
    fontWeight: '600',
    lineHeight: 18,
  },
  filtersWrapper: {
    marginHorizontal: -SPACING.lg,
  },
  filtersScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    ...FONTS.small,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    minHeight: 200,
  },
  emptyText: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
