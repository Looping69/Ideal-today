# Ideal Stay - South Africa's Premium Property Marketplace

Ideal Stay is a premium property listing and discovery platform tailored for the South African holiday and vacation rental market. It connects travelers with verified hosts through a high-performance, AI-driven interface.

## 🚀 The Pivot: Marketplace & Lead Gen
**Important Note:** Ideal Stay has transitioned from a direct booking engine to a **Premium Property Marketplace**. 
- **Direct Bookings are no longer a feature.**
- The platform now focuses on **Property Visibility**, **Host Promotion**, and **Lead Generation**.
- Communication is handled via the integrated AI Chat and direct host contact channels, allowing for more flexible guest-host interactions.

## ✨ Key Features

### For Travelers
- **AI-Powered Discovery**: An intelligent chat interface that helps users find the perfect stay based on natural language requirements (e.g., "Find me a pet-friendly villa in Camps Bay with a pool").
- **Smart Filtering**: Category-based exploration (Hotels, Guest Houses, Self-Catering, etc.) with province-specific navigation.
- **Rich Media**: High-quality property galleries, video slots for premium listings, and integrated Google Maps for location accuracy.

### For Hosts
- **Tiered Subscriptions**: Flexibly scale your visibility with Free, Standard, Professional, and Premium tiers.
- **Verified Host Status**: Build trust with travelers through our robust verification system.
- **Advanced Analytics**: (Professional/Premium) Track listing performance and viewer engagement.
- **Priority Sorting**: Premium tiers are automatically promoted to the top of search results and featured carousels.

## 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion (for animations), Lucide React (icons)
- **Backend / Auth**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Maps**: Google Maps Platform (@react-google-maps/api)
- **AI**: Integrated AI Assistant for property matching

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase account

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your Supabase configuration, Google Maps key, and other required tokens.
4. Run the development server:
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure
- `/src/components`: UI components organized by feature (auth, host, listings, search).
- `/src/contexts`: Global state management for Auth and Notifications.
- `/src/lib`: Core utility instances (Supabase client, shared helpers).
- `/supabase`: Database migrations and edge functions.

## 🛡️ Administrative Access
Admins can manage users, approve/reject listings, and monitor platform health through the `/admin` dashboard. 

---
© 2026 Ideal Stay. Built for the future of South African travel.
