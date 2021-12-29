import { useRef, useState, useEffect, useCallback } from 'react'
import './App.css';

import {
  createSocket,
  createOrJoinRoom,
  setupMyVideoElem,
  onPartnerMediaStreamReceived,
  sendMessage,
  onReceiveMessage
} from './lib/connection'

function App() {
  const [messages, setMessages] = useState([])
  const messageBoxRef = useRef(null)
  const roomNameRef = useRef(null)
  const myVideoRef = useRef(null)
  const partnerVideoRef = useRef(null)
  
  useEffect(() => {
    createSocket()
    setupMyVideoElem(myVideoRef.current)
  }, [])

  const handleJoinRoomClick = () => {
    const roomName = roomNameRef.current.value

    onPartnerMediaStreamReceived((stream) => {
      console.log('onPartnerMediaStreamReceived called ', stream)
      partnerVideoRef.current.srcObject = stream
    })

    onReceiveMessage((msg) => {
      setMessages(oldState => ([
        ...oldState,
        {
          sender: 'partner',
          msg
        }
      ]))
    })

    createOrJoinRoom(roomName)
  }

  const handleSendMessageClick = () => {
    const messageBox = messageBoxRef.current
    const msgValue = messageBox.value
    
    sendMessage(msgValue)
    messageBox.value = ''

    setMessages([ ...messages, {
      sender: 'me',
      msg: msgValue
    }])
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
      <div className="grid-item chat-container">
        <div className="chat-messages">
          {messages.map(({ sender, msg }) => {
            const isMyMessage = sender === 'me'
            return (
              <p key={`${new Date().toDateString()}${sender}${msg}`} className="message-line">
                <span className={`message-sender ${isMyMessage ? 'me' : 'partner'}`}>
                  {isMyMessage ? 'me: ' : 'partner: '}
                </span>
                <span className='message-content'>
                  {msg}
                </span>
              </p>
            )
          })}
        </div>
        <input type="text" ref={messageBoxRef} />
        <button onClick={handleSendMessageClick}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
