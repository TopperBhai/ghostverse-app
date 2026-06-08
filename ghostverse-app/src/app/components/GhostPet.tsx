"use client";

import React from "react";
import type { PetStatus } from "../../types";

interface GhostPetProps {
  status: PetStatus;
  level: number;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function GhostPet({ status, level, className = "", size = "md" }: GhostPetProps) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32"
  };

  const getStyleVars = () => {
    switch (status) {
      case "CELESTIAL":
        return {
          glow: "drop-shadow-[0_0_20px_rgba(34,211,238,0.9)] drop-shadow-[0_0_40px_rgba(255,255,255,0.7)]",
          fill: "text-cyan-200",
          eyeColor: "#083344", // deep cyan
          animation: "animate-[float_2s_ease-in-out_infinite]", // smooth levitation
          expression: "happy",
        };
      case "BLAZING":
        return {
          glow: "drop-shadow-[0_0_20px_rgba(249,115,22,0.9)] drop-shadow-[0_0_40px_rgba(239,68,68,0.6)]",
          fill: "text-orange-400",
          eyeColor: "#450a0a", // deep red/brown
          animation: "animate-[bounce_0.5s_infinite]", // fast intense bounce
          expression: "happy",
        };
      case "RADIANT":
        return {
          glow: "drop-shadow-[0_0_15px_rgba(139,92,246,0.8)] drop-shadow-[0_0_30px_rgba(139,92,246,0.6)]",
          fill: "text-phantom-300",
          eyeColor: "#1e1b4b", // deep indigo
          animation: "animate-[bounce_1s_infinite]",
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
          animation: "animate-[pulse_3s_ease-in-out_infinite]", // very slow pulse
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
  const isCosmic = level >= 75 && status !== "FADED";

  return (
    <div className={`relative flex items-center justify-center ${sizeMap[size]} ${className}`}>
      
      {/* Background Particles for Specific Statuses */}
      {status === "CELESTIAL" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-full">
          <div className="absolute top-0 left-4 w-1.5 h-1.5 bg-cyan-200 rounded-full animate-ping opacity-80" />
          <div className="absolute top-8 right-2 w-2 h-2 bg-white rounded-full animate-ping opacity-90" style={{ animationDelay: "0.3s" }} />
          <div className="absolute bottom-2 left-8 w-1 h-1 bg-cyan-100 rounded-full animate-ping opacity-70" style={{ animationDelay: "0.7s" }} />
          {/* Shooting star trail effect */}
          <div className="absolute top-2 right-8 w-6 h-0.5 bg-gradient-to-l from-transparent to-cyan-300 rotate-45 animate-pulse" />
        </div>
      )}
      
      {status === "BLAZING" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-full">
          <div className="absolute bottom-1 left-2 w-2 h-3 bg-orange-500 rounded-t-full animate-pulse opacity-80" />
          <div className="absolute bottom-0 right-4 w-3 h-4 bg-red-500 rounded-t-full animate-bounce opacity-70" style={{ animationDelay: "0.2s" }} />
          <div className="absolute top-4 left-8 w-1.5 h-2 bg-yellow-400 rounded-full animate-ping opacity-90" />
        </div>
      )}

      {status === "RADIANT" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-full">
          <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-50" />
          <div className="absolute top-5 right-1 w-2 h-2 bg-phantom-300 rounded-full animate-ping opacity-70" style={{ animationDelay: "0.5s" }} />
          <div className="absolute bottom-2 left-6 w-1 h-1 bg-white rounded-full animate-ping opacity-60" style={{ animationDelay: "1s" }} />
        </div>
      )}

      {/* Main Ghost SVG Container */}
      <div className={`w-full h-full ${vars.animation} ${vars.glow} transition-all duration-700`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Cosmic Pattern for Level 75+ */}
            {isCosmic && (
              <pattern id="cosmic-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="currentColor" opacity="0.6" />
                <circle cx="5" cy="5" r="1" fill="#fff" opacity="0.8" className="animate-pulse" />
                <circle cx="15" cy="12" r="0.8" fill="#fbcfe8" opacity="0.6" className="animate-ping" style={{ animationDuration: '3s' }} />
                <circle cx="8" cy="18" r="1.2" fill="#bae6fd" opacity="0.7" className="animate-pulse" style={{ animationDelay: '1s' }} />
              </pattern>
            )}
            
            {/* Cape Gradient */}
            <linearGradient id="cape-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>

            {/* Wing Gradient */}
            <linearGradient id="wing-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fff" opacity="0.8" />
              <stop offset="100%" stopColor="#a78bfa" opacity="0.2" />
            </linearGradient>
          </defs>

          {/* BACKGROUND ACCESSORIES */}
          
          {/* Level 100+: Majestic Cape (Behind the body) */}
          {level >= 100 && (
            <path d="M 25 45 Q 10 70, 5 95 Q 45 90, 85 95 Q 90 70, 75 45 Z" fill="url(#cape-grad)" stroke="#450a0a" strokeWidth="1" className="drop-shadow-lg" />
          )}

          {/* Level 30+: Floating Angel Wings (Behind the body) */}
          {level >= 30 && (
            <g className="animate-[pulse_4s_ease-in-out_infinite]">
              {/* Left Wing */}
              <path d="M 25 50 Q 5 40, 5 25 Q 15 20, 25 35 Z" fill="url(#wing-grad)" />
              {/* Right Wing */}
              <path d="M 75 50 Q 95 40, 95 25 Q 85 20, 75 35 Z" fill="url(#wing-grad)" />
            </g>
          )}

          {/* MAIN GHOST BODY */}
          <path d="M 20 50 
                   C 20 20, 80 20, 80 50 
                   L 80 90 
                   Q 75 80, 70 90 
                   Q 65 80, 60 90 
                   Q 55 80, 50 90 
                   Q 45 80, 40 90 
                   Q 35 80, 30 90 
                   Q 25 80, 20 90 
                   Z" 
                className={vars.fill} 
                fill={isCosmic ? "url(#cosmic-pattern)" : "currentColor"} 
          />

          {/* FOREGROUND ACCESSORIES */}

          {/* Level 50+: Glowing Halo */}
          {level >= 50 && (
            <ellipse cx="50" cy="12" rx="15" ry="4" fill="none" stroke="#fef08a" strokeWidth="3" className="drop-shadow-[0_0_8px_#fde047] animate-[float_3s_ease-in-out_infinite]" />
          )}

          {/* Level 10+: Crown */}
          {level >= 10 && (
            <g className="drop-shadow-md">
              <path d="M 30 25 L 40 15 L 50 23 L 60 15 L 70 25 L 65 30 L 35 30 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
              {/* Level 20+: Ruby Jewel in Crown */}
              {level >= 20 && (
                <circle cx="50" cy="23" r="3" fill="#ef4444" className="drop-shadow-[0_0_2px_#fca5a5]" />
              )}
            </g>
          )}

          {/* FACIAL EXPRESSIONS & CHEEKS */}
          
          {/* Level 5+: Cute Blush / Cheeks (Only if not faded/dead) */}
          {level >= 5 && vars.expression !== "dead" && (
            <g opacity="0.4">
              <ellipse cx="25" cy="50" rx="5" ry="3" fill="#f43f5e" />
              <ellipse cx="75" cy="50" rx="5" ry="3" fill="#f43f5e" />
            </g>
          )}

          {vars.expression === "happy" && (
            <>
              {/* Happy Eyes */}
              <ellipse cx="35" cy="45" rx="4" ry="7" fill={vars.eyeColor} />
              <ellipse cx="65" cy="45" rx="4" ry="7" fill={vars.eyeColor} />
              {/* Sparkle in eyes if level > 20 */}
              {level >= 20 && (
                <>
                  <circle cx="34" cy="42" r="2" fill="#fff" />
                  <circle cx="64" cy="42" r="2" fill="#fff" />
                </>
              )}
              {/* Cute Smile */}
              <path d="M 45 55 Q 50 60, 55 55" stroke={vars.eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          )}
          
          {vars.expression === "sad" && (
            <>
              {/* Sad Eyes */}
              <circle cx="35" cy="48" r="4" fill={vars.eyeColor} />
              <circle cx="65" cy="48" r="4" fill={vars.eyeColor} />
              {/* Frown */}
              <path d="M 45 58 Q 50 53, 55 58" stroke={vars.eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {/* Tear Drop */}
              <path d="M 32 55 Q 35 60, 35 62 Q 35 65, 32 65 Q 29 65, 29 62 Q 29 60, 32 55" fill="#60a5fa" opacity="0.8" className="animate-pulse" />
            </>
          )}
          
          {vars.expression === "dead" && (
            <>
              {/* Dead X Eyes */}
              <path d="M 30 40 L 40 50 M 40 40 L 30 50" stroke={vars.eyeColor} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 60 40 L 70 50 M 70 40 L 60 50" stroke={vars.eyeColor} strokeWidth="2.5" strokeLinecap="round" />
              {/* Straight mouth */}
              <line x1="45" y1="60" x2="55" y2="60" stroke={vars.eyeColor} strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}

          {/* Level 100+: Magical Wand (Held in front) */}
          {level >= 100 && (
            <g className="drop-shadow-lg animate-[float_2.5s_ease-in-out_infinite]" transform="translate(70, 40) rotate(15)">
              <rect x="0" y="10" width="4" height="40" fill="#78350f" rx="2" />
              <circle cx="2" cy="10" r="8" fill="#fef08a" className="drop-shadow-[0_0_10px_#fde047]" />
              <path d="M 2 0 L 5 7 L 12 10 L 5 13 L 2 20 L -1 13 L -8 10 L -1 7 Z" fill="#fff" className="animate-pulse" />
            </g>
          )}

        </svg>
      </div>
    </div>
  );
}
