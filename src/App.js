import { useRef, useEffect } from 'react'
import { io } from "socket.io-client";
import './App.css';

const SERVER_URL = 'http://teste.local:8080'

const getMyMedia = () => {
  const constraints = {
    audio: false,
    video: true
  }
  return navigator.mediaDevices.getUserMedia(constraints)
}

const createSocket = async () => {
  const socket = io(SERVER_URL, {
    rejectUnauthorized: false
  })
  
  socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
  });

  socket.on("connect", () => {
    console.log('conectado')
  })
}

const createOrJoinRoom = async () => {
  createSocket()
}

const setupMyMedia = async (myVideoElem) => {
  try {
    const stream = await getMyMedia()
    myVideoElem.srcObject = stream
  } catch(e) {
    console.log('[setupMyMedia] Error: ', e)
  }
}

function App() {
  const myVideoRef = useRef(null)
  const partnerVideoRef = useRef(null)
  
  const setupCall = async () => {
    await createOrJoinRoom()
    await setupMyMedia(myVideoRef.current)
  }

  useEffect(() => {
    setupCall()
  }, [])

  return (
    <div className="App">
      <video autoPlay ref={myVideoRef}></video>
      <video autoPlay ref={partnerVideoRef}></video>
    </div>
  );
}

export default App;
