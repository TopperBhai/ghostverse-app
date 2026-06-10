"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../custom-hooks/use-auth";
import { Ghost, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(username, password);

    if (result.success) {
      router.push("/world-chat");
    } else {
      setError(result.error || "Login failed");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden text-zinc-100 font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-phantom-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-phantom-600/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-[slideUp_0.5s_ease-out]">
        
        {/* Header Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex flex-col items-center justify-center gap-3 group mx-auto hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 rounded-full bg-phantom-500/10 flex items-center justify-center border border-phantom-500/20 mb-2">
              <Ghost className="w-10 h-10 text-phantom-400 animate-[float_3s_ease-in-out_infinite]" />
            </div>
            <span className="text-3xl font-black bg-gradient-to-r from-phantom-400 to-neon-red bg-clip-text text-transparent">
              GhostVerse
            </span>
          </Link>
          <p className="text-zinc-400 mt-3 text-sm tracking-wide">Welcome back, phantom.</p>
        </div>

        {/* Form Container */}
        <div className="bg-zinc-950/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          
          {/* Subtle top border gradient highlight */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-phantom-500/50 to-transparent" />

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-[fadeIn_0.3s_ease-out] flex items-start gap-2">
              <span className="text-lg">⚠</span>
              <p className="mt-0.5">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium text-zinc-300 block">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-100 rounded-xl px-4 py-3.5 outline-none focus:border-phantom-500 focus:ring-1 focus:ring-phantom-500 transition-all placeholder:text-zinc-600"
                placeholder="phantom_ghost"
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-zinc-300 block">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-100 rounded-xl px-4 py-3.5 pr-12 outline-none focus:border-phantom-500 focus:ring-1 focus:ring-phantom-500 transition-all placeholder:text-zinc-600"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-phantom-600 hover:bg-phantom-500 text-white font-semibold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:active:scale-100 shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_25px_rgba(225,29,72,0.5)]"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center border-t border-zinc-800/50 pt-6">
            <p className="text-zinc-500 text-sm">
              New to GhostVerse?{" "}
              <Link href="/register" className="text-phantom-400 hover:text-phantom-400 font-semibold transition-colors">
                Create an identity
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
