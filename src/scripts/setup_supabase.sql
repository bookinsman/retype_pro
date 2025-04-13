-- This SQL script sets up the tables needed for the application in Supabase
-- Run this in the SQL Editor of your Supabase project

-- Content Sets Table
CREATE TABLE IF NOT EXISTS content_sets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Paragraphs Table
CREATE TABLE IF NOT EXISTS content_paragraphs (
  id TEXT PRIMARY KEY,
  content_set_id TEXT NOT NULL REFERENCES content_sets(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_paragraphs_content_set_id ON content_paragraphs(content_set_id);

-- Content Wisdom Sections Table
CREATE TABLE IF NOT EXISTS content_wisdom_sections (
  id TEXT PRIMARY KEY,
  content_set_id TEXT NOT NULL REFERENCES content_sets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('quote', 'didYouKnow', 'recommendations', 'question')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wisdom_content_set_id ON content_wisdom_sections(content_set_id);

-- User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('paragraph', 'wisdom')),
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_content ON user_progress(content_id, content_type);

-- User Stats Table
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  words INTEGER NOT NULL DEFAULT 0,
  texts INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  speed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily User Stats Table
CREATE TABLE IF NOT EXISTS user_daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  words INTEGER NOT NULL DEFAULT 0,
  texts INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  speed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON user_daily_stats(user_id, date);

-- Create or replace the updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_content_sets_updated_at
BEFORE UPDATE ON content_sets
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_content_paragraphs_updated_at
BEFORE UPDATE ON content_paragraphs
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_content_wisdom_sections_updated_at
BEFORE UPDATE ON content_wisdom_sections
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
BEFORE UPDATE ON user_progress
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at
BEFORE UPDATE ON user_stats
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_daily_stats_updated_at
BEFORE UPDATE ON user_daily_stats
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security
-- Enable RLS
ALTER TABLE content_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_paragraphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_wisdom_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_stats ENABLE ROW LEVEL SECURITY;

-- Policies for content_sets (everyone can read, only authenticated admins can write)
CREATE POLICY "Anyone can read content_sets"
  ON content_sets FOR SELECT
  USING (true);

-- Policies for content_paragraphs (everyone can read, only authenticated admins can write)
CREATE POLICY "Anyone can read content_paragraphs"
  ON content_paragraphs FOR SELECT
  USING (true);

-- Policies for content_wisdom_sections (everyone can read, only authenticated admins can write)
CREATE POLICY "Anyone can read content_wisdom_sections"
  ON content_wisdom_sections FOR SELECT
  USING (true);

-- Policies for user_progress (users can only access their own data)
CREATE POLICY "Users can manage their own progress"
  ON user_progress FOR ALL
  USING (auth.uid() = user_id);

-- Policies for user_stats (users can only access their own data)
CREATE POLICY "Users can manage their own stats"
  ON user_stats FOR ALL
  USING (auth.uid() = user_id);

-- Policies for user_daily_stats (users can only access their own data)
CREATE POLICY "Users can manage their own daily stats"
  ON user_daily_stats FOR ALL
  USING (auth.uid() = user_id);

-- Sample data for testing (uncomment to use)
/*
-- Insert a sample content set
INSERT INTO content_sets (id, title, subtitle, status)
VALUES ('breathing-science', 'Kvėpavimo mokslas', 'kaip oras keičia kūną ir protą', 'active');

-- Insert sample paragraphs
INSERT INTO content_paragraphs (id, content_set_id, content, "order")
VALUES 
('p1', 'breathing-science', 'Kvėpavimas yra labiausiai pirminis ir būtinas mūsų fiziologinių procesų. Kiekvieną minutę įkvepiame ir iškvepiame apie 12-16 kartų, dažnai to net nepastebėdami. Tačiau už šio automatinio veiksmo slypi sudėtinga sistema, kuri ne tik aprūpina organizmą deguonimi, bet ir stipriai veikia mūsų nervų sistemą, emocijas ir bendrą savijautą.', 1),
('p2', 'breathing-science', 'Žmogaus plaučiai yra neįtikėtinai efektyvūs organai. Jie sudaryti iš maždaug 300 milijonų alveolių – mažyčių oro maišelių, kurių bendras paviršiaus plotas prilygsta teniso aikštelei. Šiame plote vyksta dujų apykaita: deguonis patenka į kraują, o anglies dioksidas pašalinamas. Būtent dėl šios priežasties taisyklingas kvėpavimas yra toks svarbus mūsų organizmui.', 2);

-- Insert sample wisdom sections
INSERT INTO content_wisdom_sections (id, content_set_id, type, title, content)
VALUES 
('w1', 'breathing-science', 'quote', 'Išmintis', 'Kvėpavimas yra tiltas, jungiantis gyvenimą su sąmone, jungiantis kūną su mintimis. Kai kvėpavimas tampa netvarkingu, protas tampa sutrikęs, bet kai kvėpavimas ramus, protas irgi nurimsta. - Thich Nhat Hanh'),
('w2', 'breathing-science', 'didYouKnow', 'Ar žinojai?', 'Vidutinis suaugęs žmogus per dieną įkvepia ir iškvepia apie 20,000 kartų. Deguonis, kurį gauname, keliauja į raudonuosius kraujo kūnelius per hemoglobiną ir yra pernešamas į kiekvieną mūsų kūno ląstelę. Be deguonies, smegenų ląstelės pradėtų mirti per 5 minutes.');
*/ 