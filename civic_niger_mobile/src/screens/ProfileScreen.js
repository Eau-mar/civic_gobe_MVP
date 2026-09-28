import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Alert, 
  Pressable, FlatList, ActivityIndicator, Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Input from '../components/Input';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import FeedReportCard from '../components/feed/FeedReportCard';
import FeedVoixCard from '../components/feed/FeedVoixCard';

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState('signalements'); // 'signalements' | 'voix'
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  
  // Lists
  const [signalements, setSignalements] = useState([]);
  const [voix, setVoix] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  
  // Edit Form
  const [form, setForm] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    quartier: user?.quartier || '',
    email: user?.email || '',
  });
  const [loadingForm, setLoadingForm] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const loadTabData = async (tab) => {
    setLoadingList(true);
    try {
      if (tab === 'signalements') {
        const data = await api.getSignalements({ mine: 'true' });
        // Ne pas afficher les anciens directs
        const filteredData = data.filter(item => !item.live_room_id);
        setSignalements(filteredData);
      } else {
        const data = await api.getVoix({ mine: 'true' });
        setVoix(data);
      }
    } catch (err) {
      console.log('Erreur chargement listes profil:', err);
    } finally {
      setLoadingList(false);
    }
  };

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

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: logout },
      ]
    );
  };

  const deleteItem = (type, id) => {
    Alert.alert(
      'Suppression',
      'Êtes-vous sûr de vouloir supprimer cet élément ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive', 
          onPress: async () => {
            try {
              if (type === 'signalement') {
                await api.deleteSignalement(id);
                setSignalements(signalements.filter(s => s.id !== id));
              } else {
                await api.deleteVoix(id);
                setVoix(voix.filter(v => v.id !== id));
              }
            } catch (err) {
              Alert.alert('Erreur', 'Impossible de supprimer cet élément.');
            }
          }
        },
      ]
    );
  };

  const renderItemWrapper = ({ item }) => {
    const isSignalement = activeTab === 'signalements';
    const canEdit = !isSignalement || (isSignalement && !item.is_live && item.statut === 'non_traite');
    
    return (
      <View style={styles.itemWrapper}>
        <View style={styles.itemControls}>
          {canEdit && (
            <Pressable 
              style={[styles.controlBtn, styles.editBtn]}
              onPress={() => {
                 // On a simple MVP, edit could redirect to the form screen with params
                 if (isSignalement) {
                   // navigation.navigate('SignalementForm', { editItem: item });
                   Alert.alert('Info', 'L\'édition n\'est pas encore disponible sur cette version.');
                 } else {
                   navigation.navigate('Voix', { screen: 'VoixCreate', params: { editItem: item }});
                 }
              }}
            >
              <Ionicons name="pencil" size={16} color={COLORS.primary} />
              <Text style={styles.editText}>Modifier</Text>
            </Pressable>
          )}
          <Pressable 
            style={[styles.controlBtn, styles.deleteBtn]}
            onPress={() => deleteItem(isSignalement ? 'signalement' : 'voix', item.id)}
          >
            <Ionicons name="trash" size={16} color={COLORS.error} />
          </Pressable>
        </View>

        {isSignalement ? (
          <FeedReportCard 
            item={item} 
            onPress={() => {}} 
          />
        ) : (
          <FeedVoixCard 
            item={item} 
            onPress={() => navigation.navigate('Voix', { screen: 'VoixDetail', params: { voix: item } })} 
          />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Mon Profil</Text>
          <Pressable onPress={handleLogout} style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.prenom?.charAt(0) || 'C'}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{user?.prenom} {user?.nom}</Text>
              <Text style={styles.userPhone}>{user?.telephone}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user?.role === 'CITOYEN' ? 'Citoyen Vérifié' : user?.role}</Text>
              </View>
            </View>
          </View>
          
          <Pressable 
            style={styles.editProfileBtn}
            onPress={() => setIsEditModalVisible(true)}
          >
            <Text style={styles.editProfileBtnText}>Modifier mes infos</Text>
          </Pressable>
        </View>
      </View>

      {/* TABS SECTION */}
      <View style={styles.tabsContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'signalements' && styles.tabActive]}
          onPress={() => setActiveTab('signalements')}
        >
          <Ionicons name="map" size={20} color={activeTab === 'signalements' ? COLORS.primary : COLORS.textLight} />
          <Text style={[styles.tabText, activeTab === 'signalements' && styles.tabTextActive]}>
            Mes Signalements
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'voix' && styles.tabActive]}
          onPress={() => setActiveTab('voix')}
        >
          <Ionicons name="megaphone" size={20} color={activeTab === 'voix' ? COLORS.primary : COLORS.textLight} />
          <Text style={[styles.tabText, activeTab === 'voix' && styles.tabTextActive]}>
            Mes Voix
          </Text>
        </Pressable>
      </View>

      {/* LIST SECTION */}
      {loadingList ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'signalements' ? signalements : voix}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItemWrapper}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              title={activeTab === 'signalements' ? 'Aucun signalement' : 'Aucune voix'}
              description={`Vous n'avez pas encore créé de ${activeTab === 'signalements' ? 'signalement' : 'voix du peuple'}.`}
            />
          }
        />
      )}

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
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.dark,
  },
  logoutIcon: {
    padding: SPACING.xs,
  },
  profileCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 24,
  },
  userName: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  userPhone: {
    ...FONTS.small,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  roleText: {
    ...FONTS.caption,
    color: COLORS.success,
    fontWeight: '600',
  },
  editProfileBtn: {
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editProfileBtnText: {
    ...FONTS.small,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    gap: SPACING.xs,
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...FONTS.regular,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
  },
  emptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...FONTS.regular,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  itemWrapper: {
    marginBottom: SPACING.lg,
  },
  itemControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: -10,
    zIndex: 1,
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
    borderWidth: 1,
  },
  editBtn: {
    borderColor: COLORS.primary + '40',
  },
  deleteBtn: {
    borderColor: COLORS.error + '40',
    backgroundColor: COLORS.errorLight,
  },
  editText: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 4,
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
