import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = (import.meta.env.VITE_API_URL as string)
  .replace(/\/api\/?$/, "");

interface SocketContextType {
  socket: Socket;
  joinPost: (postId: number) => void;
  leavePost: (postId: number) => void;
  joinFeed: () => void;
  leaveFeed: () => void;
  joinCommunity: (communityId: number) => void;
  leaveCommunity: (communityId: number) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const socketRef = useRef<Socket>(
    io(SOCKET_URL, { autoConnect: true, transports: ["websocket", "polling"] })
  );

  useEffect(() => {
    const s = socketRef.current;
    return () => { s.disconnect(); };
  }, []);

  const socket = socketRef.current;

  return (
    <SocketContext.Provider value={{
      socket,
      joinPost:        (id) => socket.emit("join_post", id),
      leavePost:       (id) => socket.emit("leave_post", id),
      joinFeed:        ()   => socket.emit("join_feed"),
      leaveFeed:       ()   => socket.emit("leave_feed"),
      joinCommunity:   (id) => socket.emit("join_community", id),
      leaveCommunity:  (id) => socket.emit("leave_community", id),
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside SocketProvider");
  return ctx;
};
