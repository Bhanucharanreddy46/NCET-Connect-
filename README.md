# NCET Connect — Integrated Smart Campus & Opportunity Ecosystem

[![Build & Deploy](https://github.com/Bhanucharanreddy46/NCET-Connect-/actions/workflows/deploy.yml/badge.svg)](https://github.com/Bhanucharanreddy46/NCET-Connect-/actions/workflows/deploy.yml)
[![React](https://img.shields.io/badge/React-19.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Offline_First-success?logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

> **One Campus. One Platform. Endless Opportunities.**

**NCET Connect** is a unified Smart Campus engagement, opportunity discovery, and peer collaboration platform designed specifically for the students, faculty, clubs, and administrators of **Nagarjuna College of Engineering and Technology (NCET)**.

---

## 🌟 The Engagement Revamp

The platform is designed around a **goal-based student journey**, organizing campus life into five intuitive primary spaces with zero navigation clutter:

1. **Discover** — Find internships, hackathons, workshops, fests, and research projects.
2. **Connect** — Meet peers who share technical interests and complementary skills through privacy-first Campus Circles.
3. **Grow** — Learn together in campus study circles, earn verified honors badges, and level up skills.
4. **Participate** — Join discussions, vote in campus polls, and attend venue events with instant passcode check-in.
5. **Track** — Monitor internship applications, saved bookmarks, and encrypted document credentials in one unified pipeline.

---

## 🧭 Navigation Architecture

```text
NCET Connect
├── 📱 5 Core Student Spaces
│   ├── 🏠 Home         → Personalized discovery, hero action jumps, campus highlights, recommended feed
│   ├── 🧭 Explore      → 6-category engine (Opportunities, Events, People, Communities, Projects, Learning)
│   ├── 👥 Community    → Nova AI mascot, Anonymous Polls, Discussions Feed, Synergy Cards & Chat
│   ├── 💼 My Journey   → Application tracker, Saved items, Attendance Passport & AES-GCM Encrypted Safe
│   └── 👤 Profile      → Verified credentials (@ncetmail.com, USN), Skills & Interests, 11 Badges
├── 🏛️ Workspaces
│   ├── 📋 Organizer Portal → Club switcher, event draft-publish workflow, venue passcodes & attendee roster
│   └── 🛡️ Admin Console    → Ingestion queue, application management desk, event approvals & turnout insights
└── 📱 Mobile Bottom Bar     → Quick thumb navigation across the 5 primary student spaces
```

---

## 🚀 Key Modules & Capabilities

### 1. Personalized Discovery Homepage (`Home`)
- **Welcoming Hero & Next Steps:** Contextual greeting tailored to the student (e.g., *"Hey, Priya! What's happening in your campus today?"*) with three goal-directed jump triggers: *Explore Opportunities*, *Connect with Peers*, and *Track My Journey*.
- **Horizontal Campus Highlights Scroller:** Compact, visual carousel featuring high-urgency activities (Hackathons with deadlines, workshops, campus fests) with bookmarking and 1-click apply.
- **Explainable Multi-Objective Recommendations:** Suggested cards with transparent fit scoring:
  $$\text{Score} = 0.30\text{SkillFit} + 0.20\text{InterestFit} + 0.15\text{DeptFit} + 0.15\text{AvailFit} + 0.10\text{LocationFit} + 0.10\text{UrgencyFit}$$
  Every card articulates why it is recommended (e.g., *"Matches your ReactJS and TypeScript skills and aligns with your AI/ML interest"*).
- **Active Community Pulse:** Live campus polls, trending peer discussions, and featured peer match previews.
- **Personal Progress Overview:** Quick summary of active applications, saved items, and verified attendance count.

### 2. Central 6-Category Discovery Engine (`Explore`)
Unified search and filter engine across 6 core campus domains:
- **Opportunities:** Curated internships, hackathons, and research assistantships.
- **Events:** Campus technical workshops, cultural fests, and developer meetups (GDG, PyData, Luma).
- **People:** Interest-aligned student collaborators filtered by connection intent.
- **Communities:** Department-wide technical chapters (Google Developer Groups, CodeChef, Robotics Club, E-Cell).
- **Projects:** Open-source campus repositories, capstone projects, and innovation challenges.
- **Learning:** Student-led study circles with scheduled meeting cadences and resource repositories.

### 3. Community Hub & Campus Circles (`Community`)
- **Nova Mascot Identity:** The NCET Falcon guiding students across four pillars: *Curiosity*, *Collaboration*, *Learning*, and *Discovery*.
- **Find Your People (Synergy Matching):** Privacy-first peer cards showing complementary skills, shared interests, and match scores without exposing real names.
- **Aggregate Campus Polls:** Student voice widget with animated voting percentages and instant feedback.
- **Anonymous Discussions Feed:** Departmental and campus life discussions under pseudonymous handles with upvoting, threaded replies, and content reporting.
- **In-App Anonymous Chat:** End-to-end peer messaging with safety flagging and a two-way mutual-consent identity reveal.

### 4. My Journey & Attendance Passport (`My Journey`)
- **Applications Pipeline:** Real-time status tracker (`applied`, `shortlisted`, `selected`, `rejected`, `withdrawn`) with withdraw actions.
- **Saved Bookmarks:** Fast-access drawer for bookmarked opportunities.
- **Verified Attendance Passport:** Digital transcript of verified event attendance records. Features a **Live Venue Passcode Desk** allowing students to check in using 6-digit codes (`GDG782`, `ROBO99`) provided at event registration desks.
- **Client-Side AES-GCM Encrypted Vault:** Secure repository for resumes, transcripts, and certificates encrypted in the browser using the Web Crypto API.
- **Honors & Recognition Badges:** Visual gallery of 11 verified badges and a positive campus participation leaderboard.

### 5. 4-Step Interactive Onboarding Wizard
- Step 1: **Academic Profile** (Department & Academic Year)
- Step 2: **Technical Stack** (Language and framework selections)
- Step 3: **Semester Ambitions** (Internships, hackathons, research, open-source)
- Step 4: **Community Circles** (Preferred learning groups and connection intents)

### 6. Organizer Portal & Admin Console
- **Organizer Desk:** Switch between student clubs, draft and publish campus opportunities, configure venue check-in codes, view live attendee rosters, and export CSV attendance sheets.
- **Admin Console:** Moderation queue, application management desk, external event ingestion (Luma, Devfolio, Meetup), and departmental engagement analytics.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Core Framework** | React 19, TypeScript 5+, Vite 8 |
| **Styling & Design** | Tailwind CSS v4, Lucide React Icons |
| **PWA & Offline** | Vite Plugin PWA, Workbox Service Worker, LocalStorage v3 Cache |
| **Security & Crypto** | Web Crypto API (`AES-GCM-256`), WebAuthn Biometric Passkeys |
| **Deployment** | GitHub Pages via GitHub Actions CI/CD |

---

## 💻 Getting Started Locally

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Bhanucharanreddy46/NCET-Connect-.git
   cd NCET-Connect-
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Verify TypeScript & Production Build:**
   ```bash
   npx tsc --noEmit
   npx vite build --base=/NCET-Connect-/
   ```

---

## 🔒 Security & Privacy Principles

1. **Institutional Verification:** Student registration is restricted to official `@ncetmail.com` domains.
2. **Decoupled Privacy in Campus Circles:** Pseudonymous community aliases (`@QuantumBadger_482`) are decoupled from institutional records (`USN: 1NC23CS094`, real names, official emails).
3. **Mutual-Consent Identity Disclosure:** Real contact information is never exposed without explicit two-way opt-in consent from both students.
4. **Client-Side Document Encryption:** Vault documents are encrypted using AES-GCM-256 keys derived locally in the user's browser.
5. **Non-Stigmatizing Analytics:** Analytics measure departmental turnout and opportunity category demand without ranking or labeling individual students.

---

## 📄 License & Attribution

Developed for **Nagarjuna College of Engineering and Technology (NCET)**.  
Distributed under the MIT License.
