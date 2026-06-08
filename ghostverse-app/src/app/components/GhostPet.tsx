"use client";

import React from "react";
import type { PetStatus } from "../../types";

interface GhostPetProps {
  status: PetStatus;
  level: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function GhostPet({ status, level, className = "", size = "md" }: GhostPetProps) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const getStyleVars = () => {
    switch (status) {
      case "RADIANT":
        return {
          glow: "drop-shadow-[0_0_15px_rgba(139,92,246,0.8)] drop-shadow-[0_0_30px_rgba(139,92,246,0.6)]",
          fill: "text-phantom-300",
          eyeColor: "#1e1b4b", // deep indigo
          animation: "animate-bounce duration-1000",
          expression: "happy",
        };
      case "HAPPY":
        return {
          glow: "drop-shadow-[0_0_10px_rgba(139,92,246,0.4)]",
          fill: "text-phantom-400",
          eyeColor: "#1e1b4b",
          animation: "animate-pulse",
          expression: "happy",
        };
      case "HUNGRY":
        return {
          glow: "drop-shadow-[0_0_5px_rgba(156,163,175,0.3)]",
          fill: "text-ghost-400",
          eyeColor: "#1f2937",
          animation: "animate-pulse duration-3000", // very slow pulse
          expression: "sad",
        };
      case "FADED":
      default:
        return {
          glow: "drop-shadow-[0_0_2px_rgba(75,85,99,0.5)]",
          fill: "text-ghost-600",
          eyeColor: "#111827",
          animation: "",
          expression: "dead",
        };
    }
  };

  const vars = getStyleVars();

  // Basic SVG drawing of a cute ghost
  return (
    <div className={`relative flex items-center justify-center ${sizeMap[size]} ${className}`}>
      {/* The Ghost SVG */}
      <div className={`w-full h-full ${vars.animation} ${vars.glow} transition-all duration-700`}>
        <svg
          viewBox="0 0 100 100"
          className={`w-full h-full ${vars.fill}`}
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ghost Body */}
          <path d="M 20 50 
                   C 20 20, 80 20, 80 50 
                   L 80 90 
                   Q 75 80, 70 90 
                   Q 65 80, 60 90 
                   Q 55 80, 50 90 
                   Q 45 80, 40 90 
                   Q 35 80, 30 90 
                   Q 25 80, 20 90 
                   Z" />

          {/* Eyes based on expression */}
          {vars.expression === "happy" && (
            <>
              <ellipse cx="35" cy="45" rx="4" ry="7" fill={vars.eyeColor} />
              <ellipse cx="65" cy="45" rx="4" ry="7" fill={vars.eyeColor} />
              {/* Smile */}
              <path d="M 45 55 Q 50 60, 55 55" stroke={vars.eyeColor} strokeWidth="2" fill="none" strokeLinecap="round" />
            </>
          )}
          {vars.expression === "sad" && (
            <>
              <circle cx="35" cy="48" r="4" fill={vars.eyeColor} />
              <circle cx="65" cy="48" r="4" fill={vars.eyeColor} />
              {/* Frown */}
              <path d="M 45 58 Q 50 53, 55 58" stroke={vars.eyeColor} strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Tear */}
              <path d="M 32 55 Q 35 60, 35 62 Q 35 65, 32 65 Q 29 65, 29 62 Q 29 60, 32 55" fill="#60a5fa" opacity="0.8" />
            </>
          )}
          {vars.expression === "dead" && (
            <>
              <path d="M 30 40 L 40 50 M 40 40 L 30 50" stroke={vars.eyeColor} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 60 40 L 70 50 M 70 40 L 60 50" stroke={vars.eyeColor} strokeWidth="2.5" strokeLinecap="round" />
              {/* Straight mouth */}
              <line x1="45" y1="60" x2="55" y2="60" stroke={vars.eyeColor} strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {/* Level Crown/Accessories based on Level */}
          {level >= 5 && (
            <path d="M 30 20 L 40 10 L 50 18 L 60 10 L 70 20 L 65 25 L 35 25 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" className="drop-shadow-sm" />
          )}
          {level >= 10 && (
            <circle cx="50" cy="18" r="3" fill="#ef4444" /> // Jewel on the crown
          )}
        </svg>
      </div>

      {/* Floating particles for Radiant */}
      {status === "RADIANT" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-full">
          <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-50" />
          <div className="absolute top-5 right-1 w-2 h-2 bg-phantom-300 rounded-full animate-ping opacity-70" style={{ animationDelay: "0.5s" }} />
          <div className="absolute bottom-2 left-6 w-1 h-1 bg-white rounded-full animate-ping opacity-60" style={{ animationDelay: "1s" }} />
        </div>
      )}
    </div>
  );
}
