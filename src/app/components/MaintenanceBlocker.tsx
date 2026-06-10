"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../custom-hooks/use-auth";
import { Ghost } from "lucide-react";

export function MaintenanceBlocker() {
  const { user, loading } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success) {
          setMaintenanceMode(data.data.maintenanceMode);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsChecking(false);
      }
    };
    checkSettings();
    // Poll every 30 seconds
    const interval = setInterval(checkSettings, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || isChecking) return null;

  // Block access if maintenance mode is ON and user is not an ADMIN
  if (maintenanceMode && user?.role !== "ADMIN") {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 text-center animate-[fadeIn_0.5s_ease-out]">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 animate-[slideUp_0.5s_ease-out]">
          <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 mx-auto mb-8 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
            <Ghost className="w-12 h-12 text-red-500 animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">GhostVerse is Offline</h1>
          <p className="text-xl text-gray-400 mb-8 max-w-lg mx-auto font-medium">
            We are currently upgrading the realm with "God Mode" features. The servers will be back online shortly.
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-zinc-900 border border-zinc-800 shadow-xl">
            <span className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-sm font-bold text-gray-300 uppercase tracking-widest">Maintenance Mode Active</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
