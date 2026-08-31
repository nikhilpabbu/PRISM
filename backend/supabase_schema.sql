-- ==============================================================================
-- PRISM: Comprehensive PostgreSQL DDL Schema for Supabase Cloud Database
-- Project URL: https://txnpyqtopqdeclicefod.supabase.co
-- Features: Multi-user per-account isolation, Cognitive Profiles, Memory Anchors,
--           Dyslexia Reader, Biometric Face Cue Bank, Schedules & Row Level Security
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PRISM USER PROFILES TABLE (Linked with Supabase Auth / Account System)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prism_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    active_profile TEXT DEFAULT 'dyslexia',
    reading_goal_minutes INT DEFAULT 20,
    reading_minutes_today INT DEFAULT 14,
    reading_streak_days INT DEFAULT 6,
    recognized_contacts_count INT DEFAULT 5,
    points INT DEFAULT 380,
    badges JSONB DEFAULT '[
        {"id": "b1", "name": "Focus Master", "icon": "zap", "desc": "Read 5 days in a row"},
        {"id": "b2", "name": "Face Detective", "icon": "sparkles", "desc": "Recognized 15 familiar people"}
    ]'::jsonb,
    preferences JSONB DEFAULT '{
        "font_family": "OpenDyslexic",
        "font_size": "medium",
        "line_spacing": 1.75,
        "word_spacing": 0.25,
        "reading_ruler_enabled": true,
        "reading_ruler_height": 52,
        "background_tint": "lavender",
        "bionic_reading": true,
        "syllable_coloring": false,
        "tts_speed": 0.95,
        "tts_pitch": 1.0,
        "tts_voice": "default",
        "high_contrast": false,
        "colorblind_mode": "none",
        "reduced_motion": false
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. FAMILIAR PEOPLE & VISUAL MEMORY CUES TABLE (Face Blindness Assistance)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prism_contacts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.prism_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar_url TEXT,
    met_count INT DEFAULT 1,
    last_met TEXT DEFAULT 'Today',
    context TEXT DEFAULT 'General',
    notes TEXT,
    visual_cues JSONB DEFAULT '["Friendly expression", "Distinctive eyes"]'::jsonb,
    voice_cues JSONB DEFAULT '["Clear tone", "Distinctive cadence"]'::jsonb,
    reminder TEXT DEFAULT 'Great to connect with you!',
    category TEXT DEFAULT 'Friend',
    facial_features JSONB DEFAULT '{
        "face_shape": "Standard",
        "glasses": false,
        "beard": false,
        "hair_color": "Brown",
        "confidence_signature": 0.96
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. ACCESSIBLE READING LIBRARY ITEMS TABLE (Dyslexia Reader Suite)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prism_reading_items (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.prism_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT,
    author TEXT,
    category TEXT DEFAULT 'General',
    read_time TEXT DEFAULT '3 min',
    progress_percent INT DEFAULT 0,
    content TEXT NOT NULL,
    cover_emoji TEXT DEFAULT '📖',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. COGNITIVE DIAGNOSTIC GAME ASSESSMENT RESULTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prism_diagnostic_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.prism_users(id) ON DELETE CASCADE,
    stage_level TEXT,
    stage_code INT DEFAULT 1,
    severity_label TEXT,
    overall_score INT DEFAULT 0,
    accuracy_percent NUMERIC(5,2) DEFAULT 0.0,
    reversal_score INT DEFAULT 0,
    rapid_word_score INT DEFAULT 0,
    rhyme_score INT DEFAULT 0,
    preferred_tint TEXT DEFAULT 'cream',
    recommended_settings JSONB DEFAULT '{}'::jsonb,
    detailed_insights JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. DAILY VISUAL SCHEDULES & ROUTINES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prism_schedules (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.prism_users(id) ON DELETE CASCADE,
    time TEXT NOT NULL,
    title TEXT NOT NULL,
    icon TEXT DEFAULT 'calendar',
    category TEXT DEFAULT 'General',
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    sensory_tag TEXT DEFAULT 'Normal',
    color TEXT DEFAULT 'purple',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. EMOTION LOGS & SENSORY COPING STRATEGIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prism_emotion_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.prism_users(id) ON DELETE CASCADE,
    timestamp_str TEXT NOT NULL,
    emotion TEXT NOT NULL,
    intensity INT DEFAULT 5,
    note TEXT,
    trigger_note TEXT,
    coping_strategies JSONB DEFAULT '[]'::jsonb,
    recommended_audio TEXT DEFAULT 'Gentle Rain',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. SOCIAL STORIES & AAC COMMUNICATION BOARD ITEMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prism_social_stories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    icon TEXT DEFAULT 'book',
    summary TEXT,
    steps JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prism_aac_items (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR ULTRA-FAST PER-USER QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_prism_users_email ON public.prism_users(email);
CREATE INDEX IF NOT EXISTS idx_prism_contacts_user_id ON public.prism_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_prism_reading_items_user_id ON public.prism_reading_items(user_id);
CREATE INDEX IF NOT EXISTS idx_prism_schedules_user_id ON public.prism_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_prism_emotion_logs_user_id ON public.prism_emotion_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_prism_diagnostic_user_id ON public.prism_diagnostic_results(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (Full client & API access via Anon Key)
-- ==============================================================================
ALTER TABLE public.prism_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prism_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prism_reading_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prism_diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prism_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prism_emotion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prism_social_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prism_aac_items ENABLE ROW LEVEL SECURITY;

-- Open RLS policies for seamless REST API & frontend operations
DROP POLICY IF EXISTS "Public access on prism_users" ON public.prism_users;
CREATE POLICY "Public access on prism_users" ON public.prism_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on prism_contacts" ON public.prism_contacts;
CREATE POLICY "Public access on prism_contacts" ON public.prism_contacts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on prism_reading_items" ON public.prism_reading_items;
CREATE POLICY "Public access on prism_reading_items" ON public.prism_reading_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on prism_diagnostic_results" ON public.prism_diagnostic_results;
CREATE POLICY "Public access on prism_diagnostic_results" ON public.prism_diagnostic_results FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on prism_schedules" ON public.prism_schedules;
CREATE POLICY "Public access on prism_schedules" ON public.prism_schedules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on prism_emotion_logs" ON public.prism_emotion_logs;
CREATE POLICY "Public access on prism_emotion_logs" ON public.prism_emotion_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on prism_social_stories" ON public.prism_social_stories;
CREATE POLICY "Public access on prism_social_stories" ON public.prism_social_stories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on prism_aac_items" ON public.prism_aac_items;
CREATE POLICY "Public access on prism_aac_items" ON public.prism_aac_items FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- INITIAL SEED DATA (Default Demo User & Sample Accessible Library)
-- ==============================================================================
INSERT INTO public.prism_users (id, email, name, active_profile, reading_goal_minutes, reading_minutes_today, reading_streak_days, recognized_contacts_count, points)
VALUES (
    'user_alex_01',
    'alex.rivera@prism-adaptive.io',
    'Alex Rivera',
    'dyslexia',
    20,
    14,
    6,
    5,
    380
)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();

-- Insert Sample Contacts for Alex Rivera
INSERT INTO public.prism_contacts (id, user_id, name, role, avatar_url, met_count, last_met, context, notes, visual_cues, voice_cues, reminder, category)
VALUES 
    ('person_1', 'user_alex_01', 'Dr. Aris Thorne', 'Chief Research Advisor', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80', 14, 'Yesterday at 3:15 PM', 'Neuroscience Lab 4B', 'Leading cognitive load study', '["Round tortoiseshell glasses", "Silver lapel pin", "Left parting silver hair"]'::jsonb, '["Calm baritone", "Speaks with deliberate pauses"]'::jsonb, 'Review grant proposal before Friday', 'Work'),
    ('person_2', 'user_alex_01', 'Elena Rostova', 'Senior UX Architect', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', 8, '2 days ago', 'Innovation Hub, Floor 2', 'Accessibility design partner', '["Red cat-eye frames", "Always wears teal scarf", "Asymmetrical dark bob"]'::jsonb, '["Fast-paced enthusiastic speech", "Warm laughter"]'::jsonb, 'Send feedback on Bionic Reading prototype', 'Colleague'),
    ('person_3', 'user_alex_01', 'Marcus Vance', 'Clinical Director', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', 21, 'Today at 10:00 AM', 'Therapy Wing Suite A', 'Weekly check-in supervisor', '["Neat trimmed salt-pepper beard", "Gold watch", "Deep set green eyes"]'::jsonb, '["Soft resonant tone", "British accent"]'::jsonb, 'Discuss sensory regulation data from Calm Zone', 'Mentor'),
    ('person_4', 'user_alex_01', 'Priya Patel', 'Speech & AAC Specialist', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80', 5, 'Last week', 'Communication Center', 'Assisted with social story library', '["Bright yellow lanyard", "Curly hair tied high", "Dimpled smile"]'::jsonb, '["Melodic and clear articulation"]'::jsonb, 'Recommend AAC boards for classroom use', 'Friend'),
    ('person_5', 'user_alex_01', 'David Kim', 'Software Engineer', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80', 12, '3 days ago', 'Engineering Bay', 'OpenCV pipeline collaborator', '["Black rectangular frames", "Grey crewneck sweater", "Spiky hair"]'::jsonb, '["Direct and concise", "Uses tech analogies"]'::jsonb, 'Merge Haar cascade bounding box updates', 'Colleague')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Reading Library Items for Alex Rivera
INSERT INTO public.prism_reading_items (id, user_id, title, subtitle, author, category, read_time, progress_percent, content, cover_emoji)
VALUES 
    ('item_1', 'user_alex_01', 'The Wonders of Photosynthesis', 'How Green Plants Transform Sunlight into Life Energy', 'Dr. Jennifer Martinez', 'Science & Nature', '4 min', 65, 'Photosynthesis is one of the most miraculous chemical reactions on Earth. Plants use specialized green pigment molecules called chlorophyll inside their leaf cells to capture rays of warm golden sunlight. With this energy, they absorb moisture through root systems and carbon dioxide from the surrounding air. In return, plants synthesize glucose to nourish themselves while releasing pure, clean oxygen for all living creatures across the globe to breathe.', '🌱'),
    ('item_2', 'user_alex_01', 'Voyage to the Deep Ocean', 'Exploring the Mariana Trench and Bioluminescent Wonders', 'Capt. Robert Ballard', 'Oceanography', '5 min', 30, 'Descending into the mysterious depths of the ocean reveals a world unlike anything on land. Beneath three thousand meters of cold saltwater, sunlight disappears completely. Here, alien-like organisms have evolved their own chemical luminescence, producing mesmerizing pulses of blue and emerald illumination to navigate, hunt, and communicate in total silence.', '🌊'),
    ('item_3', 'user_alex_01', 'The Architecture of Human Memory', 'How the Brain Stores Faces, Words, and Moments', 'Dr. Oliver Sacks', 'Neuroscience', '3 min', 90, 'Human facial recognition relies on an intricate neural pathway anchored in the fusiform face area of the brain. When this pathway experiences atypical processing, the mind turns to visual anchors—such as hairline patterns, eyeglass geometry, vocal cadences, and situational cues—to reliably construct enduring personal connections.', '🧠')
ON CONFLICT (id) DO NOTHING;
