/*
  # Add resources functionality
  
  1. New Tables
    - `resources`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `file_url` (text)
      - `thumbnail_url` (text, nullable)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on resources table
    - Add policies for authenticated users to:
      - Read all resources
      - Create their own resources
*/

CREATE TABLE resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  file_url text NOT NULL,
  thumbnail_url text,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read resources
CREATE POLICY "Anyone can read resources"
  ON resources
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to create their own resources
CREATE POLICY "Users can create own resources"
  ON resources
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Storage policies for the resources bucket
BEGIN;
  -- Create storage bucket for resources
  INSERT INTO storage.buckets (id, name)
  VALUES ('resources', 'resources')
  ON CONFLICT DO NOTHING;

  -- Policy to allow authenticated users to read all resources
  CREATE POLICY "Anyone can read resources"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'resources');

  -- Policy to allow users to upload their own resources
  CREATE POLICY "Users can upload resources"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'resources' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
COMMIT;