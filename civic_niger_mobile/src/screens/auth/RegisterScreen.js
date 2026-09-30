import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, Pressable, Platform, Modal, FlatList, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import Input from '../../components/Input';
import Button from '../../components/Button';
import AuthLayout from '../../components/AuthLayout';

export default function RegisterScreen({ route, navigation }) {
  const { register } = useAuth();
  const isCitizenWeb = route?.params?.isCitizenWeb || false;
  
  const [form, setForm] = useState({
    telephone: '',
    prenom: '',
    nom: '',
    quartier: '',
    password: '',
    password_confirm: '',
    ministere_id: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const isWeb = Platform.OS === 'web' && !isCitizenWeb;

  const [ministeres, setMinisteres] = useState([]);
  const [loadingMinisteres, setLoadingMinisteres] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (isWeb) {
      setLoadingMinisteres(true);
      api.getMinisteres()
        .then(res => setMinisteres(res))
        .catch(console.error)
        .finally(() => setLoadingMinisteres(false));
    }
  }, [isWeb]);

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }

  function validate() {
    const newErrors = {};

    if (!form.telephone.trim()) {
      newErrors.telephone = 'Requis';
    } else if (form.telephone.replace(/\D/g, '').length < 8) {
      newErrors.telephone = 'Numéro invalide';
    }

    if (!form.prenom.trim()) newErrors.prenom = 'Requis';
    if (!form.nom.trim()) newErrors.nom = 'Requis';
    if (!form.quartier.trim()) newErrors.quartier = 'Requis';

    if (!form.password) {
      newErrors.password = 'Requis';
    } else if (form.password.length < 6) {
      newErrors.password = 'Min. 6 caractères';
    }

    if (form.password !== form.password_confirm) {
      newErrors.password_confirm = 'Non identiques';
    }

    if (isWeb && !form.ministere_id) {
      newErrors.ministere_id = 'Veuillez sélectionner un ministère';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      await register({
        telephone: form.telephone.trim(),
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        quartier: form.quartier.trim(),
        password: form.password,
        password_confirm: form.password_confirm,
        is_ministere: isWeb,
        ministere_id: form.ministere_id,
      });

      if (isWeb) {
        window.alert('Votre compte a été créé avec succès. Un administrateur doit le valider avant votre connexion.');
        navigation.navigate('Login');
      } else {
        Alert.alert(
          'Compte créé ! 🎉',
          'Votre compte a été créé avec succès.',
          [{ text: 'Se connecter', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error) {
      const message = error?.message || 'Inscription impossible';
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={isWeb ? "Inscription Autorité" : "Créer un compte"}
      subtitle={isWeb ? "Demande d'accès pour les institutions de l'État" : "Rejoignez la communauté citoyenne du Niger"}
    >
      {errors.general && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errors.general}</Text>
        </View>
      )}

      <View style={styles.formGroup}>
        {isWeb && (
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Ministère d'affectation</Text>
            <Pressable 
              style={[styles.pickerButton, errors.ministere_id && styles.pickerError]}
              onPress={() => setShowPicker(true)}
            >
              <Text style={[styles.pickerButtonText, !form.ministere_id && styles.pickerPlaceholder]}>
                {form.ministere_id 
                  ? ministeres.find(m => m.id === form.ministere_id)?.nom 
                  : "Sélectionnez votre ministère..."}
              </Text>
            </Pressable>
            {errors.ministere_id && <Text style={styles.errorText}>{errors.ministere_id}</Text>}
          </View>
        )}

        <Input
          label="Numéro de téléphone"
          placeholder="+227 90 00 00 00"
          keyboardType="phone-pad"
          value={form.telephone}
          onChangeText={(v) => updateField('telephone', v)}
          error={errors.telephone}
          hint="Servira d'identifiant de connexion"
        />

        <View style={styles.row}>
          <Input
            label="Prénom"
            placeholder="Ibrahim"
            value={form.prenom}
            onChangeText={(v) => updateField('prenom', v)}
            error={errors.prenom}
            containerStyle={styles.halfInput}
          />
          <Input
            label="Nom"
            placeholder="Moussa"
            value={form.nom}
            onChangeText={(v) => updateField('nom', v)}
            error={errors.nom}
            containerStyle={styles.halfInput}
          />
        </View>

        <Input
          label="Quartier"
          placeholder="Ex: Koira Kano"
          value={form.quartier}
          onChangeText={(v) => updateField('quartier', v)}
          error={errors.quartier}
        />

        <Input
          label="Mot de passe"
          placeholder="Min. 6 caractères"
          secureTextEntry
          value={form.password}
          onChangeText={(v) => updateField('password', v)}
          error={errors.password}
          hint="Choisissez un mot de passe sécurisé"
        />

        <Input
          label="Confirmation"
          placeholder="Répétez le mot de passe"
          secureTextEntry
          value={form.password_confirm}
          onChangeText={(v) => updateField('password_confirm', v)}
          error={errors.password_confirm}
        />
      </View>

      <Button
        title={isWeb ? "Soumettre la demande d'accès" : "Créer mon compte citoyen"}
        onPress={handleRegister}
        loading={loading}
        style={styles.registerButton}
      />

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Déjà inscrit ?</Text>
        <Button
          title="Se connecter"
          variant="ghost"
          onPress={() => navigation.navigate('Login')}
        />
      </View>

      {/* Modal for selecting Ministry */}
      {isWeb && (
        <Modal visible={showPicker} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choisir un ministère</Text>
              
              {loadingMinisteres ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ padding: 20 }} />
              ) : (
                <FlatList
                  data={ministeres}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <Pressable 
                      style={styles.modalItem}
                      onPress={() => {
                        updateField('ministere_id', item.id);
                        setShowPicker(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>{item.nom}</Text>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <Text style={{ padding: 20, textAlign: 'center', color: COLORS.textSecondary }}>
                      Aucun ministère disponible.
                    </Text>
                  }
                />
              )}

              <Button 
                title="Annuler" 
                variant="ghost" 
                onPress={() => setShowPicker(false)} 
                style={{ marginTop: SPACING.md }} 
              />
            </View>
          </View>
        </Modal>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  formGroup: {
    marginBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfInput: {
    flex: 1,
  },
  errorBanner: {
    backgroundColor: COLORS.errorLight,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  errorBannerText: {
    color: COLORS.error,
    ...FONTS.small,
    textAlign: 'center',
    fontWeight: '500',
  },
  registerButton: {
    marginBottom: SPACING.xl,
  },
  loginContainer: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  loginText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  pickerContainer: {
    marginBottom: SPACING.md,
  },
  pickerLabel: {
    ...FONTS.small,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 6,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  pickerError: {
    borderColor: COLORS.error,
  },
  pickerButtonText: {
    ...FONTS.regular,
    color: COLORS.text,
  },
  pickerPlaceholder: {
    color: COLORS.textLight,
  },
  errorText: {
    color: COLORS.error,
    ...FONTS.caption,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: SPACING.lg,
  },
  modalTitle: {
    ...FONTS.h3,
    color: COLORS.dark,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalItemText: {
    ...FONTS.regular,
    color: COLORS.text,
  },
});
