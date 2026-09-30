import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Configuration dynamique pour l'accès réseau local (téléphone physique) vs Web
const debuggerHost = Constants.expoConfig?.hostUri;
const localIp = debuggerHost ? debuggerHost.split(':')[0] : '10.10.8.8';

const API_BASE_URL = 'https://civic-gobe-mvp.onrender.com/api/v1';

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
// Web FormData Normalizer
// ============================
// React Native's FormData polyfill stores entries in `_parts` as [[key, value], ...].
// The browser's fetch() cannot serialize RN's { uri, name, type } file objects.
// This function converts them to real Blob/File objects that work on web.
async function normalizeFormDataForWeb(formData) {
  if (Platform.OS !== 'web') return formData;

  try {
    // RN's FormData polyfill uses _parts internally
    const parts = formData._parts;
    
    if (parts && Array.isArray(parts)) {
      // Rebuild a clean FormData from RN polyfill's internal _parts
      const webFormData = new FormData();
      
      for (const part of parts) {
        const key = part[0];
        const value = part[1];
        
        if (value && typeof value === 'object' && !(value instanceof Blob) && value.uri) {
          // Convert RN-style { uri, name, type } -> Blob
          try {
            const response = await fetch(value.uri);
            const blob = await response.blob();
            webFormData.append(key, blob, value.name || 'file');
          } catch (err) {
            console.warn(`[normalizeFormData] Failed to convert ${key}:`, err);
          }
        } else {
          webFormData.append(key, value);
        }
      }
      return webFormData;
    }
    
    // If no _parts (native browser FormData), check entries() 
    if (typeof formData.entries === 'function') {
      const webFormData = new FormData();
      for (const [key, value] of formData.entries()) {
        if (value && typeof value === 'object' && !(value instanceof Blob) && value.uri) {
          try {
            const response = await fetch(value.uri);
            const blob = await response.blob();
            webFormData.append(key, blob, value.name || 'file');
          } catch (err) {
            console.warn(`[normalizeFormData] Failed to convert ${key}:`, err);
          }
        } else {
          webFormData.append(key, value);
        }
      }
      return webFormData;
    }
  } catch (err) {
    console.warn('[normalizeFormData] Normalization failed, using original FormData:', err);
  }
  
  return formData;
}

// ============================
// Mobile Multipart Upload via XMLHttpRequest
// ============================
// On RN 0.86+ / Expo SDK 57, fetch() cannot serialize { uri, name, type } FormData parts
// ("Unsupported FormDataPart implementation") and Blob doesn't support ArrayBuffer.
// XMLHttpRequest handles { uri, name, type } objects natively on React Native.
function uploadWithXHR(url, formData, headers, method = 'POST') {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    
    // Set headers (skip Content-Type - XHR sets multipart boundary automatically)
    Object.keys(headers).forEach(key => {
      if (key.toLowerCase() !== 'content-type') {
        xhr.setRequestHeader(key, headers[key]);
      }
    });

    xhr.onload = () => {
      if (xhr.status === 204 || !xhr.responseText) {
        resolve(null);
        return;
      }
      
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject({
            status: xhr.status,
            data,
            message: data.error || data.detail || 'Une erreur est survenue',
          });
        }
      } catch (e) {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.responseText);
        } else {
          reject({
            status: xhr.status,
            message: 'Erreur serveur: ' + xhr.status,
          });
        }
      }
    };

    xhr.onerror = () => {
      reject({
        status: 0,
        message: 'Impossible de se connecter au serveur. Vérifiez votre connexion.',
      });
    };

    xhr.ontimeout = () => {
      reject({
        status: 0,
        message: 'Délai d\'attente dépassé. Le serveur est injoignable.',
      });
    };

    xhr.timeout = 120000; // 2 minutes for uploads
    xhr.send(formData);
  });
}

// ============================
// Requête HTTP générique
// ============================
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // --- Séparer nos options custom des options fetch ---
  const {
    isMultipart = false,
    authenticated,
    _isRetry = false,
    headers: customHeaders = {},
    ...restOptions // method, body uniquement
  } = options;

  // --- Construire les headers ---
  const headers = { ...customHeaders };

  // CRITIQUE: Pour FormData/multipart, NE JAMAIS définir Content-Type.
  // React Native/fetch génère automatiquement le boundary multipart.
  if (!isMultipart && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Ajouter le token JWT si disponible
  if (authenticated !== false) {
    const token = await getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // ===== MOBILE MULTIPART: Use XHR instead of fetch =====
  if (isMultipart && Platform.OS !== 'web' && restOptions.body) {
    try {
      console.log(`[API XHR ${restOptions.method || 'POST'}] ${url} (multipart)`);
      const result = await uploadWithXHR(url, restOptions.body, headers, restOptions.method || 'POST');
      return result;
    } catch (error) {
      if (error.status === 401 && !_isRetry) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return request(endpoint, { ...options, _isRetry: true });
        }
      }
      throw error;
    }
  }

  // ===== WEB & NON-MULTIPART: Use fetch =====
  const fetchOptions = {
    method: restOptions.method || 'GET',
    headers,
  };

  // Ajouter le body seulement s'il existe
  if (restOptions.body !== undefined) {
    // Normalize FormData for web (convert { uri, name, type } -> Blob/File)
    if (isMultipart && (restOptions.body instanceof FormData || restOptions.body?._parts)) {
      fetchOptions.body = await normalizeFormDataForWeb(restOptions.body);
    } else {
      fetchOptions.body = restOptions.body;
    }
  }

  // --- Timeout: plus long pour les uploads multipart ---
  let controller = null;
  let timeoutId = null;

  // Pour les requêtes NON multipart : timeout 30s avec AbortController
  // Pour les requêtes multipart : timeout 120s SANS AbortController 
  // (AbortController + FormData = crash sur React Native Android)
  if (!isMultipart) {
    controller = new AbortController();
    fetchOptions.signal = controller.signal;
    // 60s pour les requêtes JSON (uploadFrame envoie du base64 volumineux)
    timeoutId = setTimeout(() => controller.abort(), 60000);
  }

  try {
    console.log(`[API ${fetchOptions.method}] ${url} ${isMultipart ? '(multipart)' : ''}`);
    
    const response = await fetch(url, fetchOptions);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    let text = '';
    try {
      text = await response.text();
      
      // If no content (e.g., 204 No Content for DELETE), return null instead of parsing
      if (response.status === 204 || !text) {
        return null;
      }
      
      const data = JSON.parse(text);

      if (!response.ok) {
        if (response.status === 401 && !_isRetry) {
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
    if (timeoutId) clearTimeout(timeoutId);
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

  patchPublication(id, data) {
    const isFormData = data instanceof FormData || (data && data._parts);
    return request(`/publications/${id}/`, {
      method: 'PATCH',
      body: isFormData ? data : JSON.stringify(data),
      isMultipart: !!isFormData,
    });
  },

  deletePublication(id) {
    return request(`/publications/${id}/`, {
      method: 'DELETE',
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
  createSavoirCategory(nom) {
    return request('/savoir/categories/', {
      method: 'POST',
      body: JSON.stringify({ nom })
    });
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

  patchSavoir(id, data) {
    const isFormData = data instanceof FormData || (data && data._parts);
    return request(`/savoir/${id}/`, {
      method: 'PATCH',
      body: isFormData ? data : JSON.stringify(data),
      isMultipart: !!isFormData,
    });
  },

  deleteSavoir(id) {
    return request(`/savoir/${id}/`, {
      method: 'DELETE',
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
