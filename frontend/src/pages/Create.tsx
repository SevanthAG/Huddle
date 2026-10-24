import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { ArrowRight, MessagesSquare, Plus } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { send, onMessage } from "@/lib/socket";

const Create = () => {
  const userNameRef = useRef<HTMLInputElement>(null);
  const pendingUsername = useRef("");
  const navigate = useNavigate();

  useEffect(() => {
    return onMessage((message) => {
      if (message.type === "room_created") {
        navigate("/chat", {
          state: {
            username: pendingUsername.current,
            roomId: message.payload.roomId,
          },
        });
      }
    });
  }, []);

  const handleCreate = () => {
    const username = userNameRef.current?.value.trim();
    if (!username) {
      toast.add({
        title: "Enter a username",
        type: "warning",
      });
      return;
    }
    pendingUsername.current = username;
    send("create_room", { username: username });
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
            Create a room. Share the code. Start chatting.
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
        <Button className="h-11 w-full" onClick={handleCreate}>
          <Plus /> Create room
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-11 text-sm text-muted-foreground hover:text-foreground"
        render={<Link to="/join" />}
      >
        Join an existing room <ArrowRight className="size-4" />
      </Button>
    </div>
  );
};

export default Create;
