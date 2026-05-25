import { io, Socket } from "socket.io-client";
import { BACKEND_URL } from "@/lib/constants";

let socket: Socket | null = null;

export interface SocketStatus {
  connected: boolean;
  reconnecting: boolean;
  reconnectAttempt: number;
  lastEvent: string | null;
  eventCount: number;
  error: string | null;
  updatedAt: string | null;
}

const isDev = process.env.NODE_ENV !== "production";

let socketStatus: SocketStatus = {
  connected: false,
  reconnecting: false,
  reconnectAttempt: 0,
  lastEvent: null,
  eventCount: 0,
  error: null,
  updatedAt: null,
};

const statusListeners = new Set<(status: SocketStatus) => void>();

function logDev(level: "log" | "warn" | "error", message: string, detail?: unknown) {
  if (!isDev) return;
  console[level](message, detail ?? "");
}

function updateSocketStatus(patch: Partial<SocketStatus>) {
  socketStatus = {
    ...socketStatus,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  statusListeners.forEach(listener => listener(socketStatus));
}

export function getSocketStatus(): SocketStatus {
  return socketStatus;
}

export function subscribeSocketStatus(listener: (status: SocketStatus) => void): () => void {
  statusListeners.add(listener);
  listener(socketStatus);

  return () => {
    statusListeners.delete(listener);
  };
}

/**
 * Singleton Socket.IO connection to the backend.
 * The backend consumes Kafka topic `smartcity.environment.readings`
 * and re-broadcasts via Socket.IO events.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      autoConnect: true,
    });

    socket.on("connect", () => {
      updateSocketStatus({
        connected: true,
        reconnecting: false,
        reconnectAttempt: 0,
        error: null,
      });
      logDev("log", "[Socket.IO] Connected to backend:", BACKEND_URL);
    });

    socket.on("disconnect", (reason) => {
      updateSocketStatus({
        connected: false,
        reconnecting: reason !== "io client disconnect",
        error: reason,
      });
      logDev("warn", "[Socket.IO] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      updateSocketStatus({
        connected: false,
        reconnecting: true,
        error: err.message,
      });
      logDev("error", "[Socket.IO] Connection error:", err.message);
    });

    socket.io.on("reconnect_attempt", (attempt) => {
      updateSocketStatus({
        connected: false,
        reconnecting: true,
        reconnectAttempt: attempt,
      });
      logDev("warn", "[Socket.IO] Reconnect attempt:", attempt);
    });

    socket.io.on("reconnect", (attempt) => {
      updateSocketStatus({
        connected: true,
        reconnecting: false,
        reconnectAttempt: attempt,
        error: null,
      });
      logDev("log", "[Socket.IO] Reconnected after attempt:", attempt);
    });

    socket.io.on("reconnect_error", (err) => {
      updateSocketStatus({
        connected: false,
        reconnecting: true,
        error: err.message,
      });
      logDev("error", "[Socket.IO] Reconnect error:", err.message);
    });

    socket.io.on("reconnect_failed", () => {
      updateSocketStatus({
        connected: false,
        reconnecting: false,
        error: "Reconnexion Socket.IO echouee",
      });
      logDev("error", "[Socket.IO] Reconnect failed");
    });

    socket.onAny((event) => {
      updateSocketStatus({
        lastEvent: event,
        eventCount: socketStatus.eventCount + 1,
      });
    });
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    updateSocketStatus({
      connected: false,
      reconnecting: false,
      reconnectAttempt: 0,
      error: null,
    });
  }
}
