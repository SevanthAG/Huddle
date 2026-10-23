import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { onMessage, send } from "@/lib/socket";

type ChatItem =
  | {
      kind: "chat";
      username: string;
      message: string;
    }
  | {
      kind: "system";
      text: string;
    };

const Chat = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const { state } = useLocation();
  const roomId = state?.roomId;

  const navigate = useNavigate();

  useEffect(() => {
    return onMessage((message) => {
      if (message.type === "chat_message") {
        setMessages((prev) => [
          ...prev,
          {
            kind: "chat",
            username: message.payload.username,
            message: message.payload.message,
          },
        ]);
      }

      if (message.type === "user_joined") {
        setMessages((prev) => [
          ...prev,
          {
            kind: "system",
            text: `${message.payload.username} joined the room`,
          },
        ]);
      }

      if(message.type ===  "user_left"){
        setMessages((prev)=> [
          ...prev,
          { kind: "system",
            text: `${message.payload.username} left the room`
          }
        ])
      }
    });
  }, []);

  const handleSend = () => {
    const message = inputRef.current?.value.trim();

    if (!message) {
      return;
    }

    inputRef.current!.value = "";

    send("chat_message", { message: message });
  };

  const handleLeave = () => {
    send("leave_room")
    navigate("/")
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[85vh] flex flex-col p-4">
        <CardHeader className="border-b px-2 pb-4">
          <CardTitle className="text-2xl font-bold">Huddle</CardTitle>
          <CardDescription>
            <p>Room: {roomId}</p>
          </CardDescription>
          <CardAction>
            <Button variant={"ghost"} onClick={handleLeave}>
              Leave_Room
            </Button>
          </CardAction>
        </CardHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {messages.map((msg, index) =>
            msg.kind === "chat" ? (
              <div key={index}>
                <span>{msg.username}</span>: {msg.message}
              </div>
            ) : (
              <div
                key={index}
                className="text-center text-sm text-gray-500 italic"
              >
                {msg.text}
              </div>
            ),
          )}
        </div>

        <div className="flex gap-2 border-t pt-4">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={handleSend}>Send</Button>
        </div>
      </Card>
    </div>
  );
};

export default Chat;
