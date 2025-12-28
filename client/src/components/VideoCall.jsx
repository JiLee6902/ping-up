import React, { useEffect, useRef, useState } from 'react'
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X } from 'lucide-react'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

const VideoCall = ({ socket, currentUser, remoteUser, callType, isIncoming, offer, onClose }) => {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video')
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'calling')

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)

  const remoteUserId = remoteUser?.id || remoteUser?._id
  const remoteProfilePicture = remoteUser?.profilePicture || remoteUser?.profile_picture
  const remoteFullName = remoteUser?.fullName || remoteUser?.full_name

  useEffect(() => {
    if (isIncoming) {
      // Wait for user to accept
    } else {
      startCall()
    }

    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on('callAnswer', handleCallAnswer)
    socket.on('iceCandidate', handleRemoteIceCandidate)
    socket.on('callEnd', handleCallEnd)
    socket.on('callRejected', handleCallRejected)

    return () => {
      socket.off('callAnswer', handleCallAnswer)
      socket.off('iceCandidate', handleRemoteIceCandidate)
      socket.off('callEnd', handleCallEnd)
      socket.off('callRejected', handleCallRejected)
    }
  }, [socket])

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  const getMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true,
      })
      setLocalStream(stream)
      return stream
    } catch (error) {
      console.error('Error getting media stream:', error)
      return null
    }
  }

  const createPeerConnection = (stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)

    // Add local tracks to connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream)
    })

    // Handle incoming tracks
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0])
      setCallStatus('connected')
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('iceCandidate', {
          toUserId: remoteUserId,
          candidate: event.candidate,
        })
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        handleCallEnd()
      }
    }

    peerConnectionRef.current = pc
    return pc
  }

  const startCall = async () => {
    const stream = await getMediaStream()
    if (!stream) {
      onClose()
      return
    }

    const pc = createPeerConnection(stream)

    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      socket.emit('callOffer', {
        toUserId: remoteUserId,
        offer,
        callType,
        fromUser: {
          id: currentUser?.id,
          fullName: currentUser?.fullName,
          username: currentUser?.username,
          profilePicture: currentUser?.profilePicture,
        },
      })

      setCallStatus('calling')
    } catch (error) {
      console.error('Error starting call:', error)
      cleanup()
      onClose()
    }
  }

  const acceptCall = async () => {
    const stream = await getMediaStream()
    if (!stream) {
      rejectCall()
      return
    }

    const pc = createPeerConnection(stream)

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      socket.emit('callAnswer', {
        toUserId: remoteUserId,
        answer,
      })

      setCallStatus('connected')
    } catch (error) {
      console.error('Error accepting call:', error)
      cleanup()
      onClose()
    }
  }

  const rejectCall = () => {
    socket.emit('callRejected', { toUserId: remoteUserId })
    cleanup()
    onClose()
  }

  const handleCallAnswer = async (data) => {
    if (peerConnectionRef.current && data.answer) {
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
        setCallStatus('connected')
      } catch (error) {
        console.error('Error handling call answer:', error)
      }
    }
  }

  const handleRemoteIceCandidate = async (data) => {
    if (peerConnectionRef.current && data.candidate) {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
      } catch (error) {
        console.error('Error adding ICE candidate:', error)
      }
    }
  }

  const handleCallEnd = () => {
    cleanup()
    onClose()
  }

  const handleCallRejected = () => {
    setCallStatus('rejected')
    setTimeout(() => {
      cleanup()
      onClose()
    }, 2000)
  }

  const endCall = () => {
    socket.emit('callEnd', { toUserId: remoteUserId })
    cleanup()
    onClose()
  }

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    setLocalStream(null)
    setRemoteStream(null)
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }

  return (
    <div className='fixed inset-0 bg-gray-900 z-50 flex flex-col'>
      {/* Remote Video */}
      <div className='flex-1 relative'>
        {callStatus === 'connected' && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className='w-full h-full object-cover'
          />
        ) : (
          <div className='w-full h-full flex flex-col items-center justify-center text-white'>
            <img src={remoteProfilePicture} alt="" className='size-32 rounded-full object-cover mb-4' />
            <h2 className='text-2xl font-semibold mb-2'>{remoteFullName}</h2>
            <p className='text-gray-400'>
              {callStatus === 'calling' && 'Calling...'}
              {callStatus === 'incoming' && 'Incoming call...'}
              {callStatus === 'rejected' && 'Call rejected'}
            </p>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        {localStream && callType === 'video' && (
          <div className='absolute bottom-4 right-4 w-32 h-44 rounded-lg overflow-hidden shadow-lg border-2 border-white'>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className='w-full h-full object-cover'
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className='bg-gray-800 p-6'>
        <div className='flex items-center justify-center gap-6'>
          {callStatus === 'incoming' ? (
            <>
              <button
                onClick={rejectCall}
                className='p-4 bg-red-500 rounded-full hover:bg-red-600 transition cursor-pointer'
              >
                <PhoneOff className='w-6 h-6 text-white' />
              </button>
              <button
                onClick={acceptCall}
                className='p-4 bg-green-500 rounded-full hover:bg-green-600 transition cursor-pointer'
              >
                <Phone className='w-6 h-6 text-white' />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleAudio}
                className={`p-4 rounded-full transition cursor-pointer ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {isAudioEnabled ? <Mic className='w-6 h-6 text-white' /> : <MicOff className='w-6 h-6 text-white' />}
              </button>

              {callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition cursor-pointer ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  {isVideoEnabled ? <Video className='w-6 h-6 text-white' /> : <VideoOff className='w-6 h-6 text-white' />}
                </button>
              )}

              <button
                onClick={endCall}
                className='p-4 bg-red-500 rounded-full hover:bg-red-600 transition cursor-pointer'
              >
                <PhoneOff className='w-6 h-6 text-white' />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default VideoCall
