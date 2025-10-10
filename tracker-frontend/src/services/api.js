import axios from 'axios'

// ✅ Backend runs on port 8080
export const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:8080/api'

export const API = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 10000,
})

// ✅ Set auth token in headers
export function setAuthToken(token) {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('token', token)
  } else {
    delete API.defaults.headers.common['Authorization']
    localStorage.removeItem('token')
  }
}

// ✅ Auto-restore token on page load
export function initAuth() {
  const token = localStorage.getItem('token')
  if (token) {
    setAuthToken(token)
  }
  return token
}

// ✅ Request interceptor
API.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => Promise.reject(error)
)

// ✅ Response interceptor for 401 handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] Unauthorized - clearing token')
      setAuthToken(null)
    }
    return Promise.reject(error)
  }
)

// ✅ API helper functions
export const api = {
  // Auth
  login: (credentials) => API.post('/auth/login', credentials),
  register: (data) => API.post('/auth/register', data),
  registerOnce: (data) => API.post('/auth/register-once', data),
  updateProfile: (data) => API.patch('/auth/profile', data),
  getUsers: () => API.get('/auth/users'),
  updateUserRole: (userId, role) => API.patch(`/auth/users/${userId}/role`, { role }),

  // Episodes
  getEpisodes: () => API.get('/episodes'),
  getEpisode: (episodeId) => API.get(`/episodes/${episodeId}`),
  createEpisode: (data) => API.post('/episodes', data),
  updateEpisode: (episodeId, data) => API.patch(`/episodes/${episodeId}`, data),
  deleteEpisode: (episodeId) => API.delete(`/episodes/${episodeId}`),

  // Maps
  getMaps: (episodeNumber) => API.get('/maps', { params: { episodeNumber } }),
  createMap: (data) => API.post('/maps', data),
  updateMap: (id, data) => API.patch(`/maps/${id}`, data),
  deleteMap: (id) => API.delete(`/maps/${id}`),
  getFavoriteMaps: () => API.get('/maps/favorites'),
  addFavorite: (mapId) => API.post(`/maps/${mapId}/favorite`),
  removeFavorite: (mapId) => API.delete(`/maps/${mapId}/favorite`),

  // Trackers
  getTrackers: (params) => API.get('/trackers', { params }),
  createTracker: (data) => API.post('/trackers', data),
  updateTracker: (id, data) => API.patch(`/trackers/${id}`, data),
  deleteTracker: (id) => API.delete(`/trackers/${id}`),

  // Chat
  getChatHistory: (params) => API.get('/chat/history', { params }),
  getChatStats: () => API.get('/chat/stats'),
  sendMessage: (content) => API.post('/chat/send', { content }),
  deleteMessage: (id) => API.delete(`/chat/${id}`),
}

export default API