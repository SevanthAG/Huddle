import { Route, Routes } from 'react-router'
import './index.css'
import Create from './pages/Create'
import Chat from './pages/Chat'
import Join from './pages/Join'
import { useEffect } from 'react'

function App() {

  useEffect(()=>{
    const ws = new WebSocket("ws://localhost:8080")

    ws.onopen = () =>{
      ws.send("Connection Done..")
    }

    ws.onmessage = (event) => {
      console.log("Send By Server+ ",event.data)
    }

    ws.onerror = () => {
      console.log("Connection Error")
    }

    ws.onclose = () => {
      console.log("Connection Closed")
    }

    return () => {
      ws.close();
    }

  },[])

  return (
    <Routes>
      <Route path='/' element={<Create />} />
      <Route path='/join' element={<Join />} />
      <Route path='/chat' element={<Chat />} />
    </Routes>
    
  )
}

export default App
