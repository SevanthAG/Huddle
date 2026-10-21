import { WebSocketServer, WebSocket} from "ws";
import { randomUUID } from "node:crypto";


const wss = new WebSocketServer({ port: 8080 });

interface Member {
  username: string;
  roomId: string | null;
}

interface Room {
  id: string;
  members: Map<WebSocket, Member>;
}

const rooms = new Map<string, Room>();
const connections = new Map<WebSocket, Member>();

wss.on("connection", (socket) => {
  console.log("User Connected");

  socket.on("message", (message) => {
    const parsedMessage = JSON.parse(message.toString());
  });

  socket.on("close", () => {
    console.log("User Disconncted..!!");
  });
});
