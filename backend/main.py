import base64
import gradium
import logging
import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import AsyncGroq, APIConnectionError, APIStatusError, RateLimitError
from pydantic import BaseModel, Field

load_dotenv(Path(__file__).resolve().with_name(".env"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voicedesk")

app = FastAPI(
    title="Blue Soft VoiceDesk API",
    description="AI-powered voice assistant backend for Blue Soft.",
    version="1.0.0",
)

# Allow requests from the Next.js frontend.
frontend_origin = os.getenv(
    "FRONTEND_ORIGIN",
    "http://localhost:3000",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Initialize Groq only when an API key is configured.
groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = (
    AsyncGroq(api_key=groq_api_key)
    if groq_api_key
    else None
)

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-20b",
)

gradium_api_key = os.getenv("GRADIUM_API_KEY")

gradium_client = (
    gradium.client.GradiumClient(api_key=gradium_api_key)
    if gradium_api_key
    else None
)

GRADIUM_VOICE_ID = os.getenv(
    "GRADIUM_VOICE_ID",
    "Bla6SbVMczYnOhfK",
)
GRADIUM_VOICE_ID_FR = os.getenv(
    "GRADIUM_VOICE_ID_FR",
    "J8c9KBRYAGGYwjns",
)

BUSINESS = {
    "name": "Blue Soft",
    "description": (
        "A software development startup providing "
        "digital solutions and related services."
    ),
    "hours": "Monday to Saturday, 9:00 AM to 6:00 PM",
    "services": [
        "Custom software development",
        "Web application development",
        "Technical support",
        "Digital consulting",
    ],
}

SYSTEM_PROMPT = f"""
You are Blue Soft VoiceDesk, the virtual assistant for Blue Soft.

Your role:
- Welcome customers professionally and warmly.
- Answer questions about Blue Soft using the business information below.
- Help customers understand our services.
- Ask concise follow-up questions when necessary.
- Keep answers short and natural because they may be spoken aloud.
- Use conversational spoken phrasing, natural punctuation, and simple sentences.
- In English, use contractions when they sound natural.
- Avoid markdown, bullet points, emojis, and parenthetical asides.
- Reply in the language used by the customer, when possible.
- Never invent prices, appointments, contact details, or company policies.
- If you do not know an answer, say so and offer to connect the
  customer with the business team.
- Do not claim that you have performed an action unless it happened.

Business information:
Name: {BUSINESS["name"]}
Description: {BUSINESS["description"]}
Opening hours: {BUSINESS["hours"]}
Services: {", ".join(BUSINESS["services"])}
""".strip()


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=20,
    )
    language: Literal["en", "fr"] | None = None


class ChatResponse(BaseModel):
    answer: str
    mode: str
    model: str


class AudioTranscriptionRequest(BaseModel):
    audio_base64: str = Field(min_length=1, max_length=14_000_000)
    language: Literal["en", "fr"] = "fr"

@app.get("/")
async def root():
    return {
        "service": "Blue Soft VoiceDesk API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {
        "status": (
            "ok"
            if groq_client is not None and gradium_client is not None
            else "degraded"
        ),
        "service": "voicedesk-api",
        "llm_configured": groq_client is not None,
        "gradium_configured": gradium_client is not None,
    }


@app.get("/api/business")
async def get_business():
    return BUSINESS


@app.post("/api/transcribe")
async def transcribe_audio(request: AudioTranscriptionRequest):
    if gradium_client is None:
        raise HTTPException(
            status_code=503,
            detail="Gradium API key is not configured.",
        )

    try:
        audio_data = base64.b64decode(
            request.audio_base64,
            validate=True,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail="Audio data must be valid base64.",
        ) from exc

    if len(audio_data) > 10_000_000:
        raise HTTPException(
            status_code=413,
            detail="Audio recording is too large. Please record a shorter message.",
        )

    if not audio_data.startswith(b"RIFF") or audio_data[8:12] != b"WAVE":
        raise HTTPException(
            status_code=422,
            detail="Audio must be provided as a WAV recording.",
        )

    try:
        setup: gradium.STTSetup = {
            "model_name": "default",
            "input_format": "wav",
            "json_config": {"language": request.language},
        }
        result = await gradium_client.stt(
            setup=setup,
            audio=audio_data,
        )
        transcript = result.text.strip()
        if not transcript:
            raise HTTPException(
                status_code=422,
                detail="No speech was detected. Please try again.",
            )

        return {"transcript": transcript}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Speech transcription failed")
        raise HTTPException(
            status_code=502,
            detail="Could not transcribe the recording. Please try again.",
        ) from exc


def fallback_answer(message: str, language: Literal["en", "fr"] = "en") -> str:
    """Answer common business questions without an LLM."""
    text = message.casefold()

    if any(word in text for word in (
        "hour", "hours", "opening", "open",
        "horaire", "horaires", "ouvert",
    )):
        if language == "fr":
            return "Nos horaires sont du lundi au samedi, de 9 h à 18 h."
        return (
            f"Our opening hours are {BUSINESS['hours']}."
        )

    if any(word in text for word in (
        "service", "services", "offer", "offre",
        "proposez", "prestation",
    )):
        if language == "fr":
            return (
                "Blue Soft propose des logiciels sur mesure, des applications web, "
                "de l’assistance technique et du conseil numérique."
            )
        return (
            "Blue Soft offers custom software development, "
            "web application development, technical support, "
            "and digital consulting."
        )

    if any(word in text for word in (
        "who are you", "your name", "company",
        "business", "blue soft", "qui êtes-vous",
        "votre nom", "entreprise",
    )):
        if language == "fr":
            return (
                "Bienvenue chez Blue Soft, une startup spécialisée dans les "
                "solutions numériques."
            )
        return (
            f"Welcome to {BUSINESS['name']}! "
            f"{BUSINESS['description']}"
        )

    if language == "fr":
        return (
            "Je n’ai pas cette information pour le moment. "
            "Veuillez contacter l’équipe Blue Soft pour confirmation."
        )

    return (
        "I don't have that information right now. "
        "Please contact the Blue Soft team for confirmation."
    )


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    message = request.message.strip()
    language = request.language or "en"

    if not message:
        raise HTTPException(
            status_code=422,
            detail="Message cannot be empty.",
        )

    # Continue working without an LLM key for basic FAQs.
    if groq_client is None:
        return ChatResponse(
            answer=fallback_answer(message, language),
            mode="fallback",
            model="none",
        )

    messages = [
        {
            "role": "system",
            "content": (
                f"{SYSTEM_PROMPT}\n\n"
                + (
                    "Réponds uniquement en français."
                    if language == "fr"
                    else "Reply only in English."
                )
            ),
        }
    ]

    # Include recent conversation turns for context.
    for item in request.history:
        content = item.content.strip()
        if content:
            messages.append(
                {
                    "role": item.role,
                    "content": content,
                }
            )

    # The current message is sent separately.
    messages.append(
        {
            "role": "user",
            "content": message,
        }
    )

    try:
        completion = await groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.4,
            max_completion_tokens=250,
        )

        answer = completion.choices[0].message.content

        if not answer or not answer.strip():
            raise HTTPException(
                status_code=502,
                detail="The AI returned an empty response.",
            )

        return ChatResponse(
            answer=answer.strip(),
            mode="groq",
            model=GROQ_MODEL,
        )

    except RateLimitError as exc:
        logger.warning("Groq rate limit reached: %s", exc)
        raise HTTPException(
            status_code=429,
            detail=(
                "The AI service has reached its usage limit. "
                "Please try again shortly."
            ),
        ) from exc

    except APIConnectionError as exc:
        logger.error("Cannot connect to Groq: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="The AI service is temporarily unavailable.",
        ) from exc

    except APIStatusError as exc:
        logger.error(
            "Groq returned HTTP %s",
            exc.status_code,
        )
        raise HTTPException(
            status_code=502,
            detail="The AI service could not complete the request.",
        ) from exc

    except HTTPException:
        raise

    except Exception:
        logger.exception("Unexpected error in /api/chat")
        raise HTTPException(
            status_code=500,
            detail="An unexpected server error occurred.",
        )

