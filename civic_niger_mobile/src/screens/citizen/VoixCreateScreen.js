import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, Pressable, 
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mic, Trash2, Play, Pause } from 'lucide-react-native';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import api from '../../api/client';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../theme';
import Button from '../../components/Button';
import Input from '../../components/Input';
import ScreenHeader from '../../components/ScreenHeader';

export default function VoixCreateScreen({ route, navigation }) {
  const editItem = route.params?.editItem;
  
  const [titre, setTitre] = useState(editItem?.titre || '');
  const [contenu, setContenu] = useState(editItem?.contenu || '');
  const [objectifVotes, setObjectifVotes] = useState(editItem?.objectif_votes?.toString() || '100');
  const [loading, setLoading] = useState(false);
  
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [audioUri, setAudioUri] = useState(null);
  const audioPlayer = useAudioPlayer(audioUri || null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isRecordingState, setIsRecordingState] = useState(false);

  // Timer for recording duration
  useEffect(() => {
    let interval;
    if (isRecordingState) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecordingState]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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

  const handlePublish = async () => {
    if (!titre.trim() || !contenu.trim()) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('titre', titre.trim());
      formData.append('contenu', contenu.trim());
      
      const parsedObjectif = parseInt(objectifVotes, 10);
      if (!isNaN(parsedObjectif) && parsedObjectif > 0) {
        formData.append('objectif_votes', parsedObjectif.toString());
      } else {
        formData.append('objectif_votes', '100');
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

      if (editItem) {
        await api.patchVoix(editItem.id, formData);
        alert("Votre voix a été modifiée avec succès !");
      } else {
        await api.createVoix(formData);
        alert("Votre voix a été publiée avec succès !");
      }
      navigation.goBack();
    } catch (e) {
      console.log("Erreur publication voix", e);
      alert("Une erreur est survenue lors de la publication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
    >
      <ScreenHeader
        title={editItem ? 'Modifier votre Voix' : 'Faites entendre votre Voix'}
        subtitle={editItem ? 'Mettez à jour les détails' : 'Signalez un problème ou lancez une idée.'}
        onBack={() => navigation.goBack()}
        transparent
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Input
          label="Titre de votre publication"
          placeholder="Ex: Demande de réfection de la route X"
          value={titre}
          onChangeText={setTitre}
          maxLength={100}
          hint="Un titre court et accrocheur."
        />

        <Input
          label="Objectif de votes"
          placeholder="Ex: 500"
          value={objectifVotes}
          onChangeText={setObjectifVotes}
          keyboardType="numeric"
          maxLength={6}
          hint="Le nombre de soutiens espéré pour cette cause."
        />

        <Input
          label="Détails de votre proposition"
          placeholder="Expliquez votre idée en détail..."
          value={contenu}
          onChangeText={setContenu}
          multiline
          inputStyle={styles.textArea}
          hint="Pourquoi cette idée est-elle importante pour la communauté ?"
        />

        {/* MEDIA BUTTONS - WhatsApp style */}
        <View style={styles.mediaRow}>
          {!audioUri ? (
            <View style={[styles.recordingContainer, isRecordingState && styles.recordingContainerActive]}>
              {isRecordingState && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.redDot} />
                  <Text style={styles.recordingTimer}>{formatTime(recordingDuration)}</Text>
                </View>
              )}
              
              <Pressable 
                style={[styles.recordBtn, isRecordingState && styles.stopBtn]} 
                onPress={toggleRecording}
              >
                {isRecordingState ? (
                  <>
                    <Ionicons name="stop" color={COLORS.white} size={24} />
                    <Text style={styles.recordBtnTextActive}>Arrêter</Text>
                  </>
                ) : (
                  <>
                    <Mic color={COLORS.white} size={24} />
                    <Text style={styles.recordBtnText}>Appuyer pour parler</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.audioPlayerContainer}>
              <Pressable 
                style={styles.playPauseBtn}
                onPress={() => audioPlayer?.playing ? audioPlayer.pause() : audioPlayer?.play()}
              >
                {audioPlayer?.playing ? (
                  <Pause color={COLORS.white} size={24} />
                ) : (
                  <Play color={COLORS.white} size={24} style={{ marginLeft: 3 }} />
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

        <Button 
          title={editItem ? "Enregistrer les modifications" : "Publier la Voix du Peuple"}
          onPress={handlePublish}
          loading={loading}
          icon={<Ionicons name={editItem ? "save" : "send"} size={20} color={COLORS.white} />}
          style={{ marginTop: SPACING.md, borderRadius: RADIUS.full, ...SHADOWS.md }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  headerSub: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...FONTS.small,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...FONTS.regular,
  },
  textArea: {
    minHeight: 120,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    ...FONTS.small,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  mediaRow: {
    marginBottom: SPACING.md,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: SPACING.md,
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
    marginLeft: 8,
  },
  recordBtnTextActive: {
    ...FONTS.medium,
    color: COLORS.white,
    marginLeft: 8,
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
});
