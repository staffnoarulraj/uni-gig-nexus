-- Create enum for user types
CREATE TYPE user_type AS ENUM ('student', 'employer');

-- Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_type user_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student profiles table
CREATE TABLE public.student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    bio TEXT,
    skills TEXT[],
    resume_url TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create employer profiles table
CREATE TABLE public.employer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    company_description TEXT,
    website_url TEXT,
    contact_email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create jobs table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    budget_min INTEGER,
    budget_max INTEGER,
    deadline DATE,
    tags TEXT[],
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job applications table
CREATE TABLE public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cover_letter TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, student_id)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for student_profiles table
CREATE POLICY "Students can view their own profile" ON public.student_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can update their own profile" ON public.student_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Students can insert their own profile" ON public.student_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view student profiles" ON public.student_profiles
    FOR SELECT USING (true);

-- RLS Policies for employer_profiles table
CREATE POLICY "Employers can view their own profile" ON public.employer_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Employers can update their own profile" ON public.employer_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Employers can insert their own profile" ON public.employer_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view employer profiles" ON public.employer_profiles
    FOR SELECT USING (true);

-- RLS Policies for jobs table
CREATE POLICY "Everyone can view open jobs" ON public.jobs
    FOR SELECT USING (true);

CREATE POLICY "Employers can insert their own jobs" ON public.jobs
    FOR INSERT WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update their own jobs" ON public.jobs
    FOR UPDATE USING (auth.uid() = employer_id);

CREATE POLICY "Employers can delete their own jobs" ON public.jobs
    FOR DELETE USING (auth.uid() = employer_id);

-- RLS Policies for job_applications table
CREATE POLICY "Students can view their own applications" ON public.job_applications
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Employers can view applications to their jobs" ON public.job_applications
    FOR SELECT USING (auth.uid() IN (SELECT employer_id FROM public.jobs WHERE id = job_id));

CREATE POLICY "Students can insert their own applications" ON public.job_applications
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own applications" ON public.job_applications
    FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Employers can update applications to their jobs" ON public.job_applications
    FOR UPDATE USING (auth.uid() IN (SELECT employer_id FROM public.jobs WHERE id = job_id));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON public.student_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employer_profiles_updated_at BEFORE UPDATE ON public.employer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_student_profiles_user_id ON public.student_profiles(user_id);
CREATE INDEX idx_employer_profiles_user_id ON public.employer_profiles(user_id);
CREATE INDEX idx_jobs_employer_id ON public.jobs(employer_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_student_id ON public.job_applications(student_id);