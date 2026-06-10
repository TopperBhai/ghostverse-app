"use client";

import { useWebRTC } from "../../../custom-hooks/use-webrtc";
import { useAuth } from "../../../custom-hooks/use-auth";
import { Mic, Radio, Ghost, SkipForward, PhoneOff, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { UserProfileCard } from "../../components/UserProfileCard";

export default function RandomVoiceChatPage() {
  const { user } = useAuth();
  const {
    callAccepted,
    isSearching,
    startSearch,
    stopSearch,
    endCall,
    strangerProfile
  } = useWebRTC();

  const [inspectUser, setInspectUser] = useState<any | null>(null);

  const handleNext = () => {
    if (callAccepted) {
      endCall();
    }
    startSearch(); // immediately search again
  };

  const handleStop = () => {
    if (callAccepted) {
      endCall();
    }
    stopSearch();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-[calc(100vh-80px)] w-full relative bg-ghost-950 overflow-hidden">
      
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-phantom-900/20 via-ghost-950 to-ghost-950 pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-10 glass-nav px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold gradient-text">Random Voice</h1>
          <p className="text-xs text-ghost-400">Connect with strangers anonymously</p>
        </div>
        <div className="flex items-center gap-2 bg-ghost-900/50 px-3 py-1.5 rounded-full border border-white/5">
          <div className={`w-2.5 h-2.5 rounded-full ${callAccepted ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : isSearching ? 'bg-yellow-500 shadow-[0_0_10px_#eab308] animate-pulse' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
          <span className="text-xs font-bold tracking-wide text-ghost-200 uppercase">
            {callAccepted ? "Connected" : isSearching ? "Searching..." : "Idle"}
          </span>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto">
        
        {!isSearching && !callAccepted && (
          <div className="text-center animate-fade-in w-full">
            <div className="w-32 h-32 mx-auto bg-phantom-500/10 rounded-full flex items-center justify-center mb-8 border border-phantom-500/30 relative">
              <div className="absolute inset-0 rounded-full border border-phantom-400/20 animate-[ping_3s_ease-out_infinite]" />
              <Mic className="w-16 h-16 text-phantom-500" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Ready to talk?</h2>
            <p className="text-ghost-400 mb-10 leading-relaxed font-medium">
              You will be matched with a random stranger for an anonymous voice call.
            </p>
            <button 
              onClick={startSearch}
              className="w-full py-4 bg-gradient-to-r from-phantom-600 to-purple-600 hover:from-phantom-500 hover:to-purple-500 text-white font-black text-lg rounded-3xl shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all active:scale-95"
            >
              Start Searching
            </button>
          </div>
        )}

        {isSearching && !callAccepted && (
          <div className="text-center animate-fade-in w-full">
            <div className="relative w-48 h-48 mx-auto mb-10 flex items-center justify-center">
              <div className="absolute inset-0 border-2 border-phantom-500/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
              <div className="absolute inset-4 border-2 border-phantom-400/50 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
              <div className="absolute inset-8 border-2 border-purple-400/40 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_1s]" />
              <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-phantom-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                <Radio className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Looking for match...</h2>
            <p className="text-ghost-400 mb-12 font-medium">Please wait while we connect you.</p>
            <button 
              onClick={handleStop}
              className="px-10 py-3.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded-2xl transition-all active:scale-95 border border-red-500/20"
            >
              Cancel Search
            </button>
          </div>
        )}

        {callAccepted && (
          <div className="text-center animate-fade-in w-full flex flex-col h-full justify-between pb-8 pt-4">
            
            {/* Avatars Stack (Phone Style) */}
            <div className="relative w-full flex flex-col items-center justify-center flex-1">
              {/* Stranger Avatar (Top, Larger) */}
              <div className="relative z-20 group">
                <div className="w-40 h-40 rounded-full bg-ghost-900 border-4 border-phantom-500 flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.3)] relative overflow-hidden">
                   {strangerProfile?.avatar ? (
                    <img src={strangerProfile.avatar} alt={strangerProfile.displayName} className="w-full h-full object-cover" />
                  ) : strangerProfile?.displayName ? (
                    <span className="text-5xl font-black text-ghost-300">{strangerProfile.displayName.charAt(0).toUpperCase()}</span>
                  ) : (
                    <Ghost className="w-16 h-16 text-phantom-400" />
                  )}
                  {/* Inspect Overlay */}
                  {strangerProfile && (
                    <button 
                      onClick={() => setInspectUser(strangerProfile)}
                      className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <UserIcon className="w-8 h-8 text-white mb-2" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Inspect</span>
                    </button>
                  )}
                </div>
                <div className="absolute -inset-4 border-2 border-phantom-500/20 rounded-full animate-[ping_2s_ease-out_infinite]" />
                <h2 className="text-2xl font-black text-white mt-6 drop-shadow-md">
                  {strangerProfile?.displayName ?? "Stranger"}
                </h2>
                <p className="text-sm text-green-400 font-bold uppercase tracking-wider mt-1">In Call</p>
              </div>

              {/* Your Avatar (Bottom Right, Smaller, Overlapping) */}
              <div className="absolute bottom-10 right-4 md:right-8 z-30">
                <div className="w-20 h-20 rounded-full bg-ghost-950 border-4 border-ghost-900 flex items-center justify-center shadow-xl overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="You" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-ghost-400">{user?.displayName?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-ghost-800 px-2 py-0.5 rounded-md border border-white/10 text-[10px] font-bold text-ghost-400">You</div>
              </div>
            </div>

            {/* Controls (Phone Style) */}
            <div className="w-full mt-auto">
              <div className="flex items-center justify-center gap-6">
                <button 
                  onClick={handleStop}
                  className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all active:scale-90 group"
                  title="End Call"
                >
                  <PhoneOff className="w-7 h-7 group-hover:scale-110 transition-transform" />
                </button>
                <button 
                  onClick={handleNext}
                  className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-phantom-600 hover:bg-gray-100 shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all active:scale-90 group"
                  title="Skip to Next"
                >
                  <div className="flex flex-col items-center">
                    <SkipForward className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase mt-1">Skip</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Profile Inspector Modal */}
      {inspectUser && (
        <UserProfileCard
          {...inspectUser}
          onClose={() => setInspectUser(null)}
        />
      )}
    </div>
  );
}
