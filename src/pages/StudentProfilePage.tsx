import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [noProfile, setNoProfile] = useState(false);
  const [multipleProfiles, setMultipleProfiles] = useState(false);
  const [profileCount, setProfileCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      setNoProfile(false);
      setMultipleProfiles(false);
      if (!user) return;
      const { data, error, count } = await supabase
        .from('student_profiles')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setProfileCount(data ? data.length : 0);
      if (!data || data.length === 0) {
        setNoProfile(true);
        setProfile({ full_name: '', phone: '' });
      } else if (data.length > 1) {
        setMultipleProfiles(true);
      } else {
        setProfile(data[0]);
      }
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
      .from('student_profiles')
      .update({
        full_name: profile.full_name,
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

  const handleCreateProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    const { error } = await supabase
      .from('student_profiles')
      .insert({
        user_id: user.id,
        full_name: profile.full_name,
        phone: profile.phone,
      });
    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setNoProfile(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {profileCount !== null && (
            <div className="mb-2 text-xs text-muted-foreground">Debug: Found {profileCount} profile(s) for this user.</div>
          )}
          {loading ? (
            <div>Loading profile...</div>
          ) : error ? (
            <div className="mb-4 text-red-600 font-medium">{error}</div>
          ) : multipleProfiles ? (
            <div className="mb-4 text-red-600 font-medium">Multiple profiles found for this user. Please contact support.</div>
          ) : noProfile ? (
            <form onSubmit={e => { e.preventDefault(); handleCreateProfile(); }} className="space-y-4">
              <div className="mb-2 text-yellow-600 font-medium">No profile found. Please create your profile.</div>
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" value={profile.full_name || ''} onChange={e => handleChange('full_name', e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={profile.phone || ''} onChange={e => handleChange('phone', e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Creating...' : 'Create Profile'}
              </Button>
            </form>
          ) : profile ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {success && <div className="mb-2 text-green-600 font-medium">Profile updated!</div>}
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" value={profile.full_name || ''} onChange={e => handleChange('full_name', e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={profile.phone || ''} onChange={e => handleChange('phone', e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProfilePage; 