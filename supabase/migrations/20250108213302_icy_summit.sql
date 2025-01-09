/*
  # Expert Chat System

  1. New Tables
    - `experts`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `created_at` (timestamp)
    
    - `chat_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `expert_id` (uuid, references experts, nullable)
      - `reason` (text)
      - `status` (enum: pending, active, closed)
      - `created_at` (timestamp)
      - `closed_at` (timestamp, nullable)

    - `chat_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references chat_sessions)
      - `sender_id` (uuid)
      - `is_expert` (boolean)
      - `content` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for experts and users
*/

-- Create experts table
CREATE TABLE experts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create chat_sessions table
CREATE TYPE session_status AS ENUM ('pending', 'active', 'closed');

CREATE TABLE chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  expert_id uuid REFERENCES experts(id) ON DELETE SET NULL,
  reason text NOT NULL,
  status session_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid NOT NULL,
  is_expert boolean NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for experts table
CREATE POLICY "Anyone can read experts"
  ON experts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for chat_sessions
CREATE POLICY "Users can read own sessions"
  ON chat_sessions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM experts WHERE id = expert_id AND email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Users can create sessions"
  ON chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and experts can update their sessions"
  ON chat_sessions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM experts WHERE id = expert_id AND email = auth.jwt()->>'email'
    )
  );

-- Policies for chat_messages
CREATE POLICY "Session participants can read messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE id = session_id
      AND (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM experts 
          WHERE id = expert_id 
          AND email = auth.jwt()->>'email'
        )
      )
    )
  );

CREATE POLICY "Session participants can insert messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE id = session_id
      AND status = 'active'
      AND (
        (user_id = auth.uid() AND NOT is_expert) OR
        EXISTS (
          SELECT 1 FROM experts 
          WHERE id = expert_id 
          AND email = auth.jwt()->>'email'
          AND is_expert
        )
      )
    )
  );

-- Function to check if a user is an expert
CREATE OR REPLACE FUNCTION is_expert()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM experts 
    WHERE email = auth.jwt()->>'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;