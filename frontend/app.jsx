// PRISM: Personalized Real-time Intelligent Support Module
// Fullstack React 18 Application

const { useState, useEffect, useRef, useMemo } = React;

// --- Web Audio Synthesizer Engine (Self-contained sound generator for Calm Zone) ---
class CalmAudioEngine {
  constructor() {
    this.ctx = null;
    this.activeNodes = [];
    this.currentTrack = null;
    this.isPlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  stop() {
    this.activeNodes.forEach(n => {
      try {
        if (n.stop) n.stop();
        if (n.disconnect) n.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];
    this.isPlaying = false;
    this.currentTrack = null;
  }

  playTrack(type) {
    this.init();
    this.stop();
    this.isPlaying = true;
    this.currentTrack = type;

    if (type === 'rain') {
      this.playRain();
    } else if (type === 'ocean') {
      this.playOcean();
    } else if (type === 'binaural') {
      this.playBinaural();
    } else if (type === 'chime') {
      this.playChimes();
    } else if (type === 'forest') {
      this.playForest();
    }
  }

  playRain() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    whiteNoise.start();
    this.activeNodes.push(whiteNoise, filter, gain);
  }

  playOcean() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
    }
    const pinkNoise = this.ctx.createBufferSource();
    pinkNoise.buffer = noiseBuffer;
    pinkNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    // LFO for wave swelling
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 sec wave cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

    pinkNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    pinkNoise.start();
    this.activeNodes.push(pinkNoise, filter, gain, lfo, lfoGain);
  }

  playBinaural() {
    // 216Hz in Left, 226Hz in Right -> 10Hz Alpha State entrainment
    const oscL = this.ctx.createOscillator();
    const oscR = this.ctx.createOscillator();
    oscL.frequency.setValueAtTime(216, this.ctx.currentTime);
    oscR.frequency.setValueAtTime(226, this.ctx.currentTime);

    const merger = this.ctx.createChannelMerger(2);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    oscL.connect(merger, 0, 0);
    oscR.connect(merger, 0, 1);
    merger.connect(gain);
    gain.connect(this.ctx.destination);

    oscL.start();
    oscR.start();
    this.activeNodes.push(oscL, oscR, merger, gain);
  }

  playChimes() {
    const freqs = [528, 639, 741, 852]; // Healing Solfeggio frequencies
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.8);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15 / (idx + 1), this.ctx.currentTime + idx * 0.8 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + idx * 0.8 + 4.0);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.8);
      osc.stop(this.ctx.currentTime + idx * 0.8 + 4.5);
      this.activeNodes.push(osc, gain);
    });
  }

  playForest() {
    // Soft wind + occasional gentle chirp
    this.playOcean();
  }
}

