"use client";

import React, { useState } from "react";
import { Volume2, ArrowLeft } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";

interface Word {
  word: string;
  image: string;
  sentence: string;
  audio: string | null;
}

interface LetterDetailProps {
  letter: string;
  word: Word | null;
  onBack: () => void;
  onTracing: () => void;
}

export function LetterDetail({
  letter,
  word,
  onBack,
  onTracing,
}: LetterDetailProps) {
  const [audioPlaying, setAudioPlaying] = useState(false);

  if (!word) {
    return (
      <div className="min-h-screen bg-[#F0F7FF] p-8">
        <div className="text-center">
          <p className="text-[#666]">No word found for this letter.</p>
          <button
            onClick={onBack}
            className="mt-4 px-6 py-2 bg-white text-[#2C3E50] rounded-xl hover:bg-[#E8F5E9] transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Simple text-to-speech function (user must click to activate)
  const handlePlayAudio = () => {
    if ("speechSynthesis" in window) {
      setAudioPlaying(true);
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.rate = 0.8; // Slower, calmer speech
      utterance.pitch = 1.0;
      utterance.onend = () => setAudioPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="mb-8 px-6 py-3 bg-white rounded-xl flex items-center gap-2 text-[#2C3E50] 
                     hover:bg-[#E8F5E9] transition-colors duration-300
                     focus:outline-none focus:ring-4 focus:ring-[#81C784] focus:ring-opacity-50"
          aria-label="Go back to alphabet grid"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="text-xl">Back</span>
        </button>

        {/* Letter display */}
        <div className="bg-white rounded-3xl p-12 mb-8 text-center shadow-sm">
          <div className="text-9xl mb-4 text-[#2C3E50]">{letter}</div>
          <div className="text-3xl text-[#666] mb-2">{letter.toLowerCase()}</div>
        </div>

        {/* Word and Image */}
        <div className="bg-white rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col items-center gap-6">
            {/* Image */}
            <div className="w-full max-w-md aspect-square rounded-2xl overflow-hidden bg-[#F5F5F5] relative">
              <ImageWithFallback
                src={word.image}
                alt={word.word}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Word */}
            <div className="text-5xl text-[#2C3E50] text-center">
              {word.word}
            </div>

            {/* Audio button */}
            <button
              onClick={handlePlayAudio}
              disabled={audioPlaying}
              className={`
                px-8 py-4 rounded-xl flex items-center gap-3 text-xl
                transition-all duration-300
                ${
                  audioPlaying
                    ? "bg-[#E0E0E0] text-[#999] cursor-not-allowed"
                    : "bg-[#E8F5E9] text-[#388E3C] hover:bg-[#81C784] hover:text-white"
                }
                focus:outline-none focus:ring-4 focus:ring-[#81C784] focus:ring-opacity-50
              `}
              aria-label="Listen to word"
            >
              <Volume2 className="w-6 h-6" />
              {audioPlaying ? "Playing..." : "Listen"}
            </button>

            {/* Continue button */}
            <button
              onClick={onTracing}
              className="mt-4 px-12 py-5 bg-[#81C784] text-white text-2xl rounded-2xl
                         hover:bg-[#66BB6A] transition-colors duration-300
                         focus:outline-none focus:ring-4 focus:ring-[#81C784] focus:ring-opacity-50"
              aria-label="Practice tracing"
            >
              Practice Tracing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
