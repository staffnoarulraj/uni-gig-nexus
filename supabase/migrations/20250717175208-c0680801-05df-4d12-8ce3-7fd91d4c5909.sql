-- Drop the custom users table and fix references

-- Update job applications table to reference auth.users directly
ALTER TABLE public.job_applications 
DROP CONSTRAINT job_applications_student_id_fkey;

ALTER TABLE public.job_applications 
ADD CONSTRAINT job_applications_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update jobs table to reference auth.users directly
ALTER TABLE public.jobs 
DROP CONSTRAINT jobs_employer_id_fkey;

ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_employer_id_fkey 
FOREIGN KEY (employer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update student_profiles table to reference auth.users directly
ALTER TABLE public.student_profiles 
DROP CONSTRAINT student_profiles_user_id_fkey;

ALTER TABLE public.student_profiles 
ADD CONSTRAINT student_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update employer_profiles table to reference auth.users directly
ALTER TABLE public.employer_profiles 
DROP CONSTRAINT employer_profiles_user_id_fkey;

ALTER TABLE public.employer_profiles 
ADD CONSTRAINT employer_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the custom users table
DROP TABLE public.users CASCADE;

-- Drop the user_type enum as it's no longer needed
DROP TYPE user_type;