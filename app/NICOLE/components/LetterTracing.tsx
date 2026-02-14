"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { StarAnimation } from "./StarAnimation";

interface LetterTracingProps {
  letter: string;
  onBack: () => void;
  onContinue: () => void;
}

export function LetterTracing({ letter, onBack, onContinue }: LetterTracingProps) {
  const letterCanvasRef = useRef<HTMLCanvasElement>(null);
  const dottedGuideCanvasRef = useRef<HTMLCanvasElement>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement>(null);
  const hasDrawnRef = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  const drawDottedGuide = useCallback((
    ctx: CanvasRenderingContext2D,
    text: string,
    fontSize: number,
    centerX: number,
    centerY: number
  ) => {
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "#BDBDBD";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 10]);
    ctx.strokeText(text, centerX, centerY);
    ctx.setLineDash([]);
  }, []);

  const initializeCanvas = useCallback((
    canvas: HTMLCanvasElement | null,
    text: string,
    fontSize: number,
    isGuide: boolean = false
  ) => {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    if (isGuide) {
      // Draw guide text (solid fill) on hidden guide canvas for accuracy tracking
      ctx.font = `${fontSize}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#E0E0E0";
      ctx.fillText(text, rect.width / 2, rect.height / 2);
    }
  }, []);

  // Initialize canvases
  useEffect(() => {
    const canvas = letterCanvasRef.current;
    const dottedCanvas = dottedGuideCanvasRef.current;
    if (!canvas || !dottedCanvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio;

    // Drawing canvas: transparent, user strokes only (no guide)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Dotted guide canvas: visible layer underneath
    dottedCanvas.width = rect.width * dpr;
    dottedCanvas.height = rect.height * dpr;
    const dottedCtx = dottedCanvas.getContext("2d");
    if (dottedCtx) {
      dottedCtx.scale(dpr, dpr);
      drawDottedGuide(dottedCtx, letter, 200, rect.width / 2, rect.height / 2);
    }

    // Hidden guide canvas for tracking
    if (guideCanvasRef.current) {
      initializeCanvas(guideCanvasRef.current, letter, 200, true);
    }
  }, [letter, initializeCanvas, drawDottedGuide]);

  const clearCanvas = () => {
    const canvas = letterCanvasRef.current;
    const dottedCanvas = dottedGuideCanvasRef.current;
    if (!canvas || !dottedCanvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    hasDrawnRef.current = false;
    setHasCompleted(false);
    setShowStars(false);

    // Redraw dotted guide on its own canvas (drawing canvas stays empty)
    const dottedCtx = dottedCanvas.getContext("2d");
    if (dottedCtx) {
      const dpr = window.devicePixelRatio;
      dottedCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dottedCtx.clearRect(0, 0, rect.width, rect.height);
      drawDottedGuide(dottedCtx, letter, 200, rect.width / 2, rect.height / 2);
    }

    if (guideCanvasRef.current) {
      initializeCanvas(guideCanvasRef.current, letter, 200, true);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    // Check accuracy only when user has actually drawn (not on clear)
    if (hasDrawnRef.current) {
      setTimeout(checkTracingAccuracy, 200);
    }
  };

  // Highlight the traced path with a glow effect
  const highlightTracing = useCallback(() => {
    const canvas = letterCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Copy current strokes to temp canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;
    tempCtx.drawImage(canvas, 0, 0);

    // Clear and redraw with glow (shadow applies to drawImage)
    const dpr = window.devicePixelRatio;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#81C784";
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height, 0, 0, w, h);
    ctx.restore();
  }, []);

  // Check tracing accuracy
  const checkTracingAccuracy = useCallback(() => {
    const canvas = letterCanvasRef.current;
    const guideCanvas = guideCanvasRef.current;
    if (!canvas || !guideCanvas || hasCompleted) return;

    const ctx = canvas.getContext("2d");
    const guideCtx = guideCanvas.getContext("2d");
    if (!ctx || !guideCtx) return;

    // Get image data from both canvases
    const drawnData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const guideData = guideCtx.getImageData(0, 0, guideCanvas.width, guideCanvas.height);

    let guidePixels = 0;
    let matchedPixels = 0;
    const tolerance = 25; // Stricter: drawn pixel must be closer to guide

    // Sample guide pixels (every 20th pixel for better coverage)
    for (let i = 0; i < guideData.data.length; i += 20) {
      const alpha = guideData.data[i + 3];
      if (alpha > 50) {
        // Guide pixel exists
        guidePixels++;
        const x = (i / 4) % guideCanvas.width;
        const y = Math.floor((i / 4) / guideCanvas.width);

        // Check if there's a drawn pixel nearby (stricter search)
        let foundMatch = false;
        for (let dy = -tolerance; dy <= tolerance && !foundMatch; dy += 4) {
          for (let dx = -tolerance; dx <= tolerance && !foundMatch; dx += 4) {
            const checkX = Math.floor(x + dx);
            const checkY = Math.floor(y + dy);
            if (checkX >= 0 && checkX < canvas.width && checkY >= 0 && checkY < canvas.height) {
              const checkIdx = (checkY * canvas.width + checkX) * 4;
              const drawnAlpha = drawnData.data[checkIdx + 3];
              if (drawnAlpha > 50) {
                matchedPixels++;
                foundMatch = true;
              }
            }
          }
        }
      }
    }

    if (guidePixels > 0) {
      const accuracy = (matchedPixels / guidePixels) * 100;
      
      // Trigger celebration only when most of the letter is traced (85% threshold)
      if (accuracy >= 85 && !hasCompleted) {
        setHasCompleted(true);
        highlightTracing();
        setShowStars(true);
      }
    }
  }, [hasCompleted, highlightTracing]);

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing && e.type !== "mousedown" && e.type !== "touchstart") return;

    const canvas = letterCanvasRef.current;
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
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#81C784";

    if (e.type === "mousedown" || e.type === "touchstart") {
      hasDrawnRef.current = true;
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
      
      // Check accuracy periodically while drawing
      if (Math.random() < 0.1) {
        // Check 10% of the time to avoid performance issues
        setTimeout(checkTracingAccuracy, 100);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF] p-8">
      {showStars && (
        <StarAnimation
          onComplete={() => {
            setShowStars(false);
          }}
        />
      )}
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
          Practice Tracing the Letter
        </h2>

        {/* Letter tracing */}
        <div className="bg-white rounded-3xl p-8 mb-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl text-[#2C3E50]">Trace the Letter: {letter}</h3>
            <button
              onClick={clearCanvas}
              className="px-4 py-2 bg-[#E8F5E9] text-[#388E3C] rounded-lg flex items-center gap-2
                         hover:bg-[#81C784] hover:text-white transition-colors duration-300
                         focus:outline-none focus:ring-4 focus:ring-[#81C784] focus:ring-opacity-50"
              aria-label="Clear letter tracing"
            >
              <RotateCcw className="w-5 h-5" />
              Clear
            </button>
          </div>
          <div className="relative bg-[#FAFAFA] rounded-2xl">
            <canvas
              ref={dottedGuideCanvasRef}
              className="absolute inset-0 w-full h-96 rounded-2xl pointer-events-none z-0"
              aria-hidden="true"
            />
            <canvas
              ref={letterCanvasRef}
              className="w-full h-96 rounded-2xl cursor-crosshair touch-none relative z-10 bg-transparent"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {/* Hidden guide canvas for tracking */}
            <canvas
              ref={guideCanvasRef}
              className="absolute inset-0 w-full h-96 opacity-0 pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Continue button */}
        <div className="text-center">
          <button
            onClick={onContinue}
            className="px-12 py-5 bg-[#81C784] text-white text-2xl rounded-2xl
                       hover:bg-[#66BB6A] transition-colors duration-300
                       focus:outline-none focus:ring-4 focus:ring-[#81C784] focus:ring-opacity-50"
            aria-label="Continue to word tracing"
          >
            Trace the Word
          </button>
        </div>
      </div>
    </div>
  );
}
