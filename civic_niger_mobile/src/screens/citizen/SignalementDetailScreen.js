import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, Pressable, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Map, Play, Pause, AlertTriangle } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAudioPlayer } from 'expo-audio';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

export default function SignalementDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { signalement } = route.params;

  const player = useAudioPlayer(signalement.audio || null);

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
      Alert.alert('Erreur', 'Impossible de lire le fichier audio.');
    }
  };

  return (
    <View style={[styles.container]}>
      
      {/* HEADER */}
      <ScreenHeader
        title="Détail du Signalement"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Title & Info */}
        <View style={styles.infoCard}>
          <View style={styles.categoryBadge}>
            <AlertTriangle size={14} color={COLORS.accent} />
            <Text style={styles.categoryText}>{signalement.categorie}</Text>
          </View>
          <Text style={styles.title}>{signalement.titre}</Text>
          <Text style={styles.date}>
            Publié le {new Date(signalement.date).toLocaleDateString('fr-FR')} 
            {' par '}{signalement.auteur_nom || 'Anonyme'}
          </Text>
          
          <Text style={styles.description}>{signalement.description}</Text>
        </View>

        {/* IMAGE */}
        {signalement.image ? (
          <View style={styles.mediaContainer}>
            <Image 
              source={{ uri: signalement.image }} 
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        ) : null}

        {/* AUDIO PLAYER */}
        {signalement.audio ? (
          <View style={styles.audioContainer}>
            <Text style={styles.audioLabel}>Message vocal attaché</Text>
            <Pressable style={styles.playBtn} onPress={playAudio}>
              {player?.playing ? (
                <Pause color={COLORS.white} size={24} />
              ) : (
                <Play color={COLORS.white} size={24} style={{ marginLeft: 4 }} />
              )}
            </Pressable>
          </View>
        ) : null}

        {/* MAP & LOCATION */}
        {(signalement.latitude && signalement.longitude) ? (
          <View style={styles.mapContainer}>
            <View style={styles.mapHeader}>
              <MapPin color={COLORS.textSecondary} size={16} />
              <Text style={styles.mapTitle}>
                {signalement.localisation || "Localisation GPS"}
              </Text>
            </View>
            <View style={styles.mapWrapper}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: parseFloat(signalement.latitude),
                  longitude: parseFloat(signalement.longitude),
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
              >
                <Marker 
                  coordinate={{
                    latitude: parseFloat(signalement.latitude),
                    longitude: parseFloat(signalement.longitude)
                  }}
                  pinColor={COLORS.error}
                />
              </MapView>
            </View>
          </View>
        ) : null}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl * 2,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
    marginBottom: SPACING.lg,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },
  categoryText: {
    ...FONTS.caption,
    color: COLORS.accent,
    fontWeight: 'bold',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  title: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  date: {
    ...FONTS.caption,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  description: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  mediaContainer: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  image: {
    width: '100%',
    height: 250,
  },
  audioContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  audioLabel: {
    ...FONTS.regular,
    color: COLORS.text,
    fontWeight: '600',
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  mapTitle: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  mapWrapper: {
    height: 200,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});
