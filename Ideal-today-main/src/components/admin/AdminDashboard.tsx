import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!user) { setAllowed(false); return; }
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      setAllowed(!!data?.is_admin);
    };
    check();
  }, [user]);

  if (!allowed) {
    return (
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="text-gray-600">You need admin privileges to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded-xl p-6 bg-white">
          <h2 className="font-semibold mb-2">Users</h2>
          <p className="text-sm text-gray-600">Manage user accounts and roles.</p>
        </div>
        <div className="border rounded-xl p-6 bg-white">
          <h2 className="font-semibold mb-2">Listings</h2>
          <p className="text-sm text-gray-600">Approve new listings and edit content.</p>
        </div>
        <div className="border rounded-xl p-6 bg-white">
          <h2 className="font-semibold mb-2">Reviews</h2>
          <p className="text-sm text-gray-600">Moderate reviews and handle reports.</p>
        </div>
      </div>
    </div>
  );
}

