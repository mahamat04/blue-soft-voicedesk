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

## Free hackathon deployment

For a no-cost demo, deploy the Next.js app to Vercel and the FastAPI backend
using the root `render.yaml` Blueprint:

1. Push this project to a GitHub repository, then create the Render service
   from that repository's Blueprint. Supply `GROQ_API_KEY`,
   `GRADIUM_API_KEY`, and a temporary `FRONTEND_ORIGIN` when prompted.
2. In Vercel, import the same repository and set the project Root Directory to
   `frontend`. Add `BACKEND_URL` with the public Render service URL
   (`https://<service>.onrender.com`), then deploy.
3. Update Render's `FRONTEND_ORIGIN` to the deployed Vercel origin
   (`https://<project>.vercel.app`) and redeploy the backend.
4. Verify the backend `/health` reports `"status": "ok"` and test one complete
   French and English voice conversation.

This free setup is for a hackathon/demo, not an always-on production service.
Render Free puts an idle backend to sleep after 15 minutes; its next request
can take about a minute while it starts again. Free hosting does not remove
Gradium/Groq usage quotas or protect public endpoints from abuse. Keep API keys
only in provider dashboards and set provider spending/usage limits. Vercel's
Hobby plan is restricted to personal, non-commercial use.

## Checks

```powershell
# From backend/
python -m unittest discover -s tests -v

# From frontend/
npm run lint
npm run build
npm audit --omit=dev
```

The backend tests mock provider calls; they do not spend API credits. A manual
release check should also test microphone permission, French and English
transcription and speech, pause detection, recovery after provider errors, and
the **Terminer** control on both desktop and mobile.

## Hackathon demo checklist

- Verify the registered Gradium account has enough STT/TTS credits.
- Demonstrate one complete French turn and one English turn, including spoken
  replies and automatic re-listening.
- Explain the pause-triggered interaction and that the implementation uses
  Gradium for both STT and TTS.
- Use the registered builder's submission link and kickoff-email password;
  confirm the final public demo URL works over HTTPS before submitting.

The public challenge page does not publish its detailed judging rubric; confirm
submission instructions and any additional requirements in the registered
builder's kickoff email.
