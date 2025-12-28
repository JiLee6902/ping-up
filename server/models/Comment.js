import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    user: { type: String, ref: 'User', required: true },
    content: { type: String, required: true, maxLength: 500 }
}, { timestamps: true })

const Comment = mongoose.model('Comment', commentSchema)

export default Comment;
