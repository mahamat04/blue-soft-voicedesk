# Blue Soft VoiceDesk

Blue Soft VoiceDesk is a bilingual (French/English) voice assistant. Aïcha
listens while the user speaks, detects a short pause, transcribes the utterance
with Gradium, generates an answer with Groq, and speaks it with a language-
matched Gradium voice. After speaking, it automatically resumes listening.

## Architecture

- `frontend/`: Next.js App Router UI and same-origin API proxies.
- `backend/`: FastAPI API, Groq chat completion, and Gradium speech services.
- Voice turn: browser microphone via AudioWorklet → pause detection → 24 kHz
  mono WAV → Gradium STT → Groq response → French or English Gradium TTS →
  browser playback.
- Spoken replies use concise conversational wording, language-matched text
  rewriting, and a slightly slower Gradium delivery setting. For a distinct
  assistant voice, audition a Gradium Voice Design voice and configure its
  resulting voice ID before release; model fine-tuning is not required.

The current voice loop is **pause-triggered turn taking**, not continuous
streaming recognition: each utterance is uploaded as one bounded audio request.
This MVP keeps microphone capture in the browser and API credentials on the
backend.

## Local development (Windows PowerShell)

1. Configure and start the backend:

   ```powershell
   cd backend
   py -3.13 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   Copy-Item .env.example .env
   # Add GROQ_API_KEY and GRADIUM_API_KEY to backend/.env.
   python -m unittest discover -s tests -v
   uvicorn main:app --reload
   ```

2. In a second terminal, configure and start the frontend:

   ```powershell
   cd frontend
   npm ci
   Copy-Item .env.example .env.local
   npm run dev
   ```

3. Open <http://localhost:3000>. Microphone access requires HTTPS in production
   (localhost is allowed for development). Click the microphone once, speak,
   then pause briefly; use **Terminer** to end the hands-free conversation.

## Production configuration

- Deploy the frontend and backend as separate services.
- Set `BACKEND_URL` in the frontend to the private/reachable FastAPI URL.
- Set `FRONTEND_ORIGIN` in the backend to the exact public frontend origin.
- Configure the provider keys and voice IDs in the backend environment only.
  Never prefix provider secrets with `NEXT_PUBLIC_` or commit `.env` files.
- Serve the UI over HTTPS and configure provider quotas and request rate limits
  at the edge/API gateway before exposing the public voice endpoints.
- Configure health monitoring against `/health`; a `degraded` status means one
  or more required providers are not configured.

## Vercel frontend and backend projects

If the frontend and FastAPI backend are deployed as separate Vercel projects:

1. Set the backend project's Root Directory to `backend` and deploy it.
   Confirm `https://<backend-project>.vercel.app/health` returns a healthy
   response.
2. In the frontend Vercel project's Environment Variables, set `BACKEND_URL`
   to `https://<backend-project>.vercel.app` (the base URL only, without
   `/api`), for Production and Preview as needed.
3. Redeploy the frontend after saving the variable. Environment-variable
   changes do not apply retroactively to an existing deployment.
