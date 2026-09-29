import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImagePlus, Send, ChevronDown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';
import api from '../../api/client';

export default function CreateSavoirScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [titre, setTitre] = useState('');
  const [contenu, setContenu] = useState('');
  const [image, setImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    api.getSavoirCategories()
      .then(data => {
        setCategories(data);
        if (data.length > 0) setSelectedCategory(data[0]);
      })
      .catch(console.error);
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!titre.trim() || !contenu.trim()) {
      Alert.alert('Erreur', 'Le titre et le contenu sont obligatoires.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('titre', titre);
      formData.append('contenu', contenu);
      formData.append('statut', 'publie');
      
      if (selectedCategory) {
        formData.append('categorie', selectedCategory.id);
      }
      
      if (image) {
        if (image.file) {
          formData.append('image', image.file);
        } else {
          const localUri = image.uri;
          const filename = localUri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
          
          formData.append('image', {
            uri: localUri,
            name: filename,
            type,
          });
        }
      }

      await api.createSavoir(formData);
      setSuccessMsg('Le Savoir Citoyen a été publié avec succès.');
      setTitre('');
      setContenu('');
      setImage(null);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMsg('');
        navigation.goBack();
      }, 3000);
      
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de publier ce Savoir Citoyen. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Ajouter un Savoir Citoyen" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xxl }]}>
        
        <View style={styles.card}>
          {successMsg ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Titre du guide ou de la loi *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Procédure de déclaration de vol..."
            value={titre}
            onChangeText={setTitre}
          />

          <Text style={styles.label}>Catégorie</Text>
          <Pressable 
            style={styles.dropdownBtn}
            onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
          >
            <Text style={styles.dropdownText}>{selectedCategory ? selectedCategory.nom : 'Sélectionner une catégorie...'}</Text>
            <ChevronDown color={COLORS.textSecondary} size={20} />
          </Pressable>
          
          {showCategoryDropdown && (
            <View style={styles.dropdownMenu}>
              {categories.map(cat => (
                <Pressable 
                  key={cat.id} 
                  style={styles.dropdownMenuItem}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownMenuItemText}>{cat.nom}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.label}>Contenu complet *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Écrivez le contenu du Savoir Citoyen ici..."
            value={contenu}
            onChangeText={setContenu}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Image illustratoire (Optionnelle)</Text>
          {image ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image.uri }} style={styles.imagePreview} />
              <Pressable style={styles.changeImageBtn} onPress={pickImage}>
                <Text style={styles.changeImageText}>Changer l'image</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.imagePickerBtn} onPress={pickImage}>
              <ImagePlus color={COLORS.primary} size={32} style={{ marginBottom: SPACING.sm }} />
              <Text style={styles.imagePickerText}>Ajouter une photo</Text>
            </Pressable>
          )}

          <Pressable 
            style={[styles.submitBtn, (!titre || !contenu || loading) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!titre || !contenu || loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Send color={COLORS.white} size={20} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.submitText}>Publier le Savoir Citoyen</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.xl,
    width: '100%',
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    ...SHADOWS.md,
  },
  label: {
    ...FONTS.small,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
    marginTop: SPACING.lg,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...FONTS.regular,
    color: COLORS.text,
  },
  dropdownBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    ...FONTS.regular,
    color: COLORS.text,
  },
  dropdownMenu: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    marginTop: 4,
    ...SHADOWS.sm,
  },
  dropdownMenuItem: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dropdownMenuItemText: {
    ...FONTS.regular,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 180,
  },
  imagePickerBtn: {
    backgroundColor: COLORS.primaryLight + '20',
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  imagePickerText: {
    ...FONTS.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    marginTop: SPACING.xs,
    alignItems: 'flex-start',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.md,
  },
  changeImageBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  changeImageText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xxl,
    ...SHADOWS.sm,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  submitText: {
    ...FONTS.button,
    color: COLORS.white,
    fontSize: 16,
  },
  successBanner: {
    backgroundColor: '#D1FAE5',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#34D399',
  },
  successText: {
    ...FONTS.regular,
    color: '#065F46',
    textAlign: 'center',
    fontWeight: 'bold',
  }
});
