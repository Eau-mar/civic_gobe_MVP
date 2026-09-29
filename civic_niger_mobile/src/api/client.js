import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration dynamique pour l'accès réseau local (téléphone physique) vs Web
const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://127.0.0.1:8000/api/v1' 
  : 'http://10.10.8.18:8000/api/v1';

const TOKEN_KEY = 'civic_access_token';
const REFRESH_KEY = 'civic_refresh_token';

// In-memory fallback for offline Expo Go issues
let memoryStorage = {};

async function safeSetItem(key, value) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    memoryStorage[key] = value;
  }
}

async function safeGetItem(key) {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    return memoryStorage[key] || null;
  }
}

async function safeRemoveItem(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    delete memoryStorage[key];
  }
}

// ============================
// Stockage des tokens
// ============================
export async function storeTokens(access, refresh) {
  await Promise.all([
    safeSetItem(TOKEN_KEY, access),
    safeSetItem(REFRESH_KEY, refresh),
  ]);
}

export async function getAccessToken() {
  return await safeGetItem(TOKEN_KEY);
}

export async function getRefreshToken() {
  return await safeGetItem(REFRESH_KEY);
}

export async function clearTokens() {
  await Promise.all([
    safeRemoveItem(TOKEN_KEY),
    safeRemoveItem(REFRESH_KEY),
  ]);
}

// ============================
// Requête HTTP générique
// ============================
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    ...options.headers,
  };
  
  if (!options.isMultipart && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Ajouter le token JWT si disponible
  if (options.authenticated !== false) {
    const token = await getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const fetchOptions = {
      ...options,
      headers,
    };

    // BUG FIX: AbortController avec FormData fait planter fetch sur React Native Android (Network Request Failed)
    let timeoutId;
    if (!options.isMultipart) {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000);
      fetchOptions.signal = controller.signal;
    }

    const response = await fetch(url, fetchOptions);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    let text = '';
    try {
      text = await response.text();
      const data = JSON.parse(text);

      if (!response.ok) {
        if (response.status === 401 && !options._isRetry) {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            return request(endpoint, { ...options, _isRetry: true });
          }
        }
        throw {
          status: response.status,
          data,
          message: data.error || data.detail || 'Une erreur est survenue',
        };
      }
      return data;
    } catch (parseError) {
      if (parseError.status) throw parseError; // Already handled API error
      console.error("API Parse Error or HTML Response:", response.status, text.substring(0, 500));
      throw {
        status: response.status,
        message: 'Erreur serveur: ' + response.status,
      };
    }
  } catch (error) {
    console.error("Network or Fetch Error:", error);
    if (error.name === 'AbortError') {
      throw {
        status: 0,
        message: 'Délai d\'attente dépassé. Le serveur est injoignable.',
      };
    }
    if (error.status) throw error;
    throw {
      status: 0,
      message: 'Impossible de se connecter au serveur. Vérifiez votre connexion.',
    };
  }
}

// ============================
// Refresh Token
// ============================
async function refreshAccessToken() {
  const refresh = await getRefreshToken();
  if (!refresh) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/users/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) {
      await clearTokens();
      return false;
    }

    const data = await response.json();
    await AsyncStorage.setItem(TOKEN_KEY, data.access);
    return true;
  } catch {
    await clearTokens();
    return false;
  }
}

