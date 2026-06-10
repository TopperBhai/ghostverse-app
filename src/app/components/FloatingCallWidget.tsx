"use client";

import { useWebRTC } from "../../custom-hooks/WebRTCContext";
import { usePathname, useRouter } from "next/navigation";
import { Mic, MicOff, Headphones, HeadphonesIcon, PhoneOff, PhoneCall, Maximize2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function FloatingCallWidget() {
  const { 
    callAccepted, 
    isSearching, 
    isReceivingCall, 
    answerCall,
    declineCall,
    endCall, 
    strangerProfile,
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeafen,
    callerId,
    peerId
  } = useWebRTC();
  const pathname = usePathname();
  const router = useRouter();
  
  // Only show widget if there is an active call, ringing, or searching AND we aren't explicitly inside the random-chat fullscreen page
  if ((!callAccepted && !isSearching && !isReceivingCall) || pathname === "/random-chat") {
    return null;
  }

  return (
    <>
      {/* Ringing Modal / Overlay (Only shows when someone is calling you directly) */}
      {isReceivingCall && !callAccepted && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-ghost-900 border border-white/10 rounded-3xl p-8 flex flex-col items-center shadow-[0_0_100px_rgba(139,92,246,0.3)] animate-[slideUp_0.3s_ease-out] w-[90%] max-w-sm text-center">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-phantom-500/50 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
              <div className="relative w-full h-full rounded-full bg-ghost-800 border-4 border-phantom-500 flex items-center justify-center shadow-xl overflow-hidden">
                <PhoneCall className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
            
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Incoming Call</h2>
            <p className="text-ghost-400 font-medium mb-8">Someone is trying to connect with you.</p>
            
            <div className="flex items-center gap-6 w-full justify-center">
              <button 
                onClick={declineCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-90"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <button 
                onClick={answerCall}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] active:scale-90"
              >
                <PhoneCall className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Active Call Widget (Discord Style) */}
      {(callAccepted || isSearching) && (
        <div className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-[100] animate-[slideUp_0.4s_ease-out]">
          <div className="bg-[#111214] border border-[#1e1f22] rounded-2xl shadow-2xl overflow-hidden flex flex-col w-[300px]">
            
            {/* Header / Info Section */}
            <div className="p-4 flex items-center gap-3 bg-[#2b2d31] hover:bg-[#313338] transition-colors cursor-pointer" onClick={() => {
               if (pathname !== "/random-chat") {
                 // Open some fullscreen view or just random-chat for now
                 router.push("/random-chat");
               }
            }}>
              <div className="relative">
                {strangerProfile?.avatar ? (
                  <img src={strangerProfile.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-[#1e1f22]" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1e1f22] flex items-center justify-center border border-[#111214]">
                    <span className="font-bold text-gray-300 text-sm">
                      {strangerProfile ? strangerProfile.displayName.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
                {/* Status indicator pulse */}
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-[#2b2d31] ${callAccepted ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
              </div>
              
              <div className="flex flex-col text-left flex-1 min-w-0">
                <span className="text-[15px] font-bold text-gray-100 truncate">
                  {callAccepted ? (strangerProfile?.displayName || "Stranger") : "Matchmaking"}
                </span>
                <span className="text-[12px] text-gray-400 font-medium truncate">
                  {callAccepted ? "Voice Connected" : "Looking for someone..."}
                </span>
              </div>
              <Maximize2 className="w-4 h-4 text-gray-400 opacity-50 hover:opacity-100 transition-opacity shrink-0" />
            </div>

            {/* Controls Section (Discord Style) */}
            <div className="p-3 bg-[#111214] flex items-center justify-between border-t border-[#1e1f22]">
              <div className="flex items-center gap-2">
                {callAccepted && (
                  <>
                    <button 
                      onClick={toggleMute}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-[#313338] text-red-400' : 'bg-[#313338] text-gray-300 hover:bg-[#3f4147] hover:text-white'}`}
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={toggleDeafen}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDeafened ? 'bg-[#313338] text-red-400' : 'bg-[#313338] text-gray-300 hover:bg-[#3f4147] hover:text-white'}`}
                      title={isDeafened ? "Undeafen" : "Deafen"}
                    >
                      {isDeafened ? <HeadphonesIcon className="w-5 h-5 opacity-50" /> : <Headphones className="w-5 h-5" />}
                    </button>
                  </>
                )}
              </div>
              
              <button 
                onClick={endCall}
                className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
                title="Disconnect"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
