import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "cn";
import {
  Check,
  Copy,
  LogOut,
  MessageSquare,
  MessagesSquare,
  SendHorizonal,
} from "lucide-react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [copied, setCopied] = useState(false);
  const { state } = useLocation();
  const roomId = state?.roomId;
  const username = state?.username;
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId) {
      navigate("/");
    }
  }, [roomId, navigate]);

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

      if (message.type === "user_left") {
        setMessages((prev) => [
          ...prev,
          {
            kind: "system",
            text: `${message.payload.username} left the room`,
          },
        ]);
      }
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const message = inputRef.current?.value.trim();

    if (!message) {
      return;
    }

    inputRef.current!.value = "";

    send("chat_message", { message: message });
  };

  const handleLeave = () => {
    send("leave_room");
    navigate("/");
  };

  const handleCopy = () => {
    if (!roomId) return;

    navigator.clipboard
      .writeText(roomId)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => undefined);
  };

  return (
    <main className="mx-auto flex h-dvh w-full max-w-2xl flex-col bg-card text-card-foreground md:my-8 md:h-[calc(100dvh-4rem)] md:rounded-3xl md:ring-1 md:ring-foreground/10">
      <header className="flex items-center gap-3 border-b px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <MessagesSquare className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium leading-tight">Huddle</p>
          <p className="truncate text-xs text-muted-foreground">{roomId}</p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Copy room ID"
          onClick={handleCopy}
        >
          {copied ? <Check className="text-primary" /> : <Copy />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Leave room"
          onClick={handleLeave}
        >
          <LogOut />
        </Button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <MessageSquare className="size-8 text-muted-foreground/40" />
            <p className="max-w-56 text-sm text-muted-foreground">
              Nobody has said anything yet. Say hello.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {messages.map((msg, index) =>
              msg.kind === "system" ? (
                <li
                  key={index}
                  className="text-center text-sm italic text-muted-foreground"
                >
                  {msg.text}
                </li>
              ) : (
                <li
                  key={index}
                  className={cn(
                    "flex flex-col gap-0.5",
                    msg.username === username ? "items-end" : "items-start",
                  )}
                >
                  <span className="px-1 text-xs text-muted-foreground">
                    {msg.username}
                  </span>
                  <span
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-1.5 text-sm",
                      msg.username === username
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md bg-secondary text-secondary-foreground",
                    )}
                  >
                    {msg.message}
                  </span>
                </li>
              ),
            )}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 gap-2 border-t px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Type a message"
          aria-label="Message"
          className="h-11 flex-1"
        />
        <Button
          aria-label="Send message"
          onClick={handleSend}
          className="size-11 shrink-0"
        >
          <SendHorizonal />
        </Button>
      </div>
    </main>
  );
};

export default Chat;