// ============================
// API Endpoints
// ============================
export const api = {
  // Auth
  register(data) {
    return request('/users/register/', {
      method: 'POST',
      body: JSON.stringify(data),
      authenticated: false,
    });
  },

  login(telephone, password) {
    return request('/users/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username: telephone, telephone, password }),
      authenticated: false,
    });
  },

  // Password Reset
  requestResetCode(telephone) {
    return request('/users/password/request/', {
      method: 'POST',
      body: JSON.stringify({ telephone }),
      authenticated: false,
    });
  },

  verifyResetCode(telephone, code) {
    return request('/users/password/verify/', {
      method: 'POST',
      body: JSON.stringify({ telephone, code }),
      authenticated: false,
    });
  },

  resetPassword(telephone, new_password) {
    return request('/users/password/reset/', {
      method: 'POST',
      body: JSON.stringify({ telephone, new_password }),
      authenticated: false,
    });
  },

  // Profil
  getMe() {
    return request('/users/me/');
  },

  updateMe(data) {
    return request('/users/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Ministères
  getMinisteres() {
    return request('/users/ministeres/', {
      authenticated: false,
    });
  },

  getPublications() {
    return request('/publications/');
  },
  
  createPublication(data) {
    const isFormData = data instanceof FormData || (data && data._parts);
    return request('/publications/', {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      isMultipart: !!isFormData,
    });
  },

  // Signalements
  getSignalements(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/signalement/${qs ? '?'+qs : ''}`);
  },
  
  getDashboardStats() {
    return request('/signalement/stats/');
  },
  
  getSignalement(id) {
    return request(`/signalement/${id}/`);
  },
  
  // Mixed Feed Aggregation
  async getFeedPaginated(page = 1, filterType = 'tout', searchQuery = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      type: filterType,
      search: searchQuery
    });
    
    // Fallback: If the backend endpoint fails (e.g., if civicTech app isn't fully migrated), 
    // it will throw and we can handle it in the UI.
    return request(`/feed/?${params.toString()}`);
  },
  
  createSignalement(data) {
    const isFormData = data instanceof FormData || (data && data._parts);
    return request('/signalement/', {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      isMultipart: !!isFormData,
    });
  },

  patchSignalement(id, data) {
    return request(`/signalement/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  deleteSignalement(id) {
    return request(`/signalement/${id}/`, {
      method: 'DELETE',
    });
  },

  // --- LIVE STREAMING (CivicLive) ---
  uploadFrame(id, base64Data, lat, lon) {
    const payload = {
      image_base64: base64Data,
      latitude: lat || null,
      longitude: lon || null,
    };

    return request(`/signalement/${id}/upload-frame/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getLatestFrame(id) {
    return request(`/signalement/${id}/latest-frame/`);
  },

  // --- SAVOIR CITOYEN ---
  getSavoirCategories() {
    return request('/savoir/categories/');
  },
  
  getSavoirs() {
    return request('/savoir/');
  },

  createSavoir(data) {
    const isFormData = data instanceof FormData || (data && data._parts);
    return request('/savoir/', {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      isMultipart: !!isFormData,
    });
  },
  
  // --- VOIX DU PEUPLE ---
  getVoix(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/voix/${qs ? '?'+qs : ''}`);
  },
  
  deleteVoix(id) {
    return request(`/voix/${id}/`, {
      method: 'DELETE',
    });
  },
  
  createVoix(data) {
    // data can be an object {titre, contenu} or a FormData (with audio)
    const isFormData = data instanceof FormData || (data && data._parts);
    return request('/voix/', {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      isMultipart: !!isFormData,
    });
  },

  patchVoix(id, data) {
    const isFormData = data instanceof FormData || (data && data._parts);
    return request(`/voix/${id}/`, {
      method: 'PATCH',
      body: isFormData ? data : JSON.stringify(data),
      isMultipart: !!isFormData,
    });
  },
  
  voteVoix(id, choix) {
    // choix = 'pour' ou 'contre'
    return request(`/voix/${id}/vote/`, {
      method: 'POST',
      body: JSON.stringify({ choix }),
    });
  },
  
  getCommentaires(voixId) {
    return request(`/voix/${voixId}/commentaires/`);
  },
  
  getReponses(commentaireId) {
    return request(`/voix/commentaires/${commentaireId}/reponses/`);
  },
  
  addCommentaire(voixId, contenu, parentId = null) {
    const payload = { 
      publication: voixId, 
      contenu 
    };
    if (parentId) payload.parent = parentId;
    
    return request('/voix/commentaires/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getLatestFrame(id) {
    return request(`/signalement/${id}/latest-frame/`);
  },

  endLive(id) {
    return request(`/signalement/${id}/end-live/`, {
      method: 'POST',
    });
  },
};

export { API_BASE_URL };
export default api;
