import axios from 'axios'

// Base URL for the FastAPI backend. Override via a .env file:
// VITE_API_URL=http://localhost:8000
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL: BASE_URL, timeout: 15000 })

// Attach the JWT (if present) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('velantra_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Every Velantra endpoint responds { success, data, message } — unwrap it
// here so callers just get `data` back, and throw a plain Error with the
// server's message on failure so callers can show it directly.
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || err.response?.data?.detail || err.message
    return Promise.reject(new Error(message))
  }
)

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  sendOtp: (phone) => api.post('/auth/send-otp', null, { params: { phone } }),
}

export const voiceApi = {
  transcribe: (audioBlob) => {
    const form = new FormData()
    form.append('audio', audioBlob, 'listing.wav')
    return api.post('/voice/transcribe', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

export const listingsApi = {
  create: (payload) => api.post('/listings', payload),
  mine: () => api.get('/listings'),
  fairPrice: (payload) => api.post('/listings/fair-price', payload),
  setStatus: (id, status) => api.patch(`/listings/${id}/status`, null, { params: { status } }),
  remove: (id) => api.delete(`/listings/${id}`),
}

export const marketApi = {
  insights: (city) => api.get('/listings/market-insights', { params: city ? { city } : {} }),
}

export const ordersApi = {
  buyerRequests: () => api.get('/buyer-requests'),
  respond: (id, action) => api.patch(`/buyer-requests/${id}`, null, { params: { action } }),
  list: (status) => api.get('/orders', { params: status ? { status } : {} }),
  get: (id) => api.get(`/orders/${id}`),
  markDelivered: (id) => api.post(`/orders/${id}/deliver`),
}

export const paymentsApi = {
  createEscrow: (payload) => api.post('/payments/create-escrow', payload),
  releaseEscrow: (orderId) => api.post(`/payments/release-escrow/${orderId}`),
  getEscrow: (orderId) => api.get(`/payments/escrow/${orderId}`),
}

export const userApi = {
  profile: () => api.get('/user/profile'),
  wallet: () => api.get('/user/wallet'),
}

export const notificationsApi = {
  list: () => api.get('/notifications'),
}
