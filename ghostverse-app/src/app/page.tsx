"use client";

import { useAuth } from "../custom-hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Ghost, Rocket, User as UserIcon, Lock, Zap, Globe, Dices, VenetianMask, Users, Search, Flame } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-ghost-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-phantom-500 border-t-transparent rounded-full" style={{ animation: "spin 1s linear infinite" }} />
          <p className="text-ghost-400 text-sm">Loading GhostVerse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ghost-950 bg-grid relative overflow-hidden">
      {/* Background effects */}
      <div className="bg-gradient-radial absolute inset-0 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-phantom-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-neon-cyan/5 blur-3xl pointer-events-none" />

      {/* Navigation */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ghost className="w-6 h-6 text-phantom-400" />
            <span className="text-xl font-bold gradient-text">GhostVerse</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-20">
        <div className="text-center max-w-3xl mx-auto page-slide-up">
          {/* Ghost icon with glow */}
          <div className="mb-8" style={{ animation: "float 3s ease-in-out infinite" }}>
            <Ghost className="w-20 h-20 mx-auto text-phantom-400" />
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            <span className="gradient-text">Ghost</span>
            <span className="text-ghost-100">Verse</span>
          </h1>

          <p className="text-xl md:text-2xl text-ghost-300 mb-4 text-balance font-light">
            The anonymous social universe where you can be{" "}
            <span className="text-phantom-400 font-medium">anyone</span>,{" "}
            <span className="text-neon-cyan font-medium">anywhere</span>.
          </p>

          <p className="text-ghost-500 mb-10 text-lg max-w-xl mx-auto">
            Meet strangers, make real friends, and chat privately — all without
            revealing your identity. Your secrets are safe here.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/register"
              className="btn-primary text-lg px-8 py-4 w-full sm:w-auto"
              style={{ animation: "pulseGlow 2s ease-in-out infinite" }}
            >
              <Rocket className="w-5 h-5 mr-2 inline" />
              Start Chatting — It's Free
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto">
              <UserIcon className="w-5 h-5 mr-2 inline" />
              I have an account
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <FeatureCard
              icon={<Globe className="w-8 h-8 text-phantom-400" />}
              title="World Chat"
              description="Talk with everyone online in a global chat room"
              delay="0s"
            />
            <FeatureCard
              icon={<Dices className="w-8 h-8 text-phantom-400" />}
              title="Random Chat"
              description="Get matched with a stranger instantly"
              delay="0.1s"
            />
            <FeatureCard
              icon={<VenetianMask className="w-8 h-8 text-phantom-400" />}
              title="Confessions"
              description="Share your secrets anonymously"
              delay="0.2s"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-4">
            <FeatureCard
              icon={<Users className="w-8 h-8 text-phantom-400" />}
              title="Communities"
              description="Join topic-based secret rooms"
              delay="0.3s"
            />
            <FeatureCard
              icon={<Search className="w-8 h-8 text-phantom-400" />}
              title="Mystery Chat"
              description="One mystery stranger per day"
              delay="0.4s"
            />
            <FeatureCard
              icon={<Flame className="w-8 h-8 text-phantom-400" />}
              title="Streaks"
              description="Build chat streaks with friends"
              delay="0.5s"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 mb-10 flex items-center gap-8 text-ghost-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>100% Anonymous</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-ghost-700" />
          <div className="hidden sm:flex items-center gap-2">
            <Lock className="w-4 h-4 text-ghost-400" />
            <span>End-to-end private</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-ghost-700" />
          <div className="hidden sm:flex items-center gap-2">
            <Zap className="w-4 h-4 text-ghost-400" />
            <span>Real-time messaging</span>
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className="glass-card p-6 text-left page-enter"
      style={{ animationDelay: delay }}
    >
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold text-ghost-100 mb-1">{title}</h3>
      <p className="text-ghost-400 text-sm">{description}</p>
    </div>
  );
}
