import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/ui/image-upload";
import { useToast } from "@/components/ui/use-toast";
import { saveUserProfile } from "@/lib/backend";

export default function AccountPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string; phone?: string; bio?: string; preferences?: Record<string, unknown> } | null>(null);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, phone, bio, preferences, points, level')
        .eq('id', user.id)
        .single();
      setProfile({ full_name: data?.full_name || "", avatar_url: data?.avatar_url || "", phone: data?.phone || "", bio: data?.bio || "", preferences: data?.preferences || {} });
      setEmail(user.email || "");
      setLoading(false);
    };
    load();
  }, [user]);

  const saveProfile = async () => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      await saveUserProfile({
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
        phone: profile.phone,
        bio: profile.bio,
        preferences: profile.preferences,
      });
      toast({ title: 'Account updated' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!password || password.length < 6) {
      toast({ variant: 'destructive', title: 'Invalid password', description: 'Minimum 6 characters.' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Password updated' });
      setPassword("");
    }
  };

  const updateEmail = async () => {
    if (!email || !email.includes('@')) {
      toast({ variant: 'destructive', title: 'Invalid email' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Email update requested', description: 'Check your inbox to confirm the change.' });
    }
  };

  const signOutAll = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else toast({ title: 'Signed out everywhere' });
  };

  if (loading) {
    return <div className="min-h-screen pt-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Please log in</h1>
        <p className="text-gray-600">You need to be signed in to access your account.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-20 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">?</div>
                )}
              </div>
              <div className="flex-1">
                <ImageUpload
                  value={profile?.avatar_url ? [profile.avatar_url] : []}
                  onChange={(urls) => setProfile(p => p ? { ...p, avatar_url: urls[0] } : p)}
                  onRemove={() => setProfile(p => p ? { ...p, avatar_url: "" } : p)}
                  bucket="avatars"
                  maxFiles={1}
                  className="max-w-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Display name</Label>
                <Input value={profile?.full_name || ""} onChange={(e) => setProfile(p => p ? { ...p, full_name: e.target.value } : p)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={profile?.phone || ""} onChange={(e) => setProfile(p => p ? { ...p, phone: e.target.value } : p)} placeholder="e.g. +27 82 123 4567" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Bio</Label>
                <Input value={profile?.bio || ""} onChange={(e) => setProfile(p => p ? { ...p, bio: e.target.value } : p)} placeholder="Tell us about yourself" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-3">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1" />
                <Button variant="outline" onClick={updateEmail}>Update email</Button>
              </div>
              <p className="text-xs text-gray-500">Updating email requires confirmation via a link sent to the new address.</p>
            </div>

            <Button onClick={saveProfile} disabled={loading} className="mt-2">Save changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>New password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
              <p className="text-xs text-gray-500">Minimum 6 characters.</p>
            </div>
            <Button onClick={updatePassword}>Update password</Button>
            <div className="pt-2 border-t border-gray-100 mt-4">
              <Button variant="outline" onClick={signOutAll}>Sign out of all devices</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
