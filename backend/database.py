import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List
from supabase_client import supabase_db

# Pre-seeded sample database for PRISM (Alex's account)
initial_database = {
    "user": {
        "id": "user_alex_01",
        "name": "Alex Rivera",
        "email": "alex.rivera@prism-adaptive.io",
        "active_profile": "dyslexia",  # 'dyslexia' | 'face_blindness'
        "reading_goal_minutes": 20,
        "reading_minutes_today": 14,
        "reading_streak_days": 6,
        "calm_minutes_today": 8,
        "recognized_contacts_count": 5,
        "points": 380,
        "badges": [
            {"id": "b1", "name": "Focus Master", "icon": "zap", "desc": "Read for 5 days in a row"},
            {"id": "b2", "name": "Zen Champion", "icon": "wind", "desc": "Completed 10 calm breathing sessions"},
            {"id": "b3", "name": "Face Detective", "icon": "sparkles", "desc": "Recognized 15 familiar people with visual cues"}
        ],
        "preferences": {
            "font_family": "OpenDyslexic",  # 'OpenDyslexic', 'Lexend', 'Atkinson', 'Inter'
            "font_size": "medium",  # 'small', 'medium', 'large', 'xlarge'
            "line_spacing": 1.75,
            "word_spacing": 0.25,
            "reading_ruler_enabled": True,
            "reading_ruler_height": 48,
            "background_tint": "lavender",  # 'default', 'cream', 'peach', 'mint', 'lavender', 'dark'
            "bionic_reading": True,
            "tts_speed": 0.95,
            "tts_pitch": 1.0,
            "tts_voice": "default",
            "high_contrast": False,
            "colorblind_mode": "none",  # 'none', 'protanopia', 'deuteranopia', 'tritanopia'
            "reduced_motion": False
        }
    },
    
    # Dyslexia Library & Sample Texts
    "reading_items": [
        {
            "id": "book_1",
            "title": "The Invisible String",
            "subtitle": "Chapter 3 • Overcoming the Unknown",
            "author": "Patrice Karst",
            "cover_emoji": "📖",
            "progress_percent": 60,
            "time_left": "5 min left",
            "category": "Literature",
            "content": """The invisible string is made of love. Even though you cannot see it with your eyes, you can feel it with your heart and know that you are always connected to everyone you love. 

When you're at school and you miss your family, your love travels all the way along the string until they feel a tug on their hearts. And when you pull back, you can feel the love returning in an instant.

No matter where you go or what challenges appear before you, you are never alone. The bond stretches across miles, through busy classrooms, and into quiet evenings at home."""
        },
        {
            "id": "book_2",
            "title": "Photosynthesis & Plant Biology",
            "subtitle": "Chapter 1 • How Plants Make Food",
            "author": "Science Discovery Team",
            "cover_emoji": "🌱",
            "progress_percent": 35,
            "time_left": "8 min left",
            "category": "Science",
            "content": """Photosynthesis is the fundamental biological process used by plants, algae, and certain bacteria to convert radiant light energy into chemical energy stored in glucose molecules.

Chlorophyll pigments inside plant cell chloroplasts capture sunlight. Water absorbed from the roots combines with carbon dioxide absorbed through microscopic leaf stomata.

Through these chemical reactions, oxygen is released into the atmosphere while nourishing sugar sustains the growing plant."""
        },
        {
            "id": "book_3",
            "title": "The Solar System Journey",
            "subtitle": "Section 2 • The Gas Giants",
            "author": "Astro Kids",
            "cover_emoji": "🪐",
            "progress_percent": 85,
            "time_left": "3 min left",
            "category": "Astronomy",
            "content": """Jupiter is the largest planet in our solar system, with a swirling storm called the Great Red Spot that has raged for centuries.

Saturn is famous for its shimmering rings of ice and rock particles. Beyond Saturn lie Uranus and Neptune, the icy blue giants spinning on the outer frontiers of our planetary neighborhood."""
        }
    ],

    # Autism Visual Schedule & Routines
    "schedules": [
        {
            "id": "sch_1",
            "time": "9:00 AM",
            "title": "School & Morning Work",
            "icon": "school",
            "category": "Education",
            "completed": True,
            "notes": "Bring math notebook. Wear noise-reducing headphones during hallway transit.",
            "sensory_tag": "Medium Noise",
            "color": "blue"
        },
        {
            "id": "sch_2",
            "time": "1:00 PM",
            "title": "Lunch & Hydration",
            "icon": "utensils",
            "category": "Health",
            "completed": True,
            "notes": "Quiet lunch corner near the window. Eat slowly and drink water.",
            "sensory_tag": "Calm",
            "color": "emerald"
        },
        {
            "id": "sch_3",
            "time": "3:00 PM",
            "title": "Social Skills Practice & Collaboration",
            "icon": "users",
            "category": "Social",
            "completed": False,
            "notes": "Group discussion with teacher David Miller. Practice active listening cards.",
            "sensory_tag": "Interactive",
            "color": "amber"
        },
        {
            "id": "sch_4",
            "time": "5:00 PM",
            "title": "Free Time & Creative Drawing",
            "icon": "gamepad-2",
            "category": "Recreation",
            "completed": False,
            "notes": "Draw digital art or listen to calm lo-fi rain soundscapes in the Calm Zone.",
            "sensory_tag": "Very Low Noise",
            "color": "purple"
        },
        {
            "id": "sch_5",
            "time": "7:30 PM",
            "title": "Evening Routine & Wind Down",
            "icon": "moon",
            "category": "Routine",
            "completed": False,
            "notes": "Organize backpack for tomorrow, brush teeth, 5-minute breathing exercise.",
            "sensory_tag": "Calm",
            "color": "indigo"
        }
    ],

    # Autism Social Stories
    "social_stories": [
        {
            "id": "story_1",
            "title": "Meeting Someone New at School",
            "icon": "smile",
            "summary": "Step-by-step guidance on greeting a new classmate or teacher politely without feeling overwhelmed.",
            "steps": [
                {
                    "step_num": 1,
                    "title": "Notice the Person",
                    "description": "When someone approaches you or is introduced, pause what you are doing and turn gently toward them.",
                    "audio_tip": "You don't need to stare at their eyes; looking at their forehead or nose bridge works great!"
                },
                {
                    "step_num": 2,
                    "title": "Give a Gentle Greeting",
                    "description": "You can say: 'Hello! I am Alex.' or give a polite wave with your hand.",
                    "audio_tip": "Keep your voice calm and at a comfortable conversational volume."
                },
                {
                    "step_num": 3,
                    "title": "Listen to Their Name",
                    "description": "They will say their name. If they speak too fast, it is always okay to say: 'Could you repeat your name, please?'",
                    "audio_tip": "You can check PRISM Face HUD afterwards to save their unique visual cues."
                },
                {
                    "step_num": 4,
                    "title": "Wrap Up Politely",
                    "description": "When the interaction is finishing, say: 'Nice to meet you!' and take a calm breath.",
                    "audio_tip": "Great job! You navigated a social interaction successfully."
                }
            ]
        },
        {
            "id": "story_2",
            "title": "Handling Unexpected Routine Changes",
            "icon": "refresh-cw",
            "summary": "How to stay calm when a class, schedule, or plan changes without advance notice.",
            "steps": [
                {
                    "step_num": 1,
                    "title": "Recognize the Change",
                    "description": "Sometimes schedules change because of weather, teacher meetings, or emergencies. Changes happen to everyone.",
                    "audio_tip": "A change does not mean something bad is happening."
                },
                {
                    "step_num": 2,
                    "title": "Take 3 Deep Calm Breaths",
                    "description": "Inhale slowly for 4 seconds, hold for 4 seconds, and exhale gently for 6 seconds.",
                    "audio_tip": "Feel your shoulders relax as you release tension."
                },
                {
                    "step_num": 3,
                    "title": "Ask for the New Plan",
                    "description": "Ask calmly: 'What is our new activity?' or check your PRISM updated schedule.",
                    "audio_tip": "Having a clear new roadmap restores comfort."
                }
            ]
        },
        {
            "id": "story_3",
            "title": "Asking for a Sensory Break",
            "icon": "shield",
            "summary": "How to advocate for yourself when loud sounds or bright lights cause sensory overload.",
            "steps": [
                {
                    "step_num": 1,
                    "title": "Check Your Body Signals",
                    "description": "If your chest feels tight, your head feels heavy, or noises feel too sharp, your brain is signaling sensory fatigue.",
                    "audio_tip": "Acknowledging your sensory needs is a strength, not a weakness."
                },
                {
                    "step_num": 2,
                    "title": "Use Your AAC Card or Words",
                    "description": "Tell your teacher or supervisor: 'May I please have a 5-minute quiet sensory break?' or tap the PRISM AAC button.",
                    "audio_tip": "Teachers appreciate clear communication."
                },
                {
                    "step_num": 3,
                    "title": "Head to the Quiet Zone",
                    "description": "Put on your noise-canceling headphones, open the PRISM Calm Zone, and relax.",
                    "audio_tip": "After 5 minutes, you will feel refreshed."
                }
            ]
        }
    ],

    # AAC Communication Board Items
    "aac_items": [
        {"id": "aac_1", "label": "I need help", "icon": "life-buoy", "category": "Needs", "color": "bg-red-50 text-red-700 border-red-200"},
        {"id": "aac_2", "label": "I need a quiet break", "icon": "volume-x", "category": "Sensory", "color": "bg-emerald-50 text-emerald-700 border-emerald-200"},
        {"id": "aac_3", "label": "Yes / I agree", "icon": "check-circle", "category": "Responses", "color": "bg-green-50 text-green-700 border-green-200"},
        {"id": "aac_4", "label": "No / Not right now", "icon": "x-circle", "category": "Responses", "color": "bg-amber-50 text-amber-700 border-amber-200"},
        {"id": "aac_5", "label": "I feel overwhelmed", "icon": "alert-triangle", "category": "Feelings", "color": "bg-purple-50 text-purple-700 border-purple-200"},
        {"id": "aac_6", "label": "Can you repeat that?", "icon": "repeat", "category": "Questions", "color": "bg-blue-50 text-blue-700 border-blue-200"},
        {"id": "aac_7", "label": "I am hungry / thirsty", "icon": "coffee", "category": "Needs", "color": "bg-orange-50 text-orange-700 border-orange-200"},
        {"id": "aac_8", "label": "Thank you very much", "icon": "heart", "category": "Social", "color": "bg-pink-50 text-pink-700 border-pink-200"}
    ],

    # Emotion History Log
    "emotion_logs": [
        {
            "id": "emo_1",
            "timestamp": "Today, 11:30 AM",
            "emotion": "Anxious",
            "intensity": 4,
            "note": "Feeling a little anxious about the upcoming class presentation.",
            "coping_strategies": [
                {"title": "4-7-8 Breathing", "detail": "4 seconds inhale, 7 hold, 8 exhale to calm heart rate"},
                {"title": "Sensory Grounding (5-4-3-2-1)", "detail": "Name 5 things you can see, 4 you can touch, 3 you can hear"},
                {"title": "PRISM Coping AI Suggestion", "detail": "Remember your slides are bulleted and you can speak at your own pace."}
            ],
            "recommended_audio": "Binaural Alpha Waves & Gentle Rain"
        },
        {
            "id": "emo_2",
            "timestamp": "Yesterday, 4:00 PM",
            "emotion": "Calm",
            "intensity": 2,
            "note": "Finished homework early, feeling relaxed and balanced.",
            "coping_strategies": [
                {"title": "Maintain Equilibrium", "detail": "Enjoy 15 minutes of free creative drawing"}
            ],
            "recommended_audio": "Forest Stream Ambient"
        }
    ],

    # Face Blindness / Prosopagnosia Contact Directory
    "contacts": [
        {
            "id": "person_1",
            "name": "David Miller",
            "role": "Teacher & Academic Advisor",
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
            "met_count": 14,
            "last_met": "2 days ago",
            "context": "Math & Computer Science Class",
            "notes": "Always wears crisp button-down shirts (often blue). Enthusiastic about robotics and algorithmic thinking.",
            "visual_cues": [
                "Rectangular black-rimmed glasses",
                "Short neat brown hair with slight silver temples",
                "Trim brown beard & warm smile",
                "Always wears navy blue or light blue collared shirts"
            ],
            "voice_cues": [
                "Deep, steady, articulate cadence",
                "Often starts sentences with 'Alright team, let's explore...'"
            ],
            "reminder": "Discussed final Capgemini project submission and rubric.",
            "category": "Teacher",
            "facial_features": {
                "face_shape": "Oval",
                "glasses": True,
                "beard": True,
                "hair_color": "Brown/Silver",
                "confidence_signature": 0.98
            }
        },
        {
            "id": "person_2",
            "name": "Sarah Johnson",
            "role": "Classmate & Study Partner",
            "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
            "met_count": 9,
            "last_met": "Yesterday",
            "context": "Accessibility Tech Research Group",
            "notes": "Carries a distinct yellow water bottle and colorful patterned backpack. Very patient with notes sharing.",
            "visual_cues": [
                "Long wavy auburn/chestnut hair",
                "Silver hoop earrings",
                "Bright green or pastel hoodies",
                "Yellow Hydroflask with stickers"
            ],
            "voice_cues": [
                "Higher pitched, energetic and upbeat",
                "Laughs before finishing funny anecdotes"
            ],
            "reminder": "Reviewing user testing feedback for dyslexia reader mode tomorrow.",
            "category": "Classmate",
            "facial_features": {
                "face_shape": "Heart",
                "glasses": False,
                "beard": False,
                "hair_color": "Auburn",
                "confidence_signature": 0.96
            }
        },
        {
            "id": "person_3",
            "name": "Michael Brown",
            "role": "Teammate & Frontend Lead",
            "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
            "met_count": 8,
            "last_met": "3 days ago",
            "context": "Tech Titans Hackathon Team",
            "notes": "Wears wireless noise-canceling headphones around neck. Tall posture, loves dark-themed coding IDEs.",
            "visual_cues": [
                "Short curly dark hair",
                "Thin round tortoiseshell glasses",
                "Grey hoodie with Capgemini pin",
                "Smartwatch with orange sport band"
            ],
            "voice_cues": [
                "Fast-paced, thoughtful, pauses to formulate points"
            ],
            "reminder": "Aligning on React component hierarchy and API routes.",
            "category": "Teammate",
            "facial_features": {
                "face_shape": "Square",
                "glasses": True,
                "beard": False,
                "hair_color": "Black",
                "confidence_signature": 0.94
            }
        },
        {
            "id": "person_4",
            "name": "Emily Davis",
            "role": "Project Partner & UX Designer",
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
            "met_count": 6,
            "last_met": "2 days ago",
            "context": "Synchrony Innovation Lab",
            "notes": "Created the purple, green, and blue adaptive theme system mockups.",
            "visual_cues": [
                "Shoulder-length straight black hair with bangs",
                "Small silver nose stud",
                "Minimalist aesthetic, black or cream knit sweaters"
            ],
            "voice_cues": [
                "Soft, soothing, clear enunciation"
            ],
            "reminder": "Prepare slides for the final presentation review.",
            "category": "Work",
            "facial_features": {
                "face_shape": "Round",
                "glasses": False,
                "beard": False,
                "hair_color": "Black",
                "confidence_signature": 0.95
            }
        },
        {
            "id": "person_5",
            "name": "Dr. Williams",
            "role": "Professor & Accessibility Advisor",
            "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
            "met_count": 4,
            "last_met": "1 week ago",
            "context": "Faculty Consultation Office 402",
            "notes": "Specializes in cognitive neurodiversity & universal assistive computing interfaces.",
            "visual_cues": [
                "Short grey hair, wireframe glasses",
                "Tweed jackets with elbow patches",
                "Carries a leather binder"
            ],
            "voice_cues": [
                "Calm, professorial, deep resonance"
            ],
            "reminder": "Office hours on Thursday at 2:00 PM for research paper discussion.",
            "category": "Teacher",
            "facial_features": {
                "face_shape": "Oval",
                "glasses": True,
                "beard": False,
                "hair_color": "Grey",
                "confidence_signature": 0.97
            }
        },
        {
            "id": "person_6",
            "name": "James Anderson",
            "role": "Childhood Friend",
            "avatar_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
            "met_count": 22,
            "last_met": "2 weeks ago",
            "context": "Weekend Soccer & Coffee",
            "notes": "Always talks about music production and hiking trips. Very energetic walker.",
            "visual_cues": [
                "Light brown wavy hair, tall build",
                "Baseball cap backwards on weekends",
                "Red jacket or sports zip-up"
            ],
            "voice_cues": [
                "Booming, cheerful laugh, calls Alex 'Al'"
            ],
            "reminder": "Weekend cycling meetup planned for Sunday.",
            "category": "Friend",
            "facial_features": {
                "face_shape": "Rectangular",
                "glasses": False,
                "beard": True,
                "hair_color": "Light Brown",
                "confidence_signature": 0.93
            }
        }
    ],

    # Slide 6: Prevalence & Overlap Data
    "prevalence_data": {
        "global_estimates": {
            "prosopagnosia": {"percent": 2.5, "count": "200 Million", "label": "Face Blindness"},
            "dyslexia": {"percent": 10.0, "count": "800 Million", "label": "Dyslexia"},
            "autism": {"percent": 1.0, "count": "80 Million", "label": "Autism"}
        },
        "overlaps": {
            "dyslexia_and_prosopagnosia": {"percent": 1.0, "count": "80 Million"},
            "autism_and_prosopagnosia": {"percent": 0.2, "count": "16 Million"},
            "autism_and_dyslexia": {"percent": 0.6, "count": "48 Million"},
            "all_three": {"percent": 0.1, "count": "8 Million"}
        },
        "co_occurrence_insights": [
            {"condition": "People with Dyslexia who also have Autism", "range": "20–30%"},
            {"condition": "People with Autism who also have Dyslexia", "range": "25–40%"},
            {"condition": "People with Prosopagnosia who also have Autism", "range": "10–20%"},
            {"condition": "People with Prosopagnosia who also have Dyslexia", "range": "15–25%"},
            {"condition": "People who experience all three conditions", "range": "5–10% of overlapping cohorts"}
        ]
    },

    # Slide 7: Business Plan / Lean Canvas Data
    "business_canvas": {
        "problem": [
            "Reading difficulties and letter reversals for people with Dyslexia.",
            "Social communication, sensory overload, and unpredictable routine challenges for people with Autism.",
            "Difficulty recognizing and remembering familiar faces, names, and social context for people with Prosopagnosia.",
            "Fragmentation: Users are forced to juggle 3-5 separate clunky apps."
        ],
        "solution": [
            "One Unified Adaptive Platform with profile-tailored themes & workflows.",
            "Automated cognitive assistance: OCR reader, visual scheduler, calm soundscape synthesizer, and face recognition HUD.",
            "Assisting + Training Dual Engine (immediate daily aid + cognitive reinforcement flashcards)."
        ],
        "unique_value_proposition": [
            "Personalized interface dynamically morphs based on selected disability.",
            "One app, three specialized profiles with seamless cross-disability support.",
            "Local-first privacy, end-to-end security, and zero tracking of facial data."
        ],
        "unfair_advantage": [
            "Proprietary Adaptive Accessibility Engine.",
            "Modular Cross-Disability AI architecture.",
            "WCAG 2.1 AAA native compliance & neuro-inclusive UX design system."
        ],
        "customer_segments": [
            "Individuals with Dyslexia, Autism, or Prosopagnosia.",
            "Parents, Caregivers & Family supporters.",
            "Special Educators, Speech-Language Pathologists & Occupational Therapists.",
            "Universities & Enterprise Accessibility Initiatives."
        ],
        "early_adopters": [
            "Students with learning differences seeking reading autonomy.",
            "Neurodivergent professionals in collaborative corporate environments.",
            "Accessibility advocacy groups and therapy clinics."
        ],
        "channels": [
            "Google Play Store & Apple App Store (PWA + Mobile).",
            "Educational Institutions & University Disability Centers.",
            "Hospital & Therapy Clinic Partnerships.",
            "Corporate DEI & Accessibility Programs (Capgemini / Synchrony)."
        ],
        "cost_structure": [
            "AI Model inference & cloud hosting (FastAPI, Redis, Vector DB).",
            "Security, encryption, and GDPR/HIPAA/DPDP compliance audits.",
            "Continuous co-design user testing with neurodivergent communities."
        ],
        "impact": [
            "Boosts independence and daily confidence by 4x.",
            "Significantly reduces caregiver anxiety and cognitive fatigue.",
            "Fosters inclusive learning and workplace participation."
        ]
    }
}

