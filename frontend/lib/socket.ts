import { io, Socket } from "socket.io-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://0.0.0.0:4000";

let socket: Socket | null = null;

/**
 * Singleton Socket.IO connection to the backend.
 * The backend consumes Kafka topic `smartcity.temperature.readings`
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
      console.log("[Socket.IO] Connected to backend:", BACKEND_URL);
    });

    socket.on("disconnect", (reason) => {
      console.warn("[Socket.IO] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket.IO] Connection error:", err.message);
    });
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
