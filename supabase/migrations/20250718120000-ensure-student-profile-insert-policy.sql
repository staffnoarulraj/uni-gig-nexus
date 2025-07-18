-- Ensure RLS is enabled
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing insert policy to avoid duplicates
DROP POLICY IF EXISTS "Students can insert their own profile" ON public.student_profiles;

-- Create the correct insert policy
CREATE POLICY "Students can insert their own profile" ON public.student_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id); 