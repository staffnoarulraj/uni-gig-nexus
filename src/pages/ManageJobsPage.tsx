import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: string;
}

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
    setJobs(data || []);
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

  const handleEditChange = (field: keyof Job, value: string) => {
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
        budget_min: editFields.budget_min ? Number(editFields.budget_min) : null,
        budget_max: editFields.budget_max ? Number(editFields.budget_max) : null,
        deadline: editFields.deadline || null,
        status: editFields.status,
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Manage Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 text-red-600 font-medium">{error}</div>}
          {loading ? (
            <div>Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div>No jobs found.</div>
          ) : (
            <div className="space-y-6">
              {jobs.map(job => (
                <Card key={job.id} className="bg-muted/50">
                  <CardContent className="py-4">
                    {editJobId === job.id ? (
                      <form className="space-y-2" onSubmit={e => { e.preventDefault(); saveEdit(); }}>
                        <div>
                          <Label>Title</Label>
                          <Input value={editFields.title || ''} onChange={e => handleEditChange('title', e.target.value)} required />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input value={editFields.description || ''} onChange={e => handleEditChange('description', e.target.value)} required />
                        </div>
                        <div>
                          <Label>Requirements</Label>
                          <Input value={editFields.requirements || ''} onChange={e => handleEditChange('requirements', e.target.value)} />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <Label>Budget Min</Label>
                            <Input type="number" value={editFields.budget_min || ''} onChange={e => handleEditChange('budget_min', e.target.value)} min={0} />
                          </div>
                          <div className="flex-1">
                            <Label>Budget Max</Label>
                            <Input type="number" value={editFields.budget_max || ''} onChange={e => handleEditChange('budget_max', e.target.value)} min={0} />
                          </div>
                        </div>
                        <div>
                          <Label>Deadline</Label>
                          <Input type="date" value={editFields.deadline ? String(editFields.deadline).slice(0, 10) : ''} onChange={e => handleEditChange('deadline', e.target.value)} />
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Input value={editFields.status || ''} onChange={e => handleEditChange('status', e.target.value)} />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                          <Button type="button" variant="secondary" onClick={cancelEdit}>Cancel</Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="font-bold text-lg">{job.title}</div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(job)}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteJob(job.id)} disabled={deleting === job.id}>
                              {deleting === job.id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </div>
                        </div>
                        <div className="text-muted-foreground">{job.description}</div>
                        <div className="text-sm">Requirements: {job.requirements || 'N/A'}</div>
                        <div className="text-sm">Budget: {job.budget_min || 'N/A'} - {job.budget_max || 'N/A'}</div>
                        <div className="text-sm">Deadline: {job.deadline ? String(job.deadline).slice(0, 10) : 'N/A'}</div>
                        <div className="text-sm">Status: {job.status}</div>
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