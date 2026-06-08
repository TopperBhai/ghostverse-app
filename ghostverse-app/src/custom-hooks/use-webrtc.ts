"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

export function useWebRTC() {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [callerId, setCallerId] = useState<string | null>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [peerId, setPeerId] = useState<string | null>(null);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  // Buffer ICE candidates that arrive before remoteDescription is set
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);

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
  }, [localStream]);

  useEffect(() => {
    if (!socket || !user) return;

    // ── CALLER receives: callee accepted ──
    socket.on("webrtc:call-accept", async (data: any) => {
      // data.callerId = the person who answered (callee)
      const calleeId = data.callerId; // confusingly named in server — it's the callee's userId
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

    // ── CALLEE receives: an offer ──
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

      // Flush queued ICE candidates
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

    // ── CALLER receives: answer from callee ──
    socket.on("webrtc:answer", async (data: any) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));

        // Flush queued ICE candidates
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
        // Buffer until remote description is set
        iceCandidateQueue.current.push(data.candidate);
      }
    });

    socket.on("webrtc:call-request", (data: any) => {
      setIsReceivingCall(true);
      setCallerId(data.callerId);
    });

    socket.on("webrtc:call-decline", () => {
      cleanup();
      alert("Call was declined.");
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

  // Caller initiates
  const callUser = (receiverId: string) => {
    if (!socket || !user) return;
    setIsCalling(true);
    setPeerId(receiverId);
    socket.emit("webrtc:call-request", { receiverId, callerId: user.id });
  };

  // Callee answers
  const answerCall = () => {
    if (!socket || !user || !callerId) return;
    setIsReceivingCall(false);
    setCallAccepted(true);
    // Tell the caller we accepted; use our own id as "callerId" so caller knows who answered
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

  return {
    localStream,
    remoteStream,
    isCalling,
    isReceivingCall,
    callAccepted,
    callerId,
    callUser,
    answerCall,
    declineCall,
    endCall,
  };
}
