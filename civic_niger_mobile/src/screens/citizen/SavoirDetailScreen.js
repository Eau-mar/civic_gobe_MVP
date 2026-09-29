import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  Pressable, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { API_BASE_URL } from '../../api/client';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

export default function SavoirDetailScreen({ route, navigation }) {
  const { savoir } = route.params;

  const audioUrl = savoir.audio
    ? (savoir.audio.startsWith('http')
      ? savoir.audio.replace(/http:\/\/(127\.0\.0\.1|localhost):\d+/, API_BASE_URL.replace('/api/v1', ''))
      : `${API_BASE_URL.replace('/api/v1', '')}${savoir.audio}`)
    : null;

  const player = useAudioPlayer(audioUrl);

  const toggleAudio = () => {
    if (!player) return;
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const imageUrl = savoir.image
    ? (savoir.image.startsWith('http')
      ? savoir.image.replace(/http:\/\/(127\.0\.0\.1|localhost):\d+/, API_BASE_URL.replace('/api/v1', ''))
      : `${API_BASE_URL.replace('/api/v1', '')}${savoir.image}`)
    : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: SPACING.xxl }}>
        {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="book" size={60} color={COLORS.primary} />
        </View>
      )}

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.category}>{savoir.categorie_nom || 'Savoir Citoyen'}</Text>
          <Text style={styles.date}>{new Date(savoir.date).toLocaleDateString('fr-FR')}</Text>
        </View>

        <Text style={styles.title}>{savoir.titre}</Text>
        <Text style={styles.author}>Rédigé par {savoir.auteur?.nom || 'Ministère'}</Text>

        {savoir.audio && (
          <View style={styles.audioPlayer}>
            <Pressable style={styles.playButton} onPress={toggleAudio}>
              <Ionicons name={player?.playing ? "pause" : "play"} size={24} color={COLORS.white} style={!player?.playing ? {marginLeft: 3} : {}} />
            </Pressable>
            <View style={styles.audioInfo}>
              <Text style={styles.audioTitle}>Écouter l'article</Text>
              <Text style={styles.audioSub}>{player?.playing ? 'Lecture en cours...' : 'Appuyez pour lire'}</Text>
            </View>
            <Ionicons name="volume-high-outline" size={24} color={COLORS.textLight} />
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.body}>{savoir.contenu}</Text>
      </View>
    </ScrollView>
    <ScreenHeader 
      onBack={() => navigation.goBack()} 
      transparent 
      style={styles.absoluteHeader}
    />
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  absoluteHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  image: {
    width: '100%',
    height: 400,
    backgroundColor: '#eee',
  },
  imagePlaceholder: {
    width: '100%',
    height: 400,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    marginTop: -40,
    minHeight: 500,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  category: {
    ...FONTS.small,
    color: COLORS.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  date: {
    ...FONTS.caption,
    color: COLORS.textLight,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  author: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: SPACING.lg,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    ...FONTS.small,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  audioSub: {
    ...FONTS.caption,
    color: COLORS.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  body: {
    ...FONTS.regular,
    color: COLORS.text,
    lineHeight: 24,
  }
});
