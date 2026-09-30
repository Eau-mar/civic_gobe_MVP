import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, Switch, Pressable, Alert, Platform, ActivityIndicator,
  Animated, Modal, Linking, KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { 
  MapPin, AlertTriangle, ShieldAlert, 
  EyeOff, Eye, Send, ChevronLeft, Map, CircleCheckBig,
  Video, Droplet, Navigation, Lightbulb, HeartPulse, Shield, FileText,
  Camera, Mic, Trash2, Play, Pause, Square
} from 'lucide-react-native';

import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Button from '../../components/Button';
import Dropdown from '../../components/Dropdown';
import Input from '../../components/Input';
import ScreenHeader from '../../components/ScreenHeader';

const THEME = {
  accent: '#E76F00',
  live: '#EF4444',
  borderSoft: 'rgba(0, 0, 0, 0.05)',
};

const CATEGORIES = [
  { value: 'eau',       label: 'Eau potable', icon: Droplet },
  { value: 'route',     label: 'Voirie',      icon: Navigation },
  { value: 'eclairage', label: 'Éclairage',   icon: Lightbulb },
  { value: 'sante',     label: 'Santé',       icon: HeartPulse },
  { value: 'securite',  label: 'Sécurité',    icon: Shield },
  { value: 'autre',     label: 'Autre',       icon: FileText },
];