class DatabaseManager:
    def __init__(self):
        self.data = initial_database

    def get_user(self):
        return self.data["user"]

    def update_user_preferences(self, preferences: Dict[str, Any]):
        self.data["user"]["preferences"].update(preferences)
        try:
            supabase_db.upsert_user_profile(self.data["user"])
        except Exception:
            pass
        return self.data["user"]["preferences"]

    def set_active_profile(self, profile_id: str):
        self.data["user"]["active_profile"] = profile_id
        try:
            supabase_db.upsert_user_profile(self.data["user"])
        except Exception:
            pass
        return self.data["user"]

    def get_reading_items(self):
        return self.data["reading_items"]

    def get_reading_item(self, item_id: str):
        for item in self.data["reading_items"]:
            if item["id"] == item_id:
                return item
        return None

    def get_schedules(self):
        return self.data["schedules"]

    def toggle_schedule(self, schedule_id: str):
        for s in self.data["schedules"]:
            if s["id"] == schedule_id:
                s["completed"] = not s["completed"]
                return s
        return None

    def add_schedule(self, item: Dict[str, Any]):
        new_item = {
            "id": f"sch_{uuid.uuid4().hex[:6]}",
            "time": item.get("time", "12:00 PM"),
            "title": item.get("title", "New Task"),
            "icon": item.get("icon", "calendar"),
            "category": item.get("category", "General"),
            "completed": False,
            "notes": item.get("notes", ""),
            "sensory_tag": item.get("sensory_tag", "Normal"),
            "color": item.get("color", "emerald")
        }
        self.data["schedules"].append(new_item)
        return new_item

    def get_emotion_logs(self):
        return self.data["emotion_logs"]

    def add_emotion_log(self, emotion: str, intensity: int, note: str, trigger: str = ""):
        # Coping strategy generator based on mood
        coping_map = {
            "Anxious": [
                {"title": "4-7-8 Deep Breathing", "detail": "Inhale 4s, hold 7s, exhale 8s to calm the nervous system."},
                {"title": "Sensory Grounding 5-4-3-2-1", "detail": "Notice 5 colors around you, 4 textures, 3 sounds, 2 scents, 1 breath."},
                {"title": "Low Stimulus Corner", "detail": "Lower screen brightness and switch to calming green/blue tint."}
            ],
            "Angry": [
                {"title": "Progressive Muscle Release", "detail": "Clench your fists tightly for 5 seconds, then let go completely."},
                {"title": "Calm Zone Rain Synthesizer", "detail": "Listen to soothing rainfall ambient audio for 3 minutes."},
                {"title": "Express with AAC", "detail": "Tap 'I need a quiet break' on your communication board."}
            ],
            "Sad": [
                {"title": "Gentle Affirmation", "detail": "It's okay to feel sad. You have handled tough moments before."},
                {"title": "Comfort Routine", "detail": "Have a warm drink and wrap in a cozy sweater or weighted blanket."},
                {"title": "Read a Comfort Story", "detail": "Open 'The Invisible String' in Dyslexia reader mode."}
            ],
            "Happy": [
                {"title": "Celebrate Your Streak!", "detail": "You've unlocked 10 bonus focus points today."},
                {"title": "Share Joy", "detail": "Send a kind greeting to David Miller or Sarah Johnson."}
            ],
            "Calm": [
                {"title": "Deep Focus State", "detail": "Perfect time to continue reading chapter 3 of your book."},
                {"title": "Daily Reinforcement", "detail": "Play 3 rounds of the Face Recognition memory quiz."}
            ],
            "Okay": [
                {"title": "Hydration & Posture", "detail": "Drink a glass of water and stretch your shoulders."},
                {"title": "Review Schedule", "detail": "Check your upcoming visual routine tasks."}
            ]
        }
        
        audio_map = {
            "Anxious": "Binaural Alpha Waves & Rain",
            "Angry": "Gentle Waterfall & Deep Pink Noise",
            "Sad": "Soothing Acoustic Piano & Forest",
            "Happy": "Uplifting Morning Birds & Stream",
            "Calm": "Ocean Waves & White Noise",
            "Okay": "Ambient Lo-Fi & Gentle Rain"
        }

        strategies = coping_map.get(emotion, coping_map["Okay"])
        rec_audio = audio_map.get(emotion, "Gentle Rain")
        
        now_str = datetime.now().strftime("Today, %I:%M %p")
        log_entry = {
            "id": f"emo_{uuid.uuid4().hex[:6]}",
            "timestamp": now_str,
            "emotion": emotion,
            "intensity": intensity,
            "note": note,
            "coping_strategies": strategies,
            "recommended_audio": rec_audio
        }
        self.data["emotion_logs"].insert(0, log_entry)
        self.data["user"]["calm_minutes_today"] += 3
        self.data["user"]["points"] += 15
        return log_entry

    def get_social_stories(self):
        return self.data["social_stories"]

    def get_aac_items(self):
        return self.data["aac_items"]

    def get_contacts(self):
        return self.data["contacts"]

    def get_contact(self, contact_id: str):
        for c in self.data["contacts"]:
            if c["id"] == contact_id:
                return c
        return None

    def delete_contact(self, contact_id: str) -> bool:
        initial_len = len(self.data["contacts"])
        self.data["contacts"] = [c for c in self.data["contacts"] if c["id"] != contact_id]
        if len(self.data["contacts"]) < initial_len:
            self.data["user"]["recognized_contacts_count"] = max(0, self.data["user"]["recognized_contacts_count"] - 1)
            return True
        return False

    def add_contact(self, contact_data: Dict[str, Any]):
        new_c = {
            "id": f"person_{uuid.uuid4().hex[:6]}",
            "name": contact_data.get("name", "New Contact"),
            "role": contact_data.get("role", "Acquaintance"),
            "avatar_url": contact_data.get("avatar_url") or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
            "met_count": 1,
            "last_met": "Today",
            "context": contact_data.get("context", "General Interaction"),
            "notes": contact_data.get("notes", ""),
            "visual_cues": contact_data.get("visual_cues", ["Friendly posture"]),
            "voice_cues": contact_data.get("voice_cues", ["Clear voice"]),
            "reminder": contact_data.get("reminder", "Follow up soon"),
            "category": contact_data.get("category", "Friend"),
            "facial_features": {
                "face_shape": "Standard",
                "glasses": False,
                "beard": False,
                "hair_color": "Brown",
                "confidence_signature": 0.92
            }
        }
        self.data["contacts"].append(new_c)
        self.data["user"]["recognized_contacts_count"] += 1
        return new_c

    def get_prevalence_data(self):
        return self.data["prevalence_data"]

    def get_business_canvas(self):
        return self.data["business_canvas"]

db = DatabaseManager()
