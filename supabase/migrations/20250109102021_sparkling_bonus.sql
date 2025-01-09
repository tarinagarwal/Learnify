/*
  # Add course ratings functionality

  1. New Tables
    - `course_ratings`
      - `id` (uuid, primary key)
      - `course_id` (uuid, references courses)
      - `user_id` (uuid, references profiles)
      - `rating` (integer, 1-5)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Constraints
    - Unique constraint on course_id and user_id to prevent duplicate ratings
    - Check constraint to ensure rating is between 1 and 5

  3. Security
    - Enable RLS
    - Add policies for reading and managing ratings
*/

-- Create course_ratings table
CREATE TABLE course_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_course_rating UNIQUE (course_id, user_id),
  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5)
);

-- Enable RLS
ALTER TABLE course_ratings ENABLE ROW LEVEL SECURITY;

-- Add trigger for updated_at
CREATE TRIGGER update_course_ratings_updated_at
    BEFORE UPDATE ON course_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
CREATE POLICY "Anyone can read course ratings"
  ON course_ratings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own ratings"
  ON course_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON course_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON course_ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add helper function to calculate average rating
CREATE OR REPLACE FUNCTION get_course_rating(course_uuid uuid)
RETURNS TABLE (
  average_rating numeric,
  total_ratings bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(AVG(rating)::numeric, 1) as average_rating,
    COUNT(*) as total_ratings
  FROM course_ratings
  WHERE course_id = course_uuid;
END;
$$ LANGUAGE plpgsql;