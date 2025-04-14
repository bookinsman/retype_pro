-- Initial schema for the Retyping Platform

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================
-- Word Entry Logs
-- ==============================
CREATE TABLE word_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  word_count int NOT NULL,
  created_at timestamp DEFAULT now()
);

-- ==============================
-- Daily Summary for Weekly Views
-- ==============================
CREATE TABLE word_daily_summary (
  user_id uuid,
  date date,
  total_words int,
  PRIMARY KEY (user_id, date)
);

-- ==============================
-- Access Codes for Authentication
-- ==============================
CREATE TABLE access_codes (
  code text PRIMARY KEY,
  code_type text CHECK (code_type IN ('physical', 'digital')),
  user_id uuid, -- nullable until assigned
  is_used boolean DEFAULT false,
  used_at timestamp
);

-- ==============================
-- Content Sets and Paragraphs
-- ==============================
CREATE TABLE content_sets (
  id text PRIMARY KEY,
  title text NOT NULL,
  subtitle text,
  status text DEFAULT 'active',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE paragraphs (
  id text PRIMARY KEY,
  content_set_id text REFERENCES content_sets(id) ON DELETE CASCADE,
  content text NOT NULL,
  order_index int NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_paragraphs_content_set_id ON paragraphs(content_set_id);

CREATE TABLE wisdom_sections (
  id text PRIMARY KEY,
  content_set_id text REFERENCES content_sets(id) ON DELETE CASCADE,
  type text CHECK (type IN ('quote')), -- Only quote type is allowed
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_wisdom_content_set_id ON wisdom_sections(content_set_id);

-- User Progress Table - Works with localStorage user_id
CREATE TABLE user_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,  -- This will store our localStorage generated user_id
  content_id text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('paragraph', 'wisdom')),
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX idx_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_progress_content ON user_progress(content_id, content_type);

-- User Stats Table (for total stats)
CREATE TABLE user_stats (
  user_id uuid PRIMARY KEY,
  words integer NOT NULL DEFAULT 0,
  texts integer NOT NULL DEFAULT 0,
  time_spent_seconds integer NOT NULL DEFAULT 0,
  speed integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Daily User Stats Table (for daily stats)
CREATE TABLE user_daily_stats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  total_words integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create index for faster lookups
CREATE INDEX idx_daily_stats_user_date ON user_daily_stats(user_id, date);

-- ==============================
-- Insert sample access codes
-- ==============================
INSERT INTO access_codes (code, code_type, is_used)
VALUES 
  ('PH123456', 'physical', false),
  ('PH123457', 'physical', false),
  ('DG123456', 'digital', false),
  ('DG123457', 'digital', false);

-- ==============================
-- Insert sample content set with paragraphs and wisdom section
-- ==============================
INSERT INTO content_sets (id, title, subtitle)
VALUES ('laisves-vejas', 'Laisvės vėjas:', 'politinė ir socialinė oro reikšmė');

-- Insert paragraphs
INSERT INTO paragraphs (id, content_set_id, content, order_index)
VALUES
  ('p1', 'laisves-vejas', 'Kai žmonės iškovoja laisvę, dažnai sakoma: "tarsi galėčiau pagaliau įkvėpti". Kvėpavimas tampa ne tik fiziologiniu veiksmu, bet simboline būsena – gyventi be baimės.', 1),
  ('p2', 'laisves-vejas', 'Tačiau ne visi gali laisvai kvėpuoti – pažodžiui ir perkeltine prasme. Miestai pilni taršos. Šalys – be žodžio laisvės. Kvėpavimas ir teisė laisvai reikšti mintis – abu gali būti atimti.', 2),
  ('p3', 'laisves-vejas', 'Laisvė yra kaip oras – jos nepastebi, kol jos netenki. Todėl tik brandi visuomenė saugo ne tik fizinę oro švarą, bet ir idėjų erdvę, kurioje gali laisvai kvėpuoti kiekvienas.', 3),
  ('p4', 'laisves-vejas', 'Per pasaulį nuvilnijusios revoliucijos nešė plakatais žodžius, bet jų esmė slypėjo ore – ore, kuris alsavo pasipriešinimu. Kvėpavimas buvo lyg sinchronizuota malda – viena tauta, vienas ritmas.', 4),
  ('p5', 'laisves-vejas', 'Tačiau laisvė dažnai painiojama su chaosu. Kai kas, gavęs oro, pasirenka jį naudoti kitiems atimti. Kvėpuoti laisvai reiškia ne daryti bet ką, o leisti kitiems kvėpuoti šalia tavęs.', 5),
  ('p6', 'laisves-vejas', 'Tik tada, kai suvoki, jog tavo kvėpavimas susijęs su šalia esančio žmogaus oru – tiek tiesiogiai, tiek simboliškai – tampi tikru laisvės kūrėju.', 6),
  ('p7', 'laisves-vejas', 'Oras – nematomas, bet gyvybiškai svarbus. Kaip ir laisvė. Abu reikia saugoti. Abu reikia gerbti. Ir abu galima prarasti, jei nustosime jais rūpintis.', 7);

-- Insert wisdom section - Only quote type
INSERT INTO wisdom_sections (id, content_set_id, type, title, content)
VALUES
  ('w1', 'laisves-vejas', 'quote', 'Išmintis', 'Pirmas politinis šūkis, kuriame buvo paminėtas kvėpavimas, gimė Prancūzijos revoliucijos metu: "La liberté ou l''asphyxie" („Laisvė arba uždusimas").');

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

CREATE TRIGGER update_paragraphs_updated_at
BEFORE UPDATE ON paragraphs
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_wisdom_sections_updated_at
BEFORE UPDATE ON wisdom_sections
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