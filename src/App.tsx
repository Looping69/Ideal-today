import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
const Home = lazy(() => import("./components/home"));
const RewardsDashboard = lazy(() => import("./components/rewards/RewardsDashboard"));
const TripsPage = lazy(() => import("./components/trips/TripsPage"));
const WishlistsPage = lazy(() => import("./components/wishlists/WishlistsPage"));
const HostLayout = lazy(() => import("./components/host/HostLayout"));
const HostDashboard = lazy(() => import("./components/host/HostDashboard"));
const CreateListing = lazy(() => import("./components/host/CreateListing"));
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { Toaster } from "./components/ui/toaster";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import { Analytics } from "@vercel/analytics/react";

const HostListings = lazy(() => import("./components/host/HostListings"));
const HostBookings = lazy(() => import("./components/host/HostBookings"));
const HostSettings = lazy(() => import("./components/host/HostSettings"));
const HostGuests = lazy(() => import("./components/host/HostGuests"));
const HostOperations = lazy(() => import("./components/host/HostOperations"));
const HostReports = lazy(() => import("./components/host/HostReports"));
const HostVerification = lazy(() => import("./components/host/HostVerification"));
const HostSubscription = lazy(() => import("./components/host/HostSubscription"));

const HostCalendar = lazy(() => import("./components/host/HostCalendar"));
const InboxPage = lazy(() => import("./components/inbox/InboxPage"));
const HostInbox = lazy(() => import("./components/host/HostInbox"));
const AccountPage = lazy(() => import("./components/account/AccountPage"));
const TermsOfService = lazy(() => import("./components/legal/TermsOfService"));
const HostAgreement = lazy(() => import("./components/legal/HostAgreement"));
const GuestAgreement = lazy(() => import("./components/legal/GuestAgreement"));
const LiabilityWaiver = lazy(() => import("./components/legal/LiabilityWaiver"));
const CancellationPolicy = lazy(() => import("./components/legal/CancellationPolicy"));
const PrivacyPolicy = lazy(() => import("./components/legal/PrivacyPolicy"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminOverview = lazy(() => import("./components/admin/AdminOverview"));
const AdminUsers = lazy(() => import("./components/admin/AdminUsers"));
const AdminListings = lazy(() => import("./components/admin/AdminListings"));
const AdminReviews = lazy(() => import("./components/admin/AdminReviews"));
const AdminBookings = lazy(() => import("./components/admin/AdminBookings"));
const AdminReferrals = lazy(() => import("./components/admin/AdminReferrals"));
const AdminRewards = lazy(() => import("./components/admin/AdminRewards"));
const AdminSettings = lazy(() => import("./components/admin/AdminSettings"));
const AdminNotifications = lazy(() => import("./components/admin/AdminNotifications"));

const PaymentPage = lazy(() => import("./components/payment/PaymentPage"));

import DevelopmentLanding from "./components/DevelopmentLanding";
import { useState } from "react";

function App() {
  const [hasEntered, setHasEntered] = useState(() => {
    return sessionStorage.getItem("hasEnteredPreview") === "true";
  });

  if (!hasEntered) {
    return <DevelopmentLanding onEnter={() => {
      sessionStorage.setItem("hasEnteredPreview", "true");
      setHasEntered(true);
    }} />;
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <Suspense fallback={<p>Loading...</p>}>
          <>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/book" element={<PaymentPage />} />
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


              <Route path="/account" element={
                <div className="min-h-screen bg-white flex flex-col">
                  <Header />
                  <AccountPage />
                  <Footer />
                </div>
              } />

              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/host-agreement" element={<HostAgreement />} />
              <Route path="/guest-agreement" element={<GuestAgreement />} />
              <Route path="/liability-waiver" element={<LiabilityWaiver />} />
              <Route path="/cancellation-policy" element={<CancellationPolicy />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />


              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="listings" element={<AdminListings />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="referrals" element={<AdminReferrals />} />
                <Route path="rewards" element={<AdminRewards />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Host Routes */}
              <Route path="/host" element={<HostLayout />}>
                <Route index element={<HostDashboard />} />
                <Route path="create" element={<CreateListing />} />
                <Route path="listings" element={<HostListings />} />
                <Route path="bookings" element={<HostBookings />} />
                <Route path="calendar" element={<HostCalendar />} />
                <Route path="guests" element={<HostGuests />} />
                <Route path="operations" element={<HostOperations />} />
                <Route path="reports" element={<HostReports />} />
                <Route path="inbox" element={<HostInbox />} />
                <Route path="inbox/:bookingId" element={<HostInbox />} />
                <Route path="verification" element={<HostVerification />} />
                <Route path="settings" element={<HostSettings />} />
                <Route path="subscription" element={<HostSubscription />} />
              </Route>
            </Routes>
          </>
        </Suspense>
        <Toaster />
        <Analytics />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
