"use client";

import { useState, useRef } from "react";
import { Loader2, Mic, MicOff, Volume2, CheckCircle } from "lucide-react";
import type { Language } from "@/lib/supabase/types";

type PronunciationEval = {
  score: number;
  grade: string;
  feedback: string;
  phonetic_tips: string;
  encouragement: string;
};

type Props = {
  language: Language;
  cefrLevel: string;
};

const PRESET_PHRASES: Record<Language, string[]> = {
  es: [
    "Buenos días, ¿cómo estás?",
    "Mucho gusto en conocerte.",
    "¿Puedes repetir eso más despacio, por favor?",
    "Me gustaría una mesa para dos personas.",
    "¿Dónde está la estación de metro más cercana?",
    "¿Cuánto cuesta esto?",
    "Lo siento, no entiendo.",
    "¿Hablas inglés?",
    "Estoy aprendiendo español.",
    "La comida estaba deliciosa.",
    "¿Me puede ayudar, por favor?",
    "Necesito un médico.",
    "¿A qué hora sale el tren?",
    "Me llamo…y soy de…",
    "¿Puedo pagar con tarjeta?",
    "Quisiera reservar una habitación.",
    "¿Tiene algo más barato?",
    "La cuenta, por favor.",
    "¡Que tengas un buen día!",
    "Hasta luego, fue un placer.",
  ],
  fr: [
    "Bonjour, comment allez-vous?",
    "Enchanté de vous rencontrer.",
    "Pourriez-vous répéter plus lentement, s'il vous plaît?",
    "Je voudrais une table pour deux personnes.",
    "Où est la station de métro la plus proche?",
    "Combien ça coûte?",
    "Je suis désolé, je ne comprends pas.",
    "Parlez-vous anglais?",
    "J'apprends le français.",
    "La nourriture était délicieuse.",
    "Pouvez-vous m'aider, s'il vous plaît?",
    "J'ai besoin d'un médecin.",
    "À quelle heure part le train?",
    "Je m'appelle… et je viens de…",
    "Puis-je payer par carte?",
    "Je voudrais réserver une chambre.",
    "Avez-vous quelque chose de moins cher?",
    "L'addition, s'il vous plaît.",
    "Bonne journée!",
    "Au revoir, c'était un plaisir.",
  ],
};

const LANG_VOICE: Record<Language, string> = {
  es: "es-ES",
  fr: "fr-FR",
};

const GRADE_COLORS: Record<string, string> = {
  A: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
  B: "text-blue-400 bg-blue-500/20 border-blue-500/30",
  C: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
  D: "text-red-400 bg-red-500/20 border-red-500/30",
  F: "text-red-400 bg-red-500/20 border-red-500/30",
};

function scoreColor(score: number) {
  if (score >= 90) return "from-emerald-500 to-green-600";
  if (score >= 70) return "from-blue-500 to-cyan-600";
  if (score >= 50) return "from-yellow-500 to-amber-600";
  return "from-red-500 to-rose-600";
}

export function PronunciationClient({ language }: Props) {
  const presets = PRESET_PHRASES[language];
  const voiceLang = LANG_VOICE[language];

  const [customPhrase, setCustomPhrase] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<PronunciationEval | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<{ stop(): void } | null>(null);

  const targetPhrase = customPhrase.trim() || selectedPreset || "";

  function hearPhrase() {
    if (!targetPhrase) return;
    window.speechSynthesis?.cancel();
    const utt = new SpeechSynthesisUtterance(targetPhrase);
    utt.lang = voiceLang;
    utt.rate = 0.8;
    window.speechSynthesis?.speak(utt);
  }

  function startRecording() {
    type SpeechRecognitionCtor = new () => {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      onstart: (() => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
      onresult: ((e: { results: { [k: number]: { [k: number]: { transcript: string } | undefined } | undefined } }) => void) | null;
      start(): void;
      stop(): void;
    };
    type SpeechRecognitionWindow = {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const w = window as unknown as SpeechRecognitionWindow;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setError("Speech recognition not supported in this browser. Try Chrome.");
      return;
    }
    const recognition = new SR();
    recognition.lang = voiceLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => {
      setIsRecording(false);
      setError("Couldn't capture audio. Please try again.");
    };
    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      setTranscript(text);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }

  async function evaluate() {
    if (!targetPhrase || !transcript) return;
    setIsEvaluating(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/pronunciation/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: targetPhrase, transcript, language }),
      });
      if (!res.ok) throw new Error("Failed to evaluate");
      const data = (await res.json()) as PronunciationEval;
      setResult(data);
    } catch {
      setError("Evaluation failed. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Phrase selection */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-5 flex flex-col gap-4">
        <p className="text-sm font-bold text-white">Choose or type a phrase</p>

        {/* Custom input */}
        <input
          type="text"
          value={customPhrase}
          onChange={(e) => {
            setCustomPhrase(e.target.value);
            setSelectedPreset(null);
            setResult(null);
            setTranscript("");
          }}
          placeholder="Type your own phrase..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
        />

        <p className="text-xs text-slate-500">or pick a preset:</p>

        {/* Preset phrases */}
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {presets.map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => {
                setSelectedPreset(phrase);
                setCustomPhrase("");
                setResult(null);
                setTranscript("");
              }}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                selectedPreset === phrase
                  ? "border-violet-500/60 bg-violet-500/20 text-violet-200"
                  : "border-white/10 bg-white/4 text-slate-300 hover:bg-white/8"
              }`}
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>

      {/* Target phrase display */}
      {targetPhrase && (
        <div className="rounded-2xl border border-white/8 bg-white/4 px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-lg font-bold text-white leading-snug">{targetPhrase}</p>
          <button
            type="button"
            onClick={hearPhrase}
            aria-label="Hear phrase"
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <Volume2 className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Recording controls */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!targetPhrase}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition active:scale-95 disabled:opacity-40 ${
              isRecording
                ? "border border-red-500/40 bg-red-500/20 text-red-300 animate-pulse"
                : "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 hover:scale-[1.02]"
            }`}
          >
            {isRecording ? (
              <>
                <MicOff className="h-4 w-4" aria-hidden="true" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" aria-hidden="true" />
                Record My Pronunciation
              </>
            )}
          </button>
        </div>

        {/* Transcript */}
        {(transcript || isRecording) && (
          <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">What was heard:</p>
            <p className="text-sm text-slate-200">
              {transcript || <span className="italic text-slate-500">Listening…</span>}
            </p>
          </div>
        )}

        {/* Evaluate button */}
        {transcript && (
          <button
            type="button"
            onClick={() => void evaluate()}
            disabled={isEvaluating}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Evaluating…
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                Evaluate Pronunciation
              </>
            )}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-4 rounded-3xl border border-white/8 bg-white/3 p-5">
          {/* Score + grade */}
          <div className="flex items-center gap-4">
            <div
              className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${scoreColor(result.score)} shadow-lg`}
            >
              <span className="text-2xl font-extrabold text-white">{result.score}</span>
              <span className="text-xs text-white/70">/ 100</span>
            </div>
            <div>
              <div
                className={`inline-flex items-center rounded-xl border px-4 py-1.5 text-2xl font-extrabold ${GRADE_COLORS[result.grade] ?? GRADE_COLORS["F"]}`}
              >
                {result.grade}
              </div>
              <p className="mt-2 text-sm font-semibold text-white">{result.encouragement}</p>
            </div>
          </div>

          {/* Feedback */}
          <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
            <p className="text-xs font-bold text-slate-400 mb-1">Feedback</p>
            <p className="text-sm text-slate-200 leading-relaxed">{result.feedback}</p>
          </div>

          {/* Tips */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
            <p className="text-xs font-bold text-amber-400 mb-1">Phonetic Tips</p>
            <p className="text-sm text-amber-200/90 leading-relaxed">{result.phonetic_tips}</p>
          </div>
        </div>
      )}
    </div>
  );
}
