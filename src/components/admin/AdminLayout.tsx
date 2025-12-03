import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Users, Home as HomeIcon, MessageSquare, Star, Settings, ClipboardList, Gift, Share2 } from 'lucide-react';

export default function AdminLayout() {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      if (!user) { setAllowed(false); return; }
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      setAllowed(!!data?.is_admin);
    };
    check();
  }, [user]);

  // Do not force navigation; nested routes handle rendering

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
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/listings', label: 'Listings', icon: ClipboardList },
    { to: '/admin/reviews', label: 'Reviews', icon: Star },
    { to: '/admin/bookings', label: 'Bookings', icon: MessageSquare },
    { to: '/admin/referrals', label: 'Referrals', icon: Share2 },
    { to: '/admin/rewards', label: 'Rewards', icon: Gift },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-white flex">
      <aside className="w-64 border-r border-gray-200 sticky top-20 self-start h-[calc(100vh-5rem)] hidden md:block">
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">Admin</h2>
          <nav className="space-y-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
      <section className="flex-1">
        <Outlet />
      </section>
    </div>
  );
}
