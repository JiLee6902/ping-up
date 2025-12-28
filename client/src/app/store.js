import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice.js'
import userReducer from '../features/user/userSlice.js'
import connectionsReducer from '../features/connections/connectionsSlice.js'
import messagesReducer from '../features/messages/messagesSlice.js'

export const store = configureStore({
    reducer: {
       auth: authReducer,
       user: userReducer,
       connections: connectionsReducer,
       messages: messagesReducer
    }
})
