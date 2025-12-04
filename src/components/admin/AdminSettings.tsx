import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Shield, Mail, Globe, Database, Save, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    site_name: '',
    support_email: '',
    meta_description: '',
    require_email_verification: true,
    enable_2fa: true,
    maintenance_mode: false,
    service_fee_percent: 10
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .single();

      if (error) throw error;
      if (data) {
        setSettings({
          site_name: data.site_name || '',
          support_email: data.support_email || '',
          meta_description: data.meta_description || '',
          require_email_verification: data.require_email_verification ?? true,
          enable_2fa: data.enable_2fa ?? true,
          maintenance_mode: data.maintenance_mode ?? false,
          service_fee_percent: data.service_fee_percent ?? 10
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        variant: "destructive",
        title: "Error loading settings",
        description: "Could not load platform settings.",
      });
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update(settings)
        .eq('id', 1);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Platform settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: "destructive",
        title: "Error saving settings",
        description: "Could not save changes. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Platform Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure global application settings and preferences.</p>
        </div>
        <Button onClick={handleSave} disabled={loading} className="bg-gray-900 text-white hover:bg-gray-800">
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">General Configuration</h2>
                <p className="text-sm text-gray-500">Basic platform information and SEO settings.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Site Name</Label>
                  <Input
                    id="site-name"
                    value={settings.site_name}
                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input
                    id="support-email"
                    value={settings.support_email}
                    onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta-desc">Default Meta Description</Label>
                <Input
                  id="meta-desc"
                  value={settings.meta_description}
                  onChange={(e) => setSettings({ ...settings, meta_description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-fee">Service Fee (%)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="service-fee"
                    type="number"
                    className="pl-9"
                    value={settings.service_fee_percent}
                    onChange={(e) => setSettings({ ...settings, service_fee_percent: parseFloat(e.target.value) })}
                  />
                </div>
                <p className="text-xs text-gray-500">Percentage taken from each booking.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Security & Access</h2>
                <p className="text-sm text-gray-500">Manage access controls and security policies.</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Require Email Verification</Label>
                  <p className="text-sm text-gray-500">Users must verify email before booking.</p>
                </div>
                <Switch
                  checked={settings.require_email_verification}
                  onCheckedChange={(c) => setSettings({ ...settings, require_email_verification: c })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">Enforce 2FA for admin accounts.</p>
                </div>
                <Switch
                  checked={settings.enable_2fa}
                  onCheckedChange={(c) => setSettings({ ...settings, enable_2fa: c })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">Disable public access to the site.</p>
                </div>
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={(c) => setSettings({ ...settings, maintenance_mode: c })}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Email Notifications</h2>
                <p className="text-sm text-gray-500">Configure automated email templates.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <div>
                  <div className="font-medium text-gray-900">Welcome Email</div>
                  <div className="text-xs text-gray-500">Sent when a new user registers</div>
                </div>
                <Button variant="outline" size="sm">Edit Template</Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <div>
                  <div className="font-medium text-gray-900">Booking Confirmation</div>
                  <div className="text-xs text-gray-500">Sent when a booking is confirmed</div>
                </div>
                <Button variant="outline" size="sm">Edit Template</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">System Status</h2>
                <p className="text-sm text-gray-500">Current system health metrics.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Storage Usage</span>
                  <span className="font-medium text-gray-900">45.2 GB / 100 GB</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[45%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Database Connections</span>
                  <span className="font-medium text-gray-900">12 / 50</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[24%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">API Requests (24h)</span>
                  <span className="font-medium text-gray-900">14.5k</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[60%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg shadow-gray-900/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold">System Alerts</h3>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3 items-start text-sm text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                <p>System backup completed successfully at 03:00 AM.</p>
              </div>
              <div className="flex gap-3 items-start text-sm text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0" />
                <p>High traffic detected on listing API endpoint.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
