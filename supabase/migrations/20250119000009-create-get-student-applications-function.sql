-- Create a function to get student applications with job details
CREATE OR REPLACE FUNCTION get_student_applications(p_student_id UUID)
RETURNS TABLE (
  id UUID,
  job_id UUID,
  student_id UUID,
  status TEXT,
  applied_at TIMESTAMPTZ,
  job_title TEXT,
  job_description TEXT,
  job_type TEXT,
  job_budget_min INTEGER,
  job_budget_max INTEGER,
  company_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ja.id,
    ja.job_id,
    ja.student_id,
    ja.status,
    ja.applied_at,
    j.title as job_title,
    j.description as job_description,
    j.job_type,
    j.budget_min as job_budget_min,
    j.budget_max as job_budget_max,
    ep.company_name
  FROM 
    job_applications ja
    INNER JOIN jobs j ON ja.job_id = j.id
    LEFT JOIN employer_profiles ep ON j.employer_id = ep.user_id
  WHERE 
    ja.student_id = p_student_id
  ORDER BY 
    ja.applied_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 