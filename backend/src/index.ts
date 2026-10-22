import { WebSocketServer, WebSocket } from "ws";
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

    if (parsedMessage.type === "create_room") {
      const username = parsedMessage.payload.username;

      if (!username) {
        return;
      }

      const roomId: string = randomUUID();

      const member: Member = {
        username,
        roomId,
      };

      const room: Room = {
        id: roomId,
        members: new Map<WebSocket, Member>(),
      };

      console.log(roomId);
      room.members.set(socket, member);

      connections.set(socket, member);
      rooms.set(roomId, room);

      socket.send(
        JSON.stringify({
          type: "room_created",
          payload: {
            roomId: roomId,
          },
        }),
      );
    }
  });

  socket.on("close", () => {
    console.log("User Disconncted..!!");
  });
});
