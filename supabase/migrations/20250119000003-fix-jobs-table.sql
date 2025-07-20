-- Drop the old jobs table
DROP TABLE IF EXISTS public.jobs CASCADE;

-- Recreate jobs table with correct structure
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    job_type TEXT NOT NULL DEFAULT 'part-time' CHECK (job_type IN ('part-time', 'full-time', 'project', 'internship')),
    budget_min INTEGER,
    budget_max INTEGER,
    deadline DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Everyone can view jobs" ON public.jobs
    FOR SELECT USING (true);

CREATE POLICY "Employers can insert their own jobs" ON public.jobs
    FOR INSERT WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update their own jobs" ON public.jobs
    FOR UPDATE USING (auth.uid() = employer_id);

CREATE POLICY "Employers can delete their own jobs" ON public.jobs
    FOR DELETE USING (auth.uid() = employer_id);

-- Recreate trigger for updated_at
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Recreate indexes
CREATE INDEX idx_jobs_employer_id ON public.jobs(employer_id);
CREATE INDEX idx_jobs_status ON public.jobs(status); 