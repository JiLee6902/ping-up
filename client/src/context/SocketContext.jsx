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
  const socketRef = useRef(null)

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

      socketRef.current = newSocket
      setSocket(newSocket)

      return () => {
        newSocket.emit('leave', { userId: currentUser.id })
        newSocket.off('userOnline')
        newSocket.off('userOffline')
        newSocket.disconnect()
        socketRef.current = null
        setSocket(null)
        setOnlineUsers(new Set())
      }
    }
  }, [isAuthenticated, currentUser?.id])

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers, isUserOnline, fetchOnlineStatus }}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketContext
