-- Create generations table for Effects Tutor, Image Prompts, Edit Breakdown, Maktub.AI
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  input JSONB NOT NULL,
  output JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for generations
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own generations"
ON generations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
ON generations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations"
ON generations
FOR DELETE
USING (auth.uid() = user_id);

-- Create activity_log table
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  feature TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for activity_log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own activity"
ON activity_log
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
ON activity_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);