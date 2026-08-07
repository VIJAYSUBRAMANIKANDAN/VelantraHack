import { create } from 'zustand'
import { authApi, listingsApi } from '../lib/api'

// Global app state: auth, language, listings, in-progress voice listing
// draft. Every action below tries the real backend first (see src/lib/api.js)
// and falls back to local mock state if the request fails — so the app
// keeps working standalone (e.g. backend not running yet, or offline demo).
export const useStore = create((set, get) => ({
  language: 'en',
  setLanguage: (language) => set({ language }),

  user: null, // { name, phone, village, district, kycStatus }
  isAuthenticated: false,

  login: async ({ phone, password, name, village, district }) => {
    try {
      const { data } = await authApi.login({ phone, password })
      localStorage.setItem('velantra_token', data.access_token)
      set({ user: { name, phone, village, district }, isAuthenticated: true })
      return { ok: true }
    } catch (err) {
      // Fallback: no backend reachable — proceed with local mock session
      // so the UI flow keeps working during frontend-only development.
      set({ user: { name, phone, village, district }, isAuthenticated: true })
      return { ok: true, offline: true, message: err.message }
    }
  },

  register: async (payload) => {
    try {
      const { data } = await authApi.register(payload)
      localStorage.setItem('velantra_token', data.access_token)
      set({ user: { name: payload.full_name, village: payload.village, district: payload.district, kycStatus: 'pending' }, isAuthenticated: true })
      return { ok: true }
    } catch (err) {
      set({ user: { name: payload.full_name, village: payload.village, district: payload.district, kycStatus: 'pending' }, isAuthenticated: true })
      return { ok: true, offline: true, message: err.message }
    }
  },

  logout: () => {
    localStorage.removeItem('velantra_token')
    set({ user: null, isAuthenticated: false })
  },

  stats: { activeListings: 3, orders: 2, earnings: 18400, wallet: 6200 },

  listings: [
    { id: 'VL-1042', crop: 'Tomatoes', quantity: 500, unit: 'kg', price: 25, location: 'Salem', status: 'active', views: 34, interest: 5, image: '🍅' },
    { id: 'VL-1039', crop: 'Onions', quantity: 800, unit: 'kg', price: 18, location: 'Salem', status: 'active', views: 21, interest: 2, image: '🧅' },
    { id: 'VL-1021', crop: 'Turmeric', quantity: 150, unit: 'kg', price: 92, location: 'Erode', status: 'paused', views: 12, interest: 1, image: '🌾' },
  ],

  fetchListings: async () => {
    try {
      const { data } = await listingsApi.mine()
      if (Array.isArray(data)) {
        set({ listings: data.map((l) => ({ ...l, id: l.id?.toString?.() ?? l.id, crop: l.crop_name, price: l.expected_price, image: '🌱' })) })
      }
    } catch {
      // Backend not reachable — keep whatever's already in local state.
    }
  },

  setListingStatus: async (id, status) => {
    set({ listings: get().listings.map((l) => (l.id === id ? { ...l, status } : l)) })
    try { await listingsApi.setStatus(id, status) } catch { /* local-only fallback */ }
  },

  removeListing: async (id) => {
    set({ listings: get().listings.filter((l) => l.id !== id) })
    try { await listingsApi.remove(id) } catch { /* local-only fallback */ }
  },

  draftListing: null,
  setDraftListing: (draft) => set({ draftListing: draft }),

  confirmDraftListing: async () => {
    const { draftListing, listings } = get()
    if (!draftListing) return null

    let newListing = {
      id: `VL-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'active',
      views: 0,
      interest: 0,
      image: '🌱',
      ...draftListing,
    }

    try {
      const { data } = await listingsApi.create({
        crop_name: draftListing.crop,
        quantity: Number(draftListing.quantity),
        unit: draftListing.unit || 'kg',
        location: draftListing.location,
        expected_price: Number(draftListing.price),
        crop_quality: draftListing.quality,
      })
      newListing = { ...newListing, id: data.id?.toString?.() ?? newListing.id }
    } catch {
      // Backend not reachable — the locally generated listing above stands in.
    }

    set({ listings: [newListing, ...listings], draftListing: null })
    return newListing
  },
}))
