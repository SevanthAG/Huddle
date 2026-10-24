import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { ArrowRight, LogIn, MessagesSquare } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { onMessage, send } from "@/lib/socket";

const Join = () => {
  const userNameRef = useRef<HTMLInputElement>(null);
  const roomIdRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillRoomId = searchParams.get("roomId") ?? "";

  useEffect(() => {
    return onMessage((message) => {
      if (message.type === "room_joined") {
        navigate(`/chat/${message.payload.roomId}`, {
          state: {
            username: message.payload.username,
          },
        });
      }

      if (message.type === "error") {
        toast.add({ title: message.payload.message, type: "error" });
      }
    });
  }, [navigate]);

  const handleJoin = () => {
    const username = userNameRef.current?.value.trim();
    const roomId = roomIdRef.current?.value.trim();

    if (!username || !roomId) {
      toast.add({
        title: "Enter a username and a room ID",
        type: "warning",
      });
      return;
    }
    send("join_room", { username: username, roomId: roomId });
  };

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-10 px-6">
      <header className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <MessagesSquare className="size-7" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Huddle</h1>
          <p className="text-sm text-muted-foreground">
            Join a room that already exists.
          </p>
        </div>
      </header>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Input
          ref={userNameRef}
          type="text"
          placeholder="Enter a username"
          aria-label="Username"
          className="h-11"
        />
        <Input
          ref={roomIdRef}
          type="text"
          defaultValue={prefillRoomId}
          placeholder="Enter a room ID"
          aria-label="Room ID"
          className="h-11"
        />
        <Button className="h-11 w-full" onClick={handleJoin}>
          <LogIn /> Join room
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-11 text-sm text-muted-foreground hover:text-foreground"
        render={<Link to="/" />}
      >
        Or create a new room <ArrowRight className="size-4" />
      </Button>
    </div>
  );
};

export default Join;
