import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EmployerProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      if (!user) return;
      const { data, error } = await supabase
        .from('employer_profiles')
        .select('*')
        .eq('user_id', user.id);
      if (error) setError(error.message);
      else if (!data || data.length === 0) setProfile(null);
      else if (data.length > 1) setError('Multiple profiles found for this user. Please contact support.');
      else setProfile(data[0]);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    const { error } = await supabase
      .from('employer_profiles')
      .update({
        company_name: profile.company_name,
        company_description: profile.company_description,
        website_url: profile.website_url,
        contact_email: profile.contact_email,
        phone: profile.phone,
      })
      .eq('user_id', user.id);
    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading profile...</div>
          ) : error ? (
            <div className="mb-4 text-red-600 font-medium">{error}</div>
          ) : profile ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {success && <div className="mb-2 text-green-600 font-medium">Profile updated!</div>}
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input id="company_name" value={profile.company_name || ''} onChange={e => handleChange('company_name', e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="company_description">Company Description</Label>
                <Input id="company_description" value={profile.company_description || ''} onChange={e => handleChange('company_description', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="website_url">Website</Label>
                <Input id="website_url" value={profile.website_url || ''} onChange={e => handleChange('website_url', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input id="contact_email" value={profile.contact_email || ''} onChange={e => handleChange('contact_email', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={profile.phone || ''} onChange={e => handleChange('phone', e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          ) : (
            <div>No profile found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployerProfilePage; 