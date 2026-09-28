import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Text, Pressable, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api } from '../../api/client';
import { ChevronLeft, CameraReverse, StopCircle } from 'lucide-react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LiveStreamingScreen({ route, navigation }) {
  const { signalementId } = route.params;
  const [hasPermissions, setHasPermissions] = useState(false);
  
  // Camera state
  const [type, setType] = useState('back');
  const cameraRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  
  // GPS state
  const [coords, setCoords] = useState(null);
  const locationSubscription = useRef(null);
  
  // Timer state
  const [duration, setDuration] = useState(0);
  const timerInterval = useRef(null);
  const uploadInterval = useRef(null);
  
  // Fix closure issue with refs
  const coordsRef = useRef(coords);
  const isUploadingRef = useRef(false);

  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  const captureAndUpload = async () => {
    if (!cameraRef.current || !isCameraReady || isUploadingRef.current) return;
    
    try {
      isUploadingRef.current = true;
      // Capture frame
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3, // Compression modérée pour éviter les Network Timeout
        base64: true, // EXTREMEMENT IMPORTANT: on envoie en Base64 via JSON
      });

      // Upload with latest coords
      let lat = null;
      let lon = null;
      if (coordsRef.current) {
        lat = parseFloat(coordsRef.current.latitude.toFixed(6));
        lon = parseFloat(coordsRef.current.longitude.toFixed(6));
      }

      await api.uploadFrame(signalementId, photo.base64, lat, lon);
      console.log(`[LIVE FRAME UPLOADED] ${lat}, ${lon}`);

    } catch (err) {
      console.log('[LIVE FRAME ERROR]', err);
    } finally {
      isUploadingRef.current = false;
    }
  };

  const captureRef = useRef(captureAndUpload);
  useEffect(() => {
    captureRef.current = captureAndUpload;
  });

  useEffect(() => {
    (async () => {
      try {
        const locationStatus = await Location.requestForegroundPermissionsAsync();
        let camStatus = cameraPermission?.status;
        if (camStatus !== 'granted') {
          const res = await requestCameraPermission();
          camStatus = res.status;
        }

        if (camStatus !== 'granted') {
          Alert.alert('Permission requise', 'La caméra est nécessaire pour le Live.');
          navigation.goBack();
          return;
        }

        if (locationStatus.status !== 'granted') {
          Alert.alert('Permission requise', 'La localisation est nécessaire.');
          navigation.goBack();
          return;
        }

        setHasPermissions(true);

        // Timer
        timerInterval.current = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);

        // GPS Tracking
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000,
            distanceInterval: 10,
          },
          (location) => {
            if (location && location.coords) {
              setCoords({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
              });
            }
          }
        );

        // Upload Loop (Every 3 seconds)
        uploadInterval.current = setInterval(() => {
          if (captureRef.current) {
            captureRef.current();
          }
        }, 3000);

      } catch (e) {
        console.warn("Erreur d'initialisation:", e);
      }
    })();

    return () => {
      if (locationSubscription.current) locationSubscription.current.remove();
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (uploadInterval.current) clearInterval(uploadInterval.current);
    };
  }, [signalementId, cameraPermission]);

  const stopLive = async () => {
    try {
      if (uploadInterval.current) clearInterval(uploadInterval.current);
      await api.endLive(signalementId);
      Alert.alert('Live terminé', 'La transmission a été arrêtée avec succès.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de clôturer le live correctement.');
      navigation.goBack();
    }
  };

  const toggleCameraType = () => {
    setType(current => (current === 'back' ? 'front' : 'back'));
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!hasPermissions) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.error} />
        <Text style={styles.loadingText}>Initialisation de la caméra...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Overlay */}
      <View style={styles.header}>
        <View style={styles.liveIndicator}>
          <View style={styles.redDot} />
          <Text style={styles.headerTitle}>EN DIRECT {formatTime(duration)}</Text>
        </View>
        <Pressable onPress={stopLive} style={styles.stopBtn}>
          <Text style={styles.stopBtnText}>ARRÊTER</Text>
        </Pressable>
      </View>

      {/* Caméra Plein Écran */}
      <CameraView 
        style={styles.camera} 
        facing={type}
        ref={cameraRef}
        onCameraReady={() => setIsCameraReady(true)}
      />
        
      {/* Contrôles Footer Overlay (Sibling de CameraView pour respecter Expo SDK 51) */}
      <View style={styles.footer}>
          
          <View style={styles.gpsInfo}>
            <Text style={styles.gpsText}>
              {coords ? `📍 ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` : 'Recherche GPS...'}
            </Text>
            {/* Warning pour expliquer le bruit en dev */}
            <Text style={{color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4, textAlign: 'center'}}>
              Note: Sur l'appli de test Expo, le bruit de l'appareil photo est normal.
            </Text>
          </View>

          <View style={styles.controlsRow}>
            <Pressable onPress={toggleCameraType} style={styles.controlBtn}>
              <Text style={{fontSize: 24, color: 'white'}}>🔄</Text>
            </Pressable>
            
            <Pressable onPress={stopLive} style={styles.mainActionBtn}>
              <View style={styles.mainActionInner} />
            </Pressable>

            <View style={{width: 60}} />
          </View>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: COLORS.white,
    marginTop: 10,
    ...FONTS.body,
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    marginRight: 6,
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stopBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stopBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingTop: 20,
    paddingHorizontal: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  gpsInfo: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  gpsText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainActionBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainActionInner: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.error,
    borderRadius: 4, // Carré pour indiquer "STOP"
  }
});
