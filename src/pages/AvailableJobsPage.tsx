import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  requirements: string | null;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: 'open' | 'closed' | 'filled';
  created_at: string;
  employer_id: string;
  employer_profiles: {
    company_name: string;
  } | null;
}

interface ApplicationForm {
  name: string;
  email: string;
  phone: string;
  university: string;
  degree: string;
  bio: string;
  coverLetter: string;
}

export const AvailableJobsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationForm, setApplicationForm] = useState<ApplicationForm>({
    name: '',
    email: '',
    phone: '',
    university: '',
    degree: '',
    bio: '',
    coverLetter: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
    if (user?.userType === 'student') {
      fetchAppliedJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      // First get all jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          description,
          requirements,
          budget_min,
          budget_max,
          deadline,
          status,
          created_at,
          employer_id
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Then get employer profiles for these jobs
      const employerIds = (jobsData || []).map(job => job.employer_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('employer_profiles')
        .select('user_id, company_name')
        .in('user_id', employerIds);

      if (profilesError) throw profilesError;

      // Map employer profiles to jobs
      const employerProfileMap = new Map(
        (profilesData || []).map(profile => [profile.user_id, profile])
      );

      const jobsWithProfiles = (jobsData || []).map(job => ({
        ...job,
        employer_profiles: employerProfileMap.get(job.employer_id) || { company_name: 'Unknown Company' }
      }));

      console.log('Fetched jobs with profiles:', jobsWithProfiles);
      setJobs(jobsWithProfiles);
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

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    // Pre-fill form if we have student profile data
    if (user?.userType === 'student') {
      fetchStudentProfile();
    }
  };

  const fetchStudentProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setApplicationForm(prev => ({
          ...prev,
          name: data.full_name || '',
          email: user.email || '',
          phone: data.phone || '',
          university: data.university || '',
          degree: data.major || '',
          bio: data.bio || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
    }
  };

  const handleApplicationSubmit = async () => {
    if (!user || !selectedJob) return;
    
    setSubmitting(true);
    try {
      // First update/create student profile
      const { error: profileError } = await supabase
        .from('student_profiles')
        .upsert(
          {
            user_id: user.id,
            full_name: applicationForm.name,
            phone: applicationForm.phone,
            university: applicationForm.university,
            bio: applicationForm.bio
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false
          }
        );

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      // Then create the job application
      const { error: applicationError } = await supabase
        .from('job_applications')
        .insert([{
          job_id: selectedJob.id,
          student_id: user.id,
          cover_letter: applicationForm.coverLetter,
          status: 'pending'
        }]);

      if (applicationError) {
        console.error('Application error:', applicationError);
        throw applicationError;
      }

      setAppliedJobs(prev => new Set([...prev, selectedJob.id]));
      setSelectedJob(null);
      toast({
        title: "Success!",
        description: "Your application has been submitted successfully.",
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
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
                    onClick={() => handleApplyClick(job)}
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

      {/* Application Form Dialog */}
      <Dialog open={selectedJob !== null} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Please fill out the application form below. All fields are required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleApplicationSubmit(); }} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={applicationForm.name}
                onChange={(e) => setApplicationForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={applicationForm.email}
                onChange={(e) => setApplicationForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={applicationForm.phone}
                onChange={(e) => setApplicationForm(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="university">University</Label>
              <Input
                id="university"
                value={applicationForm.university}
                onChange={(e) => setApplicationForm(prev => ({ ...prev, university: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="major">Major (Optional)</Label>
              <Input
                id="major"
                value={applicationForm.degree}
                onChange={(e) => setApplicationForm(prev => ({ ...prev, degree: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Tell us about yourself</Label>
              <Textarea
                id="bio"
                value={applicationForm.bio}
                onChange={(e) => setApplicationForm(prev => ({ ...prev, bio: e.target.value }))}
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverLetter">Cover Letter</Label>
              <Textarea
                id="coverLetter"
                value={applicationForm.coverLetter}
                onChange={(e) => setApplicationForm(prev => ({ ...prev, coverLetter: e.target.value }))}
                className="min-h-[150px]"
                placeholder="Why are you interested in this position? What makes you a good fit?"
                required
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setSelectedJob(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};