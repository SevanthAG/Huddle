``Huddle``

<aside>
📌

**Purpose:** A practical source of truth for the room-based real-time chat project. The project name is a working name, not a guarantee of uniqueness or trademark availability.

</aside>

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

## 4. Client → server: planned message contract

These are proposed event names and payload shapes to guide implementation. They are not yet verified against the current code and can be adapted to the existing `ws` implementation.

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

## 5. Server → client: planned message contract

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

## 6. Server-side state (initial design)

- **Rooms:** a map keyed by room ID, containing the active connections in each room.
- **Connection metadata:** each socket/connection tracks its username and current room ID.
- **No database required for the first version:** rooms and messages are temporary in-memory state.
- **Membership is server-controlled:** clients cannot broadcast into rooms they have not joined.
- **Cleanup:** both explicit leave and socket disconnect use a shared cleanup path to avoid stale members and empty rooms.

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

- [ ]  Inspect the existing lecture code and understand its current protocol.
- [ ]  Agree final event names and payload shapes with the existing code.
- [ ]  Implement server-side room registry and ID generation.
- [ ]  Implement create-room acknowledgement and frontend navigation.
- [ ]  Implement join-room validation and error display.
- [ ]  Implement room-only message broadcast.
- [ ]  Implement join/leave notifications.
- [ ]  Implement disconnect cleanup and empty-room deletion.
- [ ]  Test with multiple browser tabs, including invalid IDs and abrupt tab closes.
- [ ]  Update this document to match the final working protocol.

## 10. Decisions still open

- Exact frontend framework and UI implementation details.
- Exact event names after reviewing the current source code.
- Whether the server sends timestamps later.
- Maximum message length and basic rate limiting.
- Deployment configuration.

## 11. Guiding principle

Build the smallest correct working version first. Add complexity only when the project needs it. This page records the current plan; the actual source code remains the final authority for implemented behavior.