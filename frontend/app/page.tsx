"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
};

type Status = "idle" | "listening" | "processing" | "speaking" | "error";
type Locale = "en" | "fr";

const copy = {
  en: {
    navServices: "What we do", navVoice: "Voice assistant", letsTalk: "Let's talk",
    eyebrow: "Thoughtful technology, made human",
    headline: <>Good ideas deserve <span>a better</span> digital home.</>,
    intro: "We turn ambitious ideas into useful software, thoughtful AI, and digital experiences people love to use.",
    start: "Start a conversation", explore: "Explore what we do",
    proofTitle: "People-first by design.", proofText: "Technology that works for real life.",
    guide: "YOUR BLUE SOFT GUIDE", guideSubtitle: "Your friendly Blue Soft guide",
    voiceAssistant: "VOICE ASSISTANT",
    status: { idle: "Ready when you are", listening: "I'm listening...", processing: "Finding the right answer...", speaking: "Speaking your answer", error: "Let's try that again" },
    cardHint: "Ask about our services, ideas, or how to get started.",
    noteIdeas: "Ideas to impact", madeCare: "Made with care", hereHelp: "Here to help", anytime: "Anytime you need",
    serviceEyebrow: "A little bit of magic, a lot of know-how",
    servicesTitle: <>We make digital work <span>beautifully.</span></>,
    servicesIntro: "From first sketch to the details that make it last, we bring the right people and technology to your next big thing.",
    services: [
      ["Custom software", "Purpose-built platforms and applications that grow with your business."],
      ["AI solutions", "Practical AI that takes repetitive work off your team's hands."],
      ["Technical support", "Reliable guidance and ongoing care to keep your tools running smoothly."],
      ["Digital consulting", "A clear roadmap to turn your next big idea into a digital product."],
    ],
    conversationEyebrow: "A real conversation, not a contact form",
    conversationTitle: <>Tell us what you&apos;re <span>imagining.</span></>,
    conversationIntro: "Speak naturally. Aïcha detects your pauses, answers, then keeps listening so the conversation can flow.",
    privacyNote: "Audio is sent to Gradium for transcription and your message to Groq for a reply.",
    pointSpeak: "Pause for Aïcha to reply", pointAnswers: "Keep talking when she’s done", assistant: "Blue Soft assistant", online: "Online",
    voiceButton: "Start voice conversation", audioLabel: "Aïcha's voice response",
    hello: "Hi there! I'm Aïcha. What would you like to make possible?",
    suggestionLabel: "A GOOD PLACE TO START", suggestion: "“What can Blue Soft build for me?”",
    thinking: "Aïcha is thinking", tapSpeak: "Tap to start talking", listening: "Listening for your question...",
    thinkingStatus: "Aïcha is thinking...", speaking: "Aïcha is speaking",
    micPrivacy: "Tap once to start a hands-free conversation", stopHint: "Pause briefly and Aïcha will reply", stop: "End conversation",
    unsupported: "Audio recording is not supported by this browser.",
    micError: "Could not access your microphone. Check its permission and try again.",
    recordingError: "The recording failed. Please try again.",
    transcriptionError: "Could not transcribe the recording. Please try again.",
    transcriptionEmpty: "No speech was detected. Please try again.",
    pauseToSend: "Pause briefly to send your question",
    missingAudio: "The AI answered, but no audio was returned.",
    playAudio: "The answer is ready. Press Play on the audio controls to hear it.",
    requestError: "The AI request failed.", genericError: "Something went wrong.",
    footer: "Thoughtful technology for a more human digital world.",
  },
  fr: {
    navServices: "Nos services", navVoice: "Assistant vocal", letsTalk: "Parlons-en",
    eyebrow: "La technologie, avec une touche humaine",
    headline: <>Les bonnes idées méritent <span>un bel</span> avenir numérique.</>,
    intro: "Nous transformons vos idées ambitieuses en logiciels utiles, en IA réfléchie et en expériences numériques que l’on aime utiliser.",
    start: "Parler avec nous", explore: "Découvrir nos services",
    proofTitle: "L’humain au cœur de tout.", proofText: "La technologie pensée pour le quotidien.",
    guide: "VOTRE GUIDE BLUE SOFT", guideSubtitle: "Votre guide Blue Soft",
    voiceAssistant: "ASSISTANT VOCAL",
    status: { idle: "À votre écoute", listening: "Je vous écoute...", processing: "Je prépare une réponse...", speaking: "Je vous réponds", error: "Réessayons ensemble" },
    cardHint: "Parlez-moi de vos idées ou de nos services.",
    noteIdeas: "De l’idée au concret", madeCare: "Créé avec soin", hereHelp: "À votre service", anytime: "Quand vous en avez besoin",
    serviceEyebrow: "Un peu de magie, beaucoup de savoir-faire",
    servicesTitle: <>Le numérique, tout simplement <span>bien pensé.</span></>,
    servicesIntro: "De la première esquisse aux détails qui font durer, nous réunissons les bonnes personnes et les bonnes technologies pour vos projets.",
    services: [
      ["Logiciels sur mesure", "Des plateformes et applications conçues pour évoluer avec votre activité."],
      ["Solutions d’IA", "Une IA concrète qui libère vos équipes des tâches répétitives."],
      ["Assistance technique", "Un accompagnement fiable pour des outils performants au quotidien."],
      ["Conseil numérique", "Une feuille de route claire pour concrétiser votre prochain projet."],
    ],
    conversationEyebrow: "Une vraie conversation, pas un formulaire",
    conversationTitle: <>Parlons de ce que vous <span>imaginez.</span></>,
    conversationIntro: "Parlez naturellement. Aïcha détecte vos pauses, vous répond, puis reprend l’écoute pour poursuivre la conversation.",
    privacyNote: "L’audio est transmis à Gradium pour transcription et votre message à Groq pour générer une réponse.",
    pointSpeak: "Faites une pause, Aïcha vous répond", pointAnswers: "Reprenez quand elle a terminé",
    assistant: "Assistante Blue Soft", online: "En ligne",
    voiceButton: "Démarrer la conversation vocale", audioLabel: "Réponse vocale d’Aïcha",
    hello: "Bonjour ! Je m’appelle Aïcha. Que souhaitez-vous concrétiser ?",
    suggestionLabel: "POUR COMMENCER", suggestion: "« Que peut créer Blue Soft pour moi ? »",
    thinking: "Aïcha réfléchit", tapSpeak: "Appuyez pour commencer", listening: "Je vous écoute...",
    thinkingStatus: "Aïcha réfléchit...", speaking: "Aïcha vous répond",
    micPrivacy: "Appuyez une fois pour démarrer la conversation mains libres", stopHint: "Faites une courte pause pour qu’Aïcha vous réponde", stop: "Terminer",
    unsupported: "L’enregistrement audio n’est pas pris en charge par ce navigateur.",
    micError: "Accès au micro impossible. Vérifiez l’autorisation du micro puis réessayez.",
    recordingError: "L’enregistrement a échoué. Veuillez réessayer.",
    transcriptionError: "Impossible de transcrire l’enregistrement. Veuillez réessayer.",
    transcriptionEmpty: "Aucune parole détectée. Veuillez réessayer.",
    pauseToSend: "Faites une courte pause pour envoyer votre question",
    missingAudio: "L’IA a répondu, mais aucun audio n’a été reçu.",
    playAudio: "La réponse est prête. Appuyez sur Lecture pour l’écouter.",
    requestError: "La demande à l’IA a échoué.", genericError: "Une erreur est survenue.",
    footer: "La technologie au service d’un monde numérique plus humain.",
  },
} as const;

const targetAudioSampleRate = 24_000;
const speechPauseDurationMs = 900;
const maxUtteranceDurationMs = 25_000;
const minimumSpeechLevel = 0.012;

function audioSamplesToWav(
  samples: Float32Array,
  sourceSampleRate: number,
): Blob {
  const frameCount = Math.floor(
    (samples.length * targetAudioSampleRate) / sourceSampleRate,
  );
  const wavBuffer = new ArrayBuffer(44 + frameCount * 2);
  const view = new DataView(wavBuffer);
  const writeText = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + frameCount * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetAudioSampleRate, true);
  view.setUint32(28, targetAudioSampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, frameCount * 2, true);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const sourcePosition = (frame * sourceSampleRate) / targetAudioSampleRate;
    const sourceIndex = Math.floor(sourcePosition);
    const fraction = sourcePosition - sourceIndex;
    const nextIndex = Math.min(sourceIndex + 1, samples.length - 1);
    const sample =
      samples[sourceIndex] * (1 - fraction) +
      samples[nextIndex] * fraction;
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(
      44 + frame * 2,
      clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff,
      true,
    );
  }

  return new Blob([wavBuffer], { type: "audio/wav" });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the audio recording."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not read the audio recording."));
        return;
      }
      const separator = reader.result.indexOf(",");
      if (separator < 0) {
        reject(new Error("Could not encode the audio recording."));
        return;
      }
      resolve(reader.result.slice(separator + 1));
    };
    reader.readAsDataURL(blob);
  });
}

const services = [
  {
    icon: "layers",
    tone: "service-blue",
  },
  {
    icon: "spark",
    tone: "service-violet",
  },
  {
    icon: "support",
    tone: "service-mint",
  },
  {
    icon: "chart",
    tone: "service-peach",
  },
];

const iconPaths: Record<string, ReactNode> = {
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
      <path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" />
    </>
  ),
  support: (
    <>
      <path d="M4 13v-2a8 8 0 0 1 16 0v2" />
      <path d="M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2Zm16 0h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2ZM17 19a5 5 0 0 1-5 3" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5m0 14h17" />
      <path d="m7 15 4-4 3 2 6-7" />
      <path d="M16 6h4v4" />
    </>
  ),
};

function ServiceIcon({ name }: { name: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {iconPaths[name]}
    </svg>
  );
}

function AichaAvatar({ small = false }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 180 180"
      className={small ? "mila-avatar-small" : "mila-avatar"}
      role={small ? undefined : "img"}
      aria-label={small ? undefined : "Blue Soft virtual assistant avatar"}
      aria-hidden={small ? true : undefined}
    >
      <defs>
        <linearGradient id="mila-bg" x1="20" y1="18" x2="158" y2="164" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B9B5FF" />
          <stop offset="1" stopColor="#8585F4" />
        </linearGradient>
        <linearGradient id="mila-face" x1="70" y1="57" x2="112" y2="137" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE3D2" />
          <stop offset="1" stopColor="#F3B99F" />
        </linearGradient>
      </defs>
      <circle cx="90" cy="90" r="84" fill="url(#mila-bg)" />
      <circle cx="90" cy="90" r="83" stroke="white" strokeOpacity=".56" strokeWidth="2" />
      <path d="M42 159c5-28 22-43 48-43s43 15 48 43" fill="#F7F8FF" />
      <path d="M56 87c0-34 14-54 37-54 28 0 40 24 36 54-3-14-13-23-28-27-8 13-23 20-45 21v6Z" fill="#394071" />
      <path d="M62 86c0-23 12-37 29-37 20 0 31 15 29 38l-3 20c-3 17-14 29-27 29s-24-12-27-29l-1-21Z" fill="url(#mila-face)" />
      <path d="M77 91h1m24 0h1" stroke="#4B4663" strokeWidth="5" strokeLinecap="round" />
      <path d="M82 108c5 5 12 5 17 0" stroke="#B76A72" strokeWidth="3" strokeLinecap="round" />
      <path d="M61 82c15-1 31-9 41-21 7 10 15 16 24 19-1-28-13-47-35-47-20 0-32 17-30 49Z" fill="#394071" />
      <path d="M51 158c10-18 23-27 39-27s29 9 39 27" fill="#FAFBFF" />
      <path d="m78 132 12 12 12-12" fill="#7A79D7" />
    </svg>
  );
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>("fr");
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioProcessorRef = useRef<AudioWorkletNode | null>(null);
  const recordingChunksRef = useRef<Float32Array[]>([]);
  const recordingSampleRateRef = useRef(targetAudioSampleRate);
  const requestAbortRef = useRef<AbortController | null>(null);
  const speechDetectedRef = useRef(false);
  const silenceDurationRef = useRef(0);
  const utteranceDurationRef = useRef(0);
  const noiseLevelRef = useRef(0);
  const preRollChunksRef = useRef<Float32Array[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioUrlRef = useRef<string | null>(null);
  const autoListenRef = useRef(false);
  const sendMessageRef = useRef<(text: string) => void>(() => {});
  const startConversationRef = useRef<() => void>(() => {});
  const t = copy[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const sendMessage = useCallback(async (text: string) => {
    const message = text.trim();
    if (!message) return;

    setMessages((previous) => [...previous, { role: "user", text: message }]);
    setStatus("processing");
    setError("");
    const controller = new AbortController();
    requestAbortRef.current = controller;

    try {
      const history = messages.slice(-20).map((item) => ({
        role: item.role,
        content: item.text,
      }));

      const response = await fetch("/api/voice-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, language: locale }),
        signal: controller.signal,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || t.requestError);
      }
      if (!autoListenRef.current) return;

      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: data.answer },
      ]);

      if (!data.audio_base64) {
        setStatus("idle");
        setError(t.missingAudio);
        return;
      }

      const binary = atob(data.audio_base64);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], {
        type: data.audio_content_type || "audio/wav",
      });
      const audioUrl = URL.createObjectURL(blob);
      const player = audioRef.current;

      if (!player) {
        URL.revokeObjectURL(audioUrl);
        setStatus("idle");
        return;
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      audioUrlRef.current = audioUrl;
      player.src = audioUrl;
      player.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (audioUrlRef.current === audioUrl) {
          audioUrlRef.current = null;
        }
        if (autoListenRef.current) {
          startConversationRef.current();
        } else {
          setStatus("idle");
        }
      };

      setStatus("speaking");
      try {
        await player.play();
      } catch {
        URL.revokeObjectURL(audioUrl);
        if (audioUrlRef.current === audioUrl) {
          audioUrlRef.current = null;
        }
        if (autoListenRef.current) {
          setStatus("idle");
          setError(t.playAudio);
        }
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setStatus("error");
        setError(err instanceof Error ? err.message : t.genericError);
      }
    } finally {
      if (requestAbortRef.current === controller) {
        requestAbortRef.current = null;
      }
    }
  }, [locale, messages, t.genericError, t.missingAudio, t.playAudio, t.requestError]);

  useEffect(() => {
    sendMessageRef.current = (text) => {
      void sendMessage(text);
    };
  }, [sendMessage]);

  const transcribeRecording = useCallback(async (
    chunks: Float32Array[],
    sampleRate: number,
  ) => {
    setStatus("processing");
    const controller = new AbortController();
    requestAbortRef.current = controller;
    try {
      const sampleCount = chunks.reduce((total, chunk) => total + chunk.length, 0);
      if (!sampleCount) {
        throw new Error(t.transcriptionEmpty);
      }

      const samples = new Float32Array(sampleCount);
      let offset = 0;
      for (const chunk of chunks) {
        samples.set(chunk, offset);
        offset += chunk.length;
      }
      const wav = audioSamplesToWav(samples, sampleRate);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio_base64: await blobToBase64(wav),
          language: locale,
        }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || t.transcriptionError);
      }
      if (!autoListenRef.current) return;
      if (typeof data.transcript !== "string" || !data.transcript.trim()) {
        throw new Error(t.transcriptionEmpty);
      }

      sendMessageRef.current(data.transcript);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        autoListenRef.current = false;
        setStatus("error");
        setError(err instanceof Error ? err.message : t.transcriptionError);
      }
    } finally {
      if (requestAbortRef.current === controller) {
        requestAbortRef.current = null;
      }
      audioProcessorRef.current?.port.close();
      audioProcessorRef.current?.disconnect();
      audioProcessorRef.current = null;
      audioSourceRef.current?.disconnect();
      audioSourceRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (
        !autoListenRef.current &&
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  }, [locale, t.transcriptionEmpty, t.transcriptionError]);

  const startConversation = useCallback(async () => {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      !window.AudioContext ||
      !("audioWorklet" in AudioContext.prototype)
    ) {
      setError(t.unsupported);
      setStatus("error");
      return;
    }

    setError("");
    autoListenRef.current = true;
    try {
      const audioContext =
        audioContextRef.current && audioContextRef.current.state !== "closed"
          ? audioContextRef.current
          : new AudioContext();
      audioContextRef.current = audioContext;
      await audioContext.resume();
      if (!autoListenRef.current) return;
      await audioContext.audioWorklet.addModule("/voice-capture-processor.js");
      if (!autoListenRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!autoListenRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      recordingChunksRef.current = [];
      preRollChunksRef.current = [];
      speechDetectedRef.current = false;
      silenceDurationRef.current = 0;
      utteranceDurationRef.current = 0;
      noiseLevelRef.current = 0;
      const source = audioContext.createMediaStreamSource(stream);
      const processor = new AudioWorkletNode(
        audioContext,
        "voice-capture-processor",
        { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] },
      );
      recordingSampleRateRef.current = audioContext.sampleRate;
      processor.port.onmessage = (event: MessageEvent<Float32Array>) => {
        const chunk = event.data;
        let sumSquares = 0;
        for (let index = 0; index < chunk.length; index += 1) {
          sumSquares += chunk[index] * chunk[index];
        }
        const rms = Math.sqrt(sumSquares / chunk.length);
        const frameDurationMs = (chunk.length / audioContext.sampleRate) * 1000;
        utteranceDurationRef.current += frameDurationMs;

        if (!speechDetectedRef.current) {
          noiseLevelRef.current =
            noiseLevelRef.current * 0.95 + rms * 0.05;
          const speechThreshold = Math.max(
            minimumSpeechLevel,
            Math.min(0.05, noiseLevelRef.current * 3),
          );

          if (rms >= speechThreshold) {
            speechDetectedRef.current = true;
            utteranceDurationRef.current = frameDurationMs;
            recordingChunksRef.current.push(...preRollChunksRef.current, chunk);
            preRollChunksRef.current = [];
          } else {
            preRollChunksRef.current.push(chunk);
            if (preRollChunksRef.current.length > 3) {
              preRollChunksRef.current.shift();
            }
          }
        } else {
          recordingChunksRef.current.push(chunk);
          silenceDurationRef.current =
            rms < minimumSpeechLevel ? silenceDurationRef.current + frameDurationMs : 0;
        }

        const pauseDetected =
          speechDetectedRef.current &&
          silenceDurationRef.current >= speechPauseDurationMs;
        const utteranceLimitReached =
          speechDetectedRef.current &&
          utteranceDurationRef.current >= maxUtteranceDurationMs;
        if (pauseDetected || utteranceLimitReached) {
          processor.port.onmessage = null;
          processor.port.close();
          audioProcessorRef.current?.disconnect();
          audioProcessorRef.current = null;
          audioSourceRef.current?.disconnect();
          audioSourceRef.current = null;
          const chunks = recordingChunksRef.current;
          recordingChunksRef.current = [];
          void transcribeRecording(chunks, recordingSampleRateRef.current);
        }
      };
      source.connect(processor);
      processor.connect(audioContext.destination);
      audioSourceRef.current = source;
      audioProcessorRef.current = processor;
      setStatus("listening");
    } catch {
      const shouldReportError = autoListenRef.current;
      autoListenRef.current = false;
      requestAbortRef.current?.abort();
      requestAbortRef.current = null;
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      audioProcessorRef.current?.port.close();
      audioProcessorRef.current?.disconnect();
      audioProcessorRef.current = null;
      audioSourceRef.current?.disconnect();
      audioSourceRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (!shouldReportError) return;
      setStatus("error");
      setError(t.micError);
    }
  }, [t.micError, t.unsupported, transcribeRecording]);

  useEffect(() => {
    startConversationRef.current = () => {
      void startConversation();
    };
  }, [startConversation]);

  useEffect(() => {
    return () => {
      autoListenRef.current = false;
      requestAbortRef.current?.abort();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      audioProcessorRef.current?.port.close();
      audioProcessorRef.current?.disconnect();
      audioSourceRef.current?.disconnect();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        void audioContextRef.current.close();
      }
    };
  }, []);

  const stopConversation = () => {
    autoListenRef.current = false;
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
    if (audioProcessorRef.current) {
      audioProcessorRef.current.port.close();
      audioProcessorRef.current.disconnect();
      audioProcessorRef.current = null;
      audioSourceRef.current?.disconnect();
      audioSourceRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      recordingChunksRef.current = [];
      preRollChunksRef.current = [];
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioRef.current?.pause();
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    audioRef.current?.removeAttribute("src");
    audioRef.current?.load();
    setStatus("idle");
  };

  const busy = status === "processing" || status === "speaking";
  const statusCopy = t.status[status];

  return (
    <main className="site-shell min-h-screen overflow-hidden text-[#17213b]">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-5 sm:px-8 lg:px-10">
        <header className="site-nav">
          <a href="#" className="brand-lockup" aria-label="Blue Soft home">
            <span className="brand-mark"><span /></span>
            <span className="brand-name">blue<span>soft</span></span>
          </a>
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-[#65708a] sm:flex">
            <a className="nav-link" href="#services">{t.navServices}</a>
            <a className="nav-link" href="#voice">{t.navVoice}</a>
          </nav>
          <div className="flex items-center gap-2">
            <div className="language-switch" role="group" aria-label={locale === "fr" ? "Choisir la langue" : "Select language"}>
              <button type="button" onClick={() => setLocale("fr")} aria-pressed={locale === "fr"}>FR</button>
              <button type="button" onClick={() => setLocale("en")} aria-pressed={locale === "en"}>EN</button>
            </div>
            <button
              onClick={startConversation}
              disabled={busy || status === "listening"}
              className="nav-cta"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#6be0b2]" />
              {t.letsTalk}
            </button>
          </div>
        </header>

        <section className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-star">✳</span> {t.eyebrow}</div>
            <h1>{t.headline}</h1>
            <p className="hero-description">
              {t.intro}
            </p>
            <div className="hero-actions">
              <button onClick={startConversation} disabled={busy || status === "listening"} className="button-primary">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[17px] w-[17px]">
                  <rect x="9" y="3" width="6" height="12" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0m-7 7v3m-4 0h8" />
                </svg>
                {t.start}
                <span className="button-arrow">↗</span>
              </button>
              <a href="#services" className="button-secondary">{t.explore} <span>↓</span></a>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack" aria-hidden="true">
                <span className="mini-avatar avatar-a">A</span>
                <span className="mini-avatar avatar-b">M</span>
                <span className="mini-avatar avatar-c">S</span>
              </div>
              <p><strong>{t.proofTitle}</strong><br />{t.proofText}</p>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="assistant-card">
              <div className="assistant-card-top">
                <div className="assistant-label"><span className="online-dot" /> {t.guide}</div>
                <span className="sparkle-mark">✳</span>
              </div>
              <div className={`avatar-stage ${status === "speaking" ? "avatar-speaking" : status === "listening" ? "avatar-listening" : ""}`}>
                <div className="avatar-halo" />
                <div className="avatar-aura" />
                <AichaAvatar />
                <span className="avatar-glint glint-one" />
                <span className="avatar-glint glint-two" />
              </div>
              <div className="assistant-intro">
                <span className="assistant-name">Aïcha <span>✦</span></span>
                <span className="assistant-role">{t.guideSubtitle}</span>
              </div>
              <div className="voice-status">
                <div className="voice-status-copy">
                  <span className="voice-kicker">{t.voiceAssistant}</span>
                  <span className="voice-status-text" aria-live="polite" aria-atomic="true">{statusCopy}</span>
                </div>
                <div className={`sound-wave ${status === "speaking" || status === "listening" ? "wave-active" : ""}`} aria-hidden="true">
                  {[0, 1, 2, 3, 4, 5, 6].map((bar) => <i key={bar} />)}
                </div>
              </div>
              <div className="assistant-card-foot">
                <span>{t.cardHint}</span>
                <span className="foot-sparkle">✳</span>
              </div>
            </div>
            <div className="float-note note-top"><span className="note-icon note-purple">✦</span><span><b>{t.noteIdeas}</b><small>{t.madeCare}</small></span></div>
            <div className="float-note note-bottom"><span className="note-icon note-green">↗</span><span><b>{t.hereHelp}</b><small>{t.anytime}</small></span></div>
          </div>
        </section>

        <section id="services" className="services-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">{t.serviceEyebrow}</span>
              <h2>{t.servicesTitle}</h2>
            </div>
            <p>{t.servicesIntro}</p>
          </div>
          <div className="services-grid">
            {services.map((service, index) => (
              <article className={`service-tile ${service.tone}`} key={service.icon} style={{ animationDelay: `${index * 100}ms` }}>
                <div className="service-tile-top">
                  <span className="service-icon"><ServiceIcon name={service.icon} /></span>
                  <span className="tile-number">0{index + 1}</span>
                </div>
                <h3>{t.services[index][0]}</h3>
                <p>{t.services[index][1]}</p>
                <span className="tile-arrow" aria-hidden="true">↗</span>
              </article>
            ))}
          </div>
        </section>

        <section id="voice" className="conversation-section">
          <div className="conversation-copy">
            <span className="section-kicker">{t.conversationEyebrow}</span>
            <h2>{t.conversationTitle}</h2>
            <p>{t.conversationIntro}</p>
            <p className="privacy-note">{t.privacyNote}</p>
            <div className="conversation-points">
              <span><i>✓</i> {t.pointSpeak}</span>
              <span><i>✓</i> {t.pointAnswers}</span>
            </div>
          </div>
          <div className="chat-panel">
            <div className="chat-header">
              <div className="chat-avatar"><AichaAvatar small /></div>
              <div><b>Aïcha</b><span>{t.assistant}</span></div>
              <span className="chat-online"><i /> {t.online}</span>
            </div>
            <div className="chat-messages" aria-live="polite">
              {messages.length === 0 ? (
                <>
                  <div className="chat-message assistant-message"><span className="message-avatar">A</span><p>{t.hello}</p></div>
                  <div className="suggestion-label">{t.suggestionLabel}</div>
                  <div className="suggestion-chip">{t.suggestion}</div>
                </>
              ) : (
                messages.map((message, index) => (
                  <div key={`${index}-${message.role}`} className={`chat-message ${message.role === "user" ? "user-message" : "assistant-message"}`}>
                    {message.role === "assistant" && <span className="message-avatar">A</span>}
                    <p>{message.text}</p>
                  </div>
                ))
              )}
              {status === "processing" && <div className="typing-indicator"><i /><i /><i /><span>{t.thinking}</span></div>}
            </div>
            {error && <p role="alert" className="chat-error">{error}</p>}
            <div className="chat-controls">
              <button onClick={startConversation} disabled={busy || status === "listening"} className={`mic-button ${status === "listening" ? "mic-live" : ""}`} aria-label={status === "listening" ? t.listening : t.voiceButton}>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0m-7 7v3m-4 0h8" /></svg>
              </button>
              <div className="chat-control-copy" aria-live="polite" aria-atomic="true"><b>{status === "listening" ? t.listening : status === "processing" ? t.thinkingStatus : status === "speaking" ? t.speaking : t.tapSpeak}</b><span>{status === "listening" ? t.pauseToSend : status === "idle" ? t.micPrivacy : t.stopHint}</span></div>
              {status !== "idle" && status !== "error" && <button type="button" onClick={stopConversation} className="stop-button">{t.stop}</button>}
            </div>
            <audio ref={audioRef} controls className="audio-player" aria-label={t.audioLabel} />
          </div>
        </section>

        <footer className="site-footer">
          <a href="#" className="brand-lockup" aria-label="Blue Soft home"><span className="brand-mark"><span /></span><span className="brand-name">blue<span>soft</span></span></a>
          <span>{t.footer}</span>
          <span>© Blue Soft</span>
        </footer>
      </div>
    </main>
  );
}
