import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Alert, 
  Pressable, Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function AuthorityProfileScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  
  // Edit Form
  const [form, setForm] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    quartier: user?.quartier || '',
    email: user?.email || '',
  });
  const [loadingForm, setLoadingForm] = useState(false);
  const [formError, setFormError] = useState('');

  const handleUpdateProfile = async () => {
    setLoadingForm(true);
    setFormError('');
    
    try {
      await api.updateMe({
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        quartier: form.quartier.trim(),
        email: form.email.trim(),
      });
      await refreshUser();
      setIsEditModalVisible(false);
      Alert.alert('Succès', 'Votre profil a été mis à jour.');
    } catch (err) {
      setFormError(err.message || 'Impossible de mettre à jour le profil');
    } finally {
      setLoadingForm(false);
    }
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
             <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
          </Pressable>
          <Text style={styles.title}>Profil Autorité</Text>
          <View style={{width: 24}} /> 
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarTextLarge}>{user?.prenom?.charAt(0) || 'A'}</Text>
            </View>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.userNameLarge}>{user?.prenom} {user?.nom}</Text>
            
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.ministere?.nom || user?.role}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={COLORS.textLight} />
              <Text style={styles.infoText}>{user?.telephone}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textLight} />
              <Text style={styles.infoText}>{user?.email || 'Non renseigné'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={COLORS.textLight} />
              <Text style={styles.infoText}>{user?.quartier || 'Non renseigné'}</Text>
            </View>
          </View>
          
          <Pressable 
            style={styles.editProfileBtn}
            onPress={() => setIsEditModalVisible(true)}
          >
            <Ionicons name="pencil" size={18} color={COLORS.white} />
            <Text style={styles.editProfileBtnText}>Modifier mes informations</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Modifier mon profil</Text>
            <Pressable onPress={() => setIsEditModalVisible(false)}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalForm}>
            {formError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{formError}</Text>
              </View>
            ) : null}

            <Input
              label="Téléphone"
              value={user?.telephone}
              editable={false} 
              containerStyle={styles.inputMargin}
            />

            <View style={styles.row}>
              <Input
                label="Prénom"
                value={form.prenom}
                onChangeText={(text) => setForm({ ...form, prenom: text })}
                containerStyle={styles.halfInput}
              />
              <Input
                label="Nom"
                value={form.nom}
                onChangeText={(text) => setForm({ ...form, nom: text })}
                containerStyle={styles.halfInput}
              />
            </View>

            <Input
              label="Email"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              keyboardType="email-address"
              containerStyle={styles.inputMargin}
            />

            <Input
              label="Quartier"
              value={form.quartier}
              onChangeText={(text) => setForm({ ...form, quartier: text })}
              containerStyle={styles.inputMargin}
            />

            <Button 
              title="Enregistrer" 
              onPress={handleUpdateProfile} 
              loading={loadingForm} 
              style={styles.updateButton} 
            />
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...FONTS.h2,
    color: COLORS.dark,
  },
  backButton: {
    padding: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: SPACING.lg,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarTextLarge: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 40,
  },
  infoSection: {
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.xl,
  },
  userNameLarge: {
    ...FONTS.h2,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
  },
  roleText: {
    ...FONTS.small,
    color: COLORS.success,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SPACING.md,
  },
  infoText: {
    ...FONTS.regular,
    color: COLORS.text,
    flex: 1,
  },
  editProfileBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    width: '100%',
  },
  editProfileBtnText: {
    ...FONTS.regular,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...FONTS.h2,
    color: COLORS.text,
  },
  modalForm: {
    padding: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  halfInput: {
    flex: 1,
    marginBottom: SPACING.sm,
  },
  inputMargin: {
    marginBottom: SPACING.sm,
  },
  errorBanner: {
    backgroundColor: COLORS.errorLight,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  errorBannerText: {
    ...FONTS.small,
    color: COLORS.error,
  },
  updateButton: {
    marginTop: SPACING.md,
    marginBottom: 40,
  }
});
