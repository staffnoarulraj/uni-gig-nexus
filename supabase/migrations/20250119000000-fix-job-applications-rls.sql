-- Fix RLS policies for job applications to ensure proper access control

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Students can create applications" ON public.job_applications;
DROP POLICY IF EXISTS "Students can insert their own applications" ON public.job_applications;

-- Create the correct policy for students to insert applications
CREATE POLICY "Students can insert applications" ON public.job_applications
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Ensure all other policies are in place
DO $$
BEGIN
  -- Check if other necessary policies exist, if not create them
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'job_applications' 
    AND policyname = 'Students can view their own applications'
  ) THEN
    CREATE POLICY "Students can view their own applications" ON public.job_applications
      FOR SELECT USING (auth.uid() = student_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'job_applications' 
    AND policyname = 'Employers can view applications to their jobs'
  ) THEN
    CREATE POLICY "Employers can view applications to their jobs" ON public.job_applications
      FOR SELECT USING (auth.uid() IN (SELECT employer_id FROM public.jobs WHERE id = job_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'job_applications' 
    AND policyname = 'Students can update their own applications'
  ) THEN
    CREATE POLICY "Students can update their own applications" ON public.job_applications
      FOR UPDATE USING (auth.uid() = student_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'job_applications' 
    AND policyname = 'Employers can update applications to their jobs'
  ) THEN
    CREATE POLICY "Employers can update applications to their jobs" ON public.job_applications
      FOR UPDATE USING (auth.uid() IN (SELECT employer_id FROM public.jobs WHERE id = job_id));
  END IF;
END
$$;

-- Make sure RLS is enabled
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Add helpful indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_job_applications_student_id ON public.job_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);