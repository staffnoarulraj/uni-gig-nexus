import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>({
    full_name: '',
    email: user?.email || '',
    university: '',
    resume_url: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: string) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `resumes/${user.id}.${fileExt}`;
    setSaving(true);
    setError('');
    const { error: uploadError } = await supabase.storage.from('resumes').upload(filePath, file, { upsert: true });
    if (uploadError) {
      setError('Failed to upload CV.');
      setSaving(false);
      return;
    }
    const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(filePath);
    setProfile((prev: any) => ({ ...prev, resume_url: publicUrlData.publicUrl }));
    setSaving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess(false);
    const { error } = await supabase
      .from('student_profiles')
      .upsert({
        user_id: user.id,
        full_name: profile.full_name,
        email: profile.email,
        university: profile.university,
        resume_url: profile.resume_url,
      }, { onConflict: 'user_id' });
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
          {/* Debug: Show resume_url value */}
          {profile.resume_url && (
            <div className="mb-2 text-xs text-muted-foreground">Debug: resume_url = {profile.resume_url}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {success && <div className="mb-2 text-green-600 font-medium">Profile saved!</div>}
            {error && <div className="mb-2 text-red-600 font-medium">{error}</div>}
            <div>
              <Label htmlFor="full_name">Name</Label>
              <Input id="full_name" value={profile.full_name || ''} onChange={e => handleChange('full_name', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.email || ''} onChange={e => handleChange('email', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="university">University</Label>
              <Input id="university" value={profile.university || ''} onChange={e => handleChange('university', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="resume">Attach CV</Label>
              <Input id="resume" type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx" />
              {profile.resume_url && (
                <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm mt-1 block">View Uploaded CV</a>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProfilePage; 