"use client";

import React, { useRef, useEffect, useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";

interface WordTracingProps {
  word: string;
  onBack: () => void;
  onContinue: () => void;
}

export function WordTracing({ word, onBack, onContinue }: WordTracingProps) {
  const wordCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const initializeCanvas = (
    canvas: HTMLCanvasElement | null,
    text: string,
    fontSize: number
  ) => {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Calculate font size based on word length to prevent cutoff
    const maxWidth = rect.width * 0.9; // Leave 10% margin
    let adjustedFontSize = fontSize;
    
    // Measure text and adjust font size if needed
    ctx.font = `${adjustedFontSize}px Arial, sans-serif`;
    const metrics = ctx.measureText(text);
    
    if (metrics.width > maxWidth) {
      adjustedFontSize = (maxWidth / metrics.width) * fontSize;
      adjustedFontSize = Math.max(40, adjustedFontSize); // Minimum readable size
    }

    // Draw guide text (faded)
    ctx.font = `${adjustedFontSize}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#E0E0E0";
    ctx.fillText(text, rect.width / 2, rect.height / 2);
  };

  // Initialize canvas
  useEffect(() => {
    initializeCanvas(wordCanvasRef.current, word, 120);
  }, [word]);

  const clearCanvas = () => {
    const canvas = wordCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Redraw guide with same sizing logic
    const maxWidth = rect.width * 0.9;
    let adjustedFontSize = 120;
    ctx.font = `${adjustedFontSize}px Arial, sans-serif`;
    const metrics = ctx.measureText(word);
    
    if (metrics.width > maxWidth) {
      adjustedFontSize = (maxWidth / metrics.width) * 120;
      adjustedFontSize = Math.max(40, adjustedFontSize);
    }

    ctx.font = `${adjustedFontSize}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#E0E0E0";
    ctx.fillText(word, rect.width / 2, rect.height / 2);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing && e.type !== "mousedown" && e.type !== "touchstart") return;

    const canvas = wordCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    // Gentle, calm drawing style
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#81C784";

    if (e.type === "mousedown" || e.type === "touchstart") {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
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
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="text-xl">Back</span>
        </button>

        <h2 className="text-3xl text-center mb-8 text-[#2C3E50]">
          Practice Tracing the Word
        </h2>

        {/* Word tracing */}
        <div className="bg-white rounded-3xl p-8 mb-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-2xl text-[#2C3E50]">Trace the Word: {word}</h3>
            <button
              onClick={clearCanvas}
              className="px-4 py-2 bg-[#E8F5E9] text-[#388E3C] rounded-lg flex items-center gap-2
                         hover:bg-[#81C784] hover:text-white transition-colors duration-300
                         focus:outline-none focus:ring-4 focus:ring-[#81C784] focus:ring-opacity-50"
              aria-label="Clear word tracing"
            >
              <RotateCcw className="w-5 h-5" />
              Clear
            </button>
          </div>
          <canvas
            ref={wordCanvasRef}
            className="w-full h-96 bg-[#FAFAFA] rounded-2xl cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        {/* Continue button */}
        <div className="text-center">
          <button
            onClick={onContinue}
            className="px-12 py-5 bg-[#81C784] text-white text-2xl rounded-2xl
                       hover:bg-[#66BB6A] transition-colors duration-300
                       focus:outline-none focus:ring-4 focus:ring-[#81C784] focus:ring-opacity-50"
            aria-label="Continue to sentence"
          >
            See the Sentence
          </button>
        </div>
      </div>
    </div>
  );
}
