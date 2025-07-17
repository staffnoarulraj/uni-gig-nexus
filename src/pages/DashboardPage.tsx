import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

  const studentStats = [
    { title: 'Applications Sent', value: '12', icon: FileText, color: 'text-primary' },
    { title: 'Jobs Applied', value: '8', icon: Briefcase, color: 'text-secondary' },
    { title: 'Profile Views', value: '45', icon: Users, color: 'text-accent' },
    { title: 'Success Rate', value: '67%', icon: TrendingUp, color: 'text-secondary-light' },
  ];

  const employerStats = [
    { title: 'Active Jobs', value: '5', icon: Briefcase, color: 'text-primary' },
    { title: 'Applications Received', value: '28', icon: FileText, color: 'text-secondary' },
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