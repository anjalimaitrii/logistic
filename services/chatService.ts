import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let socket: Socket | null = null;

export interface ChatMessage {
  _id?: string;
  roomId: string;
  sender: "admin" | "client";
  senderName: string;
  message: string;
  timestamp: string | Date;
}

export const chatService = {
  connect(): Socket {
    if (!socket || !socket.connected) {
      socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    }
    return socket;
  },

  disconnect() {
    socket?.disconnect();
    socket = null;
  },

  joinRoom(roomId: string) {
    socket?.emit("join_room", { roomId });
  },

  sendMessage(payload: { roomId: string; message: string; sender: "admin" | "client"; senderName: string }) {
    socket?.emit("send_message", payload);
  },

  loadHistory(roomId: string) {
    socket?.emit("load_history", { roomId });
  },

  onMessage(callback: (msg: ChatMessage) => void) {
    socket?.off("receive_message");
    socket?.on("receive_message", callback);
  },

  onHistory(callback: (msgs: ChatMessage[]) => void) {
    socket?.off("history");
    socket?.on("history", callback);
  },

  onChatNotification(callback: (data: { roomId: string; senderName: string; message: string }) => void) {
    this.connect();
    socket?.off("chat_notification");
    socket?.on("chat_notification", callback);
  },

  offChatNotification() {
    socket?.off("chat_notification");
  },

  offAll() {
    socket?.off("receive_message");
    socket?.off("history");
  },
};
