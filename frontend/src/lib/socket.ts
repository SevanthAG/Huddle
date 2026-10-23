const socket = new WebSocket("ws://localhost:8080");

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
  try {
    const parsedMessage = JSON.parse(String(event.data));

    console.log(parsedMessage);
  } catch {
    console.log("Non JSOn");
  }
};

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
