import React, { useRef, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast, { Toaster } from 'react-hot-toast'

import Login from './pages/Login'
import Register from './pages/Register'
import Feed from './pages/Feed'
import Messages from './pages/Messages'
import ChatBox from './pages/ChatBox'
import GroupChats from './pages/GroupChats'
import GroupChatBox from './pages/GroupChatBox'
import Connections from './pages/Connections'
import Discover from './pages/Discover'
import Profile from './pages/Profile'
import CreatePost from './pages/CreatePost'
import Layout from './pages/Layout'
import Notifications from './pages/Notifications'
import Search from './pages/Search'
import AdvancedSearch from './pages/AdvancedSearch'
import Saved from './pages/Saved'
import BlockedUsers from './pages/BlockedUsers'
import MutedUsers from './pages/MutedUsers'
import Wallet from './pages/Wallet'
import TopUp from './pages/TopUp'
import PaymentResult from './pages/PaymentResult'
import Subscription from './pages/Subscription'
import ProtectedRoute from './components/ProtectedRoute'
import Notification from './components/Notification'
import VideoCall from './components/VideoCall'

import { fetchCurrentUser } from './features/auth/authSlice'
import { fetchUser } from './features/user/userSlice'
import { fetchConnections } from './features/connections/connectionsSlice'
import { addMessage } from './features/messages/messagesSlice'
import { useSocket } from './context/SocketContext'

const App = () => {
  const dispatch = useDispatch()
  const { pathname } = useLocation()
  const pathnameRef = useRef(pathname)
  const [incomingCall, setIncomingCall] = useState(null)

  const { socket } = useSocket()
  const { isAuthenticated, accessToken } = useSelector((state) => state.auth)
  const currentUser = useSelector((state) => state.user.value)

  // Fetch user data on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      dispatch(fetchCurrentUser())
      dispatch(fetchUser(accessToken))
      dispatch(fetchConnections(accessToken))
    }
  }, [isAuthenticated, accessToken, dispatch])

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  // Listen for socket events
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (data) => {
      const message = data.message
      // Only handle if NOT in the chat with this user (ChatBox handles its own)
      if (!pathnameRef.current.startsWith('/messages/')) {
        toast.custom(
          (t) => <Notification t={t} message={message} />,
          { position: 'bottom-right' }
        )
      }
    }

    const handleGroupMessage = (data) => {
      // Only handle if NOT in the group chat (GroupChatBox handles its own)
      if (!pathnameRef.current.startsWith('/groups/')) {
        toast.custom(
          (t) => (
            <div
              className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-xs w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
              <div className='flex-1 p-3'>
                <div className='flex items-start gap-2'>
                  {data.message?.sender?.profilePicture && (
                    <img src={data.message.sender.profilePicture} alt="" className='size-10 rounded-full object-cover' />
                  )}
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 dark:text-white'>
                      {data.message?.sender?.fullName?.split(' ')[0] || 'Someone'}
                    </p>
                    <p className='text-sm text-gray-500 dark:text-gray-400 truncate'>
                      {data.message?.content || 'Sent an image'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ),
          { position: 'bottom-right' }
        )
      }
    }

    const handleCallOffer = (data) => {
      // Only handle if NOT already in a chat (ChatBox handles its own)
      if (!pathnameRef.current.startsWith('/messages/')) {
        setIncomingCall({
          callType: data.callType,
          isIncoming: true,
          remoteUser: data.fromUser,
          offer: data.offer,
        })
      }
    }

    socket.on('newMessage', handleNewMessage)
    socket.on('groupMessage', handleGroupMessage)
    socket.on('callOffer', handleCallOffer)

    return () => {
      socket.off('newMessage', handleNewMessage)
      socket.off('groupMessage', handleGroupMessage)
      socket.off('callOffer', handleCallOffer)
    }
  }, [socket, dispatch])

  return (
    <>
      <Toaster />
      <Routes>
        {/* Public routes */}
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />

        {/* Public Feed - accessible without auth */}
        <Route path='/' element={<Layout requireAuth={false} />}>
          <Route index element={<Feed />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path='/' element={<Layout />}>
            <Route path='notifications' element={<Notifications />} />
            <Route path='messages' element={<Messages />} />
            <Route path='messages/:userId' element={<ChatBox />} />
            <Route path='groups' element={<GroupChats />} />
            <Route path='groups/:groupId' element={<GroupChatBox />} />
            <Route path='connections' element={<Connections />} />
            <Route path='discover' element={<Discover />} />
            <Route path='search' element={<Search />} />
            <Route path='advanced-search' element={<AdvancedSearch />} />
            <Route path='saved' element={<Saved />} />
            <Route path='blocked' element={<BlockedUsers />} />
            <Route path='muted' element={<MutedUsers />} />
            <Route path='wallet' element={<Wallet />} />
            <Route path='topup' element={<TopUp />} />
            <Route path='payment/result' element={<PaymentResult />} />
            <Route path='subscription' element={<Subscription />} />
            <Route path='profile' element={<Profile />} />
            <Route path='profile/:profileId' element={<Profile />} />
            <Route path='profile/username/:username' element={<Profile />} />
            <Route path='create-post' element={<CreatePost />} />
          </Route>
        </Route>
      </Routes>

      {/* Incoming Call Modal (only when not in chat) */}
      {incomingCall && socket && (
        <VideoCall
          socket={socket}
          currentUser={currentUser}
          remoteUser={incomingCall.remoteUser}
          callType={incomingCall.callType}
          isIncoming={incomingCall.isIncoming}
          offer={incomingCall.offer}
          onClose={() => setIncomingCall(null)}
        />
      )}
    </>
  )
}

export default App
