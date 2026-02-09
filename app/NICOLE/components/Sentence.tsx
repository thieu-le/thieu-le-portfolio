"use client";

import React, { useState } from "react";
import { Volume2, ArrowLeft, Home } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";

interface Word {
  word: string;
  image: string;
  sentence: string;
  audio: string | null;
}

interface SentenceProps {
  letter: string;
  word: Word;
  onBack: () => void;
  onBackToGrid: () => void;
}

export function Sentence({
  letter,
  word,
  onBack,
  onBackToGrid,
}: SentenceProps) {
  const [wordAudioPlaying, setWordAudioPlaying] = useState(false);
  const [sentenceAudioPlaying, setSentenceAudioPlaying] = useState(false);

  const handlePlayWord = () => {
    if ("speechSynthesis" in window) {
      // Stop any current speech
      window.speechSynthesis.cancel();
      setWordAudioPlaying(true);
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.rate = 0.8; // Slower, calmer speech
      utterance.pitch = 1.0;
      utterance.onend = () => setWordAudioPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePlaySentence = () => {
    if ("speechSynthesis" in window) {
      // Stop any current speech
      window.speechSynthesis.cancel();
      setSentenceAudioPlaying(true);
      const utterance = new SpeechSynthesisUtterance(word.sentence);
      utterance.rate = 0.7; // Even slower for sentence comprehension
      utterance.pitch = 1.0;
      utterance.onend = () => setSentenceAudioPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation buttons */}
        <div className="flex justify-between mb-8">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-white rounded-xl flex items-center gap-2 text-[#2C3E50] 
                       hover:bg-[#E8F5E9] transition-colors duration-300
                       focus:outline-none focus:ring-4 focus:ring-[#81C784] focus:ring-opacity-50"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-xl">Back</span>
          </button>

          <button
            onClick={onBackToGrid}
            className="px-6 py-3 bg-white rounded-xl flex items-center gap-2 text-[#2C3E50] 
                       hover:bg-[#E8F5E9] transition-colors duration-300
                       focus:outline-none focus:ring-4 focus:ring-[#81C784] focus:ring-opacity-50"
            aria-label="Back to alphabet grid"
          >
            <Home className="w-6 h-6" />
            <span className="text-xl">Alphabet</span>
          </button>
        </div>

        <h2 className="text-3xl text-center mb-8 text-[#2C3E50]">
          Read the Sentence
        </h2>

        {/* Main content */}
        <div className="bg-white rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col items-center gap-8">
            {/* Image */}
            <div className="w-full max-w-md aspect-square rounded-2xl overflow-hidden bg-[#F5F5F5] relative">
              <ImageWithFallback
                src={word.image}
                alt={word.word}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Letter reminder */}
            <div className="text-7xl text-[#2C3E50]">{letter}</div>

            {/* Word reminder */}
            <div className="text-4xl text-[#388E3C]">{word.word}</div>

            {/* Sentence */}
            <div className="bg-[#F0F7FF] rounded-2xl p-8 w-full">
              <p className="text-3xl text-center text-[#2C3E50] leading-relaxed">
                {word.sentence}
              </p>
            </div>

            {/* Audio buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              {/* Word audio button */}
              <button
                onClick={handlePlayWord}
                disabled={wordAudioPlaying || sentenceAudioPlaying}
                className={`
                  flex-1 px-8 py-4 rounded-xl flex items-center justify-center gap-3 text-xl
                  transition-all duration-300
                  ${
                    wordAudioPlaying || sentenceAudioPlaying
                      ? "bg-[#E0E0E0] text-[#999] cursor-not-allowed"
                      : "bg-[#E8F5E9] text-[#388E3C] hover:bg-[#81C784] hover:text-white"
                  }
                  focus:outline-none focus:ring-4 focus:ring-[#81C784] focus:ring-opacity-50
                `}
                aria-label="Listen to word"
              >
                <Volume2 className="w-6 h-6" />
                {wordAudioPlaying ? "Playing..." : "Listen to Word"}
              </button>

              {/* Sentence audio button */}
              <button
                onClick={handlePlaySentence}
                disabled={wordAudioPlaying || sentenceAudioPlaying}
                className={`
                  flex-1 px-8 py-4 rounded-xl flex items-center justify-center gap-3 text-xl
                  transition-all duration-300
                  ${
                    wordAudioPlaying || sentenceAudioPlaying
                      ? "bg-[#E0E0E0] text-[#999] cursor-not-allowed"
                      : "bg-[#E8F5E9] text-[#388E3C] hover:bg-[#81C784] hover:text-white"
                  }
                  focus:outline-none focus:ring-4 focus:ring-[#81C784] focus:ring-opacity-50
                `}
                aria-label="Listen to sentence"
              >
                <Volume2 className="w-6 h-6" />
                {sentenceAudioPlaying ? "Reading..." : "Listen to Sentence"}
              </button>
            </div>

            {/* Back to alphabet */}
            <button
              onClick={onBackToGrid}
              className="mt-4 px-12 py-5 bg-[#81C784] text-white text-2xl rounded-2xl
                         hover:bg-[#66BB6A] transition-colors duration-300
                         focus:outline-none focus:ring-4 focus:ring-[#81C784] focus:ring-opacity-50"
              aria-label="Choose another letter"
            >
              Choose Another Letter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
