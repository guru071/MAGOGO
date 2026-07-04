import { Server } from "socket.io";
import { createServer } from "http";
import { createClient } from "@supabase/supabase-js";

// ─── In-memory stores ────────────────────────────────────────────────
const promptViewers: Map<string, Set<string>> = new Map(); // promptId -> Set<socketId>
const onlineUsers: Map<
  string,
  { socketId: string; name: string; isSeller: boolean }
> = new Map(); // userId -> info
const MAX_MESSAGES = 500;
const chatHistory: Array<{
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  promptId?: string;
  createdAt: string;
}> = [];

// ─── Helpers ─────────────────────────────────────────────────────────
function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36)
  );
}

function getViewerCount(promptId: string): number {
  return promptViewers.get(promptId)?.size ?? 0;
}

function broadcastViewerCount(io: Server, promptId: string) {
  const count = getViewerCount(promptId);
  io.emit("viewer_count", { promptId, count });
}

const supabaseUrl = process.env.SUPABASE_URL || "http://localhost:54321";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "service_role_key";

let supabaseAdmin: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabaseAdmin;
}

async function verifyToken(
  token: string
): Promise<{ userId: string; name: string; isSeller: boolean } | null> {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data.user) return null;
    return {
      userId: data.user.id,
      name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Anonymous",
      isSeller: false,
    };
  } catch {
    return null;
  }
}

async function persistChatMessage(msg: {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  promptId?: string;
  createdAt: string;
}) {
  try {
    await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    });
  } catch {
    // Best-effort persistence – the in-memory store keeps it available
  }
}

function getSocketUserId(socket: any): string | undefined {
  return socket.data?.userId;
}

function getUserSocketId(
  io: Server,
  userId: string
): string | undefined {
  const user = onlineUsers.get(userId);
  return user?.socketId;
}

// ─── Flash deal ticker ───────────────────────────────────────────────
function startFlashDealTicker(io: Server) {
  const interval = setInterval(async () => {
    try {
      const res = await fetch("http://localhost:3000/api/flash-deals/active");
      if (!res.ok) return;
      const deals = await res.json();
      if (Array.isArray(deals) && deals.length > 0) {
        io.emit("flash_deal_update", { deals });
      }
    } catch {
      // silently ignore
    }
  }, 15_000); // every 15 seconds

  return () => clearInterval(interval);
}

// ─── HTTP + Socket.io server ─────────────────────────────────────────
const httpServer = createServer((_req, res) => {
  // Simple health endpoint at GET /
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", service: "realtime-service" }));
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  path: "/socket.io",
});

// ─── Middleware: authentication required after `auth` event ──────────
io.use(async (socket, next) => {
  // Allow connection without auth – auth is handled via the `auth` event
  next();
});

