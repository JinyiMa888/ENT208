# ResumeBoost · AI-Powered Resume Optimization Platform

> A bilingual (EN / 中文) all-in-one job-hunting assistant: AI resume analysis, job matching, resume rewriting, and mock interviews — all in one place.

🌐 **Live Demo**: https://resume-angel-55.lovable.app

---

## ✨ Key Features

| Module | Description |
| --- | --- |
| 📄 **Resume Upload & Parsing** | Supports PDF / DOCX, auto-extracts text and stores it in the cloud |
| 🎯 **Job Matching Analysis** | AI compares your resume against job descriptions and returns a match score, dimensional breakdown, and improvement suggestions |
| 💼 **Job Recommendations** | 50+ Fortune 500 roles built in (with a dedicated Logistics / Supply Chain track), intelligently ranked by AI based on your resume |
| ✍️ **Resume Rewriting** | One-click rewrite tailored to a target role, highlighting keywords and quantified achievements |
| 🎤 **Mock Interview** | AI interviewer asks questions in rounds with real-time feedback, available in both Chinese and English |
| 🌍 **Bilingual Support** | UI, job database, and AI output can all be switched between EN / 中文 with a single click |
| 📚 **History** | Every analysis is saved so you can revisit and compare results anytime |

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite 5 + TypeScript 5
- **Styling**: Tailwind CSS v3 + shadcn/ui
- **Backend**: Lovable Cloud (managed Supabase: PostgreSQL + Auth + Storage + Edge Functions)
- **AI**: Lovable AI Gateway (defaults to `google/gemini-3-flash-preview`, no user-provided API key required)
- **Routing / State**: React Router + TanStack Query

---

## 📦 Project Structure

```
src/
├── components/        # Shared components (Navbar, LanguageToggle, ResumeUploader, ...)
├── hooks/             # useAuth / useLanguage / useResumeText
├── pages/             # Route pages
│   ├── Index.tsx          # Landing page
│   ├── AuthPage.tsx       # Sign in / Sign up
│   ├── DashboardPage.tsx  # Workspace
│   ├── JobsPage.tsx       # Job listings + AI recommendations
│   ├── MatchPage.tsx      # Resume ↔ Job matching analysis
│   ├── RewritePage.tsx    # Resume rewriting
│   ├── InterviewPage.tsx  # Mock interview
│   └── HistoryPage.tsx    # History records
├── integrations/supabase/ # Auto-generated client / types (do NOT edit manually)
└── lib/                   # Utilities (e.g. resume export)

supabase/
├── functions/         # Edge Functions
│   ├── analyze-resume/
│   ├── match-resume-job/
│   ├── recommend-jobs/
│   ├── rewrite-resume/
│   └── interview-coach/
└── migrations/        # Database migration scripts
```

---

## 🗄️ Database Tables

| Table | Purpose |
| --- | --- |
| `profiles` | Basic user information |
| `user_roles` | User roles (kept in a separate table to prevent privilege escalation) |
| `resume_analyses` | Resume analysis history |
| `job_listings` | Bilingual job library (with `_en` suffixed columns) |

All tables have **Row-Level Security (RLS)** enabled so users can only access their own data.

---

## 🌍 Bilingual System

- **EN / 中** toggle in the top-right corner
- All UI copy is centralized via the `useLanguage()` hook
- Job database stores both Chinese and English fields (e.g. `job_title` / `job_title_en`)
- AI requests pass the description in the active language so the AI output matches the UI

---

## 🚀 Local Development

```bash
# Install dependencies
bun install   # or npm install

# Start dev server
bun run dev   # or npm run dev

# Build for production
bun run build
```

> Lovable Cloud automatically provisions `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, etc.) — no manual setup required.

---

## 🔐 Authentication

- Email + password sign-up / sign-in
- Email verification is required before signing in
- Protected routes use `<ProtectedRoute>` to automatically redirect to the auth page

---

## 🤖 AI Capabilities

| Edge Function | Purpose |
| --- | --- |
| `analyze-resume` | Parses uploaded resume text |
| `match-resume-job` | Deep matching analysis between resume and job |
| `recommend-jobs` | Scores and ranks jobs from the library based on the resume |
| `rewrite-resume` | Optimizes the resume for a target role |
| `interview-coach` | Mock interview Q&A and feedback |

All functions run through the Lovable AI Gateway — **no user-supplied API key required**.

---

## 📌 Demo Highlights

This project ships with extra content for the **Logistics / Supply Chain** vertical. The job library includes bilingual JDs from well-known employers such as DHL, Maersk, JD Logistics, SF International, COSCO Shipping, Cainiao, Apple Global Supply Chain, and UPS — perfect for international demos.

---

## 📄 License

MIT
