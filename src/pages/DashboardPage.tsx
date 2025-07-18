import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Users, 
  TrendingUp, 
  Star, 
  Plus, 
  Search,
  FileText,
  Calendar,
  DollarSign,
  Target
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for real employer stats
  const [activeJobs, setActiveJobs] = useState<number | null>(null);
  const [applicationsReceived, setApplicationsReceived] = useState<number | null>(null);

  // Student stats state
  const [applicationsSent, setApplicationsSent] = useState<number | null>(null);
  const [jobsApplied, setJobsApplied] = useState<number | null>(null);

  useEffect(() => {
    const fetchEmployerStats = async () => {
      if (user?.userType !== 'employer') return;
      // Fetch active jobs count
      const { count: jobsCount } = await supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('employer_id', user.id)
        .eq('status', 'open');
      setActiveJobs(jobsCount ?? 0);
      // Fetch applications received count
      const { count: appsCount } = await supabase
        .from('job_applications')
        .select('id', { count: 'exact', head: true })
        .in('job_id',
          (await supabase
            .from('jobs')
            .select('id')
            .eq('employer_id', user.id)
          ).data?.map(j => j.id) || []
        );
      setApplicationsReceived(appsCount ?? 0);
    };
    fetchEmployerStats();
  }, [user]);

  useEffect(() => {
    const fetchStudentStats = async () => {
      if (user?.userType !== 'student') return;
      // Applications Sent
      const { count: appsCount } = await supabase
        .from('job_applications')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', user.id);
      setApplicationsSent(appsCount ?? 0);
      // Jobs Applied (unique job_id)
      const { data: apps } = await supabase
        .from('job_applications')
        .select('job_id')
        .eq('student_id', user.id);
      setJobsApplied(apps ? new Set(apps.map(a => a.job_id)).size : 0);
    };
    fetchStudentStats();
  }, [user]);

  const studentStats = [
    { title: 'Applications Sent', value: applicationsSent !== null ? applicationsSent : '...', icon: FileText, color: 'text-primary' },
    { title: 'Jobs Applied', value: jobsApplied !== null ? jobsApplied : '...', icon: Briefcase, color: 'text-secondary' },
    { title: 'Profile Views', value: '45', icon: Users, color: 'text-accent' },
    { title: 'Success Rate', value: '67%', icon: TrendingUp, color: 'text-secondary-light' },
  ];

  const employerStats = [
    { title: 'Active Jobs', value: activeJobs !== null ? activeJobs : '...', icon: Briefcase, color: 'text-primary' },
    { title: 'Applications Received', value: applicationsReceived !== null ? applicationsReceived : '...', icon: FileText, color: 'text-secondary', link: '/review-applications' },
    { title: 'Hired Students', value: '12', icon: Users, color: 'text-accent' },
    { title: 'Success Rate', value: '85%', icon: TrendingUp, color: 'text-secondary-light' },
  ];

  const stats = user?.userType === 'student' ? studentStats : employerStats;

  const quickActions = user?.userType === 'student' ? [
    { title: 'Browse Jobs', description: 'Find your next opportunity', icon: Search, action: () => navigate('/available-jobs'), variant: 'default' as const },
    { title: 'View Applications', description: 'Check your job applications', icon: FileText, action: () => navigate('/my-jobs'), variant: 'secondary' as const },
    { title: 'Update Profile', description: 'Keep your profile current', icon: Users, action: () => navigate('/profile'), variant: 'outline' as const },
  ] : [
    { title: 'Post New Job', description: 'Create a new job posting', icon: Plus, action: () => navigate('/post-job'), variant: 'default' as const },
    { title: 'Manage Jobs', description: 'Edit your job postings', icon: Briefcase, action: () => navigate('/manage-jobs'), variant: 'secondary' as const },
    { title: 'View Analytics', description: 'See your hiring metrics', icon: TrendingUp, action: () => navigate('/analytics'), variant: 'outline' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-hero text-white p-8 rounded-xl shadow-large">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-xl text-white/90">
            {user?.userType === 'student' 
              ? 'Ready to find your next opportunity?' 
              : 'Let\'s find the perfect students for your projects!'
            }
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          user?.userType === 'employer' && stat.title === 'Applications Received' ? (
            <Card key={index} className="bg-gradient-card border-0 shadow-medium hover:shadow-large transition-all duration-300 cursor-pointer" onClick={() => navigate(stat.link)} tabIndex={0} role="button" aria-label="View Applications Received">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gradient-primary`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card key={index} className="bg-gradient-card border-0 shadow-medium hover:shadow-large transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gradient-primary`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Card key={index} className="bg-white border-0 shadow-medium hover:shadow-large transition-all duration-300 group cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-primary group-hover:scale-110 transition-transform">
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{action.description}</CardDescription>
                <Button 
                  variant={action.variant}
                  size="sm"
                  onClick={action.action}
                  className="w-full"
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white border-0 shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {user?.userType === 'student' ? (
              <>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-primary/20 rounded-full">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Applied to Frontend Developer position</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-secondary/20 rounded-full">
                    <Users className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Profile viewed by Tech Startup Inc.</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-primary/20 rounded-full">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">New application for Marketing Assistant</p>
                    <p className="text-xs text-muted-foreground">3 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-secondary/20 rounded-full">
                    <Plus className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Posted Web Developer position</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};