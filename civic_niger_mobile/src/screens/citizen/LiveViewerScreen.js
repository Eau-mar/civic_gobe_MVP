import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Image, Pressable, 
  ActivityIndicator, Alert 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, VideoOff, Users, MapPin, Eye } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../theme';
import api from '../../api/client';

export default function LiveViewerScreen({ route, navigation }) {
  const { signalementId } = route.params;
  const insets = useSafeAreaInsets();
  
  const [frameUrl, setFrameUrl] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [errorCount, setErrorCount] = useState(0);
  
  // Polling ref to clear on unmount
  const timerRef = useRef(null);

  useEffect(() => {
    fetchLatestFrame();
    
    // Poll every 1 second
    timerRef.current = setInterval(() => {
      fetchLatestFrame();
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchLatestFrame = async () => {
    try {
      const data = await api.getLatestFrame(signalementId);
      
      if (data.image) {
        setFrameUrl(data.image);
        setErrorCount(0); // Reset error count on success
      }
      
      if (data.is_live === false) {
        setIsLive(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch (e) {
      if (e.status === 404 && e.data?.is_live === false) {
        setIsLive(false);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setErrorCount(prev => prev + 1);
        // If 5 consecutive errors, maybe the live crashed or ended abruptly
        if (errorCount > 5) {
          setIsLive(false);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, SPACING.md) }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.white} size={28} />
        </Pressable>
        
        {isLive ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>EN DIRECT</Text>
          </View>
        ) : (
          <View style={[styles.liveBadge, { backgroundColor: COLORS.textSecondary }]}>
            <Text style={styles.liveText}>TERMINÉ</Text>
          </View>
        )}

        <View style={styles.spectatorBadge}>
          <Eye color={COLORS.white} size={16} style={{ marginRight: 6 }} />
          <Text style={styles.spectatorText}>Spectateur</Text>
        </View>
      </View>

      {/* Frame Container */}
      <View style={styles.videoContainer}>
        {!isLive && !frameUrl ? (
          <View style={styles.endedContainer}>
            <VideoOff color={COLORS.white} size={64} style={{ marginBottom: SPACING.md }} />
            <Text style={styles.endedTitle}>Ce direct est terminé</Text>
            <Text style={styles.endedSub}>L'auteur a coupé la transmission.</Text>
            
            <Pressable style={styles.returnBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.returnBtnText}>Retour à l'accueil</Text>
            </Pressable>
          </View>
        ) : frameUrl ? (
          <Image 
            source={{ uri: frameUrl }} 
            style={styles.frameImage}
            resizeMode="cover"
            fadeDuration={0} // Important pour éviter le scintillement à chaque seconde
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Connexion au direct en cours...</Text>
          </View>
        )}
      </View>
      
      {/* Overlay Status (Bottom) */}
      {isLive && frameUrl && (
        <View style={[styles.overlayBottom, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Caméra de sécurité citoyenne</Text>
            <Text style={styles.infoSub}>Actualisation en temps réel</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background for video viewer
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent header
  },
  backBtn: {
    padding: SPACING.xs,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    marginRight: 6,
  },
  liveText: {
    ...FONTS.small,
    color: COLORS.white,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  spectatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  spectatorText: {
    ...FONTS.small,
    color: COLORS.white,
    fontWeight: '600',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...FONTS.regular,
    color: COLORS.white,
    marginTop: SPACING.md,
  },
  endedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  endedTitle: {
    ...FONTS.h2,
    color: COLORS.white,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  endedSub: {
    ...FONTS.regular,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  returnBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  returnBtnText: {
    ...FONTS.small,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  infoBox: {
    backgroundColor: 'transparent',
  },
  infoTitle: {
    ...FONTS.h4,
    color: COLORS.white,
    marginBottom: 4,
  },
  infoSub: {
    ...FONTS.caption,
    color: COLORS.textLight,
  },
});
