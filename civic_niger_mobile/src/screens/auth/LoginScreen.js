import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text, Pressable, Platform } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import AuthLayout from '../../components/AuthLayout';
import { Phone, Lock } from 'lucide-react-native';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const isWeb = Platform.OS === 'web';

  function validate() {
    const newErrors = {};
    if (!telephone.trim()) {
      newErrors.telephone = 'Le numéro de téléphone est requis';
    }
    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const userData = await login(telephone.trim(), password);
      
      // Verification des droits selon la plateforme
      if (isWeb && userData.role === 'CITOYEN') {
        setErrors({ general: "L'accès Web est réservé aux Autorités. Veuillez utiliser l'application mobile." });
        return; // L'utilisateur sera déconnecté ou bloqué au niveau du navigateur
      }
      if (!isWeb && (userData.role === 'MINISTERE' || userData.role === 'ADMIN')) {
        setErrors({ general: "Ce compte est une Autorité. Veuillez vous connecter sur le portail Web." });
        return; // L'utilisateur sera bloqué sur l'AppNavigator
      }
      
    } catch (error) {
      const message = error?.message || 'Connexion impossible';
      if (message.includes('attente de validation')) {
         if (Platform.OS === 'web') {
           window.alert('Votre compte autorité est en attente de validation par l\'administrateur.');
         } else {
           Alert.alert(
             'Compte en attente',
             'Votre compte autorité est en attente de validation par l\'administrateur.',
             [{ text: 'Compris' }]
           );
         }
      } else {
        setErrors({ general: message });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={isWeb ? "Portail Autorités" : "Espace Citoyen"}
      subtitle={isWeb ? "Espace réservé aux agents de l'État et administrateurs" : "Participez à la vie de votre cité"}
    >
      {errors.general && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errors.general}</Text>
        </View>
      )}

      <View style={styles.formGroup}>
        <Input
          label="Numéro de téléphone"
          placeholder="+227 90 00 00 00"
          keyboardType="phone-pad"
          value={telephone}
          onChangeText={setTelephone}
          error={errors.telephone}
          icon={<Phone color={COLORS.textSecondary} size={20} />}
        />

        <Input
          label="Mot de passe"
          placeholder="Votre mot de passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          icon={<Lock color={COLORS.textSecondary} size={20} />}
        />
        
        <Pressable 
          style={styles.forgotPassword}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
        </Pressable>
      </View>

      <Button
        title="Se connecter"
        onPress={handleLogin}
        loading={loading}
        style={styles.loginButton}
      />

      {!isWeb ? (
        // Mobile Only: Register Citizen
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Pas encore de compte citoyen ?</Text>
          <Button
            title="Créer un compte"
            variant="outline"
            onPress={() => navigation.navigate('Register')}
            style={styles.registerButton}
          />
          
          <View style={styles.authorityContainer}>
            <Text style={styles.authorityText}>Vous représentez l'État ? Connectez-vous sur le web</Text>
          </View>
        </View>
      ) : (
        // Web Only: Register Authority or Citizen Redirect
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Vous êtes un citoyen ?</Text>
          <Text style={styles.authorityText}>Veuillez télécharger l'application mobile CivicNiger</Text>
        </View>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  formGroup: {
    marginBottom: SPACING.xl,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
    padding: SPACING.xs,
  },
  forgotPasswordText: {
    ...FONTS.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: SPACING.xl,
  },
  registerContainer: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  registerText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  registerButton: {
    width: '100%',
  },
  authorityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.xs,
  },
  authorityText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  authorityLink: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
