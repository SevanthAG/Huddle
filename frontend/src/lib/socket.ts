const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";

const socket = new WebSocket(WS_URL);

const handlers = new Set<(message: any) => void>();
const queue: string[] = [];

export function send(type: string, payload?: any) {
  const text = JSON.stringify({
    type,
    payload,
  });

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(text);
    return;
  }

  if (socket.readyState === WebSocket.CONNECTING) {
    queue.push(text);
  }
}

export function onMessage(handler: (message: any) => void){
    handlers.add(handler);
    return () => {
        handlers.delete(handler)
    }
}

socket.onopen = () => {
  for (const text of queue) {
    socket.send(text);
  }
  queue.length = 0;
  console.log("Connected To Server");
};

socket.onclose = () => {
  console.log("Disconnected");
};

socket.onerror = () => {
  console.log("Connection Error");
};

socket.onmessage = (event) => {
    let parsedMessage;
  try {
    parsedMessage = JSON.parse(String(event.data));
  } catch {
    console.log("Not valid JSON");
    return
  }

  for (const handler of handlers) {
    handler(parsedMessage)
  }
};
