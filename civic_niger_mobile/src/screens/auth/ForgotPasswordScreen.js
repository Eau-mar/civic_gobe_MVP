import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  TextInput,
} from 'react-native';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../theme';
import { api } from '../../api/client';
import Input from '../../components/Input';
import Button from '../../components/Button';

// Étapes du processus de réinitialisation
const STEPS = {
  PHONE: 'PHONE',
  CODE: 'CODE',
  NEW_PASSWORD: 'NEW_PASSWORD',
};

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(STEPS.PHONE);
  const [telephone, setTelephone] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Refs pour les champs OTP
  const codeRefs = useRef([]);

  // ==================
  // ÉTAPE 1 : Téléphone
  // ==================
  async function handleRequestCode() {
    if (!telephone.trim()) {
      setError('Le numéro de téléphone est requis');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.requestResetCode(telephone.trim());
      setStep(STEPS.CODE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ==================
  // ÉTAPE 2 : Code OTP
  // ==================
  function handleCodeChange(value, index) {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Avancer au champ suivant
    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  }

  function handleCodeKeyPress(e, index) {
    // Reculer au champ précédent sur backspace
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyCode() {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Veuillez saisir le code complet à 6 chiffres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.verifyResetCode(telephone.trim(), fullCode);
      setStep(STEPS.NEW_PASSWORD);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ==================
  // ÉTAPE 3 : Nouveau mot de passe
  // ==================
  async function handleResetPassword() {
    if (!newPassword || newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.resetPassword(telephone.trim(), newPassword);
      Alert.alert(
        'Mot de passe modifié',
        'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
        [
          {
            text: 'Se connecter',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ==================
  // Rendu de chaque étape
  // ==================
  function renderStepIndicator() {
    const steps = ['Téléphone', 'Code', 'Mot de passe'];
    const currentIndex = step === STEPS.PHONE ? 0 : step === STEPS.CODE ? 1 : 2;

    return (
      <View style={styles.stepIndicator}>
        {steps.map((label, i) => (
          <View key={i} style={styles.stepItem}>
            <View style={[
              styles.stepDot,
              i <= currentIndex && styles.stepDotActive,
            ]}>
              <Text style={[
                styles.stepDotText,
                i <= currentIndex && styles.stepDotTextActive,
              ]}>
                {i + 1}
              </Text>
            </View>
            <Text style={[
              styles.stepLabel,
              i <= currentIndex && styles.stepLabelActive,
            ]}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  function renderPhoneStep() {
    return (
      <>
        <Text style={styles.instruction}>
          Entrez votre numéro de téléphone pour recevoir un code de vérification.
        </Text>

        <Input
          label="Numéro de téléphone"
          placeholder="+227 90 00 00 00"
          keyboardType="phone-pad"
          value={telephone}
          onChangeText={setTelephone}
        />

        <Button
          title="Envoyer le code"
          onPress={handleRequestCode}
          loading={loading}
          style={styles.actionButton}
        />
      </>
    );
  }

  function renderCodeStep() {
    return (
      <>
        <Text style={styles.instruction}>
          Un code à 6 chiffres a été envoyé au{'\n'}
          <Text style={styles.phoneHighlight}>{telephone}</Text>
        </Text>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (codeRefs.current[index] = ref)}
              style={[
                styles.codeInput,
                digit && styles.codeInputFilled,
              ]}
              value={digit}
              onChangeText={(v) => handleCodeChange(v.replace(/\D/g, ''), index)}
              onKeyPress={(e) => handleCodeKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              autoFocus={index === 0}
            />
          ))}
        </View>

        <Button
          title="Vérifier le code"
          onPress={handleVerifyCode}
          loading={loading}
          style={styles.actionButton}
        />

        <Button
          title="Renvoyer le code"
          variant="ghost"
          size="sm"
          onPress={handleRequestCode}
          disabled={loading}
        />
      </>
    );
  }

  function renderNewPasswordStep() {
    return (
      <>
        <Text style={styles.instruction}>
          Choisissez votre nouveau mot de passe.
        </Text>

        <Input
          label="Nouveau mot de passe"
          placeholder="Minimum 6 caractères"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <Input
          label="Confirmer le mot de passe"
          placeholder="Répétez le mot de passe"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Button
          title="Modifier le mot de passe"
          onPress={handleResetPassword}
          loading={loading}
          style={styles.actionButton}
        />
      </>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Mot de passe oublié</Text>
            {renderStepIndicator()}
          </View>

          {/* Card */}
          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            {step === STEPS.PHONE && renderPhoneStep()}
            {step === STEPS.CODE && renderCodeStep()}
            {step === STEPS.NEW_PASSWORD && renderNewPasswordStep()}
          </View>

          {/* Back to login */}
          <Button
            title="← Retour à la connexion"
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('Login')}
            style={styles.backButton}
            textStyle={styles.backButtonText}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xxl,
  },

  // Header
  header: {
    paddingTop: SPACING.xxl + SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  title: {
    ...FONTS.h1,
    marginBottom: SPACING.lg,
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
  },
  stepDotText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  stepDotTextActive: {
    color: COLORS.white,
  },
  stepLabel: {
    ...FONTS.caption,
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },

  instruction: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  phoneHighlight: {
    fontWeight: '600',
    color: COLORS.primary,
  },

  // OTP Code Input
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  codeInput: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.dark,
  },
  codeInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: '#E8F5F0',
  },

  // Error
  errorBanner: {
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorBannerText: {
    ...FONTS.small,
    color: COLORS.error,
    textAlign: 'center',
  },

  // Buttons
  actionButton: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  backButton: {
    alignSelf: 'center',
    marginTop: SPACING.lg,
  },
  backButtonText: {
    color: COLORS.textSecondary,
  },
});
