"use client";

import { useState } from "react";
import { AlphabetGrid } from "./components/AlphabetGrid";
import { LetterDetail } from "./components/LetterDetail";
import { Tracing } from "./components/Tracing";
import { Sentence } from "./components/Sentence";
import wordsData from "./data/words.json";

type Screen = "grid" | "letter" | "tracing" | "sentence";

export default function NicolePage() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("grid");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number>(0);
  const [visitedLetters, setVisitedLetters] = useState<Set<string>>(new Set());

  const handleLetterSelect = (letter: string) => {
    setSelectedLetter(letter);
    setSelectedWordIndex(0);
    setCurrentScreen("letter");
    // Mark as visited (gentle tracking, no pressure)
    setVisitedLetters((prev) => new Set(prev).add(letter));
  };

  const handleBackToGrid = () => {
    setCurrentScreen("grid");
    setSelectedLetter(null);
  };

  const handleGoToTracing = () => {
    setCurrentScreen("tracing");
  };

  const handleGoToSentence = () => {
    setCurrentScreen("sentence");
  };

  const handleBackToLetter = () => {
    setCurrentScreen("letter");
  };

  const getCurrentWord = () => {
    if (!selectedLetter) return null;
    const letterWords = wordsData[selectedLetter as keyof typeof wordsData];
    return letterWords?.[selectedWordIndex] || null;
  };

  return (
    <div className="size-full">
      {currentScreen === "grid" && (
        <AlphabetGrid
          onLetterSelect={handleLetterSelect}
          visitedLetters={visitedLetters}
        />
      )}

      {currentScreen === "letter" && selectedLetter && (
        <LetterDetail
          letter={selectedLetter}
          word={getCurrentWord()}
          onBack={handleBackToGrid}
          onTracing={handleGoToTracing}
        />
      )}

      {currentScreen === "tracing" && selectedLetter && getCurrentWord() && (
        <Tracing
          letter={selectedLetter}
          word={getCurrentWord()!.word}
          onBack={handleBackToLetter}
          onContinueToSentence={handleGoToSentence}
        />
      )}

      {currentScreen === "sentence" && selectedLetter && getCurrentWord() && (
        <Sentence
          letter={selectedLetter}
          word={getCurrentWord()!}
          onBack={handleBackToLetter}
          onBackToGrid={handleBackToGrid}
        />
      )}
    </div>
  );
}