const calmAudio = new CalmAudioEngine();

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
  // Navigation & Profile States
  const [activeView, setActiveView] = useState('welcome'); // 'welcome', 'dyslexia', 'autism', 'face_blindness', 'unified', 'insights', 'architecture', 'business_plan'
  const [activeModal, setActiveModal] = useState(null); // 'reader', 'simplifier', 'ocr', 'calm_zone', 'emotion_checkin', 'social_stories', 'aac_board', 'face_scanner', 'person_profile', 'memory_quiz', 'copilot', 'accessibility'

  // User Profile & Preferences State
  const [user, setUser] = useState({
    name: "Alex Rivera",
    active_profile: "dyslexia",
    reading_goal_minutes: 20,
    reading_minutes_today: 14,
    reading_streak_days: 6,
    calm_minutes_today: 8,
    recognized_contacts_count: 5,
    points: 380,
    badges: [
      { id: "b1", name: "Focus Master", icon: "zap", desc: "Read 5 days in a row" },
      { id: "b2", name: "Zen Champion", icon: "wind", desc: "10 calm breathing sessions" },
      { id: "b3", name: "Face Detective", icon: "sparkles", desc: "Recognized 15 familiar people" }
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
  const [schedules, setSchedules] = useState([]);
  const [emotionLogs, setEmotionLogs] = useState([]);
  const [socialStories, setSocialStories] = useState([]);
  const [aacItems, setAacItems] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [prevalenceData, setPrevalenceData] = useState(null);
  const [businessCanvas, setBusinessCanvas] = useState(null);

  // Reader TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechWordIndex, setSpeechWordIndex] = useState(-1);
  const [speechWordsList, setSpeechWordsList] = useState([]);
  const [rulerTop, setRulerTop] = useState(140);
  const [isRulerDragging, setIsRulerDragging] = useState(false);

  // Calm Zone Breathing State
  const [breathingPhase, setBreathingPhase] = useState("Ready"); // 'Inhale', 'Hold', 'Exhale', 'Rest'
  const [breathingTimer, setBreathingTimer] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [activeSoundtrack, setActiveSoundtrack] = useState(null);

  // Copilot State
  const [copilotMessages, setCopilotMessages] = useState([
    { sender: "copilot", text: "Hello Alex! I am your PRISM Copilot. I automatically tailor my interface, reading aids, sensory tools, and memory assistants to your needs. How can I assist you today?" }
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [isListeningSTT, setIsListeningSTT] = useState(false);

  // Fetch initial data from backend API
  useEffect(() => {
    fetchUserData();
    fetchReadingItems();
    fetchSchedules();
    fetchEmotions();
    fetchSocialStories();
    fetchAacItems();
    fetchContacts();
    fetchAnalytics();
    fetchBusinessCanvas();
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

  // Re-run Lucide icon parser whenever view or modal changes
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  // Backend API Callers
  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/user');
      const data = await res.json();
      if (data) setUser(data);
    } catch (e) {
      console.warn("Using offline user cache", e);
    }
  };

  const fetchReadingItems = async () => {
    try {
      const res = await fetch('/api/dyslexia/reading-items');
      const data = await res.json();
      setReadingItems(data);
      if (data && data.length > 0) setActiveReadingItem(data[0]);
    } catch (e) {}
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/autism/schedules');
      const data = await res.json();
      setSchedules(data);
    } catch (e) {}
  };

  const fetchEmotions = async () => {
    try {
      const res = await fetch('/api/autism/emotions');
      const data = await res.json();
      setEmotionLogs(data);
    } catch (e) {}
  };

  const fetchSocialStories = async () => {
    try {
      const res = await fetch('/api/autism/social-stories');
      const data = await res.json();
      setSocialStories(data);
    } catch (e) {}
  };

  const fetchAacItems = async () => {
    try {
      const res = await fetch('/api/autism/aac');
      const data = await res.json();
      setAacItems(data);
    } catch (e) {}
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/face-blindness/contacts');
      const data = await res.json();
      setContacts(data);
      if (data && data.length > 0) setSelectedContact(data[0]);
    } catch (e) {}
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (data.prevalence_data) setPrevalenceData(data.prevalence_data);
    } catch (e) {}
  };

  const fetchBusinessCanvas = async () => {
    try {
      const res = await fetch('/api/business-canvas');
      const data = await res.json();
      setBusinessCanvas(data);
    } catch (e) {}
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

  // Text-To-Speech Synthesis with Word Boundary Event Tracking
  const handleSpeakText = (textToSpeak) => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeechWordIndex(-1);
      return;
    }

    const words = textToSpeak.split(/\s+/).filter(Boolean);
    setSpeechWordsList(words);
    setIsSpeaking(true);
    setSpeechWordIndex(0);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = user.preferences.tts_speed || 0.95;
    utterance.pitch = user.preferences.tts_pitch || 1.0;

    let currentWordIdx = 0;
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setSpeechWordIndex(currentWordIdx);
        currentWordIdx++;
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeechWordIndex(-1);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeechWordIndex(-1);
    };

    window.speechSynthesis.speak(utterance);
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
  const handleSendCopilot = async (overrideText) => {
    const query = overrideText || copilotInput;
    if (!query.trim()) return;

    const newHistory = [...copilotMessages, { sender: "user", text: query }];
    setCopilotMessages(newHistory);
    setCopilotInput("");

    try {
      const res = await fetch('/api/copilot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, profile: activeView })
      });
      const data = await res.json();
      setCopilotMessages(prev => [...prev, { sender: "copilot", text: data.reply, suggestions: data.suggestions }]);
    } catch (e) {
      setCopilotMessages(prev => [
        ...prev,
        { sender: "copilot", text: "I'm always here to help you navigate reading, visual routines, or recognizing friendly faces!" }
      ]);
    }
  };

  // Handle Routine Checklist Toggle
  const handleToggleSchedule = async (id) => {
    try {
      const res = await fetch(`/api/autism/schedules/${id}/toggle`, { method: 'POST' });
      const updated = await res.json();
      setSchedules(prev => prev.map(s => s.id === id ? updated : s));
      setUser(prev => ({ ...prev, points: prev.points + 10 }));
    } catch (e) {}
  };

  // Guided 4-7-8 Breathing Loop
  useEffect(() => {
    let interval = null;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathingTimer(prev => {
          if (prev <= 1) {
            // Cycle between Inhale (4s) -> Hold (7s) -> Exhale (8s)
            if (breathingPhase === "Inhale") {
              setBreathingPhase("Hold");
              return 7;
            } else if (breathingPhase === "Hold") {
              setBreathingPhase("Exhale");
              return 8;
            } else {
              setBreathingPhase("Inhale");
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathingPhase("Ready");
      setBreathingTimer(4);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive, breathingPhase]);

  // Audio synthesis trigger
  const handleToggleAudio = (track) => {
    if (activeSoundtrack === track) {
      calmAudio.stop();
      setActiveSoundtrack(null);
    } else {
      calmAudio.playTrack(track);
      setActiveSoundtrack(track);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative pb-16">
      
      {/* Top Universal Floating Navigation */}
      <header className="sticky top-0 z-40 glass-nav border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('welcome')}>
          <div className="w-11 h-11 rounded-2xl bg-white p-1 shadow-md border border-slate-200/90 flex items-center justify-center overflow-hidden hover:scale-105 transition-transform">
            <img src="/static/assets/logo_cropped.png" alt="PRISM Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-emerald-600 to-blue-600">
                PRISM
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold border border-purple-200 hidden sm:inline-block">
                Adaptive v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden md:block">
              Personalized Real-time Intelligent Support Module
            </p>
          </div>
        </div>

        {/* Profile Mode Quick Tabs */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => handleSwitchProfile('welcome')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === 'welcome'
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i data-lucide="home" className="w-3.5 h-3.5"></i> Hub
          </button>
          <button
            onClick={() => handleSwitchProfile('dyslexia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === 'dyslexia'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <i data-lucide="book-open" className="w-3.5 h-3.5"></i> Dyslexia
          </button>
          <button
            onClick={() => handleSwitchProfile('autism')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === 'autism'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <i data-lucide="puzzle" className="w-3.5 h-3.5"></i> Autism
          </button>
          <button
            onClick={() => handleSwitchProfile('face_blindness')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === 'face_blindness'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            <i data-lucide="scan" className="w-3.5 h-3.5"></i> Face Blindness
          </button>
          <button
            onClick={() => handleSwitchProfile('unified')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === 'unified'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <i data-lucide="layout-grid" className="w-3.5 h-3.5"></i> Unified
          </button>
        </div>

        {/* Header Right Action Suite */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Streaks & Rewards */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-xs font-bold shadow-xs">
            <i data-lucide="flame" className="w-4 h-4 text-amber-500 fill-amber-400"></i>
            <span>{user.reading_streak_days}d Streak</span>
            <span className="text-amber-400">|</span>
            <span className="text-amber-700">{user.points} pts</span>
          </div>

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

          {/* Architecture & Business Plan Dropdown */}
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

          <button
            onClick={() => setActiveView(activeView === 'business_plan' ? 'welcome' : 'business_plan')}
            className={`p-2 rounded-xl transition-colors border ${
              activeView === 'business_plan'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Business Canvas (Slide 7)"
          >
            <i data-lucide="briefcase" className="w-4 h-4"></i>
          </button>
        </div>
      </header>

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* VIEW 1: WELCOME & PROFILE SELECTOR (Exact layout from image.webp) */}
        {activeView === 'welcome' && (
          <div className="space-y-10 animate-fade-in">
            {/* Hero Header with Official PRISM Tree Logo */}
            <div className="text-center max-w-2xl mx-auto pt-2 pb-2 flex flex-col items-center">
              <div className="relative mb-4 group">
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-emerald-500 to-blue-600 rounded-full blur-md opacity-30 group-hover:opacity-60 transition duration-500"></div>
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

            {/* Profile Selection Cards Grid (3 Cards exactly from image.webp) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              
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

              {/* Profile Card 2: Autism */}
              <div
                onClick={() => handleSwitchProfile('autism')}
                className="group relative bg-white/90 backdrop-blur-md rounded-3xl p-8 border-2 border-emerald-100 hover:border-emerald-500 shadow-xl shadow-emerald-500/5 hover:shadow-2xl hover:shadow-emerald-500/15 transition-all duration-300 cursor-pointer flex flex-col items-center text-center transform hover:-translate-y-1.5"
              >
                <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <i data-lucide="puzzle" className="w-10 h-10"></i>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 font-outfit group-hover:text-emerald-700 transition-colors">
                  Autism
                </h3>
                <p className="text-slate-600 mt-3 text-sm leading-relaxed">
                  Visual routine planner, emotion regulation, guided calm breathing, AAC board, and social stories.
                </p>
                <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  Open Autism Mode <i data-lucide="arrow-right" className="w-3.5 h-3.5"></i>
                </div>
              </div>

              {/* Profile Card 3: Face Blindness (Prosopagnosia) */}
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

            {/* Quick Overview Navigation Hub */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-4">
              <button
                onClick={() => setActiveView('unified')}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 shadow-xs hover:shadow-md transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <i data-lucide="layout-grid" className="w-4 h-4"></i>
                </div>
                <div className="font-bold text-slate-800 text-sm">Unified Mode</div>
                <div className="text-[11px] text-slate-500">All tools together</div>
              </button>

              <button
                onClick={() => setActiveView('insights')}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 shadow-xs hover:shadow-md transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <i data-lucide="bar-chart-3" className="w-4 h-4"></i>
                </div>
                <div className="font-bold text-slate-800 text-sm">Prevalence & Stats</div>
                <div className="text-[11px] text-slate-500">Slide 6 overlap data</div>
              </button>

              <button
                onClick={() => setActiveView('architecture')}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <i data-lucide="cpu" className="w-4 h-4"></i>
                </div>
                <div className="font-bold text-slate-800 text-sm">System Architecture</div>
                <div className="text-[11px] text-slate-500">Slide 5 fullstack engine</div>
              </button>

              <button
                onClick={() => setActiveView('business_plan')}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <i data-lucide="trending-up" className="w-4 h-4"></i>
                </div>
                <div className="font-bold text-slate-800 text-sm">Business Canvas</div>
                <div className="text-[11px] text-slate-500">Slide 7 Lean Plan</div>
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
                  Good Morning, Alex! 📖
                </h1>
                <p className="text-purple-100 text-sm sm:text-base mt-1">
                  Let's make reading effortless, comfortable, and enjoyable today.
                </p>
              </div>

              <div className="flex items-center gap-3">
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
              
              {/* Continue Reading Card (from image.webp) */}
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
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 ${
                        isSpeaking
                          ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                          : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'
                      }`}
                    >
                      <i data-lucide={isSpeaking ? "square" : "volume-2"} className="w-4 h-4"></i>
                      {isSpeaking ? "Stop Reading" : "Read Aloud"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Today's Goal Tracker Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Today's Goal
                    </span>
                    <i data-lucide="target" className="w-4 h-4 text-purple-600"></i>
                  </div>
                  
                  <h4 className="text-lg font-bold text-slate-800 mt-3 font-outfit">
                    Read for {user.reading_goal_minutes} minutes
                  </h4>

                  <div className="mt-6 flex items-center justify-center">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeWidth="3.8"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-purple-600"
                          strokeDasharray={`${(user.reading_minutes_today / user.reading_goal_minutes) * 100}, 100`}
                          strokeWidth="3.8"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-black text-slate-900">{user.reading_minutes_today}/{user.reading_goal_minutes}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">minutes</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-3 mt-4">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                    <i data-lucide="flame" className="w-4 h-4"></i>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-900">{user.reading_streak_days}-Day Reading Streak!</div>
                    <div className="text-[10px] text-purple-700">6 more mins to complete today's goal</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Tools Suite (Matching image.webp) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 font-outfit">Quick Tools</h3>
                <span className="text-xs font-semibold text-purple-600">Adaptive AI Suite</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                {/* Tool 1: Scan & Read */}
                <button
                  onClick={() => setActiveModal('ocr')}
                  className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-400 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <i data-lucide="camera" className="w-6 h-6"></i>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Scan & Read</span>
                  <span className="text-[11px] text-slate-500 mt-1">OCR camera extract</span>
                </button>

                {/* Tool 2: Text Simplifier */}
                <button
                  onClick={() => setActiveModal('simplifier')}
                  className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-400 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <i data-lucide="sparkles" className="w-6 h-6"></i>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Text Simplifier</span>
                  <span className="text-[11px] text-slate-500 mt-1">Shorter & simpler text</span>
                </button>

                {/* Tool 3: Read Aloud */}
                <button
                  onClick={() => setActiveModal('reader')}
                  className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-400 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <i data-lucide="volume-2" className="w-6 h-6"></i>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Read Aloud</span>
                  <span className="text-[11px] text-slate-500 mt-1">Karaoke highlighting</span>
                </button>

                {/* Tool 4: Reading Ruler & Fonts */}
                <button
                  onClick={() => setActiveModal('accessibility')}
                  className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-400 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <i data-lucide="sliders" className="w-6 h-6"></i>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Ruler & Tints</span>
                  <span className="text-[11px] text-slate-500 mt-1">Background colors</span>
                </button>

              </div>
            </div>

            {/* Reading Library Shelf */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 font-outfit mb-4">Your Reading Shelf</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {readingItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveReadingItem(item);
                      setActiveModal('reader');
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                      activeReadingItem?.id === item.id
                        ? 'border-purple-500 bg-purple-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-purple-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="text-3xl p-2 bg-white rounded-xl shadow-xs border border-slate-100">
                      {item.cover_emoji}
                    </div>
                    <div className="flex-1 min-w-0">
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

        {/* VIEW 3: AUTISM MODE (Green Theme Dashboard) */}
        {activeView === 'autism' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Header Greeting Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-600/10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-emerald-100 mb-2 border border-white/20">
                  <i data-lucide="puzzle" className="w-3.5 h-3.5"></i> Autism Mode Active
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-outfit">
                  Good Morning, Alex! 🌱
                </h1>
                <p className="text-emerald-100 text-sm sm:text-base mt-1">
                  Let's plan a calm, structured, and rewarding day together.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveModal('calm_zone')}
                  className="px-4 py-2.5 bg-white text-emerald-700 rounded-2xl font-bold text-xs shadow-md hover:bg-emerald-50 transition-all flex items-center gap-2"
                >
                  <i data-lucide="wind" className="w-4 h-4"></i> Calm Zone
                </button>
                <button
                  onClick={() => setActiveModal('emotion_checkin')}
                  className="px-4 py-2.5 bg-emerald-800/80 text-white rounded-2xl font-bold text-xs border border-emerald-400/40 hover:bg-emerald-800 transition-all flex items-center gap-2"
                >
                  <i data-lucide="smile" className="w-4 h-4"></i> Mood Check-in
                </button>
              </div>
            </div>

            {/* Visual Schedule & Today's Timeline (from image.webp) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Today's Schedule Card */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i data-lucide="calendar" className="w-5 h-5 text-emerald-600"></i>
                    <h3 className="text-lg font-bold text-slate-900 font-outfit">Today's Visual Schedule</h3>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    {schedules.filter(s => s.completed).length}/{schedules.length} Completed
                  </span>
                </div>

                {/* Timeline Items */}
                <div className="space-y-3 pt-2">
                  {schedules.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleSchedule(task.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        task.completed
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-white border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                          task.completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}>
                          {task.completed && <i data-lucide="check" className="w-4 h-4"></i>}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-700 px-2 py-0.5 bg-emerald-50 rounded-md">
                              {task.time}
                            </span>
                            <span className={`text-sm font-bold ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {task.title}
                            </span>
                          </div>
                          {task.notes && (
                            <p className="text-xs text-slate-500 mt-1">{task.notes}</p>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hidden sm:inline-block">
                        {task.sensory_tag}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => setActiveModal('social_stories')}
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1.5"
                  >
                    <i data-lucide="book" className="w-3.5 h-3.5"></i> View Social Stories
                  </button>
                  <button
                    onClick={() => setActiveModal('aac_board')}
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1.5"
                  >
                    <i data-lucide="grid" className="w-3.5 h-3.5"></i> Open AAC Cards
                  </button>
                </div>
              </div>

              {/* Calm Zone & Sensory Status Widget */}
              <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                      Sensory Equilibrium
                    </span>
                    <i data-lucide="shield-check" className="w-4 h-4 text-emerald-600"></i>
                  </div>

                  <h4 className="text-lg font-bold text-slate-800 mt-3 font-outfit">
                    Calm Zone Audio Synthesizer
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Self-contained sound generator for deep focus and decompression.
                  </p>

                  {/* Sound Presets */}
                  <div className="grid grid-cols-2 gap-2.5 mt-5">
                    <button
                      onClick={() => handleToggleAudio('rain')}
                      className={`p-3 rounded-2xl text-xs font-bold flex flex-col items-center gap-1.5 border transition-all ${
                        activeSoundtrack === 'rain'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-md animate-pulse'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                      }`}
                    >
                      <i data-lucide="cloud-rain" className="w-5 h-5"></i>
                      <span>Gentle Rain</span>
                    </button>

                    <button
                      onClick={() => handleToggleAudio('ocean')}
                      className={`p-3 rounded-2xl text-xs font-bold flex flex-col items-center gap-1.5 border transition-all ${
                        activeSoundtrack === 'ocean'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-md animate-pulse'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                      }`}
                    >
                      <i data-lucide="waves" className="w-5 h-5"></i>
                      <span>Ocean Waves</span>
                    </button>

                    <button
                      onClick={() => handleToggleAudio('binaural')}
                      className={`p-3 rounded-2xl text-xs font-bold flex flex-col items-center gap-1.5 border transition-all ${
                        activeSoundtrack === 'binaural'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-md animate-pulse'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                      }`}
                    >
                      <i data-lucide="headphones" className="w-5 h-5"></i>
                      <span>10Hz Alpha</span>
                    </button>

                    <button
                      onClick={() => handleToggleAudio('chime')}
                      className={`p-3 rounded-2xl text-xs font-bold flex flex-col items-center gap-1.5 border transition-all ${
                        activeSoundtrack === 'chime'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-md animate-pulse'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                      }`}
                    >
                      <i data-lucide="bell" className="w-5 h-5"></i>
                      <span>Peace Chimes</span>
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-emerald-100 flex items-center justify-between">
                  <button
                    onClick={() => setActiveModal('calm_zone')}
                    className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-md hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    <i data-lucide="wind" className="w-4 h-4"></i> Launch Guided Breathing
                  </button>
                </div>
              </div>

            </div>

            {/* Quick Tools Suite (Autism) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 font-outfit">Quick Tools</h3>
                <span className="text-xs font-semibold text-emerald-600">Autism Spectrum Support</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                <button
                  onClick={() => setActiveModal('social_stories')}
                  className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <i data-lucide="book-open" className="w-6 h-6"></i>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Social Stories</span>
                  <span className="text-[11px] text-slate-500 mt-1">Scenario scripts</span>
                </button>

                <button
                  onClick={() => setActiveModal('emotion_checkin')}
                  className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <i data-lucide="smile" className="w-6 h-6"></i>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Emotion Check-in</span>
                  <span className="text-[11px] text-slate-500 mt-1">Mood & Coping AI</span>
                </button>

                <button
                  onClick={() => setActiveModal('calm_zone')}
                  className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <i data-lucide="wind" className="w-6 h-6"></i>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Calm Zone</span>
                  <span className="text-[11px] text-slate-500 mt-1">4-7-8 Deep breath</span>
                </button>

                <button
                  onClick={() => setActiveModal('aac_board')}
                  className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <i data-lucide="message-square" className="w-6 h-6"></i>
                  </div>
                  <span className="font-bold text-slate-800 text-sm">AAC Board</span>
                  <span className="text-[11px] text-slate-500 mt-1">Tap-to-speak voice</span>
                </button>

              </div>
            </div>

          </div>
        )}

        {/* VIEW 4: FACE BLINDNESS (PROSOPAGNOSIA) MODE (Blue Theme Dashboard) */}
        {activeView === 'face_blindness' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Header Greeting Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-600/10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-100 mb-2 border border-white/20">
                  <i data-lucide="scan-face" className="w-3.5 h-3.5"></i> Face Blindness Mode Active
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-outfit">
                  Good Morning, Alex! 👓
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

            {/* People Around Me (Avatar Grid from image.webp) */}
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
                    className="p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer flex flex-col items-center text-center group"
                  >
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
              
              {/* Recent Interactions Card (from image.webp) */}
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

        {/* VIEW 5: UNIFIED CROSS-DISABILITY DASHBOARD */}
        {activeView === 'unified' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-r from-purple-800 via-emerald-800 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-2">
                <i data-lucide="layout-grid" className="w-3.5 h-3.5"></i> Unified Adaptive Experience
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-outfit">
                All Systems Active for Alex 🚀
              </h1>
              <p className="text-slate-200 text-sm mt-1">
                Access your dyslexia reader, visual schedule timeline, and face recognition memory anchors in one integrated workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Column 1: Dyslexia Quick Reader */}
              <div className="bg-white rounded-3xl p-6 border-t-4 border-purple-600 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-700 text-sm">Dyslexia Assistant</span>
                  <i data-lucide="book-open" className="w-4 h-4 text-purple-600"></i>
                </div>
                <h4 className="font-bold text-slate-900">{activeReadingItem?.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-3">{activeReadingItem?.content}</p>
                <button
                  onClick={() => { setActiveView('dyslexia'); setActiveModal('reader'); }}
                  className="w-full py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold hover:bg-purple-100 transition-colors"
                >
                  Launch Full Reader
                </button>
              </div>

              {/* Column 2: Autism Next Task */}
              <div className="bg-white rounded-3xl p-6 border-t-4 border-emerald-600 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-700 text-sm">Next Routine Task</span>
                  <i data-lucide="calendar" className="w-4 h-4 text-emerald-600"></i>
                </div>
                {schedules.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {schedules[2]?.time || "3:00 PM"}
                    </span>
                    <h4 className="font-bold text-slate-900 mt-2">{schedules[2]?.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{schedules[2]?.notes}</p>
                  </div>
                )}
                <button
                  onClick={() => { setActiveView('autism'); setActiveModal('calm_zone'); }}
                  className="w-full py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  Open Calm Zone
                </button>
              </div>

              {/* Column 3: Face Blindness Quick Scan */}
              <div className="bg-white rounded-3xl p-6 border-t-4 border-blue-600 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-700 text-sm">Nearby Familiar Person</span>
                  <i data-lucide="scan" className="w-4 h-4 text-blue-600"></i>
                </div>
                {contacts.length > 0 && (
                  <div className="flex items-center gap-3">
                    <img src={contacts[0].avatar_url} className="w-12 h-12 rounded-full object-cover border" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{contacts[0].name}</h4>
                      <p className="text-xs text-slate-500">{contacts[0].role}</p>
                      <p className="text-[10px] text-blue-600 font-semibold">{contacts[0].visual_cues[0]}</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => { setActiveView('face_blindness'); setActiveModal('face_scanner'); }}
                  className="w-full py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  Scan Live Camera
                </button>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 6: GLOBAL PREVALENCE & CO-OCCURRENCE (Slide 6) */}
        {activeView === 'insights' && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-extrabold text-slate-900 font-outfit">
                Global Estimates & Cross-Disability Overlap
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Data insights based on WHO, CDC, Harvard Medical School, and Scientific Research (2023–2024).
              </p>
            </div>

            {/* Global Prevalence Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white rounded-3xl p-6 border-t-4 border-purple-600 shadow-sm text-center">
                <div className="text-3xl font-black text-purple-700">~10%</div>
                <div className="text-xs font-bold text-slate-500 uppercase mt-1">Global Population</div>
                <h4 className="text-xl font-bold text-slate-900 mt-2">Dyslexia</h4>
                <p className="text-xs text-slate-600 mt-2">~800 Million people worldwide experience written language processing challenges.</p>
              </div>

              <div className="bg-white rounded-3xl p-6 border-t-4 border-emerald-600 shadow-sm text-center">
                <div className="text-3xl font-black text-emerald-700">~1%</div>
                <div className="text-xs font-bold text-slate-500 uppercase mt-1">Global Population</div>
                <h4 className="text-xl font-bold text-slate-900 mt-2">Autism Spectrum</h4>
                <p className="text-xs text-slate-600 mt-2">~80 Million people worldwide navigate sensory processing and communication differences.</p>
              </div>

              <div className="bg-white rounded-3xl p-6 border-t-4 border-blue-600 shadow-sm text-center">
                <div className="text-3xl font-black text-blue-700">~2.5%</div>
                <div className="text-xs font-bold text-slate-500 uppercase mt-1">Global Population</div>
                <h4 className="text-xl font-bold text-slate-900 mt-2">Prosopagnosia (Face Blindness)</h4>
                <p className="text-xs text-slate-600 mt-2">~200 Million people worldwide have difficulty recognizing familiar human faces.</p>
              </div>

            </div>

            {/* Co-occurrence Relationship Table (from Slide 6) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 font-outfit mb-4">
                How These Conditions Are Related (Co-occurrence Rates)
              </h3>

              <div className="space-y-4">
                {[
                  { label: "People with Dyslexia who also have Autism", rate: "~20–30%", color: "purple" },
                  { label: "People with Autism who also have Dyslexia", rate: "~25–40%", color: "emerald" },
                  { label: "People with Prosopagnosia who also have Autism", rate: "~10–20%", color: "blue" },
                  { label: "People with Prosopagnosia who also have Dyslexia", rate: "~15–25%", color: "indigo" },
                  { label: "People experiencing all three neurodivergent conditions", rate: "~5–10% of overlap", color: "amber" }
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

        {/* VIEW 7: INTERACTIVE ARCHITECTURE EXPLORER (IMAGE 1.png / Slide 5) */}
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
                Explore the complete 7-tier modular architecture powering our adaptive accessibility engine.
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

              {/* Layer 2: Frontend & Core Engine */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Dyslexia Module Engine */}
                <div className="bg-purple-50/50 rounded-3xl p-6 border-2 border-purple-200">
                  <div className="flex items-center gap-2 text-purple-700 font-bold mb-3">
                    <i data-lucide="book-open" className="w-5 h-5"></i> A. Dyslexia Module
                  </div>
                  <ul className="text-xs space-y-2 text-slate-700">
                    <li>• OCR & Text Extraction (PaddleOCR / Vision)</li>
                    <li>• Dyslexia Friendly Reader (OpenDyslexic)</li>
                    <li>• Web Speech Text-to-Speech (TTS)</li>
                    <li>• Word Highlighting & Syllable Breaks</li>
                    <li>• NLP Text Simplification (Gemini / GPT)</li>
                  </ul>
                </div>

                {/* Autism Module Engine */}
                <div className="bg-emerald-50/50 rounded-3xl p-6 border-2 border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold mb-3">
                    <i data-lucide="puzzle" className="w-5 h-5"></i> B. Autism Module
                  </div>
                  <ul className="text-xs space-y-2 text-slate-700">
                    <li>• Visual Schedule & Routine Planner</li>
                    <li>• Social Stories & Scenario Builder</li>
                    <li>• Emotion Recognition & Regulation</li>
                    <li>• Web Audio Ambient Sound Synthesizer</li>
                    <li>• AAC Tap-to-Speak Communication Cards</li>
                  </ul>
                </div>

                {/* Face Blindness Module Engine */}
                <div className="bg-blue-50/50 rounded-3xl p-6 border-2 border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 font-bold mb-3">
                    <i data-lucide="scan-face" className="w-5 h-5"></i> C. Face Blindness Module
                  </div>
                  <ul className="text-xs space-y-2 text-slate-700">
                    <li>• Face Recognition Assistance HUD</li>
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
                    <div className="p-2 bg-slate-50 rounded-lg">API Gateway (REST)</div>
                    <div className="p-2 bg-slate-50 rounded-lg">User & Profile Service</div>
                    <div className="p-2 bg-slate-50 rounded-lg">AI Orchestration Engine</div>
                    <div className="p-2 bg-slate-50 rounded-lg">Analytics & Insights</div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-3">Data & Security Layer</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg">Primary DB (PostgreSQL / SQLite)</div>
                    <div className="p-2 bg-slate-50 rounded-lg">Vector DB (Face Embeddings)</div>
                    <div className="p-2 bg-slate-50 rounded-lg">End-to-End Encryption</div>
                    <div className="p-2 bg-slate-50 rounded-lg">GDPR / HIPAA Compliance</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 8: LEAN BUSINESS PLAN CANVAS (Slide 7) */}
        {activeView === 'business_plan' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold mb-2">
                <i data-lucide="briefcase" className="w-3.5 h-3.5"></i> Innovation Business Plan
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-outfit">
                PRISM Lean Business Canvas (Slide 7)
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Strategic roadmap, value proposition, competitive moat, and societal impact.
              </p>
            </div>

            {businessCanvas && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Problem & Existing Alternatives */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-900 font-outfit text-base">1. Problem</h3>
                  <ul className="text-xs space-y-2 text-slate-600">
                    {businessCanvas.problem.map((p, i) => <li key={i}>• {p}</li>)}
                  </ul>
                </div>

                {/* Solution */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                  <h3 className="font-bold text-emerald-700 font-outfit text-base">2. Solution</h3>
                  <ul className="text-xs space-y-2 text-slate-600">
                    {businessCanvas.solution.map((s, i) => <li key={i}>• {s}</li>)}
                  </ul>
                </div>

                {/* Unique Value Proposition */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                  <h3 className="font-bold text-purple-700 font-outfit text-base">3. Unique Value Prop</h3>
                  <ul className="text-xs space-y-2 text-slate-600">
                    {businessCanvas.unique_value_proposition.map((u, i) => <li key={i}>• {u}</li>)}
                  </ul>
                </div>

                {/* Unfair Advantage */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                  <h3 className="font-bold text-blue-700 font-outfit text-base">4. Unfair Advantage</h3>
                  <ul className="text-xs space-y-2 text-slate-600">
                    {businessCanvas.unfair_advantage.map((a, i) => <li key={i}>• {a}</li>)}
                  </ul>
                </div>

                {/* Customer Segments */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-900 font-outfit text-base">5. Customer Segments</h3>
                  <ul className="text-xs space-y-2 text-slate-600">
                    {businessCanvas.customer_segments.map((c, i) => <li key={i}>• {c}</li>)}
                  </ul>
                </div>

                {/* Impact */}
                <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-200 space-y-3">
                  <h3 className="font-bold text-emerald-900 font-outfit text-base">6. Societal Impact</h3>
                  <ul className="text-xs space-y-2 text-emerald-800">
                    {businessCanvas.impact.map((imp, i) => <li key={i}>• {imp}</li>)}
                  </ul>
                </div>

              </div>
            )}
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
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  {['default', 'cream', 'peach', 'mint', 'lavender', 'dark'].map((tint) => (
                    <button
                      key={tint}
                      onClick={() => handleUpdatePreference('background_tint', tint)}
                      className={`w-5 h-5 rounded-full border ${
                        user.preferences.background_tint === tint ? 'ring-2 ring-purple-600' : ''
                      }`}
                      style={{
                        backgroundColor:
                          tint === 'default' ? '#f8fafc' :
                          tint === 'cream' ? '#fbf7ee' :
                          tint === 'peach' ? '#fff4ed' :
                          tint === 'mint' ? '#f0fdf4' :
                          tint === 'lavender' ? '#faf5ff' : '#090d16'
                      }}
                      title={`Tint: ${tint}`}
                    />
                  ))}
                </div>

                {/* Bionic Mode Toggle */}
                <button
                  onClick={() => handleUpdatePreference('bionic_reading', !user.preferences.bionic_reading)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    user.preferences.bionic_reading
                      ? 'bg-purple-600 text-white border-purple-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Bionic: {user.preferences.bionic_reading ? 'ON' : 'OFF'}
                </button>

                {/* Reading Ruler Toggle */}
                <button
                  onClick={() => handleUpdatePreference('reading_ruler_enabled', !user.preferences.reading_ruler_enabled)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    user.preferences.reading_ruler_enabled
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Ruler
                </button>
              </div>
            </div>

            {/* Reader Content Body */}
            <div
              className="flex-1 p-6 sm:p-10 overflow-y-auto relative text-base sm:text-lg leading-loose transition-all select-text"
              onMouseMove={(e) => {
                if (user.preferences.reading_ruler_enabled) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setRulerTop(e.clientY - rect.top - 20);
                }
              }}
            >
              {/* Dynamic Reading Ruler Overlay */}
              {user.preferences.reading_ruler_enabled && (
                <div
                  className="reading-ruler"
                  style={{ top: `${rulerTop}px` }}
                />
              )}

              {/* Text Render with Bionic or Karaoke Highlight */}
              <div className="max-w-2xl mx-auto font-opendyslexic space-y-6">
                {activeReadingItem?.content.split('\n\n').map((paragraph, pIdx) => (
                  <p key={pIdx}>
                    {user.preferences.bionic_reading
                      ? formatBionicText(paragraph)
                      : paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Reader Bottom Bar */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => handleSpeakText(activeReadingItem?.content || "")}
                className={`px-6 py-2.5 rounded-2xl text-xs font-bold shadow-md transition-all flex items-center gap-2 ${
                  isSpeaking
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                <i data-lucide={isSpeaking ? "square" : "volume-2"} className="w-4 h-4"></i>
                {isSpeaking ? "Pause Audio" : "Read Aloud"}
              </button>

              <button
                onClick={() => {
                  setUser(prev => ({
                    ...prev,
                    reading_minutes_today: prev.reading_minutes_today + 3,
                    points: prev.points + 20
                  }));
                  alert("Awesome reading session! +20 Points added to your streak.");
                  setActiveModal(null);
                }}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Finish Chapter
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: TEXT SIMPLIFIER (Side-by-side mode) */}
      {activeModal === 'simplifier' && (
        <TextSimplifierModal onClose={() => setActiveModal(null)} onSpeak={handleSpeakText} />
      )}

      {/* MODAL 3: SCAN & READ OCR CAMERA */}
      {activeModal === 'ocr' && (
        <ScanAndReadModal onClose={() => setActiveModal(null)} onSpeak={handleSpeakText} />
      )}

      {/* MODAL 4: CALM ZONE & GUIDED 4-7-8 BREATHING */}
      {activeModal === 'calm_zone' && (
        <div className="fixed inset-0 z-50 bg-emerald-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center relative border border-emerald-200">
            <button
              onClick={() => {
                setIsBreathingActive(false);
                calmAudio.stop();
                setActiveSoundtrack(null);
                setActiveModal(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              <i data-lucide="x" className="w-4 h-4"></i>
            </button>

            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 mb-2">
              PRISM Calm Zone
            </span>
            <h3 className="text-2xl font-bold text-slate-900 font-outfit">Take a Deep Breath</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              4-7-8 breathing activates your body's natural relaxation response.
            </p>

            {/* Breathing Animation Circle */}
            <div className="my-10 relative w-56 h-56 flex items-center justify-center">
              <div
                className={`w-48 h-48 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-300 flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-1000 ${
                  isBreathingActive ? 'breathing-circle-active' : 'scale-90 opacity-80'
                }`}
              >
                <span className="text-2xl font-black font-outfit">{breathingPhase}</span>
                <span className="text-3xl font-black mt-1">{breathingTimer}s</span>
              </div>
            </div>

            {/* Action Controls */}
            <div className="w-full space-y-3">
              <button
                onClick={() => {
                  setIsBreathingActive(!isBreathingActive);
                  if (!isBreathingActive && !activeSoundtrack) {
                    handleToggleAudio('rain');
                  }
                }}
                className={`w-full py-3 rounded-2xl font-bold text-sm shadow-md transition-all ${
                  isBreathingActive
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isBreathingActive ? "Pause Exercise" : "Start 4-7-8 Breathing"}
              </button>

              {/* Sound toggles */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => handleToggleAudio('rain')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    activeSoundtrack === 'rain' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-50'
                  }`}
                >
                  🌧️ Rain
                </button>
                <button
                  onClick={() => handleToggleAudio('ocean')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    activeSoundtrack === 'ocean' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-50'
                  }`}
                >
                  🌊 Waves
                </button>
                <button
                  onClick={() => handleToggleAudio('binaural')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    activeSoundtrack === 'binaural' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-50'
                  }`}
                >
                  🎧 Alpha 10Hz
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 5: EMOTION CHECK-IN */}
      {activeModal === 'emotion_checkin' && (
        <EmotionCheckinModal
          onClose={() => setActiveModal(null)}
          onLogged={() => {
            fetchEmotions();
            fetchUserData();
          }}
        />
      )}

      {/* MODAL 6: SOCIAL STORIES BUILDER */}
      {activeModal === 'social_stories' && (
        <SocialStoriesModal
          stories={socialStories}
          onClose={() => setActiveModal(null)}
          onSpeak={handleSpeakText}
        />
      )}

      {/* MODAL 7: AAC TAP-TO-SPEAK COMMUNICATION BOARD */}
      {activeModal === 'aac_board' && (
        <AACBoardModal
          items={aacItems}
          onClose={() => setActiveModal(null)}
          onSpeak={handleSpeakText}
        />
      )}

      {/* MODAL 8: IDENTIFY PERSON FACE SCANNER HUD */}
      {activeModal === 'face_scanner' && (
        <FaceScannerModal
          contacts={contacts}
          onClose={() => setActiveModal(null)}
          onSelectPerson={(p) => {
            setSelectedContact(p);
            setActiveModal('person_profile');
          }}
        />
      )}

      {/* MODAL 9: PERSON PROFILE MEMORY CUE CARD */}
      {activeModal === 'person_profile' && selectedContact && (
        <PersonProfileModal
          person={selectedContact}
          onClose={() => setActiveModal(null)}
          onSpeak={handleSpeakText}
        />
      )}

      {/* MODAL 10: MEMORY REINFORCEMENT FLASHCARD QUIZ */}
      {activeModal === 'memory_quiz' && (
        <MemoryQuizModal
          onClose={() => setActiveModal(null)}
          onEarnPoints={(pts) => setUser(prev => ({ ...prev, points: prev.points + pts }))}
        />
      )}

      {/* MODAL 11: PRISM AI COPILOT */}
      {activeModal === 'copilot' && (
        <CopilotModal
          messages={copilotMessages}
          input={copilotInput}
          setInput={setCopilotInput}
          onSend={handleSendCopilot}
          isListening={isListeningSTT}
          onStartListening={handleStartSTT}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* MODAL 12: ACCESSIBILITY & COMFORT DRAWER */}
      {activeModal === 'accessibility' && (
        <AccessibilityDrawerModal
          preferences={user.preferences}
          onUpdate={handleUpdatePreference}
          onClose={() => setActiveModal(null)}
        />
      )}

    </div>
  );
}

// --- SUB-COMPONENT: Text Simplifier Modal ---
function TextSimplifierModal({ onClose, onSpeak }) {
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
          <label className="text-xs font-bold text-slate-600 block mb-1">Original Text</label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-4 rounded-2xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm font-opendyslexic"
            rows="3"
          />
        </div>

        {/* Mode Toggles */}
        <div className="flex items-center gap-2 my-4">
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
              {result.simplified_text}
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

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => onSpeak(result.simplified_text)}
                className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-purple-700 flex items-center gap-1.5"
              >
                <i data-lucide="volume-2" className="w-3.5 h-3.5"></i> Read Aloud
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

// --- SUB-COMPONENT: Scan & Read OCR Modal ---
function ScanAndReadModal({ onClose, onSpeak }) {
  const [selectedPreset, setSelectedPreset] = useState("handwritten_note");
  const [ocrData, setOcrData] = useState(null);

  const runOCR = async (presetId) => {
    try {
      const res = await fetch('/api/dyslexia/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset_id: presetId })
      });
      const data = await res.json();
      setOcrData(data);
    } catch (e) {}
  };

  useEffect(() => {
    runOCR("handwritten_note");
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <i data-lucide="camera" className="w-5 h-5 text-purple-600"></i>
            <h3 className="font-bold text-slate-900 text-lg font-outfit">OCR Scan & Read Assistant</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
            <i data-lucide="x" className="w-4 h-4"></i>
          </button>
        </div>

        {/* Preset Document Chooser */}
        <div className="my-4 flex items-center gap-2">
          <button
            onClick={() => { setSelectedPreset("handwritten_note"); runOCR("handwritten_note"); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
              selectedPreset === "handwritten_note" ? "bg-purple-600 text-white" : "bg-slate-50"
            }`}
          >
            📝 Handwritten Note
          </button>
          <button
            onClick={() => { setSelectedPreset("textbook_science"); runOCR("textbook_science"); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
              selectedPreset === "textbook_science" ? "bg-purple-600 text-white" : "bg-slate-50"
            }`}
          >
            📖 Science Textbook
          </button>
          <button
            onClick={() => { setSelectedPreset("classroom_board"); runOCR("classroom_board"); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
              selectedPreset === "classroom_board" ? "bg-purple-600 text-white" : "bg-slate-50"
            }`}
          >
            🏫 Classroom Board
          </button>
        </div>

        {/* OCR Result View */}
        {ocrData && (
          <div className="space-y-4">
            <div className="p-5 bg-purple-50/60 rounded-2xl border border-purple-200 font-opendyslexic text-sm leading-relaxed text-slate-800">
              {ocrData.extracted_text}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Confidence: {(ocrData.confidence * 100).toFixed(0)}% • Readability: {ocrData.readability_level}</span>
              <button
                onClick={() => onSpeak(ocrData.extracted_text)}
                className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <i data-lucide="volume-2" className="w-3.5 h-3.5"></i> Read Aloud
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: Emotion Check-In Modal ---
function EmotionCheckinModal({ onClose, onLogged }) {
  const [selectedEmotion, setSelectedEmotion] = useState("Calm");
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState("");
  const [lastLogged, setLastLogged] = useState(null);

  const emotions = [
    { label: "Happy", emoji: "😊", color: "bg-amber-100 text-amber-800 border-amber-300" },
    { label: "Calm", emoji: "😌", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    { label: "Okay", emoji: "😐", color: "bg-slate-100 text-slate-800 border-slate-300" },
    { label: "Anxious", emoji: "😰", color: "bg-purple-100 text-purple-800 border-purple-300" },
    { label: "Sad", emoji: "😢", color: "bg-blue-100 text-blue-800 border-blue-300" },
    { label: "Angry", emoji: "😡", color: "bg-red-100 text-red-800 border-red-300" }
  ];

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/autism/emotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emotion: selectedEmotion, intensity, note })
      });
      const data = await res.json();
      setLastLogged(data);
      if (onLogged) onLogged();
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col border border-emerald-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <i data-lucide="smile" className="w-5 h-5 text-emerald-600"></i>
            <h3 className="font-bold text-slate-900 text-lg font-outfit">How are you feeling, Alex?</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
            <i data-lucide="x" className="w-4 h-4"></i>
          </button>
        </div>

        {!lastLogged ? (
          <div className="space-y-5 mt-4">
            {/* Emotion Buttons Grid (from image.webp) */}
            <div className="grid grid-cols-3 gap-3">
              {emotions.map((emo) => (
                <button
                  key={emo.label}
                  onClick={() => setSelectedEmotion(emo.label)}
                  className={`p-3.5 rounded-2xl border-2 flex flex-col items-center transition-all ${
                    selectedEmotion === emo.label
                      ? 'border-emerald-600 bg-emerald-50 scale-105 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-emerald-300'
                  }`}
                >
                  <span className="text-3xl mb-1">{emo.emoji}</span>
                  <span className="text-xs font-bold text-slate-800">{emo.label}</span>
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Intensity Level: {intensity} / 5
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Add Note (Optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What might have triggered this feeling?"
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-md hover:bg-emerald-700 transition-all"
            >
              Save Mood Check-in
            </button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
              <span className="text-3xl">✨</span>
              <h4 className="font-bold text-emerald-900 text-sm mt-2">Mood Logged Successfully!</h4>
              <p className="text-xs text-emerald-700 mt-1">Recommended Coping Strategies for {lastLogged.emotion}:</p>
            </div>

            <div className="space-y-2">
              {lastLogged.coping_strategies.map((strat, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="font-bold text-slate-900">{strat.title}</div>
                  <div className="text-slate-600 mt-0.5">{strat.detail}</div>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl"
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: Social Stories Modal ---
function SocialStoriesModal({ stories, onClose, onSpeak }) {
  const [selectedStory, setSelectedStory] = useState(stories[0] || null);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto border border-emerald-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <i data-lucide="book-open" className="w-5 h-5 text-emerald-600"></i>
            <h3 className="font-bold text-slate-900 text-lg font-outfit">Interactive Social Stories</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
            <i data-lucide="x" className="w-4 h-4"></i>
          </button>
        </div>

        {/* Story Selector Tabs */}
        <div className="flex items-center gap-2 my-4 overflow-x-auto pb-1">
          {stories.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedStory(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedStory?.id === s.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {selectedStory && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
              <h4 className="font-bold text-emerald-950 text-base">{selectedStory.title}</h4>
              <p className="text-xs text-emerald-800 mt-1">{selectedStory.summary}</p>
            </div>

            <div className="space-y-3">
              {selectedStory.steps.map(step => (
                <div key={step.step_num} className="p-4 bg-white rounded-2xl border border-slate-200 flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                    {step.step_num}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-slate-900 text-sm">{step.title}</h5>
                    <p className="text-xs text-slate-600 mt-1">{step.description}</p>
                    <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-emerald-700 font-semibold mt-2 flex items-center gap-1.5">
                      <i data-lucide="volume-2" className="w-3.5 h-3.5"></i>
                      <span>{step.audio_tip}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onSpeak(`${step.title}. ${step.description}. Tip: ${step.audio_tip}`)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-100 text-emerald-700"
                    title="Read Step Aloud"
                  >
                    <i data-lucide="volume-2" className="w-4 h-4"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: AAC Communication Board Modal ---
function AACBoardModal({ items, onClose, onSpeak }) {
  const [sentence, setSentence] = useState([]);

  const handleTap = (label) => {
    setSentence(prev => [...prev, label]);
    onSpeak(label);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto border border-emerald-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <i data-lucide="message-square" className="w-5 h-5 text-emerald-600"></i>
            <h3 className="font-bold text-slate-900 text-lg font-outfit">AAC Communication Board</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
            <i data-lucide="x" className="w-4 h-4"></i>
          </button>
        </div>

        {/* Sentence Strip */}
        <div className="my-4 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3">
          <div className="flex-1 flex flex-wrap items-center gap-1.5 min-h-[32px]">
            {sentence.length === 0 ? (
              <span className="text-xs text-slate-400 font-medium italic">Tap cards below to form your sentence...</span>
            ) : (
              sentence.map((w, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-white rounded-lg text-xs font-bold text-emerald-900 shadow-xs border border-emerald-200">
                  {w}
                </span>
              ))
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSpeak(sentence.join(' '))}
              className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-700"
            >
              <i data-lucide="volume-2" className="w-3.5 h-3.5"></i> Speak
            </button>
            <button
              onClick={() => setSentence([])}
              className="p-1.5 bg-white text-slate-500 rounded-xl text-xs hover:bg-slate-100 border"
              title="Clear Strip"
            >
              <i data-lucide="trash-2" className="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        {/* AAC Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map(card => (
            <button
              key={card.id}
              onClick={() => handleTap(card.label)}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all hover:scale-105 shadow-xs ${card.color}`}
            >
              <span className="font-bold text-xs">{card.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: Identify Person (OpenCV Powered Face Scanner HUD) Modal ---
function FaceScannerModal({ contacts, onClose, onSelectPerson }) {
  const [scanMode, setScanMode] = useState("presets"); // 'webcam', 'presets', 'upload'
  const [selectedPersonIndex, setSelectedPersonIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [cvResult, setCvResult] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);

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

  // Trigger initial scan when switching contact or opening
  useEffect(() => {
    if (scanMode === 'presets' && targetPerson) {
      runOpenCVScan(targetPerson.avatar_url, targetPerson.id);
    }
  }, [selectedPersonIndex, scanMode]);

  // Webcam setup
  const startWebcam = async () => {
    setScanMode('webcam');
    setWebcamActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert("Webcam access not granted or unavailable. Switching to Preset Scanner mode.");
      setScanMode('presets');
      setWebcamActive(false);
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

  const captureWebcamFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
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
        setScanMode('upload');
        runOpenCVScan(dataUrl, null);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white w-full max-w-4xl max-h-[95vh] rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col border border-blue-500/40 relative overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/40">
              <i data-lucide="scan-face" className="w-5 h-5"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-lg font-outfit">PRISM OpenCV Face Scanner</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-900/80 text-blue-300 border border-blue-700">
                  OpenCV {cvResult?.opencv_version || "v5.0"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Haar Cascade Frontal Face + Eye + Smile Real-time Analysis Engine
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopWebcam();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <i data-lucide="x" className="w-4 h-4"></i>
          </button>
        </div>

        {/* Scanner Source Selector Tabs */}
        <div className="flex items-center gap-2 my-4 flex-wrap">
          <button
            onClick={() => {
              stopWebcam();
              setScanMode('presets');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              scanMode === 'presets'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <i data-lucide="users" className="w-3.5 h-3.5"></i> Contact Presets
          </button>

          <button
            onClick={startWebcam}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              scanMode === 'webcam'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <i data-lucide="video" className="w-3.5 h-3.5"></i> Live Webcam
          </button>

          <button
            onClick={() => {
              stopWebcam();
              if (fileInputRef.current) fileInputRef.current.click();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              scanMode === 'upload'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <i data-lucide="upload" className="w-3.5 h-3.5"></i> Upload Photo
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Main Viewfinder Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Viewfinder Canvas (2 Columns) */}
          <div className="lg:col-span-2 relative h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-blue-900 shadow-inner">
            
            {/* 1. Live Webcam Feed */}
            {scanMode === 'webcam' && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {/* 2. Preset Contact Image */}
            {scanMode === 'presets' && targetPerson && (
              <img
                src={targetPerson.avatar_url}
                className="w-full h-full object-cover filter brightness-95"
                alt={targetPerson.name}
              />
            )}

            {/* 3. Uploaded Image */}
            {scanMode === 'upload' && uploadedImage && (
              <img
                src={uploadedImage}
                className="w-full h-full object-cover filter brightness-95"
                alt="Uploaded Face"
              />
            )}

            <canvas ref={canvasRef} className="hidden" />

            {/* HUD Target Box Over Face */}
            <div
              className="absolute border-2 border-blue-400/90 rounded-xl flex flex-col justify-between p-2 shadow-2xl shadow-blue-500/30 transition-all duration-300"
              style={{
                left: cvResult?.primary_face?.bounding_box?.x ? `${cvResult.primary_face.bounding_box.x}%` : '25%',
                top: cvResult?.primary_face?.bounding_box?.y ? `${cvResult.primary_face.bounding_box.y}%` : '18%',
                width: cvResult?.primary_face?.bounding_box?.width ? `${cvResult.primary_face.bounding_box.width}%` : '50%',
                height: cvResult?.primary_face?.bounding_box?.height ? `${cvResult.primary_face.bounding_box.height}%` : '62%'
              }}
            >
              <div className="hud-corner hud-tl"></div>
              <div className="hud-corner hud-tr"></div>
              <div className="hud-corner hud-bl"></div>
              <div className="hud-corner hud-br"></div>
              
              {/* Animated Scanline */}
              <div className="hud-scanline"></div>

              <div className="flex items-center justify-between text-[10px] font-mono text-blue-300 bg-slate-950/80 px-2 py-0.5 rounded">
                <span>OPENCV-HAAR</span>
                <span>CONF: {((cvResult?.confidence || 0.98) * 100).toFixed(1)}%</span>
              </div>

              {/* Landmark Tag Crosshairs */}
              <div className="flex items-center justify-center">
                <span className="text-[10px] font-mono bg-blue-600/95 text-white px-2.5 py-0.5 rounded-full backdrop-blur-sm shadow-md">
                  Target: {cvResult?.matched_person?.name || targetPerson?.name}
                </span>
              </div>
            </div>

            {/* Webcam Live Capture Button */}
            {scanMode === 'webcam' && (
              <button
                onClick={captureWebcamFrame}
                className="absolute bottom-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-emerald-500 flex items-center gap-1.5 backdrop-blur-md"
              >
                <i data-lucide="camera" className="w-4 h-4"></i> Capture & OpenCV Detect
              </button>
            )}

          </div>

          {/* OpenCV Telemetry & Analysis Panel (1 Column) */}
          <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">OpenCV Telemetry</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400">Faces Detected:</span>
                  <span className="font-bold text-white">{cvResult?.faces_detected_count || 1} Face</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400">Eyes Localized:</span>
                  <span className="font-bold text-emerald-400">{cvResult?.primary_face?.eyes_count || 2} Detected</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400">Expression / Smile:</span>
                  <span className="font-bold text-amber-300">
                    {cvResult?.primary_face?.smile_detected ? "Smiling / Friendly" : "Neutral / Focused"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400">Confidence Match:</span>
                  <span className="font-bold text-blue-300">
                    {((cvResult?.confidence || 0.98) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Cycle Controls */}
            {scanMode === 'presets' && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    const nextIdx = (selectedPersonIndex + 1) % contacts.length;
                    setSelectedPersonIndex(nextIdx);
                  }}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <i data-lucide="refresh-cw" className="w-3.5 h-3.5"></i> Next Familiar Contact
                </button>
              </div>
            )}
          </div>

        </div>

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
                  Setting: {cvResult.matched_person.context} • Last met: {cvResult.matched_person.last_met}
                </p>
              </div>

              <button
                onClick={() => onSelectPerson(cvResult.matched_person)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 shadow-md flex items-center gap-1.5"
              >
                <i data-lucide="book-open" className="w-3.5 h-3.5"></i> Open Memory Cue Card
              </button>
            </div>

            {/* Distinctive Visual Cues */}
            <div>
              <span className="text-[11px] font-bold text-blue-300 block mb-1">Distinctive Visual Anchors (Face Memory):</span>
              <div className="flex flex-wrap gap-1.5">
                {cvResult.matched_person.visual_cues.map((cue, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-blue-900/60 text-blue-200 border border-blue-700/50">
                    🔍 {cue}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Conversation Starters */}
            {cvResult.conversation_starters && (
              <div className="pt-2 border-t border-slate-700/60">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Suggested Conversation Starters:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {cvResult.conversation_starters.map((starter, i) => (
                    <div key={i} className="p-2 bg-slate-900/70 rounded-lg text-xs text-slate-200 border border-slate-700/50">
                      💬 "{starter}"
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
function PersonProfileModal({ person, onClose, onSpeak }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col border border-blue-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Memory Cue Card</span>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
            <i data-lucide="x" className="w-4 h-4"></i>
          </button>
        </div>

        {/* Profile Card Header (from image.webp) */}
        <div className="flex items-center gap-5 my-5">
          <img
            src={person.avatar_url}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-200 shadow-md"
            alt={person.name}
          />
          <div>
            <h3 className="text-2xl font-bold text-slate-900 font-outfit">{person.name}</h3>
            <p className="text-sm font-semibold text-blue-700">{person.role}</p>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span>Met {person.met_count} times</span>
              <span>•</span>
              <span>Last Met: {person.last_met}</span>
            </div>
          </div>
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
              {person.visual_cues.map((cue, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                  {cue}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-800 block mb-0.5">Voice & Behavioral Clues:</span>
            <span className="text-slate-600">{person.voice_cues.join(' • ')}</span>
          </div>

          <div>
            <span className="font-bold text-slate-800 block mb-0.5">Important Reminder / Discussion:</span>
            <span className="text-blue-900 font-medium">{person.reminder}</span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => onSpeak(`${person.name}, ${person.role}. Visual cues include: ${person.visual_cues.join(', ')}. Reminder: ${person.reminder}`)}
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
function CopilotModal({ messages, input, setInput, onSend, isListening, onStartListening, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col h-[80vh] border border-purple-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white p-1 border border-purple-200 flex items-center justify-center shadow-xs overflow-hidden">
              <img src="/static/assets/logo_cropped.png" alt="PRISM Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base font-outfit">PRISM Adaptive AI Copilot</h3>
              <span className="text-[10px] text-emerald-600 font-semibold">Online & Context-Aware</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
            <i data-lucide="x" className="w-4 h-4"></i>
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>

              {m.suggestions && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.suggestions.map((s, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => onSend(s)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
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
            className="flex-1 p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-200"
          />
          <button
            onClick={onStartListening}
            className={`p-3 rounded-xl border transition-colors ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-700 hover:bg-purple-50'
            }`}
            title="Speech Input (Microphone)"
          >
            <i data-lucide="mic" className="w-4 h-4"></i>
          </button>
          <button
            onClick={() => onSend()}
            className="px-4 py-3 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700"
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

// Mount React Root
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
