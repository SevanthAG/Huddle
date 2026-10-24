import { Route, Routes } from 'react-router'
import './index.css'
import Create from './pages/Create'
import Chat from './pages/Chat'
import Join from './pages/Join'

function App() {



  return (
    <Routes>
      <Route path='/' element={<Create />} />
      <Route path='/join' element={<Join />} />
      <Route path='/chat/:roomId' element={<Chat />} />
    </Routes>
    
  )
}

export default App
