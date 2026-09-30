import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, Pressable, Dimensions } from 'react-native';
import { Maximize, Minimize } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';
import api from '../../api/client';

export default function CarteLiveScreen({ navigation }) {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

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
  
  // Stats
  const totalGeo = geoSignalements.length;
  const liveCount = geoSignalements.filter(s => s.is_live).length;
  const nonTraites = geoSignalements.filter(s => s.statut === 'non_traite').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Carte Interactive Live</Text>
          <Text style={styles.pageSubtitle}>Visualisez et pilotez les incidents géolocalisés en temps réel</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: COLORS.primary, borderLeftWidth: 4 }]}>
          <Text style={styles.statLabel}>Incidents Cartographiés</Text>
          <Text style={styles.statValue}>{totalGeo}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.error, borderLeftWidth: 4 }]}>
          <Text style={styles.statLabel}>Non Traités</Text>
          <Text style={styles.statValue}>{nonTraites}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#DC2626', borderLeftWidth: 4, backgroundColor: '#FEF2F2' }]}>
          <Text style={styles.statLabel}>🔴 Diffusions Live</Text>
          <Text style={[styles.statValue, { color: '#DC2626' }]}>{liveCount}</Text>
        </View>
      </View>

      <View style={isFullScreen ? styles.mapCardFullScreen : styles.mapCard}>
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
          <MapViewSection 
            geoSignalements={geoSignalements} 
            navigation={navigation}
            isFullScreen={isFullScreen}
            setIsFullScreen={setIsFullScreen}
          />
        )}
      </View>
    </View>
  );
}

// Map View (Web Only)
function MapViewSection({ geoSignalements, navigation, isFullScreen, setIsFullScreen }) {
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
      <View style={{ flex: 1, borderRadius: isFullScreen ? 0 : RADIUS.lg, overflow: 'hidden' }}>
        <Pressable 
          style={styles.fullScreenBtn}
          onPress={() => setIsFullScreen(!isFullScreen)}
        >
          {isFullScreen ? <Minimize color={COLORS.dark} size={24} /> : <Maximize color={COLORS.dark} size={24} />}
        </Pressable>
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
          .custom-live-btn {
            display: block;
            width: 100%;
            margin-top: 12px;
            background-color: #DC2626;
            color: white;
            text-align: center;
            padding: 8px 0;
            border-radius: 6px;
            font-weight: bold;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .custom-live-btn:hover {
            background-color: #B91C1C;
          }
          /* Custom style for expanded layer control */
          .leaflet-control-layers-expanded {
            padding: 12px 16px !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
            border: none !important;
            font-family: 'Inter', system-ui, sans-serif !important;
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(8px) !important;
          }
          .leaflet-control-layers-base label {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            cursor: pointer;
          }
          .leaflet-control-layers-base label:last-child {
            margin-bottom: 0;
          }
          .leaflet-control-layers-base input[type="radio"] {
            margin-right: 10px;
            accent-color: #3B82F6;
            width: 16px;
            height: 16px;
            cursor: pointer;
          }
        `}</style>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 1 }}>
          <LayersControl position="topright" collapsed={false}>
            <BaseLayer name="Plan Standard (OSM)">
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                attribution='&copy; OpenStreetMap contributors'
              />
            </BaseLayer>
            <BaseLayer checked name="Vue Satellite (Google)">
              <TileLayer 
                url="https://mt0.google.com/vt/lyrs=y&hl=fr&x={x}&y={y}&z={z}" 
                attribution='&copy; Google'
              />
            </BaseLayer>
            <BaseLayer name="Plan Clair (CartoDB)">
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
                {s.is_live && (
                  <button 
                    className="custom-live-btn"
                    onClick={() => navigation.navigate('LiveViewerAuthority', { signalementId: s.id })}
                  >
                    ▶ Regarder le direct
                  </button>
                )}
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
  mapCardFullScreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: COLORS.surface,
  },
  fullScreenBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 10,
    borderRadius: 12,
    ...SHADOWS.md,
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
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  statLabel: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  statValue: {
    ...FONTS.h2,
    color: COLORS.dark,
  }
});
