import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'
import { useRef } from 'react'
import { Link } from 'react-router';

const Create = () => {
  const userNameRef = useRef(null);

  const handleCreate = () => {
    console.log(userNameRef.current.value)
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