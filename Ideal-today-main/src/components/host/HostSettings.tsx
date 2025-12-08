
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import ImageUpload from "@/components/ui/image-upload";
import { Loader2 } from "lucide-react";

export default function HostSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    avatar_url: "",
  });
  const [hostReferralCode, setHostReferralCode] = useState<string | null>(null);
  const [hostRefs, setHostRefs] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      getProfile();
    }
  }, [user]);

  async function getProfile() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, host_referral_code")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          full_name: data.full_name || "",
          avatar_url: data.avatar_url || "",
        });
        setHostReferralCode(data.host_referral_code || null);
        const { data: refs } = await supabase
          .from('host_referrals')
          .select('referee_id, status, created_at, rewarded_at')
          .eq('referrer_id', user?.id)
          .order('created_at', { ascending: false });
        setHostRefs(refs || []);
      }
    } catch (error) {
      console.error("Error loading user data!", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      setLoading(true);

      const updates = {
        id: user?.id,
        full_name: formData.full_name,
        avatar_url: formData.avatar_url,
        updated_at: new Date(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) throw error;
      toast({
        title: "Profile updated",
        description: "Your host profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-2">Manage your host profile and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your public profile information that guests will see.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-2xl">?</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <ImageUpload
                  value={formData.avatar_url ? [formData.avatar_url] : []}
                  onChange={(urls) => setFormData({ ...formData, avatar_url: urls[0] })}
                  onRemove={() => setFormData({ ...formData, avatar_url: "" })}
                  bucket="avatars"
                  maxFiles={1}
                  className="max-w-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Display Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Sarah Johnson"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ""}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">Email cannot be changed.</p>
          </div>

          <Button onClick={updateProfile} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Host Referrals</CardTitle>
          <CardDescription>
            Invite hosts to join and earn points when they publish their first listing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hostReferralCode ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input readOnly value={`${window.location.origin}?host_ref=${hostReferralCode}`} />
                <Button onClick={() => navigator.clipboard.writeText(`${window.location.origin}?host_ref=${hostReferralCode}`)}>Copy</Button>
              </div>
              <div>
                <Label>Your invited hosts</Label>
                {hostRefs.length === 0 ? (
                  <p className="text-sm text-gray-500">No host referrals yet.</p>
                ) : (
                  <div className="space-y-2">
                    {hostRefs.map((r) => (
                      <div key={r.referee_id} className="flex justify-between text-sm border rounded-md px-3 py-2">
                        <span>{r.referee_id.slice(0,8)}…</span>
                        <span className="capitalize">{r.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Your host referral code will be generated on signup.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
