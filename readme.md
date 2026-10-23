# Huddle

Room-based real-time chat over WebSockets. Create a room, share the room ID, and chat live with everyone who joins it.

Rooms and messages are held in server memory only — there is no database, no accounts, and no message history.

## Features

- Create a room and receive an ID to share
- Join an active room by ID, with a "Room not found" error if it does not exist
- Messages are broadcast only to members of the same room, including the sender
- System notices when someone joins or leaves
- Leave Room, plus automatic cleanup when a tab is closed
- A room is deleted once its last member leaves, and its ID cannot be reused
- Duplicate usernames are allowed; each connection is tracked independently

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Bun with the `ws` WebSocket server |
| Frontend | React 19, TypeScript, Vite, `react-router` |
| UI | Tailwind CSS with shadcn/ui components |
| State | In memory — no database |

## Getting started

Requires [Bun](https://bun.sh).

Install dependencies once in each folder:

```sh
cd backend && bun install
cd ../frontend && bun install
```

Start the backend:

```sh
cd backend
bun --hot src/index.ts
```

Start the frontend in a second terminal:

```sh
cd frontend
bun run dev
```

Open <http://localhost:5173>. The frontend connects to `ws://localhost:8080`, which is the port the backend listens on.

## Project structure

```
backend/
  src/index.ts          WebSocket server: room registry, handlers, cleanup
frontend/
  src/lib/socket.ts     The single shared WebSocket, plus send() and onMessage()
  src/pages/Create.tsx  Username + Create Room
  src/pages/Join.tsx    Username + room ID
  src/pages/Chat.tsx    Message list, composer, Leave Room
```

## Message protocol

Every message is JSON with a `type` and, where needed, a `payload`. Input that is not valid JSON returns an `INVALID_JSON` error instead of crashing the server.

### Client to server

| Type | Payload | Purpose |
|---|---|---|
| `create_room` | `{ username }` | Request a new room. The server generates the ID. |
| `join_room` | `{ username, roomId }` | Join an existing active room. |
| `chat_message` | `{ message }` | Send a message to the sender's current room. |
| `leave_room` | — | Leave the current room. |

### Server to client

| Type | Payload | Purpose |
|---|---|---|
| `room_created` | `{ roomId }` | The room exists and the creator has joined it. |
| `room_joined` | `{ username, roomId }` | Membership confirmed to the joining client. |
| `chat_message` | `{ username, message }` | Delivered to every member of the room, including the sender. |
| `user_joined` | `{ username }` | Sent to existing members when someone joins. |
| `user_left` | `{ username }` | Sent to remaining members when someone leaves or disconnects. |
| `error` | `{ code, message }` | e.g. `ROOM_NOT_FOUND`, `INVALID_JSON`. |

## How it works

- **The server owns room IDs and membership.** `chat_message` resolves the sender's room from the server's own connection state; a client-supplied room ID is never trusted as authorization.
- **Members are keyed by socket, not by username,** so two people using the same name are tracked separately and leaving does not evict the other.
- **One socket per browser tab.** It is created once in `frontend/src/lib/socket.ts` and shared by every page through `send()` and `onMessage()`. Navigating between pages does not reconnect.
- **One cleanup path for two causes.** `removeFromRoom` runs for both an explicit `leave_room` and an unexpected socket close. It unregisters the socket, notifies the remaining members, and deletes the room once it is empty.

## Limitations

- Unknown message types, empty usernames, and a `chat_message` sent before joining a room are ignored silently, with no error reply.
- Message text is not type-checked; a non-string `message` falls through to the generic `INVALID_JSON` error.
- Room IDs are 36-character UUIDs, which are impractical to read aloud or type.
- Messages are not persisted. A new joiner sees only messages sent after they arrive.

## Possible next steps

- Short, human-friendly room codes, with a copy button
- A visible connection-lost indicator
- Message length limits and basic rate limiting
- Deployment
