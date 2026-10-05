import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { SERVER_BASE_URL } from "../utils/apiUrl";

interface SocketContextType {
  socket: Socket;
  joinPost: (postId: number) => void;
  leavePost: (postId: number) => void;
  joinFeed: () => void;
  leaveFeed: () => void;
  joinCommunity: (communityId: number) => void;
  leaveCommunity: (communityId: number) => void;
  joinUser: (userId: number) => void;
  leaveUser: (userId: number) => void;
  joinInbox: (userId: number) => void;
  leaveInbox: (userId: number) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  if (!socketRef.current) {
    socketRef.current = io(SERVER_BASE_URL, { autoConnect: true, transports: ["websocket", "polling"] });
  }
  const socket = socketRef.current;
  const activeRooms = useRef(new Map<string, { joinEvent: string; leaveEvent: string; id?: number }>());

  const joinRoom = useCallback((joinEvent: string, leaveEvent: string, id?: number) => {
    const key = id === undefined ? joinEvent : `${joinEvent}:${id}`;
    activeRooms.current.set(key, { joinEvent, leaveEvent, id });
    if (id === undefined) socket.emit(joinEvent);
    else socket.emit(joinEvent, id);
  }, [socket]);

  const leaveRoom = useCallback((joinEvent: string, id?: number) => {
    const key = id === undefined ? joinEvent : `${joinEvent}:${id}`;
    const room = activeRooms.current.get(key);
    if (!room) return;
    activeRooms.current.delete(key);
    if (room.id === undefined) socket.emit(room.leaveEvent);
    else socket.emit(room.leaveEvent, room.id);
  }, [socket]);

  useEffect(() => {
    const rejoinRooms = () => {
      activeRooms.current.forEach(room => {
        if (room.id === undefined) socket.emit(room.joinEvent);
        else socket.emit(room.joinEvent, room.id);
      });
    };
    socket.on("connect", rejoinRooms);
    // React Strict Mode runs effect cleanup/setup again in development. Since
    // disconnect() disables Socket.IO's automatic reconnect, reconnect here.
    if (!socket.connected) socket.connect();
    return () => {
      socket.off("connect", rejoinRooms);
      socket.disconnect();
    };
  }, [socket]);

  const joinPost = useCallback((id: number) => joinRoom("join_post", "leave_post", id), [joinRoom]);
  const leavePost = useCallback((id: number) => leaveRoom("join_post", id), [leaveRoom]);
  const joinFeed = useCallback(() => joinRoom("join_feed", "leave_feed"), [joinRoom]);
  const leaveFeed = useCallback(() => leaveRoom("join_feed"), [leaveRoom]);
  const joinCommunity = useCallback((id: number) => joinRoom("join_community", "leave_community", id), [joinRoom]);
  const leaveCommunity = useCallback((id: number) => leaveRoom("join_community", id), [leaveRoom]);
  const joinUser = useCallback((id: number) => joinRoom("join_user", "leave_user", id), [joinRoom]);
  const leaveUser = useCallback((id: number) => leaveRoom("join_user", id), [leaveRoom]);
  const joinInbox = useCallback((id: number) => joinRoom("join_inbox", "leave_inbox", id), [joinRoom]);
  const leaveInbox = useCallback((id: number) => leaveRoom("join_inbox", id), [leaveRoom]);
  const contextValue = useMemo(() => ({
    socket, joinPost, leavePost, joinFeed, leaveFeed, joinCommunity, leaveCommunity, joinUser, leaveUser, joinInbox, leaveInbox,
  }), [socket, joinPost, leavePost, joinFeed, leaveFeed, joinCommunity, leaveCommunity, joinUser, leaveUser, joinInbox, leaveInbox]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside SocketProvider");
  return ctx;
};
