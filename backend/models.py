from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ProfileSwitchRequest(BaseModel):
    profile_id: str  # 'dyslexia' | 'face_blindness'

class SignUpRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = ""
    active_profile: Optional[str] = "dyslexia"

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    status: str
    user: Optional[Dict[str, Any]] = None
    access_token: Optional[str] = None
    message: Optional[str] = None

class TextSimplifyRequest(BaseModel):
    text: str
    mode: str = "simpler"  # 'simpler', 'shorter', 'bullet', 'dyslexia_spaced'

class TextSimplifyResponse(BaseModel):
    original_text: str
    simplified_text: str
    key_points: List[str]
    reading_time_minutes: float
    difficulty_score: str
    syllable_count: int

class DiagnosticGameSubmitRequest(BaseModel):
    reversal_score: int  # 0 to 100
    rapid_word_score: int  # 0 to 100
    rhyme_score: int  # 0 to 100
    preferred_tint: str = "cream"
    total_time_seconds: float = 30.0

class DiagnosticGameResultResponse(BaseModel):
    stage_level: str
    stage_code: int
    severity_label: str
    overall_score: int
    accuracy_percent: float
    visual_fatigue_risk: str
    reversal_tendency: str
    recommended_settings: Dict[str, Any]
    detailed_insights: List[str]
    points_earned: int

class OCRRequest(BaseModel):
    image_data: Optional[str] = None
    preset_id: Optional[str] = None

class OCRResponse(BaseModel):
    extracted_text: str
    confidence: float
    detected_language: str
    word_count: int
    readability_level: str

class ScheduleItem(BaseModel):
    id: str
    time: str
    title: str
    icon: str
    category: str
    completed: bool = False
    notes: Optional[str] = ""
    sensory_tag: Optional[str] = "Normal"
    color: Optional[str] = "emerald"

class ScheduleCreateRequest(BaseModel):
    time: str
    title: str
    icon: str
    category: str
    notes: Optional[str] = ""
    sensory_tag: Optional[str] = "Normal"
    color: Optional[str] = "emerald"

class EmotionLogRequest(BaseModel):
    emotion: str  # 'Happy', 'Calm', 'Okay', 'Anxious', 'Sad', 'Angry'
    intensity: int = 3  # 1 to 5
    note: Optional[str] = ""
    trigger: Optional[str] = ""

class EmotionLogResponse(BaseModel):
    id: str
    timestamp: str
    emotion: str
    intensity: int
    note: str
    coping_strategies: List[Dict[str, str]]
    recommended_audio: str

class PersonContact(BaseModel):
    id: str
    name: str
    role: str
    avatar_url: str
    met_count: int = 1
    last_met: str
    context: str
    notes: str
    visual_cues: List[str]
    voice_cues: List[str]
    reminder: str
    category: str  # 'Classmate', 'Teacher', 'Work', 'Family', 'Friend'
    facial_features: Dict[str, Any]

class PersonCreateRequest(BaseModel):
    name: str
    role: str
    avatar_url: Optional[str] = ""
    context: str
    notes: str
    visual_cues: List[str]
    voice_cues: Optional[List[str]] = []
    reminder: Optional[str] = ""
    category: str = "Friend"

class FaceScanRequest(BaseModel):
    image_data: Optional[str] = None
    simulated_target_id: Optional[str] = None

class FaceScanResponse(BaseModel):
    detected: bool
    confidence: float
    matched_person: Optional[PersonContact] = None
    bounding_box: Dict[str, float]
    landmarks: Dict[str, Any]
    detected_features: List[str]
    immediate_context: str
    conversation_starters: List[str]

class CopilotQueryRequest(BaseModel):
    message: str
    profile: str = "dyslexia"
    context_data: Optional[Dict[str, Any]] = None

class CopilotQueryResponse(BaseModel):
    reply: str
    suggestions: List[str]
    action_type: Optional[str] = None
    action_payload: Optional[Dict[str, Any]] = None
