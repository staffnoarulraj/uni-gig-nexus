-- First, let's create a function to get employer_id from employer_profiles
CREATE OR REPLACE FUNCTION get_employer_profile_id(user_id UUID)
RETURNS UUID AS $$
  SELECT id FROM public.employer_profiles WHERE user_id = $1;
$$ LANGUAGE sql STABLE;

-- Create a view that joins jobs with employer_profiles through users
CREATE OR REPLACE VIEW public.jobs_with_employers AS
SELECT 
  j.*,
  ep.company_name,
  ep.id as employer_profile_id
FROM 
  public.jobs j
  LEFT JOIN public.employer_profiles ep ON j.employer_id = ep.user_id;

-- Grant access to the view
GRANT SELECT ON public.jobs_with_employers TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Jobs with employers are viewable by everyone" ON public.jobs_with_employers
  FOR SELECT USING (true); 