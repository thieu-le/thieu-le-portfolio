"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Mic, ArrowLeft } from "lucide-react";
import phrasesData from "./data/phrases.json";
import { validateSpeech, type ValidationStatus } from "./utils/phraseValidation";

type Step = "selection" | "phrase" | "echo";

interface PhraseItem {
  id: string;
  phrase: string;
  realWorldPrompt: string;
  image: string;
}

const BG_SAGE = "bg-[#E8F0E8]";
const BG_BEIGE = "bg-[#F5F3EE]";

const FEEDBACK_MESSAGES: Record<Exclude<ValidationStatus, "unknown">, string> = {
  success: "Good job",
  partial: "Try again",
  try_again: "Try again",
};

/**
 * Standalone Phrases page - practice everyday communication phrases.
 * Gentle speech validation with encouragement-focused feedback.
 * Optimized for autistic + ADHD users.
 */
export default function PhrasesPage() {
  const [step, setStep] = useState<Step>("selection");
  const [selectedPhrase, setSelectedPhrase] = useState<PhraseItem | null>(null);
  const [listening, setListening] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [feedback, setFeedback] = useState<ValidationStatus | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const hasSpeechInput =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    setShowContent(false);
    const t = setTimeout(() => setShowContent(true), 50);
    return () => clearTimeout(t);
  }, [step, selectedPhrase]);

  const startListening = useCallback(() => {
    if (!hasSpeechInput || !selectedPhrase) return;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    let gotResult = false;

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setListening(true);
      setFeedback(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const transcriptText = result[0]?.transcript?.trim() ?? "";

      if (!transcriptText) return;

      gotResult = true;
      const validation = validateSpeech(transcriptText, selectedPhrase.phrase);
      setFeedback(validation.status);
      recognition.stop();
    };

    recognition.onerror = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      if (!gotResult) {
        setFeedback("try_again");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [hasSpeechInput, selectedPhrase]);

  const handleSelectPhrase = (phrase: PhraseItem) => {
    setSelectedPhrase(phrase);
    setStep("phrase");
  };

  const handleContinue = useCallback(() => {
    if (step === "phrase") setStep("echo");
    else if (step === "echo") {
      setStep("selection");
      setSelectedPhrase(null);
      setFeedback(null);
    }
  }, [step]);

  // Selection screen
  if (step === "selection") {
    return (
      <div
        className={`min-h-screen w-full ${BG_SAGE} flex flex-col p-8 sm:p-12`}
        style={{
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
        }}
      >
        <a
          href="/"
          className="mb-8 px-6 py-3 bg-white rounded-xl inline-flex items-center gap-2 text-[#2C3E50] hover:bg-[#E8F5E9] transition-colors w-fit focus:outline-none focus:ring-4 focus:ring-[#81C784] focus:ring-opacity-50"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="text-xl">Back</span>
        </a>

        <h1 className="text-4xl sm:text-5xl text-center mb-12 text-[#3D4D3D]">
          Practice Phrases
        </h1>

        <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">
          {(phrasesData as PhraseItem[]).map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectPhrase(item)}
              className="w-full px-8 py-6 bg-white rounded-2xl text-2xl sm:text-3xl text-[#3D4D3D] text-center shadow-sm hover:bg-[#E8F5E9] hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#81C784] focus:ring-opacity-50 flex flex-col sm:flex-row items-center justify-center gap-4"
              aria-label={`Practice: ${item.phrase}`}
            >
              {item.image && (
                <img
                  src={item.image}
                  alt=""
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0"
                />
              )}
              <span>{item.phrase}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedPhrase) return null;

  // Phrase screen - show image + phrase, tap to continue
  if (step === "phrase") {
    return (
      <div
        onClick={handleContinue}
        className={`min-h-screen w-full ${BG_SAGE} flex flex-col items-center justify-center p-8 cursor-pointer transition-colors`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleContinue()}
        aria-label="Tap to continue"
        style={{
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
        }}
      >
        <div className="max-w-4xl w-full flex flex-col items-center">
          {selectedPhrase.image && (
            <div
              className={`w-full max-w-md aspect-square mb-8 rounded-3xl overflow-hidden bg-white shadow-sm transition-opacity duration-500 ${showContent ? "opacity-100" : "opacity-0"}`}
            >
              <img
                src={selectedPhrase.image}
                alt={selectedPhrase.phrase}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div
            className={`text-5xl sm:text-6xl md:text-7xl text-[#3D4D3D] mb-12 text-center leading-relaxed transition-opacity duration-500 ${showContent ? "opacity-100" : "opacity-0"}`}
          >
            {selectedPhrase.phrase}
          </div>
          <div className="text-2xl text-[#6B7A6B] text-center opacity-75">
            Tap to continue
          </div>
        </div>
      </div>
    );
  }

  // Echo screen - Say it with me + speech validation
  if (step === "echo") {
    return (
      <div
        className={`min-h-screen w-full ${BG_BEIGE} flex flex-col items-center justify-center p-8 transition-colors`}
        style={{
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
        }}
      >
        <div className="max-w-4xl w-full flex flex-col items-center">
          {selectedPhrase.image && (
            <div
              className={`w-full max-w-sm aspect-square mb-6 rounded-3xl overflow-hidden bg-white shadow-sm transition-opacity duration-500 ${showContent ? "opacity-100" : "opacity-0"}`}
            >
              <img
                src={selectedPhrase.image}
                alt={selectedPhrase.phrase}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div
            className={`text-4xl sm:text-5xl md:text-6xl text-[#3D4D3D] mb-8 text-center leading-relaxed transition-opacity duration-500 ${showContent ? "opacity-100" : "opacity-0"}`}
          >
            {selectedPhrase.phrase}
          </div>
          <div className="text-3xl text-[#6B7A6B] mb-10 text-center">
            Say it with me
          </div>

          {hasSpeechInput ? (
            <>
              <div className="flex flex-col items-center mb-6">
                <button
                  onClick={startListening}
                  disabled={listening}
                  className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#8BA888] focus:ring-opacity-30 ${
                    listening
                      ? "bg-[#7A9777] shadow-lg ring-4 ring-[#8BA888] ring-opacity-50"
                      : "bg-[#D4E4D4] hover:bg-[#C4D9C4]"
                  }`}
                  aria-label={listening ? "Listening" : "Tap to speak"}
                >
                  <Mic
                    className={`w-14 h-14 sm:w-16 sm:h-16 transition-all duration-300 ${
                      listening ? "text-white scale-110" : "text-[#5A6A5A]"
                    }`}
                    strokeWidth={2}
                  />
                </button>
                {listening && (
                  <span className="mt-3 text-xl text-[#5A6A5A] font-medium">
                    Listening...
                  </span>
                )}
              </div>

              {feedback && feedback !== "unknown" && (
                <div className="mb-6 text-2xl sm:text-3xl text-[#3D4D3D] text-center max-w-md">
                  {FEEDBACK_MESSAGES[feedback]}
                </div>
              )}

              <button
                onClick={handleContinue}
                className="px-12 py-5 sm:px-16 sm:py-6 bg-[#8BA888] text-white text-2xl sm:text-3xl rounded-3xl hover:bg-[#7A9777] transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#8BA888] focus:ring-opacity-40"
                aria-label="Done"
              >
                Done
              </button>
            </>
          ) : (
            <button
              onClick={handleContinue}
              className="px-12 py-5 sm:px-16 sm:py-6 bg-[#8BA888] text-white text-2xl sm:text-3xl rounded-3xl hover:bg-[#7A9777] transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#8BA888] focus:ring-opacity-40"
              aria-label="I said it"
            >
              I said it
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
