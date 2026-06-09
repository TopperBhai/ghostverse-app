"use client";

import { useAuth } from "../custom-hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Ghost, Rocket, User as UserIcon, Lock, Zap, 
  Globe, Dices, VenetianMask, Users, Search, 
  Flame, Sparkles, MessageSquare, Shield, Activity 
} from "lucide-react";
import { GhostPet } from "./components/GhostPet";

import type { PetStatus } from "../types";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // For the Gamification Live Preview
  const [previewLevel, setPreviewLevel] = useState(1);
  const [previewStatus, setPreviewStatus] = useState<PetStatus>("HAPPY");

  useEffect(() => {
    if (!loading && user) {
      router.push("/world-chat");
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Cycle through pet statuses to show animation automatically
    const statuses: PetStatus[] = ["HAPPY", "RADIANT", "BLAZING", "CELESTIAL", "FADED"];
    const levels = [5, 25, 50, 100, 1];
    let i = 0; // Start at HAPPY
    const interval = setInterval(() => {
      i = (i + 1) % statuses.length;
      setPreviewStatus(statuses[i]);
      setPreviewLevel(levels[i]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ghost-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-phantom-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-ghost-400 text-sm font-medium animate-pulse">Entering the Universe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ghost-950 bg-grid relative overflow-hidden text-ghost-100 font-sans selection:bg-phantom-500/30">
      {/* Dynamic Background Effects */}
      <div className="bg-gradient-radial absolute inset-0 pointer-events-none opacity-50" />
      <div className="absolute top-[-10%] left-1/4 w-[800px] h-[800px] rounded-full bg-phantom-600/10 blur-[120px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-[-20%] right-1/4 w-[600px] h-[600px] rounded-full bg-fuchsia-600/10 blur-[100px] pointer-events-none animate-float" style={{ animationDelay: '1s' }} />

      {/* Navigation */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-ghost-900 border border-white/10 flex items-center justify-center shadow-inner group-hover:border-phantom-500/50 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all">
              <Ghost className="w-6 h-6 text-phantom-400 group-hover:text-phantom-300 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-black gradient-text tracking-tight">GhostVerse</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-ghost-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary px-5 py-2 text-sm shadow-lg shadow-phantom-500/20 hover:shadow-phantom-500/40">
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        
        {/* Top Hero Typography */}
        <div className="text-center max-w-4xl mx-auto page-slide-up relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-phantom-500/10 border border-phantom-500/20 text-phantom-300 text-sm font-bold mb-8 animate-fade-in backdrop-blur-md">
            <Sparkles className="w-4 h-4" /> The Next-Gen Anonymous Social Network
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-tight drop-shadow-2xl">
            Be <span className="gradient-text animate-gradient bg-[length:200%_auto]">Anyone.</span>
            <br />
            Anywhere.
          </h1>

          <p className="text-xl md:text-2xl text-ghost-300 mb-12 text-balance font-medium leading-relaxed max-w-2xl mx-auto">
            Meet strangers, confess secrets, and build streaks. 
            Experience true freedom without revealing your identity.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-24">
            <Link
              href="/register"
              className="group relative px-8 py-4 bg-phantom-600 hover:bg-phantom-500 text-white font-bold text-lg rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] transition-all flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
              <Rocket className="w-6 h-6 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
              Start Chatting — Free
            </Link>
            <Link 
              href="/login" 
              className="px-8 py-4 bg-ghost-900 border border-ghost-700 hover:bg-ghost-800 hover:border-ghost-600 text-white font-bold text-lg rounded-2xl transition-all flex items-center gap-3 shadow-xl"
            >
              <UserIcon className="w-6 h-6 text-ghost-400" />
              I have an account
            </Link>
          </div>
        </div>

        {/* --- Highlight: Gamification & Ghost Pet Chamber --- */}
        <div className="w-full max-w-5xl mx-auto mb-32 page-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="relative rounded-[2.5rem] bg-ghost-900/40 border border-white/10 backdrop-blur-2xl p-8 md:p-12 overflow-hidden group hover:border-phantom-500/30 transition-colors duration-500">
            {/* Inner background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-phantom-500/10 blur-[80px] pointer-events-none rounded-full" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-400 text-xs font-bold uppercase tracking-wider">
                  <Flame className="w-4 h-4" /> Gamified Social
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                  Evolve your <br/><span className="text-fuchsia-400 drop-shadow-[0_0_15px_rgba(232,121,249,0.5)]">Ghost Pet</span>
                </h2>
                <p className="text-ghost-300 text-lg leading-relaxed">
                  Chat in World Chat, post Haunts, and maintain daily streaks to earn XP. 
                  Watch your pet evolve, gain crowns, and become RADIANT. Don't lose your streak, or it fades!
                </p>
                <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-white">Levels</span>
                    <span className="text-sm text-ghost-400 font-medium">Unlock crowns & jewels</span>
                  </div>
                  <div className="w-px h-12 bg-ghost-800" />
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-white">Streaks</span>
                    <span className="text-sm text-ghost-400 font-medium">Keep it alive daily</span>
                  </div>
                </div>
              </div>

              {/* The Live Preview Chamber */}
              <div className="flex-1 w-full max-w-sm">
                <div className="relative aspect-square rounded-3xl bg-gradient-to-b from-ghost-800/80 to-ghost-950 border-2 border-ghost-700 p-8 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
                  {/* Grid background inside chamber */}
                  <div className="absolute inset-0 bg-grid opacity-30 mix-blend-overlay" />
                  
                  {/* The Pet */}
                  <div className="relative z-10 scale-150 transform mb-8 h-32 flex items-center justify-center">
                    <GhostPet status={previewStatus} level={previewLevel} size="lg" />
                  </div>

                  {/* Status Indicator */}
                  <div className="relative z-10 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 w-full text-center">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-ghost-400 uppercase tracking-widest">Status</span>
                      <span className={`text-sm font-black uppercase tracking-wider ${
                        previewStatus === 'CELESTIAL' ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' :
                        previewStatus === 'BLAZING' ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' :
                        previewStatus === 'RADIANT' ? 'text-phantom-300 drop-shadow-[0_0_5px_rgba(139,92,246,0.8)]' :
                        previewStatus === 'HAPPY' ? 'text-phantom-400' :
                        previewStatus === 'HUNGRY' ? 'text-warning' : 'text-ghost-500'
                      }`}>
                        {previewStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-ghost-400 uppercase tracking-widest">Level</span>
                      <span className="text-sm font-black text-white">
                        Lvl {previewLevel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- Bento Grid Features Showcase --- */}
        <div className="max-w-6xl mx-auto space-y-6 page-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">A Universe of Features</h2>
            <p className="text-ghost-400 text-lg">Everything you need to connect freely and securely.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[240px]">
            {/* World Chat - Large Card */}
            <div className="bento-card md:col-span-2 md:row-span-2 p-8 flex flex-col justify-between">
              <div>
                <div className="bento-icon-wrapper">
                  <Globe className="w-6 h-6 text-phantom-400 group-hover:text-phantom-300 transition-colors" />
                </div>
                <h3 className="text-3xl font-black text-white mb-3">World Chat</h3>
                <p className="text-ghost-300 text-lg leading-relaxed max-w-sm">
                  Jump into the global lobby. Talk with hundreds of users instantly. 
                  Share media, react, and level up your XP together.
                </p>
              </div>
              {/* Mock UI snippet inside card */}
              <div className="mt-8 bg-ghost-950/80 rounded-2xl border border-white/5 p-4 flex flex-col gap-3 backdrop-blur-md opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-phantom-500/20 flex items-center justify-center"><UserIcon className="w-4 h-4 text-phantom-400"/></div>
                  <div className="bg-ghost-800 rounded-2xl rounded-tl-sm px-4 py-2 text-sm">Hello from Tokyo! 🗼</div>
                </div>
                <div className="flex items-center gap-3 self-end">
                  <div className="bg-phantom-600 rounded-2xl rounded-tr-sm px-4 py-2 text-sm text-white font-medium">Welcome to GhostVerse! 👻</div>
                </div>
              </div>
            </div>

            {/* Random Voice */}
            <div className="bento-card md:col-span-2 p-8 flex flex-col justify-center">
              <div className="bento-icon-wrapper">
                <Activity className="w-6 h-6 text-fuchsia-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Random Voice Call</h3>
              <p className="text-ghost-400">Match with strangers globally for 1-on-1 P2P encrypted voice chats. Skip anytime.</p>
            </div>

            {/* Confessions */}
            <div className="bento-card md:col-span-1 p-8 bg-gradient-to-br hover:from-error/10 hover:to-transparent flex flex-col justify-center">
              <div className="bento-icon-wrapper group-hover:border-error/30 group-hover:bg-error/10">
                <VenetianMask className="w-6 h-6 text-error group-hover:text-error" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Confessions</h3>
              <p className="text-ghost-400 text-sm">Spill your deepest secrets 100% anonymously. Upvote and comment.</p>
            </div>

            {/* Private DM */}
            <div className="bento-card md:col-span-1 p-8 flex flex-col justify-center">
              <div className="bento-icon-wrapper">
                <MessageSquare className="w-6 h-6 text-phantom-400" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Private DMs</h3>
              <p className="text-ghost-400 text-sm">Add friends and chat privately with end-to-end security.</p>
            </div>

            {/* Haunts (Feed) */}
            <div className="bento-card md:col-span-2 p-8 flex flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="bento-icon-wrapper">
                  <Ghost className="w-6 h-6 text-neon-cyan" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Haunts</h3>
                <p className="text-ghost-400">Post ephemeral thoughts to your timeline. They vanish like ghosts if not interacted with.</p>
              </div>
            </div>

            {/* Communities */}
            <div className="bento-card md:col-span-2 p-8 flex flex-col justify-center">
              <div className="bento-icon-wrapper">
                <Users className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Communities</h3>
              <p className="text-ghost-400">Create private, password-protected rooms for you and your friends to vibe in peace.</p>
            </div>
          </div>
        </div>


      </main>
    </div>
  );
}