// ─── Connection handler ──────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // ── auth ──────────────────────────────────────────────────────────
  socket.on("auth", async (payload: { token: string }) => {
    const { token } = payload;
    if (!token) {
      socket.emit("auth_error", { message: "Token is required" });
      return;
    }

    const user = await verifyToken(token);
    if (!user) {
      socket.emit("auth_error", { message: "Invalid or expired token" });
      return;
    }

    // Store user info on socket
    socket.data.userId = user.userId;
    socket.data.name = user.name;
    socket.data.isSeller = user.isSeller;

    // Track online status
    onlineUsers.set(user.userId, {
      socketId: socket.id,
      name: user.name,
      isSeller: user.isSeller,
    });

    // Join a personal room for DMs
    socket.join(`user:${user.userId}`);

    socket.emit("auth_success", {
      userId: user.userId,
      name: user.name,
    });

    // Broadcast online status to all
    io.emit("user_online", { userId: user.userId, name: user.name });
    console.log(`[auth] user ${user.name} (${user.userId}) authenticated`);
  });

  // ── join_prompt ───────────────────────────────────────────────────
  socket.on(
    "join_prompt",
    (payload: { promptId: string }) => {
      const userId = getSocketUserId(socket);
      if (!userId) return;

      const { promptId } = payload;
      if (!promptId) return;

      if (!promptViewers.has(promptId)) {
        promptViewers.set(promptId, new Set());
      }
      promptViewers.get(promptId)!.add(socket.id);
      socket.join(`prompt:${promptId}`);

      broadcastViewerCount(io, promptId);
      console.log(
        `[viewer] ${userId} joined prompt ${promptId} (viewers: ${getViewerCount(promptId)})`
      );
    }
  );

  // ── leave_prompt ──────────────────────────────────────────────────
  socket.on(
    "leave_prompt",
    (payload: { promptId: string }) => {
      const { promptId } = payload;
      if (!promptId) return;

      const viewers = promptViewers.get(promptId);
      if (viewers) {
        viewers.delete(socket.id);
        if (viewers.size === 0) {
          promptViewers.delete(promptId);
        }
      }
      socket.leave(`prompt:${promptId}`);

      broadcastViewerCount(io, promptId);
      console.log(
        `[viewer] ${socket.id} left prompt ${promptId} (viewers: ${getViewerCount(promptId)})`
      );
    }
  );

  // ── chat_message ──────────────────────────────────────────────────
  socket.on(
    "chat_message",
    async (payload: {
      receiverId: string;
      content: string;
      promptId?: string;
    }) => {
      const senderId = getSocketUserId(socket);
      if (!senderId) return;

      const { receiverId, content, promptId } = payload;
      if (!receiverId || !content) return;

      const message = {
        id: generateId(),
        senderId,
        receiverId,
        content,
        promptId,
        createdAt: new Date().toISOString(),
      };

      // Trim history if needed
      if (chatHistory.length >= MAX_MESSAGES) {
        chatHistory.splice(0, chatHistory.length - MAX_MESSAGES + 1);
      }
      chatHistory.push(message);

      // Send to receiver's personal room
      io.to(`user:${receiverId}`).emit("chat_message", {
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
      });

      // Also echo back to sender for confirmation
      socket.emit("chat_message", {
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
      });

      // Persist to database (best-effort)
      persistChatMessage(message);

      console.log(
        `[chat] ${senderId} -> ${receiverId}: ${content.substring(0, 50)}`
      );
    }
  );

  // ── typing ────────────────────────────────────────────────────────
  socket.on("typing", (payload: { receiverId: string }) => {
    const userId = getSocketUserId(socket);
    if (!userId) return;

    const { receiverId } = payload;
    if (!receiverId) return;

    io.to(`user:${receiverId}`).emit("typing", { userId });
  });

  // ── stop_typing ───────────────────────────────────────────────────
  socket.on("stop_typing", (payload: { receiverId: string }) => {
    const userId = getSocketUserId(socket);
    if (!userId) return;

    const { receiverId } = payload;
    if (!receiverId) return;

    io.to(`user:${receiverId}`).emit("stop_typing", { userId });
  });

  // ── mark_messages_read ────────────────────────────────────────────
  socket.on(
    "mark_messages_read",
    (payload: { senderId: string }) => {
      const userId = getSocketUserId(socket);
      if (!userId) return;

      const { senderId } = payload;
      if (!senderId) return;

      // Notify the sender that their messages were read
      io.to(`user:${senderId}`).emit("messages_read", {
        readerId: userId,
      });

      console.log(`[chat] ${senderId}'s messages read by ${userId}`);
    }
  );

  // ── disconnect ────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const userId = getSocketUserId(socket);
    if (userId) {
      // Remove from online users
      onlineUsers.delete(userId);
      io.emit("user_offline", { userId });

      // Clean up all prompt viewer entries for this socket
      for (const [promptId, viewers] of promptViewers.entries()) {
        if (viewers.delete(socket.id)) {
          broadcastViewerCount(io, promptId);
          if (viewers.size === 0) {
            promptViewers.delete(promptId);
          }
        }
      }

      console.log(`[socket] disconnected: ${socket.id} (user: ${userId})`);
    } else {
      console.log(`[socket] disconnected (unauthenticated): ${socket.id}`);
    }
  });
});

// ─── Public API for the main app to push events ──────────────────────
// These can be called from other services / API routes

export function pushNotification(data: {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  userId?: string;
}) {
  if (data.userId) {
    io.to(`user:${data.userId}`).emit("notification", data);
  } else {
    io.emit("notification", data);
  }
}

export function broadcastActivity(data: {
  type: string;
  userId: string;
  userName: string;
  promptTitle: string;
  promptId: string;
  timestamp: string;
}) {
  io.emit("activity", data);
}

export function pushFlashDealUpdate(data: Record<string, unknown>) {
  io.emit("flash_deal_update", data);
}

export function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers.keys());
}

export function getPromptViewerCount(promptId: string): number {
  return getViewerCount(promptId);
}

// Expose io instance for external access
export { io };

// ─── Start server ────────────────────────────────────────────────────
const PORT = 3005;

httpServer.listen(PORT, () => {
  console.log(`[realtime-service] HTTP + Socket.io running on port ${PORT}`);
  console.log(`[realtime-service] Health endpoint: http://localhost:${PORT}/`);

  // Start flash deal ticker
  startFlashDealTicker(io);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[realtime-service] Shutting down...");
  io.close();
  httpServer.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[realtime-service] Shutting down...");
  io.close();
  httpServer.close();
  process.exit(0);
});