import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { io } from 'socket.io-client'
import api from '../api/axios'

const SocketContext = createContext(null)

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [typingUsers, setTypingUsers] = useState({}) // { oduserId: true }
  const socketRef = useRef(null)
  const typingTimeoutRef = useRef({})

  const { isAuthenticated } = useSelector((state) => state.auth)
  const currentUser = useSelector((state) => state.user.value)

  // Check if a user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId)
  }, [onlineUsers])

  // Fetch initial online status for specific users
  const fetchOnlineStatus = useCallback(async (userIds) => {
    try {
      const { data } = await api.post('/api/user/online-status', { userIds })
      if (data.success) {
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          Object.entries(data.data).forEach(([id, isOnline]) => {
            if (isOnline) newSet.add(id)
            else newSet.delete(id)
          })
          return newSet
        })
      }
    } catch (err) {
      console.error('Failed to fetch online status:', err)
    }
  }, [])

  // Check if a user is typing
  const isUserTyping = useCallback((userId) => {
    return !!typingUsers[userId]
  }, [typingUsers])

  // Emit typing event to a user
  const emitTyping = useCallback((toUserId) => {
    if (socketRef.current && toUserId) {
      socketRef.current.emit('typing', { toUserId })
    }
  }, [])

  // Emit stop typing event to a user
  const emitStopTyping = useCallback((toUserId) => {
    if (socketRef.current && toUserId) {
      socketRef.current.emit('stopTyping', { toUserId })
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      // Create single socket connection
      const newSocket = io(`${import.meta.env.VITE_BASEURL}/ws`, {
        query: { userId: currentUser.id },
        transports: ['websocket', 'polling'],
      })

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id)
        newSocket.emit('join', { userId: currentUser.id })
        setIsConnected(true)
      })

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })

      // Listen for online/offline events
      newSocket.on('userOnline', (data) => {
        setOnlineUsers(prev => new Set([...prev, data.userId]))
      })

      newSocket.on('userOffline', (data) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
      })

      // Listen for typing events
      newSocket.on('typing', (data) => {
        const { fromUserId } = data
        setTypingUsers(prev => ({ ...prev, [fromUserId]: true }))

        // Clear existing timeout for this user
        if (typingTimeoutRef.current[fromUserId]) {
          clearTimeout(typingTimeoutRef.current[fromUserId])
        }

        // Auto-clear typing after 3 seconds (in case stopTyping is missed)
        typingTimeoutRef.current[fromUserId] = setTimeout(() => {
          setTypingUsers(prev => {
            const newState = { ...prev }
            delete newState[fromUserId]
            return newState
          })
        }, 3000)
      })

      newSocket.on('stopTyping', (data) => {
        const { fromUserId } = data
        if (typingTimeoutRef.current[fromUserId]) {
          clearTimeout(typingTimeoutRef.current[fromUserId])
        }
        setTypingUsers(prev => {
          const newState = { ...prev }
          delete newState[fromUserId]
          return newState
        })
      })

      socketRef.current = newSocket
      setSocket(newSocket)

      return () => {
        newSocket.emit('leave', { userId: currentUser.id })
        newSocket.off('userOnline')
        newSocket.off('userOffline')
        newSocket.off('typing')
        newSocket.off('stopTyping')
        newSocket.disconnect()
        socketRef.current = null
        setSocket(null)
        setOnlineUsers(new Set())
        setTypingUsers({})
        // Clear all typing timeouts
        Object.values(typingTimeoutRef.current).forEach(clearTimeout)
        typingTimeoutRef.current = {}
      }
    }
  }, [isAuthenticated, currentUser?.id])

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      onlineUsers,
      isUserOnline,
      fetchOnlineStatus,
      typingUsers,
      isUserTyping,
      emitTyping,
      emitStopTyping,
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketContext
