"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./use-auth";
import type { ServerToClientEvents, ClientToServerEvents } from "../types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket() {
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Initialize socket connection
    const newSocket: TypedSocket = io({
      path: "/api/socketio",
      addTrailingSlash: false,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isConnected && socket && user) {
      socket.emit("user:online", { userId: user.id });
    }
  }, [isConnected, socket, user]);

  return {
    socket,
    isConnected,
  };
}
