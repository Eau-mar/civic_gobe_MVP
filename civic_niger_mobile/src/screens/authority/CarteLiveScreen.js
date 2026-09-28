import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';
import api from '../../api/client';

export default function CarteLiveScreen() {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSignalements();
  }, []);

  const loadSignalements = async () => {
    try {
      const data = await api.getSignalements();
      setSignalements(Array.isArray(data) ? data : (data?.results || []));
    } catch (e) {
      console.error('Erreur chargement signalements:', e);
    } finally {
      setLoading(false);
    }
  };

  const geoSignalements = signalements.filter(s => s.latitude && s.longitude);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Carte Interactive Live</Text>
        <Text style={styles.pageSubtitle}>Visualisez l'ensemble des incidents géolocalisés en temps réel</Text>
      </View>

      <View style={styles.mapCard}>
        {Platform.OS !== 'web' ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>La carte interactive est réservée à la version Web du Dashboard.</Text>
          </View>
        ) : loading ? (
          <View style={styles.emptyState}>
             <ActivityIndicator size="large" color={COLORS.primary} />
             <Text style={[styles.emptyText, {marginTop: SPACING.md}]}>Chargement de la carte...</Text>
          </View>
        ) : (
          <MapViewSection geoSignalements={geoSignalements} />
        )}
      </View>
    </View>
  );
}

// Map View (Web Only)
function MapViewSection({ geoSignalements }) {
  try {
    const { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } = require('react-leaflet');
    const { BaseLayer } = LayersControl;
    require('leaflet/dist/leaflet.css');
    const L = require('leaflet');

    // Auto Center
    function AutoCenter({ data }) {
      const map = useMap();
      React.useEffect(() => {
        const liveS = data.find(s => s.is_live);
        if (liveS) {
          map.setView([liveS.latitude, liveS.longitude], 15, { animate: true });
        }
      }, [data, map]);
      return null;
    }

    // Default icon
    const defaultIcon = new L.Icon({
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    // Custom Live Marker
    const liveIcon = new L.DivIcon({
      className: 'custom-live-marker',
      html: `<div style="background-color: #DC2626; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; animation: pulse 1.5s infinite; box-shadow: 0 0 12px #DC2626;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    // Custom status markers (using SVG in DivIcon)
    const getStatusIcon = (statut) => {
      let color = '#3B82F6'; // default blue
      if (statut === 'en_cours') color = '#F59E0B'; // orange
      if (statut === 'traite') color = '#10B981'; // green
      if (statut === 'non_traite') color = '#EF4444'; // red
      
      return new L.DivIcon({
        className: 'custom-status-marker',
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -10],
      });
    };

    const center = geoSignalements.length > 0
      ? [geoSignalements[0].latitude, geoSignalements[0].longitude]
      : [13.5116, 2.1254];

    return (
      <View style={{ flex: 1, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.6; }
            100% { transform: scale(1); opacity: 1; }
          }
          .leaflet-popup-content-wrapper {
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            padding: 4px;
          }
          .leaflet-popup-content {
            margin: 12px;
          }
          .custom-popup-title {
            font-size: 16px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 6px;
            font-family: 'Inter', system-ui, sans-serif;
          }
          .custom-popup-category {
            font-size: 12px;
            color: #6B7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          .custom-popup-status {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            background-color: #F3F4F6;
          }
        `}</style>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 1 }}>
          <LayersControl position="topright">
            <BaseLayer checked name="Plan Standard (OSM)">
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                attribution='&copy; OpenStreetMap contributors'
              />
            </BaseLayer>
            <BaseLayer name="Vue Satellite (Esri)">
              <TileLayer 
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
                attribution='Tiles &copy; Esri'
              />
            </BaseLayer>
            <BaseLayer name="CartoDB Positron (Clair)">
              <TileLayer 
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
                attribution='&copy; CartoDB'
              />
            </BaseLayer>
          </LayersControl>
          
          <AutoCenter data={geoSignalements} />
          
          {geoSignalements.map((s, i) => (
            <Marker
              key={s.id || i}
              position={[s.latitude, s.longitude]}
              icon={s.is_live ? liveIcon : getStatusIcon(s.statut)}
            >
              <Popup>
                <div className="custom-popup-title">
                  {s.is_live ? '🔴 LIVE : ' : ''}{s.titre}
                </div>
                <div className="custom-popup-category">
                  {s.categorie}
                </div>
                <div className="custom-popup-status">
                  {s.statut === 'non_traite' ? '🔴 Non Traité' : s.statut === 'en_cours' ? '🟠 En Cours' : '🟢 Traité'}
                </div>
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#4B5563' }}>
                  Auteur: {s.utilisateur?.prenom || s.auteur?.prenom || 'Citoyen'}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </View>
    );

  } catch (err) {
    return (
      <View style={styles.emptyState}>
        <Text>Erreur de chargement de la carte (Leaflet introuvable)</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: SPACING.xl,
  },
  header: {
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
  mapCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.sm, // Less padding to maximize map area
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
  }
});
