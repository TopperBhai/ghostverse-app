"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../custom-hooks/use-auth";
import { Ghost, Eye, EyeOff, AlertCircle, Camera, X } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    displayName: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { register } = useAuth();
  const router = useRouter();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64Str = canvas.toDataURL('image/jpeg', 0.8);
          setAvatarPreview(base64Str);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.username || formData.username.length < 3) {
      setError("Username must be at least 3 characters");
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return false;
    }
    if (!formData.displayName || formData.displayName.length < 1) {
      setError("Display name is required");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setError("");
    setIsLoading(true);

    const result = await register({
      password: formData.password,
      username: formData.username,
      displayName: formData.displayName,
      avatar: avatarPreview || undefined,
    });

    if (result.success) {
      window.location.href = "/world-chat";
    } else {
      setError(result.error || "Registration failed");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden text-zinc-100 font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-phantom-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-phantom-600/10 blur-[100px] pointer-events-none" />

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
          <p className="text-zinc-400 mt-3 text-sm tracking-wide">Enter the anonymous realm.</p>
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center mb-6 relative">
              <div 
                className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-phantom-500 hover:bg-zinc-800 transition-all relative overflow-hidden group"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <>
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-zinc-500 group-hover:text-phantom-400 mb-1 transition-colors" />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider group-hover:text-phantom-400 transition-colors">Optional</span>
                  </>
                )}
              </div>
              {avatarPreview && (
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); setAvatarPreview(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="absolute top-0 right-1/2 translate-x-10 translate-y-1 bg-zinc-800 border border-zinc-700 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all shadow-xl z-20"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg, image/png, image/webp" 
                onChange={handleImageSelect}
              />
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium text-zinc-300 block">
                Username
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium group-focus-within:text-phantom-400 transition-colors">@</span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => updateField("username", e.target.value.toLowerCase())}
                  className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-100 rounded-xl px-4 py-3.5 pl-9 outline-none focus:border-phantom-500 focus:ring-1 focus:ring-phantom-500 transition-all placeholder:text-zinc-600"
                  placeholder="phantom_ghost"
                  maxLength={20}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="displayName" className="text-sm font-medium text-zinc-300 block">
                Display Name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => updateField("displayName", e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-100 rounded-xl px-4 py-3.5 outline-none focus:border-phantom-500 focus:ring-1 focus:ring-phantom-500 transition-all placeholder:text-zinc-600"
                placeholder="The Anonymous One"
                maxLength={50}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="text-sm font-medium text-zinc-300 block">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-100 rounded-xl px-4 py-3.5 pr-12 outline-none focus:border-phantom-500 focus:ring-1 focus:ring-phantom-500 transition-all placeholder:text-zinc-600"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
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

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-300 block">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-100 rounded-xl px-4 py-3.5 outline-none focus:border-phantom-500 focus:ring-1 focus:ring-phantom-500 transition-all placeholder:text-zinc-600"
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-phantom-600 hover:bg-phantom-500 text-white font-semibold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center mt-6 disabled:opacity-70 disabled:active:scale-100 shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_25px_rgba(225,29,72,0.5)]"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-zinc-800/50 pt-6">
            <p className="text-zinc-500 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-phantom-400 hover:text-phantom-400 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-600 text-xs mt-8">
          No real names. No phone numbers. Just vibes.
        </p>
      </div>
    </div>
  );
}
