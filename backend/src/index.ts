import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "node:crypto";
import { parse } from "node:path";

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
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message.toString());

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

      if (parsedMessage.type === "join_room") {
        const username = parsedMessage.payload.username;
        const roomId = parsedMessage.payload.roomId;

        if (!username || !roomId) {
          return;
        }

        if (!rooms.has(roomId)) {
          socket.send(
            JSON.stringify({
              type: "error",
              payload: {
                code: "ROOM_NOT_FOUND",
                message: "Room not found",
              },
            }),
          );

          return;
        }

        const member: Member = {
          username,
          roomId,
        };

        const room = rooms.get(roomId);

        if (!room) {
          return;
        }

        room.members.set(socket, member);
        connections.set(socket, member);
        rooms.set(roomId, room);

        socket.send(
          JSON.stringify({
            type: "room_joined",
            payload: {
              username: username,
              roomId: roomId,
            },
          }),
        );
      }
    } catch {
      socket.send(
        JSON.stringify({
          type: "error",
          payload: {
            code: "INVALID_JSON",
            message: "Please send a valid JSON message",
          },
        }),
      );
      return;
    }
  });

  socket.on("close", () => {
    console.log("User Disconncted..!!");
  });
});
