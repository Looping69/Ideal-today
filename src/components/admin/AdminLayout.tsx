import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from "@/components/ui/notification-bell";
import { supabase } from '@/lib/supabase';
import { Users, Home as HomeIcon, MessageSquare, Star, Settings, ClipboardList, Gift, Share2, Bell, Clock, Wallet, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminLayout() {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const check = async () => {
      if (!user) { setAllowed(false); return; }
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      setAllowed(!!data?.is_admin);
    };
    check();
  }, [user]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!allowed) {
    return (
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="text-gray-600">You need admin privileges to view this page.</p>
      </div>
    );
  }

  const nav = [
    { to: '/admin', label: 'Overview', icon: HomeIcon },
    { to: '/admin/pending', label: 'Pending Listings', icon: Clock },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/listings', label: 'Listings', icon: ClipboardList },
    { to: '/admin/reviews', label: 'Reviews', icon: Star },
    { to: '/admin/bookings', label: 'Bookings', icon: MessageSquare },
    { to: '/admin/referrals', label: 'Referrals', icon: Share2 },
    { to: '/admin/rewards', label: 'Rewards', icon: Gift },
    { to: '/admin/financials', label: 'Financials', icon: Wallet },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[45] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "w-72 border-r border-gray-200 fixed inset-y-0 left-0 z-50 bg-white shadow-sm flex flex-col transition-transform duration-300 md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-20 flex items-center px-6 border-b border-gray-100 justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-gray-900/20 transition-transform group-hover:scale-105">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate tracking-tight">
              AdminPanel
            </span>
          </div>
          <button className="md:hidden p-2 text-gray-500 hover:text-gray-900" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 py-8 px-4 space-y-1 overflow-y-auto no-scrollbar">
          <div className="mb-6 px-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main Menu</p>
            <nav className="space-y-1">
              {nav.slice(0, 6).map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/admin'}
                  onClick={() => { if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                  className={({ isActive }) => `flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${isActive ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} `}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="px-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Management</p>
            <nav className="space-y-1">
              {nav.slice(6).map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => { if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                  className={({ isActive }) => `flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${isActive ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} `}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-xs">
              {user?.email?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <section className="flex-1 md:ml-72 min-h-screen flex flex-col">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">
              {nav.find(n => n.to === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                // You might want to add a toast here, but for now just copy
              }}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              title="Copy link"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-gray-200" />
            <button onClick={() => navigate('/')} className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Exit Admin
            </button>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </section>
    </div>
  );
}
