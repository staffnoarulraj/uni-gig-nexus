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
  student_major?: string;
  student_university?: string;
  student_year?: number;
  student_bio?: string;
  student_phone?: string;
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
    
    try {
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
      
      // Get all applications for these jobs with job details
      const { data: applications, error: appsError } = await supabase
        .from('job_applications')
        .select(`
          id, 
          job_id, 
          student_id, 
          cover_letter, 
          status, 
          applied_at,
          job:jobs(title)
        `)
        .in('job_id', jobIds)
        .order('applied_at', { ascending: false });
        
      if (appsError) {
        setError(appsError.message);
        setLoading(false);
        return;
      }
      
      if (!applications || applications.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }
      
      // Fetch student profiles
      const studentIds = Array.from(new Set(applications.map(app => app.student_id)));
      const { data: profiles, error: profilesError } = await supabase
        .from('student_profiles')
        .select('user_id, full_name, major, university, year_of_study, bio, phone')
        .in('user_id', studentIds);
        
      if (profilesError) {
        console.error('Error fetching student profiles:', profilesError);
      }
      
      // Map student_id to profile info
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      
      const enrichedApplications = applications.map(app => {
        const profile = profileMap.get(app.student_id);
        return {
          ...app,
          student_name: profile?.full_name || 'Unknown Student',
          student_major: profile?.major || '',
          student_university: profile?.university || '',
          student_year: profile?.year_of_study || '',
          student_bio: profile?.bio || '',
          student_phone: profile?.phone || ''
        };
      });
      
      setApplications(enrichedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
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
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-bold text-lg">{app.job?.title || 'Job'}</div>
                      <div className="text-xs text-muted-foreground">{new Date(app.applied_at).toLocaleString()}</div>
                    </div>
                    
                    {/* Student Information Section */}
                    <div className="mb-4 p-3 bg-background rounded-lg border">
                      <h4 className="font-semibold text-md mb-2">Student Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium">Name:</span> {app.student_name}</div>
                        {app.student_major && <div><span className="font-medium">Major:</span> {app.student_major}</div>}
                        {app.student_university && <div><span className="font-medium">University:</span> {app.student_university}</div>}
                        {app.student_year && <div><span className="font-medium">Year:</span> {app.student_year}</div>}
                        {app.student_phone && <div><span className="font-medium">Phone:</span> {app.student_phone}</div>}
                      </div>
                      {app.student_bio && (
                        <div className="mt-2">
                          <span className="font-medium">Bio:</span> 
                          <p className="text-sm text-muted-foreground mt-1">{app.student_bio}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Application Details */}
                    <div className="mb-3">
                      <div className="mb-2"><span className="font-medium">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                      {app.cover_letter && (
                        <div>
                          <span className="font-medium">Cover Letter:</span>
                          <p className="text-sm text-muted-foreground mt-1 p-2 bg-background rounded border">
                            {app.cover_letter}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="default" 
                        disabled={updating === app.id || app.status === 'accepted'} 
                        onClick={() => updateStatus(app.id, 'accepted')}
                      >
                        {updating === app.id && app.status !== 'accepted' ? 'Accepting...' : 'Accept'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        disabled={updating === app.id || app.status === 'rejected'} 
                        onClick={() => updateStatus(app.id, 'rejected')}
                      >
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