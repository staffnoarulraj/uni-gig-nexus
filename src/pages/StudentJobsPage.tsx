import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StudentJobsPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError('');
      if (!user) return;
      const { data, error } = await supabase
        .from('job_applications')
        .select('*, job:jobs(title, description)')
        .eq('student_id', user.id)
        .order('applied_at', { ascending: false });
      if (error) setError(error.message);
      setApplications(data || []);
      setLoading(false);
    };
    fetchApplications();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>My Jobs</CardTitle>
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
                    <div className="font-bold text-lg">{app.job?.title || 'Job'}</div>
                    <div className="text-muted-foreground">{app.job?.description}</div>
                    <div className="text-sm">Status: {app.status}</div>
                    <div className="text-sm">Applied: {new Date(app.applied_at).toLocaleString()}</div>
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

export default StudentJobsPage; 