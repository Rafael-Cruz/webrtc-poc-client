import { connect, io } from "socket.io-client";

const SERVER_URL = process.env.REACT_APP_BE_HOST
const iceServers = [
  {
    urls: 'stun:stun.l.google.com:19302'
  }
]

const DATA_CHANNEL_CHAT_LABEL = 'chat'

let socket

let myMediaStream
let partnerMediaStream
let connection
let dataChannel

let roomName
let isCaller

let callbackTrackReceived
let callbackMessageReceived

const getSocket = () => {
  if (socket === null) {
    createSocket()
  }

  return socket
}

const getMyMedia = () => {
  const constraints = {
    audio: true,
    video: true
  }
  return navigator.mediaDevices.getUserMedia(constraints)
}

const handleIceCandidate = ({ candidate }) => {
  if (candidate) {
    console.log('sending ice candidate', candidate)
    
    const {
      sdpMLineIndex,
      sdpMid,
      usernameFragment,
      candidate: innerCandidate
    } = candidate

    socket.emit('candidate', {
      roomName,
      sdpMLineIndex,
      sdpMid,
      usernameFragment,
      candidate: innerCandidate
    })
  }
}

const handleAddStream = (e) => {
  console.log('handling track', e)

  partnerMediaStream = e.streams[0]
  callbackTrackReceived(partnerMediaStream)
}

const handleDataChannelMessage = ({ data }) => {
  console.log('received data channel message: ', data)
  callbackMessageReceived(data)
}

const handleReceiveDataChannel = ({ channel }) => {
  console.log('receiving remote data channel ', channel)
  dataChannel = channel
  dataChannel.onmessage = handleDataChannelMessage
}

export const createSocket = () => {
  socket = io(SERVER_URL, {
    rejectUnauthorized: false
  })

  socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
  });

  socket.on("connect", () => {
    console.log('conectado')
  })

  socket.on("created", (room) => {
    roomName = room
    isCaller = true
    console.log(`room ${room} was created`)
  })

  socket.on("joined", (room) => {
    roomName = room
    isCaller = false
    console.log(`joined ${room}`)
  })

  socket.on("full room", (roomName) => {
    console.log(`${roomName} is full`)
  })

  socket.on("ready", () => {
    console.log("room ready")

    if (!isCaller) {
      console.log('not the caller; ready event skipped')
      return
    }

    connection = new RTCPeerConnection({ iceServers })
    connection.onicecandidate = handleIceCandidate
    connection.ontrack = handleAddStream

    connection.onnegotiationneeded = async () => {
      console.log('onnegotiationneeded event called')
      try {
        const offer = await connection.createOffer()
        await connection.setLocalDescription(offer)

        console.log('Offer created: ', offer)

        socket.emit('offer', {
          roomName,
          sdp: offer
        })

      } catch (e) {
        console.log('Error on offer creation: ', e)
      }
    }

    const audioTracks = myMediaStream.getAudioTracks()
    const videosTracks = myMediaStream.getVideoTracks()

    connection.addTrack(audioTracks[0], myMediaStream)
    connection.addTrack(videosTracks[0], myMediaStream)

    dataChannel = connection.createDataChannel(DATA_CHANNEL_CHAT_LABEL)
    dataChannel.onmessage = handleDataChannelMessage
  })

  socket.on('offer', async (sdp) => {
    console.log('Offer received', sdp)

    if (isCaller) {
      console.log('is caller; skipping offer handling')
      return
    }

    try {
      connection = new RTCPeerConnection({ iceServers })
      connection.onicecandidate = handleIceCandidate
      connection.ontrack = handleAddStream

      const audioTracks = myMediaStream.getAudioTracks()
      const videosTracks = myMediaStream.getVideoTracks()

      connection.addTrack(audioTracks[0], myMediaStream)
      connection.addTrack(videosTracks[0], myMediaStream)

      connection.ondatachannel = handleReceiveDataChannel

      await connection.setRemoteDescription(sdp)

      const answer = await connection.createAnswer()
      await connection.setLocalDescription(answer)

      console.log('Answer created: ', answer)

      socket.emit('answer', {
        roomName,
        sdp: answer
      })

    } catch (e) {
      console.log('error on offer handling: ', e)
    }
  })

  socket.on('answer', (sdp) => {
    console.log('answer received', sdp)

    if (!isCaller) {
      console.log('not the caller; answer event skipped')
      return
    }

    connection.setRemoteDescription(sdp)
  })

  socket.on('candidate', ({ 
    sdpMLineIndex,
    sdpMid,
    usernameFragment,
    candidate
  }) => {
    console.log('receiving ice candidate', {
      sdpMLineIndex,
      usernameFragment,
      sdpMid,
      candidate
    })

    connection.addIceCandidate({
      sdpMLineIndex,
      sdpMid,
      usernameFragment,
      candidate
    })
  })
}

export const setupMyVideoElem = async (myVideoElem) => {
  try {
    const stream = await getMyMedia()
    myMediaStream = stream

    myVideoElem.muted = true
    myVideoElem.srcObject = myMediaStream
  } catch (e) {
    console.log('[setupMyMedia] Error: ', e)
  }
}

export const onPartnerMediaStreamReceived = (callback) => {
  callbackTrackReceived = callback
}

export const onReceiveMessage = (callback) => {
  callbackMessageReceived = callback
}

export const createOrJoinRoom = (roomName) => {
  const socket = getSocket()
  socket.emit("create or join", roomName)
}

export const sendMessage = (message) => {
  console.log('sending message via data channel: ', message)
  dataChannel.send(message)
}
