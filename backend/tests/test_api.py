import base64
import struct
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

import main


def make_wav() -> bytes:
    sample_rate = 24_000
    audio = bytes(sample_rate)
    return (
        b"RIFF"
        + struct.pack("<I", len(audio) + 36)
        + b"WAVEfmt "
        + struct.pack("<IHHIIHH", 16, 1, 1, sample_rate, sample_rate * 2, 2, 16)
        + b"data"
        + struct.pack("<I", len(audio))
        + audio
    )


class VoiceDeskApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(main.app)

    def tearDown(self) -> None:
        self.client.close()

    def test_health_reports_provider_configuration(self) -> None:
        with (
            patch.object(main, "groq_client", object()),
            patch.object(main, "gradium_client", None),
        ):
            response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "degraded")
        self.assertTrue(response.json()["llm_configured"])
        self.assertFalse(response.json()["gradium_configured"])

    def test_transcription_passes_requested_language_to_gradium(self) -> None:
        gradium_client = SimpleNamespace(
            stt=AsyncMock(return_value=SimpleNamespace(text="Bonjour, Aïcha."))
        )
        with patch.object(main, "gradium_client", gradium_client):
            response = self.client.post(
                "/api/transcribe",
                json={
                    "audio_base64": base64.b64encode(make_wav()).decode("ascii"),
                    "language": "fr",
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"transcript": "Bonjour, Aïcha."})
        self.assertEqual(
            gradium_client.stt.await_args.kwargs["setup"]["json_config"],
            {"language": "fr"},
        )

    def test_transcription_rejects_invalid_base64(self) -> None:
        with patch.object(main, "gradium_client", object()):
            response = self.client.post(
                "/api/transcribe",
                json={"audio_base64": "not-base64", "language": "fr"},
            )

        self.assertEqual(response.status_code, 422)

    def test_voice_response_uses_french_prompt_and_voice(self) -> None:
        completion = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content="Bonjour, je suis Aïcha.")
                )
            ]
        )
        groq_client = SimpleNamespace(
            chat=SimpleNamespace(
                completions=SimpleNamespace(
                    create=AsyncMock(return_value=completion)
                )
            )
        )
        gradium_client = SimpleNamespace(
            tts=AsyncMock(return_value=SimpleNamespace(raw_data=b"RIFFaudio"))
        )
        with (
            patch.object(main, "groq_client", groq_client),
            patch.object(main, "gradium_client", gradium_client),
        ):
            response = self.client.post(
                "/api/voice-response",
                json={
                    "message": "Présente-toi.",
                    "language": "fr",
                    "history": [],
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["answer"], "Bonjour, je suis Aïcha.")
        self.assertEqual(
            gradium_client.tts.await_args.kwargs["setup"]["voice_id"],
            main.GRADIUM_VOICE_ID_FR,
        )
        self.assertEqual(
            gradium_client.tts.await_args.kwargs["setup"]["json_config"],
            {"padding_bonus": 0.5, "rewrite_rules": "fr"},
        )
        system_prompt = groq_client.chat.completions.create.await_args.kwargs[
            "messages"
        ][0]["content"]
        self.assertIn("Réponds uniquement en français.", system_prompt)
        self.assertIn("natural punctuation", system_prompt)

    def test_voice_response_applies_english_speech_settings(self) -> None:
        completion = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content="We're happy to help.")
                )
            ]
        )
        groq_client = SimpleNamespace(
            chat=SimpleNamespace(
                completions=SimpleNamespace(
                    create=AsyncMock(return_value=completion)
                )
            )
        )
        gradium_client = SimpleNamespace(
            tts=AsyncMock(return_value=SimpleNamespace(raw_data=b"RIFFaudio"))
        )
        with (
            patch.object(main, "groq_client", groq_client),
            patch.object(main, "gradium_client", gradium_client),
        ):
            response = self.client.post(
                "/api/voice-response",
                json={
                    "message": "What can you do?",
                    "language": "en",
                    "history": [],
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            gradium_client.tts.await_args.kwargs["setup"]["json_config"],
            {"padding_bonus": 0.5, "rewrite_rules": "en"},
        )
        system_prompt = groq_client.chat.completions.create.await_args.kwargs[
            "messages"
        ][0]["content"]
        self.assertIn("Reply only in English.", system_prompt)

    def test_chat_fallback_respects_french_language(self) -> None:
        with patch.object(main, "groq_client", None):
            response = self.client.post(
                "/api/chat",
                json={
                    "message": "Quels sont vos horaires ?",
                    "language": "fr",
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertIn("Nos horaires", response.json()["answer"])


if __name__ == "__main__":
    unittest.main()