export default function SignalementScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Form state standard
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState('autre');
  const [selectedMinistere, setSelectedMinistere] = useState(null);
  const [estPublic, setEstPublic] = useState(true);
  const [localisation, setLocalisation] = useState('');

  // Media
  const [imageUri, setImageUri] = useState(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [audioUri, setAudioUri] = useState(null);
  const audioPlayer = useAudioPlayer(audioUri || null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isRecordingState, setIsRecordingState] = useState(false);

  // Live Modal State
  const [liveModalVisible, setLiveModalVisible] = useState(false);
  const [liveTitre, setLiveTitre] = useState('URGENCE');
  const [liveMinistere, setLiveMinistere] = useState(null);
  const [livePublic, setLivePublic] = useState(true);

  // GPS
  const [coords, setCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Ministères list (for Dropdown)
  const [ministereOptions, setMinistereOptions] = useState([]);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadMinisteres();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Timer for recording duration
  useEffect(() => {
    let interval;
    if (isRecordingState) {
      interval = setInterval(() => {
        setAudioDuration(prev => prev + 1);
      }, 1000);
    } else {
      setAudioDuration(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecordingState]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const toggleRecording = async () => {
    try {
      if (isRecordingState) {
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        setAudioUri(uri);
        setIsRecordingState(false);
      } else {
        const { status } = await requestRecordingPermissionsAsync();
        if (status !== 'granted') {
          alert("La permission d'accéder au microphone est requise.");
          return;
        }

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
        
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
        setAudioUri(null);
        setIsRecordingState(true);
      }
    } catch (err) {
      console.error('Erreur enregistrement vocal:', err);
    }
  };

  const loadMinisteres = async () => {
    try {
      const data = await api.getMinisteres();
      if (Array.isArray(data)) {
        // Format for Dropdown component
        const options = [
          { label: 'Tous / Ne sais pas', value: null },
          ...data.map(m => ({ label: m.nom, value: m.id }))
        ];
        setMinistereOptions(options);
      }
    } catch (e) {
      // Fail silently
    }
  };

  const handleGetLocation = useCallback(async () => {
    setGpsLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès à la position GPS est nécessaire.');
        setGpsLoading(false);
        return;
      }
      
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });
    } catch (err) {
      console.log('Erreur GPS:', err);
      Alert.alert('Erreur', 'Impossible d\'obtenir la position GPS.');
    } finally {
      setGpsLoading(false);
    }
  }, []);

  const handleSubmit = async (isLive = false) => {
    let finalTitre = titre;
    let finalMin = selectedMinistere;
    let finalPub = estPublic;

    if (isLive) {
      if (!coords) {
        Alert.alert('Action requise', 'La position GPS est obligatoire pour lancer un direct.');
        return;
      }
      finalTitre = liveTitre.trim() || 'URGENCE';
      finalMin = liveMinistere;
      finalPub = livePublic;
    } else {
      if (!titre.trim()) {
        Alert.alert('Champs requis', 'Veuillez au moins donner un titre au signalement.');
        return;
      }
      if (!description.trim() && !imageUri && !audioUri) {
        Alert.alert('Champs requis', 'Veuillez fournir au moins une description, une photo ou un vocal.');
        return;
      }
    }

    setSubmitting(true);
    try {
      // Générer une salle Jitsi unique si c'est un live
      const roomId = isLive ? `civicniger_live_${Date.now()}_${Math.floor(Math.random() * 1000)}` : null;

      const formData = new FormData();
      formData.append('titre', finalTitre);
      formData.append('description', isLive ? 'Signalement vidéo en direct' : description.trim());
      formData.append('categorie', isLive ? 'securite' : categorie);
      if (localisation.trim()) formData.append('localisation', localisation.trim());
      if (coords?.latitude) formData.append('latitude', coords.latitude.toFixed(6).toString());
      if (coords?.longitude) formData.append('longitude', coords.longitude.toFixed(6).toString());
      formData.append('est_public', finalPub.toString());
      formData.append('is_live', isLive.toString());
      if (finalMin) formData.append('ministere', finalMin.toString());
      if (roomId) formData.append('live_room_id', roomId.toString());

      if (imageUri) {
        const filename = imageUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : 'jpg';
        const type = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
        
        let formattedUri = imageUri;
        if (Platform.OS === 'android' && !imageUri.startsWith('file://') && !imageUri.startsWith('content://')) {
          formattedUri = `file://${imageUri}`;
        }

        formData.append('image', { 
          uri: formattedUri,
          name: filename, 
          type 
        });
      }

      if (audioUri) {
        const filename = audioUri.split('/').pop() || 'audio.m4a';
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : 'm4a';
        const type = `audio/${ext}`;
        
        let formattedUri = audioUri;
        if (Platform.OS === 'android' && !audioUri.startsWith('file://') && !audioUri.startsWith('content://')) {
          formattedUri = `file://${audioUri}`;
        }

        formData.append('audio', { 
          uri: formattedUri,
          name: filename, 
          type 
        });
      }
      
      const response = await api.createSignalement(formData);
      
      if (isLive && roomId) {
        setLiveModalVisible(false);
        navigation.navigate('LiveStreaming', {
          signalementId: response.id,
          roomId: roomId
        });
      } else {
        setLiveModalVisible(false);
        setSuccess(true);
      }
    } catch (err) {
      console.log("Submit error:", err);
      const errorMessage = err?.data ? JSON.stringify(err.data) : (err?.message || 'Impossible d\'envoyer le signalement.');
      Alert.alert('Erreur', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    const isLiveSuccess = typeof success === 'object' && success !== null; 
    
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <View style={styles.successContainer}>
          {isLiveSuccess ? (
            <Video size={80} color={COLORS.error} style={styles.successIcon} />
          ) : (
            <CircleCheckBig size={80} color={COLORS.success} style={styles.successIcon} />
          )}
          
          <Text style={styles.successTitle}>
            {isLiveSuccess ? "Direct Initialisé !" : "Incident Signalé !"}
          </Text>
          <Text style={styles.successText}>
            {isLiveSuccess 
              ? "Votre alerte a été transmise. Entrez maintenant dans la caméra pour diffuser aux autorités."
              : `Votre alerte a été transmise avec succès aux autorités compétentes.\nMerci pour votre engagement citoyen.`}
          </Text>
          
          {isLiveSuccess && (
            <Button
              title="ENTRER DANS LA CAMÉRA"
              onPress={() => {
                navigation.navigate('LiveStreaming', {
                  signalementId: success.signalementId,
                  roomId: success.roomId
                });
              }}
              style={[styles.successBtnPrimary, { backgroundColor: COLORS.error, marginBottom: SPACING.md }]}
            />
          )}

          <Button
            title="Nouveau signalement"
            onPress={() => {
              setSuccess(false);
              setTitre(''); setDescription(''); setCoords(null); setLocalisation('');
            }}
            style={styles.successBtnPrimary}
          />
          <Button
            title="Retourner à l'accueil"
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={styles.successBtnGhost}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.safeArea, { flex: 1 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title="Déclarer un Incident"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
          
          {/* TOP BANNER : BOUTON LIVE (LA STAR) */}
          <Pressable
            style={({ pressed, hovered }) => [
              styles.liveButtonTop,
              pressed && styles.liveButtonPressed,
              hovered && styles.liveButtonHover,
            ]}
            onPress={() => setLiveModalVisible(true)}
          >
            <View style={styles.livePulse} />
            <Video color={COLORS.white} size={28} style={{ marginRight: 12 }} />
            <View>
              <Text style={styles.liveButtonText}>LANCER UN DIRECT</Text>
              <Text style={styles.liveButtonSub}>Alerter les autorités immédiatement</Text>
            </View>
          </Pressable>

          <Text style={styles.actionSeparator}>— SIGNALEMENT STANDARD —</Text>

          {/* SECTION 1: DÉTAILS DE L'INCIDENT */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle color={THEME.accent} size={20} />
              <Text style={styles.sectionTitle}>Détails de l'incident</Text>
            </View>
            
            <Input
              label="Titre descriptif *"
              value={titre}
              onChangeText={setTitre}
              placeholder="Ex: Inondation majeure sur l'avenue..."
              hint="Un titre clair permet un traitement plus rapide."
            />

            <Input
              label="Description précise (ou média)"
              value={description}
              onChangeText={setDescription}
              placeholder="Que se passe-t-il exactement ?"
              multiline
              inputStyle={styles.textArea}
              hint="Où, quand, comment et qui est impliqué ?"
            />

            {/* MEDIA BUTTONS */}
            <View style={styles.mediaRow}>
              {!imageUri ? (
                <Pressable style={styles.modernUploadBtn} onPress={handlePickImage}>
                  <View style={styles.modernUploadIconBg}>
                    <Camera color={COLORS.primary} size={24} />
                  </View>
                  <Text style={styles.modernUploadText}>Ajouter une Photo</Text>
                  <Text style={styles.modernUploadSubtext}>Obligatoire pour les interventions</Text>
                </Pressable>
              ) : (
                <View style={styles.mediaSelectedCard}>
                  <Camera color={COLORS.primary} size={24} />
                  <Text style={styles.mediaSelectedText} numberOfLines={1}>Photo sélectionnée prête</Text>
                  <Pressable onPress={() => setImageUri(null)} style={styles.deleteAudioBtn}>
                    <Trash2 color={COLORS.error} size={20} />
                  </Pressable>
                </View>
              )}

              {!audioUri ? (
                <View style={[styles.recordingContainer, isRecordingState && styles.recordingContainerActive]}>
                  {isRecordingState && (
                    <View style={styles.recordingIndicator}>
                      <View style={styles.redDot} />
                      <Text style={styles.recordingTimer}>{formatTime(audioDuration)}</Text>
                    </View>
                  )}
                  <Pressable 
                    style={[styles.recordBtn, isRecordingState && styles.stopBtn]} 
                    onPress={toggleRecording}
                  >
                    {isRecordingState ? (
                      <>
                        <Square color={COLORS.white} size={20} fill={COLORS.white} />
                        <Text style={[styles.recordBtnTextActive, { marginLeft: 8 }]}>
                          Arrêter
                        </Text>
                      </>
                    ) : (
                      <>
                        <Mic color={COLORS.white} size={20} />
                        <Text style={[styles.recordBtnText, { marginLeft: 8 }]}>
                          Message Vocal
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              ) : (
                <View style={styles.audioPlayerContainer}>
                  <Pressable 
                    onPress={() => audioPlayer?.playing ? audioPlayer.pause() : audioPlayer?.play()}
                    style={styles.playPauseBtn}
                  >
                    {audioPlayer?.playing ? (
                      <Pause color={COLORS.white} size={20} />
                    ) : (
                      <Play color={COLORS.white} size={20} style={{ marginLeft: 2 }} />
                    )}
                  </Pressable>
                  
                  <View style={styles.audioWaveform}>
                    <View style={styles.waveformLine} />
                    <Text style={styles.playerStatusText}>
                      {audioPlayer?.playing ? 'Lecture...' : 'Vocal prêt'}
                    </Text>
                  </View>

                  <Pressable onPress={() => setAudioUri(null)} style={styles.deleteAudioBtn}>
                    <Trash2 color={COLORS.error} size={20} />
                  </Pressable>
                </View>
              )}
            </View>

            {/* Scroll Horizontal des Catégories */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Catégorie</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {CATEGORIES.map((cat) => {
                  const isActive = categorie === cat.value;
                  const Icon = cat.icon;
                  return (
                    <Pressable
                      key={cat.value}
                      onPress={() => setCategorie(cat.value)}
                      style={[styles.catChip, isActive && styles.catChipActive]}
                    >
                      <Icon color={isActive ? THEME.accent : COLORS.textSecondary} size={18} style={styles.catIcon} />
                      <Text style={[styles.catLabel, isActive && styles.catLabelActive]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* SECTION 2: GÉOLOCALISATION */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin color={THEME.accent} size={20} />
              <Text style={styles.sectionTitle}>Localisation</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Indication du lieu (optionnel)</Text>
              <TextInput
                style={styles.input}
                value={localisation}
                onChangeText={setLocalisation}
                placeholder="Près du rond-point..."
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <Pressable
              onPress={handleGetLocation}
              disabled={gpsLoading}
              style={[styles.gpsCard, coords && styles.gpsCardActive]}
            >
              <View style={styles.gpsCardContent}>
                <View style={[styles.gpsIconBox, coords && styles.gpsIconBoxActive]}>
                  {gpsLoading ? (
                    <ActivityIndicator size="small" color={THEME.accent} />
                  ) : (
                    <Map color={coords ? COLORS.success : THEME.accent} size={24} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gpsCardTitle, coords && { color: COLORS.success }]}>
                    {coords ? 'Position capturée' : 'Détecter ma position GPS'}
                  </Text>
                  <Text style={styles.gpsCardSub}>
                    {coords 
                      ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
                      : 'Permet une intervention rapide des autorités'}
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>

          {/* SECTION 3: RESPONSABILITÉ & CONFIDENTIALITÉ */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ShieldAlert color={COLORS.primaryDark} size={20} />
              <Text style={styles.sectionTitle}>Destinataires & Confidentialité</Text>
            </View>

            <Dropdown
              label="Ministère concerné"
              options={ministereOptions}
              selectedValue={selectedMinistere}
              onValueChange={setSelectedMinistere}
              placeholder="Sélectionner le ministère cible"
            />

            <View style={styles.privacyCard}>
              <View style={styles.privacyIcon}>
                {estPublic ? <Eye color={COLORS.primary} size={24}/> : <EyeOff color={COLORS.textLight} size={24}/>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.privacyTitle}>
                  {estPublic ? 'Signalement Public' : 'Signalement Privé'}
                </Text>
                <Text style={styles.privacySub}>
                  {estPublic 
                    ? 'Visible par tous les citoyens.' 
                    : 'Visible uniquement par les autorités.'}
                </Text>
              </View>
              <Switch
                value={estPublic}
                onValueChange={setEstPublic}
                trackColor={{ false: COLORS.border, true: 'rgba(0, 127, 95, 0.3)' }}
                thumbColor={estPublic ? COLORS.primary : COLORS.textLight}
              />
            </View>
          </View>

          {/* Bouton d'envoi classique */}
          <Button
            title="Envoyer le signalement"
            onPress={() => handleSubmit(false)}
            loading={submitting}
            disabled={submitting}
            icon={<Send size={20} color={COLORS.white} />}
            style={{ marginBottom: SPACING.xl, borderRadius: RADIUS.full, ...SHADOWS.md }}
          />
        </Animated.View>
      </ScrollView>

      {/* --- MODALE LIVE --- */}
      <Modal visible={liveModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.liveModalContent}>
            
            <View style={styles.liveModalHeader}>
              <Video color={THEME.live} size={28} />
              <Text style={styles.liveModalTitle}>Démarrer un Direct</Text>
              <Pressable onPress={() => setLiveModalVisible(false)} style={styles.liveModalClose}>
                <Text style={styles.liveModalCloseText}>Annuler</Text>
              </Pressable>
            </View>

            <View style={styles.liveModalBody}>
              <Text style={styles.liveModalWarning}>
                Le mode direct permet de filmer l'événement en temps-réel. La position GPS est requise.
              </Text>

              {/* Titre (Prérempli Urgence) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Titre de l'alerte</Text>
                <TextInput
                  style={styles.input}
                  value={liveTitre}
                  onChangeText={setLiveTitre}
                  placeholder="URGENCE"
                />
              </View>

              {/* Ministère */}
              <Dropdown
                label="Ministère à alerter"
                options={ministereOptions}
                selectedValue={liveMinistere}
                onValueChange={setLiveMinistere}
                placeholder="Alerte Générale (Tous)"
              />

              {/* Confidentialité */}
              <View style={styles.privacyCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.privacyTitle}>Direct Public</Text>
                  <Text style={styles.privacySub}>Accessible aux autres citoyens</Text>
                </View>
                <Switch
                  value={livePublic}
                  onValueChange={setLivePublic}
                  trackColor={{ false: COLORS.border, true: 'rgba(0, 127, 95, 0.3)' }}
                  thumbColor={livePublic ? COLORS.primary : COLORS.textLight}
                />
              </View>

              {/* Statut GPS */}
              {!coords ? (
                <Button
                  title="Activer le GPS pour continuer"
                  variant="outline"
                  onPress={handleGetLocation}
                  loading={gpsLoading}
                  style={{ marginTop: SPACING.md }}
                />
              ) : (
                <View style={styles.gpsLiveSuccess}>
                  <MapPin color={COLORS.success} size={16} style={{ marginRight: 8 }} />
                  <Text style={{ color: COLORS.success, ...FONTS.small, fontWeight: '600' }}>
                    Position GPS acquise
                  </Text>
                </View>
              )}

              {/* START ACTION */}
              <Pressable
                style={[styles.liveButtonStart, (!coords || submitting) && { opacity: 0.5 }]}
                disabled={!coords || submitting}
                onPress={() => handleSubmit(true)}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Video color={COLORS.white} size={20} style={{ marginRight: 8 }} />
                    <Text style={styles.liveButtonStartText}>DÉMARRER LE LIVE MAINTENANT</Text>
                  </>
                )}
              </Pressable>

            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFBFC' },
  scrollContent: { padding: SPACING.md, alignItems: 'center', paddingBottom: SPACING.xxl * 2 },
  
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: THEME.borderSoft,
    ...SHADOWS.sm, zIndex: 10,
  },
  backBtn: { padding: SPACING.sm, marginLeft: -SPACING.sm, marginRight: SPACING.sm },
  headerTitle: { ...FONTS.h2, color: COLORS.dark },

  formContainer: { width: '100%', maxWidth: 600, marginTop: SPACING.sm },

  // Live Button Top
  liveButtonTop: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.live,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.lg,
    shadowColor: THEME.live,
  },
  liveButtonPressed: { transform: [{ scale: 0.98 }], backgroundColor: '#DC2626' },
  liveButtonHover: { backgroundColor: '#F87171' },
  livePulse: {
    position: 'absolute', top: 15, right: 20,
    width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.white,
  },
  liveButtonText: { ...FONTS.h3, color: COLORS.white, fontWeight: '800', letterSpacing: 1 },
  liveButtonSub: { ...FONTS.caption, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },

  actionSeparator: {
    ...FONTS.small, color: COLORS.textLight, fontWeight: '700',
    marginVertical: SPACING.xl, textAlign: 'center', letterSpacing: 1,
  },

  mediaRow: {
    marginBottom: SPACING.lg,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: SPACING.sm,
  },
  recordingContainerActive: {
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: RADIUS.lg,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.error,
    marginRight: 8,
  },
  recordingTimer: {
    ...FONTS.medium,
    color: COLORS.error,
    fontSize: 16,
  },
  modernUploadBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.primary + '0A',
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    borderStyle: 'dashed',
    marginBottom: SPACING.md,
  },
  modernUploadIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  modernUploadText: {
    ...FONTS.medium,
    color: COLORS.primary,
    fontWeight: '700',
  },
  modernUploadSubtext: {
    ...FONTS.caption,
    color: COLORS.textLight,
    marginTop: 4,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 30,
    ...SHADOWS.md,
  },
  stopBtn: {
    backgroundColor: COLORS.error,
  },
  recordBtnText: {
    ...FONTS.medium,
    color: COLORS.white,
  },
  recordBtnTextActive: {
    ...FONTS.medium,
    color: COLORS.white,
  },
  audioPlayerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    width: '100%',
    ...SHADOWS.sm,
  },
  playPauseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioWaveform: {
    flex: 1,
    marginHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  waveformLine: {
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    opacity: 0.3,
    marginBottom: 4,
  },
  playerStatusText: {
    ...FONTS.small,
    color: COLORS.textLight,
  },
  deleteAudioBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaSelectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    width: '100%',
    ...SHADOWS.sm,
  },
  mediaSelectedText: {
    flex: 1,
    ...FONTS.medium,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },

  section: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    padding: SPACING.lg, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)', ...SHADOWS.md,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: THEME.borderSoft, paddingBottom: SPACING.sm,
  },
  sectionTitle: { ...FONTS.h3, color: COLORS.dark, marginLeft: SPACING.sm },

  inputGroup: { marginBottom: SPACING.lg },
  label: {
    ...FONTS.small, fontWeight: '700', color: COLORS.darkLight,
    marginBottom: SPACING.xs, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11,
  },
  input: {
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent',
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    ...FONTS.regular, color: COLORS.dark, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  textArea: { minHeight: 120, paddingTop: SPACING.md },

  // Horizontal Categories
  categoryScroll: { gap: SPACING.sm, paddingVertical: 4 },
  catChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, backgroundColor: '#F3F4F6',
    borderWidth: 1, borderColor: 'transparent', marginRight: SPACING.xs,
  },
  catChipActive: { backgroundColor: `${THEME.accent}15`, borderColor: THEME.accent },
  catIcon: { marginRight: SPACING.xs },
  catLabel: { ...FONTS.small, fontWeight: '600', color: COLORS.textSecondary },
  catLabelActive: { color: THEME.accent, fontWeight: '700' },

  // GPS Card
  gpsCard: {
    backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#E2E8F0',
    borderRadius: RADIUS.lg, borderStyle: 'dashed', overflow: 'hidden',
  },
  gpsCardActive: { borderColor: COLORS.success, backgroundColor: `${COLORS.success}05`, borderStyle: 'solid' },
  gpsCardContent: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  gpsIconBox: {
    width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: `${THEME.accent}15`,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  gpsIconBoxActive: { backgroundColor: `${COLORS.success}20` },
  gpsCardTitle: { ...FONTS.regular, fontWeight: '700', color: COLORS.dark, marginBottom: 2 },
  gpsCardSub: { ...FONTS.caption, color: COLORS.textSecondary },

  privacyCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', borderRadius: RADIUS.lg, padding: SPACING.md,
  },
  privacyIcon: { marginRight: SPACING.md },
  privacyTitle: { ...FONTS.small, fontWeight: '700', color: COLORS.dark },
  privacySub: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },

  standardButton: { marginBottom: SPACING.xl },

  // Success State
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, backgroundColor: COLORS.surface },
  successIcon: { marginBottom: SPACING.lg },
  successTitle: { ...FONTS.h1, color: COLORS.success, marginBottom: SPACING.sm },
  successText: { ...FONTS.regular, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xxl, lineHeight: 24 },
  successBtnPrimary: { width: '100%', maxWidth: 400, backgroundColor: COLORS.success, marginBottom: SPACING.sm },
  successBtnGhost: { width: '100%', maxWidth: 400 },

  // LIVE MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: SPACING.md },
  liveModalContent: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, ...SHADOWS.lg,
    width: '100%', maxWidth: 500, alignSelf: 'center', overflow: 'hidden',
  },
  liveModalHeader: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: THEME.borderSoft, backgroundColor: '#FEF2F2',
  },
  liveModalTitle: { ...FONTS.h2, color: THEME.live, marginLeft: SPACING.sm, flex: 1 },
  liveModalCloseText: { ...FONTS.small, color: COLORS.textSecondary, fontWeight: '600' },
  liveModalBody: { padding: SPACING.lg },
  liveModalWarning: { ...FONTS.small, color: COLORS.textSecondary, marginBottom: SPACING.lg, lineHeight: 20 },
  
  gpsLiveSuccess: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: `${COLORS.success}15`, padding: SPACING.sm, borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  
  liveButtonStart: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: THEME.live, borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md, marginTop: SPACING.xl, ...SHADOWS.md,
  },
  liveButtonStartText: { ...FONTS.button, color: COLORS.white, fontWeight: '700' },
});
