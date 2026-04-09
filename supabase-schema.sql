-- Supabase Schema for Privacy Detective Game

CREATE TABLE IF NOT EXISTS game_sessions (
  session_id UUID PRIMARY KEY,
  player_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'started',
  room1_attempts TEXT DEFAULT '',
  room1_completed BOOLEAN DEFAULT false,
  room2_attempts TEXT DEFAULT '',
  room2_completed BOOLEAN DEFAULT false,
  room3_attempts TEXT DEFAULT '',
  room3_completed BOOLEAN DEFAULT false
);

-- Note: You may want to enable Row Level Security (RLS) and set up policies 
-- depending on your security requirements. For a simple game, you can allow anonymous inserts:
-- ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow anonymous inserts" ON game_sessions FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow anonymous updates" ON game_sessions FOR UPDATE USING (true);

