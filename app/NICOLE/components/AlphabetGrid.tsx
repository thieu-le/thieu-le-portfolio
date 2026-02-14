"use client";

import React from "react";
import Link from "next/link";

interface AlphabetGridProps {
  onLetterSelect: (letter: string) => void;
  visitedLetters: Set<string>;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function AlphabetGrid({
  onLetterSelect,
  visitedLetters,
}: AlphabetGridProps) {
  return (
    <div className="min-h-screen bg-[#F0F7FF] p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl text-center mb-12 text-[#2C3E50]">
          Hi Nicole!
        </h1>

        <div className="flex justify-center mb-6">
          <Link
            href="/phrases"
            className="px-6 py-3 bg-white rounded-xl text-[#2C3E50] hover:bg-[#E8F5E9] transition-colors border-2 border-[#E0E0E0] hover:border-[#81C784] focus:outline-none focus:ring-4 focus:ring-[#81C784] focus:ring-opacity-50"
            aria-label="Practice phrases"
          >
            Practice Phrases
          </Link>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-4">
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              onClick={() => onLetterSelect(letter)}
              className={`
                aspect-square rounded-2xl text-5xl
                transition-all duration-300 ease-out
                ${
                  visitedLetters.has(letter)
                    ? "bg-[#E8F5E9] text-[#388E3C] border-2 border-[#81C784]"
                    : "bg-white text-[#2C3E50] border-2 border-[#E0E0E0]"
                }
                hover:scale-105 hover:shadow-lg
                active:scale-95
                focus:outline-none focus:ring-4 focus:ring-[#81C784] focus:ring-opacity-50
              `}
              aria-label={`Learn letter ${letter}`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
