import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/home";
import RewardsDashboard from "./components/rewards/RewardsDashboard";
import TripsPage from "./components/trips/TripsPage";
import WishlistsPage from "./components/wishlists/WishlistsPage";
import HostLayout from "./components/host/HostLayout";
import HostDashboard from "./components/host/HostDashboard";
import CreateListing from "./components/host/CreateListing";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/toaster";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

import HostListings from "./components/host/HostListings";
import HostSettings from "./components/host/HostSettings";

import HostCalendar from "./components/host/HostCalendar";
import InboxPage from "./components/inbox/InboxPage";
import HostInbox from "./components/host/HostInbox";

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<p>Loading...</p>}>
        <>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rewards" element={
              <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <RewardsDashboard />
                <Footer />
              </div>
            } />
            <Route path="/trips" element={
              <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <TripsPage />
                <Footer />
              </div>
            } />
            <Route path="/wishlists" element={
              <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <WishlistsPage />
                <Footer />
              </div>
            } />
            <Route path="/inbox" element={
              <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <InboxPage />
                <Footer />
              </div>
            } />
            <Route path="/inbox/:bookingId" element={
              <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <InboxPage />
                <Footer />
              </div>
            } />
            
            {/* Host Routes */}
            <Route path="/host" element={<HostLayout />}>
              <Route index element={<HostDashboard />} />
              <Route path="create" element={<CreateListing />} />
              <Route path="listings" element={<HostListings />} />
              <Route path="calendar" element={<HostCalendar />} />
              <Route path="inbox" element={<HostInbox />} />
              <Route path="inbox/:bookingId" element={<HostInbox />} />
              <Route path="settings" element={<HostSettings />} />
            </Route>
          </Routes>
        </>
      </Suspense>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
