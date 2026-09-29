import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, Text, StyleSheet, FlatList, Pressable, 
  ActivityIndicator, RefreshControl 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client';
import { COLORS, SPACING, FONTS, RADIUS } from '../../theme';
import FeedVoixCard from '../../components/feed/FeedVoixCard';
import EmptyState from '../../components/EmptyState';

export default function VoixFeedScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  const [voixList, setVoixList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('recent'); // 'recent' | 'tendance'

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (!voixList.length) setLoading(true);

    try {
      const data = await api.getVoix();
      setVoixList(data);
    } catch (e) {
      console.log('Erreur chargement voix:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleVote = async (voixId, choix) => {
    try {
      const response = await api.voteVoix(voixId, choix);
      // Optimistic update
      setVoixList(prevList => prevList.map(v => {
        if (v.id === voixId) {
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
      console.log('Erreur vote', e);
    }
  };

  const displayedList = [...voixList].sort((a, b) => {
    if (filter === 'tendance') {
      return b.votes_pour - a.votes_pour;
    }
    return new Date(b.date) - new Date(a.date);
  });

  const renderItem = ({ item }) => {
    return (
      <FeedVoixCard
        item={item}
        onPress={() => navigation.navigate('VoixDetail', { voix: item })}
        onVote={(id, choix) => handleVote(id, choix)}
        onCommentPress={() => navigation.navigate('VoixDetail', { voix: item, focusComment: true })}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Filters */}
      <View style={styles.filterContainer}>
        <Pressable 
          style={[styles.filterBtn, filter === 'recent' && styles.filterBtnActive]}
          onPress={() => setFilter('recent')}
        >
          <Text style={[styles.filterText, filter === 'recent' && styles.filterTextActive]}>Plus Récents</Text>
        </Pressable>
        <Pressable 
          style={[styles.filterBtn, filter === 'tendance' && styles.filterBtnActive]}
          onPress={() => setFilter('tendance')}
        >
          <Text style={[styles.filterText, filter === 'tendance' && styles.filterTextActive]}>🔥 Tendances</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={displayedList}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
          }
          ListEmptyComponent={
            <EmptyState 
              title="Aucune Voix du Peuple" 
              description="Soyez le premier à proposer une idée pour améliorer votre communauté !" 
            />
          }
        />
      )}

      {/* FAB to create new Voix */}
      <Pressable 
        style={[styles.fab, { bottom: 80 + insets.bottom }]}
        onPress={() => navigation.navigate('VoixCreate')}
      >
        <Ionicons name="add" size={30} color={COLORS.white} />
      </Pressable>
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
    padding: SPACING.xl,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary + '20',
  },
  filterText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: COLORS.primary,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100, // For FAB
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  authorName: {
    ...FONTS.small,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  date: {
    ...FONTS.caption,
    color: COLORS.textLight,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4757',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendingText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  content: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  petitionContainer: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  petitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  petitionText: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
  },
  actionBtnActivePour: {
    backgroundColor: COLORS.primary,
  },
  actionBtnActiveContre: {
    backgroundColor: COLORS.error,
  },
  actionText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
