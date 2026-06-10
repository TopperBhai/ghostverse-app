"use client";

import { useAuth } from "../custom-hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { 
  Ghost, User as UserIcon, MessageSquare, 
  Globe, Shield, Star, Smartphone, Lock, Activity, Download
} from "lucide-react";
import { ThemeToggle } from "./components/ThemeToggle";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/world-chat");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-phantom-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-phantom-500/30">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-black/80 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-10 h-10 rounded-xl bg-phantom-500 flex items-center justify-center shadow-lg overflow-hidden">
              <Ghost className="w-6 h-6 text-white group-hover:scale-110 transition-transform relative z-10" />
            </div>
            <div className="text-xl font-bold tracking-tight flex items-center">
              <span className="text-white">Ghost</span>
              <span className="text-phantom-500">Verse</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-ghost-300 hover:text-white transition-colors hidden sm:block">
              Log In
            </Link>
            <Link href="/register" className="bg-phantom-500 hover:bg-phantom-600 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg shadow-phantom-500/20">
              Get App
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        {/* App Store Hero Section */}
        <section className="max-w-7xl mx-auto px-6 mb-24">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-phantom-500/10 text-phantom-500 text-sm font-bold mb-6">
                <Star className="w-4 h-4 fill-phantom-500" /> #1 Anonymous Social Network
              </div>
              <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight">
                Be Anyone.<br />
                <span className="text-phantom-500">Anywhere.</span>
              </h1>
              <p className="text-xl text-ghost-400 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Meet strangers, confess secrets, and build streaks. Experience true freedom without revealing your identity on the most secure social platform.
              </p>
              
              {/* App Store Style CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-phantom-500 hover:bg-phantom-600 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all"
                >
                  <Download className="w-6 h-6" />
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] uppercase tracking-wider opacity-80 leading-none">Download for</span>
                    <span className="text-lg leading-none mt-1">Web Platform</span>
                  </div>
                </Link>
                <Link
                  href="/world-chat"
                  className="w-full sm:w-auto px-8 py-4 bg-ghost-900 hover:bg-ghost-800 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all border border-white/5"
                >
                  <Globe className="w-6 h-6 text-phantom-500" />
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] uppercase tracking-wider opacity-80 leading-none">Explore the</span>
                    <span className="text-lg leading-none mt-1">World Chat</span>
                  </div>
                </Link>
              </div>
              
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-2 text-sm text-ghost-500 font-medium">
                <Shield className="w-4 h-4" /> 100% Anonymous & Secure
              </div>
            </div>

            {/* Device Mockup */}
            <div className="flex-1 relative w-full max-w-md mx-auto">
              <div className="relative aspect-[9/19] bg-ghost-950 rounded-[3rem] border-[8px] border-ghost-900 shadow-2xl shadow-phantom-500/10 overflow-hidden">
                {/* Mock UI inside device */}
                <div className="absolute inset-0 bg-black flex flex-col">
                  <div className="bg-ghost-900 p-4 pt-8 flex items-center justify-between border-b border-white/5">
                    <h3 className="font-bold">World Chat</h3>
                    <div className="w-8 h-8 rounded-full bg-phantom-500 flex items-center justify-center"><Ghost className="w-4 h-4"/></div>
                  </div>
                  <div className="flex-1 p-4 space-y-4 overflow-hidden">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-ghost-800 shrink-0" />
                      <div className="bg-ghost-900 p-3 rounded-2xl rounded-tl-sm text-sm border border-white/5">Hello from Tokyo! Anyone here?</div>
                    </div>
                    <div className="flex items-start gap-3 flex-row-reverse">
                      <div className="bg-phantom-600 p-3 rounded-2xl rounded-tr-sm text-sm text-white">Welcome to the Verse! 👻</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-ghost-800 shrink-0" />
                      <div className="bg-ghost-900 p-3 rounded-2xl rounded-tl-sm text-sm border border-white/5">Just hit a 50-day streak!</div>
                    </div>
                  </div>
                  <div className="p-4 border-t border-white/5 bg-ghost-900">
                    <div className="h-10 rounded-full bg-black border border-white/10 flex items-center px-4">
                      <span className="text-ghost-500 text-sm">Message...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Screenshots / Features Carousel Style */}
        <section className="bg-ghost-950 border-y border-white/5 py-24 mb-24">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-black mb-12 text-center">Everything you need. <br/><span className="text-ghost-500">Nothing you don't.</span></h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-black p-8 rounded-3xl border border-white/5">
                <div className="w-12 h-12 rounded-xl bg-phantom-500/10 flex items-center justify-center mb-6">
                  <Globe className="w-6 h-6 text-phantom-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">World Chat</h3>
                <p className="text-ghost-400">Join the massive global lobby. Connect with hundreds of anonymous users instantly in real-time.</p>
              </div>
              <div className="bg-black p-8 rounded-3xl border border-white/5">
                <div className="w-12 h-12 rounded-xl bg-phantom-500/10 flex items-center justify-center mb-6">
                  <Activity className="w-6 h-6 text-phantom-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">Random Voice</h3>
                <p className="text-ghost-400">Match with strangers globally for 1-on-1 encrypted voice chats. Skip anytime if the vibe isn't right.</p>
              </div>
              <div className="bg-black p-8 rounded-3xl border border-white/5">
                <div className="w-12 h-12 rounded-xl bg-phantom-500/10 flex items-center justify-center mb-6">
                  <Lock className="w-6 h-6 text-phantom-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">Secret Confessions</h3>
                <p className="text-ghost-400">Spill your deepest secrets 100% anonymously. Read, upvote, and comment on others' confessions.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Ratings & Social Proof */}
        <section className="max-w-5xl mx-auto px-6 mb-24 text-center">
          <div className="flex items-center justify-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-8 h-8 fill-phantom-500 text-phantom-500" />
            ))}
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-16 tracking-tight">"The most liberating social<br/>experience on the web."</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="p-6 bg-ghost-900 rounded-2xl border border-white/5">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-phantom-500 text-phantom-500" />)}
              </div>
              <p className="font-medium mb-4">"Finally a place where I can just be myself without worrying about followers or real-life connections. The Ghost Pet gamification is super addicting too!"</p>
              <div className="text-sm text-ghost-400">— Anonymous User, Lvl 42</div>
            </div>
            <div className="p-6 bg-ghost-900 rounded-2xl border border-white/5">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-phantom-500 text-phantom-500" />)}
              </div>
              <p className="font-medium mb-4">"The World Chat moves so fast but it's incredibly fun. The random voice feature works flawlessly and the audio quality is surprisingly good."</p>
              <div className="text-sm text-ghost-400">— Anonymous User, Lvl 15</div>
            </div>
          </div>
        </section>

        {/* Final Bottom CTA */}
        <section className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-phantom-500 p-12 rounded-[3rem] shadow-[0_0_50px_rgba(225,29,72,0.2)]">
            <h2 className="text-4xl font-black text-white mb-6">Ready to drop the mask?</h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">Join thousands of others in the GhostVerse today. No real names, no phone numbers required.</p>
            <Link
              href="/register"
              className="inline-flex px-8 py-4 bg-white text-phantom-500 hover:bg-ghost-100 font-black rounded-2xl transition-all"
            >
              Create Free Account
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
