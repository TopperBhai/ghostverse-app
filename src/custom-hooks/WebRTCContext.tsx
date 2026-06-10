"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { useSocket } from "./use-socket";
import { useAuth } from "./use-auth";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

interface WebRTCContextType {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCalling: boolean;
  isReceivingCall: boolean;
  callAccepted: boolean;
  callerId: string | null;
  peerId: string | null;
  callUser: (receiverId: string) => void;
  answerCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  strangerProfile: { displayName: string; username: string; avatar: string | null; userId: string } | null;
  isSearching: boolean;
  startSearch: () => void;
  stopSearch: () => void;
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

export function WebRTCProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [callerId, setCallerId] = useState<string | null>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [peerId, setPeerId] = useState<string | null>(null);
  
  // Random Voice Matchmaking specific state
  const [isSearching, setIsSearching] = useState(false);
  const [strangerProfile, setStrangerProfile] = useState<{ displayName: string; username: string; avatar: string | null; userId: string } | null>(null);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Setup global audio element for remote stream
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      document.body.appendChild(audioEl);
      audioRef.current = audioEl;
      
      return () => {
        audioEl.pause();
        audioEl.srcObject = null;
        document.body.removeChild(audioEl);
      };
    }
  }, []);

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
    } else if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
  }, [remoteStream]);

  const getMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Failed to get microphone access", err);
      alert("Microphone access denied. Please allow microphone to use voice call.");
      return null;
    }
  }, []);

  const createPeerConnection = useCallback((targetId: string) => {
    if (!socket || !user) return null;
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc:ice-candidate", {
          receiverId: targetId,
          senderId: user.id,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("RTC connection state:", pc.connectionState);
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        cleanup();
      }
    };

    return pc;
  }, [socket, user]);

  const cleanup = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    iceCandidateQueue.current = [];
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setIsCalling(false);
    setIsReceivingCall(false);
    setCallAccepted(false);
    setCallerId(null);
    setPeerId(null);
    setIsSearching(false);
    setStrangerProfile(null);
  }, [localStream]);

  // Fetch stranger's profile when matched/connected
  useEffect(() => {
    if (!peerId) return;
    const fetchStranger = async () => {
      try {
        const res = await fetch(`/api/users/by-id/${peerId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStrangerProfile({ ...data.data, userId: peerId });
          }
        }
      } catch (err) {
        console.error("Failed to fetch stranger:", err);
      }
    };
    fetchStranger();
  }, [peerId]);

  // Handle Matchmaking
  useEffect(() => {
    if (!socket || !user) return;

    const handleMatch = (data: { peerId: string, isCaller: boolean }) => {
      setIsSearching(false);
      setPeerId(data.peerId);

      if (data.isCaller) {
        // Initiate the call automatically
        setTimeout(() => {
          if (!socket || !user) return;
          setIsCalling(true);
          socket.emit("webrtc:call-request", { receiverId: data.peerId, callerId: user.id });
        }, 1000);
      }
    };

    socket.on("random-voice:match", handleMatch);

    return () => {
      socket.off("random-voice:match", handleMatch);
    };
  }, [socket, user]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.on("webrtc:call-accept", async (data: any) => {
      const calleeId = data.callerId;
      setPeerId(calleeId);
      setCallAccepted(true);
      setIsCalling(false);

      const stream = await getMedia();
      if (!stream || !user) return;

      const pc = createPeerConnection(calleeId);
      if (!pc) return;
      peerRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("webrtc:offer", {
        receiverId: calleeId,
        senderId: user.id,
        offer,
      });
    });

    socket.on("webrtc:offer", async (data: any) => {
      const callerId = data.senderId;
      setPeerId(callerId);
      setCallAccepted(true);

      const stream = await getMedia();
      if (!user) return;

      const pc = createPeerConnection(callerId);
      if (!pc) return;
      peerRef.current = pc;

      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

      for (const c of iceCandidateQueue.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      iceCandidateQueue.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("webrtc:answer", {
        receiverId: callerId,
        senderId: user.id,
        answer,
      });
    });

    socket.on("webrtc:answer", async (data: any) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));

        for (const c of iceCandidateQueue.current) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(c));
        }
        iceCandidateQueue.current = [];
      }
    });

    socket.on("webrtc:ice-candidate", async (data: any) => {
      if (!data.candidate) return;
      if (peerRef.current && peerRef.current.remoteDescription) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } else {
        iceCandidateQueue.current.push(data.candidate);
      }
    });

    socket.on("webrtc:call-request", (data: any) => {
      // Auto-answer for random voice
      if (!socket || !user) return;
      setIsReceivingCall(false);
      setCallAccepted(true);
      setPeerId(data.callerId);
      socket.emit("webrtc:call-accept", { callerId: user.id, receiverId: data.callerId });
    });

    socket.on("webrtc:call-decline", () => {
      cleanup();
    });

    socket.on("webrtc:end-call", () => {
      cleanup();
    });

    return () => {
      socket.off("webrtc:call-request");
      socket.off("webrtc:call-accept");
      socket.off("webrtc:call-decline");
      socket.off("webrtc:offer");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice-candidate");
      socket.off("webrtc:end-call");
    };
  }, [socket, user, getMedia, createPeerConnection, cleanup]);

  const callUser = (receiverId: string) => {
    if (!socket || !user) return;
    setIsCalling(true);
    setPeerId(receiverId);
    socket.emit("webrtc:call-request", { receiverId, callerId: user.id });
  };

  const answerCall = () => {
    if (!socket || !user || !callerId) return;
    setIsReceivingCall(false);
    setCallAccepted(true);
    socket.emit("webrtc:call-accept", { callerId: user.id, receiverId: callerId });
    setPeerId(callerId);
  };

  const declineCall = () => {
    if (!socket || !callerId) return;
    socket.emit("webrtc:call-decline", { receiverId: callerId, callerId: user?.id ?? "" });
    setIsReceivingCall(false);
    setCallerId(null);
  };

  const endCall = () => {
    if (socket && peerId) {
      socket.emit("webrtc:end-call", { peerId });
    }
    cleanup();
  };

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

  return (
    <WebRTCContext.Provider
      value={{
        localStream,
        remoteStream,
        isCalling,
        isReceivingCall,
        callAccepted,
        callerId,
        peerId,
        callUser,
        answerCall,
        declineCall,
        endCall,
        strangerProfile,
        isSearching,
        startSearch,
        stopSearch
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
}

export function useWebRTC() {
  const context = useContext(WebRTCContext);
  if (context === undefined) {
    throw new Error("useWebRTC must be used within a WebRTCProvider");
  }
  return context;
}