@app.post("/api/voice-response")
async def voice_response(request: ChatRequest):
    if groq_client is None:
        raise HTTPException(
            status_code=503,
            detail="Groq API key is not configured.",
        )

    if gradium_client is None:
        raise HTTPException(
            status_code=503,
            detail="Gradium API key is not configured.",
        )

    message = request.message.strip()

    if not message:
        raise HTTPException(
            status_code=422,
            detail="Message cannot be empty.",
        )

    language = request.language or "en"
    language_instruction = (
        "Réponds uniquement en français."
        if language == "fr"
        else "Reply only in English."
    )
    messages = [
        {
            "role": "system",
            "content": f"{SYSTEM_PROMPT}\n\n{language_instruction}",
        }
    ]

    messages.extend(
        {"role": item.role, "content": item.content.strip()}
        for item in request.history
        if item.content.strip()
    )

    messages.append({"role": "user", "content": message})

    try:
        # 1. Generate the AI answer with Groq.
        completion = await groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.4,
            max_completion_tokens=180,
        )

        answer = completion.choices[0].message.content

        if not answer or not answer.strip():
            raise HTTPException(
                status_code=502,
                detail="The AI returned an empty response.",
            )

        answer = answer.strip()

        # 2. Convert the answer into speech with Gradium.
        audio = await gradium_client.tts(
            setup={
                "model_name": "default",
                "voice_id": (
                    GRADIUM_VOICE_ID_FR
                    if language == "fr"
                    else GRADIUM_VOICE_ID
                ),
                "output_format": "wav",
                "json_config": {
                    "padding_bonus": 0.5,
                    "rewrite_rules": language,
                },
            },
            text=answer,
        )

        # 3. Return both text and audio to the frontend.
        audio_base64 = base64.b64encode(
            audio.raw_data
        ).decode("utf-8")

        return {
            "answer": answer,
            "audio_base64": audio_base64,
            "audio_content_type": "audio/wav",
            "mode": "groq+gradium",
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Voice response generation failed")

        raise HTTPException(
            status_code=502,
            detail="Could not generate the AI voice response.",
        )