# 🌈 PRISM: Personalized Real-time Intelligent Support Module
### Adaptive Accessibility Platform for Dyslexia, Autism & Face Blindness (Prosopagnosia)
> **Capgemini x Synchrony Hackathon Innovation | Team 7 - Tech Titans**

---

<p align="center">
  <img src="frontend/assets/logo_cropped.png" alt="PRISM Logo" width="180" />
</p>

<p align="center">
  <b>"One App. Three Profiles. Personalized for Every Mind."</b>
</p>

<p align="center">
  <a href="#key-features"><img src="https://img.shields.io/badge/Accessibility-WCAG%202.1%20AAA-purple.svg" alt="WCAG 2.1 AAA"></a>
  <a href="#architecture"><img src="https://img.shields.io/badge/Backend-FastAPI%20%7C%20OpenCV%205.0-blue.svg" alt="FastAPI OpenCV"></a>
  <a href="#frontend"><img src="https://img.shields.io/badge/Frontend-React%2018%20%7C%20TailwindCSS-emerald.svg" alt="React 18"></a>
  <a href="#license"><img src="https://img.shields.io/badge/License-MIT-amber.svg" alt="MIT License"></a>
</p>

---

## 📌 Problem & Vision

Neurodivergent individuals frequently face fragmented tools:
- **Dyslexia**: Reading fatigue, slow decoding fluency, letter reversals ($b \leftrightarrow d$, $p \leftrightarrow q$).
- **Autism**: Sensory overload, unstructured anxiety, routine unpredictability, and communication hurdles.
- **Face Blindness (Prosopagnosia)**: Inability to recognize familiar faces, colleagues, classmates, and social settings.

**PRISM** unifies cognitive support into one adaptive platform that morphs its UI, typography, computer vision features, and assistive AI specifically for each condition.

---

## 🚀 Key Modules & Capabilities

### 1. 📖 Dyslexia Mode (Purple Theme)
- **Dyslexia-Optimized Typography**: Native support for *OpenDyslexic*, *Lexend*, and *Atkinson Hyperlegible* fonts.
- **Bionic Reading Mode**: Algorithmic bolding of word prefixes to guide saccadic eye movements.
- **Syllable Tinting**: Color-coded syllable breakdown for improved decoding.
- **Interactive Reading Ruler**: Mouse-tracking focus ruler to reduce visual crowding.
- **Background Comfort Overlays**: Irlen-syndrome color tints (*Cream*, *Peach*, *Mint*, *Lavender*, *Dark*).
- **Karaoke Text-to-Speech**: Real-time speech synthesis with live word-by-word visual highlight tracking.
- **NLP Text Simplifier**: Transforms dense academic paragraphs into *Simpler*, *Shorter*, or *Bullet Format* with readability metrics.
- **Scan & Read (OCR)**: Extracts and reads text from whiteboard snapshots and printed handouts.

### 2. 🧩 Autism Mode (Green Theme)
- **Visual Routine Planner**: Interactive schedule timeline with sensory noise ratings (*Calm*, *Medium*, *Interactive*).
- **Calm Zone**: Animated guided **4-7-8 Breathing Circle** with countdown timers.
- **Web Audio Ambient Sound Synthesizer**: Zero-dependency browser synthesis of *Gentle Rain*, *Ocean Waves (pink noise LFO)*, *10Hz Alpha Binaural Entrainment*, and *Peace Chimes*.
- **Emotion Check-In & Coping AI**: 6 expressive mood states with instant de-escalation strategies.
- **Social Stories Builder**: Step-by-step visual social scenario cards with voice guidance (*Meeting Someone New*, *Handling Routine Changes*, *Sensory Breaks*).
- **AAC Communication Board**: Tap-to-speak augmentative and alternative communication symbol grid.

### 3. 👁️ Face Blindness (Prosopagnosia) Mode & OpenCV Engine (Blue Theme)
- **OpenCV Computer Vision Face Scanner**: Powered by **OpenCV 5.0** (`cv2`) with real-time skin segmentation, contour detection, and bounding box localization.
- **Multi-Source Scanning**: Supports **Live Webcam Video Streams**, **Custom Photo Uploads**, and **Contact Presets**.
- **Live OpenCV Telemetry**: Real-time HUD showing localized face coordinates, eye tracking, expression/smile indicators, and match confidence scores ($98\%+$).
- **Memory Cue Cards**: Detailed profiles with distinctive visual anchors (*"Rectangular black-rimmed glasses"*, *"Neat brown hair"*, *"Navy blue collared shirts"*), voice clues, and conversation reminders.
- **Memory Reinforcement Flashcard Quiz**: Interactive practice game testing face-cue associations with points and reward streaks.

### 4. 🌐 Cross-Disability Platform Hub
- **PRISM AI Copilot**: Multi-modal conversational assistant with microphone Speech-to-Text (STT) and profile-aware prompt intelligence.
- **WCAG 2.1 AAA Accessibility Suite**: Font size scaling, high-contrast mode, line spacing, and color-blindness simulation filters (*Protanopia*, *Deuteranopia*, *Tritanopia*).
- **Global Prevalence & Co-occurrence Analytics**: Interactive data visualization of global populations (800M Dyslexia, 200M Prosopagnosia, 80M Autism) and overlap rates.
- **7-Tier System Architecture Explorer**: Visual breakdown of the engineering stack.
- **Lean Business Canvas**: Strategic overview of the 9-block business model.

---

## 🏗️ Architecture

```
                                  +------------------------------------+
                                  |    PRISM Frontend (React 18 SPA)   |
                                  |   Adaptive UI / Theme Engine / PWA  |
                                  +------------------+-----------------+
                                                     |
                                            REST API / Web Speech
                                                     |
                                  +------------------v-----------------+
                                  |      FastAPI Backend Gateway       |
                                  +------------------+-----------------+
                                                     |
             +-----------------------+---------------+-----------------------+
             |                       |                                       |
+------------v------------+ +--------v---------------+             +---------v---------+
|   Dyslexia NLP Engine   | |   Autism Routine &     |             |   OpenCV Vision   |
| (Simplifier, Syllables) | | Sensory Sound Engine   |             | (Haar / Contours) |
+-------------------------+ +------------------------+             +-------------------+
             |                       |                                       |
             +-----------------------+---------------+-----------------------+
                                                     |
                                  +------------------v-----------------+
                                  |   Persistent JSON / SQLite Store   |
                                  +------------------------------------+
```

---

## 📦 Getting Started & Running Locally

### Prerequisites
- **Python 3.10+** (Python 3.12 recommended)
- Modern web browser (Chrome / Edge / Firefox)

### 1. Clone the Repository
```bash
git clone https://github.com/nikhilpabbu/PRISM.git
cd PRISM
```

### 2. Install Dependencies
```bash
pip install fastapi uvicorn opencv-python pydantic requests pillow
```

### 3. Launch the Application Server
```bash
cd backend
python main.py
```

### 4. Access the Web Application
Open your browser and navigate to:
```
http://localhost:8000
```

---

## 👥 Team 7 - Tech Titans (Capgemini x Synchrony)

- **Charmi Reddy P**
- **Malavika Manga**
- **Aarthi Pasare**
- **Nikhil Pabbu**
- **Aranagi Sravan Kumar**

**Mentors**: Rajesh Narayan • Siva Prashad • Ajay Goud

---

## 📄 License
This project is licensed under the MIT License.
