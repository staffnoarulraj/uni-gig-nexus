-- Drop existing jobs table and its dependencies
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;

-- Create jobs table with correct structure
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

-- Create job applications table
CREATE TABLE public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cover_letter TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, student_id)
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for jobs
CREATE POLICY "Everyone can view jobs" ON public.jobs
    FOR SELECT USING (true);

CREATE POLICY "Employers can insert their own jobs" ON public.jobs
    FOR INSERT WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update their own jobs" ON public.jobs
    FOR UPDATE USING (auth.uid() = employer_id);

CREATE POLICY "Employers can delete their own jobs" ON public.jobs
    FOR DELETE USING (auth.uid() = employer_id);

-- Create policies for job applications
CREATE POLICY "Students can view their own applications" ON public.job_applications
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Employers can view applications to their jobs" ON public.job_applications
    FOR SELECT USING (auth.uid() IN (SELECT employer_id FROM public.jobs WHERE id = job_id));

CREATE POLICY "Students can create applications" ON public.job_applications
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own applications" ON public.job_applications
    FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Employers can update applications to their jobs" ON public.job_applications
    FOR UPDATE USING (auth.uid() IN (SELECT employer_id FROM public.jobs WHERE id = job_id));

-- Create indexes
CREATE INDEX idx_jobs_employer_id ON public.jobs(employer_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_student_id ON public.job_applications(student_id); 