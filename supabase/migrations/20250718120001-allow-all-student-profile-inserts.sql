-- TEMPORARY: Allow all inserts into student_profiles for debugging
CREATE POLICY "Allow all inserts" ON public.student_profiles
  FOR INSERT WITH CHECK (true); 