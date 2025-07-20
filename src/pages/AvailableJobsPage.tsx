import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Search, 
  Clock,
  Building2,
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  skills_required: string[];
  budget_min: number;
  budget_max: number;
  deadline: string;
  status: string;
  created_at: string;
  employer_profiles: {
    company_name: string;
  } | null;
}

export const AvailableJobsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchJobs();
    if (user?.userType === 'student') {
      fetchAppliedJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          employer_profiles(company_name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setJobs((data as any) || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('job_id')
        .eq('student_id', user.id);

      if (error) throw error;
      setAppliedJobs(new Set(data?.map(app => app.job_id) || []));
    } catch (error) {
      console.error('Error fetching applied jobs:', error);
    }
  };

  const applyToJob = async (jobId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to apply for jobs.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Applying to job:', { jobId, studentId: user.id, userType: user.userType });
      
      // Check if user has a student profile
      const { data: studentProfile, error: profileError } = await supabase
        .from('student_profiles')
        .select('id, full_name')
        .eq('user_id', user.id)
        .single();

      if (profileError || !studentProfile) {
        console.error('Student profile error:', profileError);
        toast({
          title: "Profile Required",
          description: "Please complete your student profile before applying for jobs.",
          variant: "destructive",
        });
        return;
      }

      console.log('Student profile found:', studentProfile);

      // Check if already applied
      const { data: existingApplication } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('student_id', user.id)
        .single();

      if (existingApplication) {
        toast({
          title: "Already Applied",
          description: "You have already applied for this job.",
          variant: "destructive",
        });
        return;
      }

      // Submit application
      const { data, error } = await supabase
        .from('job_applications')
        .insert([{
          job_id: jobId,
          student_id: user.id,
          status: 'pending'
        }])
        .select();

      if (error) {
        console.error('Application submission error:', error);
        toast({
          title: "Error",
          description: `Failed to submit application: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('Application submitted successfully:', data);

      setAppliedJobs(prev => new Set([...prev, jobId]));
      toast({
        title: "Success!",
        description: "Your application has been submitted successfully.",
      });
    } catch (error) {
      console.error('Unexpected error applying to job:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (job.employer_profiles?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatBudget = (min: number, max: number) => {
    if (min && max) {
      return `$${min} - $${max}`;
    } else if (min) {
      return `$${min}+`;
    } else if (max) {
      return `Up to $${max}`;
    }
    return 'Not specified';
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Available Jobs</h1>
          <p className="text-muted-foreground">
            {filteredJobs.length} opportunities available
          </p>
        </div>
        
        {/* Search */}
        <div className="w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="bg-white border-0 shadow-medium hover:shadow-large transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight mb-2">{job.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{job.employer_profiles?.company_name || 'Unknown Company'}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <CardDescription className="line-clamp-3">
                {job.description}
              </CardDescription>
              
              {/* Skills */}
              {job.skills_required && job.skills_required.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {job.skills_required.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {job.skills_required.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{job.skills_required.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Job Details */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>{formatBudget(job.budget_min, job.budget_max)}</span>
                </div>
                
                {job.deadline && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Deadline: {formatDate(job.deadline)}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Posted {formatDate(job.created_at)}</span>
                </div>
              </div>
              
              {/* Apply Button */}
              {user?.userType === 'student' && (
                <Button
                  onClick={() => applyToJob(job.id)}
                  disabled={appliedJobs.has(job.id)}
                  variant={appliedJobs.has(job.id) ? "secondary" : "default"}
                  className="w-full"
                >
                  {appliedJobs.has(job.id) ? 'Applied' : 'Apply Now'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
};