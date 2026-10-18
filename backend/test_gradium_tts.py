import asyncio
import os

from dotenv import load_dotenv
import gradium

load_dotenv()

async def main():
    api_key = os.getenv("GRADIUM_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GRADIUM_API_KEY is missing from backend/.env"
        )

    client = gradium.client.GradiumClient(api_key=api_key)

    result = await client.tts(
        setup={
            "model_name": "default",
            "voice_id": "Bla6SbVMczYnOhfK",
            "output_format": "wav",
        },
        text=(
            "Hello! Welcome to Blue Soft. "
            "How can I help you today?"
        ),
    )

    with open("test_voice.wav", "wb") as audio_file:
        audio_file.write(result.raw_data)

    print("Success! Audio saved to test_voice.wav")

if __name__ == "__main__":
    asyncio.run(main())
