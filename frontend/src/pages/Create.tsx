import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
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
        navigate("chat", {
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
        title: "Username Missing..!!",
        type: "warning",
      });
      return;
    }
    pendingUsername.current = username;
    send("create_room", { username: username });
  };

  return (
    <div className="h-screen flex flex-row justify-center">
      <div className="flex flex-col justify-center">
        <div className="flex flex-col justify-center gap-2">
          <Input ref={userNameRef} type="text" placeholder="Enter Username" />

          <Button onClick={handleCreate}>CreateRoom</Button>
        </div>

        <div>
          <Button>
            <Link to={"/join"}>Join Room..?</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Create;
