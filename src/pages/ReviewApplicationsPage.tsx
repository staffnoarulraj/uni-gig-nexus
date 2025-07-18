import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Application {
  id: string;
  job_id: string;
  student_id: string;
  cover_letter: string | null;
  status: string;
  applied_at: string;
  job: { title: string } | null;
  student_name?: string;
  student_degree?: string;
  student_university?: string;
}

const ReviewApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    if (!user) return;
    // Get all jobs posted by this employer
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('employer_id', user.id);
    if (jobsError) {
      setError(jobsError.message);
      setLoading(false);
      return;
    }
    const jobIds = jobs?.map((j: any) => j.id) || [];
    if (jobIds.length === 0) {
      setApplications([]);
      setLoading(false);
      return;
    }
    // Get all applications for these jobs
    const { data: applications, error: appsError } = await supabase
      .from('job_applications')
      .select('id, job_id, student_id, cover_letter, status, applied_at, job:jobs(title)')
      .in('job_id', jobIds)
      .order('applied_at', { ascending: false });
    if (appsError) {
      setError(appsError.message);
      setLoading(false);
      return;
    }
    // Fetch all relevant student profiles in one query
    const studentIds = Array.from(new Set((applications || []).map(app => app.student_id)));
    const { data: profiles } = await supabase
      .from('student_profiles')
      .select('user_id, full_name, degree, university')
      .in('user_id', studentIds);
    // Map student_id to profile info
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    setApplications((applications || []).map(app => {
      const profile = profileMap.get(app.student_id);
      const isProfileObj = profile && typeof profile === 'object';
      return {
        ...app,
        student_name: isProfileObj && 'full_name' in profile ? profile.full_name : app.student_id,
        student_degree: isProfileObj && 'degree' in profile ? profile.degree : '',
        student_university: isProfileObj && 'university' in profile ? profile.university : '',
      };
    }));
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const { error } = await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', id);
    setUpdating(null);
    if (!error) fetchApplications();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Review Applications</CardTitle>
          <CardDescription>View and manage applications for your jobs.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading applications...</div>
          ) : error ? (
            <div className="mb-4 text-red-600 font-medium">{error}</div>
          ) : applications.length === 0 ? (
            <div>No applications found.</div>
          ) : (
            <div className="space-y-6">
              {applications.map(app => (
                <Card key={app.id} className="bg-muted/50">
                  <CardContent className="py-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold text-lg">{app.job?.title || 'Job'}</div>
                      <div className="text-xs text-muted-foreground">{new Date(app.applied_at).toLocaleString()}</div>
                    </div>
                    <div className="mb-1"><span className="font-medium">Applicant:</span> {app.student_name}</div>
                    {app.student_degree && <div className="mb-1"><span className="font-medium">Degree:</span> {app.student_degree}</div>}
                    {app.student_university && <div className="mb-1"><span className="font-medium">University:</span> {app.student_university}</div>}
                    <div className="mb-1"><span className="font-medium">Status:</span> {app.status}</div>
                    {app.cover_letter && <div className="mb-1"><span className="font-medium">Cover Letter:</span> {app.cover_letter}</div>}
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="default" disabled={updating === app.id || app.status === 'accepted'} onClick={() => updateStatus(app.id, 'accepted')}>
                        {updating === app.id && app.status !== 'accepted' ? 'Accepting...' : 'Accept'}
                      </Button>
                      <Button size="sm" variant="destructive" disabled={updating === app.id || app.status === 'rejected'} onClick={() => updateStatus(app.id, 'rejected')}>
                        {updating === app.id && app.status !== 'rejected' ? 'Rejecting...' : 'Reject'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewApplicationsPage; 