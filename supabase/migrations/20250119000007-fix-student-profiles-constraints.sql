-- Drop the existing unique constraint if it exists
ALTER TABLE public.student_profiles DROP CONSTRAINT IF EXISTS student_profiles_user_id_key;

-- Add the unique constraint back with ON CONFLICT DO UPDATE behavior
ALTER TABLE public.student_profiles ADD CONSTRAINT student_profiles_user_id_key UNIQUE (user_id);

-- Update the RLS policies to allow updates
DROP POLICY IF EXISTS "Students can update their own profile" ON public.student_profiles;
CREATE POLICY "Students can update their own profile" ON public.student_profiles
  FOR UPDATE USING (auth.uid() = user_id); 