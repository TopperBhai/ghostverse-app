"use client";

import { useState, useEffect, useRef } from "react";
import { useSocket } from "@/custom-hooks/use-socket";
import { useAuth } from "@/custom-hooks/use-auth";
import { useWebRTC } from "@/custom-hooks/use-webrtc";
import { Mic, Radio, User as UserIcon, Ghost, SkipForward } from "lucide-react";

export default function RandomVoiceChatPage() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const {
    remoteStream,
    callAccepted,
    endCall,
    callUser,
    answerCall,
    isReceivingCall
  } = useWebRTC();

  const [isSearching, setIsSearching] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle Matchmaking
  useEffect(() => {
    if (!socket || !user) return;

    const handleMatch = (data: { peerId: string, isCaller: boolean }) => {
      setIsSearching(false);
      setMatchFound(true);

      if (data.isCaller) {
        // We initiate the call automatically
        setTimeout(() => {
          callUser(data.peerId);
        }, 1000); // Wait a sec to ensure both are ready
      }
    };

    socket.on("random-voice:match", handleMatch);

    return () => {
      socket.off("random-voice:match", handleMatch);
    };
  }, [socket, user, callUser]);

  // When receiving the automatic call from the caller
  useEffect(() => {
    if (isReceivingCall && matchFound) {
      answerCall();
    }
  }, [isReceivingCall, matchFound, answerCall]);

  const startSearch = () => {
    if (!socket || !user) return;
    setIsSearching(true);
    socket.emit("random-voice:join", { userId: user.id });
  };

  const stopSearch = () => {
    if (!socket || !user) return;
    setIsSearching(false);
    socket.emit("random-voice:leave", { userId: user.id });
  };

  const handleNext = () => {
    if (callAccepted) {
      endCall();
    }
    setMatchFound(false);
    startSearch(); // immediately search again
  };

  const handleStop = () => {
    if (callAccepted) {
      endCall();
    }
    setMatchFound(false);
    stopSearch();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-screen w-full relative bg-ghost-950 overflow-hidden">
      {/* Remote Audio Player */}
      <audio ref={audioRef} autoPlay />

      {/* Decorative Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-phantom-900/20 via-ghost-950 to-ghost-950 pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-10 glass-nav px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold gradient-text">Random Voice</h1>
          <p className="text-xs text-ghost-400">Connect with strangers anonymously</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${callAccepted ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : isSearching ? 'bg-yellow-500 shadow-[0_0_10px_#eab308] animate-pulse' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
          <span className="text-xs font-medium text-ghost-300">
            {callAccepted ? "Connected" : isSearching ? "Searching..." : "Idle"}
          </span>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center p-6">
        
        {!isSearching && !matchFound && (
          <div className="text-center animate-fade-in max-w-md">
            <div className="w-32 h-32 mx-auto bg-phantom-500/10 rounded-full flex items-center justify-center mb-8 border border-phantom-500/30">
              <Mic className="w-16 h-16 text-phantom-500 animate-pulse" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">Ready to talk?</h2>
            <p className="text-ghost-400 mb-8 leading-relaxed">
              You will be matched with a random stranger for an anonymous voice call. Please be respectful.
            </p>
            <button 
              onClick={startSearch}
              className="w-full py-4 bg-phantom-600 hover:bg-phantom-500 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all active:scale-[0.98]"
            >
              Start Searching
            </button>
          </div>
        )}

        {isSearching && !matchFound && (
          <div className="text-center animate-fade-in">
            <div className="relative w-40 h-40 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-phantom-500/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
              <div className="absolute inset-4 border-4 border-phantom-400/50 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
              <div className="absolute inset-8 bg-phantom-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-phantom-400">
                <Radio className="w-10 h-10 text-phantom-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Looking for a match...</h2>
            <p className="text-ghost-400 mb-8">This usually takes a few seconds.</p>
            <button 
              onClick={stopSearch}
              className="px-8 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold rounded-xl transition-all"
            >
              Cancel Search
            </button>
          </div>
        )}

        {matchFound && (
          <div className="text-center animate-fade-in w-full max-w-md">
            <div className="flex items-center justify-center gap-8 mb-12">
              {/* You */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-ghost-800 border-2 border-phantom-500 flex items-center justify-center mb-3">
                  <UserIcon className="w-8 h-8 text-ghost-400" />
                </div>
                <span className="text-sm font-bold text-ghost-200">You</span>
              </div>

              {/* Connection Line */}
              <div className="flex-1 h-0.5 bg-gradient-to-r from-phantom-500 via-fuchsia-500 to-phantom-500 relative">
                <div className={`absolute inset-0 bg-white shadow-[0_0_10px_#fff] ${callAccepted ? 'animate-[ping_2s_ease-in-out_infinite]' : 'opacity-0'}`} />
              </div>

              {/* Stranger */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-ghost-800 border-2 border-fuchsia-500 flex items-center justify-center mb-3 relative">
                  {callAccepted && (
                    <div className="absolute -inset-2 border-2 border-fuchsia-500/50 rounded-full animate-[ping_1.5s_ease-in-out_infinite]" />
                  )}
                  <Ghost className="w-8 h-8 text-fuchsia-400" />
                </div>
                <span className="text-sm font-bold text-ghost-200">Stranger</span>
              </div>
            </div>

            <div className="bg-ghost-900/50 backdrop-blur-sm border border-ghost-800 rounded-3xl p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-1">
                {callAccepted ? "Call Connected!" : "Connecting..."}
              </h3>
              <p className="text-sm text-ghost-400">
                {callAccepted ? "Say hello!" : "Establishing secure P2P connection..."}
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleStop}
                className="flex-1 py-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(239,68,68,0)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                Stop
              </button>
              <button 
                onClick={handleNext}
                className="flex-[2] py-4 bg-phantom-600 hover:bg-phantom-500 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all flex items-center justify-center gap-2"
              >
                Skip to Next <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
