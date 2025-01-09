/*
  # Fix profiles table policies
  
  1. Changes
    - Add INSERT policy for profiles table to allow users to create their own profile
*/

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);