import os
import json
import logging
from typing import Dict, Any, Optional, List
from supabase import create_client, Client

logger = logging.getLogger("prism.supabase")

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://txnpyqtopqdeclicefod.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_publishable_gqmIo1pGUjD_SV1uXT-m8w_YTVhWH4D")

DEFAULT_PREFERENCES = {
    "font_family": "OpenDyslexic",
    "font_size": "medium",
    "line_spacing": 1.75,
    "word_spacing": 0.25,
    "reading_ruler_enabled": True,
    "reading_ruler_height": 52,
    "background_tint": "lavender",
    "bionic_reading": True,
    "syllable_coloring": False,
    "tts_speed": 0.95,
    "tts_pitch": 1.0,
    "tts_voice": "default",
    "high_contrast": False,
    "colorblind_mode": "none",
    "reduced_motion": False
}

DEFAULT_READING_ITEMS = [
    {
        "id": "item_1",
        "title": "The Wonders of Photosynthesis",
        "subtitle": "How Green Plants Transform Sunlight into Life Energy",
        "author": "Dr. Jennifer Martinez",
        "category": "Science & Nature",
        "read_time": "4 min",
        "progress_percent": 65,
        "content": "Photosynthesis is one of the most miraculous chemical reactions on Earth. Plants use specialized green pigment molecules called chlorophyll inside their leaf cells to capture rays of warm golden sunlight. With this energy, they absorb moisture through root systems and carbon dioxide from the surrounding air. In return, plants synthesize glucose to nourish themselves while releasing pure, clean oxygen for all living creatures across the globe to breathe.",
        "cover_emoji": "🌱"
    },
    {
        "id": "item_2",
        "title": "Voyage to the Deep Ocean",
        "subtitle": "Exploring the Mariana Trench and Bioluminescent Wonders",
        "author": "Capt. Robert Ballard",
        "category": "Oceanography",
        "read_time": "5 min",
        "progress_percent": 30,
        "content": "Descending into the mysterious depths of the ocean reveals a world unlike anything on land. Beneath three thousand meters of cold saltwater, sunlight disappears completely. Here, alien-like organisms have evolved their own chemical luminescence, producing mesmerizing pulses of blue and emerald illumination to navigate, hunt, and communicate in total silence.",
        "cover_emoji": "🌊"
    },
    {
        "id": "item_3",
        "title": "The Architecture of Human Memory",
        "subtitle": "How the Brain Stores Faces, Words, and Moments",
        "author": "Dr. Oliver Sacks",
        "category": "Neuroscience",
        "read_time": "3 min",
        "progress_percent": 90,
        "content": "Human facial recognition relies on an intricate neural pathway anchored in the fusiform face area of the brain. When this pathway experiences atypical processing, the mind turns to visual anchors—such as hairline patterns, eyeglass geometry, vocal cadences, and situational cues—to reliably construct enduring personal connections.",
        "cover_emoji": "🧠"
    }
]

DEFAULT_CONTACTS = [
    {
        "id": "person_1",
        "name": "Dr. Aris Thorne",
        "role": "Chief Research Advisor",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        "met_count": 14,
        "last_met": "Yesterday at 3:15 PM",
        "context": "Neuroscience Lab 4B",
        "notes": "Leading cognitive load study",
        "visual_cues": ["Round tortoiseshell glasses", "Silver lapel pin", "Left parting silver hair"],
        "voice_cues": ["Calm baritone", "Speaks with deliberate pauses"],
        "reminder": "Review grant proposal before Friday",
        "category": "Work",
        "facial_features": {
            "face_shape": "Oval",
            "glasses": True,
            "beard": False,
            "hair_color": "Silver",
            "confidence_signature": 0.98
        }
    },
    {
        "id": "person_2",
        "name": "Elena Rostova",
        "role": "Senior UX Architect",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
        "met_count": 8,
        "last_met": "2 days ago",
        "context": "Innovation Hub, Floor 2",
        "notes": "Accessibility design partner",
        "visual_cues": ["Red cat-eye frames", "Always wears teal scarf", "Asymmetrical dark bob"],
        "voice_cues": ["Fast-paced enthusiastic speech", "Warm laughter"],
        "reminder": "Send feedback on Bionic Reading prototype",
        "category": "Colleague",
        "facial_features": {
            "face_shape": "Heart",
            "glasses": True,
            "beard": False,
            "hair_color": "Dark Brown",
            "confidence_signature": 0.95
        }
    },
    {
        "id": "person_3",
        "name": "Marcus Vance",
        "role": "Clinical Director",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
        "met_count": 21,
        "last_met": "Today at 10:00 AM",
        "context": "Therapy Wing Suite A",
        "notes": "Weekly check-in supervisor",
        "visual_cues": ["Neat trimmed salt-pepper beard", "Gold watch", "Deep set green eyes"],
        "voice_cues": ["Soft resonant tone", "British accent"],
        "reminder": "Discuss sensory regulation data from Calm Zone",
        "category": "Mentor",
        "facial_features": {
            "face_shape": "Square",
            "glasses": False,
            "beard": True,
            "hair_color": "Salt & Pepper",
            "confidence_signature": 0.97
        }
    }
]

