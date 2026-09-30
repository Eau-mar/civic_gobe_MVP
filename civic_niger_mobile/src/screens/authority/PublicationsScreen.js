import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Image, Alert, DeviceEventEmitter, Platform } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';
import { FileText, Plus, ExternalLink, Edit2, Trash2 } from 'lucide-react-native';
import api from '../../api/client';

export default function PublicationsScreen({ navigation }) {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublications();

    const sub = DeviceEventEmitter.addListener('publicationUpdated', (event) => {
      if (event.action === 'create' && event.item) {
        setPublications(prev => [event.item, ...prev]);
      } else if (event.action === 'update' && event.item) {
        setPublications(prev => prev.map(p => p.id === event.item.id ? event.item : p));
      } else if (event.action === 'delete') {
        setPublications(prev => prev.filter(p => p.id !== event.id));
      }
    });

    return () => sub.remove();
  }, []);

  const loadPublications = async () => {
    try {
      const response = await api.getPublications();
      setPublications(response?.results || response || []);
    } catch (e) {
      console.error('Erreur chargement publications:', e);
      setPublications([]); // Fallback
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async (id) => {
    try {
      setPublications(prev => prev.filter(pub => pub.id !== id));
      DeviceEventEmitter.emit('publicationUpdated', { action: 'delete', id });
      await api.deletePublication(id);
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'web') {
        window.alert("Impossible de supprimer la publication.");
      } else {
        Alert.alert("Erreur", "Impossible de supprimer la publication.");
      }
      loadPublications();
    }
  };

  const handleDelete = (id) => {
    if (Platform.OS === 'web') {
      if (window.confirm("Êtes-vous sûr de vouloir supprimer cette publication ?")) {
        executeDelete(id);
      }
    } else {
      Alert.alert(
        "Supprimer",
        "Êtes-vous sûr de vouloir supprimer cette publication ?",
        [
          { text: "Annuler", style: "cancel" },
          { 
            text: "Supprimer", 
            style: "destructive",
            onPress: () => executeDelete(id)
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Publications Ministérielles</Text>
          <Text style={styles.pageSubtitle}>Gérez vos communiqués et actualités publiques</Text>
        </View>
        <Pressable 
          style={({ hovered }) => [styles.addBtn, hovered && styles.addBtnHover]}
          onPress={() => navigation.navigate('CreatePublicationAuthority')}
        >
          <Plus color={COLORS.white} size={20} />
          <Text style={styles.addBtnText}>Nouvelle publication</Text>
        </Pressable>
      </View>

      <View style={styles.contentCard}>
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.emptyText, {marginTop: SPACING.md}]}>Chargement des publications...</Text>
          </View>
        ) : publications.length === 0 ? (
          <View style={styles.emptyState}>
             <FileText color={COLORS.textLight} size={48} style={{ marginBottom: SPACING.md }} />
             <Text style={styles.emptyText}>Vous n'avez aucune publication pour le moment.</Text>
             <Pressable 
               style={styles.emptyActionBtn}
               onPress={() => navigation.navigate('CreatePublicationAuthority')}
             >
               <Text style={styles.emptyActionText}>Créer votre première publication</Text>
             </Pressable>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.grid}>
            {publications.map((pub, idx) => (
              <View key={pub.id || idx} style={styles.pubCard}>
                {pub.image ? (
                  <Image source={{ uri: pub.image }} style={styles.pubImage} resizeMode="cover" />
                ) : (
                  <View style={styles.pubImagePlaceholder}>
                    <FileText color={COLORS.textLight} size={32} />
                  </View>
                )}
                <View style={styles.pubContent}>
                  <Text style={styles.pubTitle} numberOfLines={2}>{pub.titre}</Text>
                  <Text style={styles.pubDate}>
                    {pub.date ? new Date(pub.date).toLocaleDateString('fr-FR') : 'Date inconnue'}
                  </Text>
                  <Text style={styles.pubDesc} numberOfLines={3}>{pub.contenu}</Text>
                  
                  <View style={styles.actionRow}>
                    <Pressable 
                      style={styles.actionBtn} 
                      onPress={() => navigation.navigate('CreatePublicationAuthority', { publication: pub })}
                    >
                      <Edit2 color={COLORS.primary} size={18} />
                    </Pressable>
                    <Pressable 
                      style={styles.actionBtn} 
                      onPress={() => handleDelete(pub.id)}
                    >
                      <Trash2 color={COLORS.error || '#EF4444'} size={18} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.xl,
  },
  pageTitle: {
    ...FONTS.h1,
    color: COLORS.dark,
    marginBottom: 4,
  },
  pageSubtitle: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    cursor: 'pointer',
    ...SHADOWS.sm,
  },
  addBtnHover: {
    backgroundColor: COLORS.primaryDark,
  },
  addBtnText: {
    ...FONTS.button,
    color: COLORS.white,
    fontSize: 14,
  },
  contentCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
  },
  pubCard: {
    width: 320,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  pubImage: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.background,
  },
  pubImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pubContent: {
    padding: SPACING.lg,
  },
  pubTitle: {
    ...FONTS.h4,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  pubDate: {
    ...FONTS.caption,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  pubDesc: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    marginTop: 'auto',
  },
  actionBtn: {
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyText: {
    ...FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyActionBtn: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryLight + '20',
    borderRadius: RADIUS.md,
  },
  emptyActionText: {
    ...FONTS.small,
    color: COLORS.primaryDark,
    fontWeight: '600',
  }
});
