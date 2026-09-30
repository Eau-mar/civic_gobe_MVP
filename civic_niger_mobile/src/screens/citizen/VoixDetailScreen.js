import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, 
  Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Play, Pause, ChevronLeft, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../api/client';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

export default function VoixDetailScreen({ route, navigation }) {
  const [voix, setVoix] = useState(route.params.voix);
  const insets = useSafeAreaInsets();
  const [commentaires, setCommentaires] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  const player = useAudioPlayer(voix.audio || null);

  const playAudio = () => {
    try {
      if (player) {
        if (player.playing) {
          player.pause();
        } else {
          player.play();
        }
      }
    } catch (err) {
      console.log('Erreur lecture audio', err);
    }
  };

  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (player?.playing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [player?.playing]);

  useEffect(() => {
    loadCommentaires();
    if (route.params?.focusComment) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }
  }, []);

  const loadCommentaires = async () => {
    try {
      const data = await api.getCommentaires(voix.id);
      setCommentaires(data);
    } catch (e) {
      console.log('Erreur commentaires', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
      setSubmitting(true);
      await api.addCommentaire(voix.id, newComment);
      setNewComment('');
      loadCommentaires();
    } catch (e) {
      console.log('Erreur ajout commentaire', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (choix) => {
    try {
      await api.voteVoix(voix.id, choix);
      // Optimistic local update
      setVoix(prev => {
        let newPour = prev.votes_pour;
        let newContre = prev.votes_contre;
        
        if (prev.user_vote === choix) return prev; // already voted this
        
        if (choix === 'pour') {
          newPour += 1;
          if (prev.user_vote === 'contre') newContre -= 1;
        } else if (choix === 'contre') {
          newContre += 1;
          if (prev.user_vote === 'pour') newPour -= 1;
        }

        return {
          ...prev,
          user_vote: choix,
          votes_pour: newPour,
          votes_contre: newContre,
        };
      });
    } catch (err) {
      console.log('Erreur vote', err);
    }
  };

  const renderComment = ({ item }) => (
    <View style={[
      styles.commentCard, 
      item.is_official_reply && styles.officialCommentCard
    ]}>
      <View style={styles.commentHeader}>
        <Text style={[
          styles.commentAuthor, 
          item.is_official_reply && styles.officialText
        ]}>
          {item.is_official_reply ? '🏛️ Réponse Officielle' : item.auteur?.nom}
        </Text>
        <Text style={styles.commentDate}>
          {new Date(item.date).toLocaleDateString('fr-FR')}
        </Text>
      </View>
      <Text style={styles.commentContent}>{item.contenu}</Text>
    </View>
  );

  const header = () => (
    <View style={styles.voixContainer}>
      <Text style={styles.title}>{voix.titre}</Text>
      <Text style={styles.author}>Par {voix.auteur?.nom} le {new Date(voix.date).toLocaleDateString('fr-FR')}</Text>
      <Text style={styles.content}>{voix.contenu}</Text>

      {voix.audio ? (
        <View style={styles.audioContainer}>
          <Pressable style={styles.playBtn} onPress={playAudio}>
            {player?.playing ? (
              <Pause color={COLORS.white} size={24} />
            ) : (
              <Play color={COLORS.white} size={24} style={{ marginLeft: 4 }} />
            )}
          </Pressable>
          <View style={styles.audioWaveform}>
            <Animated.View style={[styles.barsContainer, { opacity: pulseAnim }]}>
              {[14, 28, 20, 35, 18, 24, 12, 16, 28, 20].map((height, idx) => (
                <View key={idx} style={[styles.waveBar, { height: player?.playing ? height : 4 }]} />
              ))}
            </Animated.View>
            <Text style={styles.audioLabel}>
              {player?.playing ? 'Lecture en cours...' : 'Écouter le vocal'}
            </Text>
          </View>
        </View>
      ) : null}
      
      <View style={styles.actions}>
        <Pressable 
          style={[styles.actionItem, voix.user_vote === 'pour' && styles.actionItemActive]}
          onPress={() => handleVote('pour')}
        >
          <ThumbsUp color={voix.user_vote === 'pour' ? COLORS.primary : COLORS.textSecondary} size={20} />
          <Text style={[styles.actionText, voix.user_vote === 'pour' && { color: COLORS.primary }]}>
            {voix.votes_pour || 0} Pour
          </Text>
        </Pressable>
        
        <Pressable 
          style={[styles.actionItem, voix.user_vote === 'contre' && styles.actionItemActiveContre]}
          onPress={() => handleVote('contre')}
        >
          <ThumbsDown color={voix.user_vote === 'contre' ? COLORS.error : COLORS.textSecondary} size={20} />
          <Text style={[styles.actionText, voix.user_vote === 'contre' && { color: COLORS.error }]}>
            {voix.votes_contre || 0} Contre
          </Text>
        </Pressable>
      </View>
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Commentaires ({commentaires.length})</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: 0 }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScreenHeader
        title="Détail de la Voix"
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={commentaires}
          keyExtractor={item => item.id.toString()}
          renderItem={renderComment}
          ListHeaderComponent={header}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Soyez le premier à commenter !</Text>
          }
        />
      )}

      {/* Input Zone */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Votre commentaire..."
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <Pressable 
          style={[styles.sendBtn, !newComment.trim() && {opacity: 0.5}]} 
          onPress={handlePostComment}
          disabled={!newComment.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Ionicons name="send" size={20} color={COLORS.white} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    padding: SPACING.xs,
    marginRight: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  topBarTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  voixContainer: {
    marginBottom: SPACING.lg,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  author: {
    ...FONTS.caption,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  content: {
    ...FONTS.regular,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  audioContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  audioWaveform: {
    flex: 1,
    justifyContent: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    gap: 4,
    marginBottom: 4,
  },
  waveBar: {
    width: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    opacity: 0.8,
  },
  audioLabel: {
    ...FONTS.small,
    color: COLORS.textLight,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionItemActive: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  actionItemActiveContre: {
    backgroundColor: COLORS.error + '15',
    borderColor: COLORS.error,
  },
  actionText: {
    ...FONTS.medium,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  commentCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  officialCommentCard: {
    borderColor: '#ffd700', // Gold border
    backgroundColor: '#fffdf0',
    borderWidth: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  commentAuthor: {
    ...FONTS.small,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  officialText: {
    color: '#b8860b',
  },
  commentDate: {
    ...FONTS.caption,
    color: COLORS.textLight,
  },
  commentContent: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginTop: SPACING.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 40,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
});
