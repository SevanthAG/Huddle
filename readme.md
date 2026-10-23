``Huddle``

<aside>
📌

**Purpose:** A practical source of truth for the room-based real-time chat project. The project name is a working name, not a guarantee of uniqueness or trademark availability.

</aside>

## Implementation status

Proven working end to end, as of Phase 9. Anything below that is not marked implemented is still a plan.

**Working:**

- One WebSocket connection per browser tab, created once in `frontend/src/lib/socket.ts` and imported by `main.tsx`.
- **Create Room** — the client sends `create_room` and navigates to the chat screen only after the server replies `room_created`.
- **Join Room** — the client sends `join_room`, navigates only on `room_joined`, and on an `error` reply shows a "Room not found" toast while staying on the entry screen.
- The chat screen displays the room ID it received from the server.
- **Send a message** — the client sends `chat_message`; the server broadcasts it to every member of that room, including the sender; each message renders with its author's username.
- Rooms are isolated — a second room receives nothing from the first.

**Not built yet:**

- The `user_joined` broadcast on the server (Phase 10).
- Leave Room, disconnect cleanup, and deletion of empty rooms (Phase 11).
- Unknown message types are ignored silently, with no error returned to the client (Phase 12).
- Room IDs are 36-character UUIDs, which are impractical to share. Revisit later.

### Running locally

Backend, in one terminal:

```sh
cd backend
bun --hot src/index.ts
```

Frontend, in a second terminal:

```sh
cd frontend
bun run dev
```

The frontend connects to `ws://localhost:8080`, which is the port the backend listens on.

## 1. Project summary

A lightweight, temporary, room-based chat app built from the user's existing WebSocket learning project. A user enters a username, creates a room or joins an active room by ID, and exchanges messages live with people in that room.

## 2. Confirmed product decisions

- Users choose **Create Room** or **Join Room** after entering a username.
- Clicking Create Room asks the server to create a room and generate a room ID; after success, the creator navigates to the chat page.
- The creator can share the room ID so others can join.
- Anyone with a valid active room ID can join; no creator approval is needed.
- Duplicate usernames are allowed. The server distinguishes connections independently of display names.
- When a user joins, existing room members see a system message such as “Sevanth joined the room.” The new user can chat immediately.
- When a user leaves or disconnects, remaining members see a system message such as “Rahul left the room.”
- When the last user leaves or disconnects, the room is removed from active memory.
- An old room ID cannot be used to recreate a room. A join attempt receives “Room not found.”
- Messages are broadcast only to members of the same room, including the sender.
- A new joiner sees messages sent after they join, not earlier messages.
- Keep the first version simple; do not add unrelated features without discussion.

## 3. User flows

### Create a room

1. User enters a username.
2. User clicks **Create Room**.
3. Client sends a create-room request to the server.
4. Server creates an active room, generates a unique room ID, and registers the creator as a member.
5. Server confirms success with the room ID.
6. Client navigates to the chat page and displays the room ID.
7. Creator shares the ID with others.

### Join a room

1. User enters a username and room ID.
2. Client sends a join-room request.
3. Server checks that the room exists and is active.
4. If valid, server registers the user's connection in that room and confirms success.
5. Other members receive a join system event; the new user can send and receive subsequent messages.
6. If invalid, server returns a “Room not found” error and the user stays on the join screen.

### Send a message

1. Client sends a message event containing the message text and the required room context.
2. Server validates the message and verifies the sender is a member of the room.
3. Server broadcasts the message to all current members of that room, including the sender.
4. Other rooms receive nothing.

### Leave and cleanup

1. User clicks **Leave Room** or disconnects.
2. Server removes that connection from the room.
3. If members remain, server broadcasts a leave system event to them.
4. If no members remain, server deletes the room from the active room registry.
5. Future join attempts with that ID receive “Room not found.”

## 4. Client → server: message contract

Implemented: `create_room`, `join_room`, `chat_message`. Still planned: `leave_room`.

Every message is JSON with a `type` and, where needed, a `payload`. Unparseable input returns an `INVALID_JSON` error rather than crashing the server.

### `create_room`

```json
{
  "type": "create_room",
  "payload": {
    "username": "Rahul"
  }
}
```

Purpose: request a new room. The client does not choose the authoritative room ID; the server generates it.

### `join_room`

```json
{
  "type": "join_room",
  "payload": {
    "username": "Priya",
    "roomId": "generated-room-id"
  }
}
```

Purpose: request to join an existing active room.

### `chat_message`

```json
{
  "type": "chat_message",
  "payload": {
    "message": "Hey everyone!"
  }
}
```

Purpose: send a message. The server should use the sender's registered room membership rather than trusting a client-supplied room ID as authorization.

### `leave_room`

```json
{
  "type": "leave_room"
}
```

Purpose: leave the current room intentionally. The server must also handle socket disconnection without relying on this event.

## 5. Server → client: message contract

Implemented: `room_created`, `room_joined`, `chat_message`, `error`. Still planned: `user_joined`, `user_left`.

### `room_created`

```json
{
  "type": "room_created",
  "payload": {
    "roomId": "generated-room-id"
  }
}
```

Purpose: confirm that the room exists and the creator has joined it. Navigate only after this success response.

### `room_joined`

```json
{
  "type": "room_joined",
  "payload": {
    "roomId": "generated-room-id",
    "username": "Priya"
  }
}
```

Purpose: confirm successful membership to the joining client.

### `chat_message`

```json
{
  "type": "chat_message",
  "payload": {
    "username": "Rahul",
    "message": "Hey everyone!"
  }
}
```

Purpose: deliver a message to every active member of that room, including its sender. Timestamp is intentionally omitted from the initial scope to keep the protocol simple.

### `user_joined`

```json
{
  "type": "user_joined",
  "payload": {
    "username": "Sevanth"
  }
}
```

Purpose: show a system notification to existing room members.

### `user_left`

```json
{
  "type": "user_left",
  "payload": {
    "username": "Rahul"
  }
}
```

Purpose: notify remaining members when a user leaves or disconnects.

### `error`

```json
{
  "type": "error",
  "payload": {
    "code": "ROOM_NOT_FOUND",
    "message": "Room not found"
  }
}
```

Purpose: return a structured error for invalid room IDs or other invalid requests. More error codes can be added when actual implementation needs them.

## 6. Server-side state

Implemented in `backend/src/index.ts` with two Maps in module scope.

- **`rooms: Map<string, Room>`** — keyed by room ID. Each `Room` holds `members: Map<WebSocket, Member>`.
- **`connections: Map<WebSocket, Member>`** — keyed by socket. The reverse index: given a socket, it answers "who is this, and which room are they in?" Each `Member` stores `username` and `roomId`.
- **Two indexes over the same relationship.** `connections` is used when a message arrives from a socket; `rooms` is used when broadcasting to a whole room.
- **Members are keyed by socket, not by username.** This is what allows duplicate usernames while still tracking two same-named users separately.
- **Membership is server-controlled.** `chat_message` looks the sender's room up in `connections` and never trusts a client-supplied room ID as authorization.
- **No database.** Rooms and messages are temporary in-memory state.
- **Room IDs** come from `randomUUID()`, which cannot collide with an active room.

**Still missing:** the `close` handler only logs. Members are never removed from a room, `connections` never shrinks, and empty rooms are never deleted. That is Phase 11.

## 7. Important edge cases

- Invalid or expired room ID: return `ROOM_NOT_FOUND`; do not create a room.
- Malformed JSON or unknown event type: return a clear error when possible; do not crash the server.
- Message sent before joining: reject it.
- Empty or whitespace-only message: ignore or reject it.
- One socket disconnects: remove only that connection, even if another user has the same username.
- Last socket leaves: delete the room.
- Duplicate join/leave events: cleanup should be safe to call more than once.
- Room IDs should be sufficiently unique; the server should avoid collisions with existing active rooms.
- Unexpected disconnect detection depends on the WebSocket connection and server runtime; test it in multiple browser tabs.

## 8. Message visibility rule

Messages are not persisted. A client sees messages delivered while it is a member of the room. A new joiner does not receive earlier messages. When a room becomes empty and is deleted, its in-memory state is discarded.

## 9. Development order

- [x]  Inspect the existing lecture code and understand its current protocol.
- [x]  Agree final event names and payload shapes with the existing code.
- [x]  Implement server-side room registry and ID generation.
- [x]  Implement create-room acknowledgement and frontend navigation.
- [x]  Implement join-room validation and error display.
- [x]  Implement room-only message broadcast.
- [ ]  Implement join/leave notifications.
- [ ]  Implement disconnect cleanup and empty-room deletion.
- [ ]  Test with multiple browser tabs, including invalid IDs and abrupt tab closes.
- [ ]  Update this document to match the final working protocol.

## 10. Decisions still open

Settled:

- ✅ Frontend stack — React + TypeScript + Vite, routed with `react-router`.
- ✅ Event names and payload shapes — as written in sections 4 and 5.
- ✅ Room ID generation — `randomUUID()` on the server.

Open:

- Room ID format for sharing. A 36-character UUID is unique but unusable to read aloud or type.
- Whether the server sends timestamps later.
- Maximum message length and basic rate limiting.
- Deployment configuration.

## 11. Guiding principle

Build the smallest correct working version first. Add complexity only when the project needs it. This page records the current plan; the actual source code remains the final authority for implemented behavior.