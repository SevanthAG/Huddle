import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useRef } from "react";
import { Link, useNavigate } from "react-router";

const Join = () => {
  const userNameRef = useRef<HTMLInputElement>(null);
  const roomIdRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleJoin = () => {
    const username = userNameRef.current?.value.trim();
    const roomId = roomIdRef.current?.value.trim();

    if(!username || !roomId){
      toast.add({
        title: "Username or RoomId Missing..!!",
        type: "warning"
      })
      return
    }

    navigate("/chat");
  };

  return (
    <div className="h-screen flex flex-row justify-center">
      <div className="flex flex-col justify-center">
        <div className="flex flex-col justify-center gap-2">
          <Input ref={userNameRef} type="text" placeholder="Enter Username" />

          <div className="flex flex-col justify-center gap-2">
            <Input ref={roomIdRef} type="text" placeholder="Enter RoomID" />

            <Button onClick={handleJoin}>Join-Room</Button>
          </div>

          <div>
            <Button>
              <Link to={"/"}>Create Room..?</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Join;