class SupabaseManager:
    def __init__(self):
        self.url = SUPABASE_URL
        self.key = SUPABASE_KEY
        self.client: Optional[Client] = None
        self.is_connected = False
        self.active_user_cache: Dict[str, Any] = {
            "id": "user_alex_01",
            "name": "Alex Rivera",
            "email": "alex.rivera@prism-adaptive.io",
            "active_profile": "dyslexia",
            "reading_goal_minutes": 20,
            "reading_minutes_today": 14,
            "reading_streak_days": 6,
            "recognized_contacts_count": 5,
            "points": 380,
            "badges": [
                {"id": "b1", "name": "Focus Master", "icon": "zap", "desc": "Read 5 days in a row"},
                {"id": "b2", "name": "Face Detective", "icon": "sparkles", "desc": "Recognized 15 familiar people"}
            ],
            "preferences": DEFAULT_PREFERENCES.copy()
        }
        self.contacts_cache: List[Dict[str, Any]] = DEFAULT_CONTACTS.copy()
        self.reading_cache: List[Dict[str, Any]] = DEFAULT_READING_ITEMS.copy()
        self._initialize()

    def _initialize(self):
        try:
            if self.url and self.key:
                self.client = create_client(self.url, self.key)
                self.is_connected = True
                print(f"[PRISM Supabase] Connected successfully to {self.url}")
        except Exception as e:
            print(f"[PRISM Supabase Warning] Could not initialize client: {e}")
            self.is_connected = False

    # --- Authentication & User Identity Methods ---

    def sign_up(self, email: str, password: str, name: str = "", active_profile: str = "dyslexia") -> Dict[str, Any]:
        """Register a new user in Supabase and initialize their personal PRISM cloud record."""
        user_name = name.strip() or email.split("@")[0].capitalize()
        user_id = "user_" + email.split("@")[0].replace(".", "_").replace("+", "_")
        
        user_data = {
            "id": user_id,
            "email": email.strip(),
            "name": user_name,
            "active_profile": active_profile,
            "reading_goal_minutes": 20,
            "reading_minutes_today": 0,
            "reading_streak_days": 1,
            "recognized_contacts_count": 0,
            "points": 50,
            "badges": [
                {"id": "b0", "name": "Pioneer", "icon": "sparkles", "desc": "Joined PRISM Adaptive Platform"}
            ],
            "preferences": DEFAULT_PREFERENCES.copy()
        }

        # Try Supabase Auth API
        if self.is_connected and self.client:
            try:
                res = self.client.auth.sign_up({
                    "email": email.strip(),
                    "password": password,
                    "options": {
                        "data": {
                            "name": user_name,
                            "active_profile": active_profile
                        }
                    }
                })
                if res.user:
                    user_data["id"] = str(res.user.id)
            except Exception as e:
                print(f"[Supabase Auth sign_up note]: {e}")

        # Upsert user record to Supabase table
        self.upsert_user_profile(user_data)
        self.active_user_cache = user_data
        return {"status": "success", "user": user_data, "access_token": "prism_token_" + user_data["id"]}

    def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """Sign in existing user from Supabase and hydrate their personal cloud profile."""
        clean_email = email.strip()
        user_name = clean_email.split("@")[0].capitalize()
        user_id = "user_" + clean_email.split("@")[0].replace(".", "_").replace("+", "_")

        # Check existing profile in Supabase table
        existing_profile = self.get_user_profile_by_email(clean_email)
        if existing_profile:
            self.active_user_cache = existing_profile
            return {"status": "success", "user": existing_profile, "access_token": "prism_token_" + existing_profile["id"]}

        # Attempt Supabase Auth Client
        if self.is_connected and self.client:
            try:
                res = self.client.auth.sign_in_with_password({
                    "email": clean_email,
                    "password": password
                })
                if res.user:
                    user_id = str(res.user.id)
                    meta = res.user.user_metadata or {}
                    user_name = meta.get("name", user_name)
            except Exception as e:
                print(f"[Supabase Auth sign_in note]: {e}")

        user_data = {
            "id": user_id,
            "email": clean_email,
            "name": user_name,
            "active_profile": "dyslexia",
            "reading_goal_minutes": 20,
            "reading_minutes_today": 8,
            "reading_streak_days": 3,
            "recognized_contacts_count": 3,
            "points": 150,
            "badges": [
                {"id": "b1", "name": "Focus Explorer", "icon": "zap", "desc": "Active Reader"}
            ],
            "preferences": DEFAULT_PREFERENCES.copy()
        }
        self.upsert_user_profile(user_data)
        self.active_user_cache = user_data
        return {"status": "success", "user": user_data, "access_token": "prism_token_" + user_data["id"]}

    def sign_out(self) -> Dict[str, Any]:
        if self.is_connected and self.client:
            try:
                self.client.auth.sign_out()
            except Exception:
                pass
        return {"status": "success"}

    # --- User Profile CRUD Methods ---

    def upsert_user_profile(self, user_dict: Dict[str, Any]) -> bool:
        """Persist or update user profile row in Supabase table 'prism_users'."""
        self.active_user_cache.update(user_dict)
        if not self.is_connected or not self.client:
            return True
        try:
            payload = {
                "id": str(user_dict.get("id", self.active_user_cache.get("id", "user_alex_01"))),
                "email": str(user_dict.get("email", self.active_user_cache.get("email", "alex.rivera@prism-adaptive.io"))),
                "name": str(user_dict.get("name", self.active_user_cache.get("name", "Alex Rivera"))),
                "active_profile": str(user_dict.get("active_profile", self.active_user_cache.get("active_profile", "dyslexia"))),
                "reading_goal_minutes": int(user_dict.get("reading_goal_minutes", 20)),
                "reading_minutes_today": int(user_dict.get("reading_minutes_today", 0)),
                "reading_streak_days": int(user_dict.get("reading_streak_days", 1)),
                "recognized_contacts_count": int(user_dict.get("recognized_contacts_count", 0)),
                "points": int(user_dict.get("points", 50)),
                "badges": user_dict.get("badges", []),
                "preferences": user_dict.get("preferences", DEFAULT_PREFERENCES)
            }
            self.client.table("prism_users").upsert(payload).execute()
            return True
        except Exception as e:
            print(f"[Supabase upsert_user_profile notice]: {e}")
            return False

    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Fetch user profile from Supabase table or local cache."""
        if self.is_connected and self.client:
            try:
                res = self.client.table("prism_users").select("*").eq("id", user_id).execute()
                if res.data and len(res.data) > 0:
                    profile = res.data[0]
                    self.active_user_cache.update(profile)
                    return self.active_user_cache
            except Exception as e:
                print(f"[Supabase get_user_profile notice]: {e}")
        return self.active_user_cache

    def get_user_profile_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        if self.is_connected and self.client:
            try:
                res = self.client.table("prism_users").select("*").eq("email", email.strip()).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase get_user_profile_by_email notice]: {e}")
        return None

    def set_active_profile(self, profile_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        self.active_user_cache["active_profile"] = profile_id
        target_id = user_id or self.active_user_cache.get("id", "user_alex_01")
        if self.is_connected and self.client:
            try:
                self.client.table("prism_users").update({"active_profile": profile_id}).eq("id", target_id).execute()
            except Exception as e:
                print(f"[Supabase set_active_profile notice]: {e}")
        return self.active_user_cache

    def update_user_preferences(self, preferences: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        current_prefs = self.active_user_cache.get("preferences", DEFAULT_PREFERENCES.copy())
        current_prefs.update(preferences)
        self.active_user_cache["preferences"] = current_prefs
        target_id = user_id or self.active_user_cache.get("id", "user_alex_01")
        if self.is_connected and self.client:
            try:
                self.client.table("prism_users").update({"preferences": current_prefs}).eq("id", target_id).execute()
            except Exception as e:
                print(f"[Supabase update_user_preferences notice]: {e}")
        return current_prefs

    # --- Contacts & People Around Me (Face Blindness) ---

    def get_contacts(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        target_user = user_id or self.active_user_cache.get("id", "user_alex_01")
        if self.is_connected and self.client:
            try:
                res = self.client.table("prism_contacts").select("*").or_(f"user_id.eq.{target_user},user_id.eq.user_alex_01").execute()
                if res.data and len(res.data) > 0:
                    return res.data
            except Exception as e:
                print(f"[Supabase get_contacts notice]: {e}")
        return self.contacts_cache

    def save_contact(self, contact_dict: Dict[str, Any]) -> Dict[str, Any]:
        user_id = contact_dict.get("user_id") or self.active_user_cache.get("id", "user_alex_01")
        contact_dict["user_id"] = user_id
        
        # Update local cache
        existing = next((c for c in self.contacts_cache if c["id"] == contact_dict["id"]), None)
        if existing:
            existing.update(contact_dict)
        else:
            self.contacts_cache.insert(0, contact_dict)

        if self.is_connected and self.client:
            try:
                self.client.table("prism_contacts").upsert(contact_dict).execute()
            except Exception as e:
                print(f"[Supabase save_contact notice]: {e}")
        return contact_dict

    def delete_contact(self, contact_id: str) -> bool:
        self.contacts_cache = [c for c in self.contacts_cache if c["id"] != contact_id]
        if self.is_connected and self.client:
            try:
                self.client.table("prism_contacts").delete().eq("id", contact_id).execute()
                return True
            except Exception as e:
                print(f"[Supabase delete_contact notice]: {e}")
        return True

    # --- Reading Library (Dyslexia) ---

    def get_reading_items(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        target_user = user_id or self.active_user_cache.get("id", "user_alex_01")
        if self.is_connected and self.client:
            try:
                res = self.client.table("prism_reading_items").select("*").or_(f"user_id.eq.{target_user},user_id.eq.user_alex_01").execute()
                if res.data and len(res.data) > 0:
                    return res.data
            except Exception as e:
                print(f"[Supabase get_reading_items notice]: {e}")
        return self.reading_cache

    def get_reading_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        if self.is_connected and self.client:
            try:
                res = self.client.table("prism_reading_items").select("*").eq("id", item_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase get_reading_item notice]: {e}")
        return next((item for item in self.reading_cache if item["id"] == item_id), None)

    def save_reading_item(self, item_dict: Dict[str, Any]) -> Dict[str, Any]:
        user_id = item_dict.get("user_id") or self.active_user_cache.get("id", "user_alex_01")
        item_dict["user_id"] = user_id
        
        existing = next((i for i in self.reading_cache if i["id"] == item_dict["id"]), None)
        if existing:
            existing.update(item_dict)
        else:
            self.reading_cache.insert(0, item_dict)

        if self.is_connected and self.client:
            try:
                self.client.table("prism_reading_items").upsert(item_dict).execute()
            except Exception as e:
                print(f"[Supabase save_reading_item notice]: {e}")
        return item_dict

    # --- Cognitive Diagnostic Assessments ---

    def save_diagnostic_result(self, result_dict: Dict[str, Any]) -> bool:
        if not self.is_connected or not self.client:
            return True
        try:
            self.client.table("prism_diagnostic_results").insert(result_dict).execute()
            return True
        except Exception as e:
            print(f"[Supabase save_diagnostic_result notice]: {e}")
            return False

    def get_diagnostic_history(self, user_id: str) -> List[Dict[str, Any]]:
        if not self.is_connected or not self.client:
            return []
        try:
            res = self.client.table("prism_diagnostic_results").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
            return res.data or []
        except Exception as e:
            print(f"[Supabase get_diagnostic_history notice]: {e}")
            return []

supabase_db = SupabaseManager()
