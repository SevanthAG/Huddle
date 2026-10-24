import { WebSocketServer, WebSocket } from "ws";
import { randomInt } from "node:crypto";

const port = Number(process.env.PORT) || 8080;

const wss = new WebSocketServer({ port });
console.log(`Listening on port ${port}`);

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomId(): string {
  let code = "";
  do {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    }
  } while (rooms.has(code));
  return code;
}

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

function removeFromRoom(socket: WebSocket) {
  const member = connections.get(socket);

  if (!member || !member.roomId) {
    return;
  }

  const room = rooms.get(member.roomId);

  if (!room) {
    return;
  }

  room.members.delete(socket);
  connections.delete(socket);

  const response = JSON.stringify({
    type: "user_left",
    payload: {
      username: member.username,
    },
  });

  for (const [memberSocket] of room.members) {
    if (memberSocket.readyState === WebSocket.OPEN) {
      memberSocket.send(response);
    }
  }

  if (room.members.size === 0) {
    rooms.delete(member.roomId);
  }
}

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

        const roomId: string = generateRoomId();

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
        const roomId = String(parsedMessage.payload.roomId || "").toUpperCase();

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

        const alreadyMember = connections.get(socket)?.roomId === roomId;

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

        if (alreadyMember) {
          return;
        }

        const userJoined = JSON.stringify({
          type: "user_joined",
          payload: {
            username: member.username,
          },
        });

        for (const [memberSocket] of room.members) {
          if (
            memberSocket !== socket &&
            memberSocket.readyState === WebSocket.OPEN
          ) {
            memberSocket.send(userJoined);
          }
        }
      }

      if (parsedMessage.type === "chat_message") {
        const chatMessage = parsedMessage.payload.message;
        
        if(!chatMessage || !chatMessage.trim()){
          return
        }

        const member = connections.get(socket);

        if (!member || !member.roomId) {
          return;
        }

        const room = rooms.get(member.roomId);

        if (!room) {
          return;
        }

        const response = JSON.stringify({
          type: "chat_message",
          payload: {
            username: member.username,
            message: chatMessage,
          },
        });

        for (const [memberSocket] of room.members) {
          if (memberSocket.readyState === WebSocket.OPEN) {
            memberSocket.send(response);
          }
        }
      }

      if (parsedMessage.type === "leave_room") {
        removeFromRoom(socket);
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
    removeFromRoom(socket);
  });
});
