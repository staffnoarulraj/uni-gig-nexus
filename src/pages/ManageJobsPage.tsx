import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  job_type: 'part-time' | 'full-time' | 'project' | 'internship';
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: 'open' | 'closed' | 'filled';
}

interface SupabaseJob {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  job_type: 'part-time' | 'full-time' | 'project' | 'internship' | null;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: 'open' | 'closed' | 'filled';
  employer_id: string;
  created_at: string;
  updated_at: string;
}

const JOB_TYPES = ['part-time', 'full-time', 'project', 'internship'] as const;
const JOB_STATUSES = ['open', 'closed', 'filled'] as const;

const ManageJobsPage: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editJobId, setEditJobId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<Job>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    if (!user) return;
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', user.id)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    
    // Transform data to ensure job_type is present
    const transformedData = ((data || []) as unknown as SupabaseJob[]).map(job => ({
      id: job.id,
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      job_type: job.job_type || 'part-time',
      budget_min: job.budget_min,
      budget_max: job.budget_max,
      deadline: job.deadline,
      status: job.status
    }));
    
    setJobs(transformedData);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line
  }, [user]);

  const startEdit = (job: Job) => {
    setEditJobId(job.id);
    setEditFields({ ...job });
  };

  const cancelEdit = () => {
    setEditJobId(null);
    setEditFields({});
  };

  const handleEditChange = (field: keyof Job, value: any) => {
    setEditFields(prev => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    if (!editJobId) return;
    setSaving(true);
    const { error } = await supabase
      .from('jobs')
      .update({
        title: editFields.title,
        description: editFields.description,
        requirements: editFields.requirements,
        job_type: editFields.job_type,
        budget_min: editFields.budget_min ? Number(editFields.budget_min) : null,
        budget_max: editFields.budget_max ? Number(editFields.budget_max) : null,
        deadline: editFields.deadline || null,
        status: editFields.status || 'open',
      })
      .eq('id', editJobId);
    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      cancelEdit();
      fetchJobs();
    }
  };

  const deleteJob = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    setDeleting(null);
    if (error) {
      setError(error.message);
    } else {
      fetchJobs();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'filled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Manage Jobs</CardTitle>
          <CardDescription>View, edit, and manage your posted jobs.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">No jobs posted yet</h3>
              <p className="text-muted-foreground">Start posting jobs to find talented students.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {jobs.map(job => (
                <Card key={job.id} className="bg-card">
                  <CardContent className="pt-6">
                    {editJobId === job.id ? (
                      <form className="space-y-4" onSubmit={e => { e.preventDefault(); saveEdit(); }}>
                        <div className="space-y-2">
                          <Label htmlFor="title">Job Title</Label>
                          <Input
                            id="title"
                            value={editFields.title || ''}
                            onChange={e => handleEditChange('title', e.target.value)}
                            placeholder="e.g., Frontend Developer"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="jobType">Job Type</Label>
                          <Select
                            value={editFields.job_type}
                            onValueChange={(value: Job['job_type']) => handleEditChange('job_type', value)}
                          >
                            <SelectTrigger id="jobType">
                              <SelectValue placeholder="Select job type" />
                            </SelectTrigger>
                            <SelectContent>
                              {JOB_TYPES.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={editFields.description || ''}
                            onChange={e => handleEditChange('description', e.target.value)}
                            placeholder="Describe the role and responsibilities"
                            className="min-h-[100px]"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="requirements">Requirements</Label>
                          <Textarea
                            id="requirements"
                            value={editFields.requirements || ''}
                            onChange={e => handleEditChange('requirements', e.target.value)}
                            placeholder="List the required skills and qualifications"
                            className="min-h-[100px]"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="budgetMin">Minimum Budget</Label>
                            <Input
                              id="budgetMin"
                              type="number"
                              value={editFields.budget_min || ''}
                              onChange={e => handleEditChange('budget_min', e.target.value)}
                              placeholder="e.g., 1000"
                              min={0}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="budgetMax">Maximum Budget</Label>
                            <Input
                              id="budgetMax"
                              type="number"
                              value={editFields.budget_max || ''}
                              onChange={e => handleEditChange('budget_max', e.target.value)}
                              placeholder="e.g., 2000"
                              min={0}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="deadline">Application Deadline</Label>
                          <Input
                            id="deadline"
                            type="date"
                            value={editFields.deadline ? String(editFields.deadline).slice(0, 10) : ''}
                            onChange={e => handleEditChange('deadline', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={editFields.status}
                            onValueChange={(value: Job['status']) => handleEditChange('status', value)}
                          >
                            <SelectTrigger id="status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {JOB_STATUSES.map(status => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button type="submit" disabled={saving}>
                            {saving ? 'Saving Changes...' : 'Save Changes'}
                          </Button>
                          <Button type="button" variant="outline" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{job.title}</h3>
                            <div className="flex gap-2 mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {job.job_type}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                {job.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(job)}>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteJob(job.id)}
                              disabled={deleting === job.id}
                            >
                              {deleting === job.id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </div>
                        </div>

                        <div className="text-sm space-y-2">
                          <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                          
                          {job.requirements && (
                            <div className="mt-2">
                              <strong className="block text-sm font-medium mb-1">Requirements:</strong>
                              <p className="text-muted-foreground whitespace-pre-wrap">{job.requirements}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <strong className="block text-sm font-medium">Budget Range:</strong>
                              <span className="text-muted-foreground">
                                {job.budget_min || job.budget_max
                                  ? `$${job.budget_min || 0} - $${job.budget_max || '∞'}`
                                  : 'Not specified'}
                              </span>
                            </div>
                            <div>
                              <strong className="block text-sm font-medium">Deadline:</strong>
                              <span className="text-muted-foreground">
                                {job.deadline
                                  ? new Date(job.deadline).toLocaleDateString()
                                  : 'No deadline'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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

export default ManageJobsPage; 