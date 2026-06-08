"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "./useSocket";
import { useAuth } from "./useAuth";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

export function useWebRTC() {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [callerId, setCallerId] = useState<string | null>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [peerId, setPeerId] = useState<string | null>(null); // the user we are talking to

  const peerRef = useRef<RTCPeerConnection | null>(null);

  // Initialize Media Devices
  const getMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Failed to get local stream", err);
      return null;
    }
  }, []);

  // Cleanup WebRTC connection
  const cleanup = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setIsCalling(false);
    setIsReceivingCall(false);
    setCallAccepted(false);
    setCallerId(null);
    setPeerId(null);
  }, [localStream]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.on("webrtc:call-request", (data: any) => {
      setIsReceivingCall(true);
      setCallerId(data.callerId);
    });

    socket.on("webrtc:call-accept", async (data: any) => {
      setCallAccepted(true);
      setPeerId(data.receiverId);
      
      const stream = await getMedia();
      if (!stream) return;

      peerRef.current = new RTCPeerConnection(ICE_SERVERS);
      
      stream.getTracks().forEach((track) => {
        peerRef.current?.addTrack(track, stream);
      });

      peerRef.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      peerRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc:ice-candidate", {
            receiverId: data.receiverId,
            senderId: user.id,
            candidate: event.candidate,
          });
        }
      };

      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      
      socket.emit("webrtc:offer", {
        receiverId: data.receiverId,
        senderId: user.id,
        offer,
      });
    });

    socket.on("webrtc:call-decline", () => {
      cleanup();
      alert("Call declined");
    });

    socket.on("webrtc:offer", async (data: any) => {
      setCallAccepted(true);
      setPeerId(data.senderId);

      peerRef.current = new RTCPeerConnection(ICE_SERVERS);

      const stream = await getMedia();
      if (stream) {
        stream.getTracks().forEach((track) => {
          peerRef.current?.addTrack(track, stream);
        });
      }

      peerRef.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      peerRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc:ice-candidate", {
            receiverId: data.senderId,
            senderId: user.id,
            candidate: event.candidate,
          });
        }
      };

      await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);

      socket.emit("webrtc:answer", {
        receiverId: data.senderId,
        senderId: user.id,
        answer,
      });
    });

    socket.on("webrtc:answer", async (data: any) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    socket.on("webrtc:ice-candidate", async (data: any) => {
      if (peerRef.current && data.candidate) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      }
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
  }, [socket, user, getMedia, cleanup]);

  const callUser = (receiverId: string) => {
    if (!socket || !user) return;
    setIsCalling(true);
    setPeerId(receiverId);
    socket.emit("webrtc:call-request", { receiverId, callerId: user.id });
  };

  const answerCall = () => {
    if (!socket || !user || !callerId) return;
    setIsReceivingCall(false);
    socket.emit("webrtc:call-accept", { receiverId: user.id, callerId });
  };

  const declineCall = () => {
    if (!socket || !user || !callerId) return;
    socket.emit("webrtc:call-decline", { receiverId: user.id, callerId });
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
