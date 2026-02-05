import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'


const initialState = {
    messages: []
}

export const fetchMessages = createAsyncThunk('messages/fetchMessages', async ({token, userId}) => {
    const { data } = await api.post('/api/message/get', { userId }, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return data.success ? data : null
})

const messagesSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        setMessages: (state, action)=>{
            state.messages = action.payload;
        },
        addMessage: (state, action)=>{
            // Prevent duplicate messages
            const exists = state.messages.some(m => m.id === action.payload.id)
            if (!exists) {
                state.messages = [...state.messages, action.payload]
            }
        },
        resetMessages: (state)=>{
            state.messages = [];
        },
        markMessagesSeen: (state, action)=>{
            const { seenByUserId, seenAt } = action.payload
            state.messages = state.messages.map(m => {
                const toUserId = m.toUser?.id || m.toUserId || m.to_user_id
                if (toUserId === seenByUserId && !m.seen) {
                    return { ...m, seen: true, seenAt }
                }
                return m
            })
        },
        deleteMessage: (state, action) => {
            const { messageId } = action.payload
            state.messages = state.messages.filter(m => m.id !== messageId)
        },
        unsendMessage: (state, action) => {
            const { messageId, unsentAt } = action.payload
            state.messages = state.messages.map(m => {
                if (m.id === messageId) {
                    return { ...m, isUnsent: true, unsentAt, text: null, mediaUrl: null, transcription: null }
                }
                return m
            })
        },
    },
    extraReducers: (builder)=>{
        builder.addCase(fetchMessages.fulfilled, (state, action)=>{
            if(action.payload){
                state.messages = action.payload.data || action.payload.messages || []
            }
        })
    }
})

export const {setMessages, addMessage, resetMessages, markMessagesSeen, deleteMessage, unsendMessage} = messagesSlice.actions;

export default messagesSlice.reducer