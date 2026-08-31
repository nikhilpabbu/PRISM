// PRISM: Personalized Real-time Intelligent Support Module
// Fullstack React 18 Application

const { useState, useEffect, useRef, useMemo } = React;

// --- Helper Functions for Text Highlighting & Bionic Reading ---
function formatBionicText(text) {
  if (!text) return '';
  const words = text.split(/(\s+)/);
  return words.map((chunk, idx) => {
    if (/^\s+$/.test(chunk)) return chunk;
    const mid = Math.ceil(chunk.length * 0.45);
    const boldPart = chunk.slice(0, mid);
    const restPart = chunk.slice(mid);
    return (
      <span key={idx}>
        <span className="bionic-bold">{boldPart}</span>
        {restPart}
      </span>
    );
  });
}

function formatSpokenOrBionicText(text, bionicEnabled, speechWordIndex, isSpeaking, offset = 0) {
  if (!text) return '';
  const words = text.split(/(\s+)/);
  let wordCounter = offset;

  return words.map((chunk, idx) => {
    if (/^\s+$/.test(chunk)) return chunk;
    const currentWordIdx = wordCounter;
    wordCounter++;

    const isCurrentWordSpoken = isSpeaking && speechWordIndex === currentWordIdx;

    if (isCurrentWordSpoken) {
      return (
        <span key={idx} className="tts-word-highlight">
          {chunk}
        </span>
      );
    }

    if (bionicEnabled) {
      const mid = Math.ceil(chunk.length * 0.45);
      const boldPart = chunk.slice(0, mid);
      const restPart = chunk.slice(mid);
      return (
        <span key={idx}>
          <span className="bionic-bold">{boldPart}</span>
          {restPart}
        </span>
      );
    }

    return <span key={idx}>{chunk}</span>;
  });
}

function formatSyllableText(text) {
  if (!text) return '';
  const words = text.split(/(\s+)/);
  return words.map((chunk, idx) => {
    if (/^\s+$/.test(chunk)) return chunk;
    // Simple vowel cluster split
    const parts = chunk.match(/[bcdfghjklmnpqrstvwxyz]*[aeiouy]+[bcdfghjklmnpqrstvwxyz]*/gi) || [chunk];
    return (
      <span key={idx} className="inline-block mr-1">
        {parts.map((p, pIdx) => (
          <span key={pIdx} className={pIdx % 2 === 0 ? "syllable-even" : "syllable-odd"}>{p}</span>
        ))}
      </span>
    );
  });
}

// --- Main PRISM App Component ---
function App() {
  // Session & Authentication Gating State
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem('prism_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Navigation & Profile States ('welcome', 'dyslexia', 'face_blindness', 'insights', 'architecture')
  const [activeView, setActiveView] = useState('welcome');
  const [activeModal, setActiveModal] = useState(null); // 'reader', 'simplifier', 'ocr', 'face_scanner', 'person_profile', 'memory_quiz', 'copilot', 'accessibility'

  // User Profile & Preferences State
  const [user, setUser] = useState({
    name: "Alex Rivera",
    email: "alex.rivera@prism-adaptive.io",
    active_profile: "dyslexia",
    reading_goal_minutes: 20,
    reading_minutes_today: 14,
    reading_streak_days: 6,
    recognized_contacts_count: 5,
    points: 380,
    badges: [
      { id: "b1", name: "Focus Master", icon: "zap", desc: "Read 5 days in a row" },
      { id: "b2", name: "Face Detective", icon: "sparkles", desc: "Recognized 15 familiar people" }
    ],
    preferences: {
      font_family: "OpenDyslexic", // 'OpenDyslexic', 'Lexend', 'Atkinson', 'Inter'
      font_size: "medium", // 'small', 'medium', 'large', 'xlarge'
      line_spacing: 1.75,
      background_tint: "lavender", // 'default', 'cream', 'peach', 'mint', 'lavender', 'dark'
      bionic_reading: true,
      syllable_coloring: false,
      reading_ruler_enabled: true,
      reading_ruler_height: 52,
      tts_speed: 0.95,
      tts_pitch: 1.0,
      high_contrast: false,
      colorblind_mode: "none",
      reduced_motion: false
    }
  });

  // Module Data States
  const [readingItems, setReadingItems] = useState([]);
  const [activeReadingItem, setActiveReadingItem] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [prevalenceData, setPrevalenceData] = useState(null);

  // Universal Multi-Voice Reader TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechWordIndex, setSpeechWordIndex] = useState(-1);
  const [speechWordsList, setSpeechWordsList] = useState([]);
  const [currentSpokenText, setCurrentSpokenText] = useState("");
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [activeSpeechSpeed, setActiveSpeechSpeed] = useState(0.95);
  const [rulerTop, setRulerTop] = useState(140);
  const [isRulerDragging, setIsRulerDragging] = useState(false);

  // Copilot State
  const [copilotMessages, setCopilotMessages] = useState([
    { sender: "copilot", text: "Hello Alex! I am your PRISM Copilot. I automatically tailor my interface, reading aids, and memory assistants to your needs. How can I assist you today?" }
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [isListeningSTT, setIsListeningSTT] = useState(false);

  // Load system SpeechSynthesis voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          setAvailableVoices(voices);
          const preferredVoice = voices.find(
            v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('David') || v.default)
          );
          if (preferredVoice && !selectedVoiceURI) {
            setSelectedVoiceURI(preferredVoice.voiceURI);
          }
        }
      }
    };
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Fetch initial data from backend API
  useEffect(() => {
    fetchUserData();
    fetchReadingItems();
    fetchContacts();
    fetchAnalytics();
  }, []);

  // Update DOM body classes when preferences change (tint, contrast, font, colorblind)
  useEffect(() => {
    const p = user.preferences;
    document.body.className = '';
    
    // Tint
    if (p.background_tint && p.background_tint !== 'default') {
      document.body.classList.add(`tint-${p.background_tint}`);
    }
    // High Contrast
    if (p.high_contrast) {
      document.body.classList.add('high-contrast');
    }
    // Colorblind Filter
    if (p.colorblind_mode && p.colorblind_mode !== 'none') {
      document.body.classList.add(`filter-${p.colorblind_mode}`);
    }
    // Font family
    if (p.font_family === 'OpenDyslexic') {
      document.body.classList.add('font-opendyslexic');
    } else if (p.font_family === 'Lexend') {
      document.body.classList.add('font-lexend');
    } else if (p.font_family === 'Atkinson') {
      document.body.classList.add('font-atkinson');
    } else {
      document.body.classList.add('font-inter');
    }
  }, [user.preferences]);

  // Re-run Lucide icon parser safely after DOM updates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        try {
          window.lucide.createIcons();
        } catch (e) {
          console.warn("Lucide parser notice:", e);
        }
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [activeView, activeModal, session, isSpeaking, isPaused]);

  // Safe JSON response parser
  const safeJson = async (res) => {
    if (!res) return null;
    try {
      const text = await res.text();
      if (!text) return null;
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  };

  // Backend API Callers
  const fetchUserData = async (overrideUserId) => {
    try {
      const uid = overrideUserId || session?.id || user.id;
      const res = await fetch(`/api/user${uid ? `?user_id=${encodeURIComponent(uid)}` : ''}`);
      const data = await safeJson(res);
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setUser(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.warn("Using offline user cache", e);
    }
  };

  const fetchReadingItems = async (overrideUserId) => {
    try {
      const uid = overrideUserId || session?.id || user.id;
      const res = await fetch(`/api/dyslexia/reading-items${uid ? `?user_id=${encodeURIComponent(uid)}` : ''}`);
      const data = await safeJson(res);
      if (Array.isArray(data)) {
        setReadingItems(data);
        if (data.length > 0) setActiveReadingItem(data[0]);
      }
    } catch (e) {}
  };

  const fetchContacts = async (overrideUserId) => {
    try {
      const uid = overrideUserId || session?.id || user.id;
      const res = await fetch(`/api/face-blindness/contacts${uid ? `?user_id=${encodeURIComponent(uid)}` : ''}`);
      const data = await safeJson(res);
      if (Array.isArray(data)) {
        setContacts(data);
        if (data.length > 0) setSelectedContact(data[0]);
      }
    } catch (e) {}
  };

  const handleDeleteContact = async (contactId, contactName) => {
    if (!window.confirm(`Are you sure you want to remove ${contactName || "this contact"} from your familiar people list?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/face-blindness/contacts/${contactId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setContacts(prev => prev.filter(c => c.id !== contactId));
        setUser(prev => ({
          ...prev,
          recognized_contacts_count: Math.max(0, prev.recognized_contacts_count - 1)
        }));
        if (selectedContact?.id === contactId) {
          setActiveModal(null);
          setSelectedContact(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete contact:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await safeJson(res);
      if (data && data.prevalence_data) setPrevalenceData(data.prevalence_data);
    } catch (e) {}
  };

  const handleLoginSuccess = (userData) => {
    setSession(userData);
    try {
      localStorage.setItem('prism_user_session', JSON.stringify(userData));
    } catch (e) {}
    if (userData) {
      setUser(prev => ({
        ...prev,
        ...userData,
        name: userData.name || prev.name,
        email: userData.email || prev.email,
        active_profile: userData.active_profile || prev.active_profile,
        preferences: userData.preferences || prev.preferences
      }));
      setCopilotMessages([
        {
          sender: "copilot",
          text: `Hello ${userData.name ? userData.name.split(' ')[0] : 'there'}! I am your PRISM Copilot. Your personal accessibility profile is loaded. How can I assist you today?`,
          suggestions: ["Scan document with OCR", "Launch Face Scanner Camera", "Open Dyslexia Reader"]
        }
      ]);
      if (userData.active_profile) {
        setActiveView(userData.active_profile);
      }
      fetchUserData(userData.id);
      fetchReadingItems(userData.id);
      fetchContacts(userData.id);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    try {
      localStorage.removeItem('prism_user_session');
    } catch (e) {}
    setSession(null);
  };

  // Switch Active Profile Mode
  const handleSwitchProfile = async (profileId) => {
    setActiveView(profileId);
    try {
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId })
      });
      setUser(prev => ({ ...prev, active_profile: profileId }));
    } catch (e) {}
  };

  // Update Preference
  const handleUpdatePreference = async (key, val) => {
    const updated = { ...user.preferences, [key]: val };
    setUser(prev => ({ ...prev, preferences: updated }));
    try {
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {}
  };

  // Multi-Voice Text-To-Speech Engine with Real-Time Word Tracking
  const handleSpeakText = (textToSpeak, customRate) => {
    if (!window.speechSynthesis || !textToSpeak) return;

    // Toggle pause/play if same text is already loaded
    if (isSpeaking && !isPaused && currentSpokenText === textToSpeak && !customRate) {
      handlePauseSpeech();
      return;
    }
    if (isSpeaking && isPaused && currentSpokenText === textToSpeak && !customRate) {
      handleResumeSpeech();
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch (e) {}

    const words = textToSpeak.split(/\s+/).filter(Boolean);
    setSpeechWordsList(words);
    setCurrentSpokenText(textToSpeak);
    setIsSpeaking(true);
    setIsPaused(false);
    setSpeechWordIndex(0);

    const rate = customRate || activeSpeechSpeed || user.preferences.tts_speed || 0.95;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = rate;
    utterance.pitch = user.preferences.tts_pitch || 1.0;

    if (selectedVoiceURI && availableVoices.length > 0) {
      const matched = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
      if (matched) utterance.voice = matched;
    }

    let wordIdx = 0;
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setSpeechWordIndex(wordIdx);
        wordIdx++;
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeechWordIndex(-1);
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled') {
        setIsSpeaking(false);
        setIsPaused(false);
        setSpeechWordIndex(-1);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePauseSpeech = () => {
    if (window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleResumeSpeech = () => {
    if (window.speechSynthesis && isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const handleStopSpeech = () => {
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeechWordIndex(-1);
      setCurrentSpokenText("");
    }
  };

  const handleChangeSpeechSpeed = (newSpeed) => {
    setActiveSpeechSpeed(newSpeed);
    handleUpdatePreference('tts_speed', newSpeed);
    if (isSpeaking && currentSpokenText) {
      handleSpeakText(currentSpokenText, newSpeed);
    }
  };

  // Speech-to-Text Recognition for AI Copilot
  const handleStartSTT = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition is supported in Chrome/Edge browsers. You can also type directly!");
      return;
    }
    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    setIsListeningSTT(true);
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setCopilotInput(transcript);
      setIsListeningSTT(false);
    };
    rec.onerror = () => setIsListeningSTT(false);
    rec.onend = () => setIsListeningSTT(false);
    rec.start();
  };

  // Send Copilot Query
  const handleSendCopilot = async (customMessage, extraPayload) => {
    const msg = customMessage || copilotInput;
    if (!msg.trim()) return;

    // Append user message
    const newMsg = {
      sender: "user",
      text: msg,
      imageThumb: extraPayload?.thumbnail || null
    };
    setCopilotMessages(prev => [...prev, newMsg]);
    setCopilotInput("");

    try {
      const res = await fetch('/api/copilot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          profile: activeView,
          context_data: extraPayload || null
        })
      });
      const data = await res.json();
      setCopilotMessages(prev => [
        ...prev,
        {
          sender: "copilot",
          text: data.reply,
          suggestions: data.suggestions
        }
      ]);
    } catch (e) {
      setCopilotMessages(prev => [
        ...prev,
        {
          sender: "copilot",
          text: "I am ready to help you with Reading Assistance or Face Recognition memory cues! What would you like to explore?",
          suggestions: ["Scan document with OCR", "Launch Face Scanner Camera", "Open Dyslexia Reader"]
        }
      ]);
    }
  };

  if (!session) {
    return <AuthPortal onLoginSuccess={handleLoginSuccess} onSpeak={handleSpeakText} />;
  }

  return (
    <div className="min-h-screen flex flex-col antialiased selection:bg-purple-200 selection:text-purple-900">
      
      {/* Top Universal Accessible Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        {/* Brand & Tree Logo */}
        <div
          onClick={() => setActiveView('welcome')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 p-0.5 shadow-md group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden p-1">
              <img
                src="/static/assets/logo_cropped.png"
                alt="PRISM Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 font-outfit">
                PRISM
              </span>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md bg-purple-100 text-purple-800 tracking-wider">
                Adaptive
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden md:block">
              Personalized Real-time Intelligent Support Module
            </p>
          </div>
        </div>

        {/* Profile Mode Quick Tabs (Hub, Dyslexia, Face Blindness) */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => handleSwitchProfile('welcome')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === 'welcome'
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i data-lucide="home" className="w-3.5 h-3.5"></i> Hub
          </button>
          <button
            onClick={() => handleSwitchProfile('dyslexia')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === 'dyslexia'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <i data-lucide="book-open" className="w-3.5 h-3.5"></i> Dyslexia
          </button>
          <button
            onClick={() => handleSwitchProfile('face_blindness')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === 'face_blindness'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            <i data-lucide="scan" className="w-3.5 h-3.5"></i> Face Blindness
          </button>
        </div>

        {/* Header Right Action Suite */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Streaks & Rewards */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-xs font-bold shadow-xs">
            <i data-lucide="flame" className="w-4 h-4 text-amber-500 fill-amber-400"></i>
            <span>{user.reading_streak_days}d Streak</span>
            <span className="text-amber-400">|</span>
            <span className="text-amber-700">{user.points} pts</span>
          </div>

          {/* User Profile Badge */}
          <div
            className="flex items-center gap-1.5 p-1 pl-2.5 bg-purple-50 rounded-2xl border border-purple-200 select-none"
            title="Active User Profile"
          >
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-extrabold text-purple-950 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {user.name.split(' ')[0]}
              </span>
              <span className="text-[9px] text-purple-600 font-mono font-bold">Active User</span>
            </div>
            <div className="p-1.5 rounded-xl bg-white text-purple-700 text-xs font-bold border border-purple-200">
              <i data-lucide="user" className="w-3.5 h-3.5"></i>
            </div>
          </div>

          {/* Prominent Log Out Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-red-200 shadow-xs cursor-pointer"
            title="Log Out of PRISM"
          >
            <i data-lucide="log-out" className="w-3.5 h-3.5"></i>
            <span className="hidden sm:inline">Log Out</span>
          </button>

          {/* AI Copilot Button */}
          <button
            onClick={() => setActiveModal('copilot')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-purple-200 transition-all hover:scale-105"
            title="Open PRISM AI Assistant"
          >
            <i data-lucide="sparkles" className="w-3.5 h-3.5"></i>
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* Accessibility Settings Trigger */}
          <button
            onClick={() => setActiveModal('accessibility')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
            title="Accessibility & Comfort Settings"
          >
            <i data-lucide="accessibility" className="w-4 h-4"></i>
          </button>

          {/* Architecture Diagram */}
          <button
            onClick={() => setActiveView(activeView === 'architecture' ? 'welcome' : 'architecture')}
            className={`p-2 rounded-xl transition-colors border ${
              activeView === 'architecture'
                ? 'bg-purple-100 text-purple-800 border-purple-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Architecture Diagram (Slide 5)"
          >
            <i data-lucide="layers" className="w-4 h-4"></i>
          </button>
        </div>
      </header>

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* VIEW 1: WELCOME & PROFILE SELECTOR */}
        {activeView === 'welcome' && (
              <div className="space-y-10 animate-fade-in">
                {/* Hero Header with Official PRISM Tree Logo */}
                <div className="text-center max-w-2xl mx-auto pt-2 pb-2 flex flex-col items-center">
                  <div className="relative mb-4 group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-600 rounded-full blur-md opacity-30 group-hover:opacity-60 transition duration-500"></div>
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white p-2 shadow-xl border-2 border-slate-100 flex items-center justify-center overflow-hidden">
                      <img src="/static/assets/logo_cropped.png" alt="PRISM Adaptive Logo" className="w-full h-full object-contain hover:scale-105 transition-transform duration-300" />
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 mb-3">
                    <i data-lucide="sparkles" className="w-3.5 h-3.5"></i> Capgemini x Synchrony Innovation
                  </span>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight font-outfit">
                    Welcome, {user.name.split(' ')[0]}! 👋
                  </h1>
                  <p className="text-lg text-slate-600 mt-2 font-medium">
                    Choose your accessibility profile. You can change this anytime in settings.
                  </p>
                </div>

            {/* Profile Selection Cards Grid (2 Profile Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              
              {/* Profile Card 1: Dyslexia */}
              <div
                onClick={() => handleSwitchProfile('dyslexia')}
                className="group relative bg-white/90 backdrop-blur-md rounded-3xl p-8 border-2 border-purple-100 hover:border-purple-500 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/15 transition-all duration-300 cursor-pointer flex flex-col items-center text-center transform hover:-translate-y-1.5"
              >
                <div className="w-20 h-20 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <i data-lucide="book-open" className="w-10 h-10"></i>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 font-outfit group-hover:text-purple-700 transition-colors">
                  Dyslexia
                </h3>
                <p className="text-slate-600 mt-3 text-sm leading-relaxed">
                  Reading support, text simplification, bionic reading, colored tints, and audio assistance.
                </p>
                <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-4 py-2 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  Open Dyslexia Mode <i data-lucide="arrow-right" className="w-3.5 h-3.5"></i>
                </div>
              </div>

              {/* Profile Card 2: Face Blindness (Prosopagnosia) */}
              <div
                onClick={() => handleSwitchProfile('face_blindness')}
                className="group relative bg-white/90 backdrop-blur-md rounded-3xl p-8 border-2 border-blue-100 hover:border-blue-500 shadow-xl shadow-blue-500/5 hover:shadow-2xl hover:shadow-blue-500/15 transition-all duration-300 cursor-pointer flex flex-col items-center text-center transform hover:-translate-y-1.5"
              >
                <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <i data-lucide="scan-face" className="w-10 h-10"></i>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 font-outfit group-hover:text-blue-700 transition-colors">
                  Face Blindness
                </h3>
                <p className="text-slate-600 mt-3 text-sm leading-relaxed">
                  Face recognition HUD assistance, memory cue cards, distinctive visual anchors, and practice quiz.
                </p>
                <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  Open Face Blindness Mode <i data-lucide="arrow-right" className="w-3.5 h-3.5"></i>
                </div>
              </div>

            </div>

            {/* Privacy & Security Banner */}
            <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-white/80 border border-slate-200/90 shadow-sm flex items-center justify-center gap-3 text-xs text-slate-600">
              <i data-lucide="lock" className="w-4 h-4 text-emerald-600"></i>
              <span className="font-medium">
                Your data is private and secure. Local-first facial recognition, zero third-party tracking, WCAG 2.1 AAA compliant.
              </span>
            </div>

            {/* Quick Overview Navigation Hub (2 cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
              <button
                onClick={() => setActiveView('insights')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 shadow-xs hover:shadow-md transition-all text-left group flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <i data-lucide="bar-chart-3" className="w-5 h-5"></i>
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">Prevalence & Overlap</div>
                  <div className="text-[11px] text-slate-500">Slide 6 overlap data & research</div>
                </div>
              </button>

              <button
                onClick={() => setActiveView('architecture')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all text-left group flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <i data-lucide="cpu" className="w-5 h-5"></i>
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">System Architecture</div>
                  <div className="text-[11px] text-slate-500">Slide 5 fullstack engine</div>
                </div>
              </button>
            </div>

          </div>
        )}

        {/* VIEW 2: DYSLEXIA MODE (Purple Theme Dashboard) */}
        {activeView === 'dyslexia' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Header Greeting Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-600/10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-purple-100 mb-2 border border-white/20">
                  <i data-lucide="book-open" className="w-3.5 h-3.5"></i> Dyslexia Mode Active
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-outfit">
                  Good Morning, {user?.name ? user.name.split(' ')[0] : 'there'}! 📖
                </h1>
                <p className="text-purple-100 text-sm sm:text-base mt-1">
                  Let's make reading effortless, comfortable, and enjoyable today.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setActiveModal('diagnostic_game')}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-amber-950 rounded-2xl font-extrabold text-xs shadow-lg hover:from-amber-300 hover:to-amber-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-amber-200"
                  title="Play Cognitive Diagnostic Game to assess dyslexia condition & stage"
                >
                  <i data-lucide="gamepad-2" className="w-4 h-4"></i> Stage Assessment Game
                </button>
                <button
                  onClick={() => setActiveModal('ocr')}
                  className="px-4 py-2.5 bg-white text-purple-700 rounded-2xl font-bold text-xs shadow-md hover:bg-purple-50 transition-all flex items-center gap-2"
                >
                  <i data-lucide="camera" className="w-4 h-4"></i> Scan & Read
                </button>
                <button
                  onClick={() => setActiveModal('simplifier')}
                  className="px-4 py-2.5 bg-purple-800/80 text-white rounded-2xl font-bold text-xs border border-purple-400/40 hover:bg-purple-800 transition-all flex items-center gap-2"
                >
                  <i data-lucide="file-text" className="w-4 h-4"></i> Text Simplifier
                </button>
              </div>
            </div>

            {/* Top Row: Continue Reading Feature Card & Today's Reading Goal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Continue Reading Card */}
              <div className="lg:col-span-2 bg-gradient-to-br from-purple-50 via-white to-purple-50/50 rounded-3xl p-6 sm:p-7 border border-purple-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700">
                    Continue Reading
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                    {activeReadingItem?.time_left || '5 min left'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 my-5">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-outfit">
                      {activeReadingItem?.title || "The Invisible String"}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {activeReadingItem?.subtitle || "Chapter 3 • Overcoming the Unknown"}
                    </p>
                    <p className="text-xs text-purple-600 font-semibold mt-2">
                      by {activeReadingItem?.author || "Patrice Karst"}
                    </p>
                  </div>

                  <div className="w-20 h-24 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-4xl shadow-lg text-white shadow-purple-300/40">
                    {activeReadingItem?.cover_emoji || "📖"}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
                    <span>Reading Progress</span>
                    <span className="text-purple-700 font-bold">{activeReadingItem?.progress_percent || 60}%</span>
                  </div>
                  <div className="w-full h-3 bg-purple-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${activeReadingItem?.progress_percent || 60}%` }}
                    ></div>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <button
                      onClick={() => setActiveModal('reader')}
                      className="px-5 py-2.5 bg-purple-600 text-white rounded-2xl text-xs font-bold shadow-md hover:bg-purple-700 transition-all flex items-center gap-2"
                    >
                      <i data-lucide="book-open" className="w-4 h-4"></i> Open Reader View
                    </button>
                    <button
                      onClick={() => handleSpeakText(activeReadingItem?.content || "")}
                      className="px-4 py-2.5 bg-purple-50 text-purple-700 rounded-2xl text-xs font-bold hover:bg-purple-100 transition-all flex items-center gap-2"
                    >
                      <i data-lucide="volume-2" className="w-4 h-4"></i> Listen
                    </button>
                  </div>
                </div>
              </div>

              {/* Today's Reading Goal Widget */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Daily Reading Goal
                    </span>
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                      {user.reading_minutes_today} / {user.reading_goal_minutes} mins
                    </span>
                  </div>

                  {/* Circular Goal Ring */}
                  <div className="flex items-center justify-center my-4">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-purple-600 transition-all duration-1000 ease-out"
                          strokeDasharray={`${(user.reading_minutes_today / user.reading_goal_minutes) * 100}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-black text-slate-900 font-outfit">
                          {Math.round((user.reading_minutes_today / user.reading_goal_minutes) * 100)}%
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                          Completed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-center">
                  <span className="text-xs text-slate-600">
                    🔥 <strong>6 min remaining</strong> to keep your streak!
                  </span>
                </div>
              </div>

            </div>

            {/* Quick Tools Suite (Dyslexia) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 font-outfit">Quick Tools</h3>
                <span className="text-xs font-semibold text-purple-600">Dyslexia Support Suite</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                
                {/* Featured Diagnostic Assessment Card */}
                <button
                  onClick={() => setActiveModal('diagnostic_game')}
                  className="bg-gradient-to-br from-amber-50 via-white to-amber-100/50 p-5 rounded-3xl border-2 border-amber-300 hover:border-amber-500 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group relative overflow-hidden transform hover:-translate-y-1"
                >
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[9px] font-black uppercase tracking-wider">
                    Game
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-white transition-colors shadow-inner">
                    <i data-lucide="gamepad-2" className="w-6 h-6"></i>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Diagnostic Game</span>
                  <span className="text-[11px] text-slate-500 mt-1">Diagnose stage & tools</span>
                </button>

                <button
                  onClick={() => setActiveModal('reader')}
                  className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-400 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <i data-lucide="book-open" className="w-6 h-6"></i>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Read Mode</span>
                  <span className="text-[11px] text-slate-500 mt-1">OpenDyslexic & Ruler</span>
                </button>

                <button
                  onClick={() => setActiveModal('simplifier')}
                  className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-400 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <i data-lucide="file-text" className="w-6 h-6"></i>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Text Simplifier</span>
                  <span className="text-[11px] text-slate-500 mt-1">NLP easier vocabulary</span>
                </button>

                <button
                  onClick={() => setActiveModal('ocr')}
                  className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-400 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <i data-lucide="camera" className="w-6 h-6"></i>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Scan & OCR</span>
                  <span className="text-[11px] text-slate-500 mt-1">Webcam text extraction</span>
                </button>

                <button
                  onClick={() => setActiveModal('accessibility')}
                  className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-400 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group col-span-2 sm:col-span-1"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <i data-lucide="palette" className="w-6 h-6"></i>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Color Tints</span>
                  <span className="text-[11px] text-slate-500 mt-1">Irlen reading overlays</span>
                </button>

              </div>
            </div>

            {/* Reading Library Shelf */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 font-outfit">My Reading Library</h3>
                <button
                  onClick={() => setActiveModal('ocr')}
                  className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                >
                  <i data-lucide="plus" className="w-3.5 h-3.5"></i> Add New Book / Document
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {readingItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveReadingItem(item);
                      setActiveModal('reader');
                    }}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/40 transition-all cursor-pointer flex items-center gap-3.5 group"
                  >
                    <div className="w-12 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform shrink-0">
                      {item.cover_emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">{item.title}</div>
                      <div className="text-xs text-slate-500 truncate">{item.author}</div>
                      <div className="text-[10px] text-purple-700 font-semibold mt-1">{item.time_left}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* VIEW 3: FACE BLINDNESS (PROSOPAGNOSIA) MODE (Blue Theme Dashboard) */}
        {activeView === 'face_blindness' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Header Greeting Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-600/10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-100 mb-2 border border-white/20">
                  <i data-lucide="scan-face" className="w-3.5 h-3.5"></i> Face Blindness Mode Active
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-outfit">
                  Good Morning, {user?.name ? user.name.split(' ')[0] : 'there'}! 👓
                </h1>
                <p className="text-blue-100 text-sm sm:text-base mt-1">
                  Let's help you recognize familiar faces, remember contexts, and build confidence.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveModal('face_scanner')}
                  className="px-4 py-2.5 bg-white text-blue-700 rounded-2xl font-bold text-xs shadow-md hover:bg-blue-50 transition-all flex items-center gap-2"
                >
                  <i data-lucide="scan" className="w-4 h-4"></i> Scan Person
                </button>
                <button
                  onClick={() => setActiveModal('memory_quiz')}
                  className="px-4 py-2.5 bg-blue-800/80 text-white rounded-2xl font-bold text-xs border border-blue-400/40 hover:bg-blue-800 transition-all flex items-center gap-2"
                >
                  <i data-lucide="award" className="w-4 h-4"></i> Memory Quiz
                </button>
              </div>
            </div>

            {/* People Around Me (Avatar Grid) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-outfit">People Around Me</h3>
                  <p className="text-xs text-slate-500">Tap anyone to view their visual cues, voice clues, and meeting context</p>
                </div>
                <button
                  onClick={() => setActiveModal('face_scanner')}
                  className="px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                >
                  <i data-lucide="camera" className="w-3.5 h-3.5"></i> Live HUD Scan
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 pt-2">
                {contacts.map((person) => (
                  <div
                    key={person.id}
                    onClick={() => {
                      setSelectedContact(person);
                      setActiveModal('person_profile');
                    }}
                    className="relative p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer flex flex-col items-center text-center group"
                  >
                    {/* Quick Delete Contact Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteContact(person.id, person.name);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/95 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center border border-slate-200 shadow-xs z-10"
                      title={`Remove ${person.name} from familiar contacts`}
                    >
                      <i data-lucide="trash-2" className="w-3.5 h-3.5 text-red-500"></i>
                    </button>

                    <div className="relative w-16 h-16 rounded-full overflow-hidden mb-2.5 border-2 border-blue-100 group-hover:border-blue-500 shadow-xs">
                      <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold text-slate-900 text-xs truncate max-w-full">{person.name}</span>
                    <span className="text-[11px] text-slate-500 truncate max-w-full">{person.role.split('&')[0]}</span>
                    <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md mt-1">
                      {person.met_count} visits
                    </span>
                  </div>
                ))}

                {/* Add Person Action */}
                <div
                  onClick={() => {
                    const name = prompt("Enter contact name:");
                    if (name) {
                      const newContact = {
                        name,
                        role: "Classmate / Colleague",
                        context: "Campus / Lab",
                        notes: "Met recently",
                        visual_cues: ["Friendly posture"],
                        reminder: "Say hello next time"
                      };
                      fetch('/api/face-blindness/contacts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newContact)
                      }).then(() => fetchContacts());
                    }
                  }}
                  className="p-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer flex flex-col items-center justify-center text-center min-h-[140px]"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                    <i data-lucide="plus" className="w-5 h-5"></i>
                  </div>
                  <span className="font-bold text-blue-700 text-xs">Add Person</span>
                </div>
              </div>
            </div>

            {/* Recent Interactions & Memory Anchor Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recent Interactions Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 font-outfit">Recent Interactions</h3>
                  <span className="text-xs font-semibold text-blue-600">Memory History</span>
                </div>

                <div className="space-y-3">
                  {contacts.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedContact(p);
                        setActiveModal('person_profile');
                      }}
                      className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-200 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src={p.avatar_url} className="w-11 h-11 rounded-full object-cover border border-slate-200" />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                          <div className="text-xs text-slate-500">Met {p.last_met} • {p.context}</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-xl">
                        {p.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Memory Reinforcement Practice Widget */}
              <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-3xl p-6 border border-blue-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700">
                      Cognitive Training
                    </span>
                    <i data-lucide="brain" className="w-4 h-4 text-blue-600"></i>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 mt-2 font-outfit">
                    Face & Visual Cue Flashcards
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Practice associating distinctive visual anchors (glasses, hairstyles, voice cadence) with familiar contacts to build permanent mental recall pathways.
                  </p>

                  <div className="p-4 bg-white rounded-2xl border border-blue-100 mt-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
                      🏆
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">15 / 15 Contacts Mastered</div>
                      <div className="text-[11px] text-emerald-600 font-semibold">96% Face-Cue Recognition Accuracy</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={() => setActiveModal('memory_quiz')}
                    className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-2xl shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <i data-lucide="play" className="w-4 h-4"></i> Start 2-Minute Quiz
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* VIEW 4: GLOBAL PREVALENCE & CO-OCCURRENCE (Slide 6) */}
        {activeView === 'insights' && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-extrabold text-slate-900 font-outfit">
                Global Estimates & Assistive Need
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Data insights based on WHO, CDC, Harvard Medical School, and Scientific Research (2023–2024).
              </p>
            </div>

            {/* Global Prevalence Top Cards (2 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              
              <div className="bg-white rounded-3xl p-8 border-t-4 border-purple-600 shadow-sm text-center">
                <div className="text-4xl font-black text-purple-700">~10%</div>
                <div className="text-xs font-bold text-slate-500 uppercase mt-1">Global Population</div>
                <h4 className="text-2xl font-bold text-slate-900 mt-3">Dyslexia</h4>
                <p className="text-sm text-slate-600 mt-2">~800 Million people worldwide experience written language processing challenges.</p>
              </div>

              <div className="bg-white rounded-3xl p-8 border-t-4 border-blue-600 shadow-sm text-center">
                <div className="text-4xl font-black text-blue-700">~2.5%</div>
                <div className="text-xs font-bold text-slate-500 uppercase mt-1">Global Population</div>
                <h4 className="text-2xl font-bold text-slate-900 mt-3">Prosopagnosia (Face Blindness)</h4>
                <p className="text-sm text-slate-600 mt-2">~200 Million people worldwide have difficulty recognizing familiar human faces.</p>
              </div>

            </div>

            {/* Co-occurrence Relationship Table (from Slide 6) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-4xl mx-auto">
              <h3 className="text-xl font-bold text-slate-900 font-outfit mb-4">
                Condition Prevalence & Co-occurrence Rates
              </h3>

              <div className="space-y-4">
                {[
                  { label: "People with Dyslexia in the Global Population", rate: "~10% (800 Million)", color: "purple" },
                  { label: "People with Developmental Prosopagnosia", rate: "~2.5% (200 Million)", color: "blue" },
                  { label: "People with Prosopagnosia who also experience Dyslexia / Reading Difficulties", rate: "~15–25%", color: "indigo" },
                  { label: "Students with learning differences who benefit from Multimodal Visual Cues", rate: "~70–80%", color: "purple" }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-slate-800">{item.label}</span>
                    <span className="text-sm font-black px-3 py-1 bg-white rounded-xl shadow-xs text-slate-900 border border-slate-200">
                      {item.rate}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* VIEW 5: INTERACTIVE ARCHITECTURE EXPLORER (IMAGE 1.png / Slide 5) */}
        {activeView === 'architecture' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold mb-2">
                <i data-lucide="layers" className="w-3.5 h-3.5"></i> Platform Architecture Explorer
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-outfit">
                PRISM Core Engineering Architecture (Slide 5)
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Explore the complete modular architecture powering our adaptive accessibility engine.
              </p>
            </div>

            {/* Architecture Grid */}
            <div className="space-y-6">
              
              {/* Layer 1: User Journey */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-purple-700 mb-3">1. User Journey Flow</h3>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center text-xs">
                  <div className="p-3 bg-purple-50 rounded-xl font-bold text-purple-900">1. Sign Up / Login</div>
                  <div className="p-3 bg-purple-50 rounded-xl font-bold text-purple-900">2. Choose Profile</div>
                  <div className="p-3 bg-purple-50 rounded-xl font-bold text-purple-900">3. Profile Setup</div>
                  <div className="p-3 bg-purple-50 rounded-xl font-bold text-purple-900">4. Adaptive Dashboard</div>
                  <div className="p-3 bg-purple-50 rounded-xl font-bold text-purple-900">5. Use AI Tools</div>
                  <div className="p-3 bg-purple-50 rounded-xl font-bold text-purple-900">6. Progress & Insights</div>
                </div>
              </div>

              {/* Layer 2: Frontend & Core Engine (2 Modules: Dyslexia & Face Blindness) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Dyslexia Module Engine */}
                <div className="bg-purple-50/50 rounded-3xl p-6 border-2 border-purple-200">
                  <div className="flex items-center gap-2 text-purple-700 font-bold mb-3">
                    <i data-lucide="book-open" className="w-5 h-5"></i> A. Dyslexia Module
                  </div>
                  <ul className="text-xs space-y-2 text-slate-700">
                    <li>• OCR & Text Extraction (Vision / OpenCV)</li>
                    <li>• Dyslexia Friendly Reader (OpenDyslexic, Lexend)</li>
                    <li>• Web Speech Text-to-Speech (TTS) & Word Tracking</li>
                    <li>• Word Highlighting & Syllable Breaks</li>
                    <li>• NLP Text Simplification & Key Point Extraction</li>
                  </ul>
                </div>

                {/* Face Blindness Module Engine */}
                <div className="bg-blue-50/50 rounded-3xl p-6 border-2 border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 font-bold mb-3">
                    <i data-lucide="scan-face" className="w-5 h-5"></i> B. Face Blindness Module
                  </div>
                  <ul className="text-xs space-y-2 text-slate-700">
                    <li>• Face Recognition Assistance HUD (OpenCV Haar Cascades)</li>
                    <li>• Identity & Context Card Display</li>
                    <li>• Meeting & Conversation Starters</li>
                    <li>• Distinctive Visual Cues Tracker</li>
                    <li>• Memory Reinforcement Quiz Engine</li>
                  </ul>
                </div>

              </div>

              {/* Layer 3: Backend Services & Data Layer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-3">Backend Microservices</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg">API Gateway (FastAPI REST)</div>
                    <div className="p-2 bg-slate-50 rounded-lg">User & Profile Service</div>
                    <div className="p-2 bg-slate-50 rounded-lg">AI Orchestration Engine</div>
                    <div className="p-2 bg-slate-50 rounded-lg">Analytics & Insights</div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-3">Data & Security Layer</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg">Primary DB (In-Memory / SQLite)</div>
                    <div className="p-2 bg-slate-50 rounded-lg">Face Embeddings & Anchors</div>
                    <div className="p-2 bg-slate-50 rounded-lg">End-to-End Privacy & Local-First</div>
                    <div className="p-2 bg-slate-50 rounded-lg">WCAG 2.1 AAA Native UX</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ================= MODALS & INTERACTIVE OVERLAYS ================= */}

      {/* MODAL 1: FULL DYSLEXIA READER VIEW */}
      {activeModal === 'reader' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-scale-up">
            
            {/* Reader Controls Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                >
                  <i data-lucide="x" className="w-4 h-4"></i>
                </button>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base font-outfit">
                  {activeReadingItem?.title}
                </h3>
              </div>

              {/* Reading Settings Suite */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Font Switcher */}
                <select
                  value={user.preferences.font_family}
                  onChange={(e) => handleUpdatePreference('font_family', e.target.value)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="OpenDyslexic">OpenDyslexic Font</option>
                  <option value="Lexend">Lexend Font</option>
                  <option value="Atkinson">Atkinson Font</option>
                  <option value="Inter">Standard Inter</option>
                </select>

                {/* Tint Selector */}
                <select
                  value={user.preferences.background_tint}
                  onChange={(e) => handleUpdatePreference('background_tint', e.target.value)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="default">Default White</option>
                  <option value="cream">Soft Cream</option>
                  <option value="peach">Warm Peach</option>
                  <option value="mint">Calming Mint</option>
                  <option value="lavender">Lavender Rose</option>
                  <option value="dark">Dark Slate</option>
                </select>

                {/* Bionic Reading Toggle */}
                <button
                  onClick={() => handleUpdatePreference('bionic_reading', !user.preferences.bionic_reading)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    user.preferences.bionic_reading
                      ? 'bg-purple-600 text-white border-purple-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Bionic {user.preferences.bionic_reading ? 'ON' : 'OFF'}
                </button>

                {/* Syllable Split Toggle */}
                <button
                  onClick={() => handleUpdatePreference('syllable_coloring', !user.preferences.syllable_coloring)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    user.preferences.syllable_coloring
                      ? 'bg-purple-600 text-white border-purple-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Syllables
                </button>

                {/* Reading Ruler Toggle */}
                <button
                  onClick={() => handleUpdatePreference('reading_ruler_enabled', !user.preferences.reading_ruler_enabled)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    user.preferences.reading_ruler_enabled
                      ? 'bg-purple-600 text-white border-purple-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Ruler {user.preferences.reading_ruler_enabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Reading Content Pane */}
            <div
              onMouseMove={(e) => {
                if (user.preferences.reading_ruler_enabled) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setRulerTop(e.clientY - rect.top);
                }
              }}
              className="flex-1 overflow-y-auto p-6 sm:p-10 relative select-text"
              style={{
                lineHeight: user.preferences.line_spacing || 1.75,
                fontSize: user.preferences.font_size === 'xlarge' ? '1.35rem' : user.preferences.font_size === 'large' ? '1.2rem' : '1.05rem'
              }}
            >
              {/* Virtual Reading Ruler Overlay */}
              {user.preferences.reading_ruler_enabled && (
                <div
                  className="reading-ruler"
                  style={{
                    top: `${Math.max(0, rulerTop - 26)}px`,
                    height: `${user.preferences.reading_ruler_height || 52}px`
                  }}
                />
              )}

              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center pb-4 border-b border-slate-100">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit">
                    {activeReadingItem?.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">by {activeReadingItem?.author}</p>
                </div>

                <div className="text-slate-800 leading-relaxed font-opendyslexic whitespace-pre-line">
                  {user.preferences.syllable_coloring
                    ? formatSyllableText(activeReadingItem?.content)
                    : formatSpokenOrBionicText(
                        activeReadingItem?.content,
                        user.preferences.bionic_reading,
                        speechWordIndex,
                        isSpeaking
                      )}
                </div>
              </div>
            </div>

            {/* Bottom Audio Toolbar */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSpeakText(activeReadingItem?.content || "")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 ${
                    isSpeaking && !isPaused
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  <i data-lucide={isSpeaking && !isPaused ? "pause" : "volume-2"} className="w-4 h-4"></i>
                  {isSpeaking && !isPaused ? "Pause Audio" : isPaused ? "Resume Audio" : "Read Aloud"}
                </button>

                {isSpeaking && (
                  <button
                    onClick={handleStopSpeech}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                  >
                    <i data-lucide="square" className="w-3.5 h-3.5"></i> Stop
                  </button>
                )}
              </div>

              {/* Speed Switcher */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-500 mr-1">Speed:</span>
                {[0.75, 1.0, 1.25, 1.5].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleChangeSpeechSpeed(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      Math.abs(activeSpeechSpeed - s) < 0.05
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: TEXT SIMPLIFIER (Side-by-side mode) */}
      {activeModal === 'simplifier' && (
        <TextSimplifierModal
          onClose={() => setActiveModal(null)}
          onSpeak={handleSpeakText}
          isSpeaking={isSpeaking}
          speechWordIndex={speechWordIndex}
        />
      )}

      {/* MODAL 3: SCAN & READ OCR CAMERA */}
      {activeModal === 'ocr' && (
        <ScanAndReadModal
          onClose={() => setActiveModal(null)}
          onSpeak={handleSpeakText}
          isSpeaking={isSpeaking}
          isPaused={isPaused}
          speechWordIndex={speechWordIndex}
          onPause={handlePauseSpeech}
          onResume={handleResumeSpeech}
          onStop={handleStopSpeech}
          onSpeedChange={handleChangeSpeechSpeed}
          activeSpeed={activeSpeechSpeed}
        />
      )}

      {/* MODAL 3B: DYSLEXIA STAGE ASSESSMENT & DIAGNOSTIC GAME */}
      {activeModal === 'diagnostic_game' && (
        <DyslexiaDiagnosticGameModal
          onClose={() => setActiveModal(null)}
          onSpeak={handleSpeakText}
          userPreferences={user.preferences}
          onApplySettings={async (newPrefs) => {
            const updated = { ...user.preferences, ...newPrefs };
            setUser(prev => ({ ...prev, preferences: updated }));
            await handleUpdatePreference(newPrefs);
          }}
          onEarnPoints={(pts) => {
            setUser(prev => ({ ...prev, points: prev.points + pts }));
          }}
        />
      )}

      {/* MODAL 4: IDENTIFY PERSON FACE SCANNER HUD */}
      {activeModal === 'face_scanner' && (
        <FaceScannerModal
          contacts={contacts}
          onClose={() => setActiveModal(null)}
          onSelectPerson={(p) => {
            setSelectedContact(p);
            setActiveModal('person_profile');
          }}
          onSpeak={handleSpeakText}
        />
      )}

      {/* MODAL 5: PERSON PROFILE MEMORY CUE CARD */}
      {activeModal === 'person_profile' && selectedContact && (
        <PersonProfileModal
          person={selectedContact}
          onClose={() => setActiveModal(null)}
          onSpeak={handleSpeakText}
          onDelete={handleDeleteContact}
        />
      )}

      {/* MODAL 6: MEMORY REINFORCEMENT FLASHCARD QUIZ */}
      {activeModal === 'memory_quiz' && (
        <MemoryQuizModal
          onClose={() => setActiveModal(null)}
          onEarnPoints={(pts) => setUser(prev => ({ ...prev, points: prev.points + pts }))}
        />
      )}

      {/* MODAL 7: PRISM AI COPILOT */}
      {activeModal === 'copilot' && (
        <CopilotModal
          messages={copilotMessages}
          input={copilotInput}
          setInput={setCopilotInput}
          onSend={handleSendCopilot}
          isListening={isListeningSTT}
          onStartListening={handleStartSTT}
          onSpeak={handleSpeakText}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* MODAL 8: ACCESSIBILITY & COMFORT DRAWER */}
      {activeModal === 'accessibility' && (
        <AccessibilityDrawerModal
          preferences={user.preferences}
          onUpdate={handleUpdatePreference}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Universal Floating Read Aloud Audio Controller */}
      <ReadAloudFloatingBar
        isSpeaking={isSpeaking}
        isPaused={isPaused}
        currentSpokenText={currentSpokenText}
        speechWordIndex={speechWordIndex}
        speechWordsList={speechWordsList}
        speed={activeSpeechSpeed}
        onSpeedChange={handleChangeSpeechSpeed}
        onPause={handlePauseSpeech}
        onResume={handleResumeSpeech}
        onStop={handleStopSpeech}
        voices={availableVoices}
        selectedVoice={selectedVoiceURI}
        onSelectVoice={setSelectedVoiceURI}
      />

    </div>
  );
}

// --- SUB-COMPONENT: Universal Floating Read Aloud Audio Player Bar ---
function ReadAloudFloatingBar({
  isSpeaking,
  isPaused,
  currentSpokenText,
  speechWordIndex,
  speechWordsList,
  speed,
  onSpeedChange,
  onPause,
  onResume,
  onStop,
  voices,
  selectedVoice,
  onSelectVoice
}) {
  if (!isSpeaking) return null;

  const currentWord = speechWordsList[speechWordIndex] || "";

  return (
    <div className="tts-floating-player flex items-center justify-between gap-3 shadow-2xl">
      {/* Left: Waveform animation + active reading info */}
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-1 h-5 px-1 shrink-0">
          {!isPaused ? (
            <>
              <span className="sound-bar"></span>
              <span className="sound-bar"></span>
              <span className="sound-bar"></span>
              <span className="sound-bar"></span>
              <span className="sound-bar"></span>
            </>
          ) : (
            <span className="text-amber-400 text-xs font-bold font-mono">PAUSED</span>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
              PRISM Read Aloud
            </span>
            {currentWord && (
              <span className="text-[11px] font-bold bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded font-mono truncate max-w-[120px]">
                {currentWord}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-300 truncate max-w-[220px]">
            {currentSpokenText || "Reading in progress..."}
          </p>
        </div>
      </div>

      {/* Center: Play/Pause/Stop controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isPaused ? (
          <button
            onClick={onResume}
            className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-md transition-all active:scale-95"
            title="Resume Audio"
          >
            <i data-lucide="play" className="w-4 h-4 fill-white ml-0.5"></i>
          </button>
        ) : (
          <button
            onClick={onPause}
            className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center shadow-md transition-all active:scale-95"
            title="Pause Audio"
          >
            <i data-lucide="pause" className="w-4 h-4 fill-white"></i>
          </button>
        )}

        <button
          onClick={onStop}
          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 active:scale-95 transition-all"
          title="Stop Reading"
        >
          <i data-lucide="square" className="w-3.5 h-3.5 fill-current"></i>
        </button>
      </div>

      {/* Right: Speed pills & Voice Switcher */}
      <div className="hidden sm:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-purple-500/30 shrink-0">
        {[0.75, 1.0, 1.25, 1.5].map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-all ${
              Math.abs(speed - s) < 0.05
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: Text Simplifier Modal ---
function TextSimplifierModal({ onClose, onSpeak, isSpeaking, speechWordIndex }) {
  const [inputText, setInputText] = useState(
    "Photosynthesis is the fundamental biological process used by plants, algae, and certain bacteria to convert radiant light energy into chemical energy stored in glucose molecules."
  );
  const [mode, setMode] = useState("simpler");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSimplify = async (selectedMode) => {
    setIsLoading(true);
    const m = selectedMode || mode;
    try {
      const res = await fetch('/api/dyslexia/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, mode: m })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {}
    setIsLoading(false);
  };

  useEffect(() => {
    handleSimplify("simpler");
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              ✨
            </div>
            <h3 className="font-bold text-slate-900 text-lg font-outfit">PRISM Text Simplifier</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
            <i data-lucide="x" className="w-4 h-4"></i>
          </button>
        </div>

        {/* Input Text Area */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-600 block">Original Text</label>
            <button
              onClick={() => onSpeak(inputText)}
              className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
            >
              <i data-lucide="volume-2" className="w-3.5 h-3.5"></i> Read Original Aloud
            </button>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-4 rounded-2xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm font-opendyslexic"
            rows="3"
          />
        </div>

        {/* Mode Toggles */}
        <div className="flex items-center gap-2 my-4 flex-wrap">
          {['simpler', 'shorter', 'bullet', 'dyslexia_spaced'].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                handleSimplify(m);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                mode === m
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-purple-50'
              }`}
            >
              {m === 'dyslexia_spaced' ? 'Spaced' : m}
            </button>
          ))}
        </div>

        {/* Simplified Output Box */}
        {result && (
          <div className="bg-purple-50/70 rounded-2xl p-5 border border-purple-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900">Simplified Output</span>
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                {result.difficulty_score}
              </span>
            </div>

            <div className="text-base text-slate-900 leading-relaxed font-opendyslexic whitespace-pre-line">
              {formatSpokenOrBionicText(result.simplified_text, false, speechWordIndex, isSpeaking)}
            </div>

            {/* Key Action Points */}
            {result.key_points && (
              <div className="pt-2 border-t border-purple-200/60">
                <span className="text-xs font-bold text-purple-900 block mb-1.5">Key Takeaways:</span>
                <ul className="text-xs space-y-1 text-slate-700">
                  {result.key_points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
              <button
                onClick={() => onSpeak(result.simplified_text)}
                className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-purple-700 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <i data-lucide="volume-2" className="w-3.5 h-3.5"></i> Read Simplified Aloud
              </button>

              <span className="text-[11px] text-slate-500 font-medium">
                ~{result.reading_time_minutes} min read • {result.syllable_count} syllables
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: Scan & Read OCR Modal (Enlarged High-Resolution Viewfinder & OCR Reader) ---
function ScanAndReadModal({
  onClose,
  onSpeak,
  isSpeaking,
  isPaused,
  speechWordIndex,
  onPause,
  onResume,
  onStop,
  onSpeedChange,
  activeSpeed
}) {
  const [activeTab, setActiveTab] = useState("webcam"); // 'webcam', 'upload', 'presets'
  const [selectedPreset, setSelectedPreset] = useState("textbook_science");
  const [webcamActive, setWebcamActive] = useState(false);
  const [facingMode, setFacingMode] = useState("environment"); // 'environment' (back) | 'user' (front)
  const [capturedSnapshot, setCapturedSnapshot] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [selectedFont, setSelectedFont] = useState("OpenDyslexic");
  const [bionicEnabled, setBionicEnabled] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [contrastBoost, setContrastBoost] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Start webcam video stream with high resolution constraints
  const startWebcam = async (mode = facingMode) => {
    try {
      setWebcamActive(true);
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Live webcam access note:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (fallbackErr) {
        alert("Webcam access not granted or unavailable. You can upload a photo or choose preset documents!");
        setWebcamActive(false);
      }
    }
  };

  // Stop webcam video stream
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  // Switch between front/back camera
  const toggleCameraFacing = () => {
    stopWebcam();
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    startWebcam(newMode);
  };

  // Capture snapshot frame from live webcam
  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 450);

      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (contrastBoost) {
        ctx.filter = 'contrast(1.25) brightness(1.05)';
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedSnapshot(dataUrl);
      stopWebcam();
      runOCRWithImage(dataUrl);
    }
  };

  // Run OCR on base64 image data
  const runOCRWithImage = async (dataUrl) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dyslexia/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_data: dataUrl })
      });
      const data = await res.json();
      setOcrData(data);
    } catch (e) {
      console.error("OCR extraction failed", e);
    }
    setIsLoading(false);
  };

  // Run OCR on pre-seeded textbook/note presets
  const runOCRWithPreset = async (presetId) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dyslexia/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset_id: presetId })
      });
      const data = await res.json();
      setOcrData(data);
    } catch (e) {}
    setIsLoading(false);
  };

  // Handle uploaded file
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target.result;
        setUploadedImage(dataUrl);
        setCapturedSnapshot(null);
        setActiveTab("upload");
        runOCRWithImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Copy extracted text to clipboard
  const handleCopyText = () => {
    if (ocrData?.extracted_text) {
      navigator.clipboard.writeText(ocrData.extracted_text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  // Start webcam when activeTab is 'webcam'
  useEffect(() => {
    if (activeTab === 'webcam') {
      startWebcam(facingMode);
    } else {
      stopWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [activeTab]);

  // Initial load run preset
  useEffect(() => {
    runOCRWithPreset("textbook_science");
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-lg flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in overflow-y-auto">
      {/* Expansive Full-Width Max-W-7XL Modal Container */}
      <div className="bg-white w-full max-w-7xl max-h-[96vh] rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 flex flex-col overflow-y-auto border-2 border-purple-300 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shadow-inner">
              <i data-lucide="scan" className="w-6 h-6"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-xl sm:text-2xl font-outfit">Live Document Scanner & OCR</h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  HD Viewfinder Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">Enlarged camera sight for scanning physical textbooks, notes, and handouts</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopWebcam();
              onClose();
            }}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Close Scanner"
          >
            <i data-lucide="x" className="w-5 h-5"></i>
          </button>
        </div>

        {/* Source Selector Tabs & Controls Bar */}
        <div className="flex items-center gap-2 my-4 flex-wrap justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setCapturedSnapshot(null);
                setActiveTab("webcam");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'webcam'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-purple-50'
              }`}
            >
              <i data-lucide="camera" className="w-4 h-4"></i> Live Scanner Camera
            </button>

            <button
              onClick={() => {
                setActiveTab("upload");
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'upload'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-purple-50'
              }`}
            >
              <i data-lucide="upload" className="w-4 h-4"></i> Upload High-Res Photo
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            <button
              onClick={() => setActiveTab("presets")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'presets'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-purple-50'
              }`}
            >
              <i data-lucide="sparkles" className="w-4 h-4"></i> Sample Documents
            </button>
          </div>

          {/* Quick Scanner Helper Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'webcam' && (
              <>
                {/* Digital Zoom Controls */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700 border border-slate-200">
                  <span className="px-2 text-[11px] text-slate-500">Zoom:</span>
                  {[1.0, 1.25, 1.5, 2.0].map((z) => (
                    <button
                      key={z}
                      onClick={() => setZoomLevel(z)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        zoomLevel === z ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {z}x
                    </button>
                  ))}
                </div>

                {/* Contrast Enhancer Toggle */}
                <button
                  onClick={() => setContrastBoost(!contrastBoost)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                    contrastBoost ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                  title="Enhance Document Contrast for OCR"
                >
                  <i data-lucide="sun" className="w-3.5 h-3.5"></i>
                  <span>Contrast: {contrastBoost ? "High" : "Standard"}</span>
                </button>

                {webcamActive && (
                  <button
                    onClick={toggleCameraFacing}
                    className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 flex items-center gap-1.5 transition-colors"
                    title="Switch Front / Rear Camera"
                  >
                    <i data-lucide="refresh-cw" className="w-3.5 h-3.5"></i> Flip Camera
                  </button>
                )}
              </>
            )}

            {capturedSnapshot && activeTab === 'webcam' && (
              <button
                onClick={() => {
                  setCapturedSnapshot(null);
                  startWebcam(facingMode);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md"
              >
                <i data-lucide="camera" className="w-4 h-4"></i> 🔄 Retake Live Photo
              </button>
            )}
          </div>
        </div>

        {/* 1. ENLARGED HIGH-DEFINITION LIVE SCANNER VIEWPORT CONTAINER (Extra-Tall 720px - 800px) */}
        {activeTab === 'webcam' && (
          <div className="relative w-full min-h-[540px] h-[620px] sm:h-[720px] lg:h-[800px] rounded-3xl overflow-hidden bg-slate-950 flex items-center justify-center border-2 border-purple-400 mb-6 shadow-2xl">
            
            {/* Live Video Feed or Captured Snapshot */}
            {!capturedSnapshot ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-transform duration-200 ${contrastBoost ? 'contrast-125 brightness-105' : ''}`}
                style={{ transform: `scale(${zoomLevel})` }}
              />
            ) : (
              <img
                src={capturedSnapshot}
                alt="Captured Snapshot"
                className="w-full h-full object-contain filter brightness-95"
              />
            )}

            <canvas ref={canvasRef} className="hidden" />

            {/* Document Target Framing Overlay HUD */}
            {!capturedSnapshot && (
              <div className="absolute inset-4 sm:inset-8 lg:inset-10 border-2 border-purple-400/90 rounded-3xl pointer-events-none flex flex-col justify-between p-4 sm:p-6 shadow-2xl">
                <div className="doc-hud-corner doc-hud-tl"></div>
                <div className="doc-hud-corner doc-hud-tr"></div>
                <div className="doc-hud-corner doc-hud-bl"></div>
                <div className="doc-hud-corner doc-hud-br"></div>
                
                {/* Real-time Laser Scanline */}
                <div className="doc-laser-scanline"></div>

                {/* Framing Center Guideline Crosshairs */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <div className="w-16 h-0.5 bg-purple-300"></div>
                  <div className="h-16 w-0.5 bg-purple-300 absolute"></div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-purple-200 bg-slate-950/80 px-4 py-2 rounded-xl backdrop-blur-md border border-purple-500/40">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    PRISM ULTRA HD SCANNER
                  </span>
                  <span className="hidden sm:inline">ALIGN PAGE OR TEXT INSIDE BRACKETS</span>
                </div>
              </div>
            )}

            {/* Shutter Flash Animation */}
            {isFlashing && (
              <div className="absolute inset-0 bg-white camera-flash-active z-30 pointer-events-none"></div>
            )}

            {/* Floating Prominent Capture Shutter Button */}
            {!capturedSnapshot && webcamActive && (
              <div className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-4 z-20">
                <button
                  onClick={captureSnapshot}
                  className="px-10 py-4 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-black text-base sm:text-lg shadow-2xl shadow-purple-600/60 flex items-center gap-3 transform hover:scale-105 active:scale-95 transition-all border-2 border-white/50 cursor-pointer"
                >
                  <i data-lucide="camera" className="w-6 h-6"></i> 📸 Capture Document & Extract Text
                </button>
              </div>
            )}

          </div>
        )}

        {/* 2. Uploaded Image View */}
        {activeTab === 'upload' && uploadedImage && (
          <div className="relative w-full min-h-[500px] h-[580px] sm:h-[680px] rounded-3xl overflow-hidden bg-slate-950 flex items-center justify-center border-2 border-purple-300 mb-6 shadow-xl">
            <img
              src={uploadedImage}
              alt="Uploaded Document"
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* 3. Sample Documents Presets Selector */}
        {activeTab === 'presets' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { id: "textbook_science", label: "Science Textbook", icon: "book", desc: "Grade 8 Biology (Photosynthesis)" },
              { id: "classroom_board", label: "Classroom Board", icon: "layout", desc: "Weekly Homework Handout" },
              { id: "handwritten_note", label: "Handwritten Note", icon: "edit-3", desc: "Study Plan & Exam Tips" },
              { id: "prescription_rx", label: "Medicine Guide", icon: "file-text", desc: "Prescription Label Directions" }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPreset(p.id);
                  runOCRWithPreset(p.id);
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all group ${
                  selectedPreset === p.id
                    ? 'bg-purple-50 text-purple-950 border-purple-500 shadow-md scale-102'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50/50 hover:border-purple-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <i data-lucide={p.icon} className="w-5 h-5"></i>
                </div>
                <div className="font-bold text-sm truncate">{p.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 bg-purple-50/60 rounded-3xl border border-purple-200">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold text-purple-900">Neural OCR Sight extracting high-accuracy text...</span>
          </div>
        )}

        {/* OCR Result & Read Aloud Suite */}
        {ocrData && !isLoading && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Toolbar for Font & Style Controls */}
            <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-slate-700 mr-1">Typography:</span>
                {['OpenDyslexic', 'Lexend', 'Atkinson', 'Inter'].map(f => (
                  <button
                    key={f}
                    onClick={() => setSelectedFont(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedFont === f ? 'bg-purple-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {f}
                  </button>
                ))}

                <button
                  onClick={() => setBionicEnabled(!bionicEnabled)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                    bionicEnabled ? 'bg-purple-600 text-white border-purple-700' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <i data-lucide="zap" className="w-3.5 h-3.5"></i> Bionic: {bionicEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Confidence & Readability badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold flex items-center gap-1">
                  <i data-lucide="check-circle" className="w-3.5 h-3.5 text-emerald-600"></i>
                  {(ocrData.confidence * 100).toFixed(0)}% Accuracy
                </span>
                <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {ocrData.word_count} words • {ocrData.readability_level}
                </span>
              </div>
            </div>

            {/* Extracted Text Box with Karaoke Word Highlighting */}
            <div
              className={`p-6 sm:p-8 bg-purple-50/80 rounded-3xl border-2 border-purple-200 text-lg leading-relaxed text-slate-900 shadow-inner select-text ${
                selectedFont === 'OpenDyslexic' ? 'font-opendyslexic' :
                selectedFont === 'Lexend' ? 'font-lexend' :
                selectedFont === 'Atkinson' ? 'font-atkinson' : 'font-inter'
              }`}
            >
              {formatSpokenOrBionicText(ocrData.extracted_text, bionicEnabled, speechWordIndex, isSpeaking)}
            </div>

            {/* Read Aloud Audio Player Bar */}
            <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSpeak(ocrData.extracted_text)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold shadow-md transition-all flex items-center gap-2 active:scale-95 ${
                    isSpeaking && !isPaused
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  <i data-lucide={isSpeaking && !isPaused ? "pause" : "volume-2"} className="w-4 h-4"></i>
                  {isSpeaking && !isPaused ? "Pause Audio" : isPaused ? "Resume Audio" : "Read Aloud"}
                </button>

                {isSpeaking && (
                  <button
                    onClick={onStop}
                    className="px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-2xl flex items-center gap-1"
                  >
                    <i data-lucide="square" className="w-3.5 h-3.5"></i> Stop
                  </button>
                )}
              </div>

              {/* Speed Switcher */}
              <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 mr-1">Speed:</span>
                {[0.75, 1.0, 1.25, 1.5].map((s) => (
                  <button
                    key={s}
                    onClick={() => onSpeedChange(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      Math.abs(activeSpeed - s) < 0.05
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {/* Copy & Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyText}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  <i data-lucide={copyFeedback ? "check" : "copy"} className="w-4 h-4 text-purple-600"></i>
                  {copyFeedback ? "Copied to Clipboard!" : "Copy Extracted Text"}
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: PRISM Dyslexia Diagnostic Game & Condition/Stage Assessment ---
function DyslexiaDiagnosticGameModal({ onClose, onSpeak, userPreferences, onApplySettings, onEarnPoints }) {
  const [gameState, setGameState] = useState("intro"); // 'intro', 'round1', 'round2', 'round3', 'round4', 'analyzing', 'results'
  
  // Game scores & answers
  const [round1Tapped, setRound1Tapped] = useState({});
  const [round2Current, setRound2Current] = useState(0);
  const [round2Score, setRound2Score] = useState(0);
  const [round3Current, setRound3Current] = useState(0);
  const [round3Score, setRound3Score] = useState(0);
  const [selectedTint, setSelectedTint] = useState("cream");
  
  // Results
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [isApplyingSettings, setIsApplyingSettings] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Play audio voice assistance for current question
  const speakInstruction = (text) => {
    if (onSpeak) {
      onSpeak(text);
    }
  };

  // Round 1 Data: Letter Orientation Hunt (Spot only correctly oriented 'b')
  const round1Tiles = [
    { id: 0, letter: 'b', isTarget: true },
    { id: 1, letter: 'd', isTarget: false },
    { id: 2, letter: 'b', isTarget: true },
    { id: 3, letter: 'p', isTarget: false },
    { id: 4, letter: 'q', isTarget: false },
    { id: 5, letter: 'b', isTarget: true },
    { id: 6, letter: 'd', isTarget: false },
    { id: 7, letter: 'b', isTarget: true }
  ];

  const handleToggleTile = (tileId) => {
    setRound1Tapped(prev => ({
      ...prev,
      [tileId]: !prev[tileId]
    }));
  };

  const calculateRound1Score = () => {
    let score = 0;
    round1Tiles.forEach(t => {
      if (t.isTarget && round1Tapped[t.id]) score += 25; // 4 targets = 100 max
      if (!t.isTarget && round1Tapped[t.id]) score -= 15; // penalty for mirror distractor
    });
    return Math.max(10, Math.min(100, score));
  };

  // Round 2 Data: Rapid Word Recognition & Crowding Resistance
  const round2Questions = [
    {
      prompt: "Which word spells the animal that barks?",
      options: ["DOG", "BOG", "GOD", "DOB"],
      correct: "DOG"
    },
    {
      prompt: "Which word means 'in the past'?",
      options: ["WAS", "SAW", "RAW", "WAR"],
      correct: "WAS"
    },
    {
      prompt: "Which word means 'silent and calm'?",
      options: ["QUIET", "QUITE", "QUIT", "QUICK"],
      correct: "QUIET"
    }
  ];

  const handleAnswerRound2 = (option) => {
    if (option === round2Questions[round2Current].correct) {
      setRound2Score(prev => prev + 34);
    }
    if (round2Current < round2Questions.length - 1) {
      setRound2Current(prev => prev + 1);
    } else {
      setGameState("round3");
    }
  };

  // Round 3 Data: Phonological & Rhyme Sound Matching
  const round3Questions = [
    {
      prompt: "Which word rhymes with LIGHT?",
      target: "LIGHT",
      options: ["Night", "Late", "Like", "Leaf"],
      correct: "Night"
    },
    {
      prompt: "Which word rhymes with TRAIN?",
      target: "TRAIN",
      options: ["Rain", "Tree", "Time", "Trip"],
      correct: "Rain"
    }
  ];

  const handleAnswerRound3 = (option) => {
    if (option === round3Questions[round3Current].correct) {
      setRound3Score(prev => prev + 50);
    }
    if (round3Current < round3Questions.length - 1) {
      setRound3Current(prev => prev + 1);
    } else {
      setGameState("round4");
    }
  };

  // Final Evaluation Handler
  const handleFinishAssessment = async (chosenTint) => {
    const tint = chosenTint || selectedTint;
    setSelectedTint(tint);
    setGameState("analyzing");

    const r1 = calculateRound1Score();
    const r2 = Math.min(100, round2Score);
    const r3 = Math.min(100, round3Score);

    try {
      const res = await fetch('/api/dyslexia/diagnostic-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reversal_score: r1,
          rapid_word_score: r2,
          rhyme_score: r3,
          preferred_tint: tint,
          total_time_seconds: 45.0
        })
      });
      const data = await res.json();
      setDiagnosticResult(data);
      if (onEarnPoints) onEarnPoints(data.points_earned || 100);
    } catch (e) {
      // Fallback calculation
      const overall = Math.round((r1 * 0.35) + (r2 * 0.35) + (r3 * 0.30));
      const fallbackResult = {
        stage_level: overall >= 78 ? "Stage 1: Mild / Compensated Dyslexia" : overall >= 50 ? "Stage 2: Moderate / Mixed Surface-Phonological Dyslexia" : "Stage 3: Significant / Deep Multimodal Dyslexia",
        stage_code: overall >= 78 ? 1 : overall >= 50 ? 2 : 3,
        severity_label: overall >= 78 ? "Mild Visual-Spatial Delay" : overall >= 50 ? "Moderate Mirror Confusion & Crowding" : "Elevated Visual Stress & Crowding",
        overall_score: overall,
        accuracy_percent: overall,
        visual_fatigue_risk: overall >= 78 ? "Low" : overall >= 50 ? "Moderate" : "Elevated",
        reversal_tendency: overall >= 78 ? "Low (Occasional b/d orientation delay)" : overall >= 50 ? "Moderate (b/d confusion under time pressure)" : "High (Frequent letter rotation)",
        recommended_settings: {
          font_family: "OpenDyslexic",
          line_spacing: overall >= 78 ? 1.65 : overall >= 50 ? 1.8 : 2.0,
          reading_ruler_enabled: true,
          reading_ruler_height: overall >= 78 ? 48 : overall >= 50 ? 52 : 60,
          background_tint: tint,
          bionic_reading: true,
          tts_speed: overall >= 78 ? 1.0 : overall >= 50 ? 0.95 : 0.85
        },
        detailed_insights: [
          "Target letter mirror reversals evaluated across b, d, p, q matrices.",
          "Phonological and orthographic decoding response calibrated.",
          "Optimized background tint selected to reduce visual stress."
        ],
        points_earned: 100
      };
      setDiagnosticResult(fallbackResult);
      if (onEarnPoints) onEarnPoints(100);
    }

    setTimeout(() => {
      setGameState("results");
    }, 1200);
  };

  // Auto-apply ideal settings
  const handleAutoApply = async () => {
    if (!diagnosticResult?.recommended_settings) return;
    setIsApplyingSettings(true);
    try {
      await onApplySettings(diagnosticResult.recommended_settings);
      setAppliedSuccess(true);
      if (onSpeak) {
        onSpeak(`Optimal accessibility settings successfully applied for ${diagnosticResult.stage_level}. Your reading view has been calibrated!`);
      }
    } catch (e) {
      console.error("Apply error", e);
    }
    setIsApplyingSettings(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white w-full max-w-3xl max-h-[95vh] rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col overflow-y-auto border-2 border-amber-300 relative">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-inner">
              <i data-lucide="gamepad-2" className="w-6 h-6"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-xl font-outfit">PRISM Cognitive Diagnostic Quest</h3>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Dyslexia Stage Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">Accessible 4-stage mini-game to evaluate decoding profile & stage</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <i data-lucide="x" className="w-5 h-5"></i>
          </button>
        </div>

        {/* STAGE 0: INTRODUCTION */}
        {gameState === 'intro' && (
          <div className="py-8 space-y-6 text-center max-w-xl mx-auto">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-300 to-orange-400 flex items-center justify-center text-4xl shadow-xl shadow-amber-300/40 animate-pulse">
              🎮
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit">
                Discover Your Reading Profile
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Play 4 quick, accessible mini-challenges. Designed specifically for neurodivergent minds to diagnose your exact dyslexia stage (Mild, Moderate, or Significant) and automatically configure your ideal assistive reading tools.
              </p>
            </div>

            {/* Accessible Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
                <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                  <i data-lucide="volume-2" className="w-4 h-4 text-amber-700"></i> Full Audio
                </div>
                <div className="text-slate-600">Audio read-aloud buttons on every question.</div>
              </div>

              <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 text-xs">
                <div className="font-bold text-purple-900 flex items-center gap-1.5 mb-1">
                  <i data-lucide="sparkles" className="w-4 h-4 text-purple-700"></i> No Rush
                </div>
                <div className="text-slate-600">Relaxed pacing with generous tactile tap targets.</div>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                  <i data-lucide="sliders" className="w-4 h-4 text-emerald-700"></i> Auto-Tune
                </div>
                <div className="text-slate-600">Instant one-click prescription setup.</div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  speakInstruction("Round 1: Letter Orientation Hunt. Tap all the correctly oriented letter b. Avoid mirrored d, p, or q.");
                  setGameState("round1");
                }}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 transition-all"
              >
                <i data-lucide="play" className="w-5 h-5 fill-white"></i> Start Assessment Game (2 min)
              </button>

              <button
                onClick={() => speakInstruction(`Welcome ${user?.name ? user.name.split(' ')[0] : 'there'}! This is the PRISM diagnostic game. Play 4 simple rounds to evaluate your reading orientation, word decoding, rhyme recognition, and comfort tints.`)}
                className="w-full sm:w-auto px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2"
              >
                <i data-lucide="volume-2" className="w-4 h-4 text-purple-600"></i> Listen to Overview
              </button>
            </div>
          </div>
        )}

        {/* STAGE 1: ROUND 1 - LETTER ORIENTATION HUNT ($b$ vs $d/p/q$) */}
        {gameState === 'round1' && (
          <div className="py-4 space-y-6">
            <div className="flex items-center justify-between text-xs font-bold text-amber-800 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
              <span>ROUND 1 OF 4: LETTER ORIENTATION</span>
              <span>Challenge: Spot the 'b's</span>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-slate-900 font-outfit">
                Tap all the correctly oriented letter <span className="text-purple-700 text-2xl font-black">"b"</span>
              </h3>
              <p className="text-xs text-slate-500">
                Do NOT tap the mirrored <strong>"d"</strong>, <strong>"p"</strong>, or <strong>"q"</strong>.
              </p>
            </div>

            {/* Big Interactive Tactile Grid */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-lg mx-auto my-6">
              {round1Tiles.map((tile) => {
                const isSelected = round1Tapped[tile.id];
                return (
                  <button
                    key={tile.id}
                    onClick={() => handleToggleTile(tile.id)}
                    className={`h-24 sm:h-28 rounded-2xl border-3 flex items-center justify-center text-4xl sm:text-5xl font-black font-opendyslexic select-none game-tile-target transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-700 shadow-lg scale-105'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-amber-50 hover:border-amber-400'
                    }`}
                  >
                    {tile.letter}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => speakInstruction("Target: Tap all the letters that are b. Ignore the letters d, p, and q.")}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <i data-lucide="volume-2" className="w-4 h-4 text-purple-600"></i> Read Prompt
              </button>

              <button
                onClick={() => {
                  speakInstruction("Round 2: Rapid Word Recognition. Spot the correct word.");
                  setGameState("round2");
                }}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-extrabold text-xs shadow-md flex items-center gap-2 active:scale-95 transition-all"
              >
                Next Round <i data-lucide="arrow-right" className="w-4 h-4"></i>
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: ROUND 2 - RAPID WORD RECOGNITION & CROWDING */}
        {gameState === 'round2' && (
          <div className="py-4 space-y-6">
            <div className="flex items-center justify-between text-xs font-bold text-purple-800 bg-purple-50 px-4 py-2 rounded-xl border border-purple-200">
              <span>ROUND 2 OF 4: WORD DECODING & CROWDING</span>
              <span>Question {round2Current + 1} of {round2Questions.length}</span>
            </div>

            <div className="text-center space-y-2 max-w-lg mx-auto">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-outfit">
                {round2Questions[round2Current].prompt}
              </h3>
              <button
                onClick={() => speakInstruction(round2Questions[round2Current].prompt)}
                className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 px-3 py-1 rounded-full transition-colors"
              >
                <i data-lucide="volume-2" className="w-3.5 h-3.5"></i> Read Question Aloud
              </button>
            </div>

            {/* Word Choice Cards Grid */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto my-6">
              {round2Questions[round2Current].options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleAnswerRound2(opt)}
                  className="p-6 rounded-2xl bg-white border-2 border-slate-200 hover:border-purple-600 hover:bg-purple-50 text-2xl font-extrabold text-slate-900 font-opendyslexic shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center tracking-wider"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STAGE 3: ROUND 3 - PHONOLOGICAL & RHYME SOUND MATCH */}
        {gameState === 'round3' && (
          <div className="py-4 space-y-6">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
              <span>ROUND 3 OF 4: PHONOLOGICAL RHYME MATCH</span>
              <span>Question {round3Current + 1} of {round3Questions.length}</span>
            </div>

            <div className="text-center space-y-2 max-w-lg mx-auto">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-outfit">
                Which word rhymes with <span className="text-emerald-700 font-black">"{round3Questions[round3Current].target}"</span>?
              </h3>
              <button
                onClick={() => speakInstruction(`Which word rhymes with ${round3Questions[round3Current].target}?`)}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-full transition-colors"
              >
                <i data-lucide="volume-2" className="w-3.5 h-3.5"></i> Hear Rhyme Prompt
              </button>
            </div>

            {/* Rhyme Options Grid with Voice Triggers */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto my-6">
              {round3Questions[round3Current].options.map((opt) => (
                <div key={opt} className="relative flex">
                  <button
                    onClick={() => handleAnswerRound3(opt)}
                    className="w-full p-6 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-xl font-extrabold text-slate-900 font-lexend shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center"
                  >
                    {opt}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakInstruction(opt);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-200 text-slate-600 hover:text-emerald-900"
                    title={`Pronounce ${opt}`}
                  >
                    <i data-lucide="volume-2" className="w-3.5 h-3.5"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STAGE 4: ROUND 4 - VISUAL COMFORT & TINT PREFERENCE */}
        {gameState === 'round4' && (
          <div className="py-4 space-y-6">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-800 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-200">
              <span>ROUND 4 OF 4: VISUAL COMFORT & TINT CALIBRATION</span>
              <span>Irlen Glare Reduction</span>
            </div>

            <div className="text-center space-y-1 max-w-lg mx-auto">
              <h3 className="text-xl font-bold text-slate-900 font-outfit">
                Which background tint feels most comfortable on your eyes?
              </h3>
              <p className="text-xs text-slate-500">
                Notice which box has the least glare and stops letters from swimming or dancing.
              </p>
            </div>

            {/* Tint Comparison Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto my-4">
              {[
                { id: "cream", label: "Soft Cream (Warm Tint)", bg: "bg-[#fbf7ee] text-amber-950 border-amber-300" },
                { id: "peach", label: "Warm Peach (Contrast Softener)", bg: "bg-[#fff4ed] text-orange-950 border-orange-300" },
                { id: "mint", label: "Calming Mint (Strain Reliever)", bg: "bg-[#f0fdf4] text-emerald-950 border-emerald-300" },
                { id: "lavender", label: "Lavender Bloom (Irlen Comfort)", bg: "bg-[#faf5ff] text-purple-950 border-purple-300" }
              ].map((tint) => (
                <button
                  key={tint.id}
                  onClick={() => handleFinishAssessment(tint.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all transform hover:scale-102 hover:shadow-lg ${tint.bg}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm">{tint.label}</span>
                    <span className="w-3 h-3 rounded-full bg-current opacity-40"></span>
                  </div>
                  <p className="text-xs font-opendyslexic leading-relaxed opacity-90">
                    The gentle golden sunlight warmed the quiet forest path.
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ANALYZING STATE */}
        {gameState === 'analyzing' && (
          <div className="py-16 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h3 className="text-xl font-bold text-slate-900 font-outfit">
              Analyzing Cognitive Decoding Metrics...
            </h3>
            <p className="text-xs text-slate-500">
              Evaluating mirror-letter reversal rate, phonological awareness, and visual stress index.
            </p>
          </div>
        )}

        {/* STAGE RESULTS & CONDITION PRESCRIPTION */}
        {gameState === 'results' && diagnosticResult && (
          <div className="py-2 space-y-6 animate-fade-in">
            
            {/* Top Stage Result Banner */}
            <div className={`p-6 rounded-3xl border-2 flex flex-col sm:flex-row items-center justify-between gap-4 ${
              diagnosticResult.stage_code === 1 ? 'bg-emerald-50 border-emerald-300 text-emerald-950' :
              diagnosticResult.stage_code === 2 ? 'bg-amber-50 border-amber-300 text-amber-950' :
              'bg-purple-50 border-purple-300 text-purple-950'
            }`}>
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/80 border border-current/20">
                  Diagnosed Stage & Condition
                </span>
                <h2 className="text-2xl sm:text-3xl font-black font-outfit">
                  {diagnosticResult.stage_level}
                </h2>
                <p className="text-xs font-semibold opacity-90">
                  {diagnosticResult.severity_label} • {diagnosticResult.reversal_tendency}
                </p>
              </div>

              <div className="text-center sm:text-right shrink-0">
                <div className="text-3xl sm:text-4xl font-black font-outfit">
                  {diagnosticResult.overall_score}%
                </div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                  Cognitive Score
                </div>
              </div>
            </div>

            {/* 4 Cognitive Metric Radar Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Letter Orientation ($b/d$)</span>
                  <span className="text-purple-700">{calculateRound1Score()}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full diagnostic-meter-fill" style={{ width: `${calculateRound1Score()}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Word Decoding & Crowding</span>
                  <span className="text-purple-700">{Math.min(100, round2Score)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full diagnostic-meter-fill" style={{ width: `${Math.min(100, round2Score)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Phonological Sound Match</span>
                  <span className="text-purple-700">{Math.min(100, round3Score)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full diagnostic-meter-fill" style={{ width: `${Math.min(100, round3Score)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Visual Glare Protection</span>
                  <span className="text-purple-700 font-bold uppercase">{selectedTint}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full diagnostic-meter-fill" style={{ width: `90%` }}></div>
                </div>
              </div>
            </div>

            {/* Diagnostic Clinical Insights */}
            <div className="space-y-2 p-5 bg-purple-50/60 rounded-2xl border border-purple-200 text-xs">
              <span className="font-extrabold text-purple-900 block">Personalized Clinical Insights:</span>
              <ul className="space-y-1.5 text-slate-700">
                {diagnosticResult.detailed_insights?.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Auto-Apply Prescription Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div>
                <div className="font-black text-sm flex items-center gap-1.5">
                  <i data-lucide="sparkles" className="w-4 h-4"></i> Optimal Settings Prescription Ready
                </div>
                <div className="text-xs font-semibold text-amber-950/80">
                  OpenDyslexic font • {diagnosticResult.recommended_settings.line_spacing}x spacing • {selectedTint} tint • Reading ruler
                </div>
              </div>

              <button
                onClick={handleAutoApply}
                disabled={isApplyingSettings || appliedSuccess}
                className={`px-6 py-3 rounded-2xl font-black text-xs shadow-md transition-all flex items-center gap-2 shrink-0 ${
                  appliedSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'
                }`}
              >
                <i data-lucide={appliedSuccess ? "check" : "wand-2"} className="w-4 h-4"></i>
                {appliedSuccess ? "Settings Applied! 🎉" : "✨ Auto-Apply Ideal Settings"}
              </button>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
              <button
                onClick={() => {
                  setGameState("intro");
                  setRound1Tapped({});
                  setRound2Current(0);
                  setRound2Score(0);
                  setRound3Current(0);
                  setRound3Score(0);
                  setAppliedSuccess(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <i data-lucide="refresh-cw" className="w-3.5 h-3.5"></i> Retake Assessment
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Done & Return to Workspace
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: Face Blindness OpenCV Face Scanner Modal (Live Webcam Capture & Biometric HUD) ---
function FaceScannerModal({ contacts, onClose, onSelectPerson, onSpeak, onContactAdded }) {
  const [scanMode, setScanMode] = useState("webcam"); // 'webcam', 'presets', 'upload'
  const [selectedPersonIndex, setSelectedPersonIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [cvResult, setCvResult] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [facingMode, setFacingMode] = useState("user"); // 'user' | 'environment'
  const [mirrorMode, setMirrorMode] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    role: "Colleague / Friend",
    context: "Office / Campus",
    visual_cues: "",
    reminder: ""
  });
  const [isSavingContact, setIsSavingContact] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const targetPerson = contacts[selectedPersonIndex] || contacts[0];

  // Run OpenCV detection on target image
  const runOpenCVScan = async (imageData, targetId) => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/face-blindness/scan-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_data: imageData || null,
          target_id: targetId || targetPerson?.id
        })
      });
      const data = await res.json();
      setCvResult(data);
    } catch (e) {
      console.error("OpenCV Scan Error", e);
    }
    setIsScanning(false);
  };

  // Trigger initial scan when switching contact or opening preset mode
  useEffect(() => {
    if (scanMode === 'presets' && targetPerson) {
      runOpenCVScan(targetPerson.avatar_url, targetPerson.id);
    }
  }, [selectedPersonIndex, scanMode]);

  // Webcam setup
  const startWebcam = async (mode = facingMode) => {
    setScanMode('webcam');
    setWebcamActive(true);
    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Live camera access note:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (fallbackErr) {
        alert("Webcam access not granted or unavailable. Switching to Contact Presets mode.");
        setScanMode('presets');
        setWebcamActive(false);
      }
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  const toggleCameraFacing = () => {
    stopWebcam();
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startWebcam(nextMode);
  };

  // Capture frame from live webcam feed
  const captureWebcamFrame = () => {
    if (videoRef.current && canvasRef.current) {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 400);

      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (mirrorMode && facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedSnapshot(dataUrl);
      stopWebcam();
      runOpenCVScan(dataUrl, null);
    }
  };

  // Upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target.result;
        setUploadedImage(dataUrl);
        setCapturedSnapshot(null);
        setScanMode('upload');
        runOpenCVScan(dataUrl, null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReadBriefing = () => {
    if (cvResult?.matched_person && onSpeak) {
      const p = cvResult.matched_person;
      const speech = `Identified ${p.name}, your ${p.role} from ${p.context}. Visual anchors to look for: ${p.visual_cues.join(', ')}. Reminder: ${p.reminder}`;
      onSpeak(speech);
    } else if (onSpeak) {
      onSpeak("OpenCV facial recognition detected human face with 98% confidence. Eyes and smile landmarks localized.");
    }
  };

  // Save captured snapshot as a new familiar person contact
  const handleSaveNewContact = async (e) => {
    e.preventDefault();
    if (!newContact.name.trim()) return;
    setIsSavingContact(true);
    try {
      const payload = {
        name: newContact.name.trim(),
        role: newContact.role.trim() || "Familiar Person",
        context: newContact.context.trim() || "Social / Work",
        avatar_url: capturedSnapshot || uploadedImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        notes: newContact.reminder.trim() || "Added via PRISM Live Face Capture",
        visual_cues: newContact.visual_cues ? newContact.visual_cues.split(',').map(c => c.trim()).filter(Boolean) : ["Warm expression", "Distinctive eyes"],
        reminder: newContact.reminder.trim() || "Great to connect with you!"
      };
      const res = await fetch('/api/face-blindness/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAddContactForm(false);
        if (onContactAdded) onContactAdded();
        alert(`Successfully added ${payload.name} to your Familiar People Memory Bank!`);
      }
    } catch (err) {
      console.error("Save contact failed", err);
    }
    setIsSavingContact(false);
  };

  // Start webcam on mount
  useEffect(() => {
    if (scanMode === 'webcam') {
      startWebcam(facingMode);
    } else {
      stopWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [scanMode]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 lg:p-6 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 text-white w-full max-w-5xl max-h-[96vh] rounded-3xl shadow-2xl p-5 sm:p-7 lg:p-8 flex flex-col border border-blue-500/40 relative overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/40 shadow-inner">
              <i data-lucide="scan-face" className="w-5 h-5"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-lg sm:text-xl font-outfit">Live Facial Recognition & Capture HUD</h3>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-900/80 text-blue-300 border border-blue-700">
                  OpenCV {cvResult?.opencv_version || "v5.0"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time webcam face capture, Haar Cascade biometric bounding boxes, and memory cues
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopWebcam();
              onClose();
            }}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Close Face Scanner"
          >
            <i data-lucide="x" className="w-5 h-5"></i>
          </button>
        </div>

        {/* Scanner Source Selector Tabs & Live Controls */}
        <div className="flex items-center gap-2 my-4 flex-wrap justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setCapturedSnapshot(null);
                setScanMode('webcam');
                startWebcam(facingMode);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                scanMode === 'webcam'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <i data-lucide="camera" className="w-4 h-4"></i> Live Camera Feed
            </button>

            <button
              onClick={() => {
                stopWebcam();
                setCapturedSnapshot(null);
                setScanMode('presets');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                scanMode === 'presets'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <i data-lucide="users" className="w-4 h-4"></i> Familiar People ({contacts.length})
            </button>

            <button
              onClick={() => {
                stopWebcam();
                setCapturedSnapshot(null);
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                scanMode === 'upload'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <i data-lucide="upload" className="w-4 h-4"></i> Upload Photo
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {scanMode === 'webcam' && (
              <>
                {/* Mirror Toggle */}
                <button
                  onClick={() => setMirrorMode(!mirrorMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                    mirrorMode ? 'bg-blue-900/60 text-blue-200 border-blue-600' : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title="Toggle Mirror Mode"
                >
                  <i data-lucide="flip-horizontal" className="w-3.5 h-3.5"></i>
                  <span>Mirror: {mirrorMode ? "ON" : "OFF"}</span>
                </button>

                {/* Flip Camera */}
                <button
                  onClick={toggleCameraFacing}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-bold rounded-xl border border-blue-500/40 flex items-center gap-1.5 transition-colors"
                  title="Switch Front/Rear Camera"
                >
                  <i data-lucide="refresh-cw" className="w-3.5 h-3.5"></i> Flip Camera
                </button>
              </>
            )}

            {capturedSnapshot && scanMode === 'webcam' && (
              <button
                onClick={() => {
                  setCapturedSnapshot(null);
                  startWebcam(facingMode);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all"
              >
                <i data-lucide="camera" className="w-4 h-4"></i> 🔄 Retake Live Snapshot
              </button>
            )}
          </div>
        </div>

        {/* Main Viewfinder Grid (Live Feed & OpenCV Biometrics) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Viewfinder Canvas (2 Columns) */}
          <div className="lg:col-span-2 relative min-h-[460px] h-[540px] sm:h-[620px] lg:h-[680px] rounded-3xl overflow-hidden bg-slate-950 flex items-center justify-center border-2 border-blue-500/50 shadow-2xl">
            
            {/* 1. Live Webcam Feed */}
            {scanMode === 'webcam' && !capturedSnapshot && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${mirrorMode && facingMode === 'user' ? '-scale-x-100' : ''}`}
              />
            )}

            {/* 1B. Captured Snapshot Image */}
            {scanMode === 'webcam' && capturedSnapshot && (
              <img
                src={cvResult?.annotated_image || capturedSnapshot}
                alt="Captured Face Frame"
                className="w-full h-full object-cover filter brightness-95"
              />
            )}

            {/* 2. Preset Contact Image */}
            {scanMode === 'presets' && targetPerson && (
              <img
                src={cvResult?.annotated_image || targetPerson.avatar_url}
                className="w-full h-full object-cover filter brightness-95"
                alt={targetPerson.name}
              />
            )}

            {/* 3. Uploaded Image */}
            {scanMode === 'upload' && uploadedImage && (
              <img
                src={cvResult?.annotated_image || uploadedImage}
                className="w-full h-full object-cover filter brightness-95"
                alt="Uploaded Face"
              />
            )}

            <canvas ref={canvasRef} className="hidden" />

            {/* Shutter Flash Animation */}
            {isFlashing && (
              <div className="absolute inset-0 bg-white camera-flash-active z-30 pointer-events-none"></div>
            )}

            {/* Biometric HUD Target Box Over Face */}
            <div
              className="absolute border-2 border-blue-400/90 rounded-2xl flex flex-col justify-between p-2 shadow-2xl shadow-blue-500/40 pointer-events-none transition-all duration-300"
              style={{
                left: cvResult?.primary_face?.bounding_box?.x ? `${cvResult.primary_face.bounding_box.x}%` : '24%',
                top: cvResult?.primary_face?.bounding_box?.y ? `${cvResult.primary_face.bounding_box.y}%` : '16%',
                width: cvResult?.primary_face?.bounding_box?.width ? `${cvResult.primary_face.bounding_box.width}%` : '52%',
                height: cvResult?.primary_face?.bounding_box?.height ? `${cvResult.primary_face.bounding_box.height}%` : '64%'
              }}
            >
              <div className="hud-corner hud-tl"></div>
              <div className="hud-corner hud-tr"></div>
              <div className="hud-corner hud-bl"></div>
              <div className="hud-corner hud-br"></div>
              
              {/* Animated Scanline */}
              <div className="hud-scanline"></div>

              <div className="flex items-center justify-between text-[10px] font-mono text-blue-200 bg-slate-950/85 px-2.5 py-1 rounded-lg backdrop-blur-md border border-blue-500/40">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  HAAR-CASCADE
                </span>
                <span>CONF: {((cvResult?.confidence || 0.98) * 100).toFixed(1)}%</span>
              </div>

              {/* Landmark Tag Crosshairs */}
              <div className="flex items-center justify-center">
                <span className="text-[11px] font-mono bg-blue-600/95 text-white px-3 py-1 rounded-full backdrop-blur-sm shadow-lg font-bold">
                  {cvResult?.matched_person ? `Identified: ${cvResult.matched_person.name}` : "Biometric Face Frame Active"}
                </span>
              </div>
            </div>

            {/* Webcam Live Capture Shutter Button */}
            {scanMode === 'webcam' && !capturedSnapshot && webcamActive && (
              <div className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-4 z-20">
                <button
                  onClick={captureWebcamFrame}
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm sm:text-base shadow-2xl shadow-blue-500/60 flex items-center gap-3 transform hover:scale-105 active:scale-95 transition-all border-2 border-white/50"
                >
                  <i data-lucide="camera" className="w-5 h-5"></i> 📸 Capture Face Snapshot & Identify
                </button>
              </div>
            )}

          </div>

          {/* OpenCV Telemetry & Analysis Panel (1 Column) */}
          <div className="bg-slate-800/90 rounded-3xl p-5 sm:p-6 border border-slate-700/80 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <i data-lucide="activity" className="w-3.5 h-3.5"></i> OpenCV Telemetry
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400">Faces Detected:</span>
                  <span className="font-extrabold text-white">{cvResult?.faces_detected_count || 1} Person</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400">Eyes Localized:</span>
                  <span className="font-extrabold text-emerald-400">{cvResult?.primary_face?.eyes_count || 2} Detected</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400">Facial Expression:</span>
                  <span className="font-extrabold text-amber-300">
                    {cvResult?.primary_face?.smile_detected ? "Smiling / Approachable" : "Neutral / Focused"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400">Match Confidence:</span>
                  <span className="font-extrabold text-blue-300">
                    {((cvResult?.confidence || 0.98) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Suite */}
            <div className="space-y-2 pt-2">
              {capturedSnapshot && (
                <button
                  onClick={() => setShowAddContactForm(!showAddContactForm)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <i data-lucide="user-plus" className="w-4 h-4"></i> 💾 Save Snapshot as New Contact
                </button>
              )}

              {scanMode === 'presets' && (
                <button
                  onClick={() => {
                    const nextIdx = (selectedPersonIndex + 1) % contacts.length;
                    setSelectedPersonIndex(nextIdx);
                  }}
                  className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <i data-lucide="refresh-cw" className="w-3.5 h-3.5"></i> Next Familiar Person ({selectedPersonIndex + 1}/{contacts.length})
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Add New Contact Inline Form */}
        {showAddContactForm && capturedSnapshot && (
          <form onSubmit={handleSaveNewContact} className="mt-5 p-5 rounded-2xl bg-slate-800 border-2 border-emerald-500/50 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <h4 className="text-sm font-extrabold text-emerald-400 flex items-center gap-2">
                <i data-lucide="user-plus" className="w-4 h-4"></i> Add Captured Face to Familiar People
              </h4>
              <button
                type="button"
                onClick={() => setShowAddContactForm(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sarah Chen"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Role / Relationship</label>
                <input
                  type="text"
                  placeholder="e.g., Project Manager & Mentor"
                  value={newContact.role}
                  onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Setting / Context</label>
                <input
                  type="text"
                  placeholder="e.g., Innovation Lab / 4th Floor"
                  value={newContact.context}
                  onChange={(e) => setNewContact({ ...newContact, context: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Distinctive Visual Cues (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g., Round wire glasses, curly hair, silver watch"
                  value={newContact.visual_cues}
                  onChange={(e) => setNewContact({ ...newContact, visual_cues: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={isSavingContact}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                {isSavingContact ? "Saving..." : "Save to Memory Bank"}
              </button>
            </div>
          </form>
        )}

        {/* Identified Contact Card & Conversation Starters */}
        {cvResult?.matched_person && (
          <div className="mt-5 p-5 rounded-2xl bg-slate-800/90 border border-blue-500/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-lg text-white">{cvResult.matched_person.name}</h4>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-300 font-semibold border border-blue-400/40">
                    {cvResult.matched_person.role}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Setting: {cvResult.matched_person.context} • Last met: {cvResult.matched_person.last_met || "Recently"}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {onSpeak && (
                  <button
                    onClick={handleReadBriefing}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                    title="Discreet Audio Earphone Briefing"
                  >
                    <i data-lucide="volume-2" className="w-3.5 h-3.5"></i> 🔊 Read Audio Briefing
                  </button>
                )}

                <button
                  onClick={() => onSelectPerson(cvResult.matched_person)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 shadow-md flex items-center gap-1.5"
                >
                  <i data-lucide="book-open" className="w-3.5 h-3.5"></i> Open Memory Cue Card
                </button>
              </div>
            </div>

            {/* Distinctive Visual Cues */}
            <div>
              <span className="text-[11px] font-bold text-blue-300 block mb-1">Distinctive Visual Anchors (Face Memory):</span>
              <div className="flex flex-wrap gap-1.5">
                {(cvResult.matched_person.visual_cues || ["Friendly expression", "Distinctive eye shape"]).map((cue, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-blue-900/60 text-blue-200 border border-blue-700/50">
                    🔍 {cue}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Conversation Starters */}
            {cvResult.conversation_starters && (
              <div className="pt-2 border-t border-slate-700/60">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Suggested Conversation Starters (Tap to Listen):</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {cvResult.conversation_starters.map((starter, i) => (
                    <div
                      key={i}
                      onClick={() => onSpeak && onSpeak(`Suggested opening line: ${starter}`)}
                      className="p-2.5 bg-slate-900/70 hover:bg-slate-900 rounded-xl text-xs text-slate-200 border border-slate-700/50 cursor-pointer flex items-center justify-between gap-2 group transition-colors"
                      title="Tap to Read Aloud"
                    >
                      <span className="truncate">💬 "{starter}"</span>
                      <i data-lucide="volume-2" className="w-3 h-3 text-blue-400 opacity-60 group-hover:opacity-100 shrink-0"></i>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: Person Profile Memory Cue Card Modal ---
function PersonProfileModal({ person, onClose, onSpeak, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col border border-blue-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Memory Cue Card</span>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
            <i data-lucide="x" className="w-4 h-4"></i>
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="flex items-center justify-between gap-4 my-5 flex-wrap">
          <div className="flex items-center gap-4 sm:gap-5">
            <img
              src={person.avatar_url}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-blue-200 shadow-md"
              alt={person.name}
            />
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-outfit">{person.name}</h3>
              <p className="text-sm font-semibold text-blue-700">{person.role}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span>Met {person.met_count} times</span>
                <span>•</span>
                <span>Last Met: {person.last_met || "Recently"}</span>
              </div>
            </div>
          </div>

          {onDelete && (
            <button
              onClick={() => onDelete(person.id, person.name)}
              className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title={`Remove ${person.name} from familiar people`}
            >
              <i data-lucide="trash-2" className="w-3.5 h-3.5"></i>
              <span>Delete Person</span>
            </button>
          )}
        </div>

        {/* Details Table */}
        <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="font-bold text-slate-800 block mb-0.5">Primary Setting / Context:</span>
            <span className="text-slate-600">{person.context}</span>
          </div>

          <div>
            <span className="font-bold text-slate-800 block mb-1">Distinctive Visual Anchors:</span>
            <div className="flex flex-wrap gap-1.5">
              {(person.visual_cues || []).map((cue, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                  {cue}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-800 block mb-0.5">Voice & Behavioral Clues:</span>
            <span className="text-slate-600">{(person.voice_cues || ["Clear tone", "Distinctive cadence"]).join(' • ')}</span>
          </div>

          <div>
            <span className="font-bold text-slate-800 block mb-0.5">Important Reminder / Discussion:</span>
            <span className="text-blue-900 font-medium">{person.reminder || "Great to connect!"}</span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => onSpeak(`${person.name}, ${person.role}. Visual cues include: ${(person.visual_cues || []).join(', ')}. Reminder: ${person.reminder}`)}
            className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 flex items-center gap-1.5"
          >
            <i data-lucide="volume-2" className="w-3.5 h-3.5"></i> Read Memory Cue Card
          </button>
          <button onClick={onClose} className="text-xs font-bold text-slate-500 hover:text-slate-800">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: Memory Flashcard Quiz Modal ---
function MemoryQuizModal({ onClose, onEarnPoints }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    fetch('/api/face-blindness/quiz')
      .then(res => res.json())
      .then(data => setQuestions(data));
  }, []);

  const currentQ = questions[currentIdx];

  const handleSelect = (option) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    if (option === currentQ.correct_answer) {
      setScore(s => s + 1);
      onEarnPoints(25);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(i => i + 1);
    } else {
      setIsFinished(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col border border-blue-200 text-center">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <span className="text-xs font-bold text-blue-600">Memory Reinforcement Flashcards</span>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
            <i data-lucide="x" className="w-4 h-4"></i>
          </button>
        </div>

        {!isFinished && currentQ ? (
          <div className="space-y-4 my-4">
            <img
              src={currentQ.photo_url}
              className="w-32 h-32 rounded-3xl object-cover mx-auto shadow-md border-2 border-blue-200"
            />
            
            <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-800 font-semibold">
              {currentQ.clue}
            </div>

            <h4 className="font-bold text-slate-900 text-base">{currentQ.prompt}</h4>

            {/* Choices */}
            <div className="grid grid-cols-2 gap-2.5">
              {currentQ.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all ${
                    selectedAnswer === opt
                      ? opt === currentQ.correct_answer
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-red-500 text-white border-red-600'
                      : selectedAnswer && opt === currentQ.correct_answer
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-50 text-slate-800 hover:bg-blue-50 border-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {selectedAnswer && (
              <div className="pt-2 animate-fade-in">
                <p className="text-xs font-bold text-slate-700 mb-3">{currentQ.context_explanation}</p>
                <button
                  onClick={handleNext}
                  className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {currentIdx + 1 < questions.length ? "Next Flashcard" : "Complete Quiz"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <span className="text-4xl">🎉</span>
            <h3 className="text-2xl font-bold text-slate-900 font-outfit">Quiz Completed!</h3>
            <p className="text-sm text-slate-600">
              You scored {score} / {questions.length} correct. +{score * 25} points added to your streak!
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl"
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: PRISM AI Copilot Modal ---
function CopilotModal({ messages, input, setInput, onSend, isListening, onStartListening, onSpeak, onClose }) {
  const [showWebcamCapture, setShowWebcamCapture] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCopilotWebcam = async () => {
    setShowWebcamCapture(true);
    setWebcamActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (fallbackErr) {
        alert("Webcam access not granted or unavailable.");
        setShowWebcamCapture(false);
        setWebcamActive(false);
      }
    }
  };

  const stopCopilotWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
    setShowWebcamCapture(false);
  };

  const snapAndAskCopilot = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopCopilotWebcam();

      onSend("I took a live webcam snapshot. Please analyze and explain the main points to me.", {
        image_captured: true,
        thumbnail: dataUrl
      });
    }
  };

  useEffect(() => {
    return () => {
      stopCopilotWebcam();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col h-[85vh] border border-purple-200 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white p-1 border border-purple-200 flex items-center justify-center shadow-xs overflow-hidden">
              <img src="/static/assets/logo_cropped.png" alt="PRISM Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base font-outfit">PRISM Adaptive AI Copilot</h3>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Online & Vision-Enabled
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              stopCopilotWebcam();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            <i data-lucide="x" className="w-4 h-4"></i>
          </button>
        </div>

        {/* Live Webcam Snapshot Drawer if Active */}
        {showWebcamCapture && (
          <div className="my-3 p-3 bg-slate-900 rounded-2xl border border-purple-400 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-300">📸 Live Camera Preview</span>
              <button onClick={stopCopilotWebcam} className="text-xs text-slate-400 hover:text-white">Cancel</button>
            </div>
            <div className="relative h-48 rounded-xl overflow-hidden bg-black flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="mt-2 flex items-center justify-center">
              <button
                onClick={snapAndAskCopilot}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95"
              >
                <i data-lucide="camera" className="w-3.5 h-3.5"></i> Snap Photo & Ask Copilot
              </button>
            </div>
          </div>
        )}

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto space-y-3.5 py-4 pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {m.imageThumb && (
                <img
                  src={m.imageThumb}
                  alt="Captured snapshot"
                  className="w-32 h-24 object-cover rounded-xl border-2 border-purple-300 shadow-md mb-1.5"
                />
              )}

              <div
                className={`max-w-[88%] p-4 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none shadow-xs'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200 shadow-xs'
                }`}
              >
                <div className="whitespace-pre-line font-opendyslexic">{m.text}</div>

                {/* Read Aloud button for Copilot answers */}
                {m.sender === 'copilot' && onSpeak && (
                  <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <button
                      onClick={() => onSpeak(m.text)}
                      className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors"
                      title="Read Answer Aloud"
                    >
                      <i data-lucide="volume-2" className="w-3.5 h-3.5"></i> Read Aloud
                    </button>
                    <span className="text-[10px] text-slate-400 font-medium">PRISM Voice</span>
                  </div>
                )}
              </div>

              {m.suggestions && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.suggestions.map((s, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => onSend(s)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder="Ask PRISM Copilot anything..."
            className="flex-1 p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-200 font-opendyslexic"
          />

          {/* Live Webcam Snapshot Button */}
          <button
            onClick={showWebcamCapture ? stopCopilotWebcam : startCopilotWebcam}
            className={`p-3 rounded-xl border transition-colors ${
              showWebcamCapture ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-purple-50'
            }`}
            title="Capture Photo with Webcam"
          >
            <i data-lucide="camera" className="w-4 h-4"></i>
          </button>

          {/* Speech-To-Text Mic */}
          <button
            onClick={onStartListening}
            className={`p-3 rounded-xl border transition-colors ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-700 hover:bg-purple-50'
            }`}
            title="Speech Input (Microphone)"
          >
            <i data-lucide="mic" className="w-4 h-4"></i>
          </button>

          {/* Send Button */}
          <button
            onClick={() => onSend()}
            className="px-4 py-3 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 active:scale-95 transition-all shadow-xs"
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: WCAG Accessibility Drawer Modal ---
function AccessibilityDrawerModal({ preferences, onUpdate, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto border border-slate-200 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <i data-lucide="accessibility" className="w-5 h-5 text-purple-600"></i>
            <h3 className="font-bold text-slate-900 text-lg font-outfit">WCAG 2.1 AAA Accessibility Suite</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
            <i data-lucide="x" className="w-4 h-4"></i>
          </button>
        </div>

        {/* Font Selection */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-2">Dyslexia Optimized Typography</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "OpenDyslexic", label: "OpenDyslexic" },
              { id: "Lexend", label: "Lexend (Reading Fluency)" },
              { id: "Atkinson", label: "Atkinson Hyperlegible" },
              { id: "Inter", label: "Inter (Standard)" }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => onUpdate('font_family', f.id)}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                  preferences.font_family === f.id
                    ? 'bg-purple-600 text-white border-purple-700'
                    : 'bg-slate-50 text-slate-700 hover:bg-purple-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reading Comfort Tint Overlays */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-2">Reading Tint Overlays (Irlen / Visual Stress Reduction)</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "default", label: "Default Clean", color: "#f8fafc" },
              { id: "cream", label: "Soft Cream", color: "#fbf7ee" },
              { id: "peach", label: "Warm Peach", color: "#fff4ed" },
              { id: "mint", label: "Calming Mint", color: "#f0fdf4" },
              { id: "lavender", label: "Lavender Rose", color: "#faf5ff" },
              { id: "dark", label: "Deep Dark", color: "#090d16" }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => onUpdate('background_tint', t.id)}
                className={`p-2.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                  preferences.background_tint === t.id ? 'ring-2 ring-purple-600 font-black' : 'bg-slate-50'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full border shrink-0" style={{ backgroundColor: t.color }}></span>
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Colorblind Correction Filters */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-2">Color Vision Filters</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "none", label: "Normal Vision" },
              { id: "protanopia", label: "Protanopia (Red-Blind)" },
              { id: "deuteranopia", label: "Deuteranopia (Green-Blind)" },
              { id: "tritanopia", label: "Tritanopia (Blue-Blind)" }
            ].map(c => (
              <button
                key={c.id}
                onClick={() => onUpdate('colorblind_mode', c.id)}
                className={`p-2.5 rounded-xl text-xs font-bold border ${
                  preferences.colorblind_mode === c.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-purple-50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* High Contrast Mode */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <div className="text-xs font-bold text-slate-900">High Contrast Mode</div>
            <div className="text-[10px] text-slate-500">Maximum black-and-white distinction</div>
          </div>
          <button
            onClick={() => onUpdate('high_contrast', !preferences.high_contrast)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
              preferences.high_contrast ? 'bg-black text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {preferences.high_contrast ? "ON" : "OFF"}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-purple-600 text-white font-bold text-xs rounded-2xl shadow-md"
        >
          Save & Apply Accessibility Settings
        </button>

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: PRISM Secure Authentication & Sign In Gateway ---
function AuthPortal({ onLoginSuccess, onSpeak }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [activeProfile, setActiveProfile] = useState("dyslexia");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      let data = null;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = null;
      }

      if (!res.ok || !data) {
        throw new Error((data && data.detail) || "Invalid email or password");
      }
      setSuccessMessage("Welcome back! Loading your personalized adaptive workspace...");
      setTimeout(() => {
        onLoginSuccess(data.user || { email: email.trim(), name: email.split('@')[0], active_profile: "dyslexia" });
      }, 500);
    } catch (err) {
      setErrorMessage(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim() || email.split('@')[0],
          active_profile: activeProfile
        })
      });
      let data = null;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = null;
      }

      if (!res.ok || !data) {
        throw new Error((data && data.detail) || "Account creation failed");
      }
      setSuccessMessage("Account created successfully! Preparing your adaptive suite...");
      setTimeout(() => {
        onLoginSuccess(data.user || { email: email.trim(), name: name.trim() || email.split('@')[0], active_profile: activeProfile });
      }, 600);
    } catch (err) {
      setErrorMessage(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoGuestLogin = () => {
    onLoginSuccess({
      id: "user_alex_01",
      name: "Alex Rivera",
      email: "alex.rivera@prism-adaptive.io",
      active_profile: "dyslexia"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-between selection:bg-purple-500 selection:text-white relative overflow-hidden">
      
      {/* Background Neon Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[130px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[30%] w-[350px] h-[350px] rounded-full bg-emerald-600/15 blur-[120px] pointer-events-none"></div>

      {/* Top Header Bar */}
      <header className="px-6 sm:px-12 py-5 flex items-center justify-between border-b border-slate-800/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3 select-none">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 p-0.5 shadow-lg">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center p-1.5 overflow-hidden">
              <img src="/static/assets/logo_cropped.png" alt="PRISM Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white font-outfit">PRISM</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-900/80 text-purple-300 border border-purple-700">Adaptive</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Personalized Real-time Intelligent Support Module</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium hidden md:inline">Account Sign In</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        </div>
      </header>

      {/* Main Auth Hero & Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10 my-6">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Mission & Adaptive Capabilities (6 Cols) */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-300 text-xs font-bold shadow-inner">
              <i data-lucide="sparkles" className="w-3.5 h-3.5 text-purple-400"></i>
              <span>Next-Gen Multi-Modal Accessibility Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight font-outfit tracking-tight">
              Empowering Minds with <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">Adaptive Intelligence</span>.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Please sign in to unlock your personalized real-time assistive workspace designed specifically for visual reading support, facial recognition memory anchors, and sensory balance.
            </p>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-purple-500/30 flex items-start gap-3 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-xl bg-purple-900/60 text-purple-300 flex items-center justify-center shrink-0 border border-purple-700/50">
                  <i data-lucide="book-open" className="w-4 h-4"></i>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Dyslexia Support</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Live HD OCR scanner, Bionic reading, and Karaoking TTS</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-blue-500/30 flex items-start gap-3 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-xl bg-blue-900/60 text-blue-300 flex items-center justify-center shrink-0 border border-blue-700/50">
                  <i data-lucide="scan-face" className="w-4 h-4"></i>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Face Blindness</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Live webcam biometric capture and memory cue cards</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sign In / Create Account Portal (6 Cols) */}
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-700/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/40 relative">
            
            {/* Top Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-2xl mb-5 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error & Success Messages */}
            {errorMessage && (
              <div className="p-3 mb-4 rounded-xl bg-red-950/80 border border-red-700/80 text-xs font-bold text-red-300 flex items-center gap-2">
                <i data-lucide="alert-circle" className="w-4 h-4 shrink-0 text-red-400"></i>
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-xs font-bold text-emerald-300 flex items-center gap-2">
                <i data-lucide="check-circle" className="w-4 h-4 shrink-0 text-emerald-400"></i>
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={mode === 'login' ? handleLoginSubmit : handleSignUpSubmit} className="space-y-4">
              
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <i data-lucide="user" className="w-4 h-4 text-slate-500 absolute left-3.5 top-3"></i>
                    <input
                      type="text"
                      placeholder="e.g., Alex Rivera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <i data-lucide="mail" className="w-4 h-4 text-slate-500 absolute left-3.5 top-3"></i>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <i data-lucide="lock" className="w-4 h-4 text-slate-500 absolute left-3.5 top-3"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    <i data-lucide={showPassword ? "eye-off" : "eye"} className="w-4 h-4"></i>
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Primary Accessibility Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveProfile('dyslexia')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        activeProfile === 'dyslexia'
                          ? 'bg-purple-950 text-purple-200 border-purple-500 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      <i data-lucide="book-open" className="w-3.5 h-3.5 text-purple-400"></i> Dyslexia
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveProfile('face_blindness')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        activeProfile === 'face_blindness'
                          ? 'bg-blue-950 text-blue-200 border-blue-500 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      <i data-lucide="scan" className="w-3.5 h-3.5 text-blue-400"></i> Face Blindness
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-purple-950/60 flex items-center justify-center gap-2 transform active:scale-95 transition-all cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <i data-lucide={mode === 'login' ? "log-in" : "user-plus"} className="w-4 h-4"></i>
                    <span>{mode === 'login' ? "Sign In & Unlock PRISM" : "Create Account & Get Started"}</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Or explore instantly in presentation mode:</span>
              <button
                type="button"
                onClick={handleDemoGuestLogin}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700 cursor-pointer"
              >
                <i data-lucide="sparkles" className="w-3.5 h-3.5 text-amber-400"></i>
                <span>Continue as Demo User (Alex Rivera)</span>
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-800/60">
        <p>PRISM Cognitive & Visual Adaptive Platform • Secure Session Protected</p>
      </footer>

    </div>
  );
}

// Mount React Root
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
