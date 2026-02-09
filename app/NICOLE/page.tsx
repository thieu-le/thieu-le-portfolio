"use client";

import { useState } from "react";
import { AlphabetGrid } from "./components/AlphabetGrid";
import { LetterDetail } from "./components/LetterDetail";
import { LetterTracing } from "./components/LetterTracing";
import { WordTracing } from "./components/WordTracing";
import { Sentence } from "./components/Sentence";
import wordsData from "./data/words.json";

type Screen = "grid" | "letter" | "letterTracing" | "wordTracing" | "sentence";

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

  const handleGoToLetterTracing = () => {
    setCurrentScreen("letterTracing");
  };

  const handleGoToWordTracing = () => {
    setCurrentScreen("wordTracing");
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
          onTracing={handleGoToLetterTracing}
        />
      )}

      {currentScreen === "letterTracing" && selectedLetter && (
        <LetterTracing
          letter={selectedLetter}
          onBack={handleBackToLetter}
          onContinue={handleGoToWordTracing}
        />
      )}

      {currentScreen === "wordTracing" && selectedLetter && getCurrentWord() && (
        <WordTracing
          word={getCurrentWord()!.word}
          onBack={() => setCurrentScreen("letterTracing")}
          onContinue={handleGoToSentence}
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
