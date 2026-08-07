import { Routes, Route } from 'react-router-dom'
import Intro from './pages/Intro'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import VoiceListing from './pages/VoiceListing'
import VoiceConfirm from './pages/VoiceConfirm'
import FairPrice from './pages/FairPrice'
import ListingPublished from './pages/ListingPublished'
import MyListings from './pages/MyListings'
import BuyerRequests from './pages/BuyerRequests'
import OrderDetails from './pages/OrderDetails'
import Escrow from './pages/Escrow'
import DeliveryConfirmation from './pages/DeliveryConfirmation'
import PaymentReceived from './pages/PaymentReceived'
import Wallet from './pages/Wallet'
import OrderHistory from './pages/OrderHistory'
import Settings from './pages/Settings'
import Help from './pages/Help'
import { Notifications, Profile } from './pages/Stubs'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Intro />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="/voice" element={<VoiceListing />} />
      <Route path="/voice/confirm" element={<VoiceConfirm />} />
      <Route path="/voice/fair-price" element={<FairPrice />} />
      <Route path="/voice/published" element={<ListingPublished />} />

      <Route path="/listings" element={<MyListings />} />
      <Route path="/requests" element={<BuyerRequests />} />
      <Route path="/orders" element={<OrderHistory />} />
      <Route path="/orders/:id" element={<OrderDetails />} />
      <Route path="/escrow/:id" element={<Escrow />} />
      <Route path="/delivery/:id" element={<DeliveryConfirmation />} />
      <Route path="/payment-received/:id" element={<PaymentReceived />} />

      <Route path="/wallet" element={<Wallet />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/help" element={<Help />} />
    </Routes>
  )
}
