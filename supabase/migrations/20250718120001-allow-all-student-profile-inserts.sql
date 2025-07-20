-- Allow authenticated users to upload to resumes bucket
CREATE POLICY "Authenticated can upload to resumes"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resumes');