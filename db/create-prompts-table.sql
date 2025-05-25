-- SQL-Statement zur Erstellung der Tabelle für Midjourney-Prompts
CREATE TABLE midjourney_prompts (
  id INTEGER PRIMARY KEY,
  prompt_text TEXT NOT NULL,
  scene TEXT,
  location TEXT,
  time_of_day TEXT,
  atmosphere TEXT,
  mood TEXT,
  style TEXT,
  extra_details TEXT,
  custom_prompt TEXT,
  version TEXT NOT NULL,
  style_setting TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL,
  quality TEXT NOT NULL,
  stylize TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  image_url TEXT,
  labels TEXT,
  is_favorite BOOLEAN DEFAULT 0
);
