-- Add major column to student_profiles if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'student_profiles' 
    AND column_name = 'major'
  ) THEN
    ALTER TABLE public.student_profiles ADD COLUMN major TEXT;
  END IF;
END $$; 