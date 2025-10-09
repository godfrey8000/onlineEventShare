import axios from 'axios'

export const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:5173/api' // 👈 adjust to backend port

export const API = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

export function setAuthToken(token) {
  if (token) API.defaults.headers.common['Authorization'] = `Bearer ${token}`
  else delete API.defaults.headers.common['Authorization']
}
