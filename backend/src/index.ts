import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (socket) => {
  socket.send("User Connected")

  socket.on("message", (data) => {
    socket.send("I Recived Data")
  })

  socket.on("close", () => {
    console.log("User Disconncted..!!");
  });
});
