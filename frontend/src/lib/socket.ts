const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";

const socket = new WebSocket(WS_URL);

const handlers = new Set<(message: any) => void>();


export function send(type: string, payload?: any) {
  if (socket.readyState !== WebSocket.OPEN) {
    console.log("Not open");
    return;
  }
  socket.send(
    JSON.stringify({
      type,
      payload,
    }),
  );
}

export function onMessage(handler: (message: any) => void){
    handlers.add(handler);
    return () => {
        handlers.delete(handler)
    }
}

socket.onopen = () => {
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
