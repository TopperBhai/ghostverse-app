"use client";

import { useWebRTC } from "../../custom-hooks/WebRTCContext";
import { usePathname, useRouter } from "next/navigation";
import { Mic, PhoneOff, Maximize2 } from "lucide-react";
import Link from "next/link";

export function FloatingCallWidget() {
  const { callAccepted, isSearching, endCall, strangerProfile } = useWebRTC();
  const pathname = usePathname();
  const router = useRouter();

  // Only show the widget if there is an active call or search AND we are not on the random-chat page
  if ((!callAccepted && !isSearching) || pathname === "/random-chat") {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-[100] animate-[slideUp_0.3s_ease-out]">
      <div className="bg-ghost-900 border border-white/10 rounded-full shadow-2xl p-2 flex items-center gap-3 backdrop-blur-md">
        
        {/* Status Indicator & Profile */}
        <button 
          onClick={() => router.push("/random-chat")}
          className="flex items-center gap-3 pl-2 hover:bg-white/5 rounded-full p-1 transition-colors group"
        >
          <div className="relative">
            {strangerProfile?.avatar ? (
              <img src={strangerProfile.avatar} alt="Stranger" className="w-10 h-10 rounded-full object-cover border border-white/10" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-ghost-800 flex items-center justify-center border border-white/10">
                <span className="font-bold text-ghost-300 text-sm">
                  {strangerProfile ? strangerProfile.displayName.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
            )}
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-ghost-900 ${callAccepted ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
          </div>
          
          <div className="flex flex-col text-left pr-2 hidden sm:flex">
            <span className="text-sm font-bold text-white leading-tight">
              {callAccepted ? (strangerProfile?.displayName || "Stranger") : "Searching..."}
            </span>
            <span className="text-[10px] text-green-400 font-semibold uppercase tracking-wider">
              {callAccepted ? "In Call" : "Matchmaking"}
            </span>
          </div>
          <Maximize2 className="w-4 h-4 text-ghost-500 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 hidden sm:block" />
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2 pr-1 border-l border-white/10 pl-2">
          {callAccepted && (
            <button 
              onClick={() => {}} // Future: toggle mute
              className="w-10 h-10 rounded-full bg-ghost-800 flex items-center justify-center text-ghost-300 hover:text-white hover:bg-ghost-700 transition-colors"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={endCall}
            className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
