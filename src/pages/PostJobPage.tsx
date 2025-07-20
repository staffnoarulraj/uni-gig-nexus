import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
    
    if (!user) {
      setError('You must be logged in to post a job.');
      return;
    }
    
    if (!title || !description) {
      setError('Title and description are required.');
      return;
    }

    if (budgetMin && budgetMax && Number(budgetMin) > Number(budgetMax)) {
      setError('Minimum budget cannot be greater than maximum budget.');
      return;
    }

    setLoading(true);
    
    try {
      const { error: insertError } = await supabase.from('jobs').insert([
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

      if (insertError) throw insertError;

      setSuccess(true);
      setTitle('');
      setDescription('');
      setRequirements('');
      setBudgetMin('');
      setBudgetMax('');
      setDeadline('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Post a Job</CardTitle>
          <CardDescription>Create a new job listing for students to apply.</CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-6 bg-green-50 text-green-900 border-green-200">
              <AlertDescription>Job posted successfully! Students can now view and apply to your job listing.</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g., Frontend Developer, Marketing Intern"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the role, responsibilities, and what you're looking for in a candidate."
                className="min-h-[150px]"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea 
                id="requirements" 
                value={requirements} 
                onChange={e => setRequirements(e.target.value)}
                placeholder="List the skills, qualifications, and experience required for this position."
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetMin">Minimum Budget</Label>
                <Input 
                  id="budgetMin" 
                  type="number" 
                  value={budgetMin} 
                  onChange={e => setBudgetMin(e.target.value)} 
                  placeholder="e.g., 1000"
                  min={0} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetMax">Maximum Budget</Label>
                <Input 
                  id="budgetMax" 
                  type="number" 
                  value={budgetMax} 
                  onChange={e => setBudgetMax(e.target.value)} 
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
                value={deadline} 
                onChange={e => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Posting Job...' : 'Post Job'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostJobPage; 