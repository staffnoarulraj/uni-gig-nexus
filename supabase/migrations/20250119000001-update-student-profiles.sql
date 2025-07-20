-- Add new fields to student_profiles table
ALTER TABLE public.student_profiles
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS major TEXT,
ADD COLUMN IF NOT EXISTS year_of_study TEXT;

-- Update RLS policies to include new fields
CREATE POLICY "Students can update their own profile fields" ON public.student_profiles
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON public.student_profiles(user_id); 