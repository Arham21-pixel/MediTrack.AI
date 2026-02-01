# MediTrack.io

## Problem statement (2–3 lines)
Medication instructions and lab reports are hard to understand, causing missed doses and delayed care. Families need shared visibility without overwhelming patients. MediTrack AI translates medical data into clear actions and daily adherence tracking.

## Users & context
- Patients managing prescriptions and lab reports (especially seniors).
- Caregivers and family members coordinating care.
- Clinicians/health organizations exploring patient-friendly insights.

## Solution overview
MediTrack AI provides a dashboard that digitizes prescriptions, summarizes lab reports, and tracks adherence with reminders and timelines. A demo/guest mode supports quick trials while logged-in users unlock full features.

Data flow (simplified):
User Upload → API (FastAPI) → AI Parsing → Normalized Data → Dashboard & Reminders

## Setup & run (steps)
Frontend:
1) cd frontend/MediTrack
2) npm install
3) npm run dev
4) Open http://localhost:3000

Backend:
1) cd frontend/MediTrack/meditrack-backend
2) python -m pip install -r requirements.txt
3) python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
4) API base: http://localhost:8000

## Models & data (sources, licenses)
- AI parsing uses OpenAI-compatible endpoints (FastRouter). See provider terms for usage and licensing.
- Mock data for local development is stored in meditrack-backend/mock_data.json.
- No proprietary datasets bundled in this repo; any uploaded user data remains local to the running instance.

## Evaluation & guardrails (hallucination/bias mitigations)
- Clear UI labeling of AI outputs as suggestions.
- Structured parsing with validation to reduce hallucinations.
- Conservative defaults and fallbacks when extraction confidence is low.
- Manual review encouraged for medical decisions.

## Known limitations & risks
- AI summaries can be inaccurate; not a substitute for clinician advice.
- Demo/guest mode uses local storage and is not multi-device persistent.
- OCR quality depends on image clarity.
- Reminder delivery depends on external integrations (if enabled).

## Team (names, roles, contacts)
Team: Rising High
- Priyal Khunia — Frontend + UI/UX — Contact: priyal.khunia@risinghigh.dev
- Arham Boonlia — Backend + Database — Contact: arham.boonlia@risinghigh.dev
