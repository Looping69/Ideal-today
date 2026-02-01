
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import BadgeCard from "./BadgeCard";
import { Progress } from "@/components/ui/progress";
import { Trophy, Map, Star, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  date: string;
}

interface Profile {
  points: number;
  level: string;
  badges: Badge[];
}

const LEVELS = [
  { name: "Scout", min: 0, max: 500, color: "text-blue-600" },
  { name: "Explorer", min: 500, max: 2000, color: "text-green-600" },
  { name: "Adventurer", min: 2000, max: 5000, color: "text-blue-400" },
  { name: "Legend", min: 5000, max: 100000, color: "text-purple-600" },
];

const AVAILABLE_BADGES = [
  { id: "first_booking", name: "First Journey", icon: "🎒", description: "Complete your first booking" },
  { id: "reviewer", name: "Critic", icon: "✍️", description: "Leave 5 reviews" },
  { id: "beach_lover", name: "Beach Bum", icon: "🏖️", description: "Stay at 3 beach properties" },
  { id: "safari_expert", name: "Ranger", icon: "🦁", description: "Visit Kruger National Park" },
  { id: "city_slicker", name: "Urbanite", icon: "🏙️", description: "Stay in 3 different cities" },
];

export default function RewardsDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  async function fetchProfile() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) {
        // If profile doesn't exist, create mock data
        setProfile({
          points: 1250,
          level: "Explorer",
          badges: [
            { id: "first_booking", name: "First Journey", icon: "🎒", description: "Complete your first booking", date: "2024-01-15" },
            { id: "reviewer", name: "Critic", icon: "✍️", description: "Leave 5 reviews", date: "2024-02-20" },
          ]
        });
      } else {
        setProfile(data);
        setReferralCode(data?.referral_code || null);
      }
    } catch (error) {
      // On network error, use mock data
      setProfile({
        points: 1250,
        level: "Explorer",
        badges: [
          { id: "first_booking", name: "First Journey", icon: "🎒", description: "Complete your first booking", date: "2024-01-15" },
          { id: "reviewer", name: "Critic", icon: "✍️", description: "Leave 5 reviews", date: "2024-02-20" },
        ]
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const loadReferrals = async () => {
      if (!user) return;
      const { data: refs } = await supabase
        .from('referrals')
        .select('referee_id, status, created_at, rewarded_at')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      setReferrals(refs || []);
    };
    loadReferrals();
  }, [user]);

  const refetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    if (data) setProfile(data);
  };

  const claimCoastalExplorer = async () => {
    const { data, error } = await supabase.rpc('claim_coastal_explorer');
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return;
    }
    if (data === 'claimed') {
      toast({ title: 'Challenge completed', description: '+500 points awarded' });
      await refetchProfile();
    } else if (data === 'already_claimed') {
      toast({ title: 'Already claimed', description: 'Reward already granted for this challenge.' });
    } else {
      toast({ variant: 'destructive', title: 'Not eligible', description: 'Book a stay in Cape Town or Durban first.' });
    }
  };

  const claimPhotoFinisher = async () => {
    const { data, error } = await supabase.rpc('claim_photo_finisher');
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return;
    }
    if (data === 'claimed') {
      toast({ title: 'Photo reward', description: '+200 points awarded' });
      await refetchProfile();
    } else if (data === 'already_claimed') {
      toast({ title: 'Already claimed', description: 'Reward already granted for this challenge.' });
    } else {
      toast({ variant: 'destructive', title: 'Not eligible', description: 'Submit an approved review with a photo.' });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <Trophy className="w-10 h-10 text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Join IdealRewards</h1>
        <p className="text-gray-600 max-w-md mb-8">
          Sign up to start earning points, unlocking exclusive badges, and getting discounts on your South African adventures.
        </p>
        <Button onClick={() => navigate("/")} className="bg-primary hover:bg-primary/90">
          Go Home & Sign Up
        </Button>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen pt-24 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const currentLevel = LEVELS.find(l => profile && profile.points >= l.min && profile.points < l.max) || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const progress = nextLevel
    ? ((profile?.points || 0) - currentLevel.min) / (nextLevel.min - currentLevel.min) * 100
    : 100;

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-12">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-red-500 flex items-center justify-center text-white text-4xl shadow-lg">
                {currentLevel.name[0]}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Hello, {user.email?.split('@')[0]}!</h1>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${currentLevel.color} bg-gray-100 px-3 py-1 rounded-full text-sm`}>
                    {currentLevel.name} Level
                  </span>
                  <span className="text-gray-500 text-sm">Member since {new Date().getFullYear()}</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/3 bg-gray-50 p-6 rounded-xl border border-gray-100">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-gray-600">Current Points</span>
                <span className="text-2xl font-bold text-primary">{profile?.points} pts</span>
              </div>
              <Progress value={progress} className="h-3 mb-2" />
              {nextLevel && (
                <p className="text-xs text-gray-500 text-right">
                  {nextLevel.min - (profile?.points || 0)} points to {nextLevel.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content - Badges */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-500" />
                Your Badges
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {profile?.badges.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    name={badge.name}
                    icon={badge.icon}
                    description={badge.description}
                    date={badge.date}
                  />
                ))}
                {AVAILABLE_BADGES.filter(b => !profile?.badges.find(pb => pb.id === b.id)).map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    name={badge.name}
                    icon={badge.icon}
                    description={badge.description}
                    isLocked={true}
                  />
                ))}
              </div>
            </div>

            {/* Challenges Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Map className="w-5 h-5 text-blue-500" />
                Active Challenges
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl shrink-0">
                    🌊
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">Coastal Explorer</h3>
                    <p className="text-sm text-gray-500">Book a stay in Cape Town or Durban</p>
                  </div>
                  <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-2 mt-2 sm:mt-0">
                    <span className="font-bold text-primary text-sm sm:text-base">+500 pts</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-[10px] sm:text-xs" onClick={() => navigate('/')}>View Properties</Button>
                      <Button size="sm" className="h-7 text-[10px] sm:text-xs" onClick={claimCoastalExplorer}>Claim</Button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-xl shrink-0">
                    📸
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">Photo Finisher</h3>
                    <p className="text-sm text-gray-500">Upload a photo with your next review</p>
                  </div>
                  <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-2 mt-2 sm:mt-0">
                    <span className="font-bold text-primary text-sm sm:text-base">+200 pts</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-[10px] sm:text-xs" onClick={() => navigate('/')}>Go to Reviews</Button>
                      <Button size="sm" className="h-7 text-[10px] sm:text-xs" onClick={claimPhotoFinisher}>Claim</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {referralCode && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Referrals</h2>
                <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                  <input
                    readOnly
                    value={`${window.location.origin}?ref=${referralCode}`}
                    className="flex-1 border rounded-md px-3 py-2 text-sm"
                  />
                  <Button onClick={() => navigator.clipboard.writeText(`${window.location.origin}?ref=${referralCode}`)}>Copy link</Button>
                </div>
                {referrals.length === 0 ? (
                  <p className="text-sm text-gray-500">No referrals yet.</p>
                ) : (
                  <div className="space-y-2">
                    {referrals.map((r) => (
                      <div key={r.referee_id} className="flex justify-between text-sm border rounded-md px-3 py-2">
                        <span>{r.referee_id.slice(0, 8)}…</span>
                        <span className="capitalize">{r.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Benefits */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Level Benefits
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <div>
                    <span className="font-medium text-sm">Member Rates</span>
                    <p className="text-xs text-gray-500">Save 10% on select properties</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <div>
                    <span className="font-medium text-sm">Early Access</span>
                    <p className="text-xs text-gray-500">Book holiday specials 24h early</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 opacity-50">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-gray-400 text-xs">🔒</span>
                  </div>
                  <div>
                    <span className="font-medium text-sm">Free Cancellation</span>
                    <p className="text-xs text-gray-500">Unlock at Adventurer Level</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-primary to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <h3 className="font-bold text-lg mb-2">Refer a Friend</h3>
              <p className="text-white/90 text-sm mb-4">
                Earn 1000 points when you invite friends to IdealStay.
              </p>
              <Button variant="secondary" className="w-full bg-white text-primary hover:bg-gray-100">
                Invite Friends
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
