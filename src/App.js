import { useRef, useEffect } from 'react'
import './App.css';

import {
  createSocket,
  createOrJoinRoom,
  setupMyVideoElem,
  onPartnerMediaStreamReceived
} from './lib/connection'

function App() {
  const roomNameRef = useRef(null)
  const myVideoRef = useRef(null)
  const partnerVideoRef = useRef(null)
  
  useEffect(() => {
    createSocket()
    setupMyVideoElem(myVideoRef.current)
  }, [])

  const handleJoinRoomClick = (e) => {
    const roomName = roomNameRef.current.value
    onPartnerMediaStreamReceived((stream) => {
      console.log('onPartnerMediaStreamReceived called ', stream)
      partnerVideoRef.current.srcObject = stream
    })
    createOrJoinRoom(roomName)
  }

  return (
    <div className="App">
      <div className="grid-item room-name-container">
        <input type="text" ref={roomNameRef} />
        <button onClick={handleJoinRoomClick}>
          Join room
        </button>
      </div>
      <div className="grid-item videos-container">
        <video autoPlay ref={myVideoRef}></video>
        <video autoPlay ref={partnerVideoRef}></video>
      </div>
    </div>
  );
}

export default App;
