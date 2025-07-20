-- Update existing rows to have a default job_type
UPDATE public.jobs
SET job_type = 'part-time'
WHERE job_type IS NULL;

-- Make job_type NOT NULL with default value
ALTER TABLE public.jobs
ALTER COLUMN job_type SET NOT NULL,
ALTER COLUMN job_type SET DEFAULT 'part-time'; 