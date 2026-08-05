import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";

let io: SocketServer;

export const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
          return callback(null, true);
        const allowed = process.env.CLIENT_URL;
        if (allowed && origin === allowed) return callback(null, true);
        callback(new Error(`CORS blocked: ${origin}`));
      },
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    // Join a post room to receive live comments/votes for that post
    socket.on("join_post", (postId: number) => {
      socket.join(`post:${postId}`);
    });

    socket.on("leave_post", (postId: number) => {
      socket.leave(`post:${postId}`);
    });

    // Join a community room to receive new posts live
    socket.on("join_community", (communityId: number) => {
      socket.join(`community:${communityId}`);
    });

    socket.on("leave_community", (communityId: number) => {
      socket.leave(`community:${communityId}`);
    });

    // Join global feed room
    socket.on("join_feed", () => {
      socket.join("feed");
    });

    socket.on("leave_feed", () => {
      socket.leave("feed");
    });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

// ── Emit helpers ─────────────────────────────────────────────────────────────

export const emitNewPost = (post: Record<string, unknown>) => {
  getIO().to("feed").emit("new_post", post);
  if (post.community_id) {
    getIO().to(`community:${post.community_id}`).emit("new_post", post);
  }
};

export const emitNewComment = (postId: number, comment: Record<string, unknown>) => {
  getIO().to(`post:${postId}`).emit("new_comment", comment);
};

export const emitVoteUpdate = (postId: number, voteScore: number) => {
  getIO().to(`post:${postId}`).emit("vote_update", { postId, voteScore });
  getIO().to("feed").emit("vote_update", { postId, voteScore });
};
