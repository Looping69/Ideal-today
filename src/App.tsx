import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
const Home = lazy(() => import("./components/home"));
const RewardsDashboard = lazy(() => import("./components/rewards/RewardsDashboard"));
const InquiriesPage = lazy(() => import("./components/trips/InquiriesPage"));
const WishlistsPage = lazy(() => import("./components/wishlists/WishlistsPage"));
const HostLayout = lazy(() => import("./components/host/HostLayout"));
const HostDashboard = lazy(() => import("./components/host/HostDashboard"));
const CreateListing = lazy(() => import("./components/host/CreateListing"));
const Diagnose = lazy(() => import("./components/Diagnose"));
const Health = lazy(() => import("./components/Health"));
const NotFound = lazy(() => import("./components/ErrorPages/NotFound"));
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { Toaster } from "./components/ui/toaster";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import ReferralTracker from "./components/ReferralTracker";
import { Analytics } from "@vercel/analytics/react";

const HostListings = lazy(() => import("./components/host/HostListings"));
const HostEnquiries = lazy(() => import("./components/host/HostEnquiries"));
const HostSettings = lazy(() => import("./components/host/HostSettings"));
const HostGuests = lazy(() => import("./components/host/HostGuests"));
const HostOperations = lazy(() => import("./components/host/HostOperations"));
const HostReports = lazy(() => import("./components/host/HostReports"));
const HostVerification = lazy(() => import("./components/host/HostVerification"));
const PricingPage = lazy(() => import("./components/host/PricingPage"));
const RegionalHostLanding = lazy(() => import("./components/host/RegionalHostLanding"));

const HostCalendar = lazy(() => import("./components/host/HostCalendar"));
const HostReferrals = lazy(() => import("./components/host/HostReferrals"));
const HostContentStudio = lazy(() => import("./components/host/HostContentStudio"));
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
const AdminPendingListings = lazy(() => import("./components/admin/AdminPendingListings"));
const AdminReviews = lazy(() => import("./components/admin/AdminReviews"));
const AdminEnquiries = lazy(() => import("./components/admin/AdminEnquiries"));
const AdminReferrals = lazy(() => import("./components/admin/AdminReferrals"));
const AdminRewards = lazy(() => import("./components/admin/AdminRewards"));
const AdminFinancials = lazy(() => import("./components/admin/AdminFinancials"));
const AdminSettings = lazy(() => import("./components/admin/AdminSettings"));
const AdminNotifications = lazy(() => import("./components/admin/AdminNotifications"));

const PaymentPage = lazy(() => import("./components/payment/PaymentPage"));
const PaymentSuccess = lazy(() => import("./components/payment/PaymentSuccess"));
const PropertyPage = lazy(() => import("./components/listings/PropertyPage"));
const DevAuth = lazy(() => import("./components/dev/DevAuth"));

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ReferralTracker />
        <Suspense fallback={<LoadingSpinner />}>
          <>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/properties/:id" element={<PropertyPage />} />
              <Route path="/health" element={<Health />} />
              <Route path="/diagnose" element={<Diagnose />} />
              <Route path="/rewards" element={
                <div className="min-h-screen bg-white flex flex-col">
                  <Header />
                  <RewardsDashboard />
                  <Footer />
                </div>
              } />
              <Route path="/inquiries" element={
                <div className="min-h-screen bg-white flex flex-col">
                  <Header />
                  <InquiriesPage />
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
              <Route path="/pricing" element={
                <div className="min-h-screen bg-white flex flex-col">
                  <Header />
                  <PricingPage />
                  <Footer />
                </div>
              } />
              <Route path="/host-with-us/:regionSlug" element={
                <div className="min-h-screen bg-white flex flex-col">
                  <Header />
                  <RegionalHostLanding />
                  <Footer />
                </div>
              } />
              <Route path="/host/subscription" element={<Navigate to="/pricing?audience=host" replace />} />
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

              {/* Dev Tools */}
              <Route path="/dev-auth" element={<DevAuth />} />


              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="pending" element={<AdminPendingListings />} />
                <Route path="listings" element={<AdminListings />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="enquiries" element={<AdminEnquiries />} />
                <Route path="referrals" element={<AdminReferrals />} />
                <Route path="rewards" element={<AdminRewards />} />
                <Route path="financials" element={<AdminFinancials />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Host Routes */}
              <Route path="/host" element={<HostLayout />}>
                <Route index element={<HostDashboard />} />
                <Route path="create" element={<CreateListing />} />
                <Route path="edit/:id" element={<CreateListing />} />
                <Route path="listings" element={<HostListings />} />
                <Route path="enquiries" element={<HostEnquiries />} />
                <Route path="calendar" element={<HostCalendar />} />
                <Route path="guests" element={<HostGuests />} />
                <Route path="operations" element={<HostOperations />} />
                <Route path="reports" element={<HostReports />} />
                <Route path="inbox" element={<HostInbox />} />
                <Route path="inbox/:inquiryId" element={<HostInbox />} />
                <Route path="verification" element={<HostVerification />} />
                <Route path="referrals" element={<HostReferrals />} />
                <Route path="content" element={<HostContentStudio />} />
                <Route path="settings" element={<HostSettings />} />
              </Route>

              {/* 404 Catch-all */}
              <Route path="*" element={<NotFound />} />
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
