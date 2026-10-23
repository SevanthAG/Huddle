import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast';
import { useRef } from 'react'
import { Link } from 'react-router';
import { send } from "@/lib/socket"

const Create = () => {
  const userNameRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    const username = userNameRef.current?.value.trim();
    if(!username){
      toast.add({
        title: "Username Missing..!!",
        type: "warning"
      })
      return
    }
   send("create_room", { username: username })
  }

  return (

    <div className='h-screen flex flex-row justify-center'>
      <div className='flex flex-col justify-center'>

      <div className='flex flex-col justify-center gap-2'>
        <Input 
        ref={userNameRef}
        type='text'
        placeholder='Enter Username'
        />

        <Button onClick={handleCreate}>CreateRoom</Button>
      </div>

      <div>
        <Button>
        <Link to={"/join"}>Join Room..?</Link>
        </Button>
      </div>
    </div>
    </div>
  )
}

export default Create