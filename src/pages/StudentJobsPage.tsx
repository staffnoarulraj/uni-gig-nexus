import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, Clock } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

interface JobApplication {
  id: string;
  job_id: string;
  student_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  applied_at: string;
  job_title: string;
  job_description: string;
  job_type: string;
  job_budget_min: number | null;
  job_budget_max: number | null;
  company_name: string | null;
}

type Tables = Database['public']['Tables'];

type JobApplicationWithJobs = {
  id: Tables['job_applications']['Row']['id'];
  job_id: Tables['job_applications']['Row']['job_id'];
  student_id: Tables['job_applications']['Row']['student_id'];
  status: Tables['job_applications']['Row']['status'];
  applied_at: Tables['job_applications']['Row']['applied_at'];
  cover_letter: Tables['job_applications']['Row']['cover_letter'];
  jobs: {
    id: Tables['jobs']['Row']['id'];
    title: Tables['jobs']['Row']['title'];
    description: Tables['jobs']['Row']['description'];
    job_type: Tables['jobs']['Row']['job_type'];
    budget_min: Tables['jobs']['Row']['budget_min'];
    budget_max: Tables['jobs']['Row']['budget_max'];
    employer_id: Tables['jobs']['Row']['employer_id'];
  };
};

const StudentJobsPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError('');
      if (!user) return;
      
      try {
        // First get all applications
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('job_applications')
          .select('*')
          .eq('student_id', user.id)
          .order('applied_at', { ascending: false });

        if (applicationsError) throw applicationsError;

        // Get job IDs from applications
        const jobIds = applicationsData?.map(app => app.job_id) || [];

        // Get jobs with their details
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .in('id', jobIds);

        if (jobsError) throw jobsError;

        // Create a map of jobs by ID
        const jobsMap = new Map(
          jobsData?.map(job => [job.id, job]) || []
        );

        // Get employer IDs from jobs
        const employerIds = [...new Set(jobsData?.map(job => job.employer_id).filter(Boolean) || [])];

        // Get employer profiles
        const { data: employerData, error: employerError } = await supabase
          .from('employer_profiles')
          .select('user_id, company_name')
          .in('user_id', employerIds);

        if (employerError) throw employerError;

        // Create a map of employer_id to company_name
        const employerMap = new Map(
          employerData?.map(emp => [emp.user_id, emp.company_name]) || []
        );

        // Transform the data to match our interface
        const transformedData = (applicationsData || []).map(app => {
          const job = jobsMap.get(app.job_id);
          return {
            id: app.id,
            job_id: app.job_id,
            student_id: app.student_id,
            status: app.status,
            applied_at: app.applied_at || '',
            job_title: job?.title || 'Unknown Job',
            job_description: job?.description || '',
            job_type: job?.job_type || 'Unknown Type', // Fixed column name
            job_budget_min: job?.budget_min || null,
            job_budget_max: job?.budget_max || null,
            company_name: job?.employer_id ? employerMap.get(job.employer_id) || 'Unknown Company' : 'Unknown Company'
          };
        });

        console.log('Fetched applications:', transformedData);
        setApplications(transformedData);
      } catch (error: any) {
        console.error('Error fetching applications:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (min && max) {
      return `$${min} - $${max}`;
    } else if (min) {
      return `$${min}+`;
    } else if (max) {
      return `Up to $${max}`;
    }
    return 'Not specified';
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>My Job Applications</CardTitle>
          <CardDescription>Track the status of your job applications</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-900 rounded-lg p-4 mb-4">
              {error}
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
              <p className="text-muted-foreground">
                Start applying to jobs to see your applications here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map(app => (
                <Card key={app.id} className="bg-card">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{app.job_title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Building2 className="h-4 w-4" />
                            <span>{app.company_name || 'Unknown Company'}</span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(app.status)}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="text-sm space-y-2">
                        <p className="text-muted-foreground">{app.job_description}</p>

                        <div className="flex flex-wrap gap-4 mt-4">
                          <Badge variant="secondary" className="text-xs">
                            {app.job_type}
                          </Badge>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Budget: {formatBudget(app.job_budget_min, app.job_budget_max)}</span>
                          </div>
                        </div>
                      </div>
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

export default StudentJobsPage; 