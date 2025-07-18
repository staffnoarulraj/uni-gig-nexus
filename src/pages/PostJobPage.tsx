import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PostJobPage: React.FC = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!user) return;
    if (!title || !description) {
      setError('Title and description are required.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('jobs').insert([
      {
        employer_id: user.id,
        title,
        description,
        requirements,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        deadline: deadline || null,
        status: 'open',
      }
    ]);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTitle('');
      setDescription('');
      setRequirements('');
      setBudgetMin('');
      setBudgetMax('');
      setDeadline('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Post a Job</CardTitle>
        </CardHeader>
        <CardContent>
          {success && <div className="mb-4 text-green-600 font-medium">Job posted successfully!</div>}
          {error && <div className="mb-4 text-red-600 font-medium">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Job Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="requirements">Requirements</Label>
              <Input id="requirements" value={requirements} onChange={e => setRequirements(e.target.value)} />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="budgetMin">Budget Min</Label>
                <Input id="budgetMin" type="number" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} min={0} />
              </div>
              <div className="flex-1">
                <Label htmlFor="budgetMax">Budget Max</Label>
                <Input id="budgetMax" type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} min={0} />
              </div>
            </div>
            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Posting...' : 'Post Job'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostJobPage; 